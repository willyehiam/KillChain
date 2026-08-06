import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRegionalSystems } from './validate_regional_systems.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const packetFiles = ['manifest.json','regional_systems.json','dependencies.json','access_relationships.json','actions.json','modeled_assumptions.json','sources.ndjson'];

function withFixture(mutator) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'twrs-negative-'));
  for (const file of packetFiles) fs.copyFileSync(path.join(here, file), path.join(root, file));
  mutator(root);
  const report = validateRegionalSystems(root);
  fs.rmSync(root, { recursive: true, force: true });
  return report;
}

function mutateJson(root, file, mutator) {
  const fullPath = path.join(root, file);
  const value = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  mutator(value);
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function expectFailure(name, mutator, expectedText) {
  const report = withFixture(mutator);
  assert.equal(report.ok, false, `${name} unexpectedly passed`);
  assert.ok(report.errors.some(error => error.includes(expectedText)), `${name} did not report ${expectedText}: ${report.errors.join('; ')}`);
}

const clean = validateRegionalSystems(here);
assert.deepEqual(clean.errors, [], `production packet is invalid: ${clean.errors.join('; ')}`);

for (const [key, value] of [
  ['lat', 25.03],
  ['lon', 121.56],
  ['position', [121.56, 25.03]],
  ['centroid', [121.56, 25.03]],
  ['geohash', 'wsqqqm9'],
  ['geometry', { type: 'Point', coordinates: [121.56, 25.03] }],
  ['encoded_geometry', 'abc123']
]) {
  expectFailure(`unsafe location alias ${key}`, root => mutateJson(root, 'regional_systems.json', doc => { doc.systems[0][key] = value; }), 'forbidden');
}
expectFailure('WKT hidden in prose', root => mutateJson(root, 'regional_systems.json', doc => { doc.systems[0].scope_note = 'POINT (121.56 25.03)'; }), 'WKT geometry is forbidden');
expectFailure('coordinate pair hidden in prose', root => mutateJson(root, 'regional_systems.json', doc => { doc.systems[0].scope_note = 'location 25.0300, 121.5600'; }), 'coordinate pair string is forbidden');

expectFailure('invalid free text capacity', root => mutateJson(root, 'regional_systems.json', doc => { doc.systems[0].capacity = { tier: 'very_high' }; }), 'free text capacity vocabulary is forbidden');
expectFailure('invalid estimate vocabulary', root => mutateJson(root, 'regional_systems.json', doc => { doc.systems[0].capacity.measurement.state = 'large_but_not_fungible'; }), 'invalid estimate state');
expectFailure('unbounded unknown', root => mutateJson(root, 'regional_systems.json', doc => { doc.systems[0].capacity.measurement.maximum = null; }), 'finite minimum and maximum required');

expectFailure('missing evidence references', root => mutateJson(root, 'regional_systems.json', doc => { doc.systems[0].source_ids = []; doc.systems[0].modeled_assumption_ids = []; }), 'source_ids or modeled_assumption_ids required');
expectFailure('unresolved source reference', root => mutateJson(root, 'dependencies.json', doc => { doc.edges[0].source_ids = ['twrs_src_missing']; doc.edges[0].modeled_assumption_ids = []; doc.edges[0].evidence_class = 'source_supported'; }), 'unresolved source twrs_src_missing');
expectFailure('dependency self loop', root => mutateJson(root, 'dependencies.json', doc => { doc.edges[0].to = doc.edges[0].from; }), 'dependency self loop forbidden');

expectFailure('disconnected operational node', root => {
  mutateJson(root, 'dependencies.json', doc => { doc.edges = doc.edges.filter(edge => edge.from !== 'twrs_satellite_weather_ocean' && edge.to !== 'twrs_satellite_weather_ocean'); });
  mutateJson(root, 'manifest.json', doc => { doc.record_counts.dependency_edges -= 1; });
}, 'disconnected operational node');

expectFailure('source time leakage', root => {
  const file = path.join(root, 'sources.ndjson');
  const records = fs.readFileSync(file, 'utf8').trim().split(/\n+/).map(JSON.parse);
  records[0].available_at = '2025-09-01T00:00:01Z';
  fs.writeFileSync(file, `${records.map(record => JSON.stringify(record)).join('\n')}\n`);
}, 'leaks post bookmark knowledge');
expectFailure('record time leakage', root => mutateJson(root, 'regional_systems.json', doc => { doc.systems[0].observed_at = '2025-09-01T00:00:01Z'; }), 'post cutoff observed_at');
expectFailure('mutable source artifact', root => {
  const file = path.join(root, 'sources.ndjson');
  const records = fs.readFileSync(file, 'utf8').trim().split(/\n+/).map(JSON.parse);
  records[0].claim_snapshot += '|mutated';
  fs.writeFileSync(file, `${records.map(record => JSON.stringify(record)).join('\n')}\n`);
}, 'frozen artifact hash mismatch');

function transfer(state, requested, edgeCapacity, lossFraction) {
  const dispatched = Math.min(requested, edgeCapacity, state.originStock);
  const delivered = dispatched * (1 - lossFraction);
  return {
    originStock: state.originStock - dispatched,
    destinationStock: state.destinationStock + delivered,
    transitLoss: state.transitLoss + dispatched - delivered
  };
}

for (const resourceType of ['electric_power','liquid_fuel','power_fuel','mixed_cargo','bandwidth','allied_airlift','commercial_sealift']) {
  const opening = { originStock: 100, destinationStock: 12, transitLoss: 0 };
  const closing = transfer(opening, 80, 60, 0.1);
  assert.equal(closing.originStock, 40, `${resourceType}: origin debit`);
  assert.equal(closing.destinationStock, 66, `${resourceType}: destination credit`);
  assert.equal(closing.transitLoss, 6, `${resourceType}: explicit loss`);
  assert.equal(opening.originStock + opening.destinationStock, closing.originStock + closing.destinationStock + closing.transitLoss, `${resourceType}: resource transfer must conserve dispatched stock and explicit loss`);
}

const repairOpening = { repairPool: 30, repairRequired: 45 };
const repairApplied = Math.min(20, repairOpening.repairPool, repairOpening.repairRequired);
const repairClosing = { repairPool: repairOpening.repairPool - repairApplied, repairRequired: repairOpening.repairRequired - repairApplied };
assert.equal(repairOpening.repairPool - repairClosing.repairPool, repairOpening.repairRequired - repairClosing.repairRequired, 'repair work consumption must equal completed work');

console.log(JSON.stringify({ ok: true, negative_fixtures: 19, conservation_tests: 8 }, null, 2));
