import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, name), 'utf8'));
const writeJson = (name, value) => fs.writeFileSync(path.join(here, name), `${JSON.stringify(value, null, 2)}\n`);
const cutoff = '2025-09-01T00:00:00Z';

const point = (unit, value, interval = 'annual') => ({
  state: 'point_estimate', unit, minimum: value, central: value, maximum: value, interval
});
const unknown = (unit, minimum, maximum, interval = 'scenario_tick') => ({
  state: 'bounded_unknown', unit, minimum, central: null, maximum, interval
});
const notApplicable = unit => ({
  state: 'not_applicable', unit, minimum: 0, central: 0, maximum: 0, interval: 'scenario_tick'
});

const contracts = {
  twrs_port_taiwan_north: ['container_cargo', 'transfer', point('teu_per_year', 3090000), 'observed_commercial_throughput'],
  twrs_port_taiwan_central: ['container_cargo', 'transfer', point('teu_per_year', 1610000), 'observed_commercial_throughput'],
  twrs_port_taiwan_south: ['container_cargo', 'transfer', unknown('teu_per_year', 0, 13930000, 'annual'), 'national_total_is_ceiling_not_regional_measure'],
  twrs_port_china_fujian: ['mixed_cargo', 'transfer', unknown('normalized_theater_flow_share', 0, 1), 'regional_capacity_unresearched'],
  twrs_port_china_yangtze_delta: ['container_cargo', 'transfer', point('teu_per_year', 39300000), 'observed_commercial_throughput'],
  twrs_port_japan_regional_depth: ['mixed_cargo', 'transfer', unknown('normalized_theater_flow_share', 0, 1), 'southwest_crisis_usable_capacity_unresearched'],
  twrs_air_taiwan_network: ['civil_airlift', 'transfer', point('passengers_per_year', 63960000), 'observed_passenger_scale_not_cargo_or_crisis_capacity'],
  twrs_air_allied_access: ['allied_airlift', 'transfer', unknown('normalized_theater_flow_share', 0, 1), 'physical_capacity_and_permission_are_separate_unknowns'],
  twrs_energy_taiwan_liquid_fuels: ['liquid_fuel', 'storage', unknown('scenario_fuel_unit', 0, 100), 'opening_stock_and_usable_share_unresearched'],
  twrs_energy_taiwan_lng_coal: ['power_fuel', 'storage', unknown('scenario_power_fuel_unit', 0, 100), 'opening_stock_and_fuel_mix_unresearched'],
  twrs_grid_taiwan: ['electric_power', 'service', point('gigawatt_installed', 57.74, 'opening_state'), 'installed_capacity_not_dispatchable_output'],
  twrs_comms_taiwan_cable_mesh: ['bandwidth', 'service', unknown('normalized_service_capacity', 0, 1), 'route_count_does_not_measure_bandwidth'],
  twrs_comms_taiwan_backup: ['bandwidth', 'service', unknown('normalized_service_capacity', 0, 1), 'matsu_example_not_national_capacity'],
  twrs_semiconductor_north: ['semiconductor_output', 'production', unknown('normalized_output_index', 0, 1), 'revenue_is_exposure_not_output_capacity'],
  twrs_semiconductor_central: ['semiconductor_output', 'production', unknown('normalized_output_index', 0, 1), 'revenue_is_exposure_not_output_capacity'],
  twrs_semiconductor_south: ['semiconductor_output', 'production', unknown('normalized_output_index', 0, 1), 'revenue_is_exposure_not_output_capacity'],
  twrs_route_taiwan_strait: ['mixed_cargo', 'transfer', unknown('normalized_theater_flow_share', 0, 1), 'trade_value_is_scale_not_physical_capacity'],
  twrs_route_east_taiwan: ['mixed_cargo', 'transfer', unknown('normalized_theater_flow_share', 0, 1), 'synthetic_route_capacity_unresearched'],
  twrs_route_luzon_south_china_sea: ['mixed_cargo', 'transfer', unknown('normalized_theater_flow_share', 0, 1), 'synthetic_route_capacity_unresearched'],
  twrs_sealift_commercial_pool: ['commercial_sealift', 'transfer', unknown('normalized_charterable_share', 0, 1), 'port_scale_does_not_establish_charterable_lift'],
  twrs_satellite_weather_ocean: ['weather_observation', 'service', unknown('normalized_service_capacity', 0, 1), 'mission_exists_but_crisis_tasking_share_unresearched'],
  twrs_satellite_optical_earth_observation: ['optical_observation', 'service', unknown('normalized_service_capacity', 0, 1), 'mission_exists_but_crisis_tasking_share_unresearched'],
  twrs_satellite_pnt: ['pnt_service', 'service', unknown('normalized_service_capacity', 0, 1), 'global_service_exists_but_local_degradation_unknown']
};

