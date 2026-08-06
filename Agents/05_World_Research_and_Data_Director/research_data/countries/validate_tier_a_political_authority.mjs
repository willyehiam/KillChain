import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? new URL('.', import.meta.url).pathname);
const errors = [];
const rolePredicates = new Set(['held_office_until','holds_office','holds_offices','member_of','opening_relevance']);
const transitionPhases = new Set(['precondition','activation','post_activation_obligation','continuation_condition','termination_condition']);

function read(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { errors.push(`${file}: ${error.message}`); return null; }
}

for (const code of ['usa', 'twn']) {
  const dir = path.join(root, code);
  const workflow = read(path.join(dir, 'war_authority_workflow.json'));
  const politics = read(path.join(dir, 'politics_and_institutions.json'));
  const evidence = read(path.join(dir, 'evidence_registry.json'));
  const bookmark = read(path.join(dir, 'bookmark_state.json'));
  const manifest = read(path.join(dir, 'research_manifest.json'));
  if (!workflow || !politics || !evidence || !bookmark || !manifest) continue;

  const institutionIds = new Set(politics.institutions.map(item => item.institution_id));
  const sourceIds = new Set(evidence.sources.map(item => item.source_id));
  const sourceById = new Map(evidence.sources.map(item => [item.source_id, item]));
  const sourceFamilyById = new Map(evidence.sources.map(item => [item.source_id, item.source_family_id]));
  const publisherFamilies = new Map();
  for (const source of evidence.sources) {
    if (!publisherFamilies.has(source.publisher)) publisherFamilies.set(source.publisher, new Set());
    publisherFamilies.get(source.publisher).add(source.source_family_id);
  }
  for (const [publisher, families] of publisherFamilies) if (families.size !== 1) errors.push(`${code}: publisher ${publisher} is split across source families`);

  for (const source of evidence.sources) {
    if (!source.mutability_class) errors.push(`${code}: source ${source.source_id} lacks a mutability class`);
    if (source.mutability_class === 'live_mutable') {
      const archived = Boolean(source.archive_url && source.snapshot_at && source.content_hash && source.snapshot_at <= bookmark.as_of.slice(0, 10));
      const quarantined = source.bookmark_evidence_status === 'quarantined_no_prebookmark_temporal_proof' && source.temporal_proof_requirements?.continuity_inference_forbidden === true;
      if (!archived && !quarantined) errors.push(`${code}: live mutable source ${source.source_id} lacks prebookmark temporal proof or quarantine`);
    }
    if (source.mutability_class === 'legal_instrument') {
      const proof = source.bookmark_temporal_proof;
      if (proof?.status !== 'historically_valid_instrument_at_bookmark' || !proof.effective_from) errors.push(`${code}: legal instrument ${source.source_id} lacks a historically valid effective date`);
    }
    if ((source.mutability_class === 'dated_publication' || source.mutability_class === 'dated_dataset') && (!source.published_at || source.published_at > bookmark.as_of.slice(0, 10))) errors.push(`${code}: dated source ${source.source_id} is not proven available by the bookmark`);
  }
  const contradictionIds = new Set(evidence.contradiction_sets.map(item => item.contradiction_set_id));
  const routeIds = new Set(workflow.routes.map(item => item.route_id));
  const gateIds = new Set(workflow.decision_gates.map(item => item.gate_id));
  const nonRegistryOpeningSurface = fs.readdirSync(dir)
    .filter(file => file.endsWith('.json') && file !== 'evidence_registry.json')
    .map(file => fs.readFileSync(path.join(dir, file), 'utf8'))
    .join('\n');

  if (workflow.as_of !== bookmark.as_of || workflow.bookmark_id !== bookmark.bookmark_id) errors.push(`${code}: authority workflow bookmark mismatch`);
  if (!workflow.status?.includes('review')) errors.push(`${code}: authority workflow cannot be accepted before independent legal review`);
  if (manifest.files.war_authority_workflow !== 'war_authority_workflow.json') errors.push(`${code}: manifest omits authority workflow`);
  if (bookmark.knowledge_firewall_status === 'passed_for_politics_lane' && !manifest.acceptance.bookmark_firewall_passed) errors.push(`${code}: contradictory bookmark firewall acceptance`);
  if (bookmark.acceptance_state?.bookmark_firewall_passed !== manifest.acceptance.bookmark_firewall_passed) errors.push(`${code}: bookmark and manifest firewall states differ`);
  if (bookmark.acceptance_state?.independent_review_complete !== manifest.acceptance.independent_review_complete) errors.push(`${code}: bookmark and manifest review states differ`);
  if (bookmark.acceptance_state?.authority_contract_reviewed !== manifest.acceptance.politics_lane_authority_contract_reviewed) errors.push(`${code}: bookmark and manifest authority review states differ`);
  if (bookmark.acceptance_state?.politics_lane_status !== 'needs_review' || politics.status !== 'needs_review') errors.push(`${code}: politics acceptance states are contradictory`);

  if (politics.actor_selection_policy?.roster_size_is_acceptance_criterion !== false) errors.push(`${code}: actor roster remains count driven`);
  if (politics.actor_selection_policy?.practical_influence_default !== 'unaccepted') errors.push(`${code}: practical influence does not default to unaccepted`);
  for (const actor of politics.political_actors) {
    if (actor.selection_basis_status !== 'institutional_relevance_only') errors.push(`${code}: ${actor.actor_id} lacks gameplay selection meaning`);
    const influence = actor.practical_influence;
    if (!influence) errors.push(`${code}: ${actor.actor_id} lacks practical influence disposition`);
    else if (influence.status === 'accepted') {
      const missingSourceIds = (influence.source_ids ?? []).filter(sourceId => !sourceIds.has(sourceId));
      for (const sourceId of missingSourceIds) errors.push(`${code}: ${actor.actor_id} practical influence cites missing ${sourceId}`);
      const families = new Set((influence.source_ids ?? []).map(sourceId => sourceFamilyById.get(sourceId)).filter(Boolean));
      const declaredFamilies = new Set(influence.source_family_ids ?? []);
      if (families.size < 2 || declaredFamilies.size < 2) errors.push(`${code}: ${actor.actor_id} practical influence lacks two independent source families`);
      if ([...families].some(familyId => !declaredFamilies.has(familyId)) || [...declaredFamilies].some(familyId => !families.has(familyId))) {
        errors.push(`${code}: ${actor.actor_id} practical influence declared source families do not match cited sources`);
      }
      for (const sourceId of influence.source_ids ?? []) {
        const source = sourceById.get(sourceId);
        if (source?.published_at && Date.parse(source.published_at) > Date.parse(bookmark.as_of) && !['reference_only_not_initial_state', 'retrospective_reference_only'].includes(source.use) && !['reference_only', 'trajectory_reference_only'].includes(source.simulation_use)) {
          errors.push(`${code}: ${actor.actor_id} practical influence depends on post-bookmark source ${sourceId}`);
        }
      }
    } else if (influence.status !== 'unaccepted') errors.push(`${code}: ${actor.actor_id} has unsupported influence status ${influence.status}`);
  }

  for (const claim of evidence.claims.filter(item => rolePredicates.has(item.predicate))) {
    if (!claim.effective_from && claim.interval_start_status !== 'unknown_not_established_by_packet_source') errors.push(`${code}: ${claim.claim_id} has no interval start or explicit unknown`);
    if (claim.effective_from && claim.interval_start_status !== 'known') errors.push(`${code}: ${claim.claim_id} known interval start is not labeled known`);
    if (!claim.effective_to && claim.interval_end_status !== 'open_at_bookmark_end_not_established') errors.push(`${code}: ${claim.claim_id} has no interval end disposition`);
    if (claim.effective_to && claim.interval_end_status !== 'known') errors.push(`${code}: ${claim.claim_id} known interval end is not labeled known`);
    if (claim.effective_from && Number.isNaN(Date.parse(claim.effective_from))) errors.push(`${code}: ${claim.claim_id} interval start is not a valid date`);
    if (claim.effective_to && Number.isNaN(Date.parse(claim.effective_to))) errors.push(`${code}: ${claim.claim_id} interval end is not a valid date`);
    if (claim.effective_from && claim.effective_to && Date.parse(claim.effective_from) > Date.parse(claim.effective_to)) errors.push(`${code}: ${claim.claim_id} interval starts after it ends`);
    if (claim.effective_from && Date.parse(claim.effective_from) > Date.parse(bookmark.as_of)) errors.push(`${code}: ${claim.claim_id} opening role begins after the bookmark`);
    if (claim.as_of && Date.parse(claim.as_of) > Date.parse(bookmark.as_of)) errors.push(`${code}: ${claim.claim_id} role assertion is post-bookmark`);
  }

  for (const claim of evidence.claims) {
    for (const sourceId of claim.source_ids ?? []) {
      const source = sourceById.get(sourceId);
      if (source?.mutability_class === 'live_mutable' && source.bookmark_evidence_status === 'quarantined_no_prebookmark_temporal_proof' && claim.opening_truth_status !== 'unknown_unaccepted') {
        errors.push(`${code}: claim ${claim.claim_id} imports quarantined live mutable source ${sourceId} into opening truth`);
      }
    }
  }

  if (!workflow.decision_gates.length || !workflow.routes.length) errors.push(`${code}: authority workflow lacks executable routes or gates`);
  for (const institution of workflow.institutions) {
    if (!institutionIds.has(institution.institution_id)) errors.push(`${code}: workflow cites missing institution ${institution.institution_id}`);
  }
  for (const gate of workflow.decision_gates) {
    if (!gate.gate_id || !gate.gate_type || !gate.completion_evidence) errors.push(`${code}: authority gate is descriptive rather than executable`);
    if (!transitionPhases.has(gate.phase)) errors.push(`${code}: ${gate.gate_id} lacks a typed phase`);
    if (!gate.source_ids?.length) errors.push(`${code}: ${gate.gate_id} lacks provenance`);
    for (const sourceId of gate.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${gate.gate_id} cites missing ${sourceId}`);
    for (const institutionId of gate.required_institution_ids ?? []) if (!institutionIds.has(institutionId)) errors.push(`${code}: ${gate.gate_id} cites missing ${institutionId}`);
    const isTimed = gate.gate_type.startsWith('timed_') || gate.duration_hours !== undefined || gate.duration_days !== undefined || gate.deadline_hours !== undefined || gate.deadline_days !== undefined || gate.base_deadline_days !== undefined;
    if (isTimed) {
      for (const field of ['anchor_event_type','anchor_event_id','anchor_status','anchor_time','due_time','deadline_ordering','unknown_anchor_state','unknown_anchor_policy']) if (!gate[field]) errors.push(`${code}: timed gate ${gate.gate_id} lacks ${field}`);
      if (gate.unknown_anchor_policy?.zero_false_or_no_deadline_coercion_forbidden !== true) errors.push(`${code}: timed gate ${gate.gate_id} can silently coerce an unknown anchor to no clock`);
      for (const [field, value] of Object.entries(gate)) if ((field.includes('duration') || field.includes('deadline')) && typeof value === 'number' && value < 0) errors.push(`${code}: timed gate ${gate.gate_id} has negative ${field}`);
    }
  }
  for (const route of workflow.routes) {
    if ('required_gate_ids' in route || 'authority_state_on_completion' in route) errors.push(`${code}: ${route.route_id} retains the ambiguous flat gate contract`);
    if (!route.transitions?.length) errors.push(`${code}: ${route.route_id} is prose only`);
    for (const transition of route.transitions ?? []) {
      if (!transition.transition_id || !transitionPhases.has(transition.phase) || !transition.from_state || !transition.to_state) errors.push(`${code}: ${route.route_id} has a descriptive rather than typed transition`);
      if ((transition.phase === 'activation' || transition.phase === 'post_activation_obligation' || transition.phase === 'continuation_condition') && !transition.gate_ids?.length) errors.push(`${code}: ${transition.transition_id} lacks structured gates`);
      for (const gateId of transition.gate_ids ?? []) if (!gateIds.has(gateId)) errors.push(`${code}: ${route.route_id} cites missing ${gateId}`);
    }
    for (const sourceId of route.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${route.route_id} cites missing ${sourceId}`);
    if (route.contradiction_set_id && !contradictionIds.has(route.contradiction_set_id)) errors.push(`${code}: ${route.route_id} cites missing contradiction set`);
  }
  const workflowText = JSON.stringify(workflow);
  for (const source of evidence.sources.filter(item => item.mutability_class === 'live_mutable' && item.bookmark_evidence_status === 'quarantined_no_prebookmark_temporal_proof')) {
    const exactId = `"${source.source_id}"`;
    if (workflowText.includes(exactId)) errors.push(`${code}: authority workflow imports quarantined live mutable source ${source.source_id}`);
    if (nonRegistryOpeningSurface.includes(exactId)) errors.push(`${code}: opening packet imports quarantined live mutable source ${source.source_id}`);
  }
  for (const sourceId of workflow.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: authority workflow cites missing source ${sourceId}`);
  for (const branch of [...(workflow.alliance_and_taiwan_branches ?? []), ...(workflow.foreign_support_branches ?? [])]) {
    for (const sourceId of branch.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${branch.branch_id} cites missing ${sourceId}`);
  }
  const openingPacketSourceIds = new Set([
    ...(workflow.source_ids ?? []),
    ...workflow.decision_gates.flatMap(item => item.source_ids ?? []),
    ...workflow.routes.flatMap(item => item.source_ids ?? []),
    ...(workflow.alliance_and_taiwan_branches ?? []).flatMap(item => item.source_ids ?? []),
    ...(workflow.foreign_support_branches ?? []).flatMap(item => item.source_ids ?? []),
  ]);
  for (const sourceId of openingPacketSourceIds) {
    const source = sourceById.get(sourceId);
    if (source?.published_at && Date.parse(source.published_at) > Date.parse(bookmark.as_of) && !['reference_only_not_initial_state', 'retrospective_reference_only'].includes(source.use) && !['reference_only', 'trajectory_reference_only'].includes(source.simulation_use)) {
      errors.push(`${code}: authority workflow depends on post-bookmark source ${sourceId}`);
    }
  }
  for (const item of workflow.unresolved_interpretations ?? []) {
    if (!item.question_id || !item.question || !item.status) errors.push(`${code}: unresolved interpretation is not explicit`);
    for (const sourceId of item.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${item.question_id} cites missing ${sourceId}`);
  }
  if (workflow.acceptance_rules?.prose_only_authority_is_executable !== false) errors.push(`${code}: prose can masquerade as executable authority`);
  if (workflow.acceptance_rules?.all_required_gates_must_be_structured !== true) errors.push(`${code}: routes do not require structured gates`);
  if (workflow.acceptance_rules?.flat_required_gate_contract_is_executable !== false || workflow.acceptance_rules?.typed_transitions_required !== true) errors.push(`${code}: ambiguous flat gates can still masquerade as executable authority`);
  if (workflow.state_machine_contract?.activation_precedes_post_activation_obligations !== true || workflow.state_machine_contract?.unresolved_timed_anchor_is_not_no_clock !== true) errors.push(`${code}: authority state machine temporal contract is incomplete`);

  if (code === 'usa') {
    const report = workflow.decision_gates.find(item => item.gate_id === 'gate_usa_wpr_report_if_triggered');
    const clock = workflow.decision_gates.find(item => item.gate_id === 'gate_usa_wpr_termination_clock');
    if (report?.deadline_hours !== 48) errors.push('usa: WPR reporting deadline is not 48 hours');
    if (clock?.base_deadline_days !== 60 || clock?.withdrawal_extension_max_days !== 30) errors.push('usa: WPR termination clock is not 60 plus conditional 30 days');
    if (report?.anchor_event_id !== 'event_usa_forces_introduced' || report?.anchor_time !== 'runtime_field:forces_introduced_at' || report?.duration_hours !== 48) errors.push('usa: WPR report clock lacks the force introduction anchor');
    if (clock?.anchor_event_id !== 'event_usa_wpr_report_submitted_or_required' || clock?.anchor_time_rule !== 'earlier_of(report_submitted_at,report_due_at)' || clock?.duration_days !== 60) errors.push('usa: WPR termination clock lacks the report submitted or required anchor');
    if (report?.deadline_ordering !== 'forces_introduced_at_less_than_or_equal_to_report_due_at' || !clock?.deadline_ordering?.includes('termination_anchor_at_less_than_or_equal_to_termination_due_at') || !clock?.deadline_ordering?.includes('termination_due_at_less_than_or_equal_to_withdrawal_extension_due_at_when_extension_applies')) errors.push('usa: impossible WPR deadline ordering is not rejected');
    if (clock?.withdrawal_extension?.duration_max_days !== 30 || clock?.withdrawal_extension?.certification_required !== true || clock?.withdrawal_extension?.begins_at !== 'termination_due_at') errors.push('usa: WPR conditional withdrawal extension is not modeled separately');
    for (const routeId of ['route_usa_attack_emergency','route_usa_contested_limited_presidential_force']) {
      const route = workflow.routes.find(item => item.route_id === routeId);
      const activation = route?.transitions.find(item => item.phase === 'activation');
      const forbidden = new Set(['gate_usa_wpr_report_if_triggered','gate_usa_wpr_regular_consultation','gate_usa_wpr_termination_clock']);
      if (!activation || activation.gate_ids.some(gateId => forbidden.has(gateId))) errors.push(`usa: ${routeId} treats post-introduction obligations as activation prerequisites`);
      if (!activation?.records_runtime_fields?.includes('forces_introduced_at')) errors.push(`usa: ${routeId} does not record forces_introduced_at`);
      if (!activation?.post_activation_obligation_gate_ids?.includes('gate_usa_wpr_report_if_triggered')) errors.push(`usa: ${routeId} omits the post-activation WPR report obligation`);
      if (!route?.transitions.some(item => item.phase === 'termination_condition' && item.gate_ids?.includes('gate_usa_wpr_termination_clock'))) errors.push(`usa: ${routeId} omits the WPR termination transition`);
    }
    const contested = workflow.routes.find(item => item.route_id === 'route_usa_contested_limited_presidential_force');
    if (contested?.contested_state_invariant !== 'never_equivalent_to_congressional_authorization') errors.push('usa: contested Article II route can become equivalent to congressional authorization');
    const taiwan = workflow.alliance_and_taiwan_branches.find(item => item.branch_id === 'branch_usa_taiwan_discretionary_intervention');
    if (taiwan?.domestic_force_authority_effect !== 'none_by_itself') errors.push('usa: Taiwan policy improperly creates domestic force authority');
    if (!taiwan?.required_route_ids?.length) errors.push('usa: Taiwan policy bypasses domestic authority routes');
    for (const routeId of taiwan?.required_route_ids ?? []) if (!routeIds.has(routeId)) errors.push(`usa: Taiwan policy cites missing authority route ${routeId}`);
    if (workflow.acceptance_rules.treaty_or_policy_commitment_implies_domestic_force_authority !== false) errors.push('usa: treaty commitment improperly implies domestic force authority');
    const succession = read(path.join(dir, 'presidential_succession.json'));
    if (!succession) errors.push('usa: presidential succession workflow is absent');
    else {
      const ranks = succession.nodes.map(node => node.rank);
      if (ranks.length !== 18 || ranks.some((rank, index) => rank !== index + 1)) errors.push('usa: presidential succession does not cover the full statutory office order');
      const expected = ['Vice President','Speaker of the House','President pro tempore of the Senate','Secretary of State','Secretary of the Treasury','Secretary of Defense','Attorney General','Secretary of the Interior','Secretary of Agriculture','Secretary of Commerce','Secretary of Labor','Secretary of Health and Human Services','Secretary of Housing and Urban Development','Secretary of Transportation','Secretary of Energy','Secretary of Education','Secretary of Veterans Affairs','Secretary of Homeland Security'];
      if (succession.nodes.some((node, index) => node.office !== expected[index])) errors.push('usa: presidential succession office order is incorrect');
      for (const node of succession.nodes) {
        for (const sourceId of node.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`usa: succession rank ${node.rank} cites missing ${sourceId}`);
        if (node.opening_actor_id && !politics.political_actors.some(actor => actor.actor_id === node.opening_actor_id)) errors.push(`usa: succession rank ${node.rank} cites missing actor`);
        if (!node.opening_actor_id && !node.opening_actor_resolution) errors.push(`usa: succession rank ${node.rank} silently omits opening officeholder`);
      }
      for (const sourceId of succession.nodes.flatMap(node => node.source_ids ?? [])) {
        const source = sourceById.get(sourceId);
        if (source?.published_at && Date.parse(source.published_at) > Date.parse(bookmark.as_of) && !['reference_only_not_initial_state', 'retrospective_reference_only'].includes(source.use) && !['reference_only', 'trajectory_reference_only'].includes(source.simulation_use)) {
          errors.push(`usa: presidential succession depends on post-bookmark source ${sourceId}`);
        }
      }
      const speaker = succession.nodes[1];
      const proTem = succession.nodes[2];
      if (!speaker.qualification_conditions.includes('resign_as_speaker') || !speaker.qualification_conditions.includes('resign_as_representative')) errors.push('usa: Speaker resignation conditions are absent');
      if (!proTem.qualification_conditions.includes('resign_as_president_pro_tempore') || !proTem.qualification_conditions.includes('resign_as_senator')) errors.push('usa: President pro tempore resignation conditions are absent');
      if (succession.distinctions.vice_president_on_presidential_vacancy !== 'succeeds_as_president' || succession.distinctions.statutory_successors !== 'act_as_president_after_qualification_and_any_required_resignation') errors.push('usa: succession and acting distinctions are collapsed');
    }
  }

  if (code === 'twn') {
    const formal = workflow.routes.find(item => item.route_id === 'route_twn_formal_declaration_of_war');
    const required = ['gate_twn_executive_yuan_council_war_bill','gate_twn_legislative_yuan_war_resolution','gate_twn_president_declaration'];
    const formalGateIds = formal?.transitions.find(item => item.phase === 'activation')?.gate_ids ?? [];
    for (const gateId of required) if (!formalGateIds.includes(gateId)) errors.push(`twn: formal war route omits ${gateId}`);
    if (!formal?.sequence_status?.includes('needs_independent_constitutional_review')) errors.push('twn: unresolved war declaration sequence was silently ordered');
    const ratification = workflow.decision_gates.find(item => item.gate_id === 'gate_twn_legislative_ratification_within_ten_days');
    if (ratification?.deadline_days !== 10 || ratification?.failure_effect !== 'decree_ceases_forthwith') errors.push('twn: emergency decree ratification rule is incorrect');
    if (ratification?.anchor_event_id !== 'event_twn_emergency_decree_issued' || ratification?.anchor_time !== 'runtime_field:issued_at' || ratification?.duration_days !== 10) errors.push('twn: emergency decree ratification lacks the issuance anchor');
    const emergency = workflow.routes.find(item => item.route_id === 'route_twn_emergency_decree');
    const issuance = emergency?.transitions.find(item => item.transition_id === 'transition_twn_emergency_decree_issuance');
    if (issuance?.to_state !== 'provisionally_effective_pending_ratification' || issuance?.gate_ids.includes('gate_twn_legislative_ratification_within_ten_days')) errors.push('twn: emergency decree is not provisionally effective before ratification');
    for (const state of ['ratified_effective','ceased_forthwith']) if (!emergency?.transitions.some(item => item.to_state === state)) errors.push(`twn: emergency decree route lacks ${state} transition`);
    if (emergency?.event_history_policy !== 'append_only_preserve_consequences_during_provisional_effect') errors.push('twn: emergency decree event history can discard provisional consequences');
    const defense = workflow.routes.find(item => item.route_id === 'route_twn_immediate_defensive_command');
    const defenseFact = workflow.decision_gates.find(item => item.gate_id === 'gate_twn_attack_or_imminent_defense_fact_established');
    if (defense?.execution_status !== 'research_only_non_executable' || defense?.transitions.some(item => item.executable !== false)) errors.push('twn: unresolved immediate defensive command route is executable');
    if (defenseFact?.event_source_constraint !== 'independent_world_state_event_not_created_or_adjudicated_by_presidency' || defenseFact?.required_institution_ids?.length) errors.push('twn: presidency can manufacture its own immediate defense trigger');
    if (!defense?.defensive_scope || !defense?.activated_at || defense?.review_due_at?.null_is_not_no_deadline !== true || !defense?.termination_conditions?.length || defense?.formal_transition_conditions?.target_route_id !== 'route_twn_formal_declaration_of_war' || defense?.formal_transition_conditions?.indefinite_continuation_forbidden !== true) errors.push('twn: immediate defensive command lacks bounded scope and formal transition safeguards');
    if (defense?.repeated_activation_policy !== 'reject_without_new_independent_trigger_event') errors.push('twn: immediate defensive command can be repeatedly activated without a new trigger');
    const usPolicy = workflow.foreign_support_branches.find(item => item.branch_id === 'branch_twn_us_security_policy');
    if (usPolicy?.automatic_us_intervention !== false) errors.push('twn: United States intervention is incorrectly automatic');
    const foreignSupport = workflow.foreign_support_branches.find(item => item.branch_id === 'branch_twn_request_foreign_support');
    if (!foreignSupport?.foreign_force_authority_effect?.startsWith('none')) errors.push('twn: foreign support improperly creates foreign force authority');
  }
}

console.log(JSON.stringify({status: errors.length ? 'FAIL' : 'PASS', countries: 2, errors}, null, 2));
if (errors.length) process.exit(1);
