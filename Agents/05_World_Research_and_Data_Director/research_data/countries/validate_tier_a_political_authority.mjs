import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? new URL('.', import.meta.url).pathname);
const errors = [];
const rolePredicates = new Set(['held_office_until','holds_office','holds_offices','member_of','opening_relevance']);

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
  const sourceFamilyById = new Map(evidence.sources.map(item => [item.source_id, item.source_family_id]));
  const publisherFamilies = new Map();
  for (const source of evidence.sources) {
    if (!publisherFamilies.has(source.publisher)) publisherFamilies.set(source.publisher, new Set());
    publisherFamilies.get(source.publisher).add(source.source_family_id);
  }
  for (const [publisher, families] of publisherFamilies) if (families.size !== 1) errors.push(`${code}: publisher ${publisher} is split across source families`);
  const contradictionIds = new Set(evidence.contradiction_sets.map(item => item.contradiction_set_id));
  const routeIds = new Set(workflow.routes.map(item => item.route_id));
  const gateIds = new Set(workflow.decision_gates.map(item => item.gate_id));

  if (workflow.as_of !== bookmark.as_of || workflow.bookmark_id !== bookmark.bookmark_id) errors.push(`${code}: authority workflow bookmark mismatch`);
  if (!workflow.status?.includes('review')) errors.push(`${code}: authority workflow cannot be accepted before independent legal review`);
  if (manifest.files.war_authority_workflow !== 'war_authority_workflow.json') errors.push(`${code}: manifest omits authority workflow`);
  if (bookmark.knowledge_firewall_status === 'passed_for_politics_lane' && !manifest.acceptance.bookmark_firewall_passed) errors.push(`${code}: contradictory bookmark firewall acceptance`);
  if (bookmark.acceptance_state?.bookmark_firewall_passed !== manifest.acceptance.bookmark_firewall_passed) errors.push(`${code}: bookmark and manifest firewall states differ`);
  if (bookmark.acceptance_state?.independent_review_complete !== manifest.acceptance.independent_review_complete) errors.push(`${code}: bookmark and manifest review states differ`);
  if (bookmark.acceptance_state?.politics_lane_status !== 'needs_review' || politics.status !== 'needs_review') errors.push(`${code}: politics acceptance states are contradictory`);

  if (politics.actor_selection_policy?.roster_size_is_acceptance_criterion !== false) errors.push(`${code}: actor roster remains count driven`);
  if (politics.actor_selection_policy?.practical_influence_default !== 'unaccepted') errors.push(`${code}: practical influence does not default to unaccepted`);
  for (const actor of politics.political_actors) {
    if (actor.selection_basis_status !== 'institutional_relevance_only') errors.push(`${code}: ${actor.actor_id} lacks gameplay selection meaning`);
    const influence = actor.practical_influence;
    if (!influence) errors.push(`${code}: ${actor.actor_id} lacks practical influence disposition`);
    else if (influence.status === 'accepted') {
      const families = new Set((influence.source_ids ?? []).map(sourceId => sourceFamilyById.get(sourceId)).filter(Boolean));
      if (families.size < 2 || influence.source_family_ids?.length < 2) errors.push(`${code}: ${actor.actor_id} practical influence lacks two independent source families`);
    } else if (influence.status !== 'unaccepted') errors.push(`${code}: ${actor.actor_id} has unsupported influence status ${influence.status}`);
  }

  for (const claim of evidence.claims.filter(item => rolePredicates.has(item.predicate))) {
    if (!claim.effective_from && claim.interval_start_status !== 'unknown_not_established_by_packet_source') errors.push(`${code}: ${claim.claim_id} has no interval start or explicit unknown`);
    if (claim.effective_from && claim.interval_start_status !== 'known') errors.push(`${code}: ${claim.claim_id} known interval start is not labeled known`);
    if (!claim.effective_to && claim.interval_end_status !== 'open_at_bookmark_end_not_established') errors.push(`${code}: ${claim.claim_id} has no interval end disposition`);
    if (claim.effective_to && claim.interval_end_status !== 'known') errors.push(`${code}: ${claim.claim_id} known interval end is not labeled known`);
  }

  if (!workflow.decision_gates.length || !workflow.routes.length) errors.push(`${code}: authority workflow lacks executable routes or gates`);
  for (const institution of workflow.institutions) {
    if (!institutionIds.has(institution.institution_id)) errors.push(`${code}: workflow cites missing institution ${institution.institution_id}`);
  }
  for (const gate of workflow.decision_gates) {
    if (!gate.gate_id || !gate.gate_type || !gate.completion_evidence) errors.push(`${code}: authority gate is descriptive rather than executable`);
    if (!gate.source_ids?.length) errors.push(`${code}: ${gate.gate_id} lacks provenance`);
    for (const sourceId of gate.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${gate.gate_id} cites missing ${sourceId}`);
    for (const institutionId of gate.required_institution_ids ?? []) if (!institutionIds.has(institutionId)) errors.push(`${code}: ${gate.gate_id} cites missing ${institutionId}`);
  }
  for (const route of workflow.routes) {
    if (!route.required_gate_ids?.length || !route.authority_state_on_completion) errors.push(`${code}: ${route.route_id} is prose only`);
    for (const gateId of route.required_gate_ids ?? []) if (!gateIds.has(gateId)) errors.push(`${code}: ${route.route_id} cites missing ${gateId}`);
    for (const sourceId of route.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${route.route_id} cites missing ${sourceId}`);
    if (route.contradiction_set_id && !contradictionIds.has(route.contradiction_set_id)) errors.push(`${code}: ${route.route_id} cites missing contradiction set`);
  }
  for (const sourceId of workflow.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: authority workflow cites missing source ${sourceId}`);
  for (const item of workflow.unresolved_interpretations ?? []) {
    if (!item.question_id || !item.question || !item.status) errors.push(`${code}: unresolved interpretation is not explicit`);
    for (const sourceId of item.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${code}: ${item.question_id} cites missing ${sourceId}`);
  }
  if (workflow.acceptance_rules?.prose_only_authority_is_executable !== false) errors.push(`${code}: prose can masquerade as executable authority`);
  if (workflow.acceptance_rules?.all_required_gates_must_be_structured !== true) errors.push(`${code}: routes do not require structured gates`);

  if (code === 'usa') {
    const report = workflow.decision_gates.find(item => item.gate_id === 'gate_usa_wpr_report_if_triggered');
    const clock = workflow.decision_gates.find(item => item.gate_id === 'gate_usa_wpr_termination_clock');
    if (report?.deadline_hours !== 48) errors.push('usa: WPR reporting deadline is not 48 hours');
    if (clock?.base_deadline_days !== 60 || clock?.withdrawal_extension_max_days !== 30) errors.push('usa: WPR termination clock is not 60 plus conditional 30 days');
    const taiwan = workflow.alliance_and_taiwan_branches.find(item => item.branch_id === 'branch_usa_taiwan_discretionary_intervention');
    if (taiwan?.domestic_force_authority_effect !== 'none_by_itself') errors.push('usa: Taiwan policy improperly creates domestic force authority');
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
    for (const gateId of required) if (!formal?.required_gate_ids.includes(gateId)) errors.push(`twn: formal war route omits ${gateId}`);
    if (!formal?.sequence_status?.includes('needs_independent_constitutional_review')) errors.push('twn: unresolved war declaration sequence was silently ordered');
    const ratification = workflow.decision_gates.find(item => item.gate_id === 'gate_twn_legislative_ratification_within_ten_days');
    if (ratification?.deadline_days !== 10 || ratification?.failure_effect !== 'decree_ceases_forthwith') errors.push('twn: emergency decree ratification rule is incorrect');
    const usPolicy = workflow.foreign_support_branches.find(item => item.branch_id === 'branch_twn_us_security_policy');
    if (usPolicy?.automatic_us_intervention !== false) errors.push('twn: United States intervention is incorrectly automatic');
  }
}

console.log(JSON.stringify({status: errors.length ? 'FAIL' : 'PASS', countries: 2, errors}, null, 2));
if (errors.length) process.exit(1);
