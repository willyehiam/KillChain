#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] ?? defaultRoot);
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const readRows = (name) => fs.readFileSync(path.join(root, name), 'utf8').split(/\r?\n/).filter((line) => line.trim()).map(JSON.parse);
const by = (rows, key) => new Map(rows.map((row) => [row[key], row]));
const sameQuantity = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const bookmark = new Date('2025-09-01T00:00:00Z');

const manifest = readJson('manifest.json');
const organizations = readRows('organizations.ndjson');
const relationships = readRows('relationships.ndjson');
const equipment = readRows('equipment_types.ndjson');
const inventory = readRows('inventory.ndjson');
const deployments = readRows('deployments.ndjson');
const maintenance = readRows('maintenance.ndjson');
const construction = readRows('construction.ndjson');
const conservation = readRows('conservation.ndjson');
const sources = readRows('sources.ndjson');
const claims = readRows('claims.ndjson');
const contradictions = readRows('contradictions.ndjson');
const trainingPlans = readJson('training_plans.json');
const guardStateMachine = readJson('guard_status_state_machine.json');

const organizationById = by(organizations, 'organization_id');
const inventoryById = by(inventory, 'inventory_record_id');
const conservationById = by(conservation, 'conservation_record_id');
const sourceById = by(sources, 'source_id');
const claimById = by(claims, 'claim_id');
const sourceIds = new Set(sourceById.keys());
const claimIds = new Set(claimById.keys());

for (const id of ['organization_usa_secretary_of_defense_office','organization_usa_national_guard_bureau','organization_usa_governors_guard_authority','organization_usa_state_and_territorial_joint_force_headquarters','organization_usa_state_adjutants_general','organization_usa_dual_status_commanders_pool']) {
  if (!organizationById.has(id)) fail(`missing required command or Guard authority ${id}`);
}

const activeOperational = relationships.filter((row) => row.relationship_type === 'operational_control' && row.activation_state === 'active');
if (!activeOperational.some((row) => row.source_organization_id === 'organization_usa_president_commander_in_chief' && row.target_organization_id === 'organization_usa_secretary_of_defense_office')) fail('operational chain omits President to Secretary of Defense');
if (activeOperational.some((row) => row.source_organization_id === 'organization_usa_department_of_defense' && row.target_organization_id.endsWith('_command'))) fail('Department institution improperly replaces the Secretary in the operational chain');
for (const id of ['africa','central','cyber','european','indo_pacific','northern','southern','space','special_operations','strategic','transportation']) if (!activeOperational.some((row) => row.source_organization_id === 'organization_usa_secretary_of_defense_office' && row.target_organization_id === `organization_usa_${id}_command`)) fail(`Secretary of Defense operational edge missing for ${id} command`);
for (const id of ['cyber','special_operations','strategic','transportation']) if (organizationById.get(`organization_usa_${id}_command`)?.echelon !== 'functional_command') fail(`${id} command must be classified as functional_command`);
for (const id of ['africa','central','european','indo_pacific','northern','southern','space']) if (organizationById.get(`organization_usa_${id}_command`)?.echelon !== 'theater_command') fail(`${id} command must be classified as theater_command`);

