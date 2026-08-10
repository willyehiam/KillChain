#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(scriptDirectory, "..");
const wave = readJson(path.join(countriesRoot, "tier_b_wave_one.json"));
const registry = readJson(path.join(countriesRoot, "country_registry.json"));
const registryByCode = new Map(registry.countries.map((country) => [country.country_code, country]));
const checkOnly = process.argv.includes("--check");
const differences = [];

const lanes = [
  ["politics_and_institutions", "Politics and institutions"],
  ["economy_trade_finance_resources", "Economy, trade, finance, and resources"],
  ["military_organization_inventory", "Military organization and inventory"],
  ["fixed_facilities_basing", "Public fixed facilities and basing"],
  ["strategic_industry_conversion", "Strategic industry and conversion capacity"],
  ["energy_transport_communications_logistics", "Energy, transport, communications, and logistics"],
  ["geography_provinces_terrain", "Geography, provinces, terrain, rivers, and maritime access"],
  ["crises_alliances_sanctions_deployments", "Active crises, alliances, sanctions, and foreign deployments"],
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeGenerated(file, content) {
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  if (checkOnly) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== normalized) {
      differences.push(path.relative(countriesRoot, file));
    }
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized);
}

function laneQuestions(country, laneId) {
  const focus = country.focus_questions;
  const shared = "Which public sources can establish the opening state without converting missing evidence into zero?";
  const questions = {
    politics_and_institutions: [focus[0], "Which actors and institutions can lawfully and practically authorize, obstruct, or redirect national action?"],
    economy_trade_finance_resources: [focus[3], "Which economic measures create strategic choices while avoiding clerical budget simulation?"],
    military_organization_inventory: [focus[1], "How can the complete national force be partitioned into conserved, mutually exclusive readiness and disposition states?"],
    fixed_facilities_basing: [focus[2], "Which public facilities matter individually because access, capacity, resilience, or substitution changes a decision?"],
    strategic_industry_conversion: [focus[3], "Which production and repair capacities are operational, constrained, convertible, planned, or unknown at the bookmark?"],
    energy_transport_communications_logistics: [focus[2], focus[3]],
    geography_provinces_terrain: [focus[2], "Which administrative and operational map levels support global, theater, and mission scale play?"],
    crises_alliances_sanctions_deployments: [focus[0], "Which commitments, crises, sanctions, and deployments are active at the bookmark, and which future events must remain unknown?"],
  };
  return [...questions[laneId], shared];
}

function buildManifest(country, registryCountry) {
  return {
    schema_version: "0.1.0",
    manifest_id: `research_manifest_${country.country_code.toLowerCase()}_2025_09_01`,
    country_id: registryCountry.country_id,
    country_code: country.country_code,
    country_name: registryCountry.name,
    depth_tier: registryCountry.depth_tier,
    gdp_rank: registryCountry.gdp_rank,
    bookmark_id: wave.bookmark_id,
    as_of: wave.as_of,
    status: "shell",
    research_wave: wave.wave_id,
    contract_path: "../country_research_contract.json",
    files: {
      profile: "profile.json",
      lane_coverage: "lane_coverage.json",
      work_packages: "WORK_PACKAGES.md",
      evidence_registry: null,
      bookmark_state: null,
      force_ledger: null,
    },
    lane_ids: lanes.map(([laneId]) => laneId),
    acceptance: {
      all_lanes_assessed: false,
      political_actor_roster_reviewed: false,
      administrative_geography_reviewed: false,
      force_ledger_reconciled: false,
      fixed_facility_layer_reviewed: false,
      infrastructure_networks_reviewed: false,
      alliances_and_crises_reviewed: false,
      bookmark_firewall_passed: false,
      independent_review_complete: false,
    },
    accepted_source_count: 0,
    accepted_claim_count: 0,
    open_contradiction_count: 0,
    unknowns: [
      "No country specific source or atomic claim has been accepted into this wave artifact.",
      "Government, economy, force inventory, readiness, facilities, infrastructure, geography, alliances, crises, and deployments remain unknown until sourced.",
      "A zero count describes accepted corpus records and never asserts real world absence.",
    ],
    notes: "This manifest opens bounded research work only. It is nonfactual, nonexecutable, and cannot initialize simulation state.",
  };
}

