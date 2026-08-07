#!/usr/bin/env node

import crypto from 'node:crypto';
import {geometryStatistics, readCanonicalPacket, validateGeographyPacket} from './validate_geography.mjs';

const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');
const clone = (value) => structuredClone(value);
const canonical = readCanonicalPacket();

function refresh(packet) {
  packet.geoText = `${JSON.stringify(packet.geo)}\n`;
  const stats = geometryStatistics(packet.geo);
  Object.assign(packet.artifact, stats, {artifact_sha256: hash(packet.geoText)});
  return packet;
}

const cases = [
  {
    name: 'missing county',
    expected: 'missing county',
    mutate(packet) { packet.geo.features.pop(); },
  },
  {
    name: 'duplicate county identity',
    expected: 'duplicate county code',
    mutate(packet) { packet.geo.features[1].properties.county_code = packet.geo.features[0].properties.county_code; },
  },
  {
    name: 'county relabeling',
    expected: 'English name changed',
    mutate(packet) { packet.geo.features[0].properties.county_english_name = 'Invented County'; },
  },
  {
    name: 'invalid coordinate',
    expected: 'latitude is outside',
    mutate(packet) {
      const geometry = packet.geo.features[0].geometry;
      const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
      ring[1][1] = 91;
    },
  },
  {
    name: 'open polygon ring',
    expected: 'ring is not closed',
    mutate(packet) {
      const geometry = packet.geo.features[0].geometry;
      const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
      ring[ring.length - 1] = [ring[0][0] + 0.01, ring[0][1]];
    },
  },
  {
    name: 'source substitution',
    expected: 'provenance references changed',
    mutate(packet) { packet.geo.features[0].properties.source_ids = ['src_invented']; },
  },
  {
    name: 'postbookmark mirror',
    expected: 'mirror source is postbookmark',
    mutate(packet) { packet.sources[1].published_at = '2025-10-01'; },
  },
  {
    name: 'self promoted verification',
    expected: 'may not self promote',
    mutate(packet) { packet.manifest.status = 'verified'; },
  },
  {
    name: 'geometry changed without artifact hash',
    expected: 'artifact SHA256 does not match',
    preserveHash: true,
    mutate(packet) { packet.geo.features[0].properties.name = 'Changed Without Rehash'; },
  },
];

const failures = [];
for (const testCase of cases) {
  const packet = {
    geo: clone(canonical.geo),
    geoText: canonical.geoText,
    manifest: clone(canonical.manifest),
    artifact: clone(canonical.artifact),
    sources: clone(canonical.sources),
  };
  testCase.mutate(packet);
  if (!testCase.preserveHash) refresh(packet);
  else packet.geoText = `${JSON.stringify(packet.geo)}\n`;
  const report = validateGeographyPacket({...packet, strictCanonical: false});
  if (report.status !== 'FAIL' || !report.errors.some((error) => error.includes(testCase.expected))) {
    failures.push({case: testCase.name, expected: testCase.expected, report});
  }
}

const canonicalReport = validateGeographyPacket({...canonical, strictCanonical: true});
if (canonicalReport.status !== 'PASS') failures.push({case: 'canonical packet', report: canonicalReport});

console.log(JSON.stringify({
  status: failures.length ? 'FAIL' : 'PASS',
  canonical_feature_count: canonical.geo.features.length,
  regression_cases: cases.length,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
