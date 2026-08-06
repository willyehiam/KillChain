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
const cohorts = rows('cohorts.ndjson');
const authorityClaims = rows('authority_claims.ndjson');
const aggregationSets = rows('aggregation_sets.ndjson');
const contradictions = rows('contradictions.ndjson');
const equipment = rows('equipment_types.ndjson');
const inventory = rows('inventory.ndjson');
const deployments = rows('deployments.ndjson');
const maintenance = rows('maintenance.ndjson');
const construction = rows('construction.ndjson');
const conservation = rows('conservation.ndjson');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const mapBy = (values, key) => new Map(values.map((row) => [row[key], row]));
const orgById = mapBy(organizations, 'organization_id');
const sourceById = mapBy(sources, 'source_id');
const claimById = mapBy(claims, 'claim_id');
const cohortById = mapBy(cohorts, 'cohort_id');
const equipmentById = mapBy(equipment, 'equipment_type_id');
const inventoryById = mapBy(inventory, 'inventory_record_id');
const deploymentById = mapBy(deployments, 'deployment_id');
const maintenanceById = mapBy(maintenance, 'maintenance_record_id');
const constructionById = mapBy(construction, 'construction_record_id');
const conservationById = mapBy(conservation, 'conservation_record_id');

const datasets = [
  ['organizations', organizations, 'organization_id'], ['relationships', relationships, 'relationship_id'],
  ['sources', sources, 'source_id'], ['claims', claims, 'claim_id'], ['cohorts', cohorts, 'cohort_id'],
  ['authority claims', authorityClaims, 'authority_claim_id'], ['aggregation sets', aggregationSets, 'aggregation_set_id'],
  ['contradictions', contradictions, 'contradiction_set_id'], ['equipment', equipment, 'equipment_type_id'],
  ['inventory', inventory, 'inventory_record_id'], ['deployments', deployments, 'deployment_id'],
  ['maintenance', maintenance, 'maintenance_record_id'], ['construction', construction, 'construction_record_id'],
  ['conservation', conservation, 'conservation_record_id'],
];
const globalIds = new Map();
for (const [name, values, key] of datasets) {
  const seen = new Set();
  for (const row of values) {
    const id = row[key];
    if (!id || seen.has(id)) fail(`${name} contains duplicate record ID ${id ?? 'missing'}`);
    seen.add(id);
    if (globalIds.has(id)) fail(`record ID ${id} is reused by ${globalIds.get(id)} and ${name}`);
    globalIds.set(id, name);
  }
}

const requiredCommands = [
  'organization_twn_joint_operations_command_center', 'organization_twn_army_theater_operations_centers_aggregate',
  'organization_twn_army_numbered_army_commands_aggregate', 'organization_twn_army_defense_commands_aggregate',
  'organization_twn_navy_fleet_command', 'organization_twn_navy_marine_corps_command',
  'organization_twn_air_force_air_combat_command', 'organization_twn_air_force_air_defense_and_missile_command',
];
for (const id of requiredCommands) if (!orgById.has(id)) fail(`missing required Taiwan command ${id}`);

const openingEvidenceRecords = [...organizations, ...relationships];
const quarantined = new Set();
const knownMutableSources = new Set(['src_force_twn_adma_history_2022', 'src_force_twn_oac_subordinate_agencies_2025']);
for (const source of sources) {
  if (!source.retrieved_at) fail(`source ${source.source_id} lacks retrieval metadata`);
  if (knownMutableSources.has(source.source_id) && source.mutability_class !== 'live_mutable') fail(`mutable source ${source.source_id} was reclassified without immutable snapshot proof`);
  if (source.published_at && Date.parse(source.published_at) > Date.parse(bookmark)) fail(`post-bookmark source ${source.source_id} cannot establish opening truth`);
  if (source.mutability_class === 'live_mutable') {
    if (source.bookmark_evidence_status !== 'quarantined_no_prebookmark_temporal_proof' || source.available_to_player_at_bookmark !== false) fail(`mutable source ${source.source_id} is not quarantined from opening truth`);
    if (source.observed_from || source.observed_to) fail(`mutable source ${source.source_id} fabricates a live observation interval`);
    if (!source.snapshot_uri && !source.source_sha256) quarantined.add(source.source_id);
  } else if (source.bookmark_evidence_status !== 'prebookmark_available' || source.available_to_player_at_bookmark !== true) fail(`immutable source ${source.source_id} lacks prebookmark availability state`);
}
for (const record of openingEvidenceRecords) for (const sourceId of record.provenance?.source_ids ?? []) {
  if (!sourceById.has(sourceId)) fail(`${record.organization_id ?? record.relationship_id} references missing source ${sourceId}`);
  if (quarantined.has(sourceId)) fail(`${record.organization_id ?? record.relationship_id} uses quarantined mutable source ${sourceId} for opening truth`);
}

