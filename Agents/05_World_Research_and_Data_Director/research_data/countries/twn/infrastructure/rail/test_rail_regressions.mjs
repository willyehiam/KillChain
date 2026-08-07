#!/usr/bin/env node

import crypto from 'node:crypto';
import {railStatistics, readCanonicalPacket, validateRailPacket} from './validate_rail.mjs';

const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');
const clone = (value) => structuredClone(value);
const canonical = readCanonicalPacket();

function refresh(packet) {
  packet.geoText = `${JSON.stringify(packet.geo)}\n`;
  packet.passengerText = `${packet.passenger.map((record) => JSON.stringify(record)).join('\n')}\n`;
  packet.freightText = `${packet.freight.map((record) => JSON.stringify(record)).join('\n')}\n`;
  const statistics = railStatistics(packet.geo, packet.passenger, packet.freight);
  packet.artifact.artifacts.station_nodes.feature_count = statistics.station_node_count;
  packet.artifact.artifacts.station_nodes.bounds = statistics.bounds;
  packet.artifact.artifacts.station_nodes.artifact_sha256 = hash(packet.geoText);
  packet.artifact.artifacts.station_passenger_activity.record_count = statistics.passenger_record_count;
  packet.artifact.artifacts.station_passenger_activity.artifact_sha256 = hash(packet.passengerText);
  packet.artifact.artifacts.line_freight_activity.record_count = statistics.freight_record_count;
  packet.artifact.artifacts.line_freight_activity.artifact_sha256 = hash(packet.freightText);
  return packet;
}

const cases = [
  {name: 'missing station node', expected: 'expected 244 unique rail station nodes', mutate(packet) { packet.geo.features.pop(); }},
  {name: 'duplicate station code', expected: 'duplicate station code', mutate(packet) { packet.geo.features[1].properties.station_code = packet.geo.features[0].properties.station_code; }},
  {name: 'military use inferred', expected: 'military use was asserted', mutate(packet) { packet.geo.features[0].properties.military_use_asserted = true; }},
  {name: 'target status inferred', expected: 'target status was inferred', mutate(packet) { packet.geo.features[0].properties.target_status = 'nominated'; }},
  {name: 'postbookmark node promoted', expected: 'postbookmark station became opening eligible', mutate(packet) { packet.geo.features[0].properties.opening_state_eligible = true; }},
  {name: 'hand moved coordinate', expected: 'coordinate differs from official source coordinate', mutate(packet) { packet.geo.features[0].geometry.coordinates[0] += 0.01; }},
  {name: 'missing passenger observation', expected: 'expected 239 unique station passenger records', mutate(packet) { packet.passenger.pop(); }},
  {name: 'broken passenger conservation', expected: 'passenger movements do not conserve', mutate(packet) { packet.passenger[0].passenger_movements += 1; }},
  {name: 'station freight invented', expected: 'station freight was invented', mutate(packet) { packet.passenger[0].originating_tonnes = 1; }},
  {name: 'passenger period rewritten', expected: 'period changed', mutate(packet) { packet.passenger[0].period = '2025'; }},
  {name: 'missing freight line', expected: 'expected 13 unique line freight records', mutate(packet) { packet.freight.pop(); }},
  {name: 'line total assigned to station', expected: 'line total was allocated to a station', mutate(packet) { packet.freight[0].station_id = packet.passenger[0].station_id; }},
  {name: 'broken freight conservation', expected: 'total tonnes do not conserve', mutate(packet) { packet.freight[0].total_handled_tonnes += 1; }},
  {name: 'unsupported rail geometry', expected: 'unsupported geometry was added', mutate(packet) { packet.freight[0].geometry_status = 'populated'; }},
  {name: 'station allocation fabricated', expected: 'station allocation guard changed', mutate(packet) { packet.freight[0].station_allocation_status = 'estimated'; }},
  {name: 'current directory admitted to bookmark', expected: 'postbookmark station directory became player available', mutate(packet) { packet.sources[0].available_to_player_at_bookmark = true; }},
  {name: 'current directory reclassified frozen', expected: 'station directory must remain classified as live mutable', mutate(packet) { packet.sources[0].mutability_class = 'frozen_historical_dataset'; }},
  {name: 'historical continuity inferred', expected: 'historical flow continuity was inferred', mutate(packet) { packet.manifest.temporal_contract.continuity_from_2021_to_bookmark_may_be_inferred = true; }},
  {name: 'self promoted verification', expected: 'may not self promote', mutate(packet) { packet.manifest.status = 'verified'; }},
  {name: 'geometry changed without artifact hash', expected: 'station_nodes artifact SHA256 does not match', preserveHash: true, mutate(packet) { packet.geo.features[0].properties.name = 'Invented Station'; }},
];

const failures = [];
for (const testCase of cases) {
  const packet = {
    geo: clone(canonical.geo),
    geoText: canonical.geoText,
    passenger: clone(canonical.passenger),
    passengerText: canonical.passengerText,
    freight: clone(canonical.freight),
    freightText: canonical.freightText,
    manifest: clone(canonical.manifest),
    artifact: clone(canonical.artifact),
    sources: clone(canonical.sources),
  };
  testCase.mutate(packet);
  if (testCase.preserveHash) packet.geoText = `${JSON.stringify(packet.geo)}\n`;
  else refresh(packet);
  const report = validateRailPacket({...packet, strictCanonical: false});
  if (report.status !== 'FAIL' || !report.errors.some((error) => error.includes(testCase.expected))) {
    failures.push({case: testCase.name, expected: testCase.expected, report});
  }
}

const canonicalReport = validateRailPacket({...canonical, strictCanonical: true});
if (canonicalReport.status !== 'PASS') failures.push({case: 'canonical packet', report: canonicalReport});

console.log(JSON.stringify({
  status: failures.length ? 'FAIL' : 'PASS',
  canonical_station_nodes: canonical.geo.features.length,
  canonical_passenger_records: canonical.passenger.length,
  canonical_freight_records: canonical.freight.length,
  regression_cases: cases.length,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
