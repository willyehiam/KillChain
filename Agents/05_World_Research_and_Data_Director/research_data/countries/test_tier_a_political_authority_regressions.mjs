#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
const results = [];

function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function write(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }

function mutation(name, mutate, diagnostic) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'killweb-authority-regression-'));
  const root = path.join(temp, 'countries');
  try {
    fs.cpSync(sourceRoot, root, {recursive: true});
    mutate(root);
    const result = spawnSync(process.execPath, [path.join(root, 'validate_tier_a_political_authority.mjs'), root], {encoding:'utf8'});
    const output = `${result.stdout}\n${result.stderr}`;
    const passed = result.status !== 0 && output.includes(diagnostic);
    results.push({name, passed, expected_diagnostic: diagnostic});
    if (!passed) failures.push(`${name}: missing ${diagnostic}`);
  } finally {
    fs.rmSync(temp, {recursive:true, force:true});
  }
}

mutation('A01 prose cannot replace required United States gates', root => {
  const file = path.join(root, 'usa', 'war_authority_workflow.json');
  const value = read(file);
  value.routes.find(route => route.route_id === 'route_usa_specific_statutory_authorization').transitions[0].gate_ids = [];
  write(file, value);
}, 'transition_usa_specific_authorization_activation lacks structured gates');

mutation('A02 Taiwan declaration requires the Legislative Yuan gate', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  const route = value.routes.find(item => item.route_id === 'route_twn_formal_declaration_of_war');
  route.transitions[0].gate_ids = route.transitions[0].gate_ids.filter(id => id !== 'gate_twn_legislative_yuan_war_resolution');
  write(file, value);
}, 'formal war route omits gate_twn_legislative_yuan_war_resolution');

mutation('A03 Taiwan declaration sequence cannot be silently settled', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  value.routes.find(item => item.route_id === 'route_twn_formal_declaration_of_war').sequence_status = 'fixed_sequence';
  write(file, value);
}, 'unresolved war declaration sequence was silently ordered');

mutation('A04 Taiwan policy cannot create automatic United States intervention', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  value.foreign_support_branches.find(item => item.branch_id === 'branch_twn_us_security_policy').automatic_us_intervention = true;
  write(file, value);
}, 'United States intervention is incorrectly automatic');

mutation('A05 unreviewed bookmark cannot claim firewall passage', root => {
  const file = path.join(root, 'usa', 'bookmark_state.json');
  const value = read(file);
  value.knowledge_firewall_status = 'passed_for_politics_lane';
  write(file, value);
}, 'contradictory bookmark firewall acceptance');

mutation('A06 practical influence needs independent source families', root => {
  const file = path.join(root, 'usa', 'politics_and_institutions.json');
  const value = read(file);
  const actor = value.political_actors[0];
  actor.practical_influence = {status:'accepted',source_ids:['src_usa_white_house_administration'],source_family_ids:['family_the_white_house'],minimum_independent_source_families:2};
  write(file, value);
}, 'practical influence lacks two independent source families');

mutation('A07 role snapshot needs interval start disposition', root => {
  const file = path.join(root, 'usa', 'evidence_registry.json');
  const value = read(file);
  const claim = value.claims.find(item => item.claim_id === 'claim_usa_actor_trump_role');
  delete claim.effective_from;
  delete claim.interval_start_status;
  write(file, value);
}, 'has no interval start or explicit unknown');

mutation('A08 statutory succession must cover the full office order', root => {
  const file = path.join(root, 'usa', 'presidential_succession.json');
  const value = read(file);
  value.nodes.pop();
  write(file, value);
}, 'does not cover the full statutory office order');

mutation('A09 legislative successors require resignation conditions', root => {
  const file = path.join(root, 'usa', 'presidential_succession.json');
  const value = read(file);
  value.nodes[1].qualification_conditions = value.nodes[1].qualification_conditions.filter(item => item !== 'resign_as_representative');
  write(file, value);
}, 'Speaker resignation conditions are absent');

mutation('A10 one publisher cannot masquerade as independent source families', root => {
  const file = path.join(root, 'usa', 'evidence_registry.json');
  const value = read(file);
  value.sources.find(item => item.source_id === 'src_usa_presidential_succession_statute').source_family_id = 'false_independent_alias';
  write(file, value);
}, 'is split across source families');

mutation('A11 practical influence declared families must match cited sources', root => {
  const file = path.join(root, 'usa', 'politics_and_institutions.json');
  const value = read(file);
  value.political_actors[0].practical_influence = {
    status: 'accepted',
    source_ids: ['src_usa_white_house_administration', 'src_usa_rubio_acting_nsa_reuters_2025'],
    source_family_ids: ['family_the_white_house', 'fabricated_independent_family'],
    minimum_independent_source_families: 2,
  };
  write(file, value);
}, 'practical influence declared source families do not match cited sources');

