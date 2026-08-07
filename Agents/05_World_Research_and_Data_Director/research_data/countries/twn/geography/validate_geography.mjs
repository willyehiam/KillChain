#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const bookmarkTime = '2025-09-01T00:00:00Z';
const sourceIds = [
  'src_twn_moi_county_boundaries_1140318',
  'src_twn_arcgis_county_boundaries_1140318',
];
const canonicalUpstreamSha256 = '7e3d24cb13b7f1125c1c967d9d436ee556567516b0eb9894cfa3e763fe8874dd';
const canonicalArtifactSha256 = '730b75da6f62abe5fcce889b45c640169df077cdff4eeb18e5e8840c7b022d39';
const canonicalStatistics = {
  feature_count: 22,
  coordinate_count: 332079,
  ring_count: 697,
  polygon_count: 696,
  geometry_type_counts: {Polygon: 12, MultiPolygon: 10},
  bounds: [114.359282472, 10.371347663, 124.561158025, 26.385275262],
};
const expectedCounties = new Map([
  ['09007', ['Z', '連江縣', 'Lienchiang County']],
  ['09020', ['W', '金門縣', 'Kinmen County']],
  ['10002', ['G', '宜蘭縣', 'Yilan County']],
  ['10004', ['J', '新竹縣', 'Hsinchu County']],
  ['10005', ['K', '苗栗縣', 'Miaoli County']],
  ['10007', ['N', '彰化縣', 'Changhua County']],
  ['10008', ['M', '南投縣', 'Nantou County']],
  ['10009', ['P', '雲林縣', 'Yunlin County']],
  ['10010', ['Q', '嘉義縣', 'Chiayi County']],
  ['10013', ['T', '屏東縣', 'Pingtung County']],
  ['10014', ['V', '臺東縣', 'Taitung County']],
  ['10015', ['U', '花蓮縣', 'Hualien County']],
  ['10016', ['X', '澎湖縣', 'Penghu County']],
  ['10017', ['C', '基隆市', 'Keelung City']],
  ['10018', ['O', '新竹市', 'Hsinchu City']],
  ['10020', ['I', '嘉義市', 'Chiayi City']],
  ['63000', ['A', '臺北市', 'Taipei City']],
  ['64000', ['E', '高雄市', 'Kaohsiung City']],
  ['65000', ['F', '新北市', 'New Taipei City']],
  ['66000', ['B', '臺中市', 'Taichung City']],
  ['67000', ['D', '臺南市', 'Tainan City']],
  ['68000', ['H', '桃園市', 'Taoyuan City']],
]);

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const add = (errors, condition, message) => { if (!condition) errors.push(message); };

