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

const manifest = readJson('manifest.json');
const organizations = readRows('organizations.ndjson');
const relationships = readRows('relationships.ndjson');
const inventory = readRows('inventory.ndjson');
const deployments = readRows('deployments.ndjson');
const conservation = readRows('conservation.ndjson');
const sources = readRows('sources.ndjson');
const claims = readRows('claims.ndjson');
const contradictions = readRows('contradictions.ndjson');

const organizationById = by(organizations, 'organization_id');
const relationshipById = by(relationships, 'relationship_id');
const inventoryById = by(inventory, 'inventory_record_id');
const conservationById = by(conservation, 'conservation_record_id');
const sourceIds = new Set(sources.map((row) => row.source_id));
const claimIds = new Set(claims.map((row) => row.claim_id));

for (const id of [
  'organization_usa_secretary_of_defense_office',
  'organization_usa_national_guard_bureau',
  'organization_usa_governors_guard_authority',
  'organization_usa_state_and_territorial_joint_force_headquarters',
  'organization_usa_state_adjutants_general',
  'organization_usa_dual_status_commanders_pool',
]) if (!organizationById.has(id)) fail(`missing required command or Guard authority ${id}`);

const activeOperational = relationships.filter((row) => row.relationship_type === 'operational_control' && row.activation_state === 'active');
if (!activeOperational.some((row) => row.source_organization_id === 'organization_usa_president_commander_in_chief' && row.target_organization_id === 'organization_usa_secretary_of_defense_office')) fail('operational chain omits President to Secretary of Defense');
if (activeOperational.some((row) => row.source_organization_id === 'organization_usa_department_of_defense' && row.target_organization_id.endsWith('_command'))) fail('Department institution improperly replaces the Secretary in the operational chain');
for (const id of ['africa','central','cyber','european','indo_pacific','northern','southern','space','special_operations','strategic','transportation']) if (!activeOperational.some((row) => row.source_organization_id === 'organization_usa_secretary_of_defense_office' && row.target_organization_id === `organization_usa_${id}_command`)) fail(`Secretary of Defense operational edge missing for ${id} command`);

for (const id of ['cyber','special_operations','strategic','transportation']) if (organizationById.get(`organization_usa_${id}_command`)?.echelon !== 'functional_command') fail(`${id} command must be classified as functional_command`);
for (const id of ['africa','central','european','indo_pacific','northern','southern','space']) if (organizationById.get(`organization_usa_${id}_command`)?.echelon !== 'theater_command') fail(`${id} command must be classified as theater_command`);

const stateEdges = relationships.filter((row) => row.relationship_type === 'state_control');
if (!stateEdges.some((row) => row.source_organization_id === 'organization_usa_state_and_territorial_joint_force_headquarters' && row.target_organization_id === 'organization_usa_army_national_guard')) fail('Army National Guard state chain is missing');
if (!stateEdges.some((row) => row.source_organization_id === 'organization_usa_state_and_territorial_joint_force_headquarters' && row.target_organization_id === 'organization_usa_air_national_guard')) fail('Air National Guard state chain is missing');
if (relationships.some((row) => row.source_organization_id === 'organization_usa_national_guard_bureau' && row.relationship_type === 'operational_control')) fail('National Guard Bureau may not collapse state Guard operational control into one federal chain');
for (const target of ['organization_usa_army_national_guard','organization_usa_air_national_guard']) {
  const activation = relationships.find((row) => row.target_organization_id === target && row.relationship_type === 'federal_activation');
  if (!activation || activation.activation_state !== 'conditional' || !activation.conditions.some((condition) => condition.includes('Title 10'))) fail(`${target} lacks a conditional Title 10 federal activation edge`);
}

const authorized = {
  organization_usa_army: 442300,
  organization_usa_navy: 332300,
  organization_usa_marine_corps: 172300,
  organization_usa_air_force: 320000,
  organization_usa_space_force: 9800,
  organization_usa_army_national_guard: 325000,
  organization_usa_army_reserve: 175800,
  organization_usa_navy_reserve: 57700,
  organization_usa_marine_corps_reserve: 32500,
  organization_usa_air_national_guard: 108300,
  organization_usa_air_force_reserve: 67000,
  organization_usa_coast_guard_reserve: 7000,
};
for (const [id, expected] of Object.entries(authorized)) {
  const actual = organizationById.get(id)?.personnel?.authorized;
  if (actual?.kind !== 'exact' || actual.value !== expected || actual.unit !== 'person') fail(`${id} authorized end strength is not conserved at ${expected}`);
  if (organizationById.get(id)?.personnel?.deployable?.kind !== 'unknown') fail(`${id} illegally converts authorization into deployable strength`);
}

