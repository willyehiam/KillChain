#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const wharfZipPath = path.resolve(process.argv[2] ?? '/tmp/twn_wharf_main.zip');
const containerCsvPath = path.resolve(process.argv[3] ?? '/tmp/twn_ports_container.csv');
const vesselCsvPath = path.resolve(process.argv[4] ?? '/tmp/twn_ports_vessels.csv');
const geoOutputPath = path.resolve(process.argv[5] ?? path.join(directory, 'international_commercial_ports.geojson'));
const activityOutputPath = path.resolve(process.argv[6] ?? path.join(directory, 'port_activity_monthly_2024_09_to_2025_08.ndjson'));
const artifactOutputPath = path.resolve(process.argv[7] ?? path.join(directory, 'artifact_record.json'));

const bookmarkTime = '2025-09-01T00:00:00Z';
const activityStart = '202409';
const activityEnd = '202508';
const sourceIds = [
  'src_twn_moi_wharf_main_1150409',
  'src_twn_tipc_container_activity_8368',
  'src_twn_tipc_vessel_activity_8365',
];
const expectedRawHashes = {
  wharf: '58710be9102a6573485abf119bc89281ff18a515c550a4a049d881aeac549420',
  container: '34e3e4bf331314712210ea6470e1a6ecb83d37f06c7622674ca7b7c2cfe255e3',
  vessel: 'e1bf0564156e7c312511137308d869a5a9bac2750097a5973c29889e1b3bcc65',
};
const ports = [
  {slug: 'keelung', name: 'Port of Keelung', localName: '基隆港'},
  {slug: 'taipei', name: 'Port of Taipei', localName: '臺北港'},
  {slug: 'suao', name: "Port of Su'ao", localName: '蘇澳港'},
  {slug: 'taichung', name: 'Port of Taichung', localName: '臺中港'},
  {slug: 'kaohsiung', name: 'Port of Kaohsiung', localName: '高雄港'},
  {slug: 'anping', name: 'Port of Anping', localName: '安平港'},
  {slug: 'hualien', name: 'Port of Hualien', localName: '花蓮港'},
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

function parseDbf(bytes) {
  const recordCount = bytes.readUInt32LE(4);
  const headerLength = bytes.readUInt16LE(8);
  const recordLength = bytes.readUInt16LE(10);
  const fields = [];
  const decoder = new TextDecoder('utf-8');
  for (let offset = 32; offset < headerLength && bytes[offset] !== 0x0d; offset += 32) {
    const rawName = bytes.subarray(offset, offset + 11);
    const nul = rawName.indexOf(0);
    const name = decoder.decode(nul >= 0 ? rawName.subarray(0, nul) : rawName).trim();
    fields.push({name, type: String.fromCharCode(bytes[offset + 11]), length: bytes[offset + 16]});
  }
  const records = [];
  for (let recordIndex = 0; recordIndex < recordCount; recordIndex += 1) {
    const start = headerLength + recordIndex * recordLength;
    if (bytes[start] === 0x2a) continue;
    let cursor = start + 1;
    const record = {};
    for (const field of fields) {
      const raw = decoder.decode(bytes.subarray(cursor, cursor + field.length)).replace(/\0/g, '').trim();
      cursor += field.length;
      if (!raw) record[field.name] = null;
      else if (['N', 'F'].includes(field.type)) record[field.name] = Number(raw);
      else record[field.name] = raw;
    }
    records.push(record);
  }
  return records;
}

function parsePointShapefile(bytes) {
  assert(bytes.readInt32BE(0) === 9994, 'Unexpected shapefile file code');
  assert(bytes.readInt32LE(32) === 1, 'Wharf shapefile must contain Point geometry');
  const points = [];
  let offset = 100;
  while (offset < bytes.length) {
    assert(offset + 8 <= bytes.length, 'Truncated shapefile record header');
    const contentBytes = bytes.readInt32BE(offset + 4) * 2;
    const contentStart = offset + 8;
    assert(contentStart + contentBytes <= bytes.length, 'Truncated shapefile record content');
    const shapeType = bytes.readInt32LE(contentStart);
    if (shapeType === 1) points.push([bytes.readDoubleLE(contentStart + 4), bytes.readDoubleLE(contentStart + 12)]);
    else if (shapeType !== 0) throw new Error(`Unexpected shapefile record type ${shapeType}`);
    offset = contentStart + contentBytes;
  }
  return points;
}

function inverseTwd97Tm2([easting, northing]) {
  const a = 6378137;
  const inverseFlattening = 298.257222101;
  const flattening = 1 / inverseFlattening;
  const e2 = flattening * (2 - flattening);
  const ePrime2 = e2 / (1 - e2);
  const k0 = 0.9999;
  const falseEasting = 250000;
  const centralMeridian = 121 * Math.PI / 180;
  const x = easting - falseEasting;
  const m = northing / k0;
  const mu = m / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);
  const c1 = ePrime2 * cosPhi1 ** 2;
  const t1 = tanPhi1 ** 2;
  const n1 = a / Math.sqrt(1 - e2 * sinPhi1 ** 2);
  const r1 = a * (1 - e2) / (1 - e2 * sinPhi1 ** 2) ** 1.5;
  const d = x / (n1 * k0);
  const latitude = phi1 - (n1 * tanPhi1 / r1) * (
    d ** 2 / 2
    - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ePrime2) * d ** 4 / 24
    + (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ePrime2 - 3 * c1 ** 2) * d ** 6 / 720
  );
  const longitude = centralMeridian + (
    d
    - (1 + 2 * t1 + c1) * d ** 3 / 6
    + (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ePrime2 + 24 * t1 ** 2) * d ** 5 / 120
  ) / cosPhi1;
  return [round(longitude * 180 / Math.PI), round(latitude * 180 / Math.PI)];
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  const [headers, ...body] = rows;
  assert(headers?.length > 0, 'CSV has no header');
  headers[0] = headers[0].replace(/^\ufeff/, '');
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function activityNumber(value, context) {
  const number = Number(value);
  assert(Number.isFinite(number) && number >= 0, `${context}: invalid activity value ${value}`);
  return number;
}

