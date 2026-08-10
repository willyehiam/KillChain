#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(scriptDirectory, "..");
const wave = readJson(path.join(countriesRoot, "tier_b_wave_one.json"));
const registry = readJson(path.join(countriesRoot, "country_registry.json"));
const contract = readJson(path.join(countriesRoot, "country_research_contract.json"));
const registryByCode = new Map(registry.countries.map((country) => [country.country_code, country]));
const expectedCodes = ["JPN", "KOR", "PRK", "RUS", "IND", "AUS", "PHL"];
const requiredLaneIds = contract.lanes.map((lane) => lane.lane_id);
const errors = [];
let validatedCountries = 0;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function sameMembers(actual, expected) {
  return actual.length === expected.length && new Set(actual).size === actual.length && expected.every((item) => actual.includes(item));
}

const codes = wave.countries.map((country) => country.country_code);
assert(wave.status === "planned", "Wave status must remain planned until evidence collection begins");
assert(sameMembers(codes, expectedCodes), "Wave country set differs from the approved first wave");
assert(new Set(wave.countries.map((country) => country.priority)).size === wave.countries.length, "Wave priorities must be unique");
assert(wave.rules.some((rule) => rule.includes("not factual claims")), "Wave does not protect planning questions from factual promotion");

for (const country of wave.countries) {
  const code = country.country_code;
  const label = `${code} Tier B foundation`;
  const registryCountry = registryByCode.get(code);
  const countryDirectory = path.join(countriesRoot, code.toLowerCase());
  const profile = readJson(path.join(countryDirectory, "profile.json"));
  const manifest = readJson(path.join(countryDirectory, "research_manifest.json"));
  const matrix = readJson(path.join(countryDirectory, "lane_coverage.json"));
  const workPackages = fs.readFileSync(path.join(countryDirectory, "WORK_PACKAGES.md"), "utf8");
  validatedCountries += 1;

  assert(Boolean(registryCountry), `${label}: missing registry entry`);
  assert(registryCountry?.depth_tier === "B", `${label}: registry depth tier must be B`);
  assert(profile.coverage_status === "shell", `${label}: profile must remain shell before evidence is accepted`);
  assert(profile.dataset_paths?.force_ledger === null, `${label}: profile must not link a force ledger`);
  assert(profile.completeness?.force_ledger_status === "absent", `${label}: force ledger status must remain absent`);

  assert(manifest.country_id === registryCountry?.country_id, `${label}: manifest country identity mismatch`);
  assert(manifest.country_code === code, `${label}: manifest country code mismatch`);
  assert(manifest.bookmark_id === wave.bookmark_id, `${label}: manifest bookmark mismatch`);
  assert(manifest.as_of === wave.as_of, `${label}: manifest time mismatch`);
  assert(manifest.status === "shell", `${label}: manifest must remain shell`);
  assert(manifest.research_wave === wave.wave_id, `${label}: manifest wave mismatch`);
  assert(sameMembers(manifest.lane_ids ?? [], requiredLaneIds), `${label}: manifest lane set mismatch`);
  assert(manifest.accepted_source_count === 0, `${label}: accepted source count must be zero`);
  assert(manifest.accepted_claim_count === 0, `${label}: accepted claim count must be zero`);
  assert(manifest.open_contradiction_count === 0, `${label}: contradiction count must be zero`);
  assert(manifest.files?.evidence_registry === null, `${label}: empty evidence registry must not be implied`);
  assert(manifest.files?.bookmark_state === null, `${label}: empty bookmark state must not be implied`);
  assert(manifest.files?.force_ledger === null, `${label}: empty force ledger must not be implied`);
  assert(Object.values(manifest.acceptance ?? {}).every((value) => value === false), `${label}: no acceptance gate may pass before collection`);
  assert(manifest.unknowns?.some((entry) => entry.includes("never asserts real world absence")), `${label}: zero semantics are not explicit`);

  assert(matrix.country_id === registryCountry?.country_id, `${label}: lane matrix country identity mismatch`);
  assert(matrix.overall_status === "shell", `${label}: lane matrix must remain shell`);
  assert(matrix.research_wave === wave.wave_id, `${label}: lane matrix wave mismatch`);
  assert(sameMembers(Object.keys(matrix.lanes ?? {}), requiredLaneIds), `${label}: lane matrix set mismatch`);
  assert(matrix.rollup?.lanes_total === 8, `${label}: lane rollup total mismatch`);
  assert(matrix.rollup?.shell === 8, `${label}: all lanes must remain shell`);
  assert(["collecting", "needs_review", "verified", "stale", "deprecated"].every((key) => matrix.rollup?.[key] === 0), `${label}: non shell rollup count must be zero`);

  for (const laneId of requiredLaneIds) {
    const lane = matrix.lanes[laneId];
    assert(lane.status === "shell", `${label}: ${laneId} must remain shell`);
    for (const countName of ["record_count", "source_count", "claim_count", "contradiction_count", "exact_geometry_count", "approximate_geometry_count", "unknown_geometry_count"]) {
      assert(lane[countName] === 0, `${label}: ${laneId}.${countName} must be zero corpus records`);
    }
    assert(lane.owner === null, `${label}: ${laneId} must remain unclaimed`);
    assert(Array.isArray(lane.blocking_questions) && lane.blocking_questions.length >= 3, `${label}: ${laneId} lacks bounded research questions`);
    assert(lane.notes.includes("corpus state only"), `${label}: ${laneId} zero semantics are ambiguous`);
  }

  assert(workPackages.includes(`# ${registryCountry?.name} Tier B Research Work Packages`), `${label}: work package title mismatch`);
  assert(workPackages.includes("No factual country record is created"), `${label}: work packages lack nonfactual boundary`);
  for (let packageNumber = 1; packageNumber <= 9; packageNumber += 1) {
    assert(workPackages.includes(`## Package ${packageNumber}:`), `${label}: missing package ${packageNumber}`);
  }
  for (const question of country.focus_questions) {
    assert(workPackages.includes(question), `${label}: country focus question is missing from work packages`);
  }
}

assert(validatedCountries === 7, `Expected 7 Tier B foundations, found ${validatedCountries}`);

const report = {
  status: errors.length ? "FAIL" : "PASS",
  wave_id: wave.wave_id,
  validated_countries: validatedCountries,
  lane_matrices: validatedCountries,
  work_package_documents: validatedCountries,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
