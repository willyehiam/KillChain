import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateOpeningPosture } from '../../05_World_Research_and_Data_Director/research_data/theaters/fully_modeled/china_taiwan_south_china_sea/taiwan_opening_posture_2025/validate_opening_posture.mjs';

const auditRoot = path.dirname(fileURLToPath(import.meta.url));
const packetRoot = path.resolve(auditRoot, '../../05_World_Research_and_Data_Director/research_data/theaters/fully_modeled/china_taiwan_south_china_sea/taiwan_opening_posture_2025');
const files = ['manifest.json', 'sources.ndjson', 'claims.ndjson', 'posture_records.json', 'exercise_lineage.json', 'crisis_triggers.json', 'contradictions.json', 'force_reconciliation.json', 'future_reference_firewall.json'];
const forceIds = new Set(JSON.parse(fs.readFileSync(path.join(packetRoot, 'fixture_force_ids.json'), 'utf8')));

function fixture(mutator) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opening-posture-audit-'));
  for (const file of files) fs.copyFileSync(path.join(packetRoot, file), path.join(root, file));
  mutator(root);
  const report = validateOpeningPosture(root, { canonicalForceIds: forceIds });
  fs.rmSync(root, { recursive: true, force: true });
  return report;
}

function mutateJson(root, file, mutate) {
  const target = path.join(root, file);
  const value = JSON.parse(fs.readFileSync(target, 'utf8'));
  mutate(value);
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function mutateNdjson(root, file, mutate) {
  const target = path.join(root, file);
  const rows = fs.readFileSync(target, 'utf8').trim().split(/\n+/).map(JSON.parse);
  mutate(rows);
  fs.writeFileSync(target, `${rows.map(JSON.stringify).join('\n')}\n`);
}

function accepted(name, mutator) {
  const report = fixture(mutator);
  assert.equal(report.ok, true, `${name} was unexpectedly rejected: ${report.errors.join('; ')}`);
  return name;
}

const acceptedCorruptions = [];

acceptedCorruptions.push(accepted('future event hidden in source metadata', root => mutateNdjson(root, 'sources.ndjson', rows => {
  rows[0].title = 'Justice Mission 2025 retrospective';
  rows[0].claim_snapshot = `${rows[0].source_id}|${rows[0].title}|${rows[0].publisher}|${rows[0].relevant_locator}`;
  rows[0].artifact_sha256 = crypto.createHash('sha256').update(rows[0].claim_snapshot).digest('hex');
})));

acceptedCorruptions.push(accepted('postbookmark publication concealed by earlier available_at', root => mutateNdjson(root, 'sources.ndjson', rows => {
  rows[0].published_at = '2025-12-30';
  rows[0].last_updated_at = '2025-12-30T09:00:00Z';
})));

acceptedCorruptions.push(accepted('cross actor force substitution', root => mutateJson(root, 'posture_records.json', doc => {
  doc.records[0].force_refs = ['organization_usa_transportation_command'];
})));

acceptedCorruptions.push(accepted('readiness assertion concealed in prose', root => mutateJson(root, 'posture_records.json', doc => {
  doc.records.find(record => record.posture_id === 'op_posture_prc_multi_domain_pool').summary = 'All referenced forces are fully combat ready, forward deployed, and immediately available.';
})));

acceptedCorruptions.push(accepted('automatic allied permission concealed in prose', root => mutateJson(root, 'posture_records.json', doc => {
  doc.records.find(record => record.posture_id === 'op_posture_allied_access').summary = 'Japan and the Philippines automatically authorize every offensive United States mission.';
})));

acceptedCorruptions.push(accepted('deterministic trigger concealed in prose', root => mutateJson(root, 'crisis_triggers.json', doc => {
  doc.triggers[0].description = 'This trigger has already fired and forces automatic United States combat entry.';
})));

acceptedCorruptions.push(accepted('allowed and forbidden consumer overlap', root => mutateJson(root, 'manifest.json', doc => {
  doc.status_firewall.allowed_consumers.push('simulation_initialization');
})));

const clean = validateOpeningPosture(packetRoot, { canonicalForceIds: forceIds });
assert.equal(clean.ok, true, `production packet failed before contradiction audit: ${clean.errors.join('; ')}`);
const contradictions = JSON.parse(fs.readFileSync(path.join(packetRoot, 'contradictions.json'), 'utf8')).contradictions;
assert.ok(contradictions.some(item => item.positions.some(position => position.claim_ids.length === 0)), 'expected the accepted empty contradiction side');
acceptedCorruptions.push('empty contradiction side in production packet');

console.log(JSON.stringify({ ok: true, accepted_corruptions: acceptedCorruptions.length, cases: acceptedCorruptions }, null, 2));