function parseNdjson(text) {
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function validateRing(ring, context, errors, statistics) {
  add(errors, Array.isArray(ring) && ring.length >= 4, `${context}: ring must contain at least four positions`);
  if (!Array.isArray(ring)) return;
  statistics.ring_count += 1;
  for (const [index, coordinate] of ring.entries()) {
    add(errors, Array.isArray(coordinate) && coordinate.length >= 2, `${context}[${index}]: invalid position`);
    if (!Array.isArray(coordinate) || coordinate.length < 2) continue;
    const [longitude, latitude] = coordinate;
    add(errors, Number.isFinite(longitude) && Number.isFinite(latitude), `${context}[${index}]: coordinates must be finite`);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;
    add(errors, longitude >= 114 && longitude <= 125, `${context}[${index}]: longitude is outside the published layer envelope`);
    add(errors, latitude >= 10 && latitude <= 27, `${context}[${index}]: latitude is outside the published layer envelope`);
    statistics.coordinate_count += 1;
    statistics.bounds[0] = Math.min(statistics.bounds[0], longitude);
    statistics.bounds[1] = Math.min(statistics.bounds[1], latitude);
    statistics.bounds[2] = Math.max(statistics.bounds[2], longitude);
    statistics.bounds[3] = Math.max(statistics.bounds[3], latitude);
  }
  if (ring.length >= 2) add(errors, sameJson(ring[0], ring.at(-1)), `${context}: ring is not closed`);
}

export function geometryStatistics(geo, errors = []) {
  const statistics = {
    feature_count: Array.isArray(geo?.features) ? geo.features.length : 0,
    coordinate_count: 0,
    ring_count: 0,
    polygon_count: 0,
    geometry_type_counts: {Polygon: 0, MultiPolygon: 0},
    bounds: [Infinity, Infinity, -Infinity, -Infinity],
  };
  for (const [featureIndex, feature] of (geo?.features ?? []).entries()) {
    const geometry = feature.geometry;
    if (!['Polygon', 'MultiPolygon'].includes(geometry?.type)) continue;
    statistics.geometry_type_counts[geometry.type] += 1;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    add(errors, Array.isArray(polygons) && polygons.length > 0, `feature ${featureIndex}: geometry has no polygons`);
    for (const [polygonIndex, polygon] of (polygons ?? []).entries()) {
      statistics.polygon_count += 1;
      add(errors, Array.isArray(polygon) && polygon.length > 0, `feature ${featureIndex} polygon ${polygonIndex}: polygon has no rings`);
      for (const [ringIndex, ring] of (polygon ?? []).entries()) {
        validateRing(ring, `feature ${featureIndex} polygon ${polygonIndex} ring ${ringIndex}`, errors, statistics);
      }
    }
  }
  return statistics;
}

export function validateGeographyPacket({geo, geoText, manifest, artifact, sources, strictCanonical = true}) {
  const errors = [];
  add(errors, geo?.type === 'FeatureCollection', 'geometry artifact must be a FeatureCollection');
  add(errors, geo?.crs?.properties?.name === 'EPSG:4326', 'geometry artifact CRS must be EPSG:4326');
  add(errors, geo?.metadata?.dataset_id === manifest?.dataset_id, 'geometry and manifest dataset identifiers differ');
  add(errors, geo?.metadata?.dataset_version === '1140318', 'geometry dataset version must be 1140318');
  add(errors, geo?.metadata?.as_of === bookmarkTime, 'geometry artifact does not describe the opening bookmark');
  add(errors, geo?.metadata?.valid_from === '2025-03-18', 'geometry valid_from must preserve source version date');
  add(errors, geo?.metadata?.coordinate_precision_m === 100, 'operational coordinate precision must remain 100 meters');
  add(errors, sameJson(geo?.metadata?.source_ids, sourceIds), 'geometry source references changed');
  add(errors, geo?.metadata?.upstream_response_sha256 === canonicalUpstreamSha256, 'geometry upstream response hash changed');
  add(errors, geo?.metadata?.transformation?.includes('no simplification'), 'geometry must state that no simplification occurred');

  add(errors, manifest?.dataset_id === 'dataset_twn_admin1_boundaries_1140318', 'unexpected geography dataset identifier');
  add(errors, manifest?.version === '1140318', 'manifest version changed');
  add(errors, manifest?.status === 'collecting', 'geography lane may not self promote beyond collecting');
  add(errors, manifest?.coverage?.valid_from === '2025-03-18', 'manifest valid_from changed');
  add(errors, sameJson(manifest?.source_ids, sourceIds), 'manifest source references changed');
  add(errors, (manifest?.known_gaps?.length ?? 0) >= 3, 'manifest must preserve geographic coverage gaps');

  add(errors, artifact?.dataset_id === manifest?.dataset_id, 'artifact record and manifest dataset identifiers differ');
  add(errors, artifact?.path === 'admin_level_1_counties_1140318.geojson', 'artifact path changed');
  add(errors, artifact?.crs === 'EPSG:4326', 'artifact record CRS changed');
  add(errors, artifact?.coordinate_precision_m === 100, 'artifact precision changed');
  add(errors, artifact?.upstream_response_sha256 === canonicalUpstreamSha256, 'artifact upstream hash changed');
  add(errors, sameJson(artifact?.source_ids, sourceIds), 'artifact source references changed');
  add(errors, Date.parse(artifact?.source_item_created_at) <= Date.parse(bookmarkTime), 'retrieval mirror was created after the bookmark');
  add(errors, Date.parse(artifact?.source_item_modified_at) <= Date.parse(bookmarkTime), 'retrieval mirror was modified after the bookmark');
  add(errors, artifact?.transformations?.some((entry) => entry.includes('without simplification')), 'artifact transformation ledger must prohibit simplification');
  add(errors, artifact?.representation_warning?.includes('does not adjudicate sovereignty'), 'artifact must preserve contested territory warning');

  const sourceById = new Map((sources ?? []).map((source) => [source.source_id, source]));
  add(errors, sourceById.size === 2, 'exactly two geography source records are required');
  for (const sourceId of sourceIds) add(errors, sourceById.has(sourceId), `missing source ${sourceId}`);
  const officialSource = sourceById.get(sourceIds[0]);
  const mirrorSource = sourceById.get(sourceIds[1]);
  add(errors, officialSource?.source_tier === 'A', 'official publisher must remain a Tier A source');
  add(errors, officialSource?.dataset_version === '1140318', 'official source version changed');
  add(errors, officialSource?.bookmark_evidence_status === 'prebookmark_available', 'official source lost prebookmark evidence status');
  add(errors, mirrorSource?.source_tier === 'B', 'retrieval mirror must remain a Tier B source');
  add(errors, sameJson(mirrorSource?.derived_from_source_ids, [sourceIds[0]]), 'mirror derivation does not resolve to the official source');
  add(errors, mirrorSource?.source_sha256 === canonicalUpstreamSha256, 'mirror response hash changed');
  add(errors, mirrorSource?.bookmark_evidence_status === 'prebookmark_available', 'mirror lost prebookmark evidence status');
  add(errors, Date.parse(mirrorSource?.published_at) <= Date.parse(bookmarkTime), 'mirror source is postbookmark');

  const countyCodes = new Set();
  const sourceFeatureIds = new Set();
  for (const [index, feature] of (geo?.features ?? []).entries()) {
    const properties = feature.properties ?? {};
    const countyCode = properties.county_code;
    const expected = expectedCounties.get(countyCode);
    add(errors, feature.type === 'Feature', `feature ${index}: record type must be Feature`);
    add(errors, Boolean(expected), `feature ${index}: unexpected county code ${countyCode}`);
    add(errors, !countyCodes.has(countyCode), `feature ${index}: duplicate county code ${countyCode}`);
    countyCodes.add(countyCode);
    add(errors, !sourceFeatureIds.has(properties.source_feature_id), `feature ${index}: duplicate source feature id`);
    sourceFeatureIds.add(properties.source_feature_id);
    add(errors, feature.id === `geo_twn_admin1_${countyCode}`, `feature ${index}: unstable feature id`);
    add(errors, properties.feature_id === feature.id, `feature ${index}: property and feature ids differ`);
    add(errors, properties.feature_type === 'administrative_boundary', `feature ${index}: feature type changed`);
    add(errors, properties.administrative_level === 1, `feature ${index}: administrative level changed`);
    add(errors, sameJson(properties.country_codes, ['TWN']), `feature ${index}: country code changed`);
    add(errors, sameJson(properties.source_ids, sourceIds), `feature ${index}: provenance references changed`);
    add(errors, properties.as_of === bookmarkTime, `feature ${index}: bookmark time changed`);
    add(errors, properties.valid_from === '2025-03-18', `feature ${index}: valid_from changed`);
    add(errors, properties.representation_note?.includes('does not adjudicate sovereignty'), `feature ${index}: sovereignty warning missing`);
    if (expected) {
      add(errors, properties.county_id === expected[0], `${countyCode}: county id changed`);
      add(errors, properties.county_name === expected[1], `${countyCode}: local name changed`);
      add(errors, properties.county_english_name === expected[2], `${countyCode}: English name changed`);
      add(errors, properties.local_name === expected[1], `${countyCode}: normalized local name changed`);
      add(errors, properties.name === expected[2], `${countyCode}: normalized English name changed`);
    }
    add(errors, ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type), `${countyCode}: geometry type is not polygonal`);
  }
  add(errors, countyCodes.size === expectedCounties.size, `expected ${expectedCounties.size} unique counties, found ${countyCodes.size}`);
  for (const countyCode of expectedCounties.keys()) add(errors, countyCodes.has(countyCode), `missing county ${countyCode}`);

  const statistics = geometryStatistics(geo, errors);
  for (const field of ['feature_count', 'coordinate_count', 'ring_count', 'polygon_count', 'geometry_type_counts', 'bounds']) {
    add(errors, sameJson(statistics[field], artifact?.[field]), `artifact ${field} does not match geometry`);
    if (strictCanonical) add(errors, sameJson(statistics[field], canonicalStatistics[field]), `canonical ${field} changed`);
  }
  const calculatedArtifactSha256 = sha256(geoText);
  add(errors, calculatedArtifactSha256 === artifact?.artifact_sha256, 'artifact SHA256 does not match geometry bytes');
  if (strictCanonical) add(errors, calculatedArtifactSha256 === canonicalArtifactSha256, 'canonical artifact SHA256 changed');
  return {status: errors.length ? 'FAIL' : 'PASS', statistics, errors};
}

export function readCanonicalPacket() {
  const geometryPath = path.join(directory, 'admin_level_1_counties_1140318.geojson');
  const geoText = fs.readFileSync(geometryPath, 'utf8');
  return {
    geo: JSON.parse(geoText),
    geoText,
    manifest: JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8')),
    artifact: JSON.parse(fs.readFileSync(path.join(directory, 'artifact_record.json'), 'utf8')),
    sources: parseNdjson(fs.readFileSync(path.join(directory, 'sources.ndjson'), 'utf8')),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = validateGeographyPacket({...readCanonicalPacket(), strictCanonical: true});
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}
