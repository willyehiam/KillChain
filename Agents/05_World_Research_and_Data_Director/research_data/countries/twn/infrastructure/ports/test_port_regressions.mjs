#!/usr/bin/env node

import crypto from 'node:crypto';
import {portStatistics, readCanonicalPacket, validatePortPacket} from './validate_ports.mjs';

const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');
const clone = (value) => structuredClone(value);
const canonical = readCanonicalPacket();

function refresh(packet) {
  packet.geoText = `${JSON.stringify(packet.geo)}\n`;
  packet.activityText = `${packet.activity.map((record) => JSON.stringify(record)).join('\n')}\n`;
  const statistics = portStatistics(packet.geo, packet.activity);
  packet.artifact.artifacts.port_nodes.feature_count = statistics.feature_count;
  packet.artifact.artifacts.port_nodes.bounds = statistics.bounds;
  packet.artifact.artifacts.port_nodes.artifact_sha256 = hash(packet.geoText);
  packet.artifact.artifacts.monthly_activity.record_count = statistics.activity_record_count;
  packet.artifact.artifacts.monthly_activity.artifact_sha256 = hash(packet.activityText);
  return packet;
}

const cases = [
  {
    name: 'missing port',
    expected: 'missing port',
    mutate(packet) { packet.geo.features.pop(); },
  },
  {
    name: 'duplicate port identity',
    expected: 'duplicate port identity',
    mutate(packet) { packet.geo.features[1].id = packet.geo.features[0].id; },
  },
  {
    name: 'civilian port promoted to military facility',
    expected: 'promoted to a military facility',
    mutate(packet) { packet.geo.features[0].properties.military_facility = true; },
  },
  {
    name: 'hand moved coordinate',
    expected: 'reprojected coordinate changed',
    mutate(packet) { packet.geo.features[0].geometry.coordinates[0] += 0.05; },
  },
  {
    name: 'postbookmark geometry update',
    expected: 'postbookmark source update admitted',
    mutate(packet) { packet.geo.features[0].properties.source_updated_yyyymm = '202509'; },
  },
  {
    name: 'missing activity month',
    expected: 'expected 84 unique activity records',
    mutate(packet) { packet.activity.pop(); },
  },
  {
    name: 'future activity month',
    expected: 'period outside prebookmark baseline',
    mutate(packet) { packet.activity[0].period = '2025-09'; },
  },
  {
    name: 'broken container conservation',
    expected: 'does not conserve inbound plus outbound',
    mutate(packet) { packet.activity[0].container_throughput_teu.total += 1; },
  },
  {
    name: 'baseline detached from observations',
    expected: 'baseline container totals do not match',
    mutate(packet) { packet.geo.features[0].properties.activity_baseline.container_throughput_teu.total += 1; },
  },
  {
    name: 'source substitution',
    expected: 'provenance references changed',
    mutate(packet) { packet.activity[0].source_ids = ['src_invented']; },
  },
  {
    name: 'retrospective snapshot relabeled contemporaneous',
    expected: 'may not be labeled contemporaneously available',
    mutate(packet) { packet.sources[0].available_to_player_at_bookmark = true; },
  },
  {
    name: 'self promoted verification',
    expected: 'may not self promote',
    mutate(packet) { packet.manifest.status = 'verified'; },
  },
  {
    name: 'geometry changed without artifact hash',
    expected: 'port artifact SHA256 does not match',
    preserveHash: true,
    mutate(packet) { packet.geo.features[0].properties.name = 'Invented Port Name'; },
  },
];

const failures = [];
for (const testCase of cases) {
  const packet = {
    geo: clone(canonical.geo),
    geoText: canonical.geoText,
    activity: clone(canonical.activity),
    activityText: canonical.activityText,
    manifest: clone(canonical.manifest),
    artifact: clone(canonical.artifact),
    sources: clone(canonical.sources),
  };
  testCase.mutate(packet);
  if (testCase.preserveHash) packet.geoText = `${JSON.stringify(packet.geo)}\n`;
  else refresh(packet);
  const report = validatePortPacket({...packet, strictCanonical: false});
  if (report.status !== 'FAIL' || !report.errors.some((error) => error.includes(testCase.expected))) {
    failures.push({case: testCase.name, expected: testCase.expected, report});
  }
}

const canonicalReport = validatePortPacket({...canonical, strictCanonical: true});
if (canonicalReport.status !== 'PASS') failures.push({case: 'canonical packet', report: canonicalReport});

console.log(JSON.stringify({
  status: failures.length ? 'FAIL' : 'PASS',
  canonical_port_nodes: canonical.geo.features.length,
  canonical_activity_records: canonical.activity.length,
  regression_cases: cases.length,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
