#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(scriptDirectory, "..");
const requestedCodes = process.argv.slice(2).map((code) => code.toLowerCase());
const errors = [];
let mutationChecks = 0;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assert(condition, message, target = errors) {
  if (!condition) target.push(message);
}

function duplicateIds(records, field) {
  const seen = new Set();
  return records.map((record) => record[field]).filter((id) => seen.has(id) || !seen.add(id));
}

function validateSource(source) {
  const localErrors = [];
  const label = source.country?.code ?? "UNKNOWN";
  const asOfDate = source.as_of?.slice(0, 10);
  const sourceIds = new Set(source.evidence?.sources?.map((item) => item.source_id));
  const claimIds = new Set(source.evidence?.claims?.map((item) => item.claim_id));
  const institutionIds = new Set(source.politics?.institutions?.map((item) => item.institution_id));
  const actorIds = new Set(source.politics?.actors?.map((item) => item.actor_id));
  const gateIds = new Set(source.workflow?.gates?.map((item) => item.gate_id));

  assert(/^country_[a-z]{3}$/.test(source.country?.id ?? ""), `${label}: invalid country identity`, localErrors);
  assert(source.bookmark_id === "bookmark_global_fracture_2025_09_01", `${label}: wrong bookmark`, localErrors);
  assert(source.as_of === "2025-09-01T00:00:00Z", `${label}: wrong as_of`, localErrors);
  assert(duplicateIds(source.evidence.sources, "source_id").length === 0, `${label}: duplicate source ids`, localErrors);
  assert(duplicateIds(source.evidence.claims, "claim_id").length === 0, `${label}: duplicate claim ids`, localErrors);
  assert(duplicateIds(source.politics.institutions, "institution_id").length === 0, `${label}: duplicate institution ids`, localErrors);
  assert(duplicateIds(source.politics.actors, "actor_id").length === 0, `${label}: duplicate actor ids`, localErrors);
  assert(duplicateIds(source.workflow.gates, "gate_id").length === 0, `${label}: duplicate gate ids`, localErrors);
  assert(source.politics.actors.length >= 10, `${label}: actor roster does not cover the opening decision network`, localErrors);

  for (const evidence of source.evidence.sources) {
    const proof = evidence.bookmark_temporal_proof ?? {};
    const proofDate = proof.published_at ?? evidence.published_at;
    if (proof.status === "dated_prebookmark_publication") {
      assert(Boolean(proofDate) && proofDate <= asOfDate, `${label}: ${evidence.source_id} crosses the bookmark firewall`, localErrors);
    } else if (proof.status === "historically_valid_instrument_at_bookmark") {
      assert(Boolean(proof.effective_from) && proof.effective_from <= asOfDate, `${label}: ${evidence.source_id} lacks prebookmark legal effect`, localErrors);
    } else {
      assert(false, `${label}: ${evidence.source_id} has unsupported temporal proof`, localErrors);
    }
  }

  for (const claim of source.evidence.claims) {
    assert(claim.source_ids?.length > 0, `${label}: ${claim.claim_id} has no source`, localErrors);
    for (const sourceId of claim.source_ids ?? []) assert(sourceIds.has(sourceId), `${label}: ${claim.claim_id} references unknown source ${sourceId}`, localErrors);
  }
  for (const institution of source.politics.institutions) {
    for (const sourceId of institution.source_ids ?? []) assert(sourceIds.has(sourceId), `${label}: ${institution.institution_id} references unknown source`, localErrors);
  }
  for (const actor of source.politics.actors) {
    assert(actor.source_ids?.length > 0, `${label}: ${actor.actor_id} has no source`, localErrors);
    for (const sourceId of actor.source_ids ?? []) assert(sourceIds.has(sourceId), `${label}: ${actor.actor_id} references unknown source`, localErrors);
    for (const institutionId of actor.institution_ids ?? []) assert(institutionIds.has(institutionId), `${label}: ${actor.actor_id} references unknown institution`, localErrors);
  }
  for (const route of source.workflow.routes) {
    assert(route.required_gate_ids?.length > 0, `${label}: ${route.route_id} has no gate`, localErrors);
    for (const gateId of route.required_gate_ids ?? []) assert(gateIds.has(gateId), `${label}: ${route.route_id} references unknown gate ${gateId}`, localErrors);
  }
  for (const gate of source.workflow.gates) {
    for (const institutionId of gate.required_institution_ids ?? []) assert(institutionIds.has(institutionId), `${label}: ${gate.gate_id} references unknown institution`, localErrors);
  }
  assert(source.workflow.taiwan_contingency_guard.attack_on_taiwan_auto_activates_authority === false, `${label}: Taiwan auto activation is forbidden`, localErrors);
  assert(source.workflow.taiwan_contingency_guard.alliance_auto_activates_kinetic_participation === false, `${label}: alliance auto activation is forbidden`, localErrors);
  assert(source.workflow.acceptance_rules.treaty_equals_automatic_intervention === false, `${label}: treaty cannot equal intervention`, localErrors);
  assert(source.workflow.acceptance_rules.operational_tasking_creates_political_authority === false, `${label}: tasking cannot create authority`, localErrors);
  assert(source.bookmark.government.head_of_government_actor_id === null || actorIds.has(source.bookmark.government.head_of_government_actor_id), `${label}: unknown head of government`, localErrors);
  assert(source.bookmark.government.head_of_state_actor_id === null || actorIds.has(source.bookmark.government.head_of_state_actor_id), `${label}: unknown head of state`, localErrors);
  for (const lane of Object.values(source.lane_updates)) {
    for (const sourceId of lane.source_ids) assert(sourceIds.has(sourceId), `${label}: lane references unknown source`, localErrors);
    for (const claimId of lane.claim_ids) assert(claimIds.has(claimId), `${label}: lane references unknown claim`, localErrors);
  }
  return localErrors;
}

