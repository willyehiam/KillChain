#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const bookmarkTime = '2025-09-01T00:00:00Z';
const sourceIds = [
  'src_twn_caa_eaip_amdt_01_24_airports',
  'src_twn_caa_airport_activity_2024',
  'src_twn_caa_airport_activity_2025',
];
const canonicalGeoSha256 = 'df1528e1ecccf280267f88711b9c48402b1ab0f0858fd5d3b43e0a6b07ade7e6';
const canonicalActivitySha256 = '189d5d0b9d3ccf316c3964b6dd18ba68840c0d26209d3a21c2ada49272bd43a8';
const canonicalRawHashes = {
  eaip_menu: 'b5c767271e87d7a86f22ad442c6c71d0dbb20da819749e6df688ec53faa08831',
  activity_2024: '3710f119da11006fa61b95a5c408a2461ddf6a2eb247ed694ede4b2ddc85f72f',
  activity_2025: 'e9392e7496199d8971edf650a66e1581dba2210fdd1fd21bcb8885114a45b5fd',
};
const expectedAirports = new Map([
  ['infrastructure_twn_airport_taoyuan', {icao:'RCTP', name:'Taiwan Taoyuan International Airport', local:'臺灣桃園國際機場', dms:['250449N','1211356E'], coordinate:[121.232222222,25.080277778], movements:257472, passengers:[46617637,183432,46434205], cargo:2420234.765}],
  ['infrastructure_twn_airport_kaohsiung', {icao:'RCKH', name:'Kaohsiung International Airport', local:'高雄國際機場', dms:['223437N','1202101E'], coordinate:[120.350277778,22.576944444], movements:56840, passengers:[6517331,7647,6509684], cargo:48938.213}],
  ['infrastructure_twn_airport_taipei_songshan', {icao:'RCSS', name:'Taipei Songshan Airport', local:'臺北松山機場', dms:['250411N','1213309E'], coordinate:[121.5525,25.069722222], movements:51488, passengers:[5508927,0,5508927], cargo:41716.038}],
  ['infrastructure_twn_airport_hualien', {icao:'RCYU', name:'Hualien Airport', local:'花蓮機場', dms:['240124N','1213636E'], coordinate:[121.61,24.023333333], movements:2290, passengers:[77681], cargo:65.749}],
  ['infrastructure_twn_airport_taitung', {icao:'RCFN', name:'Taitung Airport', local:'臺東機場', dms:['224519N','1210601E'], coordinate:[121.100277778,22.755277778], movements:42989, passengers:[256266], cargo:159.56}],
  ['infrastructure_twn_airport_penghu', {icao:'RCQC', name:'Penghu Airport', local:'澎湖機場', dms:['233407N','1193742E'], coordinate:[119.628333333,23.568611111], movements:35814, passengers:[2378505], cargo:5532.222}],
  ['infrastructure_twn_airport_taichung', {icao:'RCMQ', name:'Taichung International Airport', local:'臺中國際機場', dms:['241554N','1203715E'], coordinate:[120.620833333,24.265], movements:26272, passengers:[2556487], cargo:1745.624}],
  ['infrastructure_twn_airport_tainan', {icao:'RCNN', name:'Tainan Airport', local:'臺南機場', dms:['225657N','1201240E'], coordinate:[120.211111111,22.949166667], movements:4336, passengers:[268617], cargo:781.1}],
  ['infrastructure_twn_airport_chiayi', {icao:'RCKU', name:'Chiayi Airport', local:'嘉義機場', dms:['232716N','1202412E'], coordinate:[120.403333333,23.454444444], movements:1302, passengers:[76941], cargo:144.4}],
  ['infrastructure_twn_airport_qimei', {icao:'RCCM', name:'Qimei Airport', local:'七美機場', dms:['231247N','1192503E'], coordinate:[119.4175,23.213055556], movements:1889, passengers:[21143], cargo:9.623}],
  ['infrastructure_twn_airport_wangan', {icao:'RCWA', name:'Wangan Airport', local:'望安機場', dms:['232209N','1193013E'], coordinate:[119.503611111,23.369166667], movements:168, passengers:[1723], cargo:0.122}],
  ['infrastructure_twn_airport_lanyu', {icao:'RCLY', name:'Lanyu Airport', local:'蘭嶼機場', dms:['220140N','1213205E'], coordinate:[121.534722222,22.027777778], movements:2174, passengers:[31585], cargo:20}],
  ['infrastructure_twn_airport_green_island', {icao:'RCGI', name:'Green Island Airport', local:'綠島機場', dms:['224024N','1212758E'], coordinate:[121.466111111,22.673333333], movements:2276, passengers:[22032], cargo:16}],
  ['infrastructure_twn_airport_kinmen', {icao:'RCBS', name:'Kinmen Airport', local:'金門機場', dms:['242544N','1182140E'], coordinate:[118.361111111,24.428888889], movements:27414, passengers:[2091475], cargo:6910.074}],
  ['infrastructure_twn_airport_matsu_beigan', {icao:'RCMT', name:'Matsu Beigan Airport', local:'馬祖北竿機場', dms:['261327N','1200010E'], coordinate:[120.002777778,26.224166667], movements:1676, passengers:[74650], cargo:393.79}],
  ['infrastructure_twn_airport_matsu_nangan', {icao:'RCFG', name:'Matsu Nangan Airport', local:'馬祖南竿機場', dms:['260935N','1195730E'], coordinate:[119.958333333,26.159722222], movements:5664, passengers:[329687], cargo:1433.167}],
  ['infrastructure_twn_airport_hengchun', {icao:'RCKW', name:'Hengchun Airport', local:'恆春機場', dms:['220227N','1204349E'], coordinate:[120.730277778,22.040833333], movements:0, passengers:[0], cargo:0}],
]);
const expectedPeriods = [];
for (let year = 2024, month = 9; year < 2025 || month <= 8;) {
  expectedPeriods.push(`${year}-${String(month).padStart(2, '0')}`);
  month += 1;
  if (month === 13) { year += 1; month = 1; }
}

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const add = (errors, condition, message) => { if (!condition) errors.push(message); };
const close = (left, right) => Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-6;
const parseNdjson = (text) => text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const sum = (records, getter) => records.reduce((total, record) => total + getter(record), 0);