function buildLaneMatrix(country, registryCountry) {
  const matrix = {};
  for (const [laneId, name] of lanes) {
    matrix[laneId] = {
      name,
      status: "shell",
      owner: null,
      record_count: 0,
      source_count: 0,
      claim_count: 0,
      contradiction_count: 0,
      exact_geometry_count: 0,
      approximate_geometry_count: 0,
      unknown_geometry_count: 0,
      oldest_source_date: null,
      newest_source_date: null,
      reviewed_at: null,
      review_after: null,
      coverage_disposition: "research_questions_defined_no_evidence_accepted",
      blocking_questions: laneQuestions(country, laneId),
      notes: "Planning questions exist, but no country specific evidence has been accepted. Zero counts describe corpus state only.",
    };
  }
  return {
    schema_version: "0.1.0",
    matrix_id: `lane_coverage_${country.country_code.toLowerCase()}_2025_09_01`,
    country_id: registryCountry.country_id,
    bookmark_id: wave.bookmark_id,
    as_of: wave.as_of,
    overall_status: "shell",
    research_wave: wave.wave_id,
    lanes: matrix,
    rollup: {
      lanes_total: lanes.length,
      shell: lanes.length,
      collecting: 0,
      needs_review: 0,
      verified: 0,
      stale: 0,
      deprecated: 0,
    },
  };
}

function buildWorkPackages(country, registryCountry) {
  const focus = country.focus_questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
  const laneSections = lanes.map(([laneId, name], index) => {
    const questions = laneQuestions(country, laneId).map((question, questionIndex) => `${questionIndex + 1}. ${question}`).join("\n");
    return `## Package ${index + 1}: ${name}\n\nStatus: shell.\n\nQuestions:\n\n${questions}\n\nDeliverables:\n\n1. Registered sources with publication, retrieval, and temporal use metadata.\n2. Atomic claims with measure, scope, time, uncertainty, and source identifiers.\n3. Contradiction records where credible evidence diverges.\n4. A lane acceptance report that preserves unknowns and the bookmark cutoff.\n\nAcceptance: the package remains collecting until every factual record is source linked, quantities declare units and scope, and no later event leaks into opening knowledge.\n`;
  }).join("\n");
  return `# ${registryCountry.name} Tier B Research Work Packages\n\n## Status\n\nThis is a planning artifact for ${wave.wave_id}. No factual country record is created by this document. Every lane remains shell until sources and atomic claims are accepted.\n\n## Country focus\n\n${focus}\n\n## Shared operating rules\n\n1. Research the complete national system, not only assets visible in one crisis.\n2. Separate possession, organization, disposition, availability, readiness, and player knowledge.\n3. Treat exercises and deployments as overlays on a conserved national ledger.\n4. Use exact coordinates only when public evidence supports that precision and gameplay requires it.\n5. Keep post bookmark evidence outside opening state unless a firewall review proves legitimate retrospective use.\n6. Do not create executable units, facilities, relationships, or capabilities from planning prose.\n\n${laneSections}\n## Package 9: Bookmark integration\n\nStatus: blocked until lane evidence exists.\n\nDeliverables:\n\n1. A source linked opening government and actor state.\n2. Reconciled economic, military, infrastructure, geographic, alliance, sanctions, crisis, and deployment references.\n3. A post cutoff knowledge firewall report.\n4. Explicit unresolved assumptions and alternate initialization candidates.\n5. A traceability proposal for later game design review.\n\nAcceptance: every populated opening field traces to accepted claims, incomplete force pools remain nonexecutable, and future history is not predetermined.\n`;
}

for (const country of wave.countries) {
  const registryCountry = registryByCode.get(country.country_code);
  if (!registryCountry) throw new Error(`Missing registry country ${country.country_code}`);
  const countryDirectory = path.join(countriesRoot, country.country_code.toLowerCase());
  writeGenerated(path.join(countryDirectory, "research_manifest.json"), JSON.stringify(buildManifest(country, registryCountry), null, 2));
  writeGenerated(path.join(countryDirectory, "lane_coverage.json"), JSON.stringify(buildLaneMatrix(country, registryCountry), null, 2));
  writeGenerated(path.join(countryDirectory, "WORK_PACKAGES.md"), buildWorkPackages(country, registryCountry));
}

const report = {
  status: differences.length ? "FAIL" : "PASS",
  mode: checkOnly ? "check" : "write",
  wave_id: wave.wave_id,
  countries: wave.countries.length,
  generated_files: wave.countries.length * 3,
  differences,
};

console.log(JSON.stringify(report, null, 2));
if (differences.length) process.exitCode = 1;
