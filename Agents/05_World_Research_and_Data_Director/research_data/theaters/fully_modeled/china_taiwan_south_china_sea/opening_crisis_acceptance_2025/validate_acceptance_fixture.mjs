#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = process.env.KILLWEB_ACCEPTANCE_FIXTURE ?? path.join(directory, "acceptance_fixture.json");
const matrixPath = process.env.KILLWEB_PARTICIPATION_MATRIX ?? path.join(directory, "participation_matrix.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
const errors = [];

function assert(condition, message, target = errors) {
  if (!condition) target.push(message);
}

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function initialState() {
  return {
    accounts: Object.fromEntries(fixture.synthetic_resources.accounts.map((account) => [account.account_id, structuredClone(account)])),
    consumed: {},
    beliefs: Object.fromEntries(fixture.beliefs.map((belief) => [belief.belief_id, structuredClone(belief)])),
    decisions: {},
    events: [],
  };
}

function totalsByResource(state) {
  const totals = {};
  for (const account of Object.values(state.accounts)) totals[account.resource_type] = (totals[account.resource_type] ?? 0) + account.quantity;
  for (const [resourceType, quantity] of Object.entries(state.consumed)) totals[resourceType] = (totals[resourceType] ?? 0) + quantity;
  return totals;
}

function runProbe(seed = fixture.seed) {
  const random = makeRandom(seed);
  const state = initialState();
  const openingTotals = totalsByResource(state);
  for (const command of [...fixture.commands].sort((a, b) => a.sequence - b.sequence)) {
    for (const operation of command.operations) {
      if (operation.operation === "transfer") {
        const source = state.accounts[operation.from];
        assert(Boolean(source), `${command.command_id}: unknown source account ${operation.from}`);
        if (!source) continue;
        assert(source.resource_type === operation.resource_type, `${command.command_id}: source resource mismatch`);
        assert(source.quantity >= operation.quantity, `${command.command_id}: insufficient ${operation.resource_type}`);
        if (source.quantity < operation.quantity) continue;
        source.quantity -= operation.quantity;
        if (operation.to === "consumed") {
          state.consumed[operation.resource_type] = (state.consumed[operation.resource_type] ?? 0) + operation.quantity;
        } else {
          const destination = state.accounts[operation.to];
          assert(Boolean(destination), `${command.command_id}: unknown destination account ${operation.to}`);
          assert(destination?.resource_type === operation.resource_type, `${command.command_id}: destination resource mismatch`);
          if (destination) destination.quantity += operation.quantity;
        }
      } else if (operation.operation === "adjust_belief") {
        const belief = state.beliefs[operation.belief_id];
        assert(Boolean(belief), `${command.command_id}: unknown belief ${operation.belief_id}`);
        if (!belief) continue;
        const randomDelta = Math.floor(random() * operation.random_span);
        belief.confidence = Math.max(0, Math.min(100, belief.confidence + operation.minimum_delta + randomDelta));
      } else if (operation.operation === "set_decision" || operation.operation === "resolve_decision") {
        state.decisions[operation.decision_id] = operation.state;
      } else {
        assert(false, `${command.command_id}: unknown operation ${operation.operation}`);
      }
    }
    state.events.push({
      sequence: command.sequence,
      command_id: command.command_id,
      actor_country_id: command.actor_country_id,
      decisions: structuredClone(state.decisions),
      accounts: Object.fromEntries(Object.entries(state.accounts).map(([id, account]) => [id, account.quantity])),
      beliefs: Object.fromEntries(Object.entries(state.beliefs).map(([id, belief]) => [id, belief.confidence])),
    });
  }
  const closingTotals = totalsByResource(state);
  for (const resourceType of fixture.required_outcomes.resource_totals_unchanged) {
    assert(openingTotals[resourceType] === closingTotals[resourceType], `${resourceType}: conservation failed`);
  }
  const hash = crypto.createHash("sha256").update(JSON.stringify(state.events)).digest("hex");
  return { state, hash, openingTotals, closingTotals };
}

function resolveAuthorityRoutes(country) {
  const authorityPath = path.resolve(directory, country.authority_path);
  assert(fs.existsSync(authorityPath), `${country.country_id}: authority path does not resolve`);
  if (!fs.existsSync(authorityPath)) return;
  const authority = JSON.parse(fs.readFileSync(authorityPath, "utf8"));
  if (country.country_id === "country_chn") {
    const domains = new Set(authority.government?.formal_decision_authority?.map((item) => `formal_decision_authority.${item.domain}`));
    for (const routeId of country.authority_route_ids) assert(domains.has(routeId), `${country.country_id}: missing authority domain ${routeId}`);
  } else {
    const routeIds = new Set(authority.routes?.map((route) => route.route_id));
    for (const routeId of country.authority_route_ids) assert(routeIds.has(routeId), `${country.country_id}: missing authority route ${routeId}`);
  }
}

assert(fixture.fixture_kind === "synthetic_headless_research_probe", "Fixture must remain synthetic and nonproduction");
assert(fixture.future_branch_input.opening_faction_knowledge === false, "Future branch leaked into opening knowledge");
assert(fixture.future_branch_input.historical_inevitability === false, "Future branch is predetermined history");
assert(matrix.countries.length === 6, "Opening participation matrix must contain six deep countries");
assert(new Set(matrix.countries.map((country) => country.country_id)).size === 6, "Duplicate country in participation matrix");
for (const country of matrix.countries) {
  assert(country.automatic_entry === false, `${country.country_id}: automatic entry is forbidden`);
  assert(country.decision_surfaces.length >= 5, `${country.country_id}: insufficient decision surface`);
  assert(country.critical_constraints.length >= 4, `${country.country_id}: insufficient constraints`);
  assert(country.participation_states.includes("refusal") || ["country_chn", "country_twn", "country_usa"].includes(country.country_id), `${country.country_id}: refusal must be representable`);
  resolveAuthorityRoutes(country);
}
assert(matrix.acceptance_rules.relationship_implies_participation === false, "Relationship cannot imply participation");
assert(matrix.acceptance_rules.access_implies_combat_authority === false, "Access cannot imply combat authority");
assert(matrix.acceptance_rules.country_AI_may_skip_authority_gates === false, "AI cannot skip authority gates");
assert(matrix.acceptance_rules.theater_allocation_may_create_national_inventory === false, "Theater plan cannot create inventory");

const sequences = fixture.commands.map((command) => command.sequence);
assert(sequences.every((sequence, index) => sequence === index + 1), "Command sequence must be contiguous and deterministic");
for (const command of fixture.commands) {
  assert(command.intent.length > 0, `${command.command_id}: missing player legible intent`);
  assert(command.authority_reference.length > 0, `${command.command_id}: missing authority reference`);
  assert(command.player_receives.length >= 2, `${command.command_id}: insufficient player feedback contract`);
}

const first = runProbe();
const second = runProbe();
assert(first.hash === second.hash, "Identical replay inputs produced different hashes");
assert(JSON.stringify(first.state.events) === JSON.stringify(second.state.events), "Identical replay inputs produced different events");
for (const [decisionId, expectedState] of Object.entries(fixture.required_outcomes.final_decisions)) {
  assert(first.state.decisions[decisionId] === expectedState, `${decisionId}: final state mismatch`);
}
for (const belief of Object.values(first.state.beliefs)) {
  assert(belief.confidence >= 0 && belief.confidence <= 100, `${belief.belief_id}: confidence escaped bounds`);
  assert(belief.truth_visible === false, `${belief.belief_id}: world truth leaked to faction belief`);
}

const alternate = runProbe(fixture.seed + 1);
assert(alternate.hash !== first.hash, "Different seed did not exercise uncertainty branch");
assert(JSON.stringify(first.closingTotals) === JSON.stringify(alternate.closingTotals), "Seed changed conserved resource totals");
assert(JSON.stringify(first.state.decisions) === JSON.stringify(alternate.state.decisions), "Seed changed authority or decision outcomes");

const report = {
  status: errors.length ? "FAIL" : "PASS",
  countries: matrix.countries.length,
  commands: fixture.commands.length,
  authority_routes_checked: matrix.countries.reduce((sum, country) => sum + country.authority_route_ids.length, 0),
  deterministic_replay_hash: first.hash,
  alternate_seed_hash: alternate.hash,
  conservation: first.closingTotals,
  final_decisions: first.state.decisions,
  final_beliefs: Object.fromEntries(Object.entries(first.state.beliefs).map(([id, belief]) => [id, belief.confidence])),
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
