#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BOOKMARK_ID = "bookmark_global_fracture_2025_09_01";
const BOOKMARK_TIME = "2025-09-01T00:00:00Z";
const RANKED_BASIS = "top_80_2025_nominal_gdp";
const STRATEGIC_BASIS = "mandatory_strategic_addition";
const ROSTER_SOURCE_ID = "src_imf_weo_2026_04_ngdpd_2025";
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

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(scriptDirectory, "..");
const roster = readJson(path.join(countriesRoot, "top_80_2025", "top_80_2025_gdp.json"));
const registry = readJson(path.join(countriesRoot, "country_registry.json"));
const errors = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function sameMembers(actual, expected) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    expected.every((item) => actual.includes(item))
  );
}

function validateEmptyShell(profile, countryCode) {
  assert(profile.coverage_status === "shell", `${countryCode}: generated profile is not a shell`);
  assert(profile.dataset_paths?.force_ledger === null, `${countryCode}: empty force ledger must be absent`);
  assert(profile.completeness?.force_ledger_status === "absent", `${countryCode}: force ledger status must be absent`);
  assert(profile.completeness?.province_layer_status === "absent", `${countryCode}: province layer must be absent`);
  assert(profile.completeness?.political_actor_count === 0, `${countryCode}: political actor corpus must be empty`);
  assert((profile.unknowns ?? []).length >= 5, `${countryCode}: shell must enumerate unknowns`);
  assert(
    profile.unknowns?.some((entry) => entry.includes("never asserts zero real world")),
    `${countryCode}: shell does not explain zero semantics`,
  );
  assert(
    profile.notes?.includes("never assert real world absence"),
    `${countryCode}: notes do not protect unknown versus zero semantics`,
  );
}

function validateEmptyLane(profile, lane, countryCode) {
  const coverage = profile.coverage[lane];
  assert(coverage.status === "shell", `${countryCode}: ${lane} must remain a shell`);
  assert(coverage.record_count === 0, `${countryCode}: ${lane} record count is not empty`);
  assert(coverage.source_count === 0, `${countryCode}: ${lane} source count is not empty`);
  assert(
    coverage.notes?.includes("not real world quantity"),
    `${countryCode}: ${lane} zero semantics are ambiguous`,
  );
}

const rosterCountries = roster.countries ?? [];
const additions = roster.mandatory_strategic_additions ?? [];
const registryCountries = registry.countries ?? [];
const rosterByCode = new Map(rosterCountries.map((country) => [country.country_code, country]));
const additionByCode = new Map(additions.map((country) => [country.country_code, country]));
const registryCodes = registryCountries.map((country) => country.country_code);
const registryIds = registryCountries.map((country) => country.country_id);

assert(roster.status === "frozen", "Top 80 roster must remain frozen");
assert(rosterCountries.length === 80, `Expected 80 ranked countries, found ${rosterCountries.length}`);
assert(additions.length === 11, `Expected 11 strategic additions, found ${additions.length}`);
assert(registryCountries.length === 91, `Expected 91 registry countries, found ${registryCountries.length}`);
assert(new Set(registryCodes).size === 91, "Registry country codes must be unique");
assert(new Set(registryIds).size === 91, "Registry country ids must be unique");
assert(
  [...additionByCode.keys()].every((code) => !rosterByCode.has(code)),
  "Strategic additions must not displace or duplicate the ranked cohort",
);

let validatedProfiles = 0;
let validatedRankedProfiles = 0;
let validatedStrategicProfiles = 0;
let validatedGeneratedRankedShells = 0;
let validatedGeneratedStrategicShells = 0;