const actionByKind = {
  port_region: ['twrs_action_reroute_cargo', 'twrs_action_allocate_repair'],
  airfield_capacity_region: ['twrs_action_allocate_airlift', 'twrs_action_allocate_repair'],
  airlift_access_region: ['twrs_action_request_access', 'twrs_action_allocate_airlift'],
  fuel_system: ['twrs_action_ration_fuel', 'twrs_action_request_resupply'],
  electrical_capacity_region: ['twrs_action_shed_load', 'twrs_action_allocate_repair'],
  communications_region: ['twrs_action_prioritize_bandwidth', 'twrs_action_allocate_repair'],
  advanced_manufacturing_region: ['twrs_action_prioritize_industrial_inputs', 'twrs_action_shed_load'],
  maritime_lane: ['twrs_action_reroute_cargo'],
  sealift_access: ['twrs_action_charter_sealift', 'twrs_action_reroute_cargo'],
  satellite_support_category: ['twrs_action_task_observation']
};

const neutralNames = {
  twrs_port_japan_regional_depth: 'Japan port capacity research region',
  twrs_air_allied_access: 'Japan and Philippines conditional air access research region',
  twrs_sealift_commercial_pool: 'Regional commercial sealift availability research region'
};

const systemsDoc = readJson('regional_systems.json');
systemsDoc.contract_version = 'twrs_typed_resource_network_v1';
systemsDoc.systems = systemsDoc.systems.map(system => {
  const [resourceType, role, capacity, evidenceBasis] = contracts[system.system_id];
  const openingStock = role === 'storage'
    ? unknown(capacity.unit, 0, 100, 'opening_state')
    : notApplicable(capacity.unit);
  const demand = role === 'storage' || role === 'service' || role === 'production'
    ? unknown(`${resourceType}_unit_per_hour`, 0, 100, 'hourly')
    : notApplicable(`${resourceType}_unit_per_hour`);
  let sourceIds = system.source_ids ?? [];
  let modeledAssumptionIds = system.modeled_assumption_ids ?? [];
  if (system.system_id === 'twrs_port_japan_regional_depth') {
    sourceIds = [];
    modeledAssumptionIds = ['twrs_assumption_japan_onward_logistics'];
  } else if (system.system_id === 'twrs_air_allied_access') {
    sourceIds = ['twrs_src_edca_sites_2023','twrs_src_us_philippines_2plus2_2024','twrs_src_us_japan_treaty_final','twrs_src_us_japan_sofa_final'];
  } else if (system.system_id === 'twrs_sealift_commercial_pool') {
    sourceIds = sourceIds.filter(sourceId => sourceId !== 'twrs_src_japan_ports_2024');
  }
  return {
    ...system,
    name: neutralNames[system.system_id] ?? system.name,
    source_ids: sourceIds,
    modeled_assumption_ids: modeledAssumptionIds,
    execution_class: 'operational_candidate',
    capacity: {
      measurement: capacity,
      evidence_basis: evidenceBasis,
      crisis_usable_fraction: unknown('fraction', 0, 1, 'opening_state')
    },
    resource_accounts: [{
      account_id: `${system.system_id}_${resourceType}`,
      resource_type: resourceType,
      role,
      opening_stock: openingStock,
      flow_capacity: capacity,
      demand_per_hour: demand,
      utilization_fraction: unknown('fraction', 0, 1, 'opening_state'),
      loss_rate_per_hour: unknown('fraction_per_hour', 0, 1, 'hourly'),
      allocation_priority: 'player_or_policy_queue'
    }],
    damage_and_repair: {
      opening_damage_state: 'operational',
      repair_resource_type: 'repair_work',
      repair_work_required: unknown('scenario_repair_work_unit', 0, 100, 'damage_event'),
      repair_capacity_available: unknown('scenario_repair_work_unit_per_hour', 0, 100, 'hourly')
    },
    redundancy: {
      substitutes: system.redundancy?.substitutes ?? [],
      switching_delay_hours: unknown('hour', 0, 720, 'switch_event'),
      retained_capacity_fraction: unknown('fraction', 0, 1, 'switch_event'),
      switching_cost: unknown('scenario_cost_unit', 0, 100, 'switch_event')
    },
    recovery: {
      calibration_state: 'unresearched',
      repair_work_distribution: unknown('scenario_repair_work_unit', 0, 100, 'damage_event'),
      minimum_elapsed_hours: unknown('hour', 0, 8760, 'damage_event')
    },
    uncertainty: {
      truth_state: 'bounded_unknown',
      player_estimate_state: 'unrevealed_until_observed',
      confidence_fraction: unknown('fraction', 0, 1, 'opening_state'),
      update_cadence_hours: unknown('hour', 1, 720, 'update_cycle'),
      stale_after_hours: unknown('hour', 1, 2160, 'update_cycle'),
      unknowns: system.uncertainty?.unknowns ?? []
    },
    decisions_enabled: actionByKind[system.kind] ?? ['twrs_action_allocate_repair']
  };
});
writeJson('regional_systems.json', systemsDoc);

