#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const bookmarkTime = '2025-09-01T00:00:00Z';
const sourceIds = [
  'src_twn_moi_wharf_main_1150409',
  'src_twn_tipc_container_activity_8368',
  'src_twn_tipc_vessel_activity_8365',
];
const activitySourceIds = sourceIds.slice(1);
const canonicalGeoSha256 = 'd68bf62a26a0773c160e2385a1202b73bab9410d19485d9c7f30f653144feafc';
const canonicalActivitySha256 = 'e03911f3a1ae83a807e22a0566b9a78774ab38cc99466f0aacef5afc4d4653d8';
const canonicalRawHashes = {
  wharf: '58710be9102a6573485abf119bc89281ff18a515c550a4a049d881aeac549420',
  container: '34e3e4bf331314712210ea6470e1a6ecb83d37f06c7622674ca7b7c2cfe255e3',
  vessel: 'e1bf0564156e7c312511137308d869a5a9bac2750097a5973c29889e1b3bcc65',
};
const expectedPorts = new Map([
  ['infrastructure_twn_port_keelung', {name: 'Port of Keelung', local_name: '基隆港', mark_id: 'C0000002245', updated: '202211', projected: [326192.1248, 2782492.1098], coordinate: [121.755725628, 25.148975812], teu: [1618026.5, 852263.5, 765763], calls: [4775, 4774], tonnage: [85051549, 84975715]}],
  ['infrastructure_twn_port_taipei', {name: 'Port of Taipei', local_name: '臺北港', mark_id: 'F0000001741', updated: '201904', projected: [289480.775, 2782842.771], coordinate: [121.391617289, 25.153551856], teu: [1465904.75, 721177, 744727.75], calls: [4845, 4845], tonnage: [89891716, 89894273]}],
  ['infrastructure_twn_port_suao', {name: "Port of Su'ao", local_name: '蘇澳港', mark_id: 'G0000004134', updated: '202211', projected: [337356.007, 2721491.85], coordinate: [121.862615977, 24.597689423], teu: [0, 0, 0], calls: [364, 366], tonnage: [4638445, 4643946]}],
  ['infrastructure_twn_port_taichung', {name: 'Port of Taichung', local_name: '臺中港', mark_id: 'B0000014288', updated: '202212', projected: [200336.8876, 2685154.6154], coordinate: [120.510843227, 24.271282963], teu: [1581681, 791511.5, 790169.5], calls: [12385, 12399], tonnage: [130129272, 130078879]}],
  ['infrastructure_twn_port_kaohsiung', {name: 'Port of Kaohsiung', local_name: '高雄港', mark_id: 'E0000013027', updated: '202212', projected: [174581.3464, 2501983.2613], coordinate: [120.266367785, 22.616314917], teu: [9056659.25, 4519570, 4537089.25], calls: [14870, 14868], tonnage: [380999470, 380582051]}],
  ['infrastructure_twn_port_anping', {name: 'Port of Anping', local_name: '安平港', mark_id: 'D0000011735', updated: '202209', projected: [164561.2061, 2541303.8177], coordinate: [120.166749724, 22.97090493], teu: [2265, 1201, 1064], calls: [776, 777], tonnage: [7499994, 7529920]}],
  ['infrastructure_twn_port_hualien', {name: 'Port of Hualien', local_name: '花蓮港', mark_id: 'U0000001861', updated: '201705', projected: [314096.8542, 2653003.9315], coordinate: [121.629892966, 23.980474472], teu: [0, 0, 0], calls: [1045, 1039], tonnage: [7362202, 7260500]}],
]);
const expectedPeriods = [];
for (let year = 2024, month = 9; year < 2025 || month <= 8;) {
  expectedPeriods.push(`${year}-${String(month).padStart(2, '0')}`);
  month += 1;
  if (month === 13) {
    year += 1;
    month = 1;
  }
}

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const add = (errors, condition, message) => { if (!condition) errors.push(message); };
const close = (left, right) => Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-6;

