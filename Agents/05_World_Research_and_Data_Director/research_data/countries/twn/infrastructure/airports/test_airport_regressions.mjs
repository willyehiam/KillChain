#!/usr/bin/env node

import crypto from 'node:crypto';
import {airportStatistics, readCanonicalPacket, validateAirportPacket} from './validate_airports.mjs';

const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');
const clone = (value) => structuredClone(value);
const canonical = readCanonicalPacket();

function refresh(packet) {
  packet.geoText = `${JSON.stringify(packet.geo)}\n`;
  packet.activityText = `${packet.activity.map((record) => JSON.stringify(record)).join('\n')}\n`;
  const statistics = airportStatistics(packet.geo, packet.activity);
  packet.artifact.artifacts.airport_nodes.feature_count = statistics.feature_count;
  packet.artifact.artifacts.airport_nodes.bounds = statistics.bounds;
  packet.artifact.artifacts.airport_nodes.artifact_sha256 = hash(packet.geoText);
  packet.artifact.artifacts.monthly_activity.record_count = statistics.activity_record_count;
  packet.artifact.artifacts.monthly_activity.artifact_sha256 = hash(packet.activityText);
  return packet;
}

const cases = [
  {name:'missing airport', expected:'missing airport', mutate(packet){ packet.geo.features.pop(); }},
  {name:'duplicate airport identity', expected:'duplicate airport identity', mutate(packet){ packet.geo.features[1].id = packet.geo.features[0].id; }},
  {name:'military use inferred', expected:'military use was asserted', mutate(packet){ packet.geo.features[0].properties.military_use_asserted = true; }},
  {name:'military facility inferred', expected:'military facility status was inferred', mutate(packet){ packet.geo.features[0].properties.military_facility_status = 'confirmed'; }},
  {name:'target status inferred', expected:'target status was inferred', mutate(packet){ packet.geo.features[0].properties.target_status = 'nominated'; }},
  {name:'hand moved coordinate', expected:'converted coordinate changed', mutate(packet){ packet.geo.features[0].geometry.coordinates[0] += 0.05; }},
  {name:'missing activity month', expected:'expected 204 unique airport activity records', mutate(packet){ packet.activity.pop(); }},
  {name:'future activity month', expected:'period outside prebookmark baseline', mutate(packet){ packet.activity[0].period = '2025-09'; }},
  {name:'broken passenger conservation', expected:'passengers do not conserve', mutate(packet){ packet.activity[0].passengers.total += 1; }},
  {name:'unsupported passenger detail', expected:'unsupported passenger detail was invented', mutate(packet){ const record = packet.activity.find((row) => row.icao_code === 'RCYU'); record.passengers.transit = 1; }},
  {name:'baseline detached from observations', expected:'baseline movements do not match', mutate(packet){ packet.geo.features[0].properties.activity_baseline.aircraft_movements += 1; }},
  {name:'temporal source substitution', expected:'temporal provenance reference changed', mutate(packet){ packet.activity[0].source_ids = ['src_twn_caa_airport_activity_2025']; }},
  {name:'retrospective workbook relabeled contemporaneous', expected:'may not be labeled contemporaneously available', mutate(packet){ packet.sources[2].available_to_player_at_bookmark = true; }},
  {name:'self promoted verification', expected:'may not self promote', mutate(packet){ packet.manifest.status = 'verified'; }},
  {name:'geometry changed without artifact hash', expected:'airport artifact SHA256 does not match', preserveHash:true, mutate(packet){ packet.geo.features[0].properties.name = 'Invented Airport'; }},
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
  const report = validateAirportPacket({...packet, strictCanonical: false});
  if (report.status !== 'FAIL' || !report.errors.some((error) => error.includes(testCase.expected))) failures.push({case:testCase.name, expected:testCase.expected, report});
}

const canonicalReport = validateAirportPacket({...canonical, strictCanonical: true});
if (canonicalReport.status !== 'PASS') failures.push({case:'canonical packet', report:canonicalReport});

console.log(JSON.stringify({
  status: failures.length ? 'FAIL' : 'PASS',
  canonical_airport_nodes: canonical.geo.features.length,
  canonical_activity_records: canonical.activity.length,
  regression_cases: cases.length,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
