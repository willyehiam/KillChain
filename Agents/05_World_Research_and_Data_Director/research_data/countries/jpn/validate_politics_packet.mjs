#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));
const packet = {
  evidence: read("evidence_registry.json"),
  politics: read("politics_and_institutions.json"),
  workflow: read("war_authority_workflow.json"),
  bookmark: read("bookmark_state.json"),
  profile: read("profile.json"),
  manifest: read("research_manifest.json"),
  matrix: read("lane_coverage.json"),
  forceLedger: read("force_ledger/manifest.json"),
};
const bookmark = new Date("2025-09-01T23:59:59Z");

function validate(candidate) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  const sourceIds = new Set(candidate.evidence.sources.map((source) => source.source_id));
  const claimIds = new Set(candidate.evidence.claims.map((claim) => claim.claim_id));
  const actorIds = new Set(candidate.politics.political_actors.map((actor) => actor.actor_id));
  const institutionIds = new Set(candidate.politics.institutions.map((institution) => institution.institution_id));
  const gateIds = new Set(candidate.workflow.decision_gates.map((gate) => gate.gate_id));

  assert(candidate.evidence.country_id === "country_jpn", "Evidence country mismatch");
  assert(candidate.evidence.bookmark_id === "bookmark_global_fracture_2025_09_01", "Evidence bookmark mismatch");
  assert(sourceIds.size === candidate.evidence.sources.length, "Duplicate source identifiers");
  assert(claimIds.size === candidate.evidence.claims.length, "Duplicate claim identifiers");
  assert(actorIds.size === 20 && candidate.politics.political_actors.length === 20, "Japan actor roster must contain exactly 20 unique actors");
  assert(institutionIds.size === candidate.politics.institutions.length, "Duplicate institution identifiers");

  for (const source of candidate.evidence.sources) {
    if (source.published_at) assert(new Date(`${source.published_at}T23:59:59Z`) <= bookmark, `Post bookmark source accepted: ${source.source_id}`);
    const proof = source.bookmark_temporal_proof;
    assert(Boolean(proof), `Source lacks temporal proof: ${source.source_id}`);
    if (proof?.published_at) assert(new Date(`${proof.published_at}T23:59:59Z`) <= bookmark, `Post bookmark temporal proof: ${source.source_id}`);
  }
  for (const claim of candidate.evidence.claims) {
    assert(new Date(claim.as_of) <= bookmark, `Post bookmark claim: ${claim.claim_id}`);
    assert(claim.source_ids.length > 0, `Claim lacks source: ${claim.claim_id}`);
    for (const sourceId of claim.source_ids) assert(sourceIds.has(sourceId), `Claim ${claim.claim_id} references missing source ${sourceId}`);
  }
  for (const actor of candidate.politics.political_actors) {
    assert(actor.source_ids.length > 0, `Actor lacks source: ${actor.actor_id}`);
    for (const sourceId of actor.source_ids) assert(sourceIds.has(sourceId), `Actor ${actor.actor_id} references missing source ${sourceId}`);
    for (const institutionId of actor.institution_ids) assert(institutionIds.has(institutionId), `Actor ${actor.actor_id} references missing institution ${institutionId}`);
    assert(actor.selection_basis_status === "institutional_relevance_only", `Actor ${actor.actor_id} selection basis is overclaimed`);
    assert(actor.practical_influence.status === "unaccepted", `Actor ${actor.actor_id} practical influence was promoted without evidence`);
  }

  const normalRoute = candidate.workflow.routes.find((route) => route.route_id === "route_jpn_defense_operations_normal");
  const urgentRoute = candidate.workflow.routes.find((route) => route.route_id === "route_jpn_defense_operations_urgent");
  const supportRoute = candidate.workflow.routes.find((route) => route.route_id === "route_jpn_allied_action_support");
  assert(Boolean(normalRoute), "Normal defense route missing");
  assert(Boolean(urgentRoute), "Urgent defense route missing");
  assert(Boolean(supportRoute), "Allied support route missing");
  for (const route of candidate.workflow.routes) {
    for (const gateId of route.gate_ids ?? []) assert(gateIds.has(gateId), `Route ${route.route_id} references missing gate ${gateId}`);
    for (const gateId of route.post_activation_gate_ids ?? []) assert(gateIds.has(gateId), `Route ${route.route_id} references missing post activation gate ${gateId}`);
  }
  for (const required of ["gate_jpn_qualifying_situation", "gate_jpn_basic_response_plan", "gate_jpn_cabinet_decision", "gate_jpn_prior_diet_approval", "gate_jpn_prime_minister_order"]) {
    assert(normalRoute?.gate_ids.includes(required), `Normal defense route lacks ${required}`);
  }
  assert(urgentRoute?.gate_ids.includes("gate_jpn_independent_urgent_necessity"), "Urgent defense route lacks independent urgency fact");
  assert(urgentRoute?.post_activation_gate_ids.includes("gate_jpn_subsequent_diet_approval"), "Urgent defense route lacks subsequent Diet obligation");
  assert(supportRoute?.automatic_kinetic_authority === false, "Allied support silently creates kinetic authority");
  assert(candidate.workflow.taiwan_contingency_guard.attack_on_taiwan_auto_activates_japanese_authority === false, "Taiwan attack silently activates Japanese authority");
  assert(candidate.workflow.taiwan_contingency_guard.attack_on_taiwan_auto_activates_treaty_article_v === false, "Taiwan attack silently activates Article V");
  assert(candidate.workflow.acceptance_rules.jjoc_tasking_creates_political_authority === false, "JJOC tasking silently creates political authority");

  assert(candidate.bookmark.political_actors.length === 20 && candidate.bookmark.political_actors.every((actorId) => actorIds.has(actorId)), "Bookmark actor roster mismatch");
  assert(candidate.bookmark.military_posture === null, "Politics packet must not create military posture");
  assert(candidate.profile.completeness.political_actor_count === 20, "Profile actor count mismatch");
  assert(candidate.profile.completeness.force_ledger_status.includes("nonexecutable"), "Linked force ledger must remain nonexecutable");
  assert(candidate.manifest.files.evidence_registry === "evidence_registry.json", "Manifest does not link evidence registry");
  assert(candidate.manifest.files.bookmark_state === "bookmark_state.json", "Manifest does not link bookmark state");
  assert(candidate.manifest.files.force_ledger === "force_ledger/manifest.json", "Manifest force ledger link mismatch");
  assert(candidate.forceLedger.country_id === "country_jpn", "Force ledger country mismatch");
  assert(candidate.forceLedger.status === "collecting", "Force ledger must remain collecting");
  assert(candidate.forceLedger.acceptance.simulation_ready === false, "Force ledger silently became executable");
  assert(candidate.matrix.lanes.politics_and_institutions.status === "needs_review", "Politics lane status mismatch");
  assert(candidate.matrix.lanes.crises_alliances_sanctions_deployments.status === "needs_review", "Alliance lane status mismatch");
  return errors;
}