const estimate = (unit, minimum, central, maximum) => ({ state: central === null ? 'bounded_unknown' : 'bounded_estimate', unit, minimum, central, maximum });
const edge = (edgeId, from, to, resourceType, evidenceClass, sourceIds = [], assumptionIds = [], coefficient = [0, null, 1]) => ({
  edge_id: edgeId,
  from,
  to,
  resource_type: resourceType,
  edge_kind: resourceType.endsWith('_permission') ? 'permission_gate' : resourceType.includes('observation') ? 'information_service' : 'resource_transfer',
  transfer_limit: estimate(`${resourceType}_unit_per_hour`, 0, null, 100),
  transfer_coefficient: estimate('fraction', coefficient[0], coefficient[1], coefficient[2]),
  activation_threshold_fraction: estimate('fraction', 0, null, 1),
  lag_hours: estimate('hour', 0, null, 720),
  loss_fraction: estimate('fraction', 0, null, 1),
  priority_rule: 'player_or_policy_queue',
  degradation_function: 'piecewise_linear_bounded',
  evidence_class: evidenceClass,
  source_ids: sourceIds,
  modeled_assumption_ids: assumptionIds,
  observed_at: '2025-08-31T23:59:59Z'
});

const dependencies = {
  dataset_id: 'twrs_dependency_edges_2025',
  as_of: cutoff,
  opening_truth: true,
  contract_version: 'twrs_typed_resource_network_v1',
  edges: [
    edge('twrs_dep_grid_power_fuel','twrs_energy_taiwan_lng_coal','twrs_grid_taiwan','power_fuel','modeled_assumption',[],['twrs_assumption_power_fuel_dispatch']),
    edge('twrs_dep_port_south_to_power_fuel','twrs_port_taiwan_south','twrs_energy_taiwan_lng_coal','power_fuel','modeled_assumption',[],['twrs_assumption_specialized_energy_gateway']),
    edge('twrs_dep_route_east_to_power_fuel','twrs_route_east_taiwan','twrs_energy_taiwan_lng_coal','power_fuel','modeled_assumption',[],['twrs_assumption_route_diversion']),
    edge('twrs_dep_route_luzon_to_power_fuel','twrs_route_luzon_south_china_sea','twrs_energy_taiwan_lng_coal','power_fuel','modeled_assumption',[],['twrs_assumption_route_diversion']),
    edge('twrs_dep_route_east_to_liquid_fuel','twrs_route_east_taiwan','twrs_energy_taiwan_liquid_fuels','liquid_fuel','modeled_assumption',[],['twrs_assumption_route_diversion']),
    edge('twrs_dep_route_luzon_to_liquid_fuel','twrs_route_luzon_south_china_sea','twrs_energy_taiwan_liquid_fuels','liquid_fuel','modeled_assumption',[],['twrs_assumption_route_diversion']),
    edge('twrs_dep_grid_to_cables','twrs_grid_taiwan','twrs_comms_taiwan_cable_mesh','electric_power','source_supported',['twrs_src_moda_ponghu_cables_2025','twrs_src_taipower_system_2024']),
    edge('twrs_dep_grid_to_backup_comms','twrs_grid_taiwan','twrs_comms_taiwan_backup','electric_power','source_supported',['twrs_src_moda_matsu_cables_2025']),
    edge('twrs_dep_cables_to_semis_north','twrs_comms_taiwan_cable_mesh','twrs_semiconductor_north','bandwidth','modeled_assumption',[],['twrs_assumption_semiconductor_data_service']),
    edge('twrs_dep_cables_to_semis_central','twrs_comms_taiwan_cable_mesh','twrs_semiconductor_central','bandwidth','modeled_assumption',[],['twrs_assumption_semiconductor_data_service']),
    edge('twrs_dep_cables_to_semis_south','twrs_comms_taiwan_cable_mesh','twrs_semiconductor_south','bandwidth','modeled_assumption',[],['twrs_assumption_semiconductor_data_service']),
    edge('twrs_dep_grid_to_semis_north','twrs_grid_taiwan','twrs_semiconductor_north','electric_power','source_supported',['twrs_src_tsmc_annual_2024','twrs_src_taipower_performance_2024']),
    edge('twrs_dep_grid_to_semis_central','twrs_grid_taiwan','twrs_semiconductor_central','electric_power','source_supported',['twrs_src_tsmc_annual_2024','twrs_src_taipower_performance_2024']),
    edge('twrs_dep_grid_to_semis_south','twrs_grid_taiwan','twrs_semiconductor_south','electric_power','source_supported',['twrs_src_stsp_annual_2024','twrs_src_taipower_performance_2024']),
    edge('twrs_dep_air_to_semis_north','twrs_air_taiwan_network','twrs_semiconductor_north','high_value_cargo','modeled_assumption',[],['twrs_assumption_semiconductor_air_cargo']),
    edge('twrs_dep_air_to_semis_central','twrs_air_taiwan_network','twrs_semiconductor_central','high_value_cargo','modeled_assumption',[],['twrs_assumption_semiconductor_air_cargo']),
    edge('twrs_dep_air_to_semis_south','twrs_air_taiwan_network','twrs_semiconductor_south','high_value_cargo','modeled_assumption',[],['twrs_assumption_semiconductor_air_cargo']),
    edge('twrs_dep_fuel_to_air','twrs_energy_taiwan_liquid_fuels','twrs_air_taiwan_network','liquid_fuel','modeled_assumption',[],['twrs_assumption_air_network_fuel']),
    edge('twrs_dep_port_north_to_semis_north','twrs_port_taiwan_north','twrs_semiconductor_north','industrial_input_cargo','modeled_assumption',[],['twrs_assumption_domestic_port_distribution']),
    edge('twrs_dep_port_central_to_semis_central','twrs_port_taiwan_central','twrs_semiconductor_central','industrial_input_cargo','modeled_assumption',[],['twrs_assumption_domestic_port_distribution']),
    edge('twrs_dep_port_south_to_semis_south','twrs_port_taiwan_south','twrs_semiconductor_south','industrial_input_cargo','modeled_assumption',[],['twrs_assumption_domestic_port_distribution']),
    edge('twrs_dep_yangtze_to_fujian','twrs_port_china_yangtze_delta','twrs_port_china_fujian','mixed_cargo','modeled_assumption',[],['twrs_assumption_china_coastal_distribution']),
    edge('twrs_dep_fujian_to_strait','twrs_port_china_fujian','twrs_route_taiwan_strait','mixed_cargo','modeled_assumption',[],['twrs_assumption_china_coastal_distribution']),
    edge('twrs_dep_japan_port_to_allied_air','twrs_port_japan_regional_depth','twrs_air_allied_access','sustainment_cargo','modeled_assumption',[],['twrs_assumption_japan_onward_logistics']),
    edge('twrs_dep_access_to_allied_air','twrs_access_us_japan','twrs_air_allied_access','air_access_permission','source_supported',['twrs_src_us_japan_treaty_final','twrs_src_us_japan_sofa_final']),
    edge('twrs_dep_ph_access_to_allied_air','twrs_access_us_philippines','twrs_air_allied_access','air_access_permission','source_supported',['twrs_src_edca_sites_2023','twrs_src_us_philippines_2plus2_2024']),
    edge('twrs_dep_strait_to_sealift','twrs_route_taiwan_strait','twrs_sealift_commercial_pool','commercial_sealift','modeled_assumption',[],['twrs_assumption_route_diversion']),
    edge('twrs_dep_east_to_sealift','twrs_route_east_taiwan','twrs_sealift_commercial_pool','commercial_sealift','modeled_assumption',[],['twrs_assumption_route_diversion']),
    edge('twrs_dep_luzon_to_sealift','twrs_route_luzon_south_china_sea','twrs_sealift_commercial_pool','commercial_sealift','modeled_assumption',[],['twrs_assumption_route_diversion']),
    edge('twrs_dep_commercial_access_to_sealift','twrs_access_taiwan_commercial','twrs_sealift_commercial_pool','commercial_access_permission','modeled_assumption',[],['twrs_assumption_commercial_emergency_authority']),
    edge('twrs_dep_taiwan_consent_to_air_network','twrs_access_us_taiwan','twrs_air_taiwan_network','assistance_permission','source_supported',['twrs_src_taiwan_relations_act']),
    edge('twrs_dep_weather_to_air','twrs_satellite_weather_ocean','twrs_air_taiwan_network','weather_observation','source_supported',['twrs_src_tasa_formosat7']),
    edge('twrs_dep_optical_to_grid_assessment','twrs_satellite_optical_earth_observation','twrs_grid_taiwan','optical_observation','source_supported',['twrs_src_tasa_formosat5']),
    edge('twrs_dep_pnt_to_airlift','twrs_satellite_pnt','twrs_air_allied_access','pnt_service','source_supported',['twrs_src_gps_overview'])
  ]
};
writeJson('dependencies.json', dependencies);

