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
  value.routes.find(route => route.route_id === 'route_usa_specific_statutory_authorization').required_gate_ids = [];
  write(file, value);
}, 'route_usa_specific_statutory_authorization is prose only');

mutation('A02 Taiwan declaration requires the Legislative Yuan gate', root => {
  const file = path.join(root, 'twn', 'war_authority_workflow.json');
  const value = read(file);
  const route = value.routes.find(item => item.route_id === 'route_twn_formal_declaration_of_war');
  route.required_gate_ids = route.required_gate_ids.filter(id => id !== 'gate_twn_legislative_yuan_war_resolution');
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

console.log(JSON.stringify({status: failures.length ? 'FAIL' : 'PASS', regressions: results, failures}, null, 2));
if (failures.length) process.exit(1);
