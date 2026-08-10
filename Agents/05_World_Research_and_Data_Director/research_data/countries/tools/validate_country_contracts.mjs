#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BOOKMARK_ID = "bookmark_global_fracture_2025_09_01";
const BOOKMARK_TIME = "2025-09-01T00:00:00Z";
const TIER_A_CODES = new Set(["USA", "CHN", "TWN"]);
const REQUIRED_LANES = [
  "politics_and_institutions",
  "economy_trade_finance_resources",
  "military_organization_inventory",
  "fixed_facilities_basing",
  "strategic_industry_conversion",
  "energy_transport_communications_logistics",
  "geography_provinces_terrain",
  "crises_alliances_sanctions_deployments",
];
const ACCOUNTING_STATES = [
  "active",
  "committed",
  "in_transit",
  "training",
  "maintenance",
  "reserve",
  "stored",
  "under_construction",
  "damaged",
  "destroyed",
  "exported",
  "retired",
  "captured",
  "unknown",
];

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(scriptDirectory, "..");
const schemasRoot = path.resolve(countriesRoot, "..", "schemas");
const roster = readJson(path.join(countriesRoot, "top_80_2025", "top_80_2025_gdp.json"));
const registry = readJson(path.join(countriesRoot, "country_registry.json"));
const profileSchema = readJson(path.join(schemasRoot, "country_profile.schema.json"));
const ledgerSchema = readJson(path.join(schemasRoot, "force_ledger_manifest.schema.json"));
const errors = [];
let validatedProfiles = 0;
let validatedLedgers = 0;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasRequiredKeys(subject, schema, label) {
  for (const key of schema.required ?? []) {
    assert(Object.hasOwn(subject, key), `${label}: missing required field ${key}`);
  }
}

function sameMembers(actual, expected) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    expected.every((item) => actual.includes(item))
  );
}

function validatePathReferences(container, baseDirectory, label) {
  for (const [key, relativePath] of Object.entries(container ?? {})) {
    if (relativePath === null) continue;
    assert(typeof relativePath === "string" && relativePath.length > 0, `${label}: ${key} path is invalid`);
    if (typeof relativePath !== "string" || relativePath.length === 0) continue;
    assert(fs.existsSync(path.resolve(baseDirectory, relativePath)), `${label}: ${key} path does not resolve: ${relativePath}`);
  }
}

function validateReviewWindow(record, label) {
  if (!record.reviewed_at || !record.review_after) return;
  const reviewed = Date.parse(record.reviewed_at);
  const reviewAfter = Date.parse(record.review_after);
  assert(Number.isFinite(reviewed), `${label}: reviewed_at is invalid`);
  assert(Number.isFinite(reviewAfter), `${label}: review_after is invalid`);
  assert(reviewAfter >= reviewed, `${label}: review_after precedes reviewed_at`);
}

const registryByCode = new Map((registry.countries ?? []).map((country) => [country.country_code, country]));