const authorityByRelationship = new Map();
for (const claim of authorityClaims) {
  if (authorityByRelationship.has(claim.relationship_id)) fail(`relationship ${claim.relationship_id} has duplicate atomic authority claims`);
  authorityByRelationship.set(claim.relationship_id, claim);
  if (!relationships.some((row) => row.relationship_id === claim.relationship_id)) fail(`authority claim ${claim.authority_claim_id} has no relationship`);
  if (!orgById.has(claim.actor_organization_id) || !orgById.has(claim.target_organization_id)) fail(`authority claim ${claim.authority_claim_id} has an unknown actor or target`);
  if (!['administrative_control','operational_control','organize_train_equip','mobilization_authority','other','unknown'].includes(claim.authority_class)) fail(`authority claim ${claim.authority_claim_id} has unsupported authority class`);
  if (!['proved','conditional','unproved_nonexecutable'].includes(claim.release_semantics)) fail(`authority claim ${claim.authority_claim_id} lacks typed release semantics`);
  for (const power of Object.values(claim.powers ?? {})) if (!['proved','conditional','unknown','prohibited'].includes(power)) fail(`authority claim ${claim.authority_claim_id} has an invalid power state`);
  for (const sourceId of claim.source_ids ?? []) if (!sourceById.has(sourceId) || quarantined.has(sourceId)) fail(`authority claim ${claim.authority_claim_id} uses inadmissible source ${sourceId}`);
}
for (const relationship of relationships) {
  if (!orgById.has(relationship.source_organization_id) || !orgById.has(relationship.target_organization_id)) fail(`orphan command relationship ${relationship.relationship_id}`);
  const authority = authorityByRelationship.get(relationship.relationship_id);
  if (!authority) fail(`relationship ${relationship.relationship_id} lacks an atomic authority claim`);
  const asserted = relationship.authority_scope;
  if (asserted.may_issue_orders || asserted.may_reassign_forces || asserted.may_release_for_mission) fail(`${relationship.relationship_id} asserts executable authority without proved atomic authority`);
  if (relationship.relationship_type === 'administrative_control' && (asserted.may_reassign_forces || asserted.may_release_for_mission)) fail(`${relationship.relationship_id} promotes administrative control to operational release`);
  if (relationship.relationship_type === 'mobilization_authority' && relationship.activation_state === 'active' && asserted.may_release_for_mission) fail(`${relationship.relationship_id} asserts unconditional reserve employment`);
  if (authority && (authority.actor_organization_id !== relationship.source_organization_id || authority.target_organization_id !== relationship.target_organization_id || authority.authority_class !== relationship.relationship_type)) fail(`authority claim for ${relationship.relationship_id} does not match the typed relationship`);
}

