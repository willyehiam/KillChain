#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const bookmarkTime = '2025-09-01T00:00:00Z';
const stationSourceId = 'src_twn_tra_station_directory_retrieved_2026_08_07';
const flowSourceId = 'src_twn_tra_station_and_line_flows_2021';
const canonicalHashes = {
  station_nodes: 'aae4bb15c957f18177f36d74054b2aaefd30fa97e907a7eec463107883f4b02c',
  station_passenger_activity: 'f6297c9c26e4bd77270c9cf6f6da1ad493c0ded3f252e1c3769ea9d8f10ea262',
  line_freight_activity: 'bd73cc45084d408c2313e9388b4a27f951a4e2244aa8a8b44175adf765d26d4a',
  raw_station_directory: 'ff0f463395d6c690fd8f9f1ea42be84dce7fcf0cb2cc5b1bc70ed489cef183ee',
  raw_station_and_line_flows: 'ed6055b22e02658ff789e9c41c8bd47579844ca0531e665a00b4b61ec3ea7218',
};
const expectedLines = new Map([
  ['rail_line_twn_jiji', ['Jiji Line', '集集線', 0, 0]],
  ['rail_line_twn_liujia', ['Liujia Line', '六家線', 0, 0]],
  ['rail_line_twn_neiwan', ['Neiwan Line', '內灣線', 0, 0]],
  ['rail_line_twn_north_link', ['North Link Line', '北迴線', 5789019, 2237604]],
  ['rail_line_twn_pingtung', ['Pingtung Line', '屏東線', 5486, 14863]],
  ['rail_line_twn_pingxi', ['Pingxi Line', '平溪線', 0, 0]],
  ['rail_line_twn_shalun', ['Shalun Line', '沙崙線', 0, 0]],
  ['rail_line_twn_shenao', ['Shenao Line', '深澳線', 0, 0]],
  ['rail_line_twn_south_link', ['South Link Line', '南迴線', 24883, 26616]],
  ['rail_line_twn_taichung', ['Taichung Line', '臺中線', 17800, 32519]],
  ['rail_line_twn_taitung', ['Taitung Line', '臺東線', 60161, 2544140]],
  ['rail_line_twn_western_trunk', ['Western Trunk Line', '縱貫線', 674095, 1532353]],
  ['rail_line_twn_yilan', ['Yilan Line', '宜蘭線', 37091, 220440]],
]);

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function add(errors, condition, message) {
  if (!condition) errors.push(message);
}

