#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(scriptDirectory, "..");
const checkOnly = process.argv.includes("--check");
const requestedCodes = process.argv
  .slice(2)
  .filter((argument) => !argument.startsWith("--"))
  .map((code) => code.toLowerCase());
const differences = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeGenerated(file, value) {
  const content = stableJson(value);
  if (checkOnly) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) {
      differences.push(path.relative(countriesRoot, file));
    }
    return;
  }
  fs.writeFileSync(file, content);
}

function sourceDateBounds(sources) {
  const dates = sources.flatMap((source) => {
    const proof = source.bookmark_temporal_proof ?? {};
    return [proof.effective_from, proof.published_at, source.published_at].filter(Boolean);
  }).sort();
  return {
    oldest: dates.at(0) ?? null,
    newest: dates.at(-1) ?? null,
  };
}

function mergeProfile(profile, source) {
  const result = structuredClone(profile);
  const actorCount = source.politics.actors.length;
  result.coverage_status = "collecting";
  result.coverage.politics_and_institutions = {
    status: "needs_review",
    record_count: source.politics.actors.length + source.politics.institutions.length,
    source_count: new Set(source.politics.source_ids).size,
    open_question_count: source.workflow.unresolved_interpretations.length,
    notes: "Opening actors, institutions, succession, and authority routes are collected but require independent review. Formal office does not prove practical influence.",
  };
  result.coverage.crises_alliances_sanctions_deployments = {
    status: "needs_review",
    record_count: source.bookmark.alliances.length + source.workflow.routes.length,
    source_count: new Set(source.workflow.source_ids).size,
    open_question_count: source.workflow.unresolved_interpretations.length,
    notes: "Alliance consultation, domestic authority, access, and operational tasking are separated. Force disposition remains unknown.",
  };
  result.dataset_paths.government = "politics_and_institutions.json";
  result.dataset_paths.political_actors = "politics_and_institutions.json";
  result.dataset_paths.bookmark_state = "bookmark_state.json";
  result.dataset_paths.relationships = "war_authority_workflow.json";
  result.completeness.political_actor_count = actorCount;
  result.source_ids = [...new Set([...(result.source_ids ?? []), ...source.evidence.sources.map((item) => item.source_id)])];
  if (typeof result.dataset_paths.force_ledger === "string") {
    result.unknowns = [
      ...source.profile_unknowns.filter((item) => !item.startsWith("Military organization")),
      "A linked force ledger may establish bounded organization or dated claims, but complete inventory, readiness, basing, maintenance, assignment, support, and deployment remain unknown unless that ledger explicitly resolves them.",
    ];
    result.notes = "Generated authority data is integrated with a separately sourced, nonexecutable force ledger. Political authority, force custody, support, readiness, and mission release remain separate gates.";
  } else {
    result.unknowns = source.profile_unknowns;
    result.notes = "Generated from a declarative authority packet. Politics and alliance authority are collecting; forces, facilities, readiness, and deployment remain nonexecutable unless separately sourced.";
  }
  return result;
}

function mergeManifest(manifest, source, directory) {
  const result = structuredClone(manifest);
  const forceLedgerPath = typeof result.files.force_ledger === "string"
    ? path.resolve(directory, result.files.force_ledger)
    : null;
  const forceLedger = forceLedgerPath && fs.existsSync(forceLedgerPath)
    ? readJson(forceLedgerPath)
    : null;
  result.status = "collecting";
  Object.assign(result.files, {
    evidence_registry: "evidence_registry.json",
    bookmark_state: "bookmark_state.json",
    politics_and_institutions: "politics_and_institutions.json",
    war_authority_workflow: "war_authority_workflow.json",
  });
  result.accepted_source_count = new Set([
    ...source.evidence.sources.map((item) => item.source_id),
    ...(forceLedger?.source_ids ?? []),
  ]).size;
  result.accepted_claim_count = source.evidence.claims.length + (forceLedger?.reconciliation?.claim_records ?? 0);
  result.open_contradiction_count = source.evidence.contradictions.filter((item) => item.status !== "resolved").length;
  result.unknowns = [
    "Politics, constitutional authority, alliance scope, and command institutions are collecting and require independent review.",
    forceLedger
      ? "A separately linked force ledger is collecting, but complete inventory, readiness, facilities, infrastructure, geography, support, assignments, and deployments remain unknown unless explicitly resolved."
      : "Economy beyond the frozen GDP roster, force inventory, readiness, facilities, infrastructure, geography, and deployments remain unknown unless separately linked.",
    "A zero count describes accepted corpus records and never asserts real world absence.",
  ];
  result.notes = forceLedger
    ? "Substantive politics and alliance authority are integrated with a separately sourced, nonexecutable force ledger."
    : "This country has substantive politics and alliance authority data only. No force, facility, readiness, location, or deployment state is implied.";
  return result;
}

function mergeLaneCoverage(matrix, source) {
  const result = structuredClone(matrix);
  const bounds = sourceDateBounds(source.evidence.sources);
  result.overall_status = "collecting";
  for (const [laneId, update] of Object.entries(source.lane_updates)) {
    const lane = result.lanes[laneId];
    Object.assign(lane, {
      status: "needs_review",
      owner: "agent_05_world_research_and_data_director",
      record_count: update.record_count,
      source_count: update.source_ids.length,
      claim_count: update.claim_ids.length,
      contradiction_count: update.contradiction_ids.length,
      oldest_source_date: bounds.oldest,
      newest_source_date: bounds.newest,
      reviewed_at: source.review.reviewed_at,
      review_after: source.review.review_after,
      coverage_disposition: update.coverage_disposition,
      notes: update.notes,
    });
  }
  const counts = Object.values(result.lanes).reduce((rollup, lane) => {
    rollup[lane.status] = (rollup[lane.status] ?? 0) + 1;
    return rollup;
  }, {});
  result.rollup = {
    lanes_total: Object.keys(result.lanes).length,
    shell: counts.shell ?? 0,
    collecting: counts.collecting ?? 0,
    needs_review: counts.needs_review ?? 0,
    verified: counts.verified ?? 0,
    stale: counts.stale ?? 0,
    deprecated: counts.deprecated ?? 0,
  };
  return result;
}

