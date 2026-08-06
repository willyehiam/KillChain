import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const openingCutoff = Date.parse('2025-09-01T00:00:00Z');
const idPattern = /^[a-z0-9_]+$/;
const sourceTiers = new Set(['A', 'B', 'C', 'D']);
const sourceTypes = new Set(['official_release', 'law_or_treaty', 'statistical_dataset', 'company_filing', 'news_report', 'research_report', 'academic_paper', 'map', 'imagery', 'video', 'social_post', 'database', 'other']);
const estimateStates = new Set(['point_estimate', 'bounded_estimate', 'bounded_unknown', 'not_applicable']);
const units = new Set([
  'teu_per_year','normalized_theater_flow_share','passengers_per_year','scenario_fuel_unit','scenario_power_fuel_unit','gigawatt_installed',
  'normalized_service_capacity','normalized_output_index','normalized_charterable_share','fraction','scenario_repair_work_unit','scenario_repair_work_unit_per_hour',
  'hour','scenario_cost_unit','fraction_per_hour','liquid_fuel_unit_per_hour','power_fuel_unit_per_hour','electric_power_unit_per_hour',
  'bandwidth_unit_per_hour','semiconductor_output_unit_per_hour','mixed_cargo_unit_per_hour','container_cargo_unit_per_hour','civil_airlift_unit_per_hour',
  'allied_airlift_unit_per_hour','commercial_sealift_unit_per_hour','weather_observation_unit_per_hour','optical_observation_unit_per_hour','pnt_service_unit_per_hour',
  'high_value_cargo_unit_per_hour','industrial_input_cargo_unit_per_hour','sustainment_cargo_unit_per_hour','air_access_permission_unit_per_hour',
  'commercial_access_permission_unit_per_hour','assistance_permission_unit_per_hour','scenario_attention_unit','scenario_political_cost'
]);
const intervals = new Set(['annual','scenario_tick','opening_state','hourly','damage_event','switch_event','update_cycle']);
const roles = new Set(['transfer','storage','service','production']);
const damageStates = new Set(['operational','degraded','disabled','destroyed','under_repair']);
const edgeKinds = new Set(['resource_transfer','permission_gate','information_service']);
const evidenceClasses = new Set(['source_supported','modeled_assumption']);
const permissionStates = new Set(['not_granted','conditional','existing_presence_scope_only','not_applicable']);
const unsafeKeyPattern = /^(?:lat|latitude|lon|lng|longitude|coord|coords|coordinate|coordinates|geometry|geom|bbox|boundingbox|position|centroid|center|centre|geohash|wkt|polyline|encodedgeometry|exactsite|exactlocation|address|mgrs)$/;
const wktPattern = /\b(?:POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON)\s*(?:Z|M|ZM)?\s*\(/i;
const coordinateStringPattern = /(?:^|\s|\[|\()[-+]?\d{1,3}\.\d{3,}\s*[,/]\s*[-+]?\d{1,3}\.\d{3,}(?:$|\s|\]|\))/;

function canonicalKey(key) {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
}

function readJson(root, name, errors) {
  try { return JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')); }
  catch (error) { errors.push(`${name}: ${error.message}`); return {}; }
}

function readNdjson(root, name, errors) {
  try {
    return fs.readFileSync(path.join(root, name), 'utf8').split(/\r?\n/).filter(Boolean).map((line, index) => {
      try { return JSON.parse(line); }
      catch (error) { errors.push(`${name} line ${index + 1}: ${error.message}`); return null; }
    }).filter(Boolean);
  } catch (error) { errors.push(`${name}: ${error.message}`); return []; }
}

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function walkForUnsafeGeometry(value, errors, at = '$') {
  if (typeof value === 'string') {
    if (wktPattern.test(value)) errors.push(`${at}: WKT geometry is forbidden`);
    if (coordinateStringPattern.test(value)) errors.push(`${at}: coordinate pair string is forbidden`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length >= 2 && value.length <= 4 && value.every(Number.isFinite) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90) {
      errors.push(`${at}: coordinate like numeric array is forbidden`);
    }
    value.forEach((item, index) => walkForUnsafeGeometry(item, errors, `${at}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (unsafeKeyPattern.test(canonicalKey(key))) errors.push(`${at}.${key}: exact or encoded location field is forbidden`);
    walkForUnsafeGeometry(child, errors, `${at}.${key}`);
  }
}

function validateEstimate(estimate, errors, at, expectedUnit = null) {
  if (!estimate || typeof estimate !== 'object' || Array.isArray(estimate)) {
    errors.push(`${at}: estimate object required`);
    return;
  }
  if (!estimateStates.has(estimate.state)) errors.push(`${at}: invalid estimate state ${estimate.state}`);
  if (!units.has(estimate.unit)) errors.push(`${at}: invalid capacity vocabulary or unit ${estimate.unit}`);
  if (expectedUnit && estimate.unit !== expectedUnit) errors.push(`${at}: expected unit ${expectedUnit}, found ${estimate.unit}`);
  if (estimate.interval !== undefined && !intervals.has(estimate.interval)) errors.push(`${at}: invalid interval ${estimate.interval}`);
  if (![estimate.minimum, estimate.maximum].every(Number.isFinite)) errors.push(`${at}: finite minimum and maximum required`);
  if (Number.isFinite(estimate.minimum) && Number.isFinite(estimate.maximum) && estimate.minimum > estimate.maximum) errors.push(`${at}: minimum exceeds maximum`);
  if (estimate.central !== null && !Number.isFinite(estimate.central)) errors.push(`${at}: central must be finite or null`);
  if (Number.isFinite(estimate.central) && (estimate.central < estimate.minimum || estimate.central > estimate.maximum)) errors.push(`${at}: central outside bounds`);
  if (estimate.state === 'point_estimate' && (estimate.central !== estimate.minimum || estimate.central !== estimate.maximum)) errors.push(`${at}: point estimate must have equal bounds`);
  if (estimate.state === 'bounded_unknown' && estimate.central !== null) errors.push(`${at}: bounded unknown central must be null`);
}

export function validateRegionalSystems(root = here) {
  const errors = [];
  const manifest = readJson(root, 'manifest.json', errors);
  const systemsDoc = readJson(root, 'regional_systems.json', errors);
  const depsDoc = readJson(root, 'dependencies.json', errors);
  const accessDoc = readJson(root, 'access_relationships.json', errors);
  const actionsDoc = readJson(root, 'actions.json', errors);
  const assumptionsDoc = readJson(root, 'modeled_assumptions.json', errors);
  const sources = readNdjson(root, 'sources.ndjson', errors);
  const systems = systemsDoc.systems ?? [];
  const edges = depsDoc.edges ?? [];
  const access = accessDoc.relationships ?? [];
  const actions = actionsDoc.actions ?? [];
  const assumptions = assumptionsDoc.assumptions ?? [];

  for (const [file, doc] of [['manifest.json',manifest],['regional_systems.json',systemsDoc],['dependencies.json',depsDoc],['access_relationships.json',accessDoc],['actions.json',actionsDoc],['modeled_assumptions.json',assumptionsDoc]]) {
    walkForUnsafeGeometry(doc, errors, file);
  }

  const sourceIds = new Set();
  for (const source of sources) {
    if (!source.source_id || !idPattern.test(source.source_id)) errors.push(`invalid source_id ${source.source_id}`);
    if (sourceIds.has(source.source_id)) errors.push(`duplicate source_id ${source.source_id}`);
    sourceIds.add(source.source_id);
    for (const field of ['title','publisher','url','accessed_at','published_at','available_at','last_updated_at','claim_snapshot','artifact_sha256','artifact_scope']) {
      if (!source[field]) errors.push(`${source.source_id}: missing provenance field ${field}`);
    }
    if (!sourceTiers.has(source.source_tier)) errors.push(`${source.source_id}: invalid source_tier`);
    if (!sourceTypes.has(source.source_type)) errors.push(`${source.source_id}: invalid source_type`);
    for (const field of ['published_at','available_at','last_updated_at']) {
      if (!validDate(source[field])) errors.push(`${source.source_id}: invalid ${field}`);
      else if (Date.parse(source[field]) > openingCutoff) errors.push(`${source.source_id}: ${field} leaks post bookmark knowledge`);
    }
    const expectedHash = crypto.createHash('sha256').update(source.claim_snapshot ?? '').digest('hex');
    if (source.artifact_sha256 !== expectedHash) errors.push(`${source.source_id}: frozen artifact hash mismatch`);
  }
  if (sourceIds.has('twrs_src_japan_ports_2024')) errors.push('post correction Japan port source is forbidden from opening truth');
  if (sourceIds.has('twrs_src_us_japan_treaty')) errors.push('draft Japan treaty source id is forbidden');
  if (!sourceIds.has('twrs_src_us_japan_treaty_final') || !sourceIds.has('twrs_src_us_japan_sofa_final')) errors.push('final Japan treaty and status agreement sources required');

  const assumptionIds = new Set();
  for (const assumption of assumptions) {
    if (!assumption.assumption_id || !idPattern.test(assumption.assumption_id)) errors.push(`invalid assumption_id ${assumption.assumption_id}`);
    if (assumptionIds.has(assumption.assumption_id)) errors.push(`duplicate assumption_id ${assumption.assumption_id}`);
    assumptionIds.add(assumption.assumption_id);
    if (assumption.status !== 'designed_not_observed' || !assumption.statement || !assumption.falsification_condition) errors.push(`${assumption.assumption_id}: incomplete modeled assumption`);
    if (!validDate(assumption.valid_from) || Date.parse(assumption.valid_from) > openingCutoff) errors.push(`${assumption.assumption_id}: invalid or post cutoff valid_from`);
  }

  const actionIds = new Set();
  for (const action of actions) {
    if (!action.action_id || !idPattern.test(action.action_id)) errors.push(`invalid action_id ${action.action_id}`);
    if (actionIds.has(action.action_id)) errors.push(`duplicate action_id ${action.action_id}`);
    actionIds.add(action.action_id);
    if (!action.required_inputs?.length || !action.preconditions?.length || !action.deterministic_transition?.length || !action.failure_transition) errors.push(`${action.action_id}: non executable action contract`);
    for (const [index, cost] of (action.costs ?? []).entries()) validateEstimate(cost.amount, errors, `${action.action_id}.costs[${index}].amount`);
  }

  const allIds = new Set();
  for (const [label, records, key] of [['system',systems,'system_id'],['access',access,'relationship_id'],['dependency',edges,'edge_id']]) {
    for (const record of records) {
      const id = record[key];
      if (!id || !idPattern.test(id)) errors.push(`invalid ${label} id ${id}`);
      if (allIds.has(id)) errors.push(`duplicate record id ${id}`);
      allIds.add(id);
      if (!validDate(record.observed_at) || Date.parse(record.observed_at) > openingCutoff) errors.push(`${id}: missing, invalid, or post cutoff observed_at`);
      for (const sourceId of record.source_ids ?? []) if (!sourceIds.has(sourceId)) errors.push(`${id}: unresolved source ${sourceId}`);
      for (const assumptionId of record.modeled_assumption_ids ?? []) if (!assumptionIds.has(assumptionId)) errors.push(`${id}: unresolved modeled assumption ${assumptionId}`);
      if (!(record.source_ids?.length || record.modeled_assumption_ids?.length)) errors.push(`${id}: source_ids or modeled_assumption_ids required`);
    }
  }

  const systemIds = new Set(systems.map(system => system.system_id));
  const accessIds = new Set(access.map(relationship => relationship.relationship_id));
  const endpointIds = new Set([...systemIds, ...accessIds]);
  const degree = new Map([...endpointIds].map(id => [id, 0]));

  for (const system of systems) {
    if (!['regional','national','theater','global'].includes(system.aggregation_level)) errors.push(`${system.system_id}: invalid aggregation_level`);
    if (!['aggregate_public','synthetic_region'].includes(system.sensitivity_treatment)) errors.push(`${system.system_id}: invalid sensitivity_treatment`);
    if (!['operational_candidate','research_only'].includes(system.execution_class)) errors.push(`${system.system_id}: execution_class required`);
    if (!system.capacity || Object.hasOwn(system.capacity, 'tier')) errors.push(`${system.system_id}: free text capacity vocabulary is forbidden`);
    validateEstimate(system.capacity?.measurement, errors, `${system.system_id}.capacity.measurement`);
    validateEstimate(system.capacity?.crisis_usable_fraction, errors, `${system.system_id}.capacity.crisis_usable_fraction`, 'fraction');
    if (!system.capacity?.evidence_basis) errors.push(`${system.system_id}: capacity evidence_basis required`);
    if (!system.resource_accounts?.length) errors.push(`${system.system_id}: resource account required`);
    for (const [index, account] of (system.resource_accounts ?? []).entries()) {
      if (!roles.has(account.role) || !account.resource_type || !account.account_id) errors.push(`${system.system_id}.resource_accounts[${index}]: invalid account semantics`);
      validateEstimate(account.opening_stock, errors, `${account.account_id}.opening_stock`);
      validateEstimate(account.flow_capacity, errors, `${account.account_id}.flow_capacity`);
      validateEstimate(account.demand_per_hour, errors, `${account.account_id}.demand_per_hour`);
      validateEstimate(account.utilization_fraction, errors, `${account.account_id}.utilization_fraction`, 'fraction');
      validateEstimate(account.loss_rate_per_hour, errors, `${account.account_id}.loss_rate_per_hour`, 'fraction_per_hour');
      if (account.allocation_priority !== 'player_or_policy_queue') errors.push(`${account.account_id}: invalid allocation priority`);
    }
    if (!damageStates.has(system.damage_and_repair?.opening_damage_state)) errors.push(`${system.system_id}: invalid damage state`);
    validateEstimate(system.damage_and_repair?.repair_work_required, errors, `${system.system_id}.repair_work_required`, 'scenario_repair_work_unit');
    validateEstimate(system.damage_and_repair?.repair_capacity_available, errors, `${system.system_id}.repair_capacity_available`, 'scenario_repair_work_unit_per_hour');
    if (!Array.isArray(system.decisions_enabled) || !system.decisions_enabled.length) errors.push(`${system.system_id}: action ids required`);
    for (const actionId of system.decisions_enabled ?? []) if (!actionIds.has(actionId)) errors.push(`${system.system_id}: unresolved action ${actionId}`);
  }

  for (const relationship of access) {
    if (!relationship.relationship_kind || !relationship.permission_model) errors.push(`${relationship.relationship_id}: permission model required`);
    const model = relationship.permission_model;
    if (!Array.isArray(model.state_machine?.states) || model.state_machine.states.join('|') !== 'not_requested|consultation|approved_limited|approved_full|suspended|revoked') errors.push(`${relationship.relationship_id}: invalid permission states`);
    if (!model.state_machine?.approving_authorities?.length) errors.push(`${relationship.relationship_id}: approving authorities required`);
    validateEstimate(model.state_machine?.lead_time_hours, errors, `${relationship.relationship_id}.lead_time_hours`, 'hour');
    validateEstimate(model.state_machine?.duration_hours, errors, `${relationship.relationship_id}.duration_hours`, 'hour');
    validateEstimate(model.state_machine?.capacity_grant_fraction, errors, `${relationship.relationship_id}.capacity_grant_fraction`, 'fraction');
    validateEstimate(model.state_machine?.political_cost, errors, `${relationship.relationship_id}.political_cost`, 'scenario_political_cost');
    for (const [mission, permission] of Object.entries(model.mission_permissions ?? {})) if (!permissionStates.has(permission)) errors.push(`${relationship.relationship_id}.${mission}: invalid mission permission ${permission}`);
    for (const legalSourceId of model.legal_source_ids ?? []) if (!sourceIds.has(legalSourceId)) errors.push(`${relationship.relationship_id}: unresolved legal source ${legalSourceId}`);
    for (const actionId of relationship.decisions_enabled ?? []) if (!actionIds.has(actionId)) errors.push(`${relationship.relationship_id}: unresolved action ${actionId}`);
  }

  for (const edge of edges) {
    if (!endpointIds.has(edge.from) || !endpointIds.has(edge.to)) errors.push(`${edge.edge_id}: unresolved endpoint ${edge.from} to ${edge.to}`);
    if (edge.from === edge.to) errors.push(`${edge.edge_id}: dependency self loop forbidden`);
    if (!edgeKinds.has(edge.edge_kind)) errors.push(`${edge.edge_id}: invalid edge_kind`);
    if (!evidenceClasses.has(edge.evidence_class)) errors.push(`${edge.edge_id}: invalid evidence_class`);
    if (edge.evidence_class === 'source_supported' && !edge.source_ids?.length) errors.push(`${edge.edge_id}: source supported edge requires sources`);
    if (edge.evidence_class === 'modeled_assumption' && !edge.modeled_assumption_ids?.length) errors.push(`${edge.edge_id}: modeled edge requires assumption`);
    for (const field of ['transfer_limit','transfer_coefficient','activation_threshold_fraction','lag_hours','loss_fraction']) validateEstimate(edge[field], errors, `${edge.edge_id}.${field}`);
    if (accessIds.has(edge.to)) errors.push(`${edge.edge_id}: permission relationship cannot be a dependent output`);
    if (edge.edge_kind === 'permission_gate' && !accessIds.has(edge.from)) errors.push(`${edge.edge_id}: permission gate must originate at access relationship`);
    if (endpointIds.has(edge.from)) degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
    if (endpointIds.has(edge.to)) degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
  }

  for (const system of systems) if (system.execution_class === 'operational_candidate' && degree.get(system.system_id) === 0) errors.push(`${system.system_id}: disconnected operational node`);
  for (const relationship of access) if (degree.get(relationship.relationship_id) === 0) errors.push(`${relationship.relationship_id}: decorative disconnected access relationship`);

  const bySystemId = new Map(systems.map(system => [system.system_id, system]));
  const southPort = bySystemId.get('twrs_port_taiwan_south');
  if (southPort?.capacity?.measurement?.state !== 'bounded_unknown' || southPort.capacity.measurement.maximum !== 13930000 || !southPort.capacity.evidence_basis.includes('national_total_is_ceiling')) {
    errors.push('twrs_port_taiwan_south: national throughput may only bound, not assert, regional capacity');
  }
  const japanPort = bySystemId.get('twrs_port_japan_regional_depth');
  if (japanPort?.capacity?.measurement?.state !== 'bounded_unknown' || japanPort.source_ids?.length || !japanPort.modeled_assumption_ids?.includes('twrs_assumption_japan_onward_logistics')) {
    errors.push('twrs_port_japan_regional_depth: theater capacity must remain an explicit assumption bounded unknown');
  }
  for (const id of ['twrs_air_allied_access','twrs_sealift_commercial_pool']) {
    if (bySystemId.get(id)?.capacity?.measurement?.state !== 'bounded_unknown') errors.push(`${id}: unsupported capability must remain bounded unknown`);
  }
  for (const id of ['twrs_energy_taiwan_liquid_fuels','twrs_energy_taiwan_lng_coal']) {
    if (bySystemId.get(id)?.capacity?.measurement?.state !== 'bounded_unknown') errors.push(`${id}: policy floor cannot become opening capacity`);
  }
  const byAccessId = new Map(access.map(relationship => [relationship.relationship_id, relationship]));
  if (byAccessId.get('twrs_access_us_taiwan')?.relationship_kind !== 'assistance_and_taiwan_consent_framework_not_basing') errors.push('Taiwan Relations Act may not be represented as a basing relationship');
  if (!byAccessId.get('twrs_access_taiwan_commercial')?.modeled_assumption_ids?.includes('twrs_assumption_commercial_emergency_authority')) errors.push('commercial emergency direction authority must remain a modeled assumption until legally sourced');
  const sourceById = new Map(sources.map(source => [source.source_id, source]));
  if (sourceById.get('twrs_src_us_japan_treaty_final')?.url !== 'https://www.mofa.go.jp/na/st/page1we_000093.html') errors.push('Japan treaty must resolve to official signed final text');
  if (sourceById.get('twrs_src_us_japan_sofa_final')?.url !== 'https://www.mofa.go.jp/region/n-america/us/q%26a/ref/2.html') errors.push('Japan status agreement must resolve to official signed final text');

  const expected = manifest.record_counts ?? {};
  for (const [label, actual, wanted] of [['systems',systems.length,expected.systems],['dependency_edges',edges.length,expected.dependency_edges],['access_relationships',access.length,expected.access_relationships],['sources',sources.length,expected.sources],['actions',actions.length,expected.actions],['modeled_assumptions',assumptions.length,expected.modeled_assumptions]]) {
    if (actual !== wanted) errors.push(`${label} count ${actual} != manifest ${wanted}`);
  }
  if (manifest.simulation_readiness !== 'blocked_pending_calibration_and_agent_09_revalidation') errors.push('manifest must remain blocked from simulation ingestion');
  if (!manifest.correction_packets?.closed_by_contract?.includes('TWRS-C01') || !manifest.correction_packets.closed_by_contract.includes('TWRS-C02') || !manifest.correction_packets.closed_by_contract.includes('TWRS-C03')) errors.push('manifest correction packet status incomplete');

  return { ok: errors.length === 0, errors, counts: { systems: systems.length, dependency_edges: edges.length, access_relationships: access.length, sources: sources.length, actions: actions.length, modeled_assumptions: assumptions.length }, cutoff: '2025-09-01T00:00:00Z' };
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const rootArgument = process.argv[2] ? path.resolve(process.argv[2]) : here;
  const report = validateRegionalSystems(rootArgument);
  if (!report.ok) { console.error(report.errors.join('\n')); process.exit(1); }
  console.log(JSON.stringify(report, null, 2));
}