const permissions = (approvingAuthorities, legalSources, overrides = {}) => ({
  state_machine: {
    states: ['not_requested','consultation','approved_limited','approved_full','suspended','revoked'],
    opening_state: 'not_requested',
    approving_authorities: approvingAuthorities,
    consultation_required: true,
    lead_time_hours: estimate('hour', 0, null, 720),
    duration_hours: estimate('hour', 1, null, 8760),
    capacity_grant_fraction: estimate('fraction', 0, null, 1),
    revocation_conditions: ['host_nation_decision','mission_scope_violation','domestic_support_collapse','escalation_threshold'],
    political_cost: estimate('scenario_political_cost', 0, null, 100)
  },
  mission_permissions: {
    assistance: 'conditional', intelligence: 'conditional', transit: 'conditional', staging: 'not_granted', strike_support: 'not_granted', combat_entry: 'not_granted',
    ...overrides
  },
  legal_source_ids: legalSources
});

const accessDoc = readJson('access_relationships.json');
accessDoc.contract_version = 'twrs_permission_state_machine_v1';
accessDoc.relationships = accessDoc.relationships.map(relationship => {
  let relationshipKind = 'security_access_framework';
  let permission;
  let sourceIds = relationship.source_ids;
  if (relationship.relationship_id === 'twrs_access_us_japan') {
    sourceIds = ['twrs_src_us_japan_treaty_final','twrs_src_us_japan_sofa_final'];
    permission = permissions(['Government of Japan','Government of the United States','Japan United States Joint Committee'], sourceIds, { transit: 'existing_presence_scope_only', staging: 'conditional' });
  } else if (relationship.relationship_id === 'twrs_access_us_philippines') {
    permission = permissions(['President of the Philippines','Philippines defense institutions','Government of the United States'], sourceIds, { transit: 'conditional', staging: 'conditional' });
  } else if (relationship.relationship_id === 'twrs_access_us_taiwan') {
    relationshipKind = 'assistance_and_taiwan_consent_framework_not_basing';
    permission = permissions(['United States political authorities','Taiwan political authorities'], sourceIds, { assistance: 'conditional', intelligence: 'conditional', transit: 'not_granted', staging: 'not_granted' });
  } else {
    relationshipKind = 'commercial_charter_and_emergency_direction_research_question';
    permission = permissions(['Taiwan political authorities','commercial carrier and crew decision makers'], [], { assistance: 'not_applicable', intelligence: 'not_applicable', transit: 'conditional', staging: 'not_applicable', strike_support: 'not_applicable', combat_entry: 'not_applicable' });
  }
  return {
    ...relationship,
    relationship_kind: relationshipKind,
    source_ids: sourceIds,
    modeled_assumption_ids: relationship.relationship_id === 'twrs_access_taiwan_commercial' ? ['twrs_assumption_commercial_emergency_authority'] : [],
    permission_model: permission,
    decisions_enabled: ['twrs_action_request_access'],
    observed_at: relationship.observed_at.includes('T') ? relationship.observed_at : `${relationship.observed_at}T00:00:00Z`
  };
});
writeJson('access_relationships.json', accessDoc);