mutation('A12 practical influence cannot cite a missing source', root => {
  const file = path.join(root, 'usa', 'politics_and_institutions.json');
  const value = read(file);
  value.political_actors[0].practical_influence = {
    status: 'accepted',
    source_ids: ['src_usa_white_house_administration', 'src_usa_rubio_acting_nsa_reuters_2025', 'src_missing_influence'],
    source_family_ids: ['family_the_white_house', 'family_reuters'],
    minimum_independent_source_families: 2,
  };
  write(file, value);
}, 'practical influence cites missing src_missing_influence');

mutation('A13 role interval cannot start after it ends', root => {
  const file = path.join(root, 'usa', 'evidence_registry.json');
  const value = read(file);
  const claim = value.claims.find(item => item.claim_id === 'claim_usa_actor_rubio_role');
  claim.effective_to = '2025-04-30';
  claim.interval_end_status = 'known';
  write(file, value);
}, 'interval starts after it ends');

mutation('A14 opening role cannot begin after the bookmark', root => {
  const file = path.join(root, 'usa', 'evidence_registry.json');
  const value = read(file);
  const claim = value.claims.find(item => item.claim_id === 'claim_usa_actor_grassley_role');
  claim.effective_from = '2025-09-02';
  write(file, value);
}, 'opening role begins after the bookmark');

mutation('A15 authority workflow rejects explicit post-bookmark evidence', root => {
  const file = path.join(root, 'usa', 'evidence_registry.json');
  const value = read(file);
  value.sources.find(item => item.source_id === 'src_usa_war_powers_resolution').published_at = '2025-09-02';
  write(file, value);
}, 'authority workflow depends on post-bookmark source src_usa_war_powers_resolution');

mutation('A16 Taiwan foreign support cannot manufacture foreign force authority', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  value.foreign_support_branches.find(item => item.branch_id === 'branch_twn_request_foreign_support').foreign_force_authority_effect = 'automatic_on_request';
  write(file, value);
}, 'foreign support improperly creates foreign force authority');

mutation('A17 United States Taiwan policy cannot omit domestic authority routes', root => {
  const file = path.join(root, 'usa', 'war_authority_workflow.json');
  const value = read(file);
  value.alliance_and_taiwan_branches.find(item => item.branch_id === 'branch_usa_taiwan_discretionary_intervention').required_route_ids = [];
  write(file, value);
}, 'Taiwan policy bypasses domestic authority routes');

mutation('A18 authority review acceptance must agree across bookmark and manifest', root => {
  const file = path.join(root, 'usa', 'bookmark_state.json');
  const value = read(file);
  value.acceptance_state.authority_contract_reviewed = true;
  write(file, value);
}, 'bookmark and manifest authority review states differ');

mutation('A19 practical influence rejects post-bookmark evidence', root => {
  const politicsFile = path.join(root, 'usa', 'politics_and_institutions.json');
  const evidenceFile = path.join(root, 'usa', 'evidence_registry.json');
  const politics = read(politicsFile);
  const evidence = read(evidenceFile);
  politics.political_actors[0].practical_influence = {
    status: 'accepted',
    source_ids: ['src_usa_white_house_administration', 'src_usa_rubio_acting_nsa_reuters_2025'],
    source_family_ids: ['family_the_white_house', 'family_reuters'],
    minimum_independent_source_families: 2,
  };
  evidence.sources.find(item => item.source_id === 'src_usa_rubio_acting_nsa_reuters_2025').published_at = '2025-09-02';
  write(politicsFile, politics);
  write(evidenceFile, evidence);
}, 'practical influence depends on post-bookmark source src_usa_rubio_acting_nsa_reuters_2025');

mutation('A20 authority branch provenance must resolve', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  value.foreign_support_branches[0].source_ids.push('src_missing_branch_provenance');
  write(file, value);
}, 'branch_twn_request_foreign_support cites missing src_missing_branch_provenance');
mutation('A21 WPR report cannot become an activation prerequisite', root => {
  const file = path.join(root, 'usa', 'war_authority_workflow.json');
  const value = read(file);
  value.routes.find(item => item.route_id === 'route_usa_attack_emergency').transitions.find(item => item.phase === 'activation').gate_ids.push('gate_usa_wpr_report_if_triggered');
  write(file, value);
}, 'treats post-introduction obligations as activation prerequisites');

mutation('A22 timed WPR gate requires an executable anchor', root => {
  const file = path.join(root, 'usa', 'war_authority_workflow.json');
  const value = read(file);
  delete value.decision_gates.find(item => item.gate_id === 'gate_usa_wpr_termination_clock').anchor_event_id;
  write(file, value);
}, 'timed gate gate_usa_wpr_termination_clock lacks anchor_event_id');

mutation('A23 unknown WPR anchor cannot silently become no clock', root => {
  const file = path.join(root, 'usa', 'war_authority_workflow.json');
  const value = read(file);
  value.decision_gates.find(item => item.gate_id === 'gate_usa_wpr_report_if_triggered').unknown_anchor_policy.zero_false_or_no_deadline_coercion_forbidden = false;
  write(file, value);
}, 'can silently coerce an unknown anchor to no clock');

