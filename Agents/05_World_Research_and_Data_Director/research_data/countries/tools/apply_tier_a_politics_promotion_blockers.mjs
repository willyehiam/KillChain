#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const countriesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function write(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }

function replaceSourceIds(value, replacements) {
  if (Array.isArray(value)) return value.map(item => replaceSourceIds(item, replacements));
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'source_ids' && Array.isArray(item)) {
      out[key] = [...new Set(item.flatMap(sourceId => replacements[sourceId] ?? [sourceId]))];
    } else out[key] = replaceSourceIds(item, replacements);
  }
  return out;
}

function classifySources(evidence) {
  for (const source of evidence.sources) {
    if (source.source_type === 'law_or_treaty') {
      source.mutability_class = 'legal_instrument';
      source.bookmark_temporal_proof = {
        status: 'historically_valid_instrument_at_bookmark',
        effective_from: source.instrument_effective_from ?? source.published_at ?? null,
        rule: 'Legal instruments are evaluated by historically valid effective edition, not by the retrieval date of a mutable web presentation.'
      };
    } else if (source.published_at) {
      source.mutability_class = source.source_type === 'statistical_dataset' ? 'dated_dataset' : 'dated_publication';
      source.bookmark_temporal_proof = {
        status: 'dated_prebookmark_publication',
        published_at: source.published_at
      };
    } else {
      source.mutability_class = 'live_mutable';
      source.bookmark_evidence_status = 'quarantined_no_prebookmark_temporal_proof';
      source.temporal_proof_requirements = {
        accepted_alternatives: [
          'archive_url_plus_snapshot_at_on_or_before_bookmark_plus_content_hash',
          'dated_prebookmark_official_source'
        ],
        continuity_inference_forbidden: true
      };
    }
  }
}

function addSource(evidence, source) {
  if (!evidence.sources.some(item => item.source_id === source.source_id)) evidence.sources.push(source);
}