writeJson('actions.json', {
  dataset_id: 'twrs_typed_actions_2025', as_of: cutoff, opening_truth: true,
  actions: [
    ['twrs_action_reroute_cargo','reroute_resource',['source_node','destination_node','resource_type','requested_amount'],['reserve_origin_flow','reserve_destination_flow','apply_edge_loss','deliver_after_lag']],
    ['twrs_action_allocate_repair','allocate_repair',['target_system','repair_work_amount'],['consume_repair_work','reduce_repair_requirement','advance_damage_state_if_threshold_met']],
    ['twrs_action_allocate_airlift','allocate_resource',['destination_node','requested_amount'],['reserve_airlift','consume_fuel','deliver_after_lag']],
    ['twrs_action_request_access','request_permission',['relationship_id','mission_class'],['enter_consultation','resolve_authority_gate','grant_or_reject_bounded_capacity']],
    ['twrs_action_ration_fuel','ration_demand',['fuel_account','priority_queue'],['reduce_low_priority_demand','preserve_stock','apply_political_cost']],
    ['twrs_action_request_resupply','request_resource',['fuel_account','requested_amount'],['reserve_route_and_gateway','deliver_after_lag_and_loss']],
    ['twrs_action_shed_load','ration_demand',['power_account','priority_queue'],['reduce_low_priority_demand','preserve_served_critical_load','apply_output_loss']],
    ['twrs_action_prioritize_bandwidth','ration_demand',['bandwidth_account','priority_queue'],['reserve_priority_bandwidth','degrade_unreserved_traffic']],
    ['twrs_action_prioritize_industrial_inputs','allocate_resource',['production_account','priority_queue'],['reserve_power_bandwidth_and_cargo','update_output_bound']],
    ['twrs_action_charter_sealift','request_permission',['commercial_relationship','requested_amount'],['resolve_commercial_permission','reserve_charterable_share','apply_political_and_economic_cost']],
    ['twrs_action_task_observation','allocate_resource',['service_account','target_system'],['reserve_service_capacity','deliver_observation_after_lag','update_player_estimate']]
  ].map(([action_id, action_type, required_inputs, deterministic_transition]) => ({
    action_id, action_type, required_inputs, preconditions: ['required_accounts_resolve','capacity_available','permission_if_required'],
    costs: [{ resource_type: 'decision_attention', amount: estimate('scenario_attention_unit', 1, 1, 1) }],
    deterministic_transition, failure_transition: 'no_resource_mutation_and_reason_recorded'
  }))
});

