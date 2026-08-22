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

function readNdjson(file) {
  return fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
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

function buildManifest(country, registryCountry, countryDirectory) {
  const manifest = {
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
  if (country.country_code === "JPN") {
    manifest.status = "collecting";
    manifest.files.evidence_registry = "evidence_registry.json";
    manifest.files.bookmark_state = "bookmark_state.json";
    manifest.files.politics_and_institutions = "politics_and_institutions.json";
    manifest.files.war_authority_workflow = "war_authority_workflow.json";
    manifest.accepted_source_count = 11;
    manifest.accepted_claim_count = 36;
    manifest.open_contradiction_count = 1;
    manifest.unknowns = [
      "Politics, constitutional authority, alliance scope, and joint command institutions are collecting and still require independent review.",
      "Economy beyond the frozen GDP roster, force inventory, readiness, facilities, infrastructure, geography, crisis deployments, and practical actor influence remain unknown.",
      "A zero count describes accepted corpus records and never asserts real world absence.",
    ];
    manifest.notes = "Japan has entered substantive collection for politics and alliance authority only. No force, facility, readiness, location, or deployment state is executable.";
  }
  const forceLedgerPath = path.join(countryDirectory, "force_ledger", "manifest.json");
  if (fs.existsSync(forceLedgerPath)) {
    const forceLedger = readJson(forceLedgerPath);
    manifest.status = "collecting";
    manifest.files.force_ledger = "force_ledger/manifest.json";
    manifest.accepted_source_count += forceLedger.reconciliation?.source_records ?? forceLedger.source_ids?.length ?? 0;
    manifest.accepted_claim_count += forceLedger.reconciliation?.claim_records ?? 0;
    manifest.unknowns = [
      manifest.unknowns[0],
      "A separately linked force ledger is collecting, but complete opening inventory, readiness, facilities, infrastructure, geography, support, assignments, and deployments remain unknown unless explicitly resolved.",
      "A zero count describes accepted corpus records and never asserts real world absence.",
    ];
    manifest.notes = "Political and alliance research is integrated with a separately sourced, nonexecutable force ledger.";
  }
  return manifest;
}

function buildLaneMatrix(country, registryCountry, countryDirectory) {
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
  if (country.country_code === "JPN") {
    Object.assign(matrix.politics_and_institutions, {
      status: "needs_review",
      owner: "agent_05_world_research_and_data_director",
      record_count: 35,
      source_count: 10,
      claim_count: 31,
      contradiction_count: 2,
      oldest_source_date: "1947-05-03",
      newest_source_date: "2025-09-01",
      reviewed_at: "2026-08-10",
      review_after: "2026-11-10",
      coverage_disposition: "opening_authority_and_actor_roster_collected_needs_independent_review",
      notes: "Twenty actors, fourteen institutions, the opening Cabinet, constitutional gates, and joint command roles are sourced. Practical influence and temporary Prime Minister succession order remain unknown.",
    });
    Object.assign(matrix.crises_alliances_sanctions_deployments, {
      status: "needs_review",
      owner: "agent_05_world_research_and_data_director",
      record_count: 6,
      source_count: 3,
      claim_count: 8,
      contradiction_count: 2,
      oldest_source_date: "1960-06-23",
      newest_source_date: "2025-09-01",
      reviewed_at: "2026-08-10",
      review_after: "2026-11-10",
      coverage_disposition: "alliance_scope_and_authority_routes_collected_needs_independent_review",
      notes: "Treaty consultation, Article V scope, facilities access, defense authority, and allied support are separated. Crisis deployments and sanctions remain unknown.",
    });
  }
  const forceLedgerPath = path.join(countryDirectory, "force_ledger", "manifest.json");
  if (fs.existsSync(forceLedgerPath)) {
    const forceLedger = readJson(forceLedgerPath);
    const claimsPath = forceLedger.dataset_paths?.claims
      ? path.resolve(path.dirname(forceLedgerPath), forceLedger.dataset_paths.claims)
      : null;
    const claims = claimsPath && fs.existsSync(claimsPath) ? readNdjson(claimsPath) : [];
    const dates = claims
      .flatMap((claim) => [claim.observation_period?.start, claim.observation_period?.end, claim.as_of])
      .filter(Boolean)
      .sort();
    Object.assign(matrix.military_organization_inventory, {
      status: "collecting",
      owner: "agent_05_world_research_and_data_director",
      record_count: forceLedger.reconciliation?.claim_records ?? claims.length,
      source_count: forceLedger.reconciliation?.source_records ?? forceLedger.source_ids?.length ?? 0,
      claim_count: forceLedger.reconciliation?.claim_records ?? claims.length,
      contradiction_count: 0,
      unknown_geometry_count: forceLedger.reconciliation?.claim_records ?? claims.length,
      oldest_source_date: dates[0] ?? null,
      newest_source_date: dates.at(-1) ?? null,
      reviewed_at: forceLedger.reviewed_at ?? null,
      review_after: forceLedger.review_after ?? null,
      coverage_disposition: "linked_force_claims_collected_opening_reconciliation_blocked",
      blocking_questions: [
        "Which intervening receipts, retirements, losses, conversions, and transfers change dated observations before the opening bookmark?",
        "How are national totals partitioned into mutually exclusive readiness, maintenance, training, reserve, storage, and deployment states?",
        "Which command, basing, crew, fuel, munitions, spares, sensing, and network dependencies make each capability executable?",
        "Which individual platforms and formations must be represented because identity changes command, mission, loss, or player choice?",
      ],
      notes: "The linked force ledger contributes sourced research claims only. It remains nonexecutable until opening stock, conservation, readiness, assignment, and support are reconciled.",
    });
  }
  const shellCount = Object.values(matrix).filter((lane) => lane.status === "shell").length;
  const collectingCount = Object.values(matrix).filter((lane) => lane.status === "collecting").length;
  const needsReviewCount = Object.values(matrix).filter((lane) => lane.status === "needs_review").length;
  return {
    schema_version: "0.1.0",
    matrix_id: `lane_coverage_${country.country_code.toLowerCase()}_2025_09_01`,
    country_id: registryCountry.country_id,
    bookmark_id: wave.bookmark_id,
    as_of: wave.as_of,
    overall_status: country.country_code === "JPN" ? "collecting" : "shell",
    research_wave: wave.wave_id,
    lanes: matrix,
    rollup: {
      lanes_total: lanes.length,
      shell: shellCount,
      collecting: collectingCount,
      needs_review: needsReviewCount,
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
  const sharedAuthorityPacket = fs.existsSync(path.join(countryDirectory, "authority_packet.source.json"));
  if (!sharedAuthorityPacket) {
    writeGenerated(path.join(countryDirectory, "research_manifest.json"), JSON.stringify(buildManifest(country, registryCountry, countryDirectory), null, 2));
    writeGenerated(path.join(countryDirectory, "lane_coverage.json"), JSON.stringify(buildLaneMatrix(country, registryCountry, countryDirectory), null, 2));
  }
  writeGenerated(path.join(countryDirectory, "WORK_PACKAGES.md"), buildWorkPackages(country, registryCountry));
}

const report = {
  status: differences.length ? "FAIL" : "PASS",
  mode: checkOnly ? "check" : "write",
  wave_id: wave.wave_id,
  countries: wave.countries.length,
  generated_files: wave.countries.reduce((count, country) => {
    const sharedAuthorityPacket = fs.existsSync(path.join(countriesRoot, country.country_code.toLowerCase(), "authority_packet.source.json"));
    return count + (sharedAuthorityPacket ? 1 : 3);
  }, 0),
  differences,
};

console.log(JSON.stringify(report, null, 2));
if (differences.length) process.exitCode = 1;
