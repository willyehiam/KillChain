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
    } else if (fixture.mutation === 'increment_aircraft_category') {
      const file = path.join(packet, 'inventory.ndjson');
      const rows = readRows(file);
      rows.find((row) => row.inventory_record_id === fixture.target_id).quantity.value += 1;
      writeRows(file, rows);
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
