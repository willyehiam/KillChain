#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(directory, "..");
const researchRoot = path.resolve(countriesRoot, "..");
const registry = readJson(path.join(countriesRoot, "country_registry.json"));
const contract = readJson(path.join(countriesRoot, "country_research_contract.json"));
const config = readJson(path.join(countriesRoot, "research_parallelism_config.json"));
const check = process.argv.includes("--check");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const regionByCountry = new Map();
for (const [regionId, countryCodes] of Object.entries(config.regions)) {
  for (const countryCode of countryCodes) regionByCountry.set(countryCode, regionId);
}

const workerByLane = new Map();
for (const [workerPool, laneIds] of Object.entries(config.worker_pools)) {
  for (const laneId of laneIds) workerByLane.set(laneId, workerPool);
}

const workUnits = [];
for (const country of registry.countries) {
  const profile = readJson(path.join(researchRoot, country.profile_path));
  for (const lane of contract.lanes) {
    const coverage = profile.coverage[lane.lane_id];
    workUnits.push({
      work_unit_id: `work_${country.country_code.toLowerCase()}_${lane.lane_id}`,
      country_id: country.country_id,
      country_code: country.country_code,
      region_id: regionByCountry.get(country.country_code) ?? null,
      lane_id: lane.lane_id,
      worker_pool: workerByLane.get(lane.lane_id) ?? null,
      research_priority: country.research_priority,
      depth_tier: country.depth_tier,
      collection_state: coverage.status === "shell" ? "queued" : coverage.status,
      promotion_dependencies: config.promotion_dependencies[lane.lane_id],
      collection_blocked_by_dependencies: false,
      accepted_record_count: coverage.record_count,
      accepted_source_count: coverage.source_count,
      output_profile_path: country.profile_path,
      executable: false
    });
  }
}

workUnits.sort((left, right) =>
  left.region_id.localeCompare(right.region_id) ||
  left.worker_pool.localeCompare(right.worker_pool) ||
  left.country_code.localeCompare(right.country_code)
);

const queue = {
  schema_version: "0.1.0",
  queue_id: "global_country_research_queue_2025_09_01_v1",
  generated_from: ["country_registry.json", "country_research_contract.json", "research_parallelism_config.json"],
  bookmark_id: registry.bookmark_id,
  execution_model: config.execution_model,
  counts: {
    countries: registry.countries.length,
    lanes: contract.lanes.length,
    work_units: workUnits.length,
    regions: Object.keys(config.regions).length,
    worker_pools: Object.keys(config.worker_pools).length,
    queued: workUnits.filter((unit) => unit.collection_state === "queued").length,
    active_or_substantive: workUnits.filter((unit) => unit.collection_state !== "queued").length
  },
  concurrency: config.collection_rules,
  merge_rules: config.merge_rules,
  safety_boundary: config.safety_boundary,
  work_units: workUnits
};

const outputPath = path.join(countriesRoot, "global_research_queue.json");
const output = `${JSON.stringify(queue, null, 2)}\n`;
const differs = !fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== output;
if (!check) fs.writeFileSync(outputPath, output);

console.log(JSON.stringify({
  status: check && differs ? "FAIL" : "PASS",
  mode: check ? "check" : "write",
  countries: queue.counts.countries,
  lanes: queue.counts.lanes,
  work_units: queue.counts.work_units,
  queued: queue.counts.queued,
  active_or_substantive: queue.counts.active_or_substantive,
  differences: differs ? [path.basename(outputPath)] : []
}, null, 2));
if (check && differs) process.exitCode = 1;
