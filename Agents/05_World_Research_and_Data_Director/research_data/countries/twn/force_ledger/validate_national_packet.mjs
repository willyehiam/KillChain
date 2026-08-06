#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const defaultRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] ?? defaultRoot);
const bookmark = '2025-09-01T00:00:00Z';
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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const requiredCommands = [
  'organization_twn_joint_operations_command_center',
  'organization_twn_army_theater_operations_centers_aggregate',
  'organization_twn_army_numbered_army_commands_aggregate',
  'organization_twn_army_defense_commands_aggregate',
  'organization_twn_navy_fleet_command',
  'organization_twn_navy_marine_corps_command',
  'organization_twn_air_force_air_combat_command',
  'organization_twn_air_force_air_defense_and_missile_command',
];
for (const id of requiredCommands) if (!orgById.has(id)) fail(`missing required Taiwan command ${id}`);
for (const relationship of relationships) {
  if (!orgById.has(relationship.source_organization_id) || !orgById.has(relationship.target_organization_id)) fail(`orphan command relationship ${relationship.relationship_id}`);
  if (relationship.relationship_type === 'organize_train_equip' && relationship.authority_scope.may_release_for_mission) fail(`${relationship.relationship_id} improperly lets a generating command release an operational mission`);
}
const operationalTargets = [
  'organization_twn_army_theater_operations_centers_aggregate',
  'organization_twn_navy_fleet_command',
  'organization_twn_air_force_air_combat_command',
];
for (const target of operationalTargets) {
  const relation = relationships.find((row) => row.target_organization_id === target && row.relationship_type === 'operational_control' && row.activation_state === 'active' && row.authority_scope.may_release_for_mission);
  if (!relation) fail(`${target} lacks an active JOCC operational release path`);
}

for (const source of sources) {
  if (source.published_at && Date.parse(source.published_at) > Date.parse(bookmark)) fail(`post-bookmark source ${source.source_id} cannot establish opening truth`);
  if (!source.published_at && (!source.observed_from || !source.observed_to || Date.parse(source.observed_to) > Date.parse(bookmark))) fail(`mutable source ${source.source_id} lacks a bookmark-bounded observation interval`);
}
for (const claim of claims) {
  for (const sourceId of claim.source_ids) if (!sourceIds.has(sourceId)) fail(`claim ${claim.claim_id} references missing source ${sourceId}`);
  if (Date.parse(claim.as_of) > Date.parse(bookmark)) fail(`post-bookmark claim ${claim.claim_id} cannot establish opening truth`);
}
for (const contradiction of contradictions) {
  for (const claimId of contradiction.claim_ids) if (!claimById.has(claimId)) fail(`contradiction ${contradiction.contradiction_set_id} references missing claim ${claimId}`);
  for (const sourceId of contradiction.source_ids) if (!sourceIds.has(sourceId)) fail(`contradiction ${contradiction.contradiction_set_id} references missing source ${sourceId}`);
}