const guardTargets = ['organization_usa_army_national_guard','organization_usa_air_national_guard'];
const stateEdges = relationships.filter((row) => row.relationship_type === 'state_control');
for (const target of guardTargets) {
  const stateEdge = stateEdges.find((row) => row.source_organization_id === 'organization_usa_state_and_territorial_joint_force_headquarters' && row.target_organization_id === target);
  if (!stateEdge) fail(`${target} state chain is missing`);
  else if (stateEdge.activation_state !== 'conditional') fail(`${target} state control must be conditional on an exclusive runtime status`);
  const guardCall = relationships.find((row) => row.target_organization_id === target && row.relationship_type === 'federal_activation' && row.provenance.source_ids.includes('src_force_usa_title10_section12406_2024'));
  if (!guardCall || guardCall.activation_state !== 'conditional') fail(`${target} lacks a predicate-bound 10 U.S.C. 12406 activation route`);
}
if (relationships.some((row) => row.source_organization_id === 'organization_usa_national_guard_bureau' && row.relationship_type === 'operational_control')) fail('National Guard Bureau may not collapse state Guard operational control into one federal chain');
for (const relationship of relationships) {
  const identityOnly = relationship.provenance?.source_ids?.includes('src_force_usa_title10_section10101_2023');
  if (identityOnly && ['mobilization_authority','federal_activation'].includes(relationship.relationship_type)) fail(`reserve identity statute cannot prove activation authority: ${relationship.relationship_id}`);
  if (identityOnly && (relationship.authority_scope.may_issue_orders || relationship.authority_scope.may_reassign_forces || relationship.authority_scope.may_release_for_mission)) fail(`reserve identity edge asserts operational powers: ${relationship.relationship_id}`);
  if (relationship.relationship_type === 'federal_activation' && relationship.provenance.source_ids.every((id) => id === 'src_force_usa_title10_section12401_2024')) fail(`status statute cannot be the sole activation authority: ${relationship.relationship_id}`);
}
const requiredGuardStates = ['state_active_duty','title_32','title_10'];
if (guardStateMachine.executable !== false || guardStateMachine.initial_state !== 'unknown') fail('Guard state machine must remain non-executable with bookmark status unknown');
if (requiredGuardStates.some((id) => !guardStateMachine.states?.some((state) => state.state_id === id))) fail('Guard state machine omits a required duty status');
if ((guardStateMachine.forbidden_combinations ?? []).length !== 3) fail('Guard state machine does not forbid all simultaneous incompatible duty statuses');
if (!guardStateMachine.partial_unit_rule?.includes('conserved child allocation')) fail('Guard partial-unit transition is not conservation bound');

const authorized = { organization_usa_army:442300, organization_usa_navy:332300, organization_usa_marine_corps:172300, organization_usa_air_force:320000, organization_usa_space_force:9800, organization_usa_army_national_guard:325000, organization_usa_army_reserve:175800, organization_usa_navy_reserve:57700, organization_usa_marine_corps_reserve:32500, organization_usa_air_national_guard:108300, organization_usa_air_force_reserve:67000, organization_usa_coast_guard_reserve:7000 };
for (const [id, expected] of Object.entries(authorized)) {
  const personnel = organizationById.get(id)?.personnel;
  if (personnel?.authorized?.kind !== 'exact' || personnel.authorized.value !== expected || personnel.authorized.unit !== 'person') fail(`${id} authorized end strength is not conserved at ${expected}`);
  if (personnel?.assigned?.kind !== 'unknown') fail(`${id} illegally fabricates assigned strength from authorization`);
  if (personnel?.deployable?.kind !== 'unknown') fail(`${id} illegally converts authorization into deployable strength`);
  const claim = claimById.get(`claim_usa_fy2025_authorized_end_strength_${id.replace('organization_usa_','')}`);
  if (claim?.value !== expected || claim.unit !== 'person') fail(`${id} authorized personnel claim diverges from the organization record`);
}

for (const deployment of deployments) {
  if (deployment.entity_type !== 'inventory_pool') fail(`anonymous or non-pool deployment is forbidden: ${deployment.deployment_id}`);
  const pool = inventoryById.get(deployment.entity_id);
  if (!pool) fail(`deployment ${deployment.deployment_id} has no national inventory pool`);
  else if (!sameQuantity(deployment.quantity, pool.quantity)) fail(`deployment ${deployment.deployment_id} does not conserve against ${pool.inventory_record_id}`);
  if (deployment.location?.geometry) fail(`deployment ${deployment.deployment_id} exposes geometry in the national packet`);
  if (deployment.movement?.route_id || deployment.movement?.origin_location_id || deployment.movement?.destination_location_id || !['unknown','stationary'].includes(deployment.movement?.state)) fail(`deployment ${deployment.deployment_id} exposes actionable movement`);
}
if (inventory.some((row) => row.inventory_record_id.includes('training_rotation')) || deployments.some((row) => row.entity_id.includes('training_rotation')) || maintenance.some((row) => row.subject_id.includes('training_rotation')) || conservation.some((row) => row.scope.scope_id.includes('training_rotation'))) fail('Army annual training plan is illegally promoted into opening force accounting');