writeJson('modeled_assumptions.json', {
  dataset_id: 'twrs_modeled_assumptions_2025', as_of: cutoff, opening_truth: true,
  assumptions: [
    ['twrs_assumption_power_fuel_dispatch','Imported power fuels are transformed into dispatchable electrical service subject to generation mix.'],
    ['twrs_assumption_specialized_energy_gateway','A synthetic southern energy gateway transfers power fuel, without identifying terminals.'],
    ['twrs_assumption_route_diversion','Synthetic route families can carry bounded flows after switching delay and loss.'],
    ['twrs_assumption_semiconductor_data_service','Priority semiconductor output consumes communications service.'],
    ['twrs_assumption_semiconductor_air_cargo','Priority semiconductor output consumes a bounded high value air cargo flow.'],
    ['twrs_assumption_air_network_fuel','Civil and dual use air operations consume liquid fuel.'],
    ['twrs_assumption_domestic_port_distribution','Regional port cargo can support the corresponding broad industrial region after inland lag.'],
    ['twrs_assumption_china_coastal_distribution','Yangtze Delta commercial cargo can transfer through a synthetic coastal distribution chain to Fujian.'],
    ['twrs_assumption_japan_onward_logistics','Aggregate Japanese port cargo may support allied air logistics only after political and physical capacity gates.'],
    ['twrs_assumption_commercial_emergency_authority','Commercial lift is unavailable until legal authority, carrier consent, insurance, crew willingness and terminal fit are resolved.']
  ].map(([assumption_id, statement]) => ({
    assumption_id, statement, status: 'designed_not_observed', valid_from: cutoff,
    falsification_condition: 'replaced_by_source_supported_flow_or_rejected_by_review',
    sensitivity_treatment: 'synthetic_region'
  }))
});