mutation('A24 Taiwan ratification cannot be an emergency decree activation prerequisite', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  value.routes.find(item => item.route_id === 'route_twn_emergency_decree').transitions.find(item => item.transition_id === 'transition_twn_emergency_decree_issuance').gate_ids.push('gate_twn_legislative_ratification_within_ten_days');
  write(file, value);
}, 'emergency decree is not provisionally effective before ratification');

mutation('A25 unresolved Taiwan immediate defense cannot execute', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  value.routes.find(item => item.route_id === 'route_twn_immediate_defensive_command').execution_status = 'executable';
  write(file, value);
}, 'unresolved immediate defensive command route is executable');

mutation('A26 Taiwan presidency cannot manufacture the defense trigger', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  const gate = value.decision_gates.find(item => item.gate_id === 'gate_twn_attack_or_imminent_defense_fact_established');
  gate.required_institution_ids = ['institution_twn_presidency'];
  write(file, value);
}, 'presidency can manufacture its own immediate defense trigger');

mutation('A27 live mutable source must be quarantined or proven', root => {
  const file = path.join(root, 'usa', 'evidence_registry.json');
  const value = read(file);
  const source = value.sources.find(item => item.source_id === 'src_usa_white_house_administration');
  delete source.bookmark_evidence_status;
  delete source.temporal_proof_requirements;
  write(file, value);
}, 'lacks prebookmark temporal proof or quarantine');

mutation('A28 quarantined live source cannot become opening truth', root => {
  const file = path.join(root, 'usa', 'evidence_registry.json');
  const value = read(file);
  value.claims.find(item => item.claim_id === 'claim_usa_actor_trump_role').source_ids = ['src_usa_white_house_administration'];
  write(file, value);
}, 'imports quarantined live mutable source');

mutation('A29 impossible WPR deadline ordering is rejected', root => {
  const file = path.join(root, 'usa', 'war_authority_workflow.json');
  const value = read(file);
  value.decision_gates.find(item => item.gate_id === 'gate_usa_wpr_termination_clock').deadline_ordering = ['withdrawal_extension_due_at_before_termination_due_at'];
  write(file, value);
}, 'impossible WPR deadline ordering is not rejected');

function evaluateEmergencyDecree({issuedAt, ratifiedAt = null, rejectedAt = null, now}) {
  const workflow = read(path.join(sourceRoot, 'twn', 'war_authority_workflow.json'));
  const route = workflow.routes.find(item => item.route_id === 'route_twn_emergency_decree');
  const ratification = workflow.decision_gates.find(item => item.gate_id === 'gate_twn_legislative_ratification_within_ten_days');
  const issued = Date.parse(issuedAt);
  const due = issued + ratification.duration_days * 86_400_000;
  const at = Date.parse(now);
  if (!route.transitions.some(item => item.to_state === 'provisionally_effective_pending_ratification')) return 'invalid_contract';
  if (rejectedAt && Date.parse(rejectedAt) <= at) return 'ceased_forthwith';
  if (ratifiedAt && Date.parse(ratifiedAt) <= due) return 'ratified_effective';
  if (at > due || (ratifiedAt && Date.parse(ratifiedAt) > due)) return 'ceased_forthwith';
  return 'provisionally_effective_pending_ratification';
}

const emergencyFixtures = [
  {name:'A30 pre-ratification use is provisionally effective', input:{issuedAt:'2025-09-01T00:00:00Z',now:'2025-09-05T00:00:00Z'}, expected:'provisionally_effective_pending_ratification'},
  {name:'A31 timely ratification becomes effective', input:{issuedAt:'2025-09-01T00:00:00Z',ratifiedAt:'2025-09-10T00:00:00Z',now:'2025-09-10T00:00:00Z'}, expected:'ratified_effective'},
  {name:'A32 legislative rejection ceases the decree forthwith', input:{issuedAt:'2025-09-01T00:00:00Z',rejectedAt:'2025-09-04T00:00:00Z',now:'2025-09-04T00:00:00Z'}, expected:'ceased_forthwith'},
  {name:'A33 expiry without ratification ceases the decree forthwith', input:{issuedAt:'2025-09-01T00:00:00Z',now:'2025-09-12T00:00:00Z'}, expected:'ceased_forthwith'},
  {name:'A34 ratification after the deadline cannot revive the decree', input:{issuedAt:'2025-09-01T00:00:00Z',ratifiedAt:'2025-09-12T00:00:00Z',now:'2025-09-12T00:00:00Z'}, expected:'ceased_forthwith'}
];
for (const fixture of emergencyFixtures) {
  const actual = evaluateEmergencyDecree(fixture.input);
  const passed = actual === fixture.expected;
  results.push({name:fixture.name, passed, expected_state:fixture.expected, actual_state:actual});
  if (!passed) failures.push(`${fixture.name}: expected ${fixture.expected}, received ${actual}`);
}
console.log(JSON.stringify({status: failures.length ? 'FAIL' : 'PASS', regressions: results, failures}, null, 2));
if (failures.length) process.exit(1);