function mutationMustFail(source, mutate, name) {
  const candidate = structuredClone(source);
  mutate(candidate);
  mutationChecks += 1;
  assert(validateSource(candidate).length > 0, `${source.country.code}: mutation escaped validation: ${name}`);
}

const directories = fs.readdirSync(countriesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => fs.existsSync(path.join(countriesRoot, name, "authority_packet.source.json")))
  .filter((name) => requestedCodes.length === 0 || requestedCodes.includes(name))
  .sort();

for (const directoryName of directories) {
  const directory = path.join(countriesRoot, directoryName);
  const source = readJson(path.join(directory, "authority_packet.source.json"));
  errors.push(...validateSource(source));

  const profile = readJson(path.join(directory, "profile.json"));
  const manifest = readJson(path.join(directory, "research_manifest.json"));
  const laneCoverage = readJson(path.join(directory, "lane_coverage.json"));
  const bookmark = readJson(path.join(directory, "bookmark_state.json"));
  assert(profile.coverage_status === "collecting", `${source.country.code}: profile not promoted`);
  assert(manifest.status === "collecting", `${source.country.code}: manifest not promoted`);
  assert(profile.dataset_paths.force_ledger === manifest.files.force_ledger, `${source.country.code}: force ledger links diverge`);
  if (typeof profile.dataset_paths.force_ledger === "string") {
    const forceLedgerPath = path.resolve(directory, profile.dataset_paths.force_ledger);
    assert(fs.existsSync(forceLedgerPath), `${source.country.code}: linked force ledger is missing`);
    if (fs.existsSync(forceLedgerPath)) {
      const forceLedger = readJson(forceLedgerPath);
      assert(forceLedger.country_id === source.country.id, `${source.country.code}: force ledger country mismatch`);
      assert(forceLedger.bookmark_id === source.bookmark_id, `${source.country.code}: force ledger bookmark mismatch`);
      assert(forceLedger.status === "collecting", `${source.country.code}: force ledger promoted`);
      assert(forceLedger.acceptance?.simulation_ready === false, `${source.country.code}: authority integration accepted executable forces`);
    }
  } else {
    assert(profile.dataset_paths.force_ledger === null, `${source.country.code}: invalid force ledger link`);
  }
  assert(laneCoverage.rollup.needs_review === Object.keys(source.lane_updates).length, `${source.country.code}: lane rollup mismatch`);
  assert(bookmark.military_posture === null, `${source.country.code}: bookmark implied military posture`);

  mutationMustFail(source, (candidate) => {
    candidate.evidence.sources[0].bookmark_temporal_proof = { status: "dated_prebookmark_publication", published_at: "2025-09-02" };
  }, "post bookmark evidence");
  mutationMustFail(source, (candidate) => {
    candidate.workflow.taiwan_contingency_guard.attack_on_taiwan_auto_activates_authority = true;
  }, "Taiwan auto activation");
  mutationMustFail(source, (candidate) => {
    candidate.workflow.routes[0].required_gate_ids.push("gate_missing");
  }, "missing authority gate");
  mutationMustFail(source, (candidate) => {
    candidate.politics.actors[0].institution_ids.push("institution_missing");
  }, "missing institution");
}

const report = {
  status: errors.length ? "FAIL" : "PASS",
  validated_packets: directories.length,
  country_codes: directories.map((name) => name.toUpperCase()),
  mutation_checks: mutationChecks,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
