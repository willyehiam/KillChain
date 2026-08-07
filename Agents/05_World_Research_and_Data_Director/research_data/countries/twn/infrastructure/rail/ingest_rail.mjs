#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const stationSourcePath = path.resolve(process.argv[2] ?? '/tmp/twn_tra_stations.json');
const flowSourcePath = path.resolve(process.argv[3] ?? '/tmp/twn_tra_station_flows.json');
const stationOutputPath = path.resolve(process.argv[4] ?? path.join(directory, 'civilian_rail_stations.geojson'));
const passengerOutputPath = path.resolve(process.argv[5] ?? path.join(directory, 'rail_station_passenger_activity_2021.ndjson'));
const freightOutputPath = path.resolve(process.argv[6] ?? path.join(directory, 'rail_line_freight_activity_2021.ndjson'));
const artifactOutputPath = path.resolve(process.argv[7] ?? path.join(directory, 'artifact_record.json'));

const bookmarkTime = '2025-09-01T00:00:00Z';
const snapshotDate = '2026-08-07';
const stationSourceId = 'src_twn_tra_station_directory_retrieved_2026_08_07';
const flowSourceId = 'src_twn_tra_station_and_line_flows_2021';
const expectedRawHashes = {
  station_directory: 'ff0f463395d6c690fd8f9f1ea42be84dce7fcf0cb2cc5b1bc70ed489cef183ee',
  station_and_line_flows_2021: 'ed6055b22e02658ff789e9c41c8bd47579844ca0531e665a00b4b61ec3ea7218',
};
const lineNames = new Map([
  ['縱貫線', {slug: 'western_trunk', name: 'Western Trunk Line'}],
  ['內灣線', {slug: 'neiwan', name: 'Neiwan Line'}],
  ['六家線', {slug: 'liujia', name: 'Liujia Line'}],
  ['臺中線', {slug: 'taichung', name: 'Taichung Line'}],
  ['集集線', {slug: 'jiji', name: 'Jiji Line'}],
  ['沙崙線', {slug: 'shalun', name: 'Shalun Line'}],
  ['屏東線', {slug: 'pingtung', name: 'Pingtung Line'}],
  ['南迴線', {slug: 'south_link', name: 'South Link Line'}],
  ['臺東線', {slug: 'taitung', name: 'Taitung Line'}],
  ['北迴線', {slug: 'north_link', name: 'North Link Line'}],
  ['宜蘭線', {slug: 'yilan', name: 'Yilan Line'}],
  ['平溪線', {slug: 'pingxi', name: 'Pingxi Line'}],
  ['深澳線', {slug: 'shenao', name: 'Shenao Line'}],
]);

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readAndVerify(file, expectedHash, label) {
  const bytes = fs.readFileSync(file);
  const actualHash = sha256(bytes);
  assert(actualHash === expectedHash, `${label} SHA256 changed: ${actualHash}`);
  return bytes;
}

function nonnegativeInteger(value, label) {
  assert(Number.isInteger(value) && value >= 0, `${label} must be a nonnegative integer`);
  return value;
}

function parseGps(value, label) {
  const parts = String(value).trim().split(/\s+/).map(Number);
  assert(parts.length === 2 && parts.every(Number.isFinite), `${label}: invalid GPS value ${value}`);
  const [latitude, longitude] = parts;
  assert(latitude >= 20 && latitude <= 27, `${label}: latitude outside Taiwan envelope`);
  assert(longitude >= 117 && longitude <= 123, `${label}: longitude outside Taiwan envelope`);
  return {latitude, longitude, coordinate: [longitude, latitude]};
}

const stationBytes = readAndVerify(stationSourcePath, expectedRawHashes.station_directory, 'station directory source');
const flowBytes = readAndVerify(flowSourcePath, expectedRawHashes.station_and_line_flows_2021, 'station and line flow source');
const stationRows = JSON.parse(stationBytes.toString('utf8'));
const flowRows = JSON.parse(flowBytes.toString('utf8').replace(/^\uFEFF/, ''));
assert(Array.isArray(stationRows) && stationRows.length === 245, `Expected 245 station directory rows, found ${stationRows.length}`);
assert(Array.isArray(flowRows) && flowRows.length === 253, `Expected 253 flow rows, found ${flowRows.length}`);

const omittedStations = stationRows.filter((record) => !String(record.gps ?? '').trim());
assert(omittedStations.length === 1, `Expected one station without GPS, found ${omittedStations.length}`);
assert(omittedStations[0].stationCode === '1998' && omittedStations[0].stationName === '樹林調車場', 'Unexpected station omitted for missing GPS');

