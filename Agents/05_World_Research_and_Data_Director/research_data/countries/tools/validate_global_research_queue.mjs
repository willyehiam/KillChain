#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(directory, "..");
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(countriesRoot, name), "utf8"));
const registry = readJson("country_registry.json");
const contract = readJson("country_research_contract.json");
const config = readJson("research_parallelism_config.json");
const queue = readJson("global_research_queue.json");
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const registryCodes = registry.countries.map((country) => country.country_code);
const configuredCodes = Object.values(config.regions).flat();
const expectedUnits = registryCodes.length * contract.lanes.length;
const unitIds = new Set(queue.work_units.map((unit) => unit.work_unit_id));

assert(config.execution_model === "all_country_all_lane_concurrent_collection", "Execution model regressed to sequential country collection");
assert(config.collection_rules.start_all_work_units_immediately === true, "All work units do not start together");
assert(config.collection_rules.country_completion_never_blocks_another_country === true, "Country completion can block another country");
assert(config.collection_rules.promotion_dependencies_do_not_block_collection === true, "Promotion dependencies block collection");
assert(config.collection_rules.maximum_active_work_units >= registryCodes.length, "Concurrency ceiling cannot cover every country");
assert(Object.keys(config.worker_pools).length === 10, "Exactly ten stable worker pools are required");
assert(new Set(configuredCodes).size === configuredCodes.length, "A country appears in more than one regional shard");
assert(configuredCodes.length === registryCodes.length, "Regional shards do not cover the entire registry");
for (const code of registryCodes) assert(configuredCodes.includes(code), `${code} is missing from regional shards`);
for (const code of configuredCodes) assert(registryCodes.includes(code), `${code} is not a registered country`);

assert(queue.bookmark_id === registry.bookmark_id, "Queue bookmark differs from registry");
assert(queue.work_units.length === expectedUnits, `Expected ${expectedUnits} work units, found ${queue.work_units.length}`);
assert(unitIds.size === expectedUnits, "Work unit identifiers are not unique");
assert(queue.counts.queued + queue.counts.active_or_substantive === expectedUnits, "Queue state rollup does not conserve work units");

for (const country of registry.countries) {
  const countryUnits = queue.work_units.filter((unit) => unit.country_code === country.country_code);
  assert(countryUnits.length === contract.lanes.length, `${country.country_code} does not have every lane`);
  for (const lane of contract.lanes) {
    const unit = countryUnits.find((candidate) => candidate.lane_id === lane.lane_id);
    assert(Boolean(unit), `${country.country_code} is missing ${lane.lane_id}`);
    if (!unit) continue;
    assert(unit.region_id !== null, `${unit.work_unit_id} lacks a region`);
    assert(unit.worker_pool !== null, `${unit.work_unit_id} lacks a worker pool`);
    assert(unit.collection_blocked_by_dependencies === false, `${unit.work_unit_id} is sequentially blocked`);
    assert(unit.executable === false, `${unit.work_unit_id} improperly creates executable game state`);
  }
}

assert(queue.merge_rules.unit_of_merge === "atomic_sourced_claim", "Merge unit is not an atomic sourced claim");
assert(queue.merge_rules.unknown_policy === "missing_evidence_never_becomes_zero", "Unknown evidence can become zero");
assert(queue.merge_rules.bookmark_policy === "post_bookmark_material_is_quarantined", "Bookmark firewall is absent");
assert(queue.merge_rules.simulation_policy === "research_outputs_remain_nonexecutable_until_acceptance", "Research can bypass simulation acceptance");
assert(queue.safety_boundary.exclude_nonpublic_sensitive_targeting_detail === true, "Sensitive targeting boundary is absent");
assert(queue.safety_boundary.exclude_live_mobile_force_tracking === true, "Live mobile force tracking boundary is absent");

console.log(JSON.stringify({
  status: errors.length ? "FAIL" : "PASS",
  countries: registryCodes.length,
  lanes: contract.lanes.length,
  regions: Object.keys(config.regions).length,
  worker_pools: Object.keys(config.worker_pools).length,
  work_units: queue.work_units.length,
  errors
}, null, 2));
if (errors.length) process.exitCode = 1;