for (const pool of inventory) {
  const taxonomy = equipmentById.get(pool.equipment_type_id);
  if (!taxonomy) fail(`${pool.inventory_record_id} has no equipment taxonomy`);
  else if (taxonomy.counting_unit !== pool.quantity.unit) fail(`${pool.inventory_record_id} counting unit differs from its taxonomy`);
  if (!orgById.has(pool.organization_id)) fail(`${pool.inventory_record_id} has no controlling organization`);
  if (pool.quantity.kind !== 'unknown' || pool.accounting_state !== 'unknown') fail(`${pool.inventory_record_id} improperly promotes a dated estimate into opening inventory`);
  if (pool.location_id !== null || pool.readiness.band !== 'unknown' || pool.readiness.ready_quantity.kind !== 'unknown') fail(`${pool.inventory_record_id} asserts location or readiness`);
  const deployment = deploymentById.get(pool.current_deployment_id);
  if (!deployment || deployment.entity_id !== pool.inventory_record_id) fail(`${pool.inventory_record_id} has no national accounting deployment`);
  else {
    if (!same(deployment.quantity, pool.quantity)) fail(`${deployment.deployment_id} quantity differs from national pool`);
    if (deployment.location.location_status !== 'unknown' || deployment.movement.state !== 'unknown' || deployment.assignment !== 'unknown' || deployment.availability_state !== 'unknown') fail(`${deployment.deployment_id} asserts location, movement, assignment, or availability`);
    if (!deployment.commitment.release_constraints.some((value) => value.includes('conserved child allocation'))) fail(`${deployment.deployment_id} permits anonymous national capacity`);
  }
  const maintenanceRecord = maintenanceById.get(pool.maintenance.maintenance_record_ids[0]);
  if (!maintenanceRecord || maintenanceRecord.subject_id !== pool.inventory_record_id || maintenanceRecord.state !== 'unknown' || maintenanceRecord.quantity.kind !== 'unknown') fail(`${pool.inventory_record_id} lacks explicit unknown maintenance accounting`);
  const conservationRecord = conservationById.get(pool.conservation_record_id);
  if (!conservationRecord || conservationRecord.scope.scope_id !== pool.inventory_record_id || conservationRecord.result.state !== 'blocked_by_unknowns' || !same(conservationRecord.opening_inventory, pool.quantity) || !same(conservationRecord.closing_states[0]?.quantity, pool.quantity)) fail(`${pool.inventory_record_id} lacks explicitly blocked conservation`);
  for (const claimId of pool.provenance.claim_ids) if (!claimById.has(claimId)) fail(`${pool.inventory_record_id} references missing claim ${claimId}`);
}
for (const deployment of deployments) if (!inventoryById.has(deployment.entity_id)) fail(`${deployment.deployment_id} has no national inventory pool`);

const fighter350 = claimById.get('claim_twn_us_dod_2024_fighter_excluding_trainers_350');
const fighter400 = claimById.get('claim_twn_us_dod_2024_fighter_including_trainers_400');
const fighterIssue = contradictions.find((row) => row.contradiction_set_id === 'contradiction_twn_fighter_scope_2024');
if (fighter350?.value !== 350 || fighter400?.value !== 400 || !fighterIssue || !String(fighterIssue.simulation_rule).includes('Never sum')) fail('fighter 350 and 400 nested scopes are not explicitly protected from addition');
if (inventoryById.get('inventory_twn_fighter_trainer_subset')?.quantity.kind !== 'unknown') fail('derived fighter trainer difference must not become opening inventory');

for (const record of construction) {
  if (record.state !== 'planned' || record.quantity_ordered.kind !== 'unknown' || record.quantity_delivered.kind !== 'unknown' || record.quantity_accepted.kind !== 'unknown') fail(`${record.construction_record_id} improperly promotes a plan to ordered, delivered, or accepted`);
  for (const sourceId of record.provenance.source_ids) if (!sourceIds.has(sourceId)) fail(`${record.construction_record_id} references missing source ${sourceId}`);
}
for (const id of ['inventory_twn_tanker_aircraft','inventory_twn_rotary_wing_lift','inventory_twn_air_and_missile_defense','inventory_twn_munition_stockpile','inventory_twn_mobilization_capacity']) {
  if (inventoryById.get(id)?.quantity.kind !== 'unknown') fail(`${id} must remain an explicit unknown`);
}

const counts = {organization_records:organizations.length,relationship_records:relationships.length,equipment_type_records:equipment.length,inventory_records:inventory.length,deployment_records:deployments.length,maintenance_records:maintenance.length,construction_records:construction.length,conservation_records:conservation.length};
for (const [key, value] of Object.entries(counts)) if (manifest.reconciliation[key] !== value) fail(`manifest ${key} does not match generated records`);
if (manifest.status !== 'collecting' || manifest.acceptance.schema_valid !== true || manifest.acceptance.internally_consistent !== false || manifest.acceptance.research_complete || manifest.acceptance.decision_usable || manifest.acceptance.simulation_ready) fail('Taiwan national packet must remain collecting, unaccepted, and nonexecutable pending independent review');

const report = {status: errors.length ? 'FAIL' : 'PASS', packet: manifest.force_ledger_id, command_records:{organizations:organizations.length,relationships:relationships.length,required_commands:requiredCommands.length}, inventory_records:{equipment:equipment.length,inventory:inventory.length,deployments:deployments.length,maintenance:maintenance.length,construction:construction.length,conservation:conservation.length,claims:claims.length,contradictions:contradictions.length}, errors};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
