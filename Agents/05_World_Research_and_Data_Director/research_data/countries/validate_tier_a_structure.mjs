import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? new URL('.', import.meta.url).pathname);
const countries = ['usa', 'chn', 'twn'];
const requiredLanes = ["politics_and_institutions","economy_trade_finance_resources","military_organization_inventory","fixed_facilities_basing","strategic_industry_conversion","energy_transport_communications_logistics","geography_provinces_terrain","crises_alliances_sanctions_deployments"];
const errors = [];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { errors.push(`${file}: ${error.message}`); return null; }
}

const contract = readJson(path.join(root, 'country_research_contract.json'));
if (contract && contract.lanes.map(x => x.lane_id).join('|') !== requiredLanes.join('|')) errors.push('contract lane order mismatch');

for (const code of countries) {
  const dir = path.join(root, code);
  for (const file of contract?.required_country_files ?? []) {
    if (!fs.existsSync(path.join(dir, file))) errors.push(`${code}: missing ${file}`);
  }
  const manifest = readJson(path.join(dir, 'research_manifest.json'));
  const matrix = readJson(path.join(dir, 'lane_coverage.json'));
  const evidence = readJson(path.join(dir, 'evidence_registry.json'));
  const bookmark = readJson(path.join(dir, 'bookmark_state.json'));
  if (!manifest || !matrix || !evidence || !bookmark) continue;
  if (manifest.country_code.toLowerCase() !== code) errors.push(`${code}: country code mismatch`);
  if (manifest.bookmark_id !== contract.bookmark_id || bookmark.bookmark_id !== contract.bookmark_id) errors.push(`${code}: bookmark mismatch`);
  if (Object.keys(matrix.lanes).join('|') !== requiredLanes.join('|')) errors.push(`${code}: lane set mismatch`);
  if (matrix.rollup.lanes_total !== requiredLanes.length) errors.push(`${code}: lane total mismatch`);
  if (evidence.sources.length || evidence.claims.length || evidence.contradiction_sets.length) errors.push(`${code}: shell evidence registry must remain empty until sourced`);
  if (bookmark.source_ids.length || bookmark.claim_ids.length) errors.push(`${code}: shell bookmark must not cite absent evidence`);
  if (bookmark.government !== null || bookmark.economic_state !== null || bookmark.military_posture !== null) errors.push(`${code}: unsourced bookmark facts populated`);
}

console.log(JSON.stringify({ status: errors.length ? 'FAIL' : 'PASS', countries: countries.length, lanes_per_country: requiredLanes.length, errors }, null, 2));
if (errors.length) process.exit(1);