const wharfBytes = readAndVerify(wharfZipPath, expectedRawHashes.wharf, 'wharf source');
const containerBytes = readAndVerify(containerCsvPath, expectedRawHashes.container, 'container source');
const vesselBytes = readAndVerify(vesselCsvPath, expectedRawHashes.vessel, 'vessel source');
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'killweb-twn-ports-'));
const unzipResult = spawnSync('unzip', ['-q', wharfZipPath, '-d', temporaryDirectory], {encoding: 'utf8'});
assert(unzipResult.status === 0, `Unable to extract wharf source: ${unzipResult.stderr}`);
const extracted = fs.readdirSync(temporaryDirectory);
const shpPath = path.join(temporaryDirectory, extracted.find((name) => name.endsWith('.shp')) ?? '');
const dbfPath = path.join(temporaryDirectory, extracted.find((name) => name.endsWith('.dbf')) ?? '');
assert(fs.existsSync(shpPath) && fs.existsSync(dbfPath), 'Wharf source is missing SHP or DBF content');
const wharfProperties = parseDbf(fs.readFileSync(dbfPath));
const wharfPoints = parsePointShapefile(fs.readFileSync(shpPath));
assert(wharfProperties.length === wharfPoints.length, 'Wharf geometry and property counts differ');

const wharfByName = new Map();
for (let index = 0; index < wharfProperties.length; index += 1) {
  const properties = wharfProperties[index];
  if (ports.some((port) => port.localName === properties.MARKNAME1)) {
    assert(!wharfByName.has(properties.MARKNAME1), `Duplicate wharf name ${properties.MARKNAME1}`);
    wharfByName.set(properties.MARKNAME1, {properties, projectedPoint: wharfPoints[index]});
  }
}

const big5 = new TextDecoder('big5');
const containerRows = parseCsv(big5.decode(containerBytes));
const vesselRows = parseCsv(big5.decode(vesselBytes));
const selectedContainerRows = containerRows.filter((row) => row['\u5e74\u6708'] >= activityStart && row['\u5e74\u6708'] <= activityEnd && ports.some((port) => port.localName === row['\u6e2f\u53e3\u5225']));
const selectedVesselRows = vesselRows.filter((row) => row['\u5e74\u6708'] >= activityStart && row['\u5e74\u6708'] <= activityEnd && ports.some((port) => port.localName === row['\u6e2f\u53e3\u5225']));
assert(selectedContainerRows.length === 84, `Expected 84 container rows, found ${selectedContainerRows.length}`);
assert(selectedVesselRows.length === 84, `Expected 84 vessel rows, found ${selectedVesselRows.length}`);
const containerByKey = new Map(selectedContainerRows.map((row) => [`${row['\u6e2f\u53e3\u5225']}|${row['\u5e74\u6708']}`, row]));
const vesselByKey = new Map(selectedVesselRows.map((row) => [`${row['\u6e2f\u53e3\u5225']}|${row['\u5e74\u6708']}`, row]));

