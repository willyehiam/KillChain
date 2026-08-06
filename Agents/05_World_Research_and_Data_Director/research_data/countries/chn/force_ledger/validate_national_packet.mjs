#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const defaultRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] ?? defaultRoot);
const asOf = '2025-09-01T00:00:00Z';
const errors = [];
const fail = (message) => errors.push(message);
const rows = (name) => fs.readFileSync(path.join(root, name), 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const organizations = rows('organizations.ndjson');
const relationships = rows('relationships.ndjson');
const sources = rows('sources.ndjson');
const claims = rows('claims.ndjson');
const contradictions = rows('contradictions.ndjson');
const equipment = rows('equipment_types.ndjson');
const platforms = rows('platforms.ndjson');
const inventory = rows('inventory.ndjson');
const deployments = rows('deployments.ndjson');
const maintenance = rows('maintenance.ndjson');
const construction = rows('construction.ndjson');
const conservation = rows('conservation.ndjson');
const orgById = new Map(organizations.map((row) => [row.organization_id, row]));
const sourceIds = new Set(sources.map((row) => row.source_id));
const claimById = new Map(claims.map((row) => [row.claim_id, row]));
const equipmentById = new Map(equipment.map((row) => [row.equipment_type_id, row]));
const inventoryById = new Map(inventory.map((row) => [row.inventory_record_id, row]));
const deploymentById = new Map(deployments.map((row) => [row.deployment_id, row]));
const maintenanceById = new Map(maintenance.map((row) => [row.maintenance_record_id, row]));
const conservationById = new Map(conservation.map((row) => [row.conservation_record_id, row]));
const platformById = new Map(platforms.map((row) => [row.platform_id, row]));
const sameQuantity = (a, b) => JSON.stringify(a) === JSON.stringify(b);

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

for (const claim of claims) {
  for (const sourceId of claim.source_ids) if (!sourceIds.has(sourceId)) fail(`claim ${claim.claim_id} references missing source ${sourceId}`);
  if (claim.as_of && Date.parse(claim.as_of) > Date.parse(asOf)) {
    const projectionOnly = String(claim.predicate).includes('projected_') && String(claim.simulation_use).toLowerCase().includes('projection');
    if (!projectionOnly) fail(`post-bookmark claim ${claim.claim_id} is not quarantined as projection only`);
  }
}
for (const contradiction of contradictions) {
  for (const claimId of contradiction.claim_ids) if (!claimById.has(claimId)) fail(`contradiction ${contradiction.contradiction_set_id} references missing claim ${claimId}`);
  for (const sourceId of contradiction.source_ids) if (!sourceIds.has(sourceId)) fail(`contradiction ${contradiction.contradiction_set_id} references missing source ${sourceId}`);
}

for (const pool of inventory) {
  if (!equipmentById.has(pool.equipment_type_id)) fail(`${pool.inventory_record_id} has no equipment taxonomy`);
  if (!orgById.has(pool.organization_id)) fail(`${pool.inventory_record_id} has no controlling organization`);
  if (pool.quantity.kind === 'exact' && pool.quantity.value === 0) fail(`${pool.inventory_record_id} converts unknown capacity into zero`);
  const deployment = deploymentById.get(pool.current_deployment_id);
  if (!deployment || deployment.entity_type !== 'inventory_pool' || deployment.entity_id !== pool.inventory_record_id) fail(`${pool.inventory_record_id} has no conserved national accounting deployment`);
  else {
    if (!sameQuantity(pool.quantity, deployment.quantity)) fail(`${deployment.deployment_id} quantity differs from national pool`);
    if (deployment.location.location_status !== 'unknown' || deployment.movement.state !== 'unknown') fail(`${deployment.deployment_id} asserts a present location or movement`);
    if (!deployment.commitment.release_constraints.some((value) => value.includes('conserved child allocation'))) fail(`${deployment.deployment_id} permits anonymous national capacity`);
  }
  const maintenanceRecord = maintenanceById.get(pool.maintenance.maintenance_record_ids[0]);
  if (!maintenanceRecord || maintenanceRecord.subject_id !== pool.inventory_record_id || maintenanceRecord.state !== 'unknown') fail(`${pool.inventory_record_id} lacks explicit unknown maintenance accounting`);
  const conservationRecord = conservationById.get(pool.conservation_record_id);
  if (!conservationRecord || conservationRecord.scope.scope_id !== pool.inventory_record_id || !sameQuantity(conservationRecord.opening_inventory, pool.quantity) || !sameQuantity(conservationRecord.closing_states[0]?.quantity, pool.quantity)) fail(`${pool.inventory_record_id} lacks a balanced or explicitly blocked conservation identity`);
  for (const claimId of pool.provenance.claim_ids) if (!claimById.has(claimId)) fail(`${pool.inventory_record_id} references missing claim ${claimId}`);
  for (const platformId of pool.individual_platform_ids) if (!platformById.has(platformId)) fail(`${pool.inventory_record_id} references missing platform ${platformId}`);
}
for (const deployment of deployments) if (!inventoryById.has(deployment.entity_id)) fail(`${deployment.deployment_id} has no national inventory pool`);
for (const record of construction) {
  for (const sourceId of record.provenance.source_ids) if (!sourceIds.has(sourceId)) fail(`${record.construction_record_id} references missing source ${sourceId}`);
  if (record.platform_id && !platformById.has(record.platform_id)) fail(`${record.construction_record_id} references missing platform ${record.platform_id}`);
}

const projectedBattleForce = claimById.get('claim_chn_plan_battle_force_projection_395');
const battleForcePool = inventoryById.get('inventory_chn_plan_battle_force');
if (!projectedBattleForce || projectedBattleForce.value !== 395) fail('PLAN 2025 battle-force projection claim is missing or corrupted');
if (!battleForcePool || battleForcePool.quantity.kind !== 'unknown') fail('PLAN 2025 projection must not become opening inventory');
const rocketLaunchers = claimById.get('claim_chn_plarf_launcher_estimate_mid2024');
const rocketMissiles = claimById.get('claim_chn_plarf_missile_estimate_mid2024');
if (!rocketLaunchers || Object.values(rocketLaunchers.value).reduce((sum, value) => sum + value, 0) !== 1500) fail('PLARF launcher estimate categories do not reconcile to 1,500');
if (!rocketMissiles || Object.values(rocketMissiles.value).reduce((sum, value) => sum + value, 0) !== 3500) fail('PLARF missile estimate categories do not reconcile to 3,500');
if (inventoryById.get('inventory_chn_rocket_launcher')?.quantity.kind !== 'unknown' || inventoryById.get('inventory_chn_rocket_munition')?.quantity.kind !== 'unknown') fail('dated PLARF estimates must remain claims rather than opening totals');

const conversion = inventoryById.get('inventory_chn_civilian_transport_conversion');
const conversionDeployment = deploymentById.get('deployment_chn_civilian_transport_conversion_national_accounting');
if (!conversion || conversion.quantity.kind !== 'unknown') fail('civilian transport conversion capacity must remain unknown');
if (!conversionDeployment || !conversionDeployment.commitment.release_constraints.some((value) => value.includes('economic opportunity cost')) || !conversionDeployment.commitment.release_constraints.some((value) => value.includes('lawful mobilization'))) fail('civilian conversion requires explicit authority, lead time, and economic opportunity cost');

for (const platform of platforms) {
  if (platform.current_deployment_id !== null || platform.home_basing.location_kind !== 'unknown' || platform.home_basing.location_id !== null) fail(`${platform.platform_id} asserts current basing or deployment`);
  if (!inventoryById.get('inventory_chn_plan_aircraft_carrier')?.individual_platform_ids.includes(platform.platform_id)) fail(`${platform.platform_id} is not reconciled to the carrier pool`);
}

if (manifest.status !== 'collecting' || manifest.acceptance.research_complete || manifest.acceptance.decision_usable || manifest.acceptance.simulation_ready) fail('China national packet must remain collecting and non-executable');
const report = {status: errors.length ? 'FAIL' : 'PASS', packet: manifest.force_ledger_id, command_records: {organizations: organizations.length, relationships: relationships.length, strategic_arms: strategicArms.length, cmc_organs: cmcOrgans.length, theater_components: theaterComponents.length}, inventory_records: {equipment:equipment.length,platforms:platforms.length,inventory:inventory.length,deployments:deployments.length,maintenance:maintenance.length,construction:construction.length,conservation:conservation.length,claims:claims.length,contradictions:contradictions.length}, errors};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