function updateUsa() {
  const dir = path.join(countriesRoot, 'usa');
  let evidence = read(path.join(dir, 'evidence_registry.json'));

  const datedSources = [
    {
      source_id: 'src_usa_congressional_inauguration_record_2025',
      title: 'Congressional Record: Inauguration Ceremonies for President Donald Trump and Vice President J.D. Vance',
      publisher: 'Congress.gov, Library of Congress',
      published_at: '2025-01-20',
      accessed_at: '2026-08-06',
      source_tier: 'A',
      source_type: 'official_release',
      source_family_id: 'family_congress_gov_library_of_congress',
      url: 'https://www.congress.gov/congressional-record/volume-171/issue-11/daily-digest/article/D56-2',
      relevant_locator: 'Inauguration Ceremonies, pages H225 to H226',
      reliability_notes: 'Dated Congressional Record entry establishes that Donald Trump and JD Vance were inaugurated on January 20, 2025.'
    },
    {
      source_id: 'src_usa_congressional_record_jeffries_2025',
      title: 'Congressional Record: Minority Leader selected for the 119th Congress',
      publisher: 'Congress.gov, Library of Congress',
      published_at: '2025-01-03',
      accessed_at: '2026-08-06',
      source_tier: 'A',
      source_type: 'official_release',
      source_family_id: 'family_congress_gov_library_of_congress',
      url: 'https://www.congress.gov/congressional-record/volume-171/issue-1/house-section/article/H7-3',
      relevant_locator: 'Page H7, Minority Leader',
      reliability_notes: 'Dated chamber record establishes Hakeem Jeffries as the House minority leader for the 119th Congress.'
    },
    {
      source_id: 'src_usa_congressional_record_bondi_confirmation_2025',
      title: 'Congressional Record: Pamela Bondi confirmed as Attorney General',
      publisher: 'Congress.gov, Library of Congress',
      published_at: '2025-02-04',
      accessed_at: '2026-08-06',
      source_tier: 'A',
      source_type: 'official_release',
      source_family_id: 'family_congress_gov_library_of_congress',
      url: 'https://www.congress.gov/congressional-record/volume-171/issue-23/daily-digest/article/D112-1',
      relevant_locator: 'Nominations Confirmed, Vote No. EX. 33',
      reliability_notes: 'Dated Senate confirmation record establishes confirmation before the bookmark; it does not independently prove later continuity, so the opening interval remains subject to the packet role interval rules.'
    },
    {
      source_id: 'src_usa_congressional_record_noem_confirmation_2025',
      title: 'Congressional Record: Kristi Noem confirmed as Secretary of Homeland Security',
      publisher: 'Congress.gov, Library of Congress',
      published_at: '2025-01-25',
      accessed_at: '2026-08-06',
      source_tier: 'A',
      source_type: 'official_release',
      source_family_id: 'family_congress_gov_library_of_congress',
      url: 'https://www.congress.gov/congressional-record/volume-171/issue-16/senate-section/article/S381-6',
      relevant_locator: 'Page S381, Confirmation',
      reliability_notes: 'Dated Senate confirmation record establishes confirmation before the bookmark; it does not independently prove later continuity, so the opening interval remains subject to the packet role interval rules.'
    }
  ];
  datedSources.forEach(source => addSource(evidence, source));
  const legalEffectiveDates = {
    src_usa_constitution_article_i: '1789-03-04',
    src_usa_constitution_article_ii: '1789-03-04',
    src_usa_constitution_amendment_xxv: '1967-02-10',
    src_usa_nsc_statute: '1947-07-26'
  };
  for (const source of evidence.sources) if (legalEffectiveDates[source.source_id]) source.instrument_effective_from = legalEffectiveDates[source.source_id];

  const replacements = {
    src_usa_white_house_administration: ['src_usa_congressional_inauguration_record_2025'],
    src_usa_house_democratic_leader: ['src_usa_congressional_record_jeffries_2025'],
    src_usa_white_house_cabinet: [
      'src_usa_congressional_record_bondi_confirmation_2025',
      'src_usa_congressional_record_noem_confirmation_2025'
    ]
  };

  for (const claim of evidence.claims) {
    if (claim.claim_id === 'claim_usa_actor_trump_role' || claim.claim_id === 'claim_usa_actor_vance_role') {
      claim.source_ids = ['src_usa_congressional_inauguration_record_2025'];
      claim.effective_from = '2025-01-20';
      claim.interval_start_status = 'known';
    }
    if (claim.claim_id === 'claim_usa_actor_jeffries_role') {
      claim.source_ids = ['src_usa_congressional_record_jeffries_2025'];
      claim.effective_from = '2025-01-03';
      claim.interval_start_status = 'known';
    }
    if (claim.claim_id === 'claim_usa_actor_pam_bondi_opening_relevance') {
      claim.source_ids = ['src_usa_congressional_record_bondi_confirmation_2025'];
      claim.effective_from = '2025-02-04';
      claim.interval_start_status = 'known';
      claim.value = 'Senate-confirmed Attorney General; continuity to bookmark remains an explicit open interval pending independent review';
    }
    if (claim.claim_id === 'claim_usa_actor_kristi_noem_opening_relevance') {
      claim.source_ids = ['src_usa_congressional_record_noem_confirmation_2025'];
      claim.effective_from = '2025-01-25';
      claim.interval_start_status = 'known';
      claim.value = 'Senate-confirmed Secretary of Homeland Security; continuity to bookmark remains an explicit open interval pending independent review';
    }
  }
  classifySources(evidence);
  write(path.join(dir, 'evidence_registry.json'), evidence);

  for (const file of ['politics_and_institutions.json', 'bookmark_state.json', 'profile.json']) {
    const value = replaceSourceIds(read(path.join(dir, file)), replacements);
    write(path.join(dir, file), value);
  }
  const politicsFile = path.join(dir, 'politics_and_institutions.json');
  const politics = read(politicsFile);
  politics.government.election_cycle.source_ids = ['src_usa_congressional_inauguration_record_2025', 'src_usa_constitution_article_ii'];
  politics.institutions.find(item => item.institution_id === 'institution_usa_presidency').source_ids = ['src_usa_constitution_article_ii', 'src_usa_congressional_inauguration_record_2025'];
  politics.institutions.find(item => item.institution_id === 'institution_usa_executive_branch').source_ids = ['src_usa_congressional_inauguration_record_2025'];
  politics.institutions.find(item => item.institution_id === 'institution_usa_democratic_party').source_ids = ['src_usa_senate_democratic_leadership', 'src_usa_congressional_record_jeffries_2025'];
  politics.political_actors.find(item => item.actor_id === 'actor_usa_donald_trump').source_ids = ['src_usa_congressional_inauguration_record_2025'];
  politics.political_actors.find(item => item.actor_id === 'actor_usa_jd_vance').source_ids = ['src_usa_congressional_inauguration_record_2025', 'src_usa_constitution_amendment_xxv'];
  politics.political_actors.find(item => item.actor_id === 'actor_usa_hakeem_jeffries').source_ids = ['src_usa_congressional_record_jeffries_2025'];
  politics.political_actors.find(item => item.actor_id === 'actor_usa_pam_bondi').source_ids = ['src_usa_congressional_record_bondi_confirmation_2025'];
  politics.political_actors.find(item => item.actor_id === 'actor_usa_kristi_noem').source_ids = ['src_usa_congressional_record_noem_confirmation_2025'];
  write(politicsFile, politics);

  const successionFile = path.join(dir, 'presidential_succession.json');
  const succession = read(successionFile);
  succession.nodes.find(item => item.rank === 7).source_ids = ['src_usa_presidential_succession_statute', 'src_usa_congressional_record_bondi_confirmation_2025'];
  succession.nodes.find(item => item.rank === 18).source_ids = ['src_usa_presidential_succession_statute', 'src_usa_congressional_record_noem_confirmation_2025'];
  write(successionFile, succession);

  const workflowFile = path.join(dir, 'war_authority_workflow.json');
  const workflow = read(workflowFile);
  const gate = id => workflow.decision_gates.find(item => item.gate_id === id);
  for (const item of workflow.decision_gates) item.phase = 'activation';
  gate('gate_usa_wpr_consult_when_possible').phase = 'precondition';
  gate('gate_usa_wpr_consult_when_possible').completion_modes = ['consulted_before_introduction', 'consultation_not_possible_with_recorded_reason'];
  gate('gate_usa_wpr_report_if_triggered').phase = 'post_activation_obligation';
  Object.assign(gate('gate_usa_wpr_report_if_triggered'), {
    anchor_event_type: 'force_introduction_into_hostilities_or_imminent_hostilities',
    anchor_event_id: 'event_usa_forces_introduced',
    anchor_status: 'runtime_required_known_or_unknown_anchor',
    anchor_time: 'runtime_field:forces_introduced_at',
    due_time: 'runtime_field:report_due_at',
    deadline_ordering: 'forces_introduced_at_less_than_or_equal_to_report_due_at',
    duration_hours: 48,
    unknown_anchor_state: 'unknown_anchor',
    unknown_anchor_policy: {
      zero_false_or_no_deadline_coercion_forbidden: true,
      conservative_bound_rule: 'earliest_supportable_force_introduction_candidate_plus_48_hours',
      permissive_bound_rule: 'latest_supportable_force_introduction_candidate_plus_48_hours',
      no_candidate_rule: 'preserve_explicit_unknown_due_at_and_block_continuation_promotion'
    }
  });
  gate('gate_usa_wpr_termination_clock').phase = 'termination_condition';
  Object.assign(gate('gate_usa_wpr_termination_clock'), {
    anchor_event_type: 'earlier_of_report_submission_or_time_report_was_required',
    anchor_event_id: 'event_usa_wpr_report_submitted_or_required',
    anchor_status: 'runtime_required_known_or_unknown_anchor',
    anchor_time: 'runtime_field:termination_anchor_at',
    anchor_time_rule: 'earlier_of(report_submitted_at,report_due_at)',
    due_time: 'runtime_field:termination_due_at',
    deadline_ordering: ['termination_anchor_at_less_than_or_equal_to_termination_due_at','termination_due_at_less_than_or_equal_to_withdrawal_extension_due_at_when_extension_applies'],
    duration_days: 60,
    unknown_anchor_state: 'unknown_anchor',
    unknown_anchor_policy: {
      zero_false_or_no_deadline_coercion_forbidden: true,
      conservative_bound_rule: 'earliest_supportable_report_submitted_or_required_candidate_plus_60_days',
      permissive_bound_rule: 'latest_supportable_report_submitted_or_required_candidate_plus_60_days',
      no_candidate_rule: 'preserve_explicit_unknown_deadline_bounds_and_block_indefinite_continuation'
    },
    withdrawal_extension: {
      duration_max_days: 30,
      begins_at: 'termination_due_at',
      certification_required: true,
      condition: gate('gate_usa_wpr_termination_clock').extension_condition,
      due_time: 'runtime_field:withdrawal_extension_due_at'
    }
  });
  gate('gate_usa_declaration_or_specific_authorization_before_deadline').phase = 'continuation_condition';
  workflow.decision_gates.push({
    gate_id: 'gate_usa_wpr_regular_consultation',
    gate_type: 'ongoing_consultation_obligation',
    phase: 'post_activation_obligation',
    required_institution_ids: ['institution_usa_presidency', 'institution_usa_congress_119'],
    completion_evidence: 'Regular consultation record for as long as forces remain in hostilities or imminent hostilities.',
    noncompletion_effect: 'record_statutory_violation_without_retroactively_voiding_initial_activation',
    source_ids: ['src_usa_war_powers_resolution']
  });

  const activation = (id, from, to, gates) => ({transition_id:id, phase:'activation', from_state:from, to_state:to, gate_ids:gates});
  for (const route of workflow.routes) {
    const old = route.required_gate_ids ?? [];
    delete route.required_gate_ids;
    delete route.authority_state_on_completion;
    if (route.route_id === 'route_usa_declaration_of_war') route.transitions = [activation('transition_usa_declared_war_activation','not_authorized','accepted_for_declared_war',old)];
    if (route.route_id === 'route_usa_specific_statutory_authorization') route.transitions = [activation('transition_usa_specific_authorization_activation','not_authorized','accepted_within_statutory_scope',old)];
    if (route.route_id === 'route_usa_attack_emergency') {
      route.transitions = [
        {...activation('transition_usa_attack_emergency_activation','not_authorized','temporarily_accepted_subject_to_scope_and_wpr_clock',['gate_usa_attack_emergency_fact_established','gate_usa_wpr_consult_when_possible']), records_runtime_fields:['forces_introduced_at'], post_activation_obligation_gate_ids:['gate_usa_wpr_report_if_triggered','gate_usa_wpr_regular_consultation']},
        {transition_id:'transition_usa_attack_emergency_continuation',phase:'continuation_condition',from_state:'temporarily_accepted_subject_to_scope_and_wpr_clock',to_state:'accepted_within_authorized_scope',gate_ids:['gate_usa_declaration_or_specific_authorization_before_deadline']},
        {transition_id:'transition_usa_attack_emergency_termination',phase:'termination_condition',from_state:'temporarily_accepted_subject_to_scope_and_wpr_clock',to_state:'forces_removed_or_statutory_violation',gate_ids:['gate_usa_wpr_termination_clock'],noncompletion_effect:'statutory_violation_and_termination_required_not_retroactive_nonactivation'}
      ];
    }
    if (route.route_id === 'route_usa_contested_limited_presidential_force') {
      route.transitions = [
        {...activation('transition_usa_contested_article_ii_activation','not_authorized','contested_temporary_article_ii_claim_not_congressional_authorization',['gate_usa_article_ii_scope_assessment','gate_usa_wpr_consult_when_possible']), records_runtime_fields:['forces_introduced_at'], post_activation_obligation_gate_ids:['gate_usa_wpr_report_if_triggered','gate_usa_wpr_regular_consultation']},
        {transition_id:'transition_usa_contested_article_ii_continuation',phase:'continuation_condition',from_state:'contested_temporary_article_ii_claim_not_congressional_authorization',to_state:'accepted_within_authorized_scope',gate_ids:['gate_usa_declaration_or_specific_authorization_before_deadline']},
        {transition_id:'transition_usa_contested_article_ii_termination',phase:'termination_condition',from_state:'contested_temporary_article_ii_claim_not_congressional_authorization',to_state:'forces_removed_or_statutory_violation',gate_ids:['gate_usa_wpr_termination_clock'],noncompletion_effect:'statutory_violation_and_termination_required_not_retroactive_nonactivation'}
      ];
      route.contested_state_invariant = 'never_equivalent_to_congressional_authorization';
    }
    if (route.route_id === 'route_usa_continue_after_wpr_clock') route.transitions = [{transition_id:'transition_usa_continue_after_wpr_clock',phase:'continuation_condition',from_state:'temporary_or_contested_force_state',to_state:'accepted_within_authorized_scope',gate_ids:old}];
  }
  workflow.state_machine_contract = {
    activation_precedes_post_activation_obligations: true,
    later_violation_never_retroactively_prevents_activation: true,
    typed_transition_phases: ['precondition','activation','post_activation_obligation','continuation_condition','termination_condition'],
    runtime_event_history_is_append_only: true,
    unresolved_timed_anchor_is_not_no_clock: true
  };
  workflow.acceptance_rules.flat_required_gate_contract_is_executable = false;
  workflow.acceptance_rules.typed_transitions_required = true;
  write(workflowFile, workflow);
}