const featureIds = new Set();
const stationCodes = new Set();
const stationNames = new Set();
const englishNames = new Set();
const gpsValues = new Set();
const features = stationRows
  .filter((record) => String(record.gps ?? '').trim())
  .map((record) => {
    const code = String(record.stationCode).trim();
    const localName = String(record.stationName).trim();
    const englishName = String(record.stationEName).trim();
    const gpsText = String(record.gps).trim();
    assert(/^\d{4}$/.test(code), `Invalid station code ${code}`);
    assert(localName && englishName, `${code}: station names are required`);
    assert(!stationCodes.has(code), `Duplicate station code ${code}`);
    assert(!stationNames.has(localName), `Duplicate station local name ${localName}`);
    assert(!englishNames.has(englishName), `Duplicate station English name ${englishName}`);
    assert(!gpsValues.has(gpsText), `Duplicate station GPS ${gpsText}`);
    stationCodes.add(code);
    stationNames.add(localName);
    englishNames.add(englishName);
    gpsValues.add(gpsText);
    const gps = parseGps(gpsText, code);
    const featureId = `infrastructure_twn_tra_station_${code}`;
    assert(!featureIds.has(featureId), `Duplicate feature ID ${featureId}`);
    featureIds.add(featureId);
    return {
      type: 'Feature',
      id: featureId,
      properties: {
        feature_id: featureId,
        station_code: code,
        name: englishName,
        local_name: localName,
        facility_type: 'civilian_rail_directory_point',
        infrastructure_domain: 'surface_transport',
        operator: 'Taiwan Railways Corporation',
        directory_record_only: true,
        opening_state_eligible: false,
        military_facility_status: 'not_assessed',
        military_use_asserted: false,
        target_status: 'not_assessed',
        dual_use_status: 'not_assessed',
        operational_use: ['civilian_rail_access'],
        location_method: 'official_station_directory_gps',
        coordinate_precision_m: 25,
        source_coordinate: {
          gps: gpsText,
          latitude: gps.latitude,
          longitude: gps.longitude,
          precision_m: 25,
        },
        snapshot_retrieved_at: snapshotDate,
        bookmark_as_of: bookmarkTime,
        source_ids: [stationSourceId],
        representation_note: 'Current official directory point retrieved after the bookmark. It is not opening state evidence and does not establish service, capacity, route connectivity, military access, target status, or operability.',
      },
      geometry: {type: 'Point', coordinates: gps.coordinate},
    };
  })
  .sort((left, right) => left.properties.station_code.localeCompare(right.properties.station_code));
assert(features.length === 244, `Expected 244 geocoded station features, found ${features.length}`);

const stationByLocalName = new Map(features.map((feature) => [feature.properties.local_name, feature]));
const passengerRecords = [];
const freightRecords = [];
const unmatchedRows = [];
for (const row of flowRows) {
  assert(row['年別'] === 2021, `Unexpected flow year ${row['年別']}`);
  const localName = String(row['站別']).trim();
  const station = stationByLocalName.get(localName);
  if (station) {
    const boardings = nonnegativeInteger(row['上車人數'], `${localName} boardings`);
    const alightings = nonnegativeInteger(row['下車人數'], `${localName} alightings`);
    assert(row['起運噸數'] === '' && row['到達噸數'] === '', `${localName}: station freight detail was unexpectedly populated`);
    passengerRecords.push({
      activity_record_id: `activity_twn_tra_station_${station.properties.station_code}_passenger_2021`,
      station_id: station.id,
      station_code: station.properties.station_code,
      station_name: station.properties.name,
      station_name_local: station.properties.local_name,
      period: '2021',
      period_kind: 'calendar_year',
      boardings,
      alightings,
      passenger_movements: boardings + alightings,
      interpretation: 'Observed calendar year 2021 passenger movements. This is not 2025 utilization, maximum capacity, freight capability, military access, readiness, or route connectivity.',
      available_to_player_at_bookmark: true,
      bookmark_as_of: bookmarkTime,
      source_ids: [flowSourceId],
    });
    continue;
  }
  const line = lineNames.get(localName);
  if (line) {
    assert(row['上車人數'] === '' && row['下車人數'] === '', `${localName}: line passenger detail was unexpectedly populated`);
    const originatingTonnes = nonnegativeInteger(row['起運噸數'], `${localName} originating tonnes`);
    const arrivingTonnes = nonnegativeInteger(row['到達噸數'], `${localName} arriving tonnes`);
    freightRecords.push({
      activity_record_id: `activity_twn_tra_line_${line.slug}_freight_2021`,
      line_id: `rail_line_twn_${line.slug}`,
      line_name: line.name,
      line_name_local: localName,
      period: '2021',
      period_kind: 'calendar_year',
      originating_tonnes: originatingTonnes,
      arriving_tonnes: arrivingTonnes,
      total_handled_tonnes: originatingTonnes + arrivingTonnes,
      station_allocation_status: 'not_disclosed_by_source',
      geometry_status: 'not_populated',
      interpretation: 'Observed calendar year 2021 line aggregate. The source withholds station freight detail, so this total may not be allocated to stations, routes, trains, depots, formations, or available lift.',
      available_to_player_at_bookmark: true,
      bookmark_as_of: bookmarkTime,
      source_ids: [flowSourceId],
    });
    continue;
  }
  unmatchedRows.push(row);
}