function buildEvidenceRegistry(source) {
  return {
    schema_version: "0.3.0",
    registry_id: `evidence_registry_${source.country.code.toLowerCase()}_2025_09_01`,
    country_id: source.country.id,
    bookmark_id: source.bookmark_id,
    as_of: source.as_of,
    status: "needs_review",
    staging_rules: source.evidence.staging_rules,
    sources: source.evidence.sources,
    claims: source.evidence.claims,
    contradictions: source.evidence.contradictions,
  };
}

function buildPolitics(source) {
  return {
    schema_version: "0.3.0",
    dataset_id: `politics_and_institutions_${source.country.code.toLowerCase()}_2025_09_01`,
    country_id: source.country.id,
    bookmark_id: source.bookmark_id,
    as_of: source.as_of,
    status: "needs_review",
    roster_rule: source.politics.roster_rule,
    government: source.politics.government,
    institutions: source.politics.institutions,
    actors: source.politics.actors,
    succession: source.politics.succession,
    unresolved_questions: source.politics.unresolved_questions,
    source_ids: source.politics.source_ids,
  };
}

function buildWorkflow(source) {
  return {
    schema_version: "0.3.0",
    workflow_id: `war_authority_${source.country.code.toLowerCase()}_2025_09_01`,
    country_id: source.country.id,
    bookmark_id: source.bookmark_id,
    as_of: source.as_of,
    status: "needs_review",
    design_rule: "Political authority, alliance consultation, access, force allocation, and operational tasking are separate state transitions.",
    routes: source.workflow.routes,
    gates: source.workflow.gates,
    taiwan_contingency_guard: source.workflow.taiwan_contingency_guard,
    acceptance_rules: source.workflow.acceptance_rules,
    unresolved_interpretations: source.workflow.unresolved_interpretations,
    source_ids: source.workflow.source_ids,
  };
}

function buildBookmark(source) {
  return {
    schema_version: "0.3.0",
    bookmark_state_id: `bookmark_state_${source.country.code.toLowerCase()}_2025_09_01`,
    country_id: source.country.id,
    bookmark_id: source.bookmark_id,
    as_of: source.as_of,
    status: "collecting",
    knowledge_firewall_status: "needs_independent_review",
    government: source.bookmark.government,
    political_actors: source.politics.actors.map((actor) => actor.actor_id),
    administrative_geography: [],
    economic_state: "../top_80_2025/top_80_2025_gdp.json",
    military_posture: null,
    fixed_facilities: [],
    strategic_industry: [],
    infrastructure_networks: [],
    alliances: source.bookmark.alliances,
    sanctions: source.bookmark.sanctions,
    active_crises: source.bookmark.active_crises,
    foreign_deployments: [],
    unresolved_assumptions: source.bookmark.unresolved_assumptions,
    source_ids: source.evidence.sources.map((item) => item.source_id),
    claim_ids: source.evidence.claims.map((item) => item.claim_id),
    notes: "Only politics, authority, and alliance scope are collecting. Forces and infrastructure remain absent or shell unless separately linked.",
    acceptance_state: {
      politics_lane_status: "needs_review",
      alliance_lane_status: "needs_review",
      bookmark_firewall_passed: false,
      independent_review_complete: false,
      authority_contract_reviewed: false,
    },
  };
}

function findPacketDirectories() {
  return fs.readdirSync(countriesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(countriesRoot, name, "authority_packet.source.json")))
    .filter((name) => requestedCodes.length === 0 || requestedCodes.includes(name))
    .sort();
}

const packetDirectories = findPacketDirectories();
for (const directoryName of packetDirectories) {
  const directory = path.join(countriesRoot, directoryName);
  const source = readJson(path.join(directory, "authority_packet.source.json"));
  const profile = readJson(path.join(directory, "profile.json"));
  const manifest = readJson(path.join(directory, "research_manifest.json"));
  const laneCoverage = readJson(path.join(directory, "lane_coverage.json"));

  writeGenerated(path.join(directory, "evidence_registry.json"), buildEvidenceRegistry(source));
  writeGenerated(path.join(directory, "politics_and_institutions.json"), buildPolitics(source));
  writeGenerated(path.join(directory, "war_authority_workflow.json"), buildWorkflow(source));
  writeGenerated(path.join(directory, "bookmark_state.json"), buildBookmark(source));
  writeGenerated(path.join(directory, "profile.json"), mergeProfile(profile, source));
  writeGenerated(path.join(directory, "research_manifest.json"), mergeManifest(manifest, source, directory));
  writeGenerated(path.join(directory, "lane_coverage.json"), mergeLaneCoverage(laneCoverage, source));
}

const report = {
  status: differences.length ? "FAIL" : "PASS",
  mode: checkOnly ? "check" : "write",
  packet_count: packetDirectories.length,
  country_codes: packetDirectories.map((name) => name.toUpperCase()),
  generated_files: packetDirectories.length * 7,
  differences,
};

console.log(JSON.stringify(report, null, 2));
if (differences.length) process.exitCode = 1;