function updateTaiwan() {
  const dir = path.join(countriesRoot, 'twn');
  let evidence = read(path.join(dir, 'evidence_registry.json'));
  addSource(evidence, {
    source_id: 'src_twn_new_taipei_hou_dated_2025_08_29',
    title: 'New Taipei City joins IURC and EU office head visits Mayor Hou',
    publisher: 'New Taipei City Government',
    published_at: '2025-08-29',
    accessed_at: '2026-08-06',
    source_tier: 'A',
    source_type: 'official_release',
    source_family_id: 'family_new_taipei_city_government',
    url: 'https://www.info.ntpc.gov.tw/2025/08/29/new-taipei-city-joins-the-iurc-and-head-of-eu-office-pays-official-visit-to-mayor-hou/',
    relevant_locator: 'Official visit to New Taipei City Mayor Hou Yu-ih on August 28, 2025',
    reliability_notes: 'Dated prebookmark city government release establishes Hou Yu-ih was acting as mayor immediately before the bookmark.'
  });

  const claimSources = new Map([
    ['claim_twn_president_head_of_state_and_command', ['src_twn_constitution_main_text']],
    ['claim_twn_nsc_advises_president', ['src_twn_additional_articles']],
    ['claim_twn_president_declares_war', ['src_twn_constitution_main_text']],
    ['claim_twn_legislative_yuan_war_and_peace_bills', ['src_twn_constitution_main_text']],
    ['claim_twn_vp_succeeds_president', ['src_twn_additional_articles']],
    ['claim_twn_actor_hou_role', ['src_twn_new_taipei_hou_dated_2025_08_29']]
  ]);
  for (const claim of evidence.claims) {
    if (claimSources.has(claim.claim_id)) claim.source_ids = claimSources.get(claim.claim_id);
    if (claim.claim_id === 'claim_twn_actor_hou_role') {
      claim.effective_from = '2025-08-28';
      claim.interval_start_status = 'known';
    }
  }
  evidence.contradiction_sets.find(item => item.contradiction_set_id === 'contradiction_twn_war_authority_dual_gate').source_ids = ['src_twn_constitution_main_text'];
  evidence.sources.find(item => item.source_id === 'src_twn_additional_articles').instrument_effective_from = '2005-06-10';
  classifySources(evidence);
  write(path.join(dir, 'evidence_registry.json'), evidence);

  const replacements = {
    src_twn_president_authority: ['src_twn_constitution_main_text'],
    src_twn_vice_president_authority: ['src_twn_additional_articles'],
    src_twn_legislative_functions: ['src_twn_constitution_main_text'],
    src_twn_central_government: ['src_twn_additional_articles'],
    src_twn_new_taipei_hou: ['src_twn_new_taipei_hou_dated_2025_08_29']
  };
  for (const file of ['politics_and_institutions.json', 'bookmark_state.json', 'profile.json']) {
    write(path.join(dir, file), replaceSourceIds(read(path.join(dir, file)), replacements));
  }

  const workflowFile = path.join(dir, 'war_authority_workflow.json');
  let workflow = replaceSourceIds(read(workflowFile), replacements);
  const gate = id => workflow.decision_gates.find(item => item.gate_id === id);
  for (const item of workflow.decision_gates) item.phase = 'activation';
  gate('gate_twn_legislative_ratification_within_ten_days').phase = 'post_activation_obligation';
  Object.assign(gate('gate_twn_legislative_ratification_within_ten_days'), {
    anchor_event_type: 'presidential_emergency_decree_issuance',
    anchor_event_id: 'event_twn_emergency_decree_issued',
    anchor_status: 'runtime_required_known_or_unknown_anchor',
    anchor_time: 'runtime_field:issued_at',
    due_time: 'runtime_field:ratification_due_at',
    deadline_ordering: 'issued_at_less_than_or_equal_to_ratification_due_at',
    duration_days: 10,
    unknown_anchor_state: 'unknown_anchor',
    unknown_anchor_policy: {
      zero_false_or_no_deadline_coercion_forbidden: true,
      no_candidate_rule: 'preserve_explicit_unknown_due_at_and_block_ratified_state'
    }
  });
  const defenseFact = gate('gate_twn_attack_or_imminent_defense_fact_established');
  defenseFact.gate_type = 'independent_world_state_fact';
  defenseFact.required_institution_ids = [];
  defenseFact.event_source_constraint = 'independent_world_state_event_not_created_or_adjudicated_by_presidency';
  defenseFact.completion_evidence = 'An independently represented actual attack or operationally imminent threat event; a presidency-created assertion or political tension is insufficient.';

  const activation = (id, from, to, gates) => ({transition_id:id, phase:'activation', from_state:from, to_state:to, gate_ids:gates});
  for (const route of workflow.routes) {
    const old = route.required_gate_ids ?? [];
    delete route.required_gate_ids;
    delete route.authority_state_on_completion;
    if (route.route_id === 'route_twn_formal_declaration_of_war') route.transitions = [activation('transition_twn_formal_war_activation','not_declared','formal_war_authority_accepted_after_joint_gates',old)];
    if (route.route_id === 'route_twn_martial_law') route.transitions = [activation('transition_twn_martial_law_activation','ordinary_domestic_legal_regime','martial_law_accepted_with_legislative_approval_or_confirmation',old)];
    if (route.route_id === 'route_twn_emergency_decree') {
      route.transitions = [
        {...activation('transition_twn_emergency_decree_issuance','ordinary_constitutional_state','provisionally_effective_pending_ratification',['gate_twn_imminent_danger_or_serious_crisis_fact_established','gate_twn_executive_yuan_council_emergency_resolution','gate_twn_president_emergency_decree']),records_runtime_fields:['issued_at','ratification_due_at'],preserve_prior_effects_in_event_history:true},
        {transition_id:'transition_twn_emergency_decree_timely_ratification',phase:'post_activation_obligation',from_state:'provisionally_effective_pending_ratification',to_state:'ratified_effective',gate_ids:['gate_twn_legislative_ratification_within_ten_days'],event_condition:'ratified_at_less_than_or_equal_to_ratification_due_at',preserve_prior_effects_in_event_history:true},
        {transition_id:'transition_twn_emergency_decree_rejection',phase:'termination_condition',from_state:'provisionally_effective_pending_ratification',to_state:'ceased_forthwith',event_condition:'legislative_rejection',preserve_prior_effects_in_event_history:true},
        {transition_id:'transition_twn_emergency_decree_expiry',phase:'termination_condition',from_state:'provisionally_effective_pending_ratification',to_state:'ceased_forthwith',event_condition:'current_time_greater_than_ratification_due_at_without_timely_ratification',preserve_prior_effects_in_event_history:true}
      ];
      route.event_history_policy = 'append_only_preserve_consequences_during_provisional_effect';
    }
    if (route.route_id === 'route_twn_immediate_defensive_command') {
      route.execution_status = 'research_only_non_executable';
      route.blocking_review = 'independent_constitutional_review_of_scope_and_transition';
      route.transitions = [{
        ...activation('transition_twn_immediate_defensive_command_candidate','no_immediate_defense_state','research_only_defensive_command_candidate',old),
        executable: false,
        records_runtime_fields: ['activated_at']
      }];
      route.defensive_scope = {
        status: 'bounded_research_candidate_not_accepted',
        allowed_purpose: 'immediate_defense_against_the_independently_represented_trigger_only',
        formal_war_status_inferred: false,
        offensive_or_expanded_objectives: 'rejected_pending_separate_lawful_route'
      };
      route.activated_at = 'runtime_field:activated_at';
      route.review_due_at = {
        status: 'unknown_not_established_by_packet_sources',
        null_is_not_no_deadline: true,
        consequence: 'route_remains_research_only_non_executable'
      };
      route.termination_conditions = [
        'independent_attack_or_imminent_threat_event_ends',
        'proposed_action_exceeds_immediate_defensive_scope',
        'formal_war_route_is_initiated'
      ];
      route.formal_transition_conditions = {
        status: 'unknown_not_established_by_packet_sources',
        target_route_id: 'route_twn_formal_declaration_of_war',
        indefinite_continuation_forbidden: true
      };
      route.repeated_activation_policy = 'reject_without_new_independent_trigger_event';
    }
  }
  workflow.state_machine_contract = {
    activation_precedes_post_activation_obligations: true,
    typed_transition_phases: ['precondition','activation','post_activation_obligation','continuation_condition','termination_condition'],
    runtime_event_history_is_append_only: true,
    unresolved_timed_anchor_is_not_no_clock: true,
    research_only_route_cannot_change_gameplay_authority: true
  };
  workflow.acceptance_rules.flat_required_gate_contract_is_executable = false;
  workflow.acceptance_rules.typed_transitions_required = true;
  workflow.acceptance_rules.research_only_route_may_activate_gameplay_authority = false;
  write(workflowFile, workflow);
}

updateUsa();
updateTaiwan();
console.log('Applied Tier A politics promotion blocker corrections.');