export function airportStatistics(geo, activity) {
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

export function validateAirportPacket({geo, geoText, activity, activityText, manifest, artifact, sources, strictCanonical = true}) {
  const errors = [];
  add(errors, geo?.type === 'FeatureCollection', 'airport nodes must be a GeoJSON FeatureCollection');
  add(errors, geo?.crs?.properties?.name === 'EPSG:4326', 'airport node CRS must be EPSG:4326');
  add(errors, geo?.metadata?.dataset_id === manifest?.dataset_id, 'geometry and manifest dataset identifiers differ');
  add(errors, geo?.metadata?.as_of === bookmarkTime, 'airport nodes do not describe the opening bookmark');
  add(errors, geo?.metadata?.activity_window_start === '2024-09' && geo?.metadata?.activity_window_end === '2025-08', 'airport activity window changed');
  add(errors, geo?.metadata?.coordinate_precision_m === 30, 'airport coordinate precision changed');
  add(errors, sameJson(geo?.metadata?.source_ids, sourceIds), 'airport metadata source references changed');
  add(errors, geo?.metadata?.raw_source_sha256?.eaip_menu === canonicalRawHashes.eaip_menu, 'eAIP menu hash changed');
  add(errors, geo?.metadata?.raw_source_sha256?.activity_2024 === canonicalRawHashes.activity_2024, '2024 workbook hash changed');
  add(errors, geo?.metadata?.raw_source_sha256?.activity_2025 === canonicalRawHashes.activity_2025, '2025 workbook hash changed');
  add(errors, Object.keys(geo?.metadata?.raw_source_sha256?.eaip_pages ?? {}).length === 17, 'expected seventeen frozen eAIP page hashes');
  add(errors, geo?.metadata?.excluded_reporting_columns?.Pingtung?.includes('ceased'), 'Pingtung exclusion reason missing');
  add(errors, geo?.metadata?.excluded_reporting_columns?.Hsinchu?.includes('not normalized'), 'Hsinchu exclusion reason missing');

  add(errors, manifest?.dataset_id === 'dataset_twn_civilian_access_airports_2025_09_01', 'unexpected airport dataset identifier');
  add(errors, manifest?.status === 'collecting', 'airport packet may not self promote beyond collecting');
  add(errors, manifest?.coverage?.as_of === bookmarkTime, 'airport manifest bookmark changed');
  add(errors, manifest?.record_counts?.airport_nodes === 17, 'manifest airport count changed');
  add(errors, manifest?.record_counts?.monthly_activity_records === 204, 'manifest airport activity count changed');
  add(errors, manifest?.record_counts?.total_records === 221, 'manifest total record count changed');
  add(errors, sameJson(manifest?.source_ids, sourceIds), 'manifest source references changed');
  add(errors, (manifest?.known_gaps?.length ?? 0) >= 7, 'manifest must preserve airport coverage gaps');

  add(errors, artifact?.dataset_id === manifest?.dataset_id, 'artifact and manifest dataset identifiers differ');
  add(errors, artifact?.artifacts?.airport_nodes?.path === 'civilian_access_airports.geojson', 'airport artifact path changed');
  add(errors, artifact?.artifacts?.monthly_activity?.path === 'airport_activity_monthly_2024_09_to_2025_08.ndjson', 'airport activity artifact path changed');
  add(errors, artifact?.artifacts?.airport_nodes?.crs === 'EPSG:4326', 'airport artifact CRS changed');
  add(errors, artifact?.artifacts?.monthly_activity?.period_start === '2024-09' && artifact?.artifacts?.monthly_activity?.period_end === '2025-08', 'airport artifact activity period changed');
  add(errors, artifact?.transformations?.some((entry) => entry.includes('preserved zero activity')), 'artifact lost zero activity preservation rule');
  add(errors, artifact?.interpretation_warning?.includes('do not establish military use'), 'artifact lost military interpretation warning');

  const sourceById = new Map((sources ?? []).map((source) => [source.source_id, source]));
  add(errors, sourceById.size === 3, 'exactly three airport source records are required');
  for (const sourceId of sourceIds) add(errors, sourceById.has(sourceId), `missing source ${sourceId}`);
  for (const source of sourceById.values()) add(errors, source.source_tier === 'A', `${source.source_id}: source must remain Tier A`);
  const eaipSource = sourceById.get(sourceIds[0]);
  const activity2024Source = sourceById.get(sourceIds[1]);
  const activity2025Source = sourceById.get(sourceIds[2]);
  add(errors, eaipSource?.raw_snapshot_sha256 === canonicalRawHashes.eaip_menu, 'eAIP source hash changed');
  add(errors, Object.keys(eaipSource?.page_snapshot_sha256 ?? {}).length === 17, 'eAIP source page hash set changed');
  add(errors, eaipSource?.available_to_player_at_bookmark === true && Date.parse(eaipSource?.published_at) <= Date.parse(bookmarkTime), 'eAIP source is not valid prebookmark evidence');
  add(errors, activity2024Source?.raw_snapshot_sha256 === canonicalRawHashes.activity_2024, '2024 activity source hash changed');
  add(errors, activity2024Source?.available_to_player_at_bookmark === true && Date.parse(activity2024Source?.published_at) <= Date.parse(bookmarkTime), '2024 activity source is not valid prebookmark evidence');
  add(errors, activity2025Source?.raw_snapshot_sha256 === canonicalRawHashes.activity_2025, '2025 activity source hash changed');
  add(errors, Date.parse(activity2025Source?.published_at) > Date.parse(bookmarkTime), '2025 retrospective source must remain postbookmark');
  add(errors, activity2025Source?.available_to_player_at_bookmark === false, 'postbookmark 2025 workbook may not be labeled contemporaneously available');
  add(errors, activity2025Source?.bookmark_evidence_status === 'retrospective_prebookmark_observations_from_postbookmark_publication', '2025 retrospective evidence status changed');

  const featureIds = new Set();
  const icaoCodes = new Set();
  for (const [index, feature] of (geo?.features ?? []).entries()) {
    const properties = feature.properties ?? {};
    const expected = expectedAirports.get(feature.id);
    add(errors, feature.type === 'Feature', `feature ${index}: record type must be Feature`);
    add(errors, Boolean(expected), `feature ${index}: unexpected airport identity ${feature.id}`);
    add(errors, !featureIds.has(feature.id), `feature ${index}: duplicate airport identity ${feature.id}`);
    featureIds.add(feature.id);
    add(errors, !icaoCodes.has(properties.icao_code), `feature ${index}: duplicate ICAO code ${properties.icao_code}`);
    icaoCodes.add(properties.icao_code);
    add(errors, properties.feature_id === feature.id, `${feature.id}: feature and property identifiers differ`);
    add(errors, properties.facility_type === 'civilian_access_airport', `${feature.id}: facility type changed`);
    add(errors, properties.infrastructure_domain === 'aviation_logistics', `${feature.id}: infrastructure domain changed`);
    add(errors, properties.civilian_access_node === true, `${feature.id}: civilian access classification changed`);
    add(errors, properties.military_facility_status === 'not_assessed', `${feature.id}: military facility status was inferred`);
    add(errors, properties.military_use_asserted === false, `${feature.id}: military use was asserted`);
    add(errors, properties.target_status === 'not_assessed', `${feature.id}: target status was inferred`);
    add(errors, properties.dual_use_status === 'not_assessed', `${feature.id}: dual use status was inferred`);
    add(errors, sameJson(properties.operational_use, ['civilian_transport','aviation_access','passenger_and_cargo_flow']), `${feature.id}: operational use changed`);
    add(errors, properties.location_method === 'official_eaip_aerodrome_reference_point', `${feature.id}: location method changed`);
    add(errors, properties.coordinate_precision_m === 30, `${feature.id}: coordinate precision changed`);
    add(errors, properties.as_of === bookmarkTime, `${feature.id}: bookmark time changed`);
    add(errors, sameJson(properties.source_ids, sourceIds), `${feature.id}: provenance references changed`);
    add(errors, properties.representation_note?.includes('does not assert exclusive civilian ownership'), `${feature.id}: ownership interpretation warning missing`);
    add(errors, properties.representation_note?.includes('military absence'), `${feature.id}: military absence warning missing`);
    add(errors, feature.geometry?.type === 'Point', `${feature.id}: geometry must remain a point`);
    const [longitude, latitude] = feature.geometry?.coordinates ?? [];
    add(errors, Number.isFinite(longitude) && longitude >= 118 && longitude <= 122.5, `${feature.id}: longitude outside Taiwan airport envelope`);
    add(errors, Number.isFinite(latitude) && latitude >= 21.5 && latitude <= 26.5, `${feature.id}: latitude outside Taiwan airport envelope`);
    if (!expected) continue;
    add(errors, properties.icao_code === expected.icao, `${feature.id}: ICAO code changed`);
    add(errors, properties.name === expected.name, `${feature.id}: English name changed`);
    add(errors, properties.local_name === expected.local, `${feature.id}: local name changed`);
    add(errors, sameJson([properties.source_coordinate?.latitude_dms, properties.source_coordinate?.longitude_dms], expected.dms), `${feature.id}: source DMS coordinate changed`);
    add(errors, sameJson(feature.geometry.coordinates, expected.coordinate), `${feature.id}: converted coordinate changed`);
  }
  add(errors, featureIds.size === expectedAirports.size, `expected ${expectedAirports.size} unique airports, found ${featureIds.size}`);
  for (const airportId of expectedAirports.keys()) add(errors, featureIds.has(airportId), `missing airport ${airportId}`);

  const activityIds = new Set();
  const recordsByAirport = new Map([...expectedAirports.keys()].map((airportId) => [airportId, []]));
  for (const [index, record] of (activity ?? []).entries()) {
    add(errors, !activityIds.has(record.activity_record_id), `activity ${index}: duplicate record id ${record.activity_record_id}`);
    activityIds.add(record.activity_record_id);
    add(errors, expectedAirports.has(record.airport_id), `activity ${index}: unknown airport ${record.airport_id}`);
    add(errors, expectedPeriods.includes(record.period), `activity ${index}: period outside prebookmark baseline ${record.period}`);
    add(errors, record.period <= '2025-08', `activity ${index}: postbookmark activity admitted`);
    add(errors, record.period_kind === 'calendar_month', `activity ${index}: period kind changed`);
    add(errors, record.as_of === bookmarkTime, `activity ${index}: bookmark time changed`);
    const expectedSource = record.period.startsWith('2024-') ? sourceIds[1] : sourceIds[2];
    add(errors, sameJson(record.source_ids, [expectedSource]), `activity ${index}: temporal provenance reference changed`);
    add(errors, record.interpretation?.includes('not maximum capacity'), `activity ${index}: capacity warning missing`);
    add(errors, record.interpretation?.includes('not maximum capacity, military activity, or readiness'), `activity ${index}: military interpretation warning missing`);
    add(errors, Number.isInteger(record.aircraft_movements) && record.aircraft_movements >= 0, `activity ${index}: invalid aircraft movements`);
    add(errors, Number.isInteger(record.passengers?.total) && record.passengers.total >= 0, `activity ${index}: invalid passenger total`);
    add(errors, Number.isFinite(record.cargo_tonnes) && record.cargo_tonnes >= 0, `activity ${index}: invalid cargo tonnes`);
    const expected = expectedAirports.get(record.airport_id);
    add(errors, record.icao_code === expected?.icao, `activity ${index}: ICAO code does not match airport`);
    if ((expected?.passengers?.length ?? 0) === 3) {
      add(errors, Number.isInteger(record.passengers?.transit) && record.passengers.transit >= 0, `activity ${index}: invalid transit passenger count`);
      add(errors, Number.isInteger(record.passengers?.arrival_departure) && record.passengers.arrival_departure >= 0, `activity ${index}: invalid arrival and departure passenger count`);
      add(errors, record.passengers.total === record.passengers.transit + record.passengers.arrival_departure, `activity ${index}: passengers do not conserve transit plus arrival and departure`);
    } else {
      add(errors, record.passengers?.transit === undefined && record.passengers?.arrival_departure === undefined, `activity ${index}: unsupported passenger detail was invented`);
    }
    if (recordsByAirport.has(record.airport_id)) recordsByAirport.get(record.airport_id).push(record);
  }
  add(errors, activityIds.size === 204, `expected 204 unique airport activity records, found ${activityIds.size}`);

  const featureById = new Map((geo?.features ?? []).map((feature) => [feature.id, feature]));
  for (const [airportId, expected] of expectedAirports) {
    const records = recordsByAirport.get(airportId) ?? [];
    add(errors, records.length === 12, `${airportId}: expected 12 monthly records, found ${records.length}`);
    add(errors, sameJson(records.map((record) => record.period).sort(), expectedPeriods), `${airportId}: monthly coverage changed`);
    const calculated = {
      movements: sum(records, (record) => record.aircraft_movements),
      totalPassengers: sum(records, (record) => record.passengers.total),
      cargo: sum(records, (record) => record.cargo_tonnes),
    };
    if (expected.passengers.length === 3) {
      calculated.transit = sum(records, (record) => record.passengers.transit);
      calculated.arrivalDeparture = sum(records, (record) => record.passengers.arrival_departure);
    }
    const baseline = featureById.get(airportId)?.properties?.activity_baseline;
    add(errors, baseline?.months === 12 && baseline?.window_start === '2024-09' && baseline?.window_end === '2025-08', `${airportId}: baseline window changed`);
    add(errors, baseline?.aircraft_movements === calculated.movements, `${airportId}: baseline movements do not match monthly records`);
    add(errors, baseline?.passengers?.total === calculated.totalPassengers, `${airportId}: baseline passengers do not match monthly records`);
    add(errors, close(baseline?.cargo_tonnes, calculated.cargo), `${airportId}: baseline cargo does not match monthly records`);
    if (expected.passengers.length === 3) {
      add(errors, baseline?.passengers?.transit === calculated.transit, `${airportId}: baseline transit passengers do not match monthly records`);
      add(errors, baseline?.passengers?.arrival_departure === calculated.arrivalDeparture, `${airportId}: baseline arrival and departure passengers do not match monthly records`);
    }
    if (strictCanonical) {
      add(errors, calculated.movements === expected.movements, `${airportId}: canonical movement baseline changed`);
      add(errors, calculated.totalPassengers === expected.passengers[0], `${airportId}: canonical passenger baseline changed`);
      add(errors, close(calculated.cargo, expected.cargo), `${airportId}: canonical cargo baseline changed`);
      if (expected.passengers.length === 3) {
        add(errors, calculated.transit === expected.passengers[1] && calculated.arrivalDeparture === expected.passengers[2], `${airportId}: canonical detailed passenger baseline changed`);
      }
    }
  }

  const statistics = airportStatistics(geo, activity);
  add(errors, artifact?.artifacts?.airport_nodes?.feature_count === statistics.feature_count, 'artifact airport count does not match geometry');
  add(errors, artifact?.artifacts?.monthly_activity?.record_count === statistics.activity_record_count, 'artifact activity count does not match records');
  add(errors, sameJson(artifact?.artifacts?.airport_nodes?.bounds, statistics.bounds), 'artifact bounds do not match geometry');
  const calculatedGeoHash = sha256(geoText);
  const calculatedActivityHash = sha256(activityText);
  add(errors, artifact?.artifacts?.airport_nodes?.artifact_sha256 === calculatedGeoHash, 'airport artifact SHA256 does not match geometry bytes');
  add(errors, artifact?.artifacts?.monthly_activity?.artifact_sha256 === calculatedActivityHash, 'airport activity artifact SHA256 does not match NDJSON bytes');
  if (strictCanonical) {
    add(errors, calculatedGeoHash === canonicalGeoSha256, 'canonical airport artifact SHA256 changed');
    add(errors, calculatedActivityHash === canonicalActivitySha256, 'canonical airport activity artifact SHA256 changed');
  }
  return {status: errors.length ? 'FAIL' : 'PASS', statistics, errors};
}

export function readCanonicalPacket() {
  const geoText = fs.readFileSync(path.join(directory, 'civilian_access_airports.geojson'), 'utf8');
  const activityText = fs.readFileSync(path.join(directory, 'airport_activity_monthly_2024_09_to_2025_08.ndjson'), 'utf8');
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
  const report = validateAirportPacket({...readCanonicalPacket(), strictCanonical: true});
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}
