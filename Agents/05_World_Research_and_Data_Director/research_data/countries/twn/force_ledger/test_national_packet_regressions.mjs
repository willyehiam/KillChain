#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const fixtures = fs.readdirSync(path.join(root, 'fixtures')).filter((name) => name.endsWith('.json')).sort().map((name) => JSON.parse(fs.readFileSync(path.join(root, 'fixtures', name), 'utf8')));
const readRows = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const writeRows = (file, rows) => fs.writeFileSync(file, `${rows.map(JSON.stringify).join('\n')}\n`);
const results = [];
const failures = [];

for (const fixture of fixtures) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'killweb-twn-force-regression-'));
  const packet = path.join(temporaryRoot, 'force_ledger');
  try {
    fs.cpSync(root, packet, {recursive:true});
    const mutateRows = (name, fn) => { const file = path.join(packet, name); const values = readRows(file); fn(values); writeRows(file, values); };
    if (fixture.mutation === 'remove_organization') mutateRows('organizations.ndjson', (values) => values.splice(values.findIndex((row) => row.organization_id === fixture.target_id), 1));
    else if (fixture.mutation === 'service_releases_mission') mutateRows('relationships.ndjson', (values) => { values.find((row) => row.relationship_id === fixture.target_id).authority_scope.may_release_for_mission = true; });
    else if (fixture.mutation === 'promote_inventory') {
      const quantity = {kind:'exact',value:fixture.value,unit:fixture.unit,counting_rule:'Improperly promoted estimate.'};
      mutateRows('inventory.ndjson', (values) => { const row = values.find((item) => item.inventory_record_id === fixture.target_id); row.quantity = quantity; row.accounting_state = 'active'; });
      mutateRows('deployments.ndjson', (values) => { values.find((row) => row.entity_id === fixture.target_id).quantity = quantity; });
      mutateRows('conservation.ndjson', (values) => { const row = values.find((item) => item.scope.scope_id === fixture.target_id); row.opening_inventory = quantity; row.closing_states[0].quantity = quantity; });
    } else if (fixture.mutation === 'assert_deployment') mutateRows('deployments.ndjson', (values) => { const row = values.find((item) => item.deployment_id === fixture.target_id); row.location.location_status = 'exact'; row.location.geometry = {type:'Point',coordinates:[121,24]}; row.availability_state = 'available'; });
    else if (fixture.mutation === 'anonymous_deployment') mutateRows('deployments.ndjson', (values) => { values.find((row) => row.deployment_id === fixture.target_id).commitment.release_constraints = ['Available to any operation.']; });
    else if (fixture.mutation === 'promote_plan') mutateRows('construction.ndjson', (values) => { const row = values.find((item) => item.construction_record_id === fixture.target_id); row.state = 'accepted'; row.quantity_accepted = {kind:'exact',value:fixture.value,unit:fixture.unit,counting_rule:'Improperly accepted plan.'}; });
    else if (fixture.mutation === 'post_bookmark_source') mutateRows('sources.ndjson', (values) => { values.find((row) => row.source_id === fixture.target_id).published_at = '2025-10-01'; });
    else if (fixture.mutation === 'corrupt_fighter_scope') mutateRows('contradictions.ndjson', (values) => { values.find((row) => row.contradiction_set_id === fixture.target_id).simulation_rule = 'Sum the scopes.'; });
    else if (fixture.mutation === 'accept_packet') { const file = path.join(packet, 'manifest.json'); const value = JSON.parse(fs.readFileSync(file, 'utf8')); value.acceptance.internally_consistent = true; fs.writeFileSync(file, `${JSON.stringify(value,null,2)}\n`); }
    else continue;
    const run = spawnSync(process.execPath, [path.join(packet, 'validate_national_packet.mjs'), packet], {encoding:'utf8'});
    const output = `${run.stdout}\n${run.stderr}`;
    const passed = run.status !== 0 && output.includes(fixture.expected_diagnostic);
    results.push({fixture_id:fixture.fixture_id,passed,expected_diagnostic:fixture.expected_diagnostic});
    if (!passed) failures.push(`${fixture.fixture_id}: expected ${fixture.expected_diagnostic}`);
  } finally { fs.rmSync(temporaryRoot, {recursive:true,force:true}); }
}
console.log(JSON.stringify({status:failures.length ? 'FAIL' : 'PASS',fixtures:results,failures},null,2));
if (failures.length) process.exitCode = 1;