const baselineErrors = validate(packet);
const mutationResults = [];

function mutation(name, mutate, expectedFragment) {
  const candidate = structuredClone(packet);
  mutate(candidate);
  const errors = validate(candidate);
  const passed = errors.some((error) => error.includes(expectedFragment));
  mutationResults.push({ name, passed, errors: passed ? [] : errors });
}

mutation("reject_missing_prior_diet_gate", (candidate) => {
  candidate.workflow.routes.find((route) => route.route_id === "route_jpn_defense_operations_normal").gate_ids = candidate.workflow.routes.find((route) => route.route_id === "route_jpn_defense_operations_normal").gate_ids.filter((gateId) => gateId !== "gate_jpn_prior_diet_approval");
}, "Normal defense route lacks gate_jpn_prior_diet_approval");

mutation("reject_automatic_taiwan_intervention", (candidate) => {
  candidate.workflow.taiwan_contingency_guard.attack_on_taiwan_auto_activates_japanese_authority = true;
}, "Taiwan attack silently activates Japanese authority");

mutation("reject_post_bookmark_source", (candidate) => {
  candidate.evidence.sources[0].published_at = "2025-09-02";
}, "Post bookmark source accepted");

const errors = [...baselineErrors];
for (const result of mutationResults) if (!result.passed) errors.push(`Mutation test failed: ${result.name}`);

console.log(JSON.stringify({
  status: errors.length ? "FAIL" : "PASS",
  sources: packet.evidence.sources.length,
  claims: packet.evidence.claims.length,
  actors: packet.politics.political_actors.length,
  institutions: packet.politics.institutions.length,
  routes: packet.workflow.routes.length,
  mutation_tests: mutationResults,
  errors,
}, null, 2));

if (errors.length) process.exitCode = 1;