const expectedEstimateContracts = new Map([
  ['claim_twn_us_dod_2024_ground_force_personnel_104000',['inventory_twn_ground_force_personnel',104000,'person']],
  ...[['army_corps',3,'formation'],['combined_arms_brigade',7,'formation'],['artillery_brigade',3,'formation'],['army_aviation_brigade',2,'formation'],['marine_brigade',2,'formation'],['tank',800,'equipment_item'],['artillery_piece',1100,'equipment_item'],['amphibious_assault_ship',1,'platform'],['destroyer',4,'platform'],['frigate',22,'platform'],['corvette',0,'platform'],['landing_and_amphibious_ship',51,'platform'],['attack_submarine',4,'platform'],['coastal_patrol_missile_craft',43,'platform'],['coast_guard_ship',170,'platform'],['fighter_excluding_trainers',350,'platform'],['fighter_including_trainers',400,'platform'],['bomber_attack_aircraft',0,'platform'],['transport_aircraft',50,'platform'],['special_mission_aircraft',20,'platform']].map(([slug,value,unit]) => [`claim_twn_us_dod_2024_${slug}_${value}`,[`inventory_twn_${slug}`,value,unit]]),
]);
for (const claim of claims) {
  for (const sourceId of claim.source_ids) if (!sourceById.has(sourceId)) fail(`claim ${claim.claim_id} references missing source ${sourceId}`);
  if (Date.parse(claim.as_of) > Date.parse(bookmark)) fail(`post-bookmark claim ${claim.claim_id} cannot establish opening truth`);
  if (!claim.measurement_kind || !claim.subject_kind || !claim.population_definition || !claim.observation_period || claim.opening_stock_eligible !== false) fail(`claim ${claim.claim_id} lacks executable measurement semantics`);
  const contract = expectedEstimateContracts.get(claim.claim_id);
  if (contract) {
    const [subjectId, value, unit] = contract;
    if (claim.subject_id !== subjectId || claim.value !== value || claim.unit !== unit) fail(`claim ${claim.claim_id} diverges from its accepted value, unit, or subject contract`);
    const pool = inventoryById.get(claim.subject_id);
    const taxonomy = pool && equipmentById.get(pool.equipment_type_id);
    if (claim.measurement_kind !== 'stock_estimate' || claim.subject_kind !== 'inventory_pool' || claim.unit !== taxonomy?.counting_unit) fail(`claim ${claim.claim_id} is incompatible with its inventory subject`);
    if (claim.component_scope !== 'all_components' || pool.component !== 'all_components') fail(`claim ${claim.claim_id} improperly promotes an all-component estimate to a narrower component`);
  } else if (claim.measurement_kind === 'cohort_flow') {
    if (claim.subject_kind !== 'cohort' || !cohortById.has(claim.subject_id)) fail(`claim ${claim.claim_id} attaches a flow to a stock or unrelated subject`);
  } else if (claim.measurement_kind === 'program_plan') {
    if (claim.subject_kind !== 'construction_program' || !constructionById.has(claim.subject_id)) fail(`claim ${claim.claim_id} attaches a plan to an unrelated subject`);
  }
}
for (const contradiction of contradictions) {
  for (const claimId of contradiction.claim_ids) if (!claimById.has(claimId)) fail(`contradiction ${contradiction.contradiction_set_id} references missing claim ${claimId}`);
  for (const sourceId of contradiction.source_ids) if (!sourceById.has(sourceId)) fail(`contradiction ${contradiction.contradiction_set_id} references missing source ${sourceId}`);
}

const groupBy = (values, key) => values.reduce((map, row) => {
  const value = typeof key === 'function' ? key(row) : row[key];
  return map.set(value, [...(map.get(value) ?? []), row]);
}, new Map());
const deploymentsByEntity = groupBy(deployments, 'entity_id');
const maintenanceBySubject = groupBy(maintenance, 'subject_id');
const conservationByScope = groupBy(conservation, (row) => row.scope.scope_id);
for (const pool of inventory) {
  const taxonomy = equipmentById.get(pool.equipment_type_id);
  if (!taxonomy) fail(`${pool.inventory_record_id} has no equipment taxonomy`);
  else if (taxonomy.counting_unit !== pool.quantity.unit) fail(`${pool.inventory_record_id} counting unit differs from its taxonomy`);
  if (!orgById.has(pool.organization_id)) fail(`${pool.inventory_record_id} has no controlling organization`);
  if (pool.quantity.kind !== 'unknown' || pool.accounting_state !== 'unknown') fail(`${pool.inventory_record_id} improperly promotes a dated estimate into opening inventory`);
  if (pool.location_id !== null || pool.readiness.band !== 'unknown' || pool.readiness.ready_quantity.kind !== 'unknown') fail(`${pool.inventory_record_id} asserts location or readiness`);
  if ((deploymentsByEntity.get(pool.inventory_record_id) ?? []).length !== 1) fail(`${pool.inventory_record_id} must have exactly one national accounting deployment`);
  if ((maintenanceBySubject.get(pool.inventory_record_id) ?? []).length !== 1) fail(`${pool.inventory_record_id} must have exactly one maintenance record`);
  if ((conservationByScope.get(pool.inventory_record_id) ?? []).length !== 1) fail(`${pool.inventory_record_id} must have exactly one conservation scope`);
  const deployment = deploymentById.get(pool.current_deployment_id);
  if (!deployment || deployment.entity_id !== pool.inventory_record_id) fail(`${pool.inventory_record_id} has no designated national accounting deployment`);
  else {
    if (!same(deployment.quantity, pool.quantity)) fail(`${deployment.deployment_id} quantity differs from national pool`);
    if (deployment.location.location_status !== 'unknown' || deployment.movement.state !== 'unknown' || deployment.assignment !== 'unknown' || deployment.availability_state !== 'unknown') fail(`${deployment.deployment_id} asserts location, movement, assignment, or availability`);
    const allocation = deployment.accounting_allocation;
    if (!allocation || allocation.conservation_record_id !== pool.conservation_record_id || allocation.executable_child_allocation_id !== null || allocation.release_gate !== 'blocked_unaccepted_packet') fail(`${deployment.deployment_id} lacks a typed blocked conservation allocation`);
    if (!same(deployment.commitment.release_constraints, ['Research-only national pool; no executable child allocation has been accepted.'])) fail(`${deployment.deployment_id} release constraint was altered; structured allocation remains authoritative`);
    if (deployment.commitment.commitment_kind !== 'unknown' || deployment.commitment.operation_or_event_id !== null) fail(`${deployment.deployment_id} is anonymously committed`);
  }
  const maintenanceRecord = maintenanceById.get(pool.maintenance.maintenance_record_ids[0]);
  if (!maintenanceRecord || maintenanceRecord.subject_id !== pool.inventory_record_id || maintenanceRecord.state !== 'unknown' || maintenanceRecord.quantity.kind !== 'unknown') fail(`${pool.inventory_record_id} lacks explicit unknown maintenance accounting`);
  else if (maintenanceRecord.quantity.unit !== pool.quantity.unit) fail(`${maintenanceRecord.maintenance_record_id} unit differs from its inventory pool`);
  const conservationRecord = conservationById.get(pool.conservation_record_id);
  if (!conservationRecord || conservationRecord.scope.scope_id !== pool.inventory_record_id || conservationRecord.result.state !== 'blocked_by_unknowns' || !same(conservationRecord.opening_inventory, pool.quantity) || !same(conservationRecord.closing_states[0]?.quantity, pool.quantity)) fail(`${pool.inventory_record_id} lacks explicitly blocked conservation`);
  else if (conservationRecord.counting_unit !== pool.quantity.unit) fail(`${conservationRecord.conservation_record_id} unit differs from its inventory pool`);
  for (const claimId of pool.provenance.claim_ids) {
    const claim = claimById.get(claimId);
    if (!claim || claim.subject_id !== pool.inventory_record_id || claim.measurement_kind !== 'stock_estimate') fail(`${pool.inventory_record_id} references a missing or non-stock claim ${claimId}`);
  }
}

