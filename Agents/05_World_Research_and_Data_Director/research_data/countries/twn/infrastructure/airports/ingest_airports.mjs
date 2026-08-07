#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const eaipDirectory = path.resolve(process.argv[2] ?? '/tmp/twn_eaip_2024_pages');
const activity2024Path = path.resolve(process.argv[3] ?? '/tmp/twn_airport_activity_2024.ods');
const activity2025Path = path.resolve(process.argv[4] ?? '/tmp/twn_airport_activity_2025.ods');
const geoOutputPath = path.resolve(process.argv[5] ?? path.join(directory, 'civilian_access_airports.geojson'));
const activityOutputPath = path.resolve(process.argv[6] ?? path.join(directory, 'airport_activity_monthly_2024_09_to_2025_08.ndjson'));
const artifactOutputPath = path.resolve(process.argv[7] ?? path.join(directory, 'artifact_record.json'));

const bookmarkTime = '2025-09-01T00:00:00Z';
const sourceIds = [
  'src_twn_caa_eaip_amdt_01_24_airports',
  'src_twn_caa_airport_activity_2024',
  'src_twn_caa_airport_activity_2025',
];
const expectedRawHashes = {
  eaip_menu: 'b5c767271e87d7a86f22ad442c6c71d0dbb20da819749e6df688ec53faa08831',
  activity_2024: '3710f119da11006fa61b95a5c408a2461ddf6a2eb247ed694ede4b2ddc85f72f',
  activity_2025: 'e9392e7496199d8971edf650a66e1581dba2210fdd1fd21bcb8885114a45b5fd',
};
const expectedPageHashes = {
  RCBS: '8db15165619785d960bf5498892b7e346ae41a8ec1153d47345503d02337868e',
  RCCM: '4c692f2bde70329fe4d2ea062b5014bdb413b8dccee7f6cc4fb87fc1d4ff9671',
  RCFG: '9ff43f9118b870c1d2171f2cd9ed2d8fa3551e5b343c5290742c5a59796fb6fd',
  RCFN: '4c090376247cfdb3161d1469a61ce150f9fff6854da32fe4be434421b5bad2a3',
  RCGI: '339d927ee3aa0e94abf4d9b460f9926e8e58e8e129d1cef645f7ebc68cf55657',
  RCKH: '5c4abb79780e470d43ada9421e33e363bff383e110cb1b1bd0f213ff2a25cde6',
  RCKU: 'eb239d00f94d994776a805e4985db812f5804a3ed7b8aa866c2dfba6a15ab5ff',
  RCKW: '51caea16bcaf86f500cbe48685213a28fb55722fdd225f4946a94fbfd41e0636',
  RCLY: '829f584ba921dec05aee7ce448c06b66240db00ab1f314f499cb77c3d3be7747',
  RCMQ: 'bf9fcacab473d19826ac6802fc370a897d5ff43b5a0a5012020ee52ce3cefc08',
  RCMT: '5254ebff4355b72c79b0ff29cc2dffe0d87d073ee7ebdb14c73cd16470aec67a',
  RCNN: '743a5ae9de39ff5aa28845179a896c5ff62a6427d8afbb7fe26a6c7a99482961',
  RCQC: '9297fb1cf76fb0484c80ec9eab0ad87f2c6d7f41b7bfd20432e1347ae8baf5da',
  RCSS: '626b62c22ef9e82a2681a85a7626c083689b8a3e905ebea6d5636901318c15d4',
  RCTP: 'eef89c7837b3451fd5c5de90eb117c56359633ddf4599b0761af8eedca9d0507',
  RCWA: '4f6e8695441bdd1646017a1734f1706a6ffefe211d2fcd15a1280674d7556201',
  RCYU: 'fcc5f3212ff36ed089415d7e759b8dbcf6214e26fa5de97c254606c66a1ffb7a',
};