for (const pool of inventory) {
  const record = conservationById.get(pool.conservation_record_id);
  if (!record) { fail(`inventory ${pool.inventory_record_id} lacks conservation`); continue; }
  if (record.scope.scope_id !== pool.inventory_record_id) fail(`conservation ${record.conservation_record_id} points at another pool`);
  if (record.counting_unit !== pool.quantity.unit || !sameQuantity(record.opening_inventory, pool.quantity)) fail(`conservation ${record.conservation_record_id} changes unit or opening quantity`);
  if (!record.closing_states.some((state) => state.inventory_record_ids.includes(pool.inventory_record_id) && sameQuantity(state.quantity, pool.quantity))) fail(`conservation ${record.conservation_record_id} does not close into its pool`);
  if (pool.quantity.kind === 'unknown' && record.result.state !== 'blocked_by_unknowns') fail(`unknown pool ${pool.inventory_record_id} must remain blocked by unknowns`);
  for (const sourceId of pool.provenance.source_ids ?? []) {
    const source = sourceById.get(sourceId);
    if (source?.published_at && new Date(source.published_at) > bookmark) fail(`opening inventory cites postbookmark source: ${pool.inventory_record_id}`);
    if (source?.bookmark_evidence_status === 'quarantined_no_prebookmark_temporal_proof') fail(`opening inventory cites quarantined mutable source: ${pool.inventory_record_id}`);
  }
}

const expectedAircraft = { bomber:139, fighter_attack:1933, rotorcraft:241, special_mission:359, mobility:1191, trainer:969 };
const aircraftParent = inventoryById.get('inventory_usa_air_force_aircraft_total_inventory');
if (aircraftParent?.quantity?.kind !== 'unknown' || aircraftParent?.component !== 'all_components') fail('USAF fiscal-year estimate is promoted to exact or active-component opening inventory');
let categoryClaimSum = 0;
for (const [slug, expected] of Object.entries(expectedAircraft)) {
  const record = inventoryById.get(`inventory_usa_air_force_${slug}`);
  if (!record || record.quantity.kind !== 'unknown' || record.component !== 'all_components') fail(`USAF ${slug} estimate is promoted to exact or active-component opening inventory`);
  if (record?.counting_scope?.parent_inventory_record_id !== 'inventory_usa_air_force_aircraft_total_inventory') fail(`USAF ${slug} structural parent link is missing`);
  const claim = claimById.get(`claim_usa_air_force_fy2025_${slug}_${expected}`);
  if (claim?.value !== expected || claim.unit !== 'platform' || !claim.predicate.includes('all_component')) fail(`USAF ${slug} fiscal-year estimate claim diverges from the accepted taxonomy`);
  categoryClaimSum += claim?.value ?? 0;
}
const aircraftParentClaim = claimById.get('claim_usa_air_force_total_aircraft_inventory_4832');
if (aircraftParentClaim?.value !== 4832 || aircraftParentClaim.unit !== 'platform' || !aircraftParentClaim.predicate.includes('all_component')) fail('USAF parent fiscal-year estimate claim diverges from 4,832 all-component taxonomy');
if (categoryClaimSum !== aircraftParentClaim?.value) fail('USAF mission category claims do not sum to the national parent estimate');
for (const slug of ['tanker_subset','airlift_subset']) if (inventoryById.get(`inventory_usa_air_force_${slug}`)?.quantity?.kind !== 'unknown') fail(`${slug} must remain unknown until a compatible split source is accepted`);

const navy = inventoryById.get('inventory_usa_navy_battle_force_ship');
if (navy?.quantity?.kind !== 'unknown') fail('Navy request and prior actual cannot form a bookmark opening range');
for (const id of ['claim_usa_navy_fy2025_requested_battle_force_287','claim_usa_navy_fy2024_actual_battle_force_296']) if (!claimById.get(id)?.simulation_use?.includes('not a bound')) fail(`Navy historical claim is mislabeled as an opening bound: ${id}`);