for (const set of aggregationSets) {
  const parentInventory = inventoryById.get(set.parent_inventory_record_id);
  const parentEquipment = equipmentById.get(set.parent_equipment_type_id);
  const parentConservation = conservationById.get(set.parent_conservation_record_id);
  if (!parentInventory || !parentEquipment || !parentConservation) fail(`${set.aggregation_set_id} lacks a resolved parent graph`);
  if (set.raw_parent_child_sum_allowed !== false || !set.completeness_state || !set.residual_state) fail(`${set.aggregation_set_id} lacks explicit completeness or parent-sum protection`);
  if (new Set(set.child_inventory_record_ids).size !== set.child_inventory_record_ids.length) fail(`${set.aggregation_set_id} has duplicate siblings`);
  for (const childId of set.child_inventory_record_ids) {
    const child = inventoryById.get(childId);
    const childEquipment = child && equipmentById.get(child.equipment_type_id);
    const childConservation = child && conservationById.get(child.conservation_record_id);
    if (!child || child.counting_scope.parent_inventory_record_id !== parentInventory?.inventory_record_id) fail(`${set.aggregation_set_id} has a detached or missing inventory child ${childId}`);
    if (childEquipment?.parent_equipment_type_id !== parentEquipment?.equipment_type_id) fail(`${set.aggregation_set_id} equipment hierarchy is detached at ${childId}`);
    if (childConservation?.scope.parent_conservation_record_id !== parentConservation?.conservation_record_id) fail(`${set.aggregation_set_id} conservation hierarchy is detached at ${childId}`);
    const expectedSiblings = set.child_inventory_record_ids.filter((id) => id !== childId).sort();
    if (!same([...(child.counting_scope.mutually_exclusive_with ?? [])].sort(), expectedSiblings)) fail(`${set.aggregation_set_id} sibling set is incomplete at ${childId}`);
  }
}

const fighter350 = claimById.get('claim_twn_us_dod_2024_fighter_excluding_trainers_350');
const fighter400 = claimById.get('claim_twn_us_dod_2024_fighter_including_trainers_400');
const fighterIssue = contradictions.find((row) => row.contradiction_set_id === 'contradiction_twn_fighter_scope_2024');
if (fighter350?.value !== 350 || fighter400?.value !== 400 || !fighterIssue || !String(fighterIssue.simulation_rule).includes('Never sum')) fail('fighter 350 and 400 nested scopes are not explicitly protected from addition');
if (inventoryById.get('inventory_twn_fighter_trainer_subset')?.quantity.kind !== 'unknown') fail('derived fighter trainer difference must not become opening inventory');