const activityRecords = [];
for (const port of ports) {
  for (let year = 2024, month = 9; year < 2025 || month <= 8;) {
    const periodCompact = `${year}${String(month).padStart(2, '0')}`;
    const period = `${year}-${String(month).padStart(2, '0')}`;
    const key = `${port.localName}|${periodCompact}`;
    const container = containerByKey.get(key);
    const vessel = vesselByKey.get(key);
    assert(container && vessel, `${key}: incomplete activity pair`);
    activityRecords.push({
      activity_record_id: `activity_twn_port_${port.slug}_${periodCompact}`,
      port_id: `infrastructure_twn_port_${port.slug}`,
      period,
      period_kind: 'calendar_month',
      container_throughput_teu: {
        total: activityNumber(container['\u7e3d\u8a08'], `${key} container total`),
        inbound: activityNumber(container['\u9032\u6e2f'], `${key} container inbound`),
        outbound: activityNumber(container['\u51fa\u6e2f'], `${key} container outbound`),
      },
      vessel_activity: {
        inbound_calls: activityNumber(vessel['\u9032\u6e2f\u8258\u6b21-\u7e3d\u8a08'], `${key} inbound calls`),
        inbound_gross_tonnage: activityNumber(vessel['\u9032\u6e2f\u7e3d\u5678\u4f4d-\u7e3d\u8a08'], `${key} inbound gross tonnage`),
        outbound_calls: activityNumber(vessel['\u51fa\u6e2f\u8258\u6b21-\u7e3d\u8a08'], `${key} outbound calls`),
        outbound_gross_tonnage: activityNumber(vessel['\u51fa\u6e2f\u7e3d\u5678\u4f4d-\u7e3d\u8a08'], `${key} outbound gross tonnage`),
      },
      interpretation: 'Observed monthly civilian port activity; not maximum capacity.',
      as_of: bookmarkTime,
      source_ids: [sourceIds[1], sourceIds[2]],
    });
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
  }
}

function sumActivity(portId, field, child = null) {
  return activityRecords.filter((record) => record.port_id === portId).reduce((sum, record) => {
    const value = child ? record[field][child] : record[field];
    return sum + value;
  }, 0);
}

const features = ports.map((port) => {
  const source = wharfByName.get(port.localName);
  assert(source, `Missing official wharf point for ${port.localName}`);
  const updated = String(source.properties.UPD_YYYYMM ?? '');
  assert(/^\d{6}$/.test(updated) && updated <= activityEnd, `${port.localName}: postbookmark or invalid source update month ${updated}`);
  assert(source.properties.MARKTYPE1 === '9960401', `${port.localName}: source type is not commercial port`);
  const portId = `infrastructure_twn_port_${port.slug}`;
  return {
    type: 'Feature',
    id: portId,
    properties: {
      feature_id: portId,
      name: port.name,
      local_name: port.localName,
      facility_type: 'international_commercial_port',
      infrastructure_domain: 'maritime_logistics',
      civilian_infrastructure: true,
      military_facility: false,
      operational_use: ['trade', 'civilian_logistics', 'maritime_access'],
      source_mark_id: source.properties.MARKID,
      source_mark_type: source.properties.MARKTYPE1,
      source_updated_yyyymm: updated,
      source_address: source.properties.ADDRESS,
      source_epsg: source.properties.EPSGCode,
      source_projected_coordinate: source.projectedPoint.map((value) => round(value, 6)),
      location_method: 'official_landmark_point_reprojected_from_epsg_3826',
      coordinate_precision_m: 100,
      activity_baseline: {
        window_start: '2024-09',
        window_end: '2025-08',
        months: 12,
        container_throughput_teu: {
          total: sumActivity(portId, 'container_throughput_teu', 'total'),
          inbound: sumActivity(portId, 'container_throughput_teu', 'inbound'),
          outbound: sumActivity(portId, 'container_throughput_teu', 'outbound'),
        },
        vessel_activity: {
          inbound_calls: sumActivity(portId, 'vessel_activity', 'inbound_calls'),
          outbound_calls: sumActivity(portId, 'vessel_activity', 'outbound_calls'),
          inbound_gross_tonnage: sumActivity(portId, 'vessel_activity', 'inbound_gross_tonnage'),
          outbound_gross_tonnage: sumActivity(portId, 'vessel_activity', 'outbound_gross_tonnage'),
        },
        interpretation: 'Observed trailing twelve month activity, not maximum capacity.',
      },
      as_of: bookmarkTime,
      review_after: '2026-11-07',
      source_ids: [...sourceIds],
      representation_note: 'Civilian logistics node. Inclusion does not assert military use, target status, damage state, or combat authorization.',
    },
    geometry: {type: 'Point', coordinates: inverseTwd97Tm2(source.projectedPoint)},
  };
});