for (const row of maintenance) {
  const pool = inventoryById.get(row.subject_id);
  if (!pool) fail(`maintenance ${row.maintenance_record_id} has no inventory subject`);
  if (row.quantity?.kind !== 'unknown') fail(`maintenance quantity lacks independent source-bounded allocation: ${row.maintenance_record_id}`);
  if (pool && row.quantity?.unit !== pool.quantity?.unit) fail(`maintenance counting unit diverges from inventory: ${row.maintenance_record_id}`);
}
for (const row of construction) if (['completed','accepted','delivered'].includes(row.state) && !claims.some((claim) => claim.subject_id === row.construction_record_id && /accepted|delivered|completed/.test(claim.predicate))) fail(`construction completion lacks an acceptance claim: ${row.construction_record_id}`);
const armyTrainingPlan = trainingPlans.find((row) => row.plan_id === 'plan_usa_army_fy2025_combat_training_center_rotations');
if (!armyTrainingPlan || armyTrainingPlan.executable !== false || armyTrainingPlan.available?.kind !== 'unknown') fail('Army annual training plan is promoted to executable opening capacity');

for (const source of sources) if (source.mutability_class === 'live_mutable' && (source.bookmark_evidence_status !== 'quarantined_no_prebookmark_temporal_proof' || source.available_to_player_at_bookmark !== false || source.observed_from || source.observed_to)) fail(`mutable live source bypasses temporal quarantine: ${source.source_id}`);
for (const row of [...organizations,...relationships,...equipment]) for (const sourceId of row.provenance?.source_ids ?? []) if (sourceById.get(sourceId)?.bookmark_evidence_status === 'quarantined_no_prebookmark_temporal_proof') fail(`historical opening record cites quarantined mutable source: ${row.organization_id ?? row.relationship_id ?? row.equipment_type_id}`);
for (const claim of claims) {
  for (const sourceId of claim.source_ids ?? []) if (!sourceIds.has(sourceId)) fail(`claim ${claim.claim_id} cites unresolved local source ${sourceId}`);
  const postbookmark = (claim.source_ids ?? []).some((sourceId) => sourceById.get(sourceId)?.published_at && new Date(sourceById.get(sourceId).published_at) > bookmark);
  if (postbookmark && !/Historical|unavailable|Contradiction/.test(claim.simulation_use ?? '')) fail(`postbookmark claim leaks into opening knowledge: ${claim.claim_id}`);
}
for (const contradiction of contradictions) {
  if ((contradiction.claim_ids ?? []).some((claimId) => !claimIds.has(claimId))) fail(`contradiction ${contradiction.contradiction_set_id} cites unresolved claim`);
  if ((contradiction.source_ids ?? []).some((sourceId) => !sourceIds.has(sourceId))) fail(`contradiction ${contradiction.contradiction_set_id} cites unresolved source`);
}
for (const sourceId of sourceIds) if (!manifest.source_ids.includes(sourceId)) fail(`manifest omits local source ${sourceId}`);

const evaluationTime = new Date(`${manifest.reviewed_at}T23:59:59Z`);
const expiredCount = [...inventory,...deployments,...maintenance].filter((row) => row.temporal_validity?.review_after && new Date(row.temporal_validity.review_after) < evaluationTime).length;
if (manifest.reconciliation.expired_records !== expiredCount) fail(`manifest expired record count is false: expected ${expiredCount}`);
const expectedCounts = { organization_records:organizations.length, equipment_type_records:equipment.length, inventory_records:inventory.length, deployment_records:deployments.length, maintenance_records:maintenance.length, construction_records:construction.length, conservation_records:conservation.length, relationship_records:relationships.length, exact_quantity_records:inventory.filter((row)=>row.quantity.kind==='exact').length, range_quantity_records:inventory.filter((row)=>row.quantity.kind==='range').length, unknown_quantity_records:inventory.filter((row)=>row.quantity.kind==='unknown').length };
for (const [field, expected] of Object.entries(expectedCounts)) if (manifest.reconciliation[field] !== expected) fail(`manifest ${field} count is false: expected ${expected}`);
if (manifest.status !== 'collecting' || manifest.acceptance.internally_consistent || manifest.acceptance.research_complete || manifest.acceptance.decision_usable || manifest.acceptance.simulation_ready) fail('corrected packet must remain collecting, pending independent re-audit, and non-executable');

const report = { status: errors.length ? 'FAIL' : 'PASS', packet: manifest.force_ledger_id, records: { organizations:organizations.length, relationships:relationships.length, equipment:equipment.length, inventory:inventory.length, deployments:deployments.length, maintenance:maintenance.length, construction:construction.length, conservation:conservation.length, claims:claims.length, contradictions:contradictions.length, training_plans:trainingPlans.length }, errors };
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