const airports = [
  {icao: 'RCTP', slug: 'taoyuan', name: 'Taiwan Taoyuan International Airport', localName: '臺灣桃園國際機場', columns: {movements: 6, passengers: 7, transit: 8, arrivalDeparture: 9, cargo: 10}},
  {icao: 'RCKH', slug: 'kaohsiung', name: 'Kaohsiung International Airport', localName: '高雄國際機場', columns: {movements: 11, passengers: 12, transit: 13, arrivalDeparture: 14, cargo: 15}},
  {icao: 'RCSS', slug: 'taipei_songshan', name: 'Taipei Songshan Airport', localName: '臺北松山機場', columns: {movements: 16, passengers: 17, transit: 18, arrivalDeparture: 19, cargo: 20}},
  {icao: 'RCYU', slug: 'hualien', name: 'Hualien Airport', localName: '花蓮機場', columns: {movements: 22, passengers: 23, cargo: 24}},
  {icao: 'RCFN', slug: 'taitung', name: 'Taitung Airport', localName: '臺東機場', columns: {movements: 25, passengers: 26, cargo: 27}},
  {icao: 'RCQC', slug: 'penghu', name: 'Penghu Airport', localName: '澎湖機場', columns: {movements: 28, passengers: 29, cargo: 30}},
  {icao: 'RCMQ', slug: 'taichung', name: 'Taichung International Airport', localName: '臺中國際機場', columns: {movements: 31, passengers: 32, cargo: 33}},
  {icao: 'RCNN', slug: 'tainan', name: 'Tainan Airport', localName: '臺南機場', columns: {movements: 34, passengers: 35, cargo: 36}},
  {icao: 'RCKU', slug: 'chiayi', name: 'Chiayi Airport', localName: '嘉義機場', columns: {movements: 37, passengers: 38, cargo: 39}},
  {icao: 'RCCM', slug: 'qimei', name: 'Qimei Airport', localName: '七美機場', columns: {movements: 40, passengers: 41, cargo: 42}},
  {icao: 'RCWA', slug: 'wangan', name: 'Wangan Airport', localName: '望安機場', columns: {movements: 43, passengers: 44, cargo: 45}},
  {icao: 'RCLY', slug: 'lanyu', name: 'Lanyu Airport', localName: '蘭嶼機場', columns: {movements: 47, passengers: 48, cargo: 49}},
  {icao: 'RCGI', slug: 'green_island', name: 'Green Island Airport', localName: '綠島機場', columns: {movements: 50, passengers: 51, cargo: 52}},
  {icao: 'RCBS', slug: 'kinmen', name: 'Kinmen Airport', localName: '金門機場', columns: {movements: 53, passengers: 54, cargo: 55}},
  {icao: 'RCMT', slug: 'matsu_beigan', name: 'Matsu Beigan Airport', localName: '馬祖北竿機場', columns: {movements: 56, passengers: 57, cargo: 58}},
  {icao: 'RCFG', slug: 'matsu_nangan', name: 'Matsu Nangan Airport', localName: '馬祖南竿機場', columns: {movements: 65, passengers: 66, cargo: 67}},
  {icao: 'RCKW', slug: 'hengchun', name: 'Hengchun Airport', localName: '恆春機場', columns: {movements: 68, passengers: 69, cargo: 70}},
];

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const round = (value, digits = 9) => Number(value.toFixed(digits));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readAndVerify(file, expectedHash, label) {
  const bytes = fs.readFileSync(file);
  const actualHash = sha256(bytes);
  assert(actualHash === expectedHash, `${label} SHA256 changed: ${actualHash}`);
  return bytes;
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function cellValue(attributes, body = '') {
  const numeric = attributes.match(/\boffice:value="([^"]+)"/);
  if (numeric) return Number(numeric[1]);
  const texts = [...body.matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g)]
    .map((match) => decodeXml(match[1].replace(/<[^>]+>/g, '')))
    .join('')
    .trim();
  return texts;
}

function parseOdsRows(file) {
  const result = spawnSync('unzip', ['-p', file, 'content.xml'], {encoding: 'utf8', maxBuffer: 20_000_000});
  assert(result.status === 0, `Unable to extract ${file}: ${result.stderr}`);
  const rows = [];
  for (const rowMatch of result.stdout.matchAll(/<table:table-row\b[^>]*>([\s\S]*?)<\/table:table-row>/g)) {
    const values = [];
    const cellPattern = /<table:(table-cell|covered-table-cell)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:\1>)/g;
    for (const cellMatch of rowMatch[1].matchAll(cellPattern)) {
      const repeated = Number(cellMatch[2].match(/\btable:number-columns-repeated="(\d+)"/)?.[1] ?? 1);
      const value = cellMatch[1] === 'covered-table-cell' ? '' : cellValue(cellMatch[2], cellMatch[3]);
      for (let count = 0; count < repeated && values.length < 71; count += 1) values.push(value);
      if (values.length >= 71) break;
    }
    rows.push(values);
  }
  return rows;
}

function selectYearMonths(rows, rocYear) {
  const yearIndex = rows.findIndex((row) => String(row[0]).trim() === `${rocYear}年`);
  assert(yearIndex >= 0, `Unable to locate ROC year ${rocYear}`);
  const months = rows.slice(yearIndex + 1, yearIndex + 13);
  assert(months.length === 12, `ROC year ${rocYear} does not contain twelve months`);
  for (let month = 1; month <= 12; month += 1) {
    assert(String(months[month - 1][0]).trim() === `${month}月`, `ROC year ${rocYear} month ${month} is missing or displaced`);
    assert(months[month - 1].length >= 71, `ROC year ${rocYear} month ${month} has fewer than 71 columns`);
  }
  return months;
}

