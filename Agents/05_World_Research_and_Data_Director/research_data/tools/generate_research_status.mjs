#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCorpus } from "./corpus_integrity.mjs";

const toolsRoot = path.dirname(fileURLToPath(import.meta.url));
const researchRoot = path.resolve(toolsRoot, "..");
const countriesRoot = path.join(researchRoot, "countries");
const checkOnly = process.argv.includes("--check");
const auditDate = "2026-08-10";
const outputJson = path.join(researchRoot, "research_status.json");
const outputMarkdown = path.join(researchRoot, "RESEARCH_STATUS.md");
const laneIds = [
  "politics_and_institutions",
  "economy_trade_finance_resources",
  "military_organization_inventory",
  "fixed_facilities_basing",
  "strategic_industry_conversion",
  "energy_transport_communications_logistics",
  "geography_provinces_terrain",
  "crises_alliances_sanctions_deployments",
];
const statusOrder = ["shell", "collecting", "needs_review", "verified", "stale", "deprecated"];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function countBy(values, accepted = null) {
  const counts = Object.fromEntries((accepted ?? [...new Set(values)]).map((value) => [value, 0]));
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function directoryNames(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function substantiveDirectory(root, name) {
  const directory = path.join(root, name);
  return fs.readdirSync(directory, { withFileTypes: true })
    .some((entry) => entry.name !== "README.md");
}

const registry = readJson(path.join(countriesRoot, "country_registry.json"));
const countryRows = [];
const laneStatuses = [];
const forceLedgers = [];

for (const country of registry.countries) {
  const code = country.country_code.toLowerCase();
  const directory = path.join(countriesRoot, code);
  const profile = readJson(path.join(directory, "profile.json"));
  const politicsPath = path.join(directory, "politics_and_institutions.json");
  const politics = fs.existsSync(politicsPath) ? readJson(politicsPath) : null;
  const forceManifestPath = path.join(directory, "force_ledger", "manifest.json");
  const forceManifest = fs.existsSync(forceManifestPath) ? readJson(forceManifestPath) : null;
  for (const laneId of laneIds) laneStatuses.push(profile.coverage[laneId].status);
  countryRows.push({
    country_code: country.country_code,
    name: country.name,
    depth_tier: country.depth_tier,
    profile_status: profile.coverage_status,
    political_actor_count: politics?.political_actors?.length ?? politics?.actors?.length ?? 0,
    force_ledger_status: forceManifest?.status ?? "absent",
    non_shell_lanes: laneIds.filter((laneId) => profile.coverage[laneId].status !== "shell"),
  });
  if (forceManifest) {
    forceLedgers.push({
      country_code: country.country_code,
      status: forceManifest.status,
      simulation_ready: forceManifest.acceptance?.simulation_ready === true,
      decision_usable: forceManifest.acceptance?.decision_usable === true,
    });
  }
}

const fullyModeledRoot = path.join(researchRoot, "theaters", "fully_modeled");
const secondaryRoot = path.join(researchRoot, "theaters", "secondary_crises");
const eventRoot = path.join(researchRoot, "political_event_chains");
const fullyModeled = directoryNames(fullyModeledRoot);
const secondary = directoryNames(secondaryRoot);
const politicalEvents = directoryNames(eventRoot);
const corpus = validateCorpus(researchRoot);
const openingAcceptanceRoot = path.join(
  fullyModeledRoot,
  "china_taiwan_south_china_sea",
  "opening_crisis_acceptance_2025",
);
const openingAcceptanceFixturePath = path.join(openingAcceptanceRoot, "acceptance_fixture.json");
const openingParticipationPath = path.join(openingAcceptanceRoot, "participation_matrix.json");
const openingAcceptance = fs.existsSync(openingAcceptanceFixturePath)
  ? readJson(openingAcceptanceFixturePath)
  : null;
const openingParticipation = fs.existsSync(openingParticipationPath)
  ? readJson(openingParticipationPath)
  : null;

const status = {
  schema_version: "0.1.0",
  report_id: "killweb_research_status_2026_08_10",
  audit_date: auditDate,
  bookmark_id: "bookmark_global_fracture_2025_09_01",
  stage: "research",
  corpus_validation: {
    status: corpus.status,
    counts: corpus.counts,
    error_count: corpus.errors.length,
    warning_count: corpus.warnings.length,
  },
  countries: {
    total: countryRows.length,
    by_depth_tier: countBy(countryRows.map((country) => country.depth_tier), ["A", "B", "C"]),
    by_profile_status: countBy(countryRows.map((country) => country.profile_status), statusOrder),
    lane_statuses: countBy(laneStatuses, statusOrder),
    actor_roster_complete: countryRows.filter((country) => country.political_actor_count >= 20).length,
    force_ledgers_present: forceLedgers.length,
    force_ledgers_simulation_ready: forceLedgers.filter((ledger) => ledger.simulation_ready).length,
    substantive: countryRows.filter((country) => country.profile_status !== "shell"),
  },
  conflict_world: {
    fully_modeled_total: fullyModeled.length,
    fully_modeled_substantive: fullyModeled.filter((name) => substantiveDirectory(fullyModeledRoot, name)),
    fully_modeled_scaffolds: fullyModeled.filter((name) => !substantiveDirectory(fullyModeledRoot, name)),
    secondary_total: secondary.length,
    secondary_substantive: secondary.filter((name) => substantiveDirectory(secondaryRoot, name)),
    secondary_scaffolds: secondary.filter((name) => !substantiveDirectory(secondaryRoot, name)),
    political_event_total: politicalEvents.length,
    political_event_substantive: politicalEvents.filter((name) => substantiveDirectory(eventRoot, name)),
    political_event_scaffolds: politicalEvents.filter((name) => !substantiveDirectory(eventRoot, name)),
  },
  playable_proofs: {
    acceptance_stories_supported: openingAcceptance ? 1 : 0,
    deterministic_fixture_id: openingAcceptance?.fixture_id ?? null,
    deep_opening_countries: openingParticipation?.countries?.length ?? 0,
    authority_routes_checked: openingParticipation?.countries
      ?.flatMap((country) => country.authority_route_ids ?? []).length ?? 0,
  },
  immediate_blockers: [
    "No national force ledger is simulation ready.",
    "Japan, South Korea, and the Philippines have substantive politics and authority evidence, but no Tier B national force ledger exists.",
    "Only the China Taiwan South China Sea theater has substantive machine readable records.",
    "All secondary crises and political event chains remain scaffolds.",
    "Global infrastructure networks remain unintegrated outside the Taiwan foundation.",
    "The research gate report, freshness dashboard, and cross domain traceability report remain incomplete.",
  ],
  next_dependency_order: [
    "Define conserved capability pools and support dependencies for Japan, South Korea, and the Philippines.",
    "Complete Japan military organization, national force ledger boundaries, strategic geography, and sustainment foundations.",
    "Extend the Indo Pacific acceptance fixture from collection and access into coercive response choices without building the production engine.",
    "Continue Tier B wave one country packets for North Korea, Russia, India, and Australia.",
    "Advance complete national force accounting for the United States, China, and Taiwan.",
    "Populate the remaining fully modeled theaters, secondary crises, event chains, and global networks.",
  ],
};

const substantiveRows = status.countries.substantive
  .map((country) => `| ${country.country_code} | ${country.name} | ${country.depth_tier} | ${country.profile_status} | ${country.political_actor_count} | ${country.force_ledger_status} | ${country.non_shell_lanes.length} |`)
  .join("\n");
const markdown = `# KillWeb Research Status\n\nAudit date: ${auditDate}.\n\nOpening bookmark: 1 September 2025 at 00:00 UTC.\n\nStage: research. Simulation engine implementation, final visual design, and production development remain gated.\n\n## Executive state\n\n1. ${status.countries.total} country profiles exist: ${status.countries.by_depth_tier.A} Tier A, ${status.countries.by_depth_tier.B} Tier B, and ${status.countries.by_depth_tier.C} Tier C.\n2. ${status.countries.actor_roster_complete} countries have twenty actor political rosters.\n3. ${status.countries.force_ledgers_present} national force ledgers exist, and ${status.countries.force_ledgers_simulation_ready} are simulation ready.\n4. ${status.conflict_world.fully_modeled_substantive.length} of ${status.conflict_world.fully_modeled_total} fully modeled theater directories contain substantive machine readable work.\n5. ${status.conflict_world.secondary_substantive.length} of ${status.conflict_world.secondary_total} secondary crises and ${status.conflict_world.political_event_substantive.length} of ${status.conflict_world.political_event_total} political event chains contain substantive work.\n6. The corpus validator passes ${status.corpus_validation.counts.files} files, ${status.corpus_validation.counts.parsed_records} parsed records, and ${status.corpus_validation.counts.objects} objects with ${status.corpus_validation.error_count} errors and ${status.corpus_validation.warning_count} warnings.\n\n## Country status\n\n| Code | Country | Tier | Profile | Political actors | Force ledger | Non shell lanes |\n| --- | --- | --- | --- | ---: | --- | ---: |\n${substantiveRows}\n\nAll other country profiles remain structural shells. A shell count is corpus completeness, never a claim of real world absence.\n\n## Lane coverage\n\n1. Shell lanes: ${status.countries.lane_statuses.shell}.\n2. Collecting lanes: ${status.countries.lane_statuses.collecting}.\n3. Lanes needing review: ${status.countries.lane_statuses.needs_review}.\n4. Verified lanes: ${status.countries.lane_statuses.verified}.\n5. Stale lanes: ${status.countries.lane_statuses.stale}.\n6. Deprecated lanes: ${status.countries.lane_statuses.deprecated}.\n\n## Immediate blockers\n\n${status.immediate_blockers.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n## Next dependency order\n\n${status.next_dependency_order.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n## Machine authority\n\nThe companion file \`research_status.json\` is generated from country profiles, force ledger manifests, theater directories, political event directories, and the corpus integrity validator. This document must not be updated manually.\n`;

const markdownWithProofs = markdown.replace(
  "6. The corpus validator passes",
  `6. ${status.playable_proofs.acceptance_stories_supported} deterministic acceptance story covers ${status.playable_proofs.deep_opening_countries} deep opening countries and ${status.playable_proofs.authority_routes_checked} authority routes.\n7. The corpus validator passes`,
);

const outputs = [
  [outputJson, `${JSON.stringify(status, null, 2)}\n`],
  [outputMarkdown, markdownWithProofs],
];
const differences = [];
for (const [file, content] of outputs) {
  if (checkOnly) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) differences.push(path.relative(researchRoot, file));
  } else {
    fs.writeFileSync(file, content);
  }
}

console.log(JSON.stringify({
  status: differences.length ? "FAIL" : "PASS",
  mode: checkOnly ? "check" : "write",
  generated_files: outputs.length,
  countries: status.countries.total,
  substantive_countries: status.countries.substantive.length,
  differences,
}, null, 2));
if (differences.length) process.exitCode = 1;
