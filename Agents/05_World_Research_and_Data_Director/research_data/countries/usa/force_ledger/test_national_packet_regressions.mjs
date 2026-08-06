#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(root, 'fixtures');
const fixtures = fs.readdirSync(fixtureRoot).filter((name) => name.endsWith('.json')).sort().map((name) => JSON.parse(fs.readFileSync(path.join(fixtureRoot, name), 'utf8')));
const results = [];
const failures = [];
const readRows = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((line) => line.trim()).map(JSON.parse);
const writeRows = (file, rows) => fs.writeFileSync(file, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);

for (const fixture of fixtures) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'killweb-usa-force-regression-'));
  const packet = path.join(temporaryRoot, 'force_ledger');
  try {
    fs.cpSync(root, packet, { recursive: true });
    if (fixture.mutation === 'remove_organization') {
      const file = path.join(packet, 'organizations.ndjson');
      writeRows(file, readRows(file).filter((row) => row.organization_id !== fixture.target_id));
    } else if (fixture.mutation === 'add_ngb_operational_control') {
      const file = path.join(packet, 'relationships.ndjson');
      const rows = readRows(file);
      rows.push({ ...rows[0], relationship_id: 'fixture_ngb_operational_control', source_organization_id: 'organization_usa_national_guard_bureau', target_organization_id: fixture.target_id, relationship_type: 'operational_control' });
      writeRows(file, rows);
    } else if (fixture.mutation === 'orphan_deployment') {
      const file = path.join(packet, 'deployments.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.deployment_id === fixture.target_id).entity_id = 'inventory_usa_anonymous_capacity';
      writeRows(file, rows);
    } else if (fixture.mutation === 'set_claim_value') {
      const file = path.join(packet, 'claims.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.claim_id === fixture.target_id).value = fixture.value;
      writeRows(file, rows);
    } else if (fixture.mutation === 'set_assigned_exact') {
      const file = path.join(packet, 'organizations.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.organization_id === fixture.target_id).personnel.assigned = { kind:'exact', value:fixture.value, unit:'person', counting_rule:'adversarial fabrication' };
      writeRows(file, rows);
    } else if (fixture.mutation === 'postbookmark_source') {
      const file = path.join(packet, 'sources.ndjson');
      const rows = readRows(file);
      const source = rows.find((row) => row.source_id === fixture.target_id);
      source.published_at = '2025-10-01'; source.bookmark_evidence_status = 'not_applicable'; source.available_to_player_at_bookmark = false;
      writeRows(file, rows);
    } else if (fixture.mutation === 'set_maintenance_exact') {
      const file = path.join(packet, 'maintenance.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.maintenance_record_id === fixture.target_id).quantity = { kind:'exact', value:fixture.value, unit:'platform', counting_rule:'adversarial fabrication' };
      writeRows(file, rows);
    } else if (fixture.mutation === 'complete_construction_without_claim') {
      const file = path.join(packet, 'construction.ndjson');
      const rows = readRows(file);
      const row = rows.find((item) => item.construction_record_id === fixture.target_id);
      row.state = 'completed';
      row.quantity_delivered = { kind:'exact', value:fixture.value, unit:'platform', counting_rule:'adversarial fabrication' };
      row.quantity_accepted = { kind:'exact', value:fixture.value, unit:'platform', counting_rule:'adversarial fabrication' };
      writeRows(file, rows);
    } else if (fixture.mutation === 'promote_training_plan') {
      const file = path.join(packet, 'training_plans.json');
      const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
      const row = rows.find((item) => item.plan_id === fixture.target_id);
      row.executable = true; row.available = { kind:'exact', value:22, unit:'capacity_unit', counting_rule:'adversarial fabrication' };
      fs.writeFileSync(file, `${JSON.stringify(rows,null,2)}\n`);
    } else if (fixture.mutation === 'remove_parent_link') {
      const file = path.join(packet, 'inventory.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.inventory_record_id === fixture.target_id).counting_scope.parent_inventory_record_id = null;
      writeRows(file, rows);
    } else if (fixture.mutation === 'replace_activation_provenance') {
      const file = path.join(packet, 'relationships.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.relationship_id === fixture.target_id).provenance.source_ids = ['src_force_usa_title10_section10101_2023'];
      writeRows(file, rows);
    } else if (fixture.mutation === 'invent_navy_range') {
      const file = path.join(packet, 'inventory.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.inventory_record_id === fixture.target_id).quantity = { kind:'range', minimum:287, maximum:296, unit:'platform', counting_rule:'request plus prior actual pseudo-bound' };
      writeRows(file, rows);
    } else if (fixture.mutation === 'restore_mutable_interval') {
      const file = path.join(packet, 'sources.ndjson');
      const rows = readRows(file);
      const row = rows.find((item) => item.source_id === fixture.target_id);
      row.observed_from = '2025-01-01'; row.observed_to = '2025-09-01'; row.available_to_player_at_bookmark = true;
      writeRows(file, rows);
    } else if (fixture.mutation === 'expire_child_with_zero_summary') {
      const file = path.join(packet, 'inventory.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.inventory_record_id === fixture.target_id).temporal_validity.review_after = '2025-10-01';
      writeRows(file, rows);
    } else if (fixture.mutation === 'activate_guard_state_edge') {
      const file = path.join(packet, 'relationships.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.relationship_id === fixture.target_id).activation_state = 'active';
      writeRows(file, rows);
    } else if (fixture.mutation === 'promote_generic_range') {
      const file = path.join(packet, 'inventory.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.inventory_record_id === fixture.target_id).quantity = { kind:'range', minimum:fixture.minimum, maximum:fixture.maximum, unit:fixture.unit, counting_rule:'adversarial unsupported opening range' };
      writeRows(file, rows);
    } else if (fixture.mutation === 'set_inventory_component') {
      const file = path.join(packet, 'inventory.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.inventory_record_id === fixture.target_id).component = fixture.component;
      writeRows(file, rows);
    } else if (fixture.mutation === 'duplicate_guard_forbidden_pairs') {
      const file = path.join(packet, 'guard_status_state_machine.json');
      const stateMachine = JSON.parse(fs.readFileSync(file, 'utf8'));
      stateMachine.forbidden_combinations = [['state_active_duty','title_32'],['state_active_duty','title_32'],['title_32','title_10']];
      fs.writeFileSync(file, `${JSON.stringify(stateMachine,null,2)}\n`);
    } else if (fixture.mutation === 'promote_plan_to_inventory') {
      const file = path.join(packet, 'inventory.ndjson');
      const rows = readRows(file);
      const row = rows.find((item) => item.inventory_record_id === fixture.target_id);
      row.provenance.claim_ids = [fixture.claim_id];
      row.quantity = { kind:'exact', value:fixture.value, unit:fixture.unit, counting_rule:'adversarial plan-to-opening promotion' };
      writeRows(file, rows);
    } else if (fixture.mutation === 'reclassify_known_live_source') {
      const file = path.join(packet, 'sources.ndjson');
      const rows = readRows(file);
      const row = rows.find((item) => item.source_id === fixture.target_id);
      row.mutability_class = 'static';
      row.bookmark_evidence_status = 'prebookmark_available';
      row.available_to_player_at_bookmark = true;
      row.published_at = '2025-01-01';
      delete row.retrieved_at;
      delete row.temporal_proof;
      writeRows(file, rows);
    } else if (fixture.mutation === 'expire_conservation_zero_summary') {
      const file = path.join(packet, 'validator_contracts.json');
      const contracts = JSON.parse(fs.readFileSync(file, 'utf8'));
      contracts.temporal_governance.conservation_records.find((item) => item.conservation_record_id === fixture.target_id).review_after = '2025-10-01';
      fs.writeFileSync(file, `${JSON.stringify(contracts,null,2)}\n`);
    } else if (fixture.mutation === 'historical_prose_postbookmark') {
      const sourcesFile = path.join(packet, 'sources.ndjson');
      const sources = readRows(sourcesFile);
      sources.find((row) => row.source_id === fixture.source_id).published_at = '2025-10-01';
      writeRows(sourcesFile, sources);
      const claimsFile = path.join(packet, 'claims.ndjson');
      const claims = readRows(claimsFile);
      claims.find((row) => row.claim_id === fixture.target_id).simulation_use = 'Historical reference only; adversarial prose must not alter structured bookmark status.';
      writeRows(claimsFile, claims);
    } else throw new Error(`Unknown mutation ${fixture.mutation}`);
    const result = spawnSync(process.execPath, [path.join(packet, 'validate_national_packet.mjs'), packet], { encoding: 'utf8' });
    const output = `${result.stdout}\n${result.stderr}`;
    const passed = result.status !== 0 && output.includes(fixture.expected_diagnostic);
    results.push({ fixture_id: fixture.fixture_id, passed, expected_diagnostic: fixture.expected_diagnostic });
    if (!passed) failures.push(`${fixture.fixture_id}: expected ${fixture.expected_diagnostic}`);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

console.log(JSON.stringify({ status: failures.length ? 'FAIL' : 'PASS', fixtures: results, failures }, null, 2));
if (failures.length) process.exitCode = 1;
