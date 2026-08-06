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

function dateAtOrBefore(value, cutoff) {
  return !value || Date.parse(value) <= Date.parse(cutoff);
}

function dateAtOrAfter(value, cutoff) {
  return !value || Date.parse(value) >= Date.parse(cutoff);
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
      for (const actorId of bookmark.political_actors) {
        const endedRoleClaims = evidence.claims.filter(claim =>
          claim.subject_id === actorId &&
          ['held_office_until', 'holds_office', 'holds_offices'].includes(claim.predicate) &&
          claim.effective_to &&
          Date.parse(claim.effective_to) < Date.parse(bookmark.as_of)
        );
        const activeRoleClaims = evidence.claims.filter(claim =>
          claim.subject_id === actorId &&
          ['holds_office', 'holds_offices', 'member_of', 'opening_relevance'].includes(claim.predicate) &&
          dateAtOrBefore(claim.effective_from ?? claim.as_of, bookmark.as_of) &&
          dateAtOrAfter(claim.effective_to, bookmark.as_of)
        );
        if (endedRoleClaims.length && !activeRoleClaims.length) errors.push(`${code}: opening actor ${actorId} has only role evidence that ended before ${bookmark.as_of}`);
      }
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

    if (code === 'twn') {
      const certified = evidence.claims.find(claim => claim.claim_id === 'claim_twn_legislative_seats_certified_2024')?.value;
      const recalls = ['claim_twn_recall_round_2025_07_26_seat_delta', 'claim_twn_recall_round_2025_08_23_seat_delta']
        .map(id => evidence.claims.find(claim => claim.claim_id === id)?.value?.seat_delta);
      const opening = evidence.claims.find(claim => claim.claim_id === 'claim_twn_legislative_seats_2025_09_01')?.value;
      const parties = ['kmt', 'dpp', 'tpp', 'independent'];
      if (!certified || recalls.some(delta => !delta) || !opening) errors.push('twn: incomplete legislative seat derivation evidence');
      else {
        for (const party of parties) {
          const expected = certified[party] + recalls.reduce((sum, delta) => sum + delta[party], 0);
          if (opening[party] !== expected) errors.push(`twn: opening ${party} seats do not reconcile to certified result and recall deltas`);
        }
        const total = parties.reduce((sum, party) => sum + opening[party], 0);
        if (total !== opening.total || opening.total !== 113) errors.push('twn: opening seat total does not reconcile to 113');
        if (opening.largest_party !== 'kmt' || opening.single_party_majority !== false || opening.majority_threshold !== 57) {
          errors.push('twn: opening plurality or majority classification is incorrect');
        }
      }
    }

    if (code === 'chn') {
      const cmc = politics.institutions.find(institution => institution.institution_id === 'institution_chn_cmc');
      const currentActorIds = new Set(politics.political_actors.map(actor => actor.actor_id));
      const requiredCmcActors = ['actor_chn_zhang_youxia', 'actor_chn_he_weidong', 'actor_chn_liu_zhenli', 'actor_chn_zhang_shengmin'];
      if (!cmc) errors.push('chn: CMC institution is absent from politics packet');
      for (const actorId of requiredCmcActors) if (!currentActorIds.has(actorId)) errors.push(`chn: missing opening CMC actor ${actorId}`);
      const ma = politics.political_actors.find(actor => actor.actor_id === 'actor_chn_ma_xingrui');
      if (!ma || /Xinjiang authority(?! after)/i.test(ma.office) || ma.institution_ids.some(id => /xinjiang/i.test(id))) {
        errors.push('chn: Ma Xingrui retains unsupported Xinjiang opening authority');
      }
      const maEnd = evidence.claims.find(claim => claim.claim_id === 'claim_chn_ma_xingrui_xinjiang_role_ended');
      if (maEnd?.effective_to !== '2025-07-01') errors.push('chn: Ma Xingrui Xinjiang tenure end is not represented');
      const he = evidence.claims.find(claim => claim.claim_id === 'claim_chn_he_weidong_public_availability');
      if (he?.value !== 'unknown_after_repeated_absences') errors.push('chn: He Weidong opening uncertainty is not preserved');
    }

    if (code === 'usa') {
      const nsc = politics.institutions.find(institution => institution.institution_id === 'institution_usa_nsc');
      const rubio = politics.political_actors.find(actor => actor.actor_id === 'actor_usa_marco_rubio');
      const rubioRole = evidence.claims.find(claim => claim.claim_id === 'claim_usa_actor_rubio_role');
      const requiredNscClaims = ['claim_usa_nsc_statutory_membership', 'claim_usa_nsc_advisory_structure', 'claim_usa_nsc_restructuring_capacity_modifier', 'claim_usa_nsc_statutory_and_advisory_distinction'];
      if (!nsc) errors.push('usa: NSC institution is absent from politics packet');
      if (!rubio?.institution_ids.includes('institution_usa_nsc') || !rubio.office.includes('Acting National Security Advisor')) {
        errors.push('usa: Marco Rubio dual opening role is incomplete');
      }
      if (rubioRole?.effective_from !== '2025-05-01' || !rubioRole.value?.includes('Acting National Security Advisor')) {
        errors.push('usa: Marco Rubio acting NSA interval is incomplete');
      }
      for (const claimId of requiredNscClaims) if (!claimIds.has(claimId)) errors.push(`usa: missing NSC claim ${claimId}`);
    }
  }
  if (bookmark.economic_state !== null || bookmark.military_posture !== null) errors.push(`${code}: unsourced non-politics bookmark facts populated`);
}

console.log(JSON.stringify({ status: errors.length ? 'FAIL' : 'PASS', countries: countries.length, lanes_per_country: requiredLanes.length, errors }, null, 2));
if (errors.length) process.exit(1);
