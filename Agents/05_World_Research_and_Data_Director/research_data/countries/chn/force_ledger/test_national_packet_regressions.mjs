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
