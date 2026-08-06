#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const fixtures = fs.readdirSync(path.join(root, 'fixtures')).filter((name) => name.endsWith('.json')).sort().map((name) => JSON.parse(fs.readFileSync(path.join(root, 'fixtures', name), 'utf8')));
const readRows = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const writeRows = (file, values) => fs.writeFileSync(file, `${values.map((row) => JSON.stringify(row)).join('\n')}\n`);
const results = [];
const failures = [];

for (const fixture of fixtures) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'killweb-chn-force-regression-'));
  const packet = path.join(temporaryRoot, 'force_ledger');
  try {
    fs.cpSync(root, packet, {recursive: true});
    if (fixture.mutation === 'remove_organization') {
      const file = path.join(packet, 'organizations.ndjson');
      writeRows(file, readRows(file).filter((row) => row.organization_id !== fixture.target_id));
    } else if (fixture.mutation === 'misclassify_strategic_arm') {
      const file = path.join(packet, 'organizations.ndjson');
      const values = readRows(file); const row = values.find((item) => item.organization_id === fixture.target_id); row.organization_kind = 'service_command'; row.echelon = 'service_command';
      writeRows(file, values);
    } else if (fixture.mutation === 'activate_relationship') {
      const file = path.join(packet, 'relationships.ndjson');
      const values = readRows(file); values.find((row) => row.relationship_id === fixture.target_id).activation_state = 'active';
      writeRows(file, values);
    } else if (fixture.mutation === 'service_releases_component') {
      const file = path.join(packet, 'relationships.ndjson');
      const values = readRows(file); values.find((row) => row.relationship_id === fixture.target_id).authority_scope.may_release_for_mission = true;
      writeRows(file, values);
    } else if (fixture.mutation === 'anonymous_deployment') {
      const file = path.join(packet, 'deployments.ndjson');
      const values = readRows(file); values.find((row) => row.deployment_id === fixture.target_id).commitment.release_constraints = ['Available to any operation without allocation.'];
      writeRows(file, values);
    } else if (fixture.mutation === 'promote_projection') {
      const inventoryFile = path.join(packet, 'inventory.ndjson');
      const deploymentsFile = path.join(packet, 'deployments.ndjson');
      const conservationFile = path.join(packet, 'conservation.ndjson');
      const quantity = {kind:'exact',value:395,unit:'platform',counting_rule:'Improperly promoted projection.'};
      const inventories = readRows(inventoryFile); const pool = inventories.find((row) => row.inventory_record_id === fixture.target_id); pool.quantity = quantity; writeRows(inventoryFile, inventories);
      const deployments = readRows(deploymentsFile); deployments.find((row) => row.entity_id === fixture.target_id).quantity = quantity; writeRows(deploymentsFile, deployments);
      const conservations = readRows(conservationFile); const conservation = conservations.find((row) => row.scope.scope_id === fixture.target_id); conservation.opening_inventory = quantity; conservation.closing_states[0].quantity = quantity; writeRows(conservationFile, conservations);
    } else if (fixture.mutation === 'corrupt_claim_value') {
      const file = path.join(packet, 'claims.ndjson');
      const values = readRows(file); values.find((row) => row.claim_id === fixture.target_id).value[fixture.field] = fixture.value;
      writeRows(file, values);
    } else if (fixture.mutation === 'magical_civilian_conversion') {
      const inventoryFile = path.join(packet, 'inventory.ndjson');
      const deploymentsFile = path.join(packet, 'deployments.ndjson');
      const conservationFile = path.join(packet, 'conservation.ndjson');
      const quantity = {kind:'exact',value:1000,unit:'capacity_unit',counting_rule:'Improper free conversion capacity.'};
      const inventories = readRows(inventoryFile); inventories.find((row) => row.inventory_record_id === fixture.target_id).quantity = quantity; writeRows(inventoryFile, inventories);
      const deployments = readRows(deploymentsFile); const deployment = deployments.find((row) => row.entity_id === fixture.target_id); deployment.quantity = quantity; deployment.commitment.release_constraints = ['Instantly available.']; writeRows(deploymentsFile, deployments);
      const conservations = readRows(conservationFile); const conservation = conservations.find((row) => row.scope.scope_id === fixture.target_id); conservation.opening_inventory = quantity; conservation.closing_states[0].quantity = quantity; writeRows(conservationFile, conservations);
    } else continue;
    const run = spawnSync(process.execPath, [path.join(packet, 'validate_national_packet.mjs'), packet], {encoding: 'utf8'});
    const output = `${run.stdout}\n${run.stderr}`;
    const passed = run.status !== 0 && output.includes(fixture.expected_diagnostic);
    results.push({fixture_id: fixture.fixture_id, passed});
    if (!passed) failures.push(`${fixture.fixture_id}: expected ${fixture.expected_diagnostic}`);
  } finally {
    fs.rmSync(temporaryRoot, {recursive: true, force: true});
  }
}
console.log(JSON.stringify({status: failures.length ? 'FAIL' : 'PASS', fixtures: results, failures}, null, 2));
if (failures.length) process.exitCode = 1;