const rawSources = fs.readFileSync(path.join(here, 'sources.ndjson'), 'utf8').trim().split(/\n+/).map(JSON.parse)
  .filter(source => !['twrs_src_japan_ports_2024','twrs_src_us_japan_treaty','twrs_src_us_japan_treaty_final','twrs_src_us_japan_sofa_final'].includes(source.source_id));
rawSources.push(
  { source_id:'twrs_src_us_japan_treaty_final', title:'Treaty of Mutual Cooperation and Security between Japan and the United States of America', publisher:'Ministry of Foreign Affairs of Japan', url:'https://www.mofa.go.jp/na/st/page1we_000093.html', published_at:'1960-01-19', accessed_at:'2026-08-06', source_type:'law_or_treaty', source_tier:'A', relevant_locator:'Articles V, VI, VIII, IX and X; signed final treaty text' },
  { source_id:'twrs_src_us_japan_sofa_final', title:'Agreement under Article VI regarding facilities and areas and the status of United States armed forces in Japan', publisher:'Ministry of Foreign Affairs of Japan', url:'https://www.mofa.go.jp/region/n-america/us/q%26a/ref/2.html', published_at:'1960-01-19', accessed_at:'2026-08-06', source_type:'law_or_treaty', source_tier:'A', relevant_locator:'Articles II, VI, VII and XXV; signed final agreement text' }
);

