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
    else if (fixture.mutation === 'fabricate_live_interval') mutateRows('sources.ndjson', (values) => { const row = values.find((item) => item.source_id === fixture.target_id); row.observed_from = '2025-08-31'; row.observed_to = '2025-09-01'; });
    else if (fixture.mutation === 'remove_retrieval_metadata') mutateRows('sources.ndjson', (values) => { delete values.find((row) => row.source_id === fixture.target_id).retrieved_at; });
    else if (fixture.mutation === 'reclassify_mutable_source') mutateRows('sources.ndjson', (values) => { const row = values.find((item) => item.source_id === fixture.target_id); row.mutability_class = 'immutable_artifact'; row.bookmark_evidence_status = 'prebookmark_available'; row.available_to_player_at_bookmark = true; });
    else if (fixture.mutation === 'claim_unit_mismatch') mutateRows('claims.ndjson', (values) => { values.find((row) => row.claim_id === fixture.target_id).unit = fixture.unit; });
    else if (fixture.mutation === 'claim_subject_mismatch') mutateRows('claims.ndjson', (values) => { values.find((row) => row.claim_id === fixture.target_id).subject_id = fixture.subject_id; });
    else if (fixture.mutation === 'claim_value_divergence') mutateRows('claims.ndjson', (values) => { values.find((row) => row.claim_id === fixture.target_id).value = fixture.value; });
    else if (fixture.mutation === 'flow_to_stock') mutateRows('claims.ndjson', (values) => { const row = values.find((item) => item.claim_id === fixture.target_id); row.subject_id = fixture.subject_id; row.subject_kind = 'inventory_pool'; });
    else if (fixture.mutation === 'duplicate_deployment') mutateRows('deployments.ndjson', (values) => { const row = structuredClone(values.find((item) => item.deployment_id === fixture.target_id)); row.deployment_id = `${row.deployment_id}_duplicate`; values.push(row); });
    else if (fixture.mutation === 'duplicate_maintenance') mutateRows('maintenance.ndjson', (values) => { const row = structuredClone(values.find((item) => item.maintenance_record_id === fixture.target_id)); row.maintenance_record_id = `${row.maintenance_record_id}_duplicate`; values.push(row); });
    else if (fixture.mutation === 'duplicate_conservation') mutateRows('conservation.ndjson', (values) => { const row = structuredClone(values.find((item) => item.conservation_record_id === fixture.target_id)); row.conservation_record_id = `${row.conservation_record_id}_duplicate`; values.push(row); });
    else if (fixture.mutation === 'duplicate_record_id') mutateRows(fixture.dataset, (values) => { values.push(structuredClone(values.find((item) => item[fixture.id_field] === fixture.target_id))); });
    else if (fixture.mutation === 'detach_taxonomy_child') mutateRows('equipment_types.ndjson', (values) => { values.find((row) => row.equipment_type_id === fixture.target_id).parent_equipment_type_id = null; });
    else if (fixture.mutation === 'remove_aggregation_sibling') mutateRows('aggregation_sets.ndjson', (values) => { const row = values.find((item) => item.aggregation_set_id === fixture.target_id); row.child_inventory_record_ids = row.child_inventory_record_ids.filter((id) => id !== fixture.child_id); });
    else if (fixture.mutation === 'omit_residual_state') mutateRows('aggregation_sets.ndjson', (values) => { delete values.find((row) => row.aggregation_set_id === fixture.target_id).residual_state; });
    else if (fixture.mutation === 'hidden_coordinates') mutateRows(fixture.dataset, (values) => { values.find((row) => row[fixture.id_field] === fixture.target_id).coordinates = [121.5, 24.1]; });
    else if (fixture.mutation === 'maintenance_unit_mismatch') mutateRows('maintenance.ndjson', (values) => { values.find((row) => row.maintenance_record_id === fixture.target_id).quantity.unit = fixture.unit; });
    else if (fixture.mutation === 'fabricate_manifest_summary') { const file = path.join(packet, 'manifest.json'); const value = JSON.parse(fs.readFileSync(file, 'utf8')); value.reconciliation[fixture.field] = fixture.value; fs.writeFileSync(file, `${JSON.stringify(value,null,2)}\n`); }
    else if (fixture.mutation === 'admin_to_opcon_release') mutateRows('relationships.ndjson', (values) => { const row = values.find((item) => item.relationship_id === fixture.target_id); row.relationship_type = 'operational_control'; row.authority_scope.may_release_for_mission = true; });
    else if (fixture.mutation === 'authority_label_swap') mutateRows('authority_claims.ndjson', (values) => { values.find((row) => row.relationship_id === fixture.target_id).authority_class = fixture.authority_class; });
    else if (fixture.mutation === 'unconditional_reserve_employment') mutateRows('relationships.ndjson', (values) => { const row = values.find((item) => item.relationship_id === fixture.target_id); row.activation_state = 'active'; row.authority_scope.may_release_for_mission = true; });
    else if (fixture.mutation === 'negated_magic_phrase_anonymous_capacity') mutateRows('deployments.ndjson', (values) => { const row = values.find((item) => item.deployment_id === fixture.target_id); row.commitment.release_constraints = ['This is not a conserved child allocation.']; row.accounting_allocation.executable_child_allocation_id = 'allocation_anonymous'; row.accounting_allocation.release_gate = 'open'; });
    else if (fixture.mutation === 'expire_child_without_summary') mutateRows(fixture.dataset, (values) => { values.find((row) => row[fixture.id_field] === fixture.target_id).temporal_validity.valid_to = '2025-08-31'; });
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
