#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ID_PATTERN = /^[a-z0-9][a-z0-9_:-]*$/;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const DATE_FIELDS = new Set([
  "published_at",
  "observed_from",
  "observed_to",
  "observed_at",
  "accessed_at",
  "valid_from",
  "valid_to",
  "reviewed_at",
  "review_after",
  "last_reviewed",
  "effective_from",
  "effective_to",
]);

function fail(errors, message) {
  errors.push(message);
}

function readJson(file, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(errors, `${file}: ${error.message}`);
    return null;
  }
}

function readNdjson(file, errors) {
  const records = [];
  const text = fs.readFileSync(file, "utf8");
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    if (!raw.trim()) continue;
    try {
      records.push(JSON.parse(raw));
    } catch (error) {
      fail(errors, `${file}:${index + 1}: ${error.message}`);
    }
  }
  return records;
}

function uniqueIds(records, key, label, errors) {
  const ids = new Set();
  for (const record of records) {
    const id = record[key];
    if (!id) fail(errors, `${label}: missing ${key}`);
    else if (!ID_PATTERN.test(id)) fail(errors, `${label}: invalid identifier ${id}`);
    else if (ids.has(id)) fail(errors, `${label}: duplicate identifier ${id}`);
    else ids.add(id);
  }
  return ids;
}

function requireFields(records, fields, label, errors) {
  for (const record of records) {
    for (const field of fields) {
      if (record[field] === undefined) {
        fail(errors, `${label} ${JSON.stringify(record)}: missing ${field}`);
      }
    }
  }
}

function validateDateFields(value, label, errors) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateDateFields(entry, `${label}[${index}]`, errors));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (DATE_FIELDS.has(key)) {
      if (typeof entry !== "string" || !ISO_PATTERN.test(entry)) {
        fail(errors, `${label}.${key}: invalid ISO date or timestamp ${JSON.stringify(entry)}`);
      }
    } else {
      validateDateFields(entry, `${label}.${key}`, errors);
    }
  }
}

function validateGeoJson(geo, errors) {
  if (!geo || geo.type !== "FeatureCollection") {
    fail(errors, "exercise_zones.geojson: expected FeatureCollection");
    return;
  }
  for (const feature of geo.features ?? []) {
    if (feature.geometry?.type !== "Polygon") {
      fail(errors, `${feature.id ?? "unknown feature"}: expected Polygon`);
      continue;
    }
    const ring = feature.geometry.coordinates?.[0] ?? [];
    if (ring.length < 4) fail(errors, `${feature.id}: polygon ring is too short`);
    if (JSON.stringify(ring[0]) !== JSON.stringify(ring.at(-1))) {
      fail(errors, `${feature.id}: polygon ring is not closed`);
    }
    for (const coordinate of ring) {
      const [longitude, latitude] = coordinate;
      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        fail(errors, `${feature.id}: coordinate out of bounds ${coordinate}`);
      }
    }
  }
}

function validateJusticeMission(directory, errors, report) {
  const manifest = readJson(path.join(directory, "manifest.json"), errors);
  const sources = readNdjson(path.join(directory, "sources.ndjson"), errors);
  const claims = readNdjson(path.join(directory, "claims.ndjson"), errors);
  const contradictions = readNdjson(path.join(directory, "contradictions.ndjson"), errors);
  const force = readJson(path.join(directory, "force_measures.json"), errors);
  const geo = readJson(path.join(directory, "exercise_zones.geojson"), errors);

  const sourceIds = uniqueIds(sources, "source_id", "source", errors);
  const claimIds = uniqueIds(claims, "claim_id", "claim", errors);
  const contradictionIds = uniqueIds(
    contradictions,
    "contradiction_set_id",
    "contradiction",
    errors,
  );
  const observationIds = uniqueIds(force?.observations ?? [], "observation_id", "observation", errors);

  requireFields(sources, ["title", "publisher", "accessed_at", "source_tier", "source_type"], "source", errors);
  requireFields(claims, ["subject_id", "predicate", "value", "evidence_state", "confidence", "source_ids"], "claim", errors);

  validateDateFields(manifest, "manifest", errors);
  validateDateFields(sources, "sources", errors);
  validateDateFields(claims, "claims", errors);
  validateDateFields(contradictions, "contradictions", errors);
  validateDateFields(force, "force_measures", errors);
  validateDateFields(geo, "exercise_zones", errors);

  for (const claim of claims) {
    for (const sourceId of claim.source_ids ?? []) {
      if (!sourceIds.has(sourceId)) fail(errors, `${claim.claim_id}: unknown source ${sourceId}`);
    }
  }
  for (const contradiction of contradictions) {
    if ((contradiction.claim_ids ?? []).length < 2) {
      fail(errors, `${contradiction.contradiction_set_id}: fewer than two claims`);
    }
    for (const claimId of contradiction.claim_ids ?? []) {
      if (!claimIds.has(claimId)) fail(errors, `${contradiction.contradiction_set_id}: unknown claim ${claimId}`);
    }
    for (const sourceId of contradiction.source_ids ?? []) {
      if (!sourceIds.has(sourceId)) fail(errors, `${contradiction.contradiction_set_id}: unknown source ${sourceId}`);
    }
  }
  for (const sourceId of manifest?.source_ids ?? []) {
    if (!sourceIds.has(sourceId)) fail(errors, `manifest: unknown source ${sourceId}`);
  }
  for (const contradictionId of manifest?.open_contradiction_ids ?? []) {
    if (!contradictionIds.has(contradictionId)) fail(errors, `manifest: unknown contradiction ${contradictionId}`);
  }
  for (const derived of force?.derived_measures ?? []) {
    for (const observationId of derived.input_observation_ids ?? []) {
      if (!observationIds.has(observationId)) fail(errors, `${derived.derived_id}: unknown observation ${observationId}`);
    }
  }

  validateGeoJson(geo, errors);
  if ((geo?.features ?? []).length !== 5) {
    fail(errors, `exercise_zones.geojson: expected five initial zones, found ${geo?.features?.length ?? 0}`);
  }

  Object.assign(report, {
    sources: sources.length,
    claims: claims.length,
    contradictions: contradictions.length,
    force_observations: force?.observations?.length ?? 0,
    derived_measures: force?.derived_measures?.length ?? 0,
    zones: geo?.features?.length ?? 0,
  });
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const researchRoot = path.resolve(process.argv[2] ?? path.join(scriptDirectory, ".."));
const benchmark = path.join(
  researchRoot,
  "theaters",
  "fully_modeled",
  "china_taiwan_south_china_sea",
  "justice_mission_2025",
);
const errors = [];
const report = { benchmark };

if (!fs.existsSync(benchmark)) {
  fail(errors, `Justice Mission benchmark not found at ${benchmark}`);
} else {
  validateJusticeMission(benchmark, errors, report);
}

if (errors.length) {
  console.error(JSON.stringify({ status: "FAIL", ...report, errors }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: "PASS", ...report, errors: [] }, null, 2));
}