function parseNdjson(text) {
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

export function railStatistics(geo, passenger, freight) {
  const coordinates = (geo?.features ?? []).map((feature) => feature.geometry?.coordinates ?? []);
  return {
    station_node_count: geo?.features?.length ?? 0,
    passenger_record_count: passenger?.length ?? 0,
    freight_record_count: freight?.length ?? 0,
    total_record_count: (geo?.features?.length ?? 0) + (passenger?.length ?? 0) + (freight?.length ?? 0),
    bounds: coordinates.length ? [
      Math.min(...coordinates.map(([longitude]) => longitude)),
      Math.min(...coordinates.map(([, latitude]) => latitude)),
      Math.max(...coordinates.map(([longitude]) => longitude)),
      Math.max(...coordinates.map(([, latitude]) => latitude)),
    ] : [],
  };
}

export function validateRailPacket({geo, geoText, passenger, passengerText, freight, freightText, manifest, artifact, sources, strictCanonical = false}) {
  const errors = [];
  const statistics = railStatistics(geo, passenger, freight);

  add(errors, manifest?.dataset_id === 'dataset_twn_civilian_rail_access_2025_09_01', 'unexpected rail dataset identifier');
  add(errors, manifest?.status === 'collecting', 'rail packet may not self promote beyond collecting');
  add(errors, manifest?.coverage?.bookmark_as_of === bookmarkTime, 'rail manifest bookmark changed');
  add(errors, manifest?.record_counts?.station_nodes === 244, 'manifest station count changed');
  add(errors, manifest?.record_counts?.station_passenger_activity_records === 239, 'manifest passenger count changed');
  add(errors, manifest?.record_counts?.line_freight_activity_records === 13, 'manifest freight count changed');
  add(errors, manifest?.record_counts?.exact_geometry_records === 244, 'manifest exact geometry count changed');
  add(errors, manifest?.record_counts?.total_records === 496, 'manifest total record count changed');
  add(errors, sameJson(manifest?.source_ids, [stationSourceId, flowSourceId]), 'manifest source references changed');
  add(errors, manifest?.temporal_contract?.station_directory_opening_state_eligible === false, 'postbookmark directory was admitted to opening state');
  add(errors, manifest?.temporal_contract?.flow_observations_opening_knowledge_eligible === true, 'historical flow observations lost bookmark availability');
  add(errors, manifest?.temporal_contract?.continuity_from_2021_to_bookmark_may_be_inferred === false, 'historical flow continuity was inferred');
  add(errors, manifest?.known_gaps?.some((gap) => gap.includes('Station level freight is withheld')), 'manifest lost station freight suppression warning');
  add(errors, manifest?.known_gaps?.some((gap) => gap.includes('Rail line geometry')), 'manifest lost rail topology gap');

  add(errors, artifact?.dataset_id === manifest?.dataset_id, 'artifact and manifest dataset identifiers differ');
  add(errors, artifact?.generated_at === '2026-08-07T00:00:00Z', 'artifact generation time changed');
  add(errors, artifact?.artifacts?.station_nodes?.path === 'civilian_rail_stations.geojson', 'station artifact path changed');
  add(errors, artifact?.artifacts?.station_passenger_activity?.path === 'rail_station_passenger_activity_2021.ndjson', 'passenger artifact path changed');
  add(errors, artifact?.artifacts?.line_freight_activity?.path === 'rail_line_freight_activity_2021.ndjson', 'freight artifact path changed');
  add(errors, artifact?.artifacts?.station_nodes?.crs === 'EPSG:4326', 'station artifact CRS changed');
  add(errors, artifact?.transformations?.some((entry) => entry.includes('withholds station freight detail')), 'artifact lost freight nonallocation rule');
  add(errors, artifact?.interpretation_warning?.includes('postbookmark reference layer'), 'artifact lost postbookmark warning');

  const sourceById = new Map((sources ?? []).map((source) => [source.source_id, source]));
  add(errors, sourceById.size === 2, 'exactly two rail source records are required');
  const stationSource = sourceById.get(stationSourceId);
  const flowSource = sourceById.get(flowSourceId);
  add(errors, stationSource?.source_tier === 'A' && flowSource?.source_tier === 'A', 'rail sources must remain Tier A');
  add(errors, stationSource?.raw_snapshot_sha256 === canonicalHashes.raw_station_directory, 'station directory raw hash changed');
  add(errors, stationSource?.mutability_class === 'live_mutable', 'station directory must remain classified as live mutable');
  add(errors, stationSource?.bookmark_evidence_status === 'quarantined_no_prebookmark_temporal_proof', 'station directory quarantine status changed');
  add(errors, stationSource?.available_to_player_at_bookmark === false, 'postbookmark station directory became player available');
  add(errors, stationSource?.temporal_proof_requirements?.continuity_inference_forbidden === true, 'station directory continuity guard changed');
  add(errors, flowSource?.raw_snapshot_sha256 === canonicalHashes.raw_station_and_line_flows, 'historical flow raw hash changed');
  add(errors, flowSource?.mutability_class === 'frozen_historical_dataset', 'historical flow mutability changed');
  add(errors, flowSource?.bookmark_evidence_status === 'prebookmark_historical_observation', 'historical flow evidence status changed');
  add(errors, flowSource?.available_to_player_at_bookmark === true, 'historical flow observations lost bookmark availability');
  add(errors, Date.parse(flowSource?.published_at) <= Date.parse(bookmarkTime), 'historical flow source is not prebookmark evidence');
  add(errors, flowSource?.reliability_notes?.includes('may not be assigned to a station'), 'flow source lost freight nonallocation warning');

  add(errors, geo?.type === 'FeatureCollection', 'station geometry must be a FeatureCollection');
  add(errors, geo?.crs?.properties?.name === 'EPSG:4326', 'station geometry CRS changed');
  add(errors, geo?.metadata?.opening_state_eligible === false, 'postbookmark station geometry became opening eligible');
  add(errors, geo?.metadata?.snapshot_retrieved_at === '2026-08-07', 'station snapshot date changed');
  add(errors, sameJson(geo?.metadata?.source_ids, [stationSourceId]), 'station geometry provenance changed');
  add(errors, geo?.metadata?.excluded_records?.['1998']?.includes('no GPS value'), 'missing GPS exclusion changed');

  const featureIds = new Set();
  const codes = new Set();
  const localNames = new Set();
  const englishNames = new Set();
  const gpsValues = new Set();
  const featureById = new Map();
  for (const [index, feature] of (geo?.features ?? []).entries()) {
    const properties = feature.properties ?? {};
    const coordinates = feature.geometry?.coordinates ?? [];
    const [longitude, latitude] = coordinates;
    add(errors, feature.type === 'Feature', `station ${index}: record type must be Feature`);
    add(errors, /^infrastructure_twn_tra_station_\d{4}$/.test(feature.id), `station ${index}: invalid feature identity ${feature.id}`);
    add(errors, !featureIds.has(feature.id), `station ${index}: duplicate feature identity ${feature.id}`);
    featureIds.add(feature.id);
    featureById.set(feature.id, feature);
    add(errors, properties.feature_id === feature.id, `${feature.id}: property identity differs`);
    add(errors, /^\d{4}$/.test(properties.station_code), `${feature.id}: station code changed`);
    add(errors, !codes.has(properties.station_code), `${feature.id}: duplicate station code ${properties.station_code}`);
    codes.add(properties.station_code);
    add(errors, Boolean(properties.name) && !englishNames.has(properties.name), `${feature.id}: missing or duplicate English name`);
    englishNames.add(properties.name);
    add(errors, Boolean(properties.local_name) && !localNames.has(properties.local_name), `${feature.id}: missing or duplicate local name`);
    localNames.add(properties.local_name);
    add(errors, properties.facility_type === 'civilian_rail_directory_point', `${feature.id}: facility type changed`);
    add(errors, properties.infrastructure_domain === 'surface_transport', `${feature.id}: infrastructure domain changed`);
    add(errors, properties.directory_record_only === true, `${feature.id}: directory only guard changed`);
    add(errors, properties.opening_state_eligible === false, `${feature.id}: postbookmark station became opening eligible`);
    add(errors, properties.military_facility_status === 'not_assessed', `${feature.id}: military facility status was inferred`);
    add(errors, properties.military_use_asserted === false, `${feature.id}: military use was asserted`);
    add(errors, properties.target_status === 'not_assessed', `${feature.id}: target status was inferred`);
    add(errors, properties.dual_use_status === 'not_assessed', `${feature.id}: dual use was inferred`);
    add(errors, sameJson(properties.operational_use, ['civilian_rail_access']), `${feature.id}: operational use changed`);
    add(errors, properties.location_method === 'official_station_directory_gps', `${feature.id}: location method changed`);
    add(errors, properties.coordinate_precision_m === 25, `${feature.id}: coordinate precision changed`);
    add(errors, properties.snapshot_retrieved_at === '2026-08-07', `${feature.id}: snapshot date changed`);
    add(errors, properties.bookmark_as_of === bookmarkTime, `${feature.id}: bookmark changed`);
    add(errors, sameJson(properties.source_ids, [stationSourceId]), `${feature.id}: provenance changed`);
    add(errors, properties.representation_note?.includes('not opening state evidence'), `${feature.id}: opening state warning missing`);
    add(errors, properties.representation_note?.includes('does not establish service, capacity'), `${feature.id}: capacity warning missing`);
    add(errors, feature.geometry?.type === 'Point', `${feature.id}: geometry must remain a point`);
    add(errors, Number.isFinite(longitude) && longitude >= 120 && longitude <= 122, `${feature.id}: longitude outside Taiwan rail envelope`);
    add(errors, Number.isFinite(latitude) && latitude >= 22 && latitude <= 25.5, `${feature.id}: latitude outside Taiwan rail envelope`);
    const sourceCoordinate = properties.source_coordinate ?? {};
    add(errors, sourceCoordinate.longitude === longitude && sourceCoordinate.latitude === latitude, `${feature.id}: coordinate differs from official source coordinate`);
    add(errors, sourceCoordinate.precision_m === 25, `${feature.id}: source coordinate precision changed`);
    add(errors, sourceCoordinate.gps === `${latitude} ${longitude}`, `${feature.id}: source GPS text changed`);
    add(errors, !gpsValues.has(sourceCoordinate.gps), `${feature.id}: duplicate source GPS`);
    gpsValues.add(sourceCoordinate.gps);
  }
  add(errors, featureIds.size === 244, `expected 244 unique rail station nodes, found ${featureIds.size}`);
  add(errors, !codes.has('1998'), 'station 1998 received an invented coordinate');

  const passengerIds = new Set();
  const passengerStations = new Set();
  for (const [index, record] of (passenger ?? []).entries()) {
    add(errors, !passengerIds.has(record.activity_record_id), `passenger ${index}: duplicate activity identity ${record.activity_record_id}`);
    passengerIds.add(record.activity_record_id);
    add(errors, featureById.has(record.station_id), `passenger ${index}: unknown station ${record.station_id}`);
    add(errors, !passengerStations.has(record.station_id), `passenger ${index}: duplicate station activity ${record.station_id}`);
    passengerStations.add(record.station_id);
    const station = featureById.get(record.station_id)?.properties;
    add(errors, record.station_code === station?.station_code, `passenger ${index}: station code mismatch`);
    add(errors, record.station_name === station?.name && record.station_name_local === station?.local_name, `passenger ${index}: station name mismatch`);
    add(errors, record.period === '2021' && record.period_kind === 'calendar_year', `passenger ${index}: period changed`);
    add(errors, Number.isInteger(record.boardings) && record.boardings >= 0, `passenger ${index}: invalid boardings`);
    add(errors, Number.isInteger(record.alightings) && record.alightings >= 0, `passenger ${index}: invalid alightings`);
    add(errors, record.passenger_movements === record.boardings + record.alightings, `passenger ${index}: passenger movements do not conserve`);
    add(errors, record.originating_tonnes === undefined && record.arriving_tonnes === undefined, `passenger ${index}: station freight was invented`);
    add(errors, record.available_to_player_at_bookmark === true && record.bookmark_as_of === bookmarkTime, `passenger ${index}: bookmark availability changed`);
    add(errors, sameJson(record.source_ids, [flowSourceId]), `passenger ${index}: provenance changed`);
    add(errors, record.interpretation?.includes('not 2025 utilization'), `passenger ${index}: temporal warning missing`);
    add(errors, record.interpretation?.includes('military access'), `passenger ${index}: military interpretation warning missing`);
  }
  add(errors, passengerIds.size === 239, `expected 239 unique station passenger records, found ${passengerIds.size}`);

  const freightIds = new Set();
  const freightLines = new Set();
  for (const [index, record] of (freight ?? []).entries()) {
    add(errors, !freightIds.has(record.activity_record_id), `freight ${index}: duplicate activity identity ${record.activity_record_id}`);
    freightIds.add(record.activity_record_id);
    add(errors, !freightLines.has(record.line_id), `freight ${index}: duplicate line ${record.line_id}`);
    freightLines.add(record.line_id);
    const expected = expectedLines.get(record.line_id);
    add(errors, Boolean(expected), `freight ${index}: unexpected line ${record.line_id}`);
    add(errors, record.station_id === undefined && record.station_code === undefined, `freight ${index}: line total was allocated to a station`);
    add(errors, record.period === '2021' && record.period_kind === 'calendar_year', `freight ${index}: period changed`);
    add(errors, Number.isInteger(record.originating_tonnes) && record.originating_tonnes >= 0, `freight ${index}: invalid originating tonnes`);
    add(errors, Number.isInteger(record.arriving_tonnes) && record.arriving_tonnes >= 0, `freight ${index}: invalid arriving tonnes`);
    add(errors, record.total_handled_tonnes === record.originating_tonnes + record.arriving_tonnes, `freight ${index}: total tonnes do not conserve`);
    add(errors, record.station_allocation_status === 'not_disclosed_by_source', `freight ${index}: station allocation guard changed`);
    add(errors, record.geometry_status === 'not_populated', `freight ${index}: unsupported geometry was added`);
    add(errors, record.available_to_player_at_bookmark === true && record.bookmark_as_of === bookmarkTime, `freight ${index}: bookmark availability changed`);
    add(errors, sameJson(record.source_ids, [flowSourceId]), `freight ${index}: provenance changed`);
    add(errors, record.interpretation?.includes('may not be allocated to stations'), `freight ${index}: nonallocation warning missing`);
    if (expected) {
      add(errors, record.line_name === expected[0] && record.line_name_local === expected[1], `freight ${index}: line name changed`);
      add(errors, record.originating_tonnes === expected[2] && record.arriving_tonnes === expected[3], `freight ${index}: canonical line observation changed`);
    }
  }
  add(errors, freightIds.size === expectedLines.size, `expected ${expectedLines.size} unique line freight records, found ${freightIds.size}`);
  for (const lineId of expectedLines.keys()) add(errors, freightLines.has(lineId), `missing freight line ${lineId}`);

  add(errors, artifact?.artifacts?.station_nodes?.feature_count === statistics.station_node_count, 'artifact station count does not match geometry');
  add(errors, artifact?.artifacts?.station_passenger_activity?.record_count === statistics.passenger_record_count, 'artifact passenger count does not match records');
  add(errors, artifact?.artifacts?.line_freight_activity?.record_count === statistics.freight_record_count, 'artifact freight count does not match records');
  add(errors, sameJson(artifact?.artifacts?.station_nodes?.bounds, statistics.bounds), 'artifact bounds do not match geometry');
  const calculatedHashes = {
    station_nodes: sha256(geoText),
    station_passenger_activity: sha256(passengerText),
    line_freight_activity: sha256(freightText),
  };
  for (const [key, value] of Object.entries(calculatedHashes)) {
    add(errors, artifact?.artifacts?.[key]?.artifact_sha256 === value, `${key} artifact SHA256 does not match bytes`);
    if (strictCanonical) add(errors, value === canonicalHashes[key], `canonical ${key} SHA256 changed`);
  }
  return {status: errors.length ? 'FAIL' : 'PASS', statistics, errors};
}

export function readCanonicalPacket() {
  const geoText = fs.readFileSync(path.join(directory, 'civilian_rail_stations.geojson'), 'utf8');
  const passengerText = fs.readFileSync(path.join(directory, 'rail_station_passenger_activity_2021.ndjson'), 'utf8');
  const freightText = fs.readFileSync(path.join(directory, 'rail_line_freight_activity_2021.ndjson'), 'utf8');
  return {
    geo: JSON.parse(geoText),
    geoText,
    passenger: parseNdjson(passengerText),
    passengerText,
    freight: parseNdjson(freightText),
    freightText,
    manifest: JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8')),
    artifact: JSON.parse(fs.readFileSync(path.join(directory, 'artifact_record.json'), 'utf8')),
    sources: parseNdjson(fs.readFileSync(path.join(directory, 'sources.ndjson'), 'utf8')),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = validateRailPacket({...readCanonicalPacket(), strictCanonical: true});
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}
