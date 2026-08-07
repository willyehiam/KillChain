#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(process.argv[2] ?? '/tmp/twn_counties_20250318.geojson');
const outputPath = path.resolve(process.argv[3] ?? path.join(directory, 'admin_level_1_counties_1140318.geojson'));
const sourceIds = [
  'src_twn_moi_county_boundaries_1140318',
  'src_twn_arcgis_county_boundaries_1140318',
];

const upstreamBytes = fs.readFileSync(inputPath);
const upstreamSha256 = crypto.createHash('sha256').update(upstreamBytes).digest('hex');
const upstream = JSON.parse(upstreamBytes.toString('utf8'));

if (upstream.type !== 'FeatureCollection' || !Array.isArray(upstream.features)) {
  throw new Error('Input must be a GeoJSON FeatureCollection');
}
if (upstream.features.length !== 22) {
  throw new Error(`Expected 22 county and city features, found ${upstream.features.length}`);
}

const features = upstream.features
  .map((feature) => {
    const properties = feature.properties ?? {};
    const countyCode = String(properties.COUNTYCODE ?? '');
    if (!/^\d{5}$/.test(countyCode)) throw new Error(`Invalid COUNTYCODE ${JSON.stringify(countyCode)}`);
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) {
      throw new Error(`${countyCode}: expected Polygon or MultiPolygon geometry`);
    }
    return {
      type: 'Feature',
      id: `geo_twn_admin1_${countyCode}`,
      properties: {
        feature_id: `geo_twn_admin1_${countyCode}`,
        name: properties.COUNTYENG,
        local_name: properties.COUNTYNAME,
        feature_type: 'administrative_boundary',
        administrative_level: 1,
        country_codes: ['TWN'],
        county_id: properties.COUNTYID,
        county_code: countyCode,
        county_name: properties.COUNTYNAME,
        county_english_name: properties.COUNTYENG,
        source_feature_id: properties.FID,
        source_shape_area: properties.Shape__Area,
        source_shape_length: properties.Shape__Length,
        source_ids: [...sourceIds],
        valid_from: '2025-03-18',
        as_of: '2025-09-01T00:00:00Z',
        review_after: '2026-11-07',
        representation_note: 'Official Taiwan administrative geometry; inclusion does not adjudicate sovereignty or maritime jurisdiction.',
      },
      geometry: feature.geometry,
    };
  })
  .sort((left, right) => left.properties.county_code.localeCompare(right.properties.county_code));

const output = {
  type: 'FeatureCollection',
  name: 'Taiwan first order administrative boundaries 1140318',
  crs: {type: 'name', properties: {name: 'EPSG:4326'}},
  metadata: {
    dataset_id: 'dataset_twn_admin1_boundaries_1140318',
    dataset_version: '1140318',
    country_code: 'TWN',
    administrative_level: 1,
    feature_count: features.length,
    coordinate_precision_m: 100,
    valid_from: '2025-03-18',
    as_of: '2025-09-01T00:00:00Z',
    review_after: '2026-11-07',
    source_ids: [...sourceIds],
    upstream_response_sha256: upstreamSha256,
    transformation: 'Reprojected upstream query response requested in EPSG:4326. Coordinates are preserved byte for number with no simplification. Features are sorted and properties are normalized.',
  },
  features,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output)}\n`);
const artifactSha256 = crypto.createHash('sha256').update(fs.readFileSync(outputPath)).digest('hex');
console.log(JSON.stringify({
  status: 'PASS',
  input_path: inputPath,
  output_path: outputPath,
  feature_count: features.length,
  upstream_sha256: upstreamSha256,
  artifact_sha256: artifactSha256,
}, null, 2));