const fallbackPublication = {
  twrs_src_twport_national_2024:'2025-08-31', twrs_src_twport_keelung_2024:'2025-08-31', twrs_src_twport_taipei_2024:'2025-08-31', twrs_src_twport_taichung_2024:'2025-08-31',
  twrs_src_caa_traffic_2024:'2025-08-31', twrs_src_taipower_system_2024:'2025-08-31', twrs_src_taipower_resilience_2024:'2025-08-31', twrs_src_taipower_energy_imports_2024:'2025-08-31',
  twrs_src_tsmc_annual_2024:'2025-08-31', twrs_src_stsp_annual_2024:'2025-08-31', twrs_src_tasa_formosat7:'2025-08-31', twrs_src_tasa_formosat5:'2025-08-31', twrs_src_gps_overview:'2025-08-31'
};
const sourceRecords = rawSources.map(source => {
  const publishedAt = source.published_at ?? fallbackPublication[source.source_id];
  if (!publishedAt) throw new Error(`No publication bound for ${source.source_id}`);
  const claimSnapshot = [source.source_id, source.title, source.publisher, source.relevant_locator ?? 'title_scoped_claim_only'].join('|');
  return {
    ...source,
    published_at: publishedAt,
    available_at: `${publishedAt}T00:00:00Z`,
    last_updated_at: `${publishedAt}T00:00:00Z`,
    publication_date_basis: source.published_at ? 'publisher_date' : 'conservative_latest_pre_bookmark_bound_not_exact_publication_date',
    claim_snapshot: claimSnapshot,
    artifact_sha256: crypto.createHash('sha256').update(claimSnapshot).digest('hex'),
    artifact_scope: 'frozen_claim_level_evidence_record_not_live_page_bytes'
  };
});
fs.writeFileSync(path.join(here, 'sources.ndjson'), `${sourceRecords.map(record => JSON.stringify(record)).join('\n')}\n`);

const manifest = readJson('manifest.json');
manifest.status = 'research_checkpoint';
manifest.simulation_readiness = 'blocked_pending_calibration_and_agent_09_revalidation';
manifest.correction_packets = {
  closed_by_contract: ['TWRS-C01','TWRS-C02','TWRS-C03'],
  partially_addressed: ['TWRS-C04','TWRS-C05'],
  unresolved: ['calibrate_physical_flows','calibrate_recovery_distributions','source_commercial_emergency_authority','independent_agent_09_revalidation']
};
manifest.files = ['README.md','CORRECTION_REPORT.md','manifest.json','sources.ndjson','regional_systems.json','dependencies.json','access_relationships.json','actions.json','modeled_assumptions.json','apply_correction_packet.mjs','validate_regional_systems.mjs','test_regional_systems.mjs'];
manifest.record_counts = { systems: systemsDoc.systems.length, dependency_edges: dependencies.edges.length, access_relationships: accessDoc.relationships.length, sources: sourceRecords.length, actions: 11, modeled_assumptions: 10 };
manifest.source_ids = sourceRecords.map(source => source.source_id);
manifest.observed_at = '2025-08-31T23:59:59Z';
writeJson('manifest.json', manifest);

console.log(JSON.stringify({ systems: systemsDoc.systems.length, edges: dependencies.edges.length, access: accessDoc.relationships.length, sources: sourceRecords.length }, null, 2));
