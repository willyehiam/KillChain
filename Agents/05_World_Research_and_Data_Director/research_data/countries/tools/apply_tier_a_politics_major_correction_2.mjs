import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const rolePredicates = new Set(['held_office_until','holds_office','holds_offices','member_of','opening_relevance']);

function read(code, name) { return JSON.parse(fs.readFileSync(path.join(root, code, name), 'utf8')); }
function write(code, name, value) { fs.writeFileSync(path.join(root, code, name), `${JSON.stringify(value, null, 2)}\n`); }
function addUnique(array, value, key) { if (!array.some(item => item[key] === value[key])) array.push(value); }

for (const code of ['usa', 'twn']) {
  const politics = read(code, 'politics_and_institutions.json');
  const evidence = read(code, 'evidence_registry.json');

  for (const actor of politics.political_actors) {
    actor.selection_basis_status = 'institutional_relevance_only';
    actor.practical_influence = {
      status: 'unaccepted',
      source_ids: [],
      source_family_ids: [],
      minimum_independent_source_families: 2
    };
  }
  politics.actor_selection_policy = {
    roster_membership_meaning: 'candidate_for_gameplay_relevance_review_not_practical_influence_fact',
    roster_size_is_acceptance_criterion: false,
    practical_influence_default: 'unaccepted',
    acceptance_requires_minimum_independent_source_families: 2,
    formal_office_source_alone_can_accept_practical_influence: false,
    actor_selection_gameplay_value_fields: ['institutional_role','decision_domain','succession_relevance','opposition_or_coalition_relevance'],
    prohibited_inferences: ['coup_probability','election_probability','succession_probability','practical_control_from_office_title_alone']
  };

  for (const source of evidence.sources) {
    source.source_family_id ??= `family_${source.publisher.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  }
  for (const claim of evidence.claims) {
    if (!rolePredicates.has(claim.predicate)) continue;
    claim.interval_start_status = claim.effective_from ? 'known' : 'unknown_not_established_by_packet_source';
    claim.interval_end_status = claim.effective_to ? 'known' : 'open_at_bookmark_end_not_established';
  }

  const actorClaimSubjects = new Set(evidence.claims.filter(claim => rolePredicates.has(claim.predicate)).map(claim => claim.subject_id));
  for (const actor of politics.political_actors) {
    if (actorClaimSubjects.has(actor.actor_id)) continue;
    addUnique(evidence.claims, {
      claim_id: `claim_${code}_actor_${actor.actor_id.replace(`actor_${code}_`, '')}_opening_relevance`,
      subject_id: actor.actor_id,
      predicate: 'opening_relevance',
      value: actor.office,
      as_of: '2025-09-01',
      interval_start_status: 'unknown_not_established_by_packet_source',
      interval_end_status: 'open_at_bookmark_end_not_established',
      evidence_state: 'official_claim',
      confidence: actor.confidence,
      source_ids: actor.source_ids
    }, 'claim_id');
  }

  write(code, 'politics_and_institutions.json', politics);
  write(code, 'evidence_registry.json', evidence);
  const manifest = read(code, 'research_manifest.json');
  manifest.accepted_claim_count = evidence.claims.length;
  write(code, 'research_manifest.json', manifest);
  const lane = read(code, 'lane_coverage.json');
  lane.lanes.politics_and_institutions.claim_count = evidence.claims.length;
  lane.lanes.politics_and_institutions.record_count = politics.institutions.length + politics.political_actors.length;
  write(code, 'lane_coverage.json', lane);
}

{
  const politics = read('usa', 'politics_and_institutions.json');
  const evidence = read('usa', 'evidence_registry.json');
  const bookmark = read('usa', 'bookmark_state.json');

  addUnique(evidence.sources, {
    source_id: 'src_usa_presidential_succession_statute',
    title: '3 USC 19, Vacancy in offices of both President and Vice President; officers eligible to act',
    publisher: 'Office of the Law Revision Counsel, United States House of Representatives',
    published_at: '1947-07-18',
    accessed_at: '2026-08-06',
    source_tier: 'A',
    source_type: 'law_or_treaty',
    source_family_id: 'family_usa_office_law_revision_counsel',
    url: 'https://uscode.house.gov/view.xhtml?edition=prelim&num=0&req=granuleid%3AUSC-prelim-title3-section19',
    relevant_locator: '3 USC 19(a) through (e)',
    reliability_notes: 'Statutory office order and qualification conditions. Office order does not establish person-specific eligibility.'
  }, 'source_id');
  addUnique(evidence.sources, {
    source_id: 'src_usa_senate_president_pro_tempore_2025',
    title: 'Presidents Pro Tempore of the United States Senate',
    publisher: 'United States Senate',
    published_at: '2025-01-03',
    accessed_at: '2026-08-06',
    source_tier: 'A',
    source_type: 'official_release',
    source_family_id: 'family_usa_senate',
    url: 'https://www.senate.gov/about/officers-staff/president-pro-tempore/presidents-pro-tempore.htm',
    relevant_locator: '119th Congress, Chuck Grassley, January 3 2025 to present',
    reliability_notes: 'Official Senate officeholder history establishes the opening office interval.'
  }, 'source_id');

  addUnique(politics.political_actors, {
    actor_id: 'actor_usa_chuck_grassley',
    name: 'Chuck Grassley',
    office: 'President pro tempore of the Senate',
    institution_ids: ['institution_usa_congress_119','institution_usa_republican_party'],
    relevance: 'statutory_presidential_succession_officer',
    succession_eligibility: 'statutory_line_member_subject_to_resignation_and_person_specific_qualification',
    confidence: 'high',
    selection_basis_status: 'institutional_relevance_only',
    practical_influence: {status:'unaccepted',source_ids:[],source_family_ids:[],minimum_independent_source_families:2},
    source_ids: ['src_usa_senate_president_pro_tempore_2025','src_usa_presidential_succession_statute']
  }, 'actor_id');
  addUnique(evidence.claims, {
    claim_id: 'claim_usa_actor_grassley_role',
    subject_id: 'actor_usa_chuck_grassley',
    predicate: 'holds_office',
    value: 'President pro tempore of the Senate',
    effective_from: '2025-01-03',
    as_of: '2025-09-01',
    interval_start_status: 'known',
    interval_end_status: 'open_at_bookmark_end_not_established',
    evidence_state: 'official_claim',
    confidence: 'high',
    source_ids: ['src_usa_senate_president_pro_tempore_2025']
  }, 'claim_id');
  addUnique(evidence.claims, {
    claim_id: 'claim_usa_presidential_succession_statutory_order',
    subject_id: 'institution_usa_executive_branch',
    predicate: 'presidential_succession_order',
    value: 'vice_president_then_speaker_then_president_pro_tempore_then_eligible_department_heads_in_statutory_order',
    as_of: '2025-09-01',
    evidence_state: 'official_claim',
    confidence: 'high',
    source_ids: ['src_usa_constitution_amendment_xxv','src_usa_presidential_succession_statute']
  }, 'claim_id');

  politics.government.succession = {
    workflow_file: 'presidential_succession.json',
    first_successor_actor_id: 'actor_usa_jd_vance',
    distinction: 'The Vice President succeeds to a presidential vacancy or acts during inability; legislative officers and department heads act as President subject to statutory qualification conditions.',
    claim_ids: ['claim_usa_vp_first_successor','claim_usa_presidential_succession_statutory_order'],
    source_ids: ['src_usa_constitution_amendment_xxv','src_usa_presidential_succession_statute']
  };
  if (!bookmark.political_actors.includes('actor_usa_chuck_grassley')) bookmark.political_actors.push('actor_usa_chuck_grassley');
  if (!bookmark.source_ids.includes('src_usa_presidential_succession_statute')) bookmark.source_ids.push('src_usa_presidential_succession_statute');
  if (!bookmark.source_ids.includes('src_usa_senate_president_pro_tempore_2025')) bookmark.source_ids.push('src_usa_senate_president_pro_tempore_2025');
  if (!bookmark.claim_ids.includes('claim_usa_actor_grassley_role')) bookmark.claim_ids.push('claim_usa_actor_grassley_role');
  if (!bookmark.claim_ids.includes('claim_usa_presidential_succession_statutory_order')) bookmark.claim_ids.push('claim_usa_presidential_succession_statutory_order');

  write('usa', 'politics_and_institutions.json', politics);
  write('usa', 'evidence_registry.json', evidence);
  write('usa', 'bookmark_state.json', bookmark);
  const profile = read('usa', 'profile.json');
  profile.completeness.political_actor_count = politics.political_actors.length;
  write('usa', 'profile.json', profile);
  const manifest = read('usa', 'research_manifest.json');
  manifest.files.presidential_succession = 'presidential_succession.json';
  manifest.accepted_source_count = evidence.sources.length;
  manifest.accepted_claim_count = evidence.claims.length;
  manifest.acceptance.presidential_succession_reviewed = false;
  write('usa', 'research_manifest.json', manifest);
  const lane = read('usa', 'lane_coverage.json');
  lane.lanes.politics_and_institutions.source_count = evidence.sources.length;
  lane.lanes.politics_and_institutions.claim_count = evidence.claims.length;
  lane.lanes.politics_and_institutions.record_count = politics.institutions.length + politics.political_actors.length;
  write('usa', 'lane_coverage.json', lane);
}
