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
  const profile = readJson(path.join(dir, 'profile.json'));
  if (!manifest || !matrix || !evidence || !bookmark) continue;
  if (manifest.country_code.toLowerCase() !== code) errors.push(`${code}: country code mismatch`);
  if (manifest.bookmark_id !== contract.bookmark_id || bookmark.bookmark_id !== contract.bookmark_id) errors.push(`${code}: bookmark mismatch`);
  if (Object.keys(matrix.lanes).join('|') !== requiredLanes.join('|')) errors.push(`${code}: lane set mismatch`);
  if (matrix.rollup.lanes_total !== requiredLanes.length) errors.push(`${code}: lane total mismatch`);
  const sourceIds = new Set(evidence.sources.map(source => source.source_id));
  const claimIds = new Set(evidence.claims.map(claim => claim.claim_id));
  if (sourceIds.size !== evidence.sources.length) errors.push(`${code}: duplicate evidence source id`);
  if (claimIds.size !== evidence.claims.length) errors.push(`${code}: duplicate evidence claim id`);
  if (evidence.status === 'shell') {
    if (evidence.sources.length || evidence.claims.length || evidence.contradiction_sets.length) errors.push(`${code}: shell evidence registry must remain empty until sourced`);
  } else {
    if (!evidence.sources.length || !evidence.claims.length) errors.push(`${code}: populated evidence registry requires sources and claims`);
    for (const claim of evidence.claims) {
      if (!claim.source_ids?.length) errors.push(`${code}: ${claim.claim_id} lacks source ids`);
      for (const sourceId of claim.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${claim.claim_id} cites missing ${sourceId}`);
    }
    for (const set of evidence.contradiction_sets) {
      if ((set.claim_ids ?? []).length < 2) errors.push(`${code}: ${set.contradiction_set_id} needs at least two claims`);
      for (const claimId of set.claim_ids ?? []) if (!claimIds.has(claimId)) errors.push(`${code}: ${set.contradiction_set_id} cites missing ${claimId}`);
      for (const sourceId of set.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${set.contradiction_set_id} cites missing ${sourceId}`);
    }
  }
  for (const sourceId of bookmark.source_ids) if (!sourceIds.has(sourceId)) errors.push(`${code}: bookmark cites missing ${sourceId}`);
  for (const claimId of bookmark.claim_ids) if (!claimIds.has(claimId)) errors.push(`${code}: bookmark cites missing ${claimId}`);
  if (bookmark.government === null) {
    if (bookmark.source_ids.length || bookmark.claim_ids.length || bookmark.political_actors.length) errors.push(`${code}: shell politics bookmark must not cite absent evidence`);
  } else {
    const politicsPath = path.join(dir, 'politics_and_institutions.json');
    const politics = fs.existsSync(politicsPath) ? readJson(politicsPath) : null;
    if (!politics) errors.push(`${code}: populated government requires politics_and_institutions.json`);
    else {
      const actorIds = new Set(politics.political_actors?.map(actor => actor.actor_id) ?? []);
      const target = profile?.completeness?.political_actor_target ?? 20;
      if (actorIds.size < target) errors.push(`${code}: politics actor roster ${actorIds.size} below target ${target}`);
      if (profile?.completeness?.political_actor_count !== actorIds.size) errors.push(`${code}: profile actor count mismatch`);
      for (const actorId of bookmark.political_actors) if (!actorIds.has(actorId)) errors.push(`${code}: bookmark cites missing actor ${actorId}`);
      if (bookmark.political_actors.length !== actorIds.size) errors.push(`${code}: bookmark actor count mismatch`);
      for (const record of [...(politics.institutions ?? []), ...(politics.political_actors ?? [])]) {
        if (!record.source_ids?.length) errors.push(`${code}: politics record ${record.institution_id ?? record.actor_id} lacks source ids`);
        for (const sourceId of record.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: politics record cites missing ${sourceId}`);
      }
    }
    if (manifest.accepted_source_count !== evidence.sources.length) errors.push(`${code}: manifest source count mismatch`);
    if (manifest.accepted_claim_count !== evidence.claims.length) errors.push(`${code}: manifest claim count mismatch`);
    if (manifest.open_contradiction_count !== evidence.contradiction_sets.filter(set => set.status === 'open').length) errors.push(`${code}: manifest contradiction count mismatch`);
    const lane = matrix.lanes.politics_and_institutions;
    if (lane.source_count !== evidence.sources.length || lane.claim_count !== evidence.claims.length) errors.push(`${code}: lane evidence count mismatch`);
  }
  if (bookmark.economic_state !== null || bookmark.military_posture !== null) errors.push(`${code}: unsourced non-politics bookmark facts populated`);
}

console.log(JSON.stringify({ status: errors.length ? 'FAIL' : 'PASS', countries: countries.length, lanes_per_country: requiredLanes.length, errors }, null, 2));
if (errors.length) process.exit(1);
