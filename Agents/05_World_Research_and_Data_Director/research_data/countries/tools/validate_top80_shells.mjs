#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BOOKMARK_ID = "bookmark_global_fracture_2025_09_01";
const BOOKMARK_TIME = "2025-09-01T00:00:00Z";
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

const rosterCountries = roster.countries ?? [];
const codes = rosterCountries.map((country) => country.country_code);
const ranks = rosterCountries.map((country) => country.rank);

assert(roster.status === "frozen", "Top 80 roster must remain frozen");
assert(rosterCountries.length === 80, `Expected 80 roster countries, found ${rosterCountries.length}`);
assert(new Set(codes).size === 80, "Top 80 roster country codes must be unique");
assert(new Set(ranks).size === 80, "Top 80 roster ranks must be unique");
assert(
  ranks.every((rank, index) => rank === index + 1),
  "Top 80 roster ranks must be contiguous from 1 through 80",
);

const registryByCode = new Map((registry.countries ?? []).map((country) => [country.country_code, country]));
let validatedProfiles = 0;
let validatedGeneratedShells = 0;

for (const rosterCountry of rosterCountries) {
  const registryCountry = registryByCode.get(rosterCountry.country_code);
  assert(Boolean(registryCountry), `${rosterCountry.country_code}: missing registry identity`);
  if (!registryCountry) continue;

  const expectedPath = `countries/${rosterCountry.country_code.toLowerCase()}/profile.json`;
  assert(
    registryCountry.profile_path === expectedPath,
    `${rosterCountry.country_code}: profile path must be ${expectedPath}`,
  );
  const profilePath = path.join(countriesRoot, rosterCountry.country_code.toLowerCase(), "profile.json");
  assert(fs.existsSync(profilePath), `${rosterCountry.country_code}: profile does not exist`);
  if (!fs.existsSync(profilePath)) continue;

  const profile = readJson(profilePath);
  validatedProfiles += 1;
  assert(profile.country_id === registryCountry.country_id, `${rosterCountry.country_code}: country id mismatch`);
  assert(profile.country_code === rosterCountry.country_code, `${rosterCountry.country_code}: country code mismatch`);
  assert(profile.name === rosterCountry.name, `${rosterCountry.country_code}: roster name mismatch`);
  assert(profile.gdp_rank === rosterCountry.rank, `${rosterCountry.country_code}: GDP rank mismatch`);
  assert(
    profile.gdp_2025_usd_billions === rosterCountry.gdp_2025_usd_billions,
    `${rosterCountry.country_code}: GDP value mismatch`,
  );
  assert(profile.bookmark_id === BOOKMARK_ID, `${rosterCountry.country_code}: bookmark id mismatch`);
  assert(profile.as_of === BOOKMARK_TIME, `${rosterCountry.country_code}: bookmark time mismatch`);
  assert(profile.depth_tier === registryCountry.depth_tier, `${rosterCountry.country_code}: depth tier mismatch`);
  assert(
    sameMembers(Object.keys(profile.coverage ?? {}), REQUIRED_LANES),
    `${rosterCountry.country_code}: coverage lanes differ from the country contract`,
  );

  if (TIER_A_CODES.has(rosterCountry.country_code)) continue;
  validatedGeneratedShells += 1;
  assert(profile.coverage_status === "shell", `${rosterCountry.country_code}: generated profile is not a shell`);
  assert(
    profile.roster_basis === "top_80_2025_nominal_gdp",
    `${rosterCountry.country_code}: roster basis mismatch`,
  );
  assert(
    JSON.stringify(profile.source_ids) === JSON.stringify([ROSTER_SOURCE_ID]),
    `${rosterCountry.country_code}: shell contains a non roster source`,
  );
  assert(profile.dataset_paths?.force_ledger === null, `${rosterCountry.country_code}: empty force ledger must be absent`);
  assert(profile.completeness?.force_ledger_status === "absent", `${rosterCountry.country_code}: force ledger status must be absent`);
  assert(profile.completeness?.province_layer_status === "absent", `${rosterCountry.country_code}: province layer must be absent`);
  assert(profile.completeness?.political_actor_count === 0, `${rosterCountry.country_code}: political actor corpus must be empty`);
  assert((profile.unknowns ?? []).length >= 5, `${rosterCountry.country_code}: shell must enumerate unknowns`);
  assert(
    profile.unknowns?.some((entry) => entry.includes("never asserts zero real world")),
    `${rosterCountry.country_code}: shell does not explain zero semantics`,
  );
  assert(
    profile.notes?.includes("never assert real world absence"),
    `${rosterCountry.country_code}: notes do not protect unknown versus zero semantics`,
  );

  for (const lane of REQUIRED_LANES) {
    const coverage = profile.coverage[lane];
    const rosterBackedEconomy = lane === "economy_trade_finance_resources";
    assert(
      coverage.status === (rosterBackedEconomy ? "collecting" : "shell"),
      `${rosterCountry.country_code}: ${lane} status overstates evidence`,
    );
    assert(
      coverage.record_count === (rosterBackedEconomy ? 1 : 0),
      `${rosterCountry.country_code}: ${lane} record count is not roster limited`,
    );
    assert(
      coverage.source_count === (rosterBackedEconomy ? 1 : 0),
      `${rosterCountry.country_code}: ${lane} source count is not roster limited`,
    );
    if (!rosterBackedEconomy) {
      assert(
        coverage.notes?.includes("not real world quantity"),
        `${rosterCountry.country_code}: ${lane} zero semantics are ambiguous`,
      );
    }
  }
}

assert(validatedProfiles === 80, `Expected 80 valid country profiles, found ${validatedProfiles}`);
assert(validatedGeneratedShells === 77, `Expected 77 generated shells, found ${validatedGeneratedShells}`);

const report = {
  status: errors.length ? "FAIL" : "PASS",
  frozen_roster_countries: rosterCountries.length,
  unique_country_codes: new Set(codes).size,
  validated_profiles: validatedProfiles,
  preserved_tier_a_profiles: TIER_A_CODES.size,
  validated_generated_shells: validatedGeneratedShells,
  bookmark_id: BOOKMARK_ID,
  bookmark_time: BOOKMARK_TIME,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