function nonnegative(value, context, integer = false) {
  const number = typeof value === 'number' ? value : Number(String(value).replaceAll(',', ''));
  assert(Number.isFinite(number) && number >= 0, `${context}: invalid nonnegative value ${value}`);
  assert(!integer || Number.isInteger(number), `${context}: expected an integer, found ${number}`);
  return number;
}

function dmsToDecimal(value) {
  const match = value.match(/^(\d{2,3})(\d{2})(\d{2}(?:\.\d+)?)([NSEW])$/);
  assert(match, `Invalid DMS coordinate ${value}`);
  const decimal = Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600;
  return round(['S', 'W'].includes(match[4]) ? -decimal : decimal);
}

function extractArp(html, icao) {
  const match = html.match(/ARP coordinates[\s\S]{0,2500}?(\d{6}(?:\.\d+)?[NS])\s+(\d{7}(?:\.\d+)?[EW])/i);
  assert(match, `${icao}: official aerodrome reference point was not found`);
  return {latitude_dms: match[1], longitude_dms: match[2], coordinate: [dmsToDecimal(match[2]), dmsToDecimal(match[1])]};
}

const workbook2024Bytes = readAndVerify(activity2024Path, expectedRawHashes.activity_2024, '2024 airport activity source');
const workbook2025Bytes = readAndVerify(activity2025Path, expectedRawHashes.activity_2025, '2025 airport activity source');
assert(workbook2024Bytes.length > 0 && workbook2025Bytes.length > 0, 'Airport activity workbooks are empty');
const rows2024 = selectYearMonths(parseOdsRows(activity2024Path), 113);
const rows2025 = selectYearMonths(parseOdsRows(activity2025Path), 114);
const selectedMonths = [
  ...rows2024.slice(8).map((row, index) => ({period: `2024-${String(index + 9).padStart(2, '0')}`, row, sourceId: sourceIds[1]})),
  ...rows2025.slice(0, 8).map((row, index) => ({period: `2025-${String(index + 1).padStart(2, '0')}`, row, sourceId: sourceIds[2]})),
];
assert(selectedMonths.length === 12, 'Expected exactly twelve prebookmark baseline months');

const activityRecords = [];
for (const airport of airports) {
  for (const month of selectedMonths) {
    const context = `${airport.icao} ${month.period}`;
    const passengerTotal = nonnegative(month.row[airport.columns.passengers], `${context} passengers`, true);
    const record = {
      activity_record_id: `activity_twn_airport_${airport.slug}_${month.period.replace('-', '_')}`,
      airport_id: `infrastructure_twn_airport_${airport.slug}`,
      icao_code: airport.icao,
      period: month.period,
      period_kind: 'calendar_month',
      aircraft_movements: nonnegative(month.row[airport.columns.movements], `${context} movements`, true),
      passengers: {total: passengerTotal},
      cargo_tonnes: nonnegative(month.row[airport.columns.cargo], `${context} cargo`),
      interpretation: 'Observed monthly civilian airport activity; not maximum capacity, military activity, or readiness.',
      as_of: bookmarkTime,
      source_ids: [month.sourceId],
    };
    if (airport.columns.transit !== undefined) {
      record.passengers.transit = nonnegative(month.row[airport.columns.transit], `${context} transit passengers`, true);
      record.passengers.arrival_departure = nonnegative(month.row[airport.columns.arrivalDeparture], `${context} arrival and departure passengers`, true);
      assert(record.passengers.total === record.passengers.transit + record.passengers.arrival_departure, `${context}: passenger total does not conserve transit plus arrival and departure`);
    }
    activityRecords.push(record);
  }
}
assert(activityRecords.length === 204, `Expected 204 airport activity rows, found ${activityRecords.length}`);

const sumForAirport = (airportId, field) => activityRecords
  .filter((record) => record.airport_id === airportId)
  .reduce((sum, record) => sum + field(record), 0);

