#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BOOKMARK_ID = "bookmark_global_fracture_2025_09_01";
const BOOKMARK_TIME = "2025-09-01T00:00:00Z";
const STRATEGIC_BASIS = "mandatory_strategic_addition";

const COVERAGE_LANES = [
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
const registryPath = path.join(countriesRoot, "country_registry.json");
const checkOnly = process.argv.includes("--check");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function shellCoverage() {
  return Object.fromEntries(
    COVERAGE_LANES.map((lane) => [
      lane,
      {
        status: "shell",
        record_count: 0,
        source_count: 0,
        open_question_count: 1,
        notes:
          "No sourced records are accepted yet; zero is corpus completeness, not real world quantity.",
      },
    ]),
  );
}

function buildShell(registryCountry) {
  return {
    schema_version: "0.1.0",
    country_id: registryCountry.country_id,
    country_code: registryCountry.country_code,
    name: registryCountry.name,
    bookmark_id: BOOKMARK_ID,
    as_of: BOOKMARK_TIME,
    depth_tier: registryCountry.depth_tier,
    coverage_status: "shell",
    roster_basis: STRATEGIC_BASIS,
    gdp_rank: null,
    gdp_2025_usd_billions: null,
    coverage: shellCoverage(),
    dataset_paths: {
      government: null,
      political_actors: null,
      provinces: null,
      economy: null,
      force_ledger: null,
      facilities: null,
      infrastructure: null,
      relationships: null,
      claims: null,
      sources: "../../sources/sources.ndjson",
      contradictions: null,
    },
    completeness: {
      political_actor_target: 20,
      political_actor_count: 0,
      province_layer_status: "absent",
      force_ledger_status: "absent",
    },
    source_ids: [],
    unknowns: [
      "The registry establishes identity and required campaign coverage only; it does not establish country conditions at the bookmark.",
      "Government, leadership, institutions, and political actors at the bookmark are unknown in this shell.",
      "Economy, trade, finance, resources, and industrial capacity are unknown in this shell; missing GDP fields do not assert zero output.",
      "Military organization, inventory, readiness, basing, maintenance, and deployments are unknown in this shell.",
      "Province, terrain, infrastructure, industry, energy, logistics, and communications state are unknown in this shell.",
      "Alliances, dependencies, sanctions, crisis commitments, and active plans are unknown in this shell.",
      "A zero record count means no accepted corpus records and never asserts zero real world entities or capacity.",
    ],
    notes:
      "Generated from the approved strategic addition registry only. Numeric coverage zeros count accepted corpus records and never assert real world absence. All substantive country facts remain unknown until sourced.",
  };
}

const registry = readJson(registryPath);
const registryCountries = registry.countries ?? [];
const additions = registryCountries.filter(
  (country) => country.roster_basis === STRATEGIC_BASIS,
);

if (registryCountries.length !== 91) {
  throw new Error(`Expected exactly 91 registry countries, found ${registryCountries.length}`);
}
if (additions.length !== 11) {
  throw new Error(`Expected exactly 11 strategic additions, found ${additions.length}`);
}
if (new Set(additions.map((country) => country.country_code)).size !== 11) {
  throw new Error("Strategic addition country codes are not unique");
}

const expectedProfiles = [];
for (const registryCountry of additions) {
  const directoryName = registryCountry.country_code.toLowerCase();
  const relativeProfilePath = `countries/${directoryName}/profile.json`;
  const profilePath = path.join(countriesRoot, directoryName, "profile.json");
  expectedProfiles.push({
    profilePath,
    relativeProfilePath,
    content: stableJson(buildShell(registryCountry)),
  });
  registryCountry.profile_path = relativeProfilePath;
}

const mismatches = [];
for (const profile of expectedProfiles) {
  if (checkOnly) {
    if (!fs.existsSync(profile.profilePath)) {
      mismatches.push(`${profile.relativeProfilePath}: missing`);
    } else if (fs.readFileSync(profile.profilePath, "utf8") !== profile.content) {
      mismatches.push(`${profile.relativeProfilePath}: differs from deterministic output`);
    }
    continue;
  }

  fs.mkdirSync(path.dirname(profile.profilePath), { recursive: true });
  fs.writeFileSync(profile.profilePath, profile.content);
}

const expectedRegistry = stableJson(registry);
if (checkOnly) {
  if (fs.readFileSync(registryPath, "utf8") !== expectedRegistry) {
    mismatches.push("countries/country_registry.json: strategic profile paths differ");
  }
} else {
  fs.writeFileSync(registryPath, expectedRegistry);
}

const report = {
  status: mismatches.length ? "FAIL" : "PASS",
  mode: checkOnly ? "check" : "write",
  registry_countries: registryCountries.length,
  ranked_cohort_countries: registryCountries.length - additions.length,
  generated_strategic_addition_shells: expectedProfiles.length,
  mismatches,
};

console.log(JSON.stringify(report, null, 2));
if (mismatches.length) process.exitCode = 1;