for (const registryCountry of registryCountries) {
  const countryCode = registryCountry.country_code;
  const expectedPath = `countries/${countryCode.toLowerCase()}/profile.json`;
  assert(registryCountry.profile_path === expectedPath, `${countryCode}: profile path must be ${expectedPath}`);

  const profilePath = path.join(countriesRoot, countryCode.toLowerCase(), "profile.json");
  assert(fs.existsSync(profilePath), `${countryCode}: profile does not exist`);
  if (!fs.existsSync(profilePath)) continue;

  const profile = readJson(profilePath);
  validatedProfiles += 1;
  assert(profile.country_id === registryCountry.country_id, `${countryCode}: country id mismatch`);
  assert(profile.country_code === countryCode, `${countryCode}: country code mismatch`);
  assert(profile.name === registryCountry.name, `${countryCode}: registry name mismatch`);
  assert(profile.bookmark_id === BOOKMARK_ID, `${countryCode}: bookmark id mismatch`);
  assert(profile.as_of === BOOKMARK_TIME, `${countryCode}: bookmark time mismatch`);
  assert(profile.depth_tier === registryCountry.depth_tier, `${countryCode}: depth tier mismatch`);
  assert(profile.roster_basis === registryCountry.roster_basis, `${countryCode}: roster basis mismatch`);
  assert(
    sameMembers(Object.keys(profile.coverage ?? {}), REQUIRED_LANES),
    `${countryCode}: coverage lanes differ from the country contract`,
  );

  if (registryCountry.roster_basis === RANKED_BASIS) {
    validatedRankedProfiles += 1;
    const rosterCountry = rosterByCode.get(countryCode);
    assert(Boolean(rosterCountry), `${countryCode}: ranked registry entry is absent from the frozen cohort`);
    if (!rosterCountry) continue;
    assert(profile.gdp_rank === rosterCountry.rank, `${countryCode}: GDP rank mismatch`);
    assert(
      profile.gdp_2025_usd_billions === rosterCountry.gdp_2025_usd_billions,
      `${countryCode}: GDP value mismatch`,
    );
    assert(profile.source_ids?.includes(ROSTER_SOURCE_ID), `${countryCode}: frozen roster source missing`);

    if (TIER_A_CODES.has(countryCode)) continue;
    validatedGeneratedRankedShells += 1;
    validateEmptyShell(profile, countryCode);
    assert(profile.dataset_paths?.economy?.endsWith("top_80_2025_gdp.json"), `${countryCode}: roster dataset link missing`);
    assert(
      JSON.stringify(profile.source_ids) === JSON.stringify([ROSTER_SOURCE_ID]),
      `${countryCode}: ranked shell contains a non roster source`,
    );
    for (const lane of REQUIRED_LANES) {
      if (lane === "economy_trade_finance_resources") {
        const coverage = profile.coverage[lane];
        assert(coverage.status === "collecting", `${countryCode}: roster economy lane must be collecting`);
        assert(coverage.record_count === 1, `${countryCode}: roster economy record count must be one`);
        assert(coverage.source_count === 1, `${countryCode}: roster economy source count must be one`);
      } else {
        validateEmptyLane(profile, lane, countryCode);
      }
    }
    continue;
  }

  assert(
    registryCountry.roster_basis === STRATEGIC_BASIS,
    `${countryCode}: unsupported roster basis ${registryCountry.roster_basis}`,
  );
  validatedStrategicProfiles += 1;
  validatedGeneratedStrategicShells += 1;
  const addition = additionByCode.get(countryCode);
  assert(Boolean(addition), `${countryCode}: strategic registry entry is absent from the approved additions`);
  if (addition) assert(profile.name === addition.name, `${countryCode}: strategic addition name mismatch`);
  assert(profile.gdp_rank === null, `${countryCode}: strategic addition must not have a ranked GDP position`);
  assert(profile.gdp_2025_usd_billions === null, `${countryCode}: unsupported GDP value must remain null`);
  assert(profile.dataset_paths?.economy === null, `${countryCode}: unsupported economy dataset must remain absent`);
  assert(profile.source_ids?.length === 0, `${countryCode}: unsourced strategic shell must have no source ids`);
  validateEmptyShell(profile, countryCode);
  for (const lane of REQUIRED_LANES) validateEmptyLane(profile, lane, countryCode);
}

assert(validatedProfiles === 91, `Expected 91 valid country profiles, found ${validatedProfiles}`);
assert(validatedRankedProfiles === 80, `Expected 80 ranked profiles, found ${validatedRankedProfiles}`);
assert(validatedStrategicProfiles === 11, `Expected 11 strategic profiles, found ${validatedStrategicProfiles}`);
assert(
  validatedGeneratedRankedShells === 77,
  `Expected 77 generated ranked shells, found ${validatedGeneratedRankedShells}`,
);
assert(
  validatedGeneratedStrategicShells === 11,
  `Expected 11 generated strategic shells, found ${validatedGeneratedStrategicShells}`,
);

const report = {
  status: errors.length ? "FAIL" : "PASS",
  registry_countries: registryCountries.length,
  validated_profiles: validatedProfiles,
  ranked_cohort_profiles: validatedRankedProfiles,
  strategic_addition_profiles: validatedStrategicProfiles,
  preserved_tier_a_profiles: TIER_A_CODES.size,
  generated_ranked_shells: validatedGeneratedRankedShells,
  generated_strategic_addition_shells: validatedGeneratedStrategicShells,
  bookmark_id: BOOKMARK_ID,
  bookmark_time: BOOKMARK_TIME,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
