import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const contract = read("capability_pool_contract.json");
const plans = ["jpn", "kor", "phl"].map((code) => read(`${code}_capability_pool_plan.json`));
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(contract.status === "research_contract", "contract must remain research only");
assert(contract.state_buckets.includes("disputed_or_unknown"), "unknown state bucket is required");
assert(contract.forbidden_shortcuts.length >= 7, "shortcut guards are incomplete");
assert(contract.simulation_ready_gates.length >= 8, "simulation gates are incomplete");

const expected = new Set(["JPN", "KOR", "PHL"]);
for (const plan of plans) {
  assert(expected.delete(plan.country_code), `${plan.country_code}: unexpected or duplicated country`);
  assert(plan.status === "shell", `${plan.country_code}: unsourced plan must remain shell`);
  assert(plan.contract_id === contract.contract_id, `${plan.country_code}: contract mismatch`);
  assert(plan.capability_families.length >= 7, `${plan.country_code}: capability coverage too narrow`);
  assert(plan.blocking_dependencies.length >= 6, `${plan.country_code}: support graph questions too narrow`);
  assert(Object.values(plan.acceptance).every((value) => value === false), `${plan.country_code}: acceptance cannot be preapproved`);
  assert(!JSON.stringify(plan).match(/"opening_quantity"\s*:/), `${plan.country_code}: unsourced quantity found`);
}
assert(expected.size === 0, `missing plans: ${[...expected].join(", ")}`);

console.log(JSON.stringify({status: errors.length ? "FAIL" : "PASS", contract_id: contract.contract_id, countries: plans.map((plan) => plan.country_code), capability_families: plans.reduce((sum, plan) => sum + plan.capability_families.length, 0), errors}, null, 2));
if (errors.length) process.exitCode = 1;