for (const deployment of deployments) {
  if (deployment.entity_type !== 'inventory_pool') fail(`anonymous or non-pool deployment is forbidden: ${deployment.deployment_id}`);
  const pool = inventoryById.get(deployment.entity_id);
  if (!pool) fail(`deployment ${deployment.deployment_id} has no national inventory pool`);
  else if (!sameQuantity(deployment.quantity, pool.quantity)) fail(`deployment ${deployment.deployment_id} does not conserve against ${pool.inventory_record_id}`);
  if (deployment.location?.geometry) fail(`deployment ${deployment.deployment_id} exposes geometry in the national packet`);
  if (deployment.movement?.route_id || deployment.movement?.origin_location_id || deployment.movement?.destination_location_id || !['unknown','stationary'].includes(deployment.movement?.state)) fail(`deployment ${deployment.deployment_id} exposes actionable movement`);
}

for (const pool of inventory) {
  const record = conservationById.get(pool.conservation_record_id);
  if (!record) { fail(`inventory ${pool.inventory_record_id} lacks conservation`); continue; }
  if (record.scope.scope_id !== pool.inventory_record_id) fail(`conservation ${record.conservation_record_id} points at another pool`);
  if (record.counting_unit !== pool.quantity.unit || !sameQuantity(record.opening_inventory, pool.quantity)) fail(`conservation ${record.conservation_record_id} changes unit or opening quantity`);
  if (!record.closing_states.some((state) => state.inventory_record_ids.includes(pool.inventory_record_id) && sameQuantity(state.quantity, pool.quantity))) fail(`conservation ${record.conservation_record_id} does not close into its pool`);
  if (pool.quantity.kind === 'unknown' && record.result.state !== 'blocked_by_unknowns') fail(`unknown pool ${pool.inventory_record_id} must remain blocked by unknowns`);
}

const aircraftCategories = ['bomber','fighter_attack','rotorcraft','special_mission','mobility','trainer'].map((slug) => inventoryById.get(`inventory_usa_air_force_${slug}`));
const aircraftParent = inventoryById.get('inventory_usa_air_force_aircraft_total_inventory');
if (aircraftCategories.some((row) => !row || row.quantity.kind !== 'exact')) fail('USAF mission category reconciliation is incomplete');
else if (aircraftCategories.reduce((sum, row) => sum + row.quantity.value, 0) !== aircraftParent?.quantity?.value) fail('USAF mission categories do not sum to the national parent total');
for (const slug of ['tanker_subset','airlift_subset']) if (inventoryById.get(`inventory_usa_air_force_${slug}`)?.quantity?.kind !== 'unknown') fail(`${slug} must remain unknown until a compatible split source is accepted`);

for (const claim of claims) for (const sourceId of claim.source_ids ?? []) if (!sourceIds.has(sourceId)) fail(`claim ${claim.claim_id} cites unresolved local source ${sourceId}`);
for (const contradiction of contradictions) {
  if ((contradiction.claim_ids ?? []).some((claimId) => !claimIds.has(claimId))) fail(`contradiction ${contradiction.contradiction_set_id} cites unresolved claim`);
  if ((contradiction.source_ids ?? []).some((sourceId) => !sourceIds.has(sourceId))) fail(`contradiction ${contradiction.contradiction_set_id} cites unresolved source`);
}
for (const sourceId of sourceIds) if (!manifest.source_ids.includes(sourceId)) fail(`manifest omits local source ${sourceId}`);
if (manifest.status !== 'collecting' || manifest.acceptance.research_complete || manifest.acceptance.decision_usable || manifest.acceptance.simulation_ready) fail('incomplete national packet must remain collecting and non-executable');

const report = { status: errors.length ? 'FAIL' : 'PASS', packet: manifest.force_ledger_id, records: { organizations: organizations.length, relationships: relationships.length, inventory: inventory.length, deployments: deployments.length, conservation: conservation.length, claims: claims.length, contradictions: contradictions.length }, errors };
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
