#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BOOKMARK_ID = "bookmark_global_fracture_2025_09_01";
const BOOKMARK_TIME = "2025-09-01T00:00:00Z";
const ROSTER_SOURCE_ID = "src_imf_weo_2026_04_ngdpd_2025";
const TIER_A_CODES = new Set(["USA", "CHN", "TWN"]);

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
const rosterPath = path.join(countriesRoot, "top_80_2025", "top_80_2025_gdp.json");
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
    COVERAGE_LANES.map((lane) => {
      const rosterBackedEconomy = lane === "economy_trade_finance_resources";
      return [
        lane,
        {
          status: rosterBackedEconomy ? "collecting" : "shell",
          record_count: rosterBackedEconomy ? 1 : 0,
          source_count: rosterBackedEconomy ? 1 : 0,
          open_question_count: 1,
          notes: rosterBackedEconomy
            ? "Only the frozen 2025 nominal GDP roster record is accepted; no broader economic state is populated."
            : "No sourced records are accepted yet; zero is corpus completeness, not real world quantity.",
        },
      ];
    }),
  );
}

function buildShell(rosterCountry, registryCountry) {
  return {
    schema_version: "0.1.0",
    country_id: registryCountry.country_id,
    country_code: rosterCountry.country_code,
    name: rosterCountry.name,
    bookmark_id: BOOKMARK_ID,
    as_of: BOOKMARK_TIME,
    depth_tier: registryCountry.depth_tier,
    coverage_status: "shell",
    roster_basis: "top_80_2025_nominal_gdp",
    gdp_rank: rosterCountry.rank,
    gdp_2025_usd_billions: rosterCountry.gdp_2025_usd_billions,
    coverage: shellCoverage(),
    dataset_paths: {
      government: null,
      political_actors: null,
      provinces: null,
      economy: "../top_80_2025/top_80_2025_gdp.json",
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
    source_ids: [ROSTER_SOURCE_ID],
    unknowns: [
      "Government, leadership, institutions, and political actors at the bookmark are unknown in this shell.",
      "Military organization, inventory, readiness, basing, maintenance, and deployments are unknown in this shell.",
      "Province, terrain, infrastructure, industry, energy, logistics, and communications state are unknown in this shell.",
      "Alliances, dependencies, sanctions, crisis commitments, and active plans are unknown in this shell.",
      "A zero record count means no accepted corpus records and never asserts zero real world entities or capacity.",
    ],
    notes:
      "Generated from the frozen roster only. Numeric coverage zeros count accepted corpus records and never assert real world absence. All substantive country facts remain unknown until sourced.",
  };
}

const roster = readJson(rosterPath);
const registry = readJson(registryPath);
const rosterCountries = roster.countries ?? [];

if (rosterCountries.length !== 80) {
  throw new Error(`Expected exactly 80 frozen roster countries, found ${rosterCountries.length}`);
}

const rosterCodes = new Set(rosterCountries.map((country) => country.country_code));
if (rosterCodes.size !== 80) {
  throw new Error("Frozen roster country codes are not unique");
}

const registryByCode = new Map(
  (registry.countries ?? []).map((country) => [country.country_code, country]),
);
const expectedProfiles = [];
let preservedSubstantiveProfiles = 0;

for (const rosterCountry of rosterCountries) {
  const registryCountry = registryByCode.get(rosterCountry.country_code);
  if (!registryCountry) {
    throw new Error(`Roster country ${rosterCountry.country_code} is missing from the registry`);
  }

  if (TIER_A_CODES.has(rosterCountry.country_code)) {
    continue;
  }

  const directoryName = rosterCountry.country_code.toLowerCase();
  const relativeProfilePath = `countries/${directoryName}/profile.json`;
  const profilePath = path.join(countriesRoot, directoryName, "profile.json");
  const content = stableJson(buildShell(rosterCountry, registryCountry));
  const existingProfile = fs.existsSync(profilePath) ? readJson(profilePath) : null;
  const substantive = existingProfile && existingProfile.coverage_status !== "shell";
  if (substantive) preservedSubstantiveProfiles += 1;
  expectedProfiles.push({ profilePath, relativeProfilePath, content, substantive });
  registryCountry.profile_path = relativeProfilePath;
}

if (expectedProfiles.length !== 77) {
  throw new Error(`Expected 77 generated shells outside Tier A, found ${expectedProfiles.length}`);
}

const mismatches = [];
for (const profile of expectedProfiles) {
  if (profile.substantive) continue;
  if (checkOnly) {
    if (!fs.existsSync(profile.profilePath)) {
      mismatches.push(`${profile.relativeProfilePath}: missing`);
    } else if (fs.readFileSync(profile.profilePath, "utf8") !== profile.content) {
      mismatches.push(`${profile.relativeProfilePath}: differs from deterministic output`);
    }
    continue;
  }

  if (!fs.existsSync(profile.profilePath)) {
    fs.mkdirSync(path.dirname(profile.profilePath), { recursive: true });
    fs.writeFileSync(profile.profilePath, profile.content);
  }
}

const expectedRegistry = stableJson(registry);
if (checkOnly) {
  if (fs.readFileSync(registryPath, "utf8") !== expectedRegistry) {
    mismatches.push("countries/country_registry.json: generated profile paths differ");
  }
} else {
  fs.writeFileSync(registryPath, expectedRegistry);
}

const report = {
  status: mismatches.length ? "FAIL" : "PASS",
  mode: checkOnly ? "check" : "write",
  frozen_roster_countries: rosterCountries.length,
  preserved_tier_a_profiles: TIER_A_CODES.size,
  preserved_substantive_profiles: preservedSubstantiveProfiles,
  generated_or_validated_shell_profiles: expectedProfiles.length - preservedSubstantiveProfiles,
  mismatches,
};

console.log(JSON.stringify(report, null, 2));
if (mismatches.length) process.exitCode = 1;
