#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const defaultRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] ?? defaultRoot);
const errors = [];
const fail = (message) => errors.push(message);
const rows = (name) => fs.readFileSync(path.join(root, name), 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const organizations = rows('organizations.ndjson');
const relationships = rows('relationships.ndjson');
const orgById = new Map(organizations.map((row) => [row.organization_id, row]));

const strategicArms = ['aerospace_force','cyberspace_force','information_support_force','joint_logistic_support_force'];
for (const slug of strategicArms) {
  const org = orgById.get(`organization_chn_pla_${slug}`);
  if (!org) fail(`missing strategic arm ${slug}`);
  else if (org.organization_kind !== 'strategic_arm' || org.echelon !== 'strategic_arm' || org.service !== 'other') fail(`${slug} must use the official neutral strategic_arm classification`);
  const control = relationships.find((row) => row.relationship_id === `relationship_chn_central_military_commission_pla_${slug}_administrative_control`);
  if (!control || control.source_organization_id !== 'organization_chn_central_military_commission' || control.activation_state !== 'active') fail(`${slug} lacks CMC administrative control`);
}

const cmcOrgans = ['political_work_department','logistic_support_department','equipment_development_department','training_administration_department','national_defense_mobilization_department','discipline_inspection_commission'];
for (const slug of cmcOrgans) {
  const id = `organization_chn_cmc_${slug}`;
  if (!orgById.has(id)) fail(`missing public CMC organ ${slug}`);
  const relationship = relationships.find((row) => row.source_organization_id === id && row.target_organization_id === 'organization_chn_central_military_commission' && row.relationship_type === 'supporting');
  if (!relationship || relationship.authority_scope.may_issue_orders || relationship.authority_scope.may_release_for_mission) fail(`${slug} must remain a staff organ rather than an independent operational commander`);
}

const theaterComponents = [
  ['eastern','army'],['eastern','navy'],['eastern','air_force'],
  ['southern','army'],['southern','navy'],['southern','air_force'],
  ['western','army'],['western','air_force'],
  ['northern','army'],['northern','navy'],['northern','air_force'],
  ['central','army'],['central','air_force'],
];
for (const [theater, service] of theaterComponents) {
  const component = `organization_chn_${theater}_theater_${service}`;
  if (!orgById.has(component)) { fail(`missing ${theater} theater ${service} component`); continue; }
  const generation = relationships.find((row) => row.source_organization_id === `organization_chn_pla_${service}` && row.target_organization_id === component && row.relationship_type === 'organize_train_equip');
  if (!generation || generation.authority_scope.may_release_for_mission) fail(`${component} lacks bounded generating-service relationship`);
  const operation = relationships.find((row) => row.source_organization_id === `organization_chn_${theater}_theater_command` && row.target_organization_id === component && row.relationship_type === 'operational_control');
  if (!operation || !operation.authority_scope.may_issue_orders || !operation.authority_scope.may_release_for_mission) fail(`${component} lacks theater operational relationship`);
}

const rocket = relationships.find((row) => row.relationship_id === 'relationship_chn_pla_rocket_force_eastern_theater_conditional_force_assignment');
if (!rocket || rocket.activation_state !== 'conditional' || !rocket.conditions.some((value) => value.includes('specific CMC assignment'))) fail('Eastern Theater Rocket Force participation must remain conditional on a specific CMC assignment');
if (orgById.has('organization_chn_eastern_theater_rocket_force')) fail('unsupported permanent Eastern Theater Rocket Force component is forbidden');

for (const relationship of relationships) {
  if (!orgById.has(relationship.source_organization_id) || !orgById.has(relationship.target_organization_id)) fail(`orphan command relationship ${relationship.relationship_id}`);
  if (relationship.source_organization_id === relationship.target_organization_id) fail(`self command relationship ${relationship.relationship_id}`);
}

if (manifest.status !== 'collecting' || manifest.acceptance.research_complete || manifest.acceptance.decision_usable || manifest.acceptance.simulation_ready) fail('China national packet must remain collecting and non-executable');
const report = {status: errors.length ? 'FAIL' : 'PASS', packet: manifest.force_ledger_id, command_records: {organizations: organizations.length, relationships: relationships.length, strategic_arms: strategicArms.length, cmc_organs: cmcOrgans.length, theater_components: theaterComponents.length}, errors};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