for (const record of construction) {
  if (record.state !== 'planned' || record.quantity_ordered.kind !== 'unknown' || record.quantity_delivered.kind !== 'unknown' || record.quantity_accepted.kind !== 'unknown') fail(`${record.construction_record_id} improperly promotes a plan to ordered, delivered, or accepted`);
  for (const id of record.producer_ids) if (!orgById.has(id)) fail(`${record.construction_record_id} references unresolved producer ${id}`);
}

const forbiddenKeys = new Set(['coordinates','geometry','latitude','longitude','lat','lon','lng','mgrs','geohash','exact_location','route','current_position']);
function inspectHiddenState(value, trail = '') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const next = trail ? `${trail}.${key}` : key;
    if (forbiddenKeys.has(key.toLowerCase()) && child !== null && child !== undefined) fail(`${next} contains forbidden hidden location or movement state`);
    inspectHiddenState(child, next);
  }
}
for (const [name, values] of datasets.filter(([name]) => !['sources'].includes(name))) for (const row of values) inspectHiddenState(row, name);
for (const org of organizations) if (org.headquarters_location_id !== null || org.readiness.state !== 'unknown') fail(`${org.organization_id} asserts hidden location or readiness state`);

const duplicateExtras = (values) => values.length - new Set(values).size;
const allTemporalRecords = [...organizations, ...relationships, ...equipment, ...inventory, ...deployments, ...maintenance, ...construction, ...conservation, ...claims, ...authorityClaims];
const derived = {
  organization_records: organizations.length, relationship_records: relationships.length, platform_records: 0,
  equipment_type_records: equipment.length, inventory_records: inventory.length, deployment_records: deployments.length,
  maintenance_records: maintenance.length, construction_records: construction.length, conservation_records: conservation.length,
  exact_quantity_records: inventory.filter((row) => row.quantity.kind === 'exact').length,
  range_quantity_records: inventory.filter((row) => row.quantity.kind === 'range').length,
  unknown_quantity_records: inventory.filter((row) => row.quantity.kind === 'unknown').length,
  open_conservation_exceptions: conservation.filter((row) => row.result.state !== 'balanced').length,
  double_booking_exceptions: duplicateExtras(deployments.map((row) => row.entity_id)) + duplicateExtras(maintenance.map((row) => row.subject_id)) + duplicateExtras(conservation.map((row) => row.scope.scope_id)),
  orphan_platform_records: 0,
  orphan_organization_records: organizations.filter((row) => !row.relationship_record_ids.length).length,
  expired_records: allTemporalRecords.filter((row) => {
    const validTo = row.temporal_validity?.valid_to;
    const reviewAfter = row.temporal_validity?.review_after ?? row.review_after;
    return (validTo && Date.parse(validTo) <= Date.parse(bookmark)) || (reviewAfter && Date.parse(reviewAfter) <= Date.parse(bookmark));
  }).length,
};
for (const [key, value] of Object.entries(derived)) if (manifest.reconciliation[key] !== value) fail(`manifest ${key} does not match derived value ${value}`);
if (manifest.reconciliation.state !== 'blocked_by_unknowns') fail('manifest reconciliation state must remain blocked_by_unknowns');
for (const [key, file] of Object.entries({claims:'claims.ndjson',cohorts:'cohorts.ndjson',authority_claims:'authority_claims.ndjson',aggregation_sets:'aggregation_sets.ndjson'})) if (manifest.dataset_paths[key] !== file) fail(`manifest does not enumerate ${key}`);
if (manifest.status !== 'collecting' || manifest.acceptance.schema_valid !== true || manifest.acceptance.internally_consistent !== false || manifest.acceptance.research_complete || manifest.acceptance.decision_usable || manifest.acceptance.simulation_ready) fail('Taiwan national packet must remain collecting, unaccepted, and nonexecutable pending independent review');

const report = {status: errors.length ? 'FAIL' : 'PASS', packet: manifest.force_ledger_id, blocker_contract:'B01-B07', records:{organizations:organizations.length,relationships:relationships.length,authority_claims:authorityClaims.length,equipment:equipment.length,inventory:inventory.length,deployments:deployments.length,maintenance:maintenance.length,construction:construction.length,conservation:conservation.length,claims:claims.length,cohorts:cohorts.length,aggregation_sets:aggregationSets.length}, derived_reconciliation:derived, errors};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