const features = airports.map((airport) => {
  const pagePath = path.join(eaipDirectory, `${airport.icao}.html`);
  const bytes = readAndVerify(pagePath, expectedPageHashes[airport.icao], `${airport.icao} eAIP page`);
  const arp = extractArp(bytes.toString('utf8'), airport.icao);
  const airportId = `infrastructure_twn_airport_${airport.slug}`;
  const records = activityRecords.filter((record) => record.airport_id === airportId);
  const baseline = {
    months: 12,
    window_start: '2024-09',
    window_end: '2025-08',
    aircraft_movements: sumForAirport(airportId, (record) => record.aircraft_movements),
    passengers: {total: sumForAirport(airportId, (record) => record.passengers.total)},
    cargo_tonnes: round(sumForAirport(airportId, (record) => record.cargo_tonnes), 3),
    interpretation: 'Trailing twelve month observed civilian utilization, not airport capacity or military throughput.',
  };
  if (airport.columns.transit !== undefined) {
    baseline.passengers.transit = sumForAirport(airportId, (record) => record.passengers.transit);
    baseline.passengers.arrival_departure = sumForAirport(airportId, (record) => record.passengers.arrival_departure);
  }
  assert(records.length === 12, `${airport.icao}: expected twelve monthly records`);
  return {
    type: 'Feature',
    id: airportId,
    properties: {
      feature_id: airportId,
      name: airport.name,
      local_name: airport.localName,
      icao_code: airport.icao,
      facility_type: 'civilian_access_airport',
      infrastructure_domain: 'aviation_logistics',
      civilian_access_node: true,
      military_facility_status: 'not_assessed',
      military_use_asserted: false,
      target_status: 'not_assessed',
      dual_use_status: 'not_assessed',
      operational_use: ['civilian_transport', 'aviation_access', 'passenger_and_cargo_flow'],
      location_method: 'official_eaip_aerodrome_reference_point',
      source_coordinate: {latitude_dms: arp.latitude_dms, longitude_dms: arp.longitude_dms},
      coordinate_precision_m: 30,
      activity_baseline: baseline,
      as_of: bookmarkTime,
      source_ids: sourceIds,
      representation_note: 'Point represents civilian aerodrome access only. It does not assert exclusive civilian ownership, military use, military absence, strike status, damage state, authorization, runway geometry, terminal geometry, engineering capacity, or readiness.',
    },
    geometry: {type: 'Point', coordinates: arp.coordinate},
  };
});

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
    dataset_id: 'dataset_twn_civilian_access_airports_2025_09_01',
    title: 'Taiwan civilian aviation access nodes and observed activity baseline',
    as_of: bookmarkTime,
    activity_window_start: '2024-09',
    activity_window_end: '2025-08',
    coordinate_precision_m: 30,
    source_ids: sourceIds,
    raw_source_sha256: {...expectedRawHashes, eaip_pages: expectedPageHashes},
    excluded_reporting_columns: {
      Pingtung: 'Civil operations ceased on 2011-08-11 according to the CAA workbook note.',
      Hsinchu: 'The workbook column is retained by the source but is not normalized as an active civilian access airport.',
    },
    transformation: 'Official eAIP aerodrome reference point DMS coordinates converted to EPSG:4326 decimal degrees; official monthly observations retained without interpolation.',
  },
  features,
};

const geoText = `${JSON.stringify(geo, null, 2)}\n`;
const activityText = `${activityRecords.map((record) => JSON.stringify(record)).join('\n')}\n`;
const artifact = {
  schema_version: '0.1.0',
  artifact_id: 'artifact_twn_civilian_access_airports_2025_09_01',
  dataset_id: geo.metadata.dataset_id,
  artifacts: {
    airport_nodes: {
      path: path.basename(geoOutputPath),
      format: 'GeoJSON',
      crs: 'EPSG:4326',
      feature_count: features.length,
      coordinate_precision_m: 30,
      bounds,
      artifact_sha256: sha256(geoText),
    },
    monthly_activity: {
      path: path.basename(activityOutputPath),
      format: 'NDJSON',
      record_count: activityRecords.length,
      period_start: '2024-09',
      period_end: '2025-08',
      artifact_sha256: sha256(activityText),
    },
  },
  raw_source_sha256: {...expectedRawHashes, eaip_pages: expectedPageHashes},
  source_ids: sourceIds,
  transformations: [
    'Selected seventeen active civilian access airports from the official CAA activity workbook.',
    'Excluded the Pingtung and Hsinchu reporting columns rather than implying active civilian airport access.',
    'Converted official eAIP aerodrome reference point coordinates from DMS to decimal EPSG:4326.',
    'Retained exactly September 2024 through August 2025 and preserved zero activity observations.',
    'Preserved total passenger conservation for the three source columns that separately report transit and arrival or departure passengers.',
    'Derived trailing twelve month sums by addition only and did not infer capacity, readiness, or military use.',
  ],
  interpretation_warning: 'Civilian access and observed activity do not establish military use, military absence, exclusive ownership, target status, engineering capacity, or readiness.',
};

fs.mkdirSync(path.dirname(geoOutputPath), {recursive: true});
fs.writeFileSync(geoOutputPath, geoText);
fs.writeFileSync(activityOutputPath, activityText);
fs.writeFileSync(artifactOutputPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  status: 'PASS',
  airport_nodes: features.length,
  monthly_activity_records: activityRecords.length,
  activity_window: ['2024-09', '2025-08'],
  bounds,
  output_sha256: {airport_nodes: artifact.artifacts.airport_nodes.artifact_sha256, monthly_activity: artifact.artifacts.monthly_activity.artifact_sha256},
}, null, 2));