function parseNdjson(text) {
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function sum(records, getter) {
  return records.reduce((total, record) => total + getter(record), 0);
}

export function portStatistics(geo, activity) {
  const coordinates = (geo?.features ?? []).map((feature) => feature.geometry?.coordinates).filter((value) => Array.isArray(value) && value.length >= 2);
  return {
    feature_count: geo?.features?.length ?? 0,
    activity_record_count: activity?.length ?? 0,
    bounds: coordinates.length ? [
      Math.min(...coordinates.map(([longitude]) => longitude)),
      Math.min(...coordinates.map(([, latitude]) => latitude)),
      Math.max(...coordinates.map(([longitude]) => longitude)),
      Math.max(...coordinates.map(([, latitude]) => latitude)),
    ] : [null, null, null, null],
  };
}

export function validatePortPacket({geo, geoText, activity, activityText, manifest, artifact, sources, strictCanonical = true}) {
  const errors = [];
  add(errors, geo?.type === 'FeatureCollection', 'port nodes must be a GeoJSON FeatureCollection');
  add(errors, geo?.crs?.properties?.name === 'EPSG:4326', 'port node CRS must be EPSG:4326');
  add(errors, geo?.metadata?.dataset_id === manifest?.dataset_id, 'geometry and manifest dataset identifiers differ');
  add(errors, geo?.metadata?.as_of === bookmarkTime, 'port nodes do not describe the opening bookmark');
  add(errors, geo?.metadata?.activity_window_start === '2024-09' && geo?.metadata?.activity_window_end === '2025-08', 'activity window changed');
  add(errors, geo?.metadata?.coordinate_precision_m === 100, 'port coordinate precision changed');
  add(errors, sameJson(geo?.metadata?.source_ids, sourceIds), 'port metadata source references changed');
  add(errors, sameJson(geo?.metadata?.raw_source_sha256, canonicalRawHashes), 'port metadata raw source hashes changed');
  add(errors, geo?.metadata?.transformation?.includes('reprojected EPSG:3826'), 'port metadata lost reprojection declaration');

  add(errors, manifest?.dataset_id === 'dataset_twn_international_commercial_ports_2025_09_01', 'unexpected port dataset identifier');
  add(errors, manifest?.status === 'collecting', 'port packet may not self promote beyond collecting');
  add(errors, manifest?.coverage?.as_of === bookmarkTime, 'manifest bookmark changed');
  add(errors, manifest?.record_counts?.port_nodes === 7, 'manifest port count changed');
  add(errors, manifest?.record_counts?.monthly_activity_records === 84, 'manifest activity count changed');
  add(errors, manifest?.record_counts?.total_records === 91, 'manifest total record count changed');
  add(errors, sameJson(manifest?.source_ids, sourceIds), 'manifest source references changed');
  add(errors, (manifest?.known_gaps?.length ?? 0) >= 5, 'manifest must preserve infrastructure coverage gaps');

  add(errors, artifact?.dataset_id === manifest?.dataset_id, 'artifact and manifest dataset identifiers differ');
  add(errors, artifact?.artifacts?.port_nodes?.path === 'international_commercial_ports.geojson', 'port artifact path changed');
  add(errors, artifact?.artifacts?.monthly_activity?.path === 'port_activity_monthly_2024_09_to_2025_08.ndjson', 'activity artifact path changed');
  add(errors, artifact?.artifacts?.port_nodes?.crs === 'EPSG:4326', 'artifact CRS changed');
  add(errors, artifact?.artifacts?.monthly_activity?.period_start === '2024-09' && artifact?.artifacts?.monthly_activity?.period_end === '2025-08', 'artifact activity period changed');
  add(errors, sameJson(artifact?.raw_source_sha256, canonicalRawHashes), 'artifact raw source hashes changed');
  add(errors, sameJson(artifact?.source_ids, sourceIds), 'artifact source references changed');
  add(errors, artifact?.transformations?.some((entry) => entry.includes('Rejected any geometry record')), 'artifact lost geometry bookmark firewall');
  add(errors, artifact?.interpretation_warning?.includes('do not establish military use'), 'artifact lost civilian interpretation warning');

  const sourceById = new Map((sources ?? []).map((source) => [source.source_id, source]));
  add(errors, sourceById.size === 3, 'exactly three port source records are required');
  for (const sourceId of sourceIds) add(errors, sourceById.has(sourceId), `missing source ${sourceId}`);
  for (const source of sourceById.values()) {
    add(errors, source.source_tier === 'A', `${source.source_id}: source must remain Tier A`);
    add(errors, Date.parse(source.published_at) <= Date.parse(bookmarkTime), `${source.source_id}: source publication is postbookmark`);
    add(errors, source.raw_snapshot_sha256 === canonicalRawHashes[source.source_id.includes('wharf') ? 'wharf' : source.source_id.includes('container') ? 'container' : 'vessel'], `${source.source_id}: raw source hash changed`);
  }
  const wharfSource = sourceById.get(sourceIds[0]);
  add(errors, wharfSource?.available_to_player_at_bookmark === false, 'retrospective wharf snapshot may not be labeled contemporaneously available');
  add(errors, wharfSource?.bookmark_evidence_status === 'retrospective_prebookmark_records_from_live_snapshot', 'wharf temporal evidence status changed');
  for (const sourceId of activitySourceIds) {
    const source = sourceById.get(sourceId);
    add(errors, source?.bookmark_evidence_status === 'prebookmark_rows_from_live_series', `${sourceId}: activity temporal evidence status changed`);
  }

  const featureIds = new Set();
  const markIds = new Set();
  for (const [index, feature] of (geo?.features ?? []).entries()) {
    const properties = feature.properties ?? {};
    const expected = expectedPorts.get(feature.id);
    add(errors, feature.type === 'Feature', `feature ${index}: record type must be Feature`);
    add(errors, Boolean(expected), `feature ${index}: unexpected port identity ${feature.id}`);
    add(errors, !featureIds.has(feature.id), `feature ${index}: duplicate port identity ${feature.id}`);
    featureIds.add(feature.id);
    add(errors, !markIds.has(properties.source_mark_id), `feature ${index}: duplicate source mark id`);
    markIds.add(properties.source_mark_id);
    add(errors, properties.feature_id === feature.id, `feature ${index}: feature and property identifiers differ`);
    add(errors, properties.facility_type === 'international_commercial_port', `${feature.id}: facility type changed`);
    add(errors, properties.infrastructure_domain === 'maritime_logistics', `${feature.id}: infrastructure domain changed`);
    add(errors, properties.civilian_infrastructure === true, `${feature.id}: civilian classification changed`);
    add(errors, properties.military_facility === false, `${feature.id}: civilian port was promoted to a military facility`);
    add(errors, sameJson(properties.operational_use, ['trade', 'civilian_logistics', 'maritime_access']), `${feature.id}: operational use changed`);
    add(errors, properties.source_mark_type === '9960401', `${feature.id}: source type is not commercial port`);
    add(errors, /^\d{6}$/.test(properties.source_updated_yyyymm) && properties.source_updated_yyyymm <= '202508', `${feature.id}: postbookmark source update admitted`);
    add(errors, properties.source_epsg === 'EPSG:3826', `${feature.id}: source CRS changed`);
    add(errors, properties.location_method === 'official_landmark_point_reprojected_from_epsg_3826', `${feature.id}: location method changed`);
    add(errors, properties.coordinate_precision_m === 100, `${feature.id}: coordinate precision changed`);
    add(errors, properties.as_of === bookmarkTime, `${feature.id}: bookmark time changed`);
    add(errors, sameJson(properties.source_ids, sourceIds), `${feature.id}: provenance references changed`);
    add(errors, properties.representation_note?.includes('Civilian logistics node'), `${feature.id}: civilian interpretation warning missing`);
    add(errors, feature.geometry?.type === 'Point', `${feature.id}: geometry must remain a point`);
    const [longitude, latitude] = feature.geometry?.coordinates ?? [];
    add(errors, Number.isFinite(longitude) && longitude >= 119.5 && longitude <= 122.5, `${feature.id}: longitude outside Taiwan port envelope`);
    add(errors, Number.isFinite(latitude) && latitude >= 21.5 && latitude <= 26, `${feature.id}: latitude outside Taiwan port envelope`);
    if (!expected) continue;
    add(errors, properties.name === expected.name, `${feature.id}: English name changed`);
    add(errors, properties.local_name === expected.local_name, `${feature.id}: local name changed`);
    add(errors, properties.source_mark_id === expected.mark_id, `${feature.id}: source mark id changed`);
    add(errors, properties.source_updated_yyyymm === expected.updated, `${feature.id}: source update month changed`);
    add(errors, sameJson(properties.source_projected_coordinate, expected.projected), `${feature.id}: source projected coordinate changed`);
    add(errors, sameJson(feature.geometry.coordinates, expected.coordinate), `${feature.id}: reprojected coordinate changed`);
  }
  add(errors, featureIds.size === expectedPorts.size, `expected ${expectedPorts.size} unique ports, found ${featureIds.size}`);
  for (const portId of expectedPorts.keys()) add(errors, featureIds.has(portId), `missing port ${portId}`);

  const activityIds = new Set();
  const recordsByPort = new Map([...expectedPorts.keys()].map((portId) => [portId, []]));
  for (const [index, record] of (activity ?? []).entries()) {
    add(errors, !activityIds.has(record.activity_record_id), `activity ${index}: duplicate record id ${record.activity_record_id}`);
    activityIds.add(record.activity_record_id);
    add(errors, expectedPorts.has(record.port_id), `activity ${index}: unknown port ${record.port_id}`);
    add(errors, expectedPeriods.includes(record.period), `activity ${index}: period outside prebookmark baseline ${record.period}`);
    add(errors, record.period <= '2025-08', `activity ${index}: postbookmark activity admitted`);
    add(errors, record.period_kind === 'calendar_month', `activity ${index}: period kind changed`);
    add(errors, record.as_of === bookmarkTime, `activity ${index}: bookmark time changed`);
    add(errors, sameJson(record.source_ids, activitySourceIds), `activity ${index}: provenance references changed`);
    add(errors, record.interpretation?.includes('not maximum capacity'), `activity ${index}: capacity warning missing`);
    const container = record.container_throughput_teu ?? {};
    const vessels = record.vessel_activity ?? {};
    for (const [label, value] of Object.entries({...container, ...vessels})) add(errors, Number.isFinite(value) && value >= 0, `activity ${index}: invalid nonnegative metric ${label}`);
    add(errors, close(container.total, container.inbound + container.outbound), `activity ${index}: container throughput does not conserve inbound plus outbound`);
    if (recordsByPort.has(record.port_id)) recordsByPort.get(record.port_id).push(record);
  }
  add(errors, activityIds.size === 84, `expected 84 unique activity records, found ${activityIds.size}`);

  const featureById = new Map((geo?.features ?? []).map((feature) => [feature.id, feature]));
  for (const [portId, expected] of expectedPorts) {
    const records = recordsByPort.get(portId) ?? [];
    add(errors, records.length === 12, `${portId}: expected 12 monthly records, found ${records.length}`);
    add(errors, sameJson([...records.map((record) => record.period)].sort(), expectedPeriods), `${portId}: monthly coverage changed`);
    const baseline = featureById.get(portId)?.properties?.activity_baseline;
    const calculated = {
      teu: [
        sum(records, (record) => record.container_throughput_teu.total),
        sum(records, (record) => record.container_throughput_teu.inbound),
        sum(records, (record) => record.container_throughput_teu.outbound),
      ],
      calls: [
        sum(records, (record) => record.vessel_activity.inbound_calls),
        sum(records, (record) => record.vessel_activity.outbound_calls),
      ],
      tonnage: [
        sum(records, (record) => record.vessel_activity.inbound_gross_tonnage),
        sum(records, (record) => record.vessel_activity.outbound_gross_tonnage),
      ],
    };
    add(errors, baseline?.months === 12 && baseline?.window_start === '2024-09' && baseline?.window_end === '2025-08', `${portId}: baseline window changed`);
    add(errors, sameJson([baseline?.container_throughput_teu?.total, baseline?.container_throughput_teu?.inbound, baseline?.container_throughput_teu?.outbound], calculated.teu), `${portId}: baseline container totals do not match monthly records`);
    add(errors, sameJson([baseline?.vessel_activity?.inbound_calls, baseline?.vessel_activity?.outbound_calls], calculated.calls), `${portId}: baseline vessel calls do not match monthly records`);
    add(errors, sameJson([baseline?.vessel_activity?.inbound_gross_tonnage, baseline?.vessel_activity?.outbound_gross_tonnage], calculated.tonnage), `${portId}: baseline tonnage does not match monthly records`);
    if (strictCanonical) {
      add(errors, sameJson(calculated.teu, expected.teu), `${portId}: canonical container baseline changed`);
      add(errors, sameJson(calculated.calls, expected.calls), `${portId}: canonical vessel call baseline changed`);
      add(errors, sameJson(calculated.tonnage, expected.tonnage), `${portId}: canonical tonnage baseline changed`);
    }
  }

  const statistics = portStatistics(geo, activity);
  add(errors, artifact?.artifacts?.port_nodes?.feature_count === statistics.feature_count, 'artifact port count does not match geometry');
  add(errors, artifact?.artifacts?.monthly_activity?.record_count === statistics.activity_record_count, 'artifact activity count does not match records');
  add(errors, sameJson(artifact?.artifacts?.port_nodes?.bounds, statistics.bounds), 'artifact bounds do not match geometry');
  const calculatedGeoHash = sha256(geoText);
  const calculatedActivityHash = sha256(activityText);
  add(errors, artifact?.artifacts?.port_nodes?.artifact_sha256 === calculatedGeoHash, 'port artifact SHA256 does not match geometry bytes');
  add(errors, artifact?.artifacts?.monthly_activity?.artifact_sha256 === calculatedActivityHash, 'activity artifact SHA256 does not match NDJSON bytes');
  if (strictCanonical) {
    add(errors, calculatedGeoHash === canonicalGeoSha256, 'canonical port artifact SHA256 changed');
    add(errors, calculatedActivityHash === canonicalActivitySha256, 'canonical activity artifact SHA256 changed');
  }
  return {status: errors.length ? 'FAIL' : 'PASS', statistics, errors};
}

export function readCanonicalPacket() {
  const geoText = fs.readFileSync(path.join(directory, 'international_commercial_ports.geojson'), 'utf8');
  const activityText = fs.readFileSync(path.join(directory, 'port_activity_monthly_2024_09_to_2025_08.ndjson'), 'utf8');
  return {
    geo: JSON.parse(geoText),
    geoText,
    activity: parseNdjson(activityText),
    activityText,
    manifest: JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8')),
    artifact: JSON.parse(fs.readFileSync(path.join(directory, 'artifact_record.json'), 'utf8')),
    sources: parseNdjson(fs.readFileSync(path.join(directory, 'sources.ndjson'), 'utf8')),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = validatePortPacket({...readCanonicalPacket(), strictCanonical: true});
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}