passengerRecords.sort((left, right) => left.station_code.localeCompare(right.station_code));
freightRecords.sort((left, right) => left.line_id.localeCompare(right.line_id));
assert(passengerRecords.length === 239, `Expected 239 matched passenger records, found ${passengerRecords.length}`);
assert(freightRecords.length === 13, `Expected 13 line freight records, found ${freightRecords.length}`);
assert(unmatchedRows.length === 1, `Expected one intentionally unmatched flow row, found ${unmatchedRows.length}`);
assert(unmatchedRows[0]['站別'] === '花蓮港' && unmatchedRows[0]['上車人數'] === 0 && unmatchedRows[0]['下車人數'] === 0, 'Unexpected unmatched flow row');

const bounds = [
  Math.min(...features.map((feature) => feature.geometry.coordinates[0])),
  Math.min(...features.map((feature) => feature.geometry.coordinates[1])),
  Math.max(...features.map((feature) => feature.geometry.coordinates[0])),
  Math.max(...features.map((feature) => feature.geometry.coordinates[1])),
];
const geo = {
  type: 'FeatureCollection',
  crs: {type: 'name', properties: {name: 'EPSG:4326'}},
  metadata: {
    schema_version: '0.1.0',
    dataset_id: 'dataset_twn_civilian_rail_access_2025_09_01',
    title: 'Taiwan Railways current station directory reference points',
    bookmark_as_of: bookmarkTime,
    snapshot_retrieved_at: snapshotDate,
    opening_state_eligible: false,
    coordinate_precision_m: 25,
    source_ids: [stationSourceId],
    raw_source_sha256: {station_directory: expectedRawHashes.station_directory},
    excluded_records: {
      '1998': 'Shulin Rail Yard has no GPS value in the official directory, so no coordinate was invented.',
    },
    transformation: 'Parsed the official latitude and longitude text into EPSG:4326 point geometry without interpolation. This postbookmark snapshot remains quarantined from opening state.',
  },
  features,
};

const geoText = `${JSON.stringify(geo, null, 2)}\n`;
const passengerText = `${passengerRecords.map((record) => JSON.stringify(record)).join('\n')}\n`;
const freightText = `${freightRecords.map((record) => JSON.stringify(record)).join('\n')}\n`;
const artifact = {
  schema_version: '0.1.0',
  artifact_id: 'artifact_twn_civilian_rail_access_2025_09_01',
  dataset_id: geo.metadata.dataset_id,
  generated_at: '2026-08-07T00:00:00Z',
  artifacts: {
    station_nodes: {
      path: path.basename(stationOutputPath),
      format: 'GeoJSON',
      crs: 'EPSG:4326',
      feature_count: features.length,
      coordinate_precision_m: 25,
      bounds,
      artifact_sha256: sha256(geoText),
    },
    station_passenger_activity: {
      path: path.basename(passengerOutputPath),
      format: 'NDJSON',
      record_count: passengerRecords.length,
      period_start: '2021',
      period_end: '2021',
      artifact_sha256: sha256(passengerText),
    },
    line_freight_activity: {
      path: path.basename(freightOutputPath),
      format: 'NDJSON',
      record_count: freightRecords.length,
      period_start: '2021',
      period_end: '2021',
      artifact_sha256: sha256(freightText),
    },
  },
  raw_source_sha256: expectedRawHashes,
  source_ids: [stationSourceId, flowSourceId],
  transformations: [
    'Excluded the one directory row without an official GPS value rather than inventing a coordinate.',
    'Converted official latitude and longitude text to EPSG:4326 points without interpolation.',
    'Matched passenger observations to directory points only by exact official local station name.',
    'Excluded the unmatched zero passenger Hualien Harbor row rather than inventing a station node.',
    'Kept thirteen official line freight totals separate from station passenger observations.',
    'Did not allocate line freight totals to stations because the source withholds station freight detail.',
    'Did not infer 2025 service, utilization, capacity, connectivity, military access, or operability.',
  ],
  interpretation_warning: 'The station directory is a postbookmark reference layer, not opening state. Historical passenger and line freight observations are not current capacity, executable routes, military access, or target nominations.',
};

for (const outputPath of [stationOutputPath, passengerOutputPath, freightOutputPath, artifactOutputPath]) {
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
}
fs.writeFileSync(stationOutputPath, geoText);
fs.writeFileSync(passengerOutputPath, passengerText);
fs.writeFileSync(freightOutputPath, freightText);
fs.writeFileSync(artifactOutputPath, `${JSON.stringify(artifact, null, 2)}\n`);

console.log(JSON.stringify({
  status: 'PASS',
  station_nodes: features.length,
  station_passenger_activity_records: passengerRecords.length,
  line_freight_activity_records: freightRecords.length,
  bounds,
  output_sha256: {
    station_nodes: artifact.artifacts.station_nodes.artifact_sha256,
    station_passenger_activity: artifact.artifacts.station_passenger_activity.artifact_sha256,
    line_freight_activity: artifact.artifacts.line_freight_activity.artifact_sha256,
  },
}, null, 2));
