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
assert(wave.status === "collecting", "Wave status must be collecting after Japan evidence collection begins");
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
  const authorityPacketPath = path.join(countryDirectory, "authority_packet.source.json");
  const sharedAuthorityPacket = fs.existsSync(authorityPacketPath) ? readJson(authorityPacketPath) : null;
  const forceLedgerPath = path.join(countryDirectory, "force_ledger", "manifest.json");
  const forceLedger = fs.existsSync(forceLedgerPath) ? readJson(forceLedgerPath) : null;
  validatedCountries += 1;

  assert(Boolean(registryCountry), `${label}: missing registry entry`);
  assert(registryCountry?.depth_tier === "B", `${label}: registry depth tier must be B`);
  const promotedCountry = code === "JPN" || Boolean(sharedAuthorityPacket) || Boolean(forceLedger);
  const promotedLaneIds = sharedAuthorityPacket
    ? Object.keys(sharedAuthorityPacket.lane_updates)
    : (code === "JPN" ? ["politics_and_institutions", "crises_alliances_sanctions_deployments"] : []);
  if (forceLedger && !promotedLaneIds.includes("military_organization_inventory")) {
    promotedLaneIds.push("military_organization_inventory");
  }
  assert(profile.coverage_status === (promotedCountry ? "collecting" : "shell"), `${label}: profile coverage status mismatch`);
  assert(profile.dataset_paths?.force_ledger === (forceLedger ? "force_ledger/manifest.json" : null), `${label}: force ledger link mismatch`);
  assert(forceLedger
    ? profile.completeness?.force_ledger_status?.includes("nonexecutable")
    : profile.completeness?.force_ledger_status === "absent", `${label}: force ledger status mismatch`);
  if (forceLedger) {
    assert(forceLedger.country_id === registryCountry?.country_id, `${label}: force ledger country mismatch`);
    assert(forceLedger.bookmark_id === wave.bookmark_id, `${label}: force ledger bookmark mismatch`);
    assert(forceLedger.status === "collecting", `${label}: force ledger must remain collecting`);
    assert(forceLedger.acceptance?.simulation_ready === false, `${label}: force ledger must remain nonexecutable`);
  }

  assert(manifest.country_id === registryCountry?.country_id, `${label}: manifest country identity mismatch`);
  assert(manifest.country_code === code, `${label}: manifest country code mismatch`);
  assert(manifest.bookmark_id === wave.bookmark_id, `${label}: manifest bookmark mismatch`);
  assert(manifest.as_of === wave.as_of, `${label}: manifest time mismatch`);
  assert(manifest.status === (promotedCountry ? "collecting" : "shell"), `${label}: manifest status mismatch`);
  assert(manifest.research_wave === wave.wave_id, `${label}: manifest wave mismatch`);
  assert(sameMembers(manifest.lane_ids ?? [], requiredLaneIds), `${label}: manifest lane set mismatch`);
  assert(promotedCountry ? manifest.accepted_source_count > 0 : manifest.accepted_source_count === 0, `${label}: accepted source count mismatch`);
  assert(promotedCountry ? manifest.accepted_claim_count > 0 : manifest.accepted_claim_count === 0, `${label}: accepted claim count mismatch`);
  assert(promotedCountry ? manifest.open_contradiction_count >= 1 : manifest.open_contradiction_count === 0, `${label}: contradiction count mismatch`);
  assert(manifest.files?.evidence_registry === (promotedCountry ? "evidence_registry.json" : null), `${label}: evidence registry link mismatch`);
  assert(manifest.files?.bookmark_state === (promotedCountry ? "bookmark_state.json" : null), `${label}: bookmark state link mismatch`);
  assert(manifest.files?.force_ledger === (forceLedger ? "force_ledger/manifest.json" : null), `${label}: force ledger manifest link mismatch`);
  assert(Object.values(manifest.acceptance ?? {}).every((value) => value === false), `${label}: no acceptance gate may pass before collection`);
  assert(manifest.unknowns?.some((entry) => entry.includes("never asserts real world absence")), `${label}: zero semantics are not explicit`);

  assert(matrix.country_id === registryCountry?.country_id, `${label}: lane matrix country identity mismatch`);
  assert(matrix.overall_status === (promotedCountry ? "collecting" : "shell"), `${label}: lane matrix status mismatch`);
  assert(matrix.research_wave === wave.wave_id, `${label}: lane matrix wave mismatch`);
  assert(sameMembers(Object.keys(matrix.lanes ?? {}), requiredLaneIds), `${label}: lane matrix set mismatch`);
  assert(matrix.rollup?.lanes_total === 8, `${label}: lane rollup total mismatch`);
  const collectingLaneCount = forceLedger ? 1 : 0;
  const reviewLaneCount = promotedLaneIds.length - collectingLaneCount;
  assert(matrix.rollup?.shell === 8 - promotedLaneIds.length, `${label}: shell lane rollup mismatch`);
  assert(matrix.rollup?.needs_review === reviewLaneCount, `${label}: review lane rollup mismatch`);
  assert(matrix.rollup?.collecting === collectingLaneCount, `${label}: collecting lane rollup mismatch`);
  assert(["verified", "stale", "deprecated"].every((key) => matrix.rollup?.[key] === 0), `${label}: unexpected lane rollup count`);

  for (const laneId of requiredLaneIds) {
    const lane = matrix.lanes[laneId];
    const promotedLane = promotedLaneIds.includes(laneId);
    const forceLane = laneId === "military_organization_inventory" && Boolean(forceLedger);
    assert(lane.status === (forceLane ? "collecting" : promotedLane ? "needs_review" : "shell"), `${label}: ${laneId} status mismatch`);
    for (const countName of ["record_count", "source_count", "claim_count", "contradiction_count", "exact_geometry_count", "approximate_geometry_count", "unknown_geometry_count"]) {
      if (!promotedLane || (!forceLane && countName.includes("geometry"))) assert(lane[countName] === 0, `${label}: ${laneId}.${countName} must be zero corpus records`);
    }
    assert(lane.owner === (promotedLane ? "agent_05_world_research_and_data_director" : null), `${label}: ${laneId} owner mismatch`);
    assert(Array.isArray(lane.blocking_questions) && lane.blocking_questions.length >= 3, `${label}: ${laneId} lacks bounded research questions`);
    if (!promotedLane) assert(lane.notes.includes("corpus state only"), `${label}: ${laneId} zero semantics are ambiguous`);
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