const geo = {
  type: 'FeatureCollection',
  name: 'Taiwan international commercial port access nodes at the 2025-09-01 bookmark',
  crs: {type: 'name', properties: {name: 'EPSG:4326'}},
  metadata: {
    dataset_id: 'dataset_twn_international_commercial_ports_2025_09_01',
    country_code: 'TWN',
    feature_count: features.length,
    coordinate_precision_m: 100,
    activity_window_start: '2024-09',
    activity_window_end: '2025-08',
    as_of: bookmarkTime,
    review_after: '2026-11-07',
    source_ids: [...sourceIds],
    raw_source_sha256: {...expectedRawHashes},
    transformation: 'Selected the seven officially identified international commercial port records, rejected postbookmark record updates, reprojected EPSG:3826 source points to EPSG:4326, and joined twelve complete prebookmark activity months by exact official port name.',
  },
  features,
};

const geoText = `${JSON.stringify(geo)}\n`;
const activityText = `${activityRecords.map((record) => JSON.stringify(record)).join('\n')}\n`;
fs.writeFileSync(geoOutputPath, geoText);
fs.writeFileSync(activityOutputPath, activityText);
const coordinates = features.map((feature) => feature.geometry.coordinates);
const artifact = {
  schema_version: '0.1.0',
  artifact_id: 'artifact_twn_international_commercial_ports_2025_09_01',
  dataset_id: geo.metadata.dataset_id,
  artifacts: {
    port_nodes: {
      path: 'international_commercial_ports.geojson',
      format: 'GeoJSON',
      crs: 'EPSG:4326',
      feature_count: features.length,
      coordinate_precision_m: 100,
      bounds: [
        Math.min(...coordinates.map(([longitude]) => longitude)),
        Math.min(...coordinates.map(([, latitude]) => latitude)),
        Math.max(...coordinates.map(([longitude]) => longitude)),
        Math.max(...coordinates.map(([, latitude]) => latitude)),
      ],
      artifact_sha256: sha256(Buffer.from(geoText)),
    },
    monthly_activity: {
      path: 'port_activity_monthly_2024_09_to_2025_08.ndjson',
      format: 'NDJSON',
      record_count: activityRecords.length,
      period_start: '2024-09',
      period_end: '2025-08',
      artifact_sha256: sha256(Buffer.from(activityText)),
    },
  },
  raw_source_sha256: {...expectedRawHashes},
  source_ids: [...sourceIds],
  transformations: [
    'Selected only the seven international commercial ports named by the port authority datasets.',
    'Rejected any geometry record with a source update month after August 2025.',
    'Reprojected official point coordinates from EPSG:3826 to EPSG:4326 without inventing or hand placing locations.',
    'Decoded Big5 activity resources and retained exactly twelve months from September 2024 through August 2025.',
    'Preserved monthly observations and derived trailing twelve month sums by addition only.',
  ],
  interpretation_warning: 'Civilian access and observed activity do not establish military use, target status, engineering capacity, or damage susceptibility.',
};
fs.writeFileSync(artifactOutputPath, `${JSON.stringify(artifact, null, 2)}\n`);
fs.rmSync(temporaryDirectory, {recursive: true, force: true});

console.log(JSON.stringify({
  status: 'PASS',
  port_nodes: features.length,
  monthly_activity_records: activityRecords.length,
  geo_sha256: artifact.artifacts.port_nodes.artifact_sha256,
  activity_sha256: artifact.artifacts.monthly_activity.artifact_sha256,
}, null, 2));