for (const rosterCountry of roster.countries ?? []) {
  const code = rosterCountry.country_code;
  const label = `${code} profile`;
  const countryDirectory = path.join(countriesRoot, code.toLowerCase());
  const profilePath = path.join(countryDirectory, "profile.json");
  const registryCountry = registryByCode.get(code);

  assert(Boolean(registryCountry), `${label}: missing country registry entry`);
  assert(fs.existsSync(profilePath), `${label}: missing profile.json`);
  if (!registryCountry || !fs.existsSync(profilePath)) continue;

  const profile = readJson(profilePath);
  validatedProfiles += 1;
  hasRequiredKeys(profile, profileSchema, label);
  assert(profile.country_id === `country_${code.toLowerCase()}`, `${label}: country_id mismatch`);
  assert(profile.country_code === code, `${label}: country_code mismatch`);
  assert(profile.name === rosterCountry.name, `${label}: name differs from frozen roster`);
  assert(profile.bookmark_id === BOOKMARK_ID, `${label}: bookmark_id mismatch`);
  assert(profile.as_of === BOOKMARK_TIME, `${label}: as_of mismatch`);
  assert(profile.gdp_rank === rosterCountry.rank, `${label}: GDP rank mismatch`);
  assert(profile.gdp_2025_usd_billions === rosterCountry.gdp_2025_usd_billions, `${label}: GDP value mismatch`);
  assert(profile.depth_tier === registryCountry.depth_tier, `${label}: depth tier differs from registry`);
  assert(isObject(profile.coverage), `${label}: coverage must be an object`);
  assert(sameMembers(Object.keys(profile.coverage ?? {}), REQUIRED_LANES), `${label}: coverage lanes differ from contract`);

  for (const laneName of REQUIRED_LANES) {
    const lane = profile.coverage?.[laneName];
    assert(isObject(lane), `${label}: ${laneName} must be an object`);
    if (!isObject(lane)) continue;
    for (const countName of ["record_count", "source_count", "open_question_count"]) {
      assert(Number.isInteger(lane[countName]) && lane[countName] >= 0, `${label}: ${laneName}.${countName} must be a nonnegative integer`);
    }
    assert(typeof lane.notes === "string" && lane.notes.length > 0, `${label}: ${laneName} needs explanatory notes`);
  }

  assert(Array.isArray(profile.source_ids), `${label}: source_ids must be an array`);
  assert(new Set(profile.source_ids ?? []).size === (profile.source_ids ?? []).length, `${label}: source_ids contain duplicates`);
  assert(Array.isArray(profile.unknowns) && profile.unknowns.length > 0, `${label}: unknowns must remain explicit`);
  validatePathReferences(profile.dataset_paths, countryDirectory, label);

  if (!TIER_A_CODES.has(code)) {
    assert(profile.coverage_status === "shell", `${label}: non Tier A generated dossier must remain a shell`);
    assert(profile.dataset_paths?.force_ledger === null, `${label}: shell must not link an invented force ledger`);
    assert(profile.completeness?.force_ledger_status === "absent", `${label}: shell force ledger status must be absent`);
    continue;
  }

  validateReviewWindow(profile, label);
  assert(profile.dataset_paths?.force_ledger, `${label}: Tier A profile must link a force ledger`);
  if (!profile.dataset_paths?.force_ledger) continue;

  const ledgerPath = path.resolve(countryDirectory, profile.dataset_paths.force_ledger);
  assert(fs.existsSync(ledgerPath), `${label}: linked force ledger manifest is missing`);
  if (!fs.existsSync(ledgerPath)) continue;

  const ledger = readJson(ledgerPath);
  const ledgerLabel = `${code} force ledger`;
  const ledgerDirectory = path.dirname(ledgerPath);
  validatedLedgers += 1;
  hasRequiredKeys(ledger, ledgerSchema, ledgerLabel);
  assert(ledger.country_id === profile.country_id, `${ledgerLabel}: country_id differs from profile`);
  assert(ledger.bookmark_id === profile.bookmark_id, `${ledgerLabel}: bookmark_id differs from profile`);
  assert(ledger.as_of === profile.as_of, `${ledgerLabel}: as_of differs from profile`);
  assert(profile.completeness?.force_ledger_status === ledger.status, `${ledgerLabel}: profile status differs from manifest`);
  assert(sameMembers(ledger.accounting_states ?? [], ACCOUNTING_STATES), `${ledgerLabel}: accounting state universe differs from contract`);
  assert(Array.isArray(ledger.scope?.coverage_matrix) && ledger.scope.coverage_matrix.length > 0, `${ledgerLabel}: coverage matrix is empty`);
  assert(Array.isArray(ledger.source_ids) && ledger.source_ids.length > 0, `${ledgerLabel}: source_ids are empty`);
  assert(new Set(ledger.source_ids ?? []).size === (ledger.source_ids ?? []).length, `${ledgerLabel}: source_ids contain duplicates`);
  assert(Array.isArray(ledger.unknowns) && ledger.unknowns.length > 0, `${ledgerLabel}: unknowns are not explicit`);
  validatePathReferences(ledger.dataset_paths, ledgerDirectory, ledgerLabel);
  validateReviewWindow(ledger, ledgerLabel);

  const reconciliation = ledger.reconciliation ?? {};
  const partitionedInventory =
    (reconciliation.exact_quantity_records ?? 0) +
    (reconciliation.range_quantity_records ?? 0) +
    (reconciliation.unknown_quantity_records ?? 0);
  assert(partitionedInventory === reconciliation.inventory_records, `${ledgerLabel}: quantity state counts do not partition inventory records`);

  if (ledger.status !== "reconciled") {
    assert(ledger.acceptance?.research_complete === false, `${ledgerLabel}: incomplete ledger cannot claim research completeness`);
    assert(ledger.acceptance?.decision_usable === false, `${ledgerLabel}: incomplete ledger cannot claim decision usability`);
    assert(ledger.acceptance?.simulation_ready === false, `${ledgerLabel}: incomplete ledger cannot claim simulation readiness`);
  }
}

assert(validatedProfiles === 80, `Expected 80 validated country profiles, found ${validatedProfiles}`);
assert(validatedLedgers === 3, `Expected 3 validated Tier A force ledgers, found ${validatedLedgers}`);

const report = {
  status: errors.length ? "FAIL" : "PASS",
  validated_profiles: validatedProfiles,
  validated_tier_a_force_ledgers: validatedLedgers,
  bookmark_id: BOOKMARK_ID,
  bookmark_time: BOOKMARK_TIME,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
