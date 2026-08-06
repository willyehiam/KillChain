import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const readNdjson = (name) => fs.readFileSync(path.join(root, name), 'utf8').trim().split(/\n+/).filter(Boolean).map(JSON.parse);
const writeNdjson = (name, rows) => fs.writeFileSync(path.join(root, name), `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
const asOf = '2025-09-01T00:00:00Z';
const reviewAfter = '2026-11-06';
const tv = (validFrom = '2025-01-01') => ({ valid_from: validFrom, as_of: asOf, observed_at: null, review_after: reviewAfter });
const unknownPerson = (rule) => ({ kind: 'unknown', unit: 'person', counting_rule: rule });
const exactPerson = (value, rule) => ({ kind: 'exact', value, unit: 'person', counting_rule: rule });
const unknownPlatform = (rule) => ({ kind: 'unknown', unit: 'platform', counting_rule: rule });
const unknownItem = (rule) => ({ kind: 'unknown', unit: 'equipment_item', counting_rule: rule });
const exactPlatform = (value, rule) => ({ kind: 'exact', value, unit: 'platform', counting_rule: rule });
const rangePlatform = (minimum, maximum, rule) => ({ kind: 'range', minimum, maximum, unit: 'platform', counting_rule: rule });
const unknownCapacity = (rule) => ({ kind: 'unknown', unit: 'capacity_unit', counting_rule: rule });
const exactCapacity = (value, rule) => ({ kind: 'exact', value, unit: 'capacity_unit', counting_rule: rule });
const provenance = (sourceIds, claimIds = [], evidence_state = 'official_claim', confidence = 'high', method = 'Direct extraction from the cited public source; no current location or movement is inferred.') => ({
  evidence_state,
  confidence,
  source_ids: sourceIds,
  claim_ids: claimIds,
  contradiction_set_ids: [],
  method,
});

const sourceRows = readNdjson('sources.ndjson');
const addSource = (source) => {
  if (!sourceRows.some((row) => row.source_id === source.source_id)) sourceRows.push(source);
};
[
  {
    source_id: 'src_force_usa_public_law_118_159_fy2025_ndaa',
    title: 'Servicemember Quality of Life Improvement and National Defense Authorization Act for Fiscal Year 2025',
    publisher: 'United States Congress', published_at: '2024-12-23', accessed_at: '2026-08-06',
    url: 'https://www.congress.gov/118/plaws/publ159/PLAW-118publ159.pdf', source_tier: 'A', source_type: 'law_or_treaty', language: 'en',
    relevant_locator: 'Sections 401 and 411: active duty and selected reserve end strengths',
    reliability_notes: 'Enacted statutory authorization. It is a ceiling or authorized strength, not an assertion of assigned or deployable personnel.',
  },
  {
    source_id: 'src_force_usa_title32_section102_2024', title: '32 U.S.C. Section 102: General policy',
    publisher: 'Office of the Law Revision Counsel, United States House of Representatives', published_at: '2025-01-06', accessed_at: '2026-08-06',
    url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title32-section102', source_tier: 'A', source_type: 'law_or_treaty', language: 'en',
    relevant_locator: 'National Guard as organized and trained in the several States, Territories, and the District of Columbia',
    reliability_notes: 'Official codification used to distinguish state Guard institutions from federal reserve component accounting.',
  },
  {
    source_id: 'src_force_usa_title32_section325_2024', title: '32 U.S.C. Section 325: Relief from National Guard duty when ordered to active duty',
    publisher: 'Office of the Law Revision Counsel, United States House of Representatives', published_at: '2025-01-06', accessed_at: '2026-08-06',
    url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title32-section325', source_tier: 'A', source_type: 'law_or_treaty', language: 'en',
    relevant_locator: 'Dual status command exception and separate state and federal chains',
    reliability_notes: 'Official codification. Dual status does not merge state and federal authority or permit orders outside the applicable status.',
  },
  {
    source_id: 'src_force_usa_title10_section12401_2024', title: '10 U.S.C. Section 12401: Army and Air National Guard of the United States status',
    publisher: 'Office of the Law Revision Counsel, United States House of Representatives', published_at: '2025-01-06', accessed_at: '2026-08-06',
    url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section12401', source_tier: 'A', source_type: 'law_or_treaty', language: 'en',
    relevant_locator: 'Federal reserve component status when not in federal service',
    reliability_notes: 'Official codification used with Title 32 sources to model conditional federal activation.',
  },
  {
    source_id: 'src_force_usa_crs_fy2025_force_structure', title: 'FY2025 Defense Budget Request: Selected Military Personnel and Force Structure Issues',
    publisher: 'Congressional Research Service', published_at: '2024-04-16', accessed_at: '2026-08-06',
    url: 'https://www.congress.gov/crs-product/IN12447', source_tier: 'A', source_type: 'research_report', language: 'en',
    relevant_locator: 'Table 1 requested end strength and Table 2 selected force structure',
    reliability_notes: 'Request era force structure snapshot. It is retained as a dated claim and never silently converted into an enacted or physically present total.',
  },
  {
    source_id: 'src_force_usa_crs_air_force_inventory_2025', title: 'Defense Primer: The United States Air Force',
    publisher: 'Congressional Research Service', published_at: '2025-08-11', accessed_at: '2026-08-06',
    url: 'https://www.congress.gov/crs-product/IF12622', source_tier: 'A', source_type: 'research_report', language: 'en',
    relevant_locator: 'Estimated FY2025 total aircraft inventory by mission category',
    reliability_notes: 'Congressional summary of Department of the Air Force budget data. Category values reconcile to 4,832 but conflict with a separate component total using different definitions.',
  },
  {
    source_id: 'src_force_usa_crs_navy_force_structure_2025', title: 'Navy Force Structure and Shipbuilding Plans: Background and Issues for Congress',
    publisher: 'Congressional Research Service', published_at: '2025-10-08', accessed_at: '2026-08-06',
    url: 'https://www.congress.gov/crs-product/RL32665', source_tier: 'A', source_type: 'research_report', language: 'en',
    relevant_locator: 'FY2024 actual battle force total, FY2025 request, and October 2025 retrospective fleet count',
    reliability_notes: 'Later report used only to bound the September bookmark. It is not treated as contemporaneous player knowledge and does not establish readiness.',
  },
  {
    source_id: 'src_force_usa_army_budget_overview_2025', title: 'Army FY 2025 Budget Overview',
    publisher: 'Office of the Assistant Secretary of the Army for Financial Management and Comptroller', published_at: '2024-03-11', accessed_at: '2026-08-06',
    url: 'https://www.asafm.army.mil/Portals/72/Documents/BudgetMaterial/2025/pbr/Army%20FY%202025%20Budget%20Overview.pdf', source_tier: 'A', source_type: 'official_release', language: 'en',
    relevant_locator: 'Pages 4 through 8: end strength request, training rotations, Patriot battalions, and barracks program',
    reliability_notes: 'Budget request evidence. Procurement and construction quantities are program claims, not automatically opening inventory or completed facilities.',
  },
  {
    source_id: 'src_force_usa_coast_guard_budget_2025', title: 'United States Coast Guard Fiscal Year 2025 Congressional Justification',
    publisher: 'United States Coast Guard', published_at: '2024-03-11', accessed_at: '2026-08-06',
    url: 'https://www.uscg.mil/Portals/0/documents/budget/2025/USCG%20FY%202025%20Congressional%20Justification.pdf', source_tier: 'A', source_type: 'official_release', language: 'en',
    relevant_locator: 'Workforce positions, cutter acquisition, and maintenance and modernization program descriptions',
    reliability_notes: 'Budget program evidence. Planned program envelopes are not represented as current maintenance quantities unless a bookmark dated source confirms execution.',
  },
].forEach(addSource);
writeNdjson('sources.ndjson', sourceRows);

let organizations = readNdjson('organizations.ndjson');
const orgById = new Map(organizations.map((row) => [row.organization_id, row]));
const commandTemplate = structuredClone(orgById.get('organization_usa_joint_chiefs_of_staff'));
const addOrg = ({ id, name, kind, echelon, component = 'civilian_agency', roles, parent, sources, notes }) => {
  if (orgById.has(id)) return;
  const row = structuredClone(commandTemplate);
  Object.assign(row, {
    organization_id: id, name, aliases: [], service: 'joint', component, organization_kind: kind, echelon,
    supported_organization_ids: [], headquarters_location_id: null,
    personnel: { authorized: unknownPerson('Aggregate statutory command node; staff strength is not asserted.'), assigned: unknownPerson('Aggregate statutory command node; staff strength is not asserted.'), deployable: unknownPerson('Aggregate statutory command node; staff strength is not asserted.') },
    readiness: { state: 'unknown', basis: 'unknown', limiting_factors: ['Readiness is not inferred from statutory existence.'] },
    mobilization: { status: 'not_applicable', authority_id: null, minimum_delay_hours: null, equipment_pool_ids: [] },
    roles, inventory_record_ids: [], temporal_validity: tv('2024-01-01'), provenance: provenance(sources), notes,
    display_parent_organization_id: parent, relationship_record_ids: [],
  });
  organizations.push(row); orgById.set(id, row);
};
addOrg({ id: 'organization_usa_secretary_of_defense_office', name: 'Secretary of Defense as operational chain authority', kind: 'political_authority', echelon: 'national_authority', roles: ['operational chain authority', 'direction of combatant commands'], parent: 'organization_usa_department_of_defense', sources: ['src_force_usa_title10_section162_2024','src_force_usa_crs_commanding_operations_2024'], notes: 'The office node separates the statutory person in the operational chain from the Department as an administrative institution.' });
addOrg({ id: 'organization_usa_national_guard_bureau', name: 'National Guard Bureau', kind: 'general_staff', echelon: 'general_staff', component: 'guard', roles: ['federal channel to states', 'Guard policy and coordination', 'joint activity'], parent: 'organization_usa_department_of_defense', sources: ['src_force_usa_title32_section102_2024'], notes: 'The Bureau coordinates and advises; it is not modeled as a unitary operational commander of state forces.' });
addOrg({ id: 'organization_usa_governors_guard_authority', name: 'Governors and territorial executives as Guard authorities', kind: 'political_authority', echelon: 'national_authority', roles: ['state command authority under state active duty and Title 32'], parent: null, sources: ['src_force_usa_title32_section102_2024'], notes: 'Aggregate node for 50 states, territories, and the District of Columbia. It does not erase jurisdiction specific authority.' });
addOrg({ id: 'organization_usa_state_and_territorial_joint_force_headquarters', name: 'State and territorial Joint Force Headquarters aggregate', kind: 'joint_command', echelon: 'functional_command', component: 'guard', roles: ['state joint command', 'Guard force coordination'], parent: 'organization_usa_governors_guard_authority', sources: ['src_force_usa_title32_section102_2024'], notes: 'Aggregate research node. Individual state headquarters remain uncollected.' });
addOrg({ id: 'organization_usa_state_adjutants_general', name: 'State and territorial adjutants general aggregate', kind: 'political_authority', echelon: 'other', component: 'guard', roles: ['state Guard command administration'], parent: 'organization_usa_governors_guard_authority', sources: ['src_force_usa_title32_section102_2024'], notes: 'Aggregate research node; no individual officeholder or location is asserted.' });
addOrg({ id: 'organization_usa_dual_status_commanders_pool', name: 'Dual status commanders statutory pool', kind: 'mobilization_pool', echelon: 'pool', component: 'guard', roles: ['parallel state and federal command when lawfully appointed'], parent: 'organization_usa_national_guard_bureau', sources: ['src_force_usa_title32_section325_2024'], notes: 'A dual status commander remains subject to separate chains and may not transfer authority between statuses.' });

const authorized = {
  organization_usa_army: [442300, 'Army active duty statutory end strength authorization for FY2025.'],
  organization_usa_navy: [332300, 'Navy active duty statutory end strength authorization for FY2025.'],
  organization_usa_marine_corps: [172300, 'Marine Corps active duty statutory end strength authorization for FY2025.'],
  organization_usa_air_force: [320000, 'Air Force active duty statutory end strength authorization for FY2025.'],
  organization_usa_space_force: [9800, 'Space Force active duty statutory end strength authorization for FY2025.'],
  organization_usa_army_national_guard: [325000, 'Army National Guard selected reserve statutory end strength authorization for FY2025.'],
  organization_usa_army_reserve: [175800, 'Army Reserve selected reserve statutory end strength authorization for FY2025.'],
  organization_usa_navy_reserve: [57700, 'Navy Reserve selected reserve statutory end strength authorization for FY2025.'],
  organization_usa_marine_corps_reserve: [32500, 'Marine Corps Reserve selected reserve statutory end strength authorization for FY2025.'],
  organization_usa_air_national_guard: [108300, 'Air National Guard selected reserve statutory end strength authorization for FY2025.'],
  organization_usa_air_force_reserve: [67000, 'Air Force Reserve selected reserve statutory end strength authorization for FY2025.'],
  organization_usa_coast_guard_reserve: [7000, 'Coast Guard Reserve selected reserve statutory end strength authorization for FY2025.'],
};
for (const [id, [value, rule]] of Object.entries(authorized)) {
  const org = orgById.get(id); if (!org) continue;
  org.personnel.authorized = exactPerson(value, rule);
  org.personnel.assigned = unknownPerson('Authorized end strength does not establish assigned strength at the bookmark.');
  org.personnel.deployable = unknownPerson('Authorized end strength does not establish deployable personnel.');
  org.provenance.source_ids = [...new Set([...org.provenance.source_ids, 'src_force_usa_public_law_118_159_fy2025_ndaa'])];
}
const cg = orgById.get('organization_usa_coast_guard');
cg.personnel.authorized = exactPerson(42330, 'FY2025 budget supported military positions; this is not a statutory active duty end strength ceiling.');
cg.personnel.assigned = unknownPerson('Budget supported positions do not establish assigned strength.');
cg.personnel.deployable = unknownPerson('Budget supported positions do not establish deployable strength.');
cg.provenance.source_ids = [...new Set([...cg.provenance.source_ids, 'src_force_usa_coast_guard_budget_2025'])];

for (const id of ['organization_usa_cyber_command','organization_usa_special_operations_command','organization_usa_strategic_command','organization_usa_transportation_command']) orgById.get(id).echelon = 'functional_command';
orgById.get('organization_usa_space_command').notes = `${orgById.get('organization_usa_space_command').notes ?? ''} Geographic area of responsibility above 100 kilometers; retained as theater command rather than a mission functional command.`.trim();
orgById.get('organization_usa_department_of_defense').roles = ['defense policy','military department administration'];
writeNdjson('organizations.ndjson', organizations);

let relationships = readNdjson('relationships.ndjson').filter((row) => ![
  'relationship_usa_president_commander_in_chief_department_of_defense_operational_control',
  'relationship_usa_joint_chiefs_of_staff_department_of_defense_supporting',
  'relationship_usa_army_army_national_guard_mobilization_authority',
  'relationship_usa_air_force_air_national_guard_mobilization_authority',
  'relationship_usa_president_commander_in_chief_army_national_guard_federal_activation',
  'relationship_usa_president_commander_in_chief_air_national_guard_federal_activation',
].includes(row.relationship_id) && !(row.source_organization_id === 'organization_usa_department_of_defense' && row.relationship_type === 'operational_control'));
const rel = (id, source, target, type, activation, conditions, sourceIds, mayIssueOrders, mayReassignForces, mayReleaseForMission, domains = ['joint'], missions = ['statutory command and control']) => ({
  relationship_id: id, country_id: 'country_usa', source_organization_id: source, target_organization_id: target, relationship_type: type,
  authority_scope: { domains, missions, may_issue_orders: mayIssueOrders, may_reassign_forces: mayReassignForces, may_release_for_mission: mayReleaseForMission },
  activation_state: activation, conditions, precedence: 1, temporal_validity: tv('2024-01-01'), provenance: provenance(sourceIds), notes: 'Authority is status dependent; no geographic disposition is implied.',
});
relationships.push(
  rel('relationship_usa_president_commander_in_chief_secretary_of_defense_operational_control','organization_usa_president_commander_in_chief','organization_usa_secretary_of_defense_office','operational_control','active',[],['src_force_usa_title10_section162_2024','src_force_usa_crs_commanding_operations_2024'],true,true,true),
  rel('relationship_usa_joint_chiefs_of_staff_secretary_of_defense_advisory','organization_usa_joint_chiefs_of_staff','organization_usa_secretary_of_defense_office','advisory','active',['The Joint Chiefs are not inserted into the operational chain.'],['src_force_usa_crs_commanding_operations_2024'],false,false,false),
);
for (const id of ['africa','central','cyber','european','indo_pacific','northern','southern','space','special_operations','strategic','transportation']) {
  relationships.push(rel(`relationship_usa_secretary_of_defense_${id}_command_operational_control`,'organization_usa_secretary_of_defense_office',`organization_usa_${id}_command`,'operational_control','active',[],['src_force_usa_title10_section162_2024','src_force_usa_crs_commanding_operations_2024'],true,true,true));
}
relationships.push(
  rel('relationship_usa_governors_state_joint_force_headquarters_state_control','organization_usa_governors_guard_authority','organization_usa_state_and_territorial_joint_force_headquarters','state_control','active',['Applies while forces remain in state active duty or Title 32 status.'],['src_force_usa_title32_section102_2024'],true,true,true),
  rel('relationship_usa_state_adjutants_general_state_joint_force_headquarters_operational_control','organization_usa_state_adjutants_general','organization_usa_state_and_territorial_joint_force_headquarters','operational_control','active',['Authority varies by jurisdiction and status.'],['src_force_usa_title32_section102_2024'],true,true,true),
  rel('relationship_usa_state_joint_force_headquarters_army_national_guard_state_control','organization_usa_state_and_territorial_joint_force_headquarters','organization_usa_army_national_guard','state_control','active',['Title 32 or state active duty only.'],['src_force_usa_title32_section102_2024'],true,true,true,['ground','joint'],['state missions','federally funded Title 32 missions']),
  rel('relationship_usa_state_joint_force_headquarters_air_national_guard_state_control','organization_usa_state_and_territorial_joint_force_headquarters','organization_usa_air_national_guard','state_control','active',['Title 32 or state active duty only.'],['src_force_usa_title32_section102_2024'],true,true,true,['air','joint'],['state missions','federally funded Title 32 missions']),
  rel('relationship_usa_national_guard_bureau_army_national_guard_supporting','organization_usa_national_guard_bureau','organization_usa_army_national_guard','supporting','active',['Does not confer unitary operational command over state forces.'],['src_force_usa_title32_section102_2024'],false,false,false,['ground','joint'],['policy','coordination','force development']),
  rel('relationship_usa_national_guard_bureau_air_national_guard_supporting','organization_usa_national_guard_bureau','organization_usa_air_national_guard','supporting','active',['Does not confer unitary operational command over state forces.'],['src_force_usa_title32_section102_2024'],false,false,false,['air','joint'],['policy','coordination','force development']),
  rel('relationship_usa_department_of_the_army_army_national_guard_organize_train_equip','organization_usa_department_of_the_army','organization_usa_army_national_guard','organize_train_equip','active',['Federal organize, train, and equip responsibility does not displace state operational command while the force remains in Title 32 or state active duty status.'],['src_force_usa_title32_section102_2024'],false,false,false,['ground','joint'],['organize train and equip']),
  rel('relationship_usa_department_of_the_air_force_air_national_guard_organize_train_equip','organization_usa_department_of_the_air_force','organization_usa_air_national_guard','organize_train_equip','active',['Federal organize, train, and equip responsibility does not displace state operational command while the force remains in Title 32 or state active duty status.'],['src_force_usa_title32_section102_2024'],false,false,false,['air','joint'],['organize train and equip']),
  rel('relationship_usa_president_army_national_guard_title10_federal_activation','organization_usa_president_commander_in_chief','organization_usa_army_national_guard','federal_activation','conditional',['A lawful Title 10 activation must occur; state control for the activated force is superseded for the duration of federal service.'],['src_force_usa_title10_section12401_2024'],true,true,true,['ground','joint'],['federal missions after activation']),
  rel('relationship_usa_president_air_national_guard_title10_federal_activation','organization_usa_president_commander_in_chief','organization_usa_air_national_guard','federal_activation','conditional',['A lawful Title 10 activation must occur; state control for the activated force is superseded for the duration of federal service.'],['src_force_usa_title10_section12401_2024'],true,true,true,['air','joint'],['federal missions after activation']),
  rel('relationship_usa_dual_status_commanders_state_joint_force_headquarters_dual_hatted','organization_usa_dual_status_commanders_pool','organization_usa_state_and_territorial_joint_force_headquarters','dual_hatted','conditional',['Requires lawful appointment and consent where required; state and federal orders remain separate.'],['src_force_usa_title32_section325_2024'],true,false,false,['joint'],['coordinated response under separate chains']),
  rel('relationship_usa_national_guard_bureau_dual_status_commanders_supporting','organization_usa_national_guard_bureau','organization_usa_dual_status_commanders_pool','supporting','conditional',['Applies when dual status command is established.'],['src_force_usa_title32_section325_2024'],false,false,false),
);
relationships = [...new Map(relationships.map((row) => [row.relationship_id, row])).values()];
writeNdjson('relationships.ndjson', relationships);

const equipment = readNdjson('equipment_types.ndjson');
const addEquipment = ({ id, display, domain, category, serviceRole, mobility, unit = 'platform', parent = null, sourceIds }) => {
  const existingIndex = equipment.findIndex((row) => row.equipment_type_id === id);
  if (existingIndex >= 0) equipment.splice(existingIndex, 1);
  equipment.push({
    equipment_type_id: id, display_name: display, reporting_names: [], taxonomy: { domain, category, entity_kind: unit === 'platform' ? 'platform' : unit === 'capacity_unit' ? 'facility_system' : 'support_equipment', family: null, model: null, variant: null },
    origin_country_ids: ['country_usa'], manufacturer_ids: [], roles: serviceRole,
    individualization: { supported: unit === 'platform', default_research_resolution: 'national_pool', reason: 'Aggregate national accounting is the default; platform identity is permitted only when it materially changes command, mission, loss, or a player decision.' },
    crew_requirements: { operating_crew: unknownPerson('Category aggregate does not specify operating crews.'), support_personnel: unknownPerson('Category aggregate does not specify support personnel.') },
    mobility: { mobility_kind: mobility, self_deploying: mobility === 'varies' ? null : mobility === 'fixed_wing' || mobility === 'rotary_wing' || mobility === 'surface_vessel', strategic_lift_required: mobility === 'varies' || mobility === 'fixed' ? null : false },
    support_dependency_types: ['crew','maintenance_facility','spares','command_network'], measured_characteristics: [], temporal_validity: tv('2025-01-01'),
    provenance: provenance(sourceIds), notes: 'National aggregate only. No readiness, base, route, or current deployment follows from this taxonomy record.',
    ontology_id: `ontology_${domain}_${category.toLowerCase().replaceAll(' ','_')}`, parent_equipment_type_id: parent, counting_unit: unit,
    aggregation_rule: parent ? 'leaf_counts_may_be_summed_when_scopes_are_mutually_exclusive' : unit === 'capacity_unit' ? 'capability_capacity_is_not_additive' : 'parent_is_reconciliation_only_and_must_not_be_summed_with_children',
    dependency_requirements: [],
  });
};
addEquipment({ id:'equipment_category_usa_aircraft_total_inventory',display:'United States Air Force total aircraft inventory',domain:'air',category:'aircraft total inventory',serviceRole:['aggregate aircraft accounting'],mobility:'varies',sourceIds:['src_force_usa_crs_air_force_inventory_2025'] });
for (const [slug,display,mobility] of [['bomber','Bomber aircraft','fixed_wing'],['fighter_attack','Fighter and attack aircraft','fixed_wing'],['rotorcraft','Rotorcraft','rotary_wing'],['special_mission','Special mission aircraft','varies'],['mobility','Mobility aircraft including airlift and tanker roles','fixed_wing'],['trainer','Trainer aircraft','fixed_wing']]) addEquipment({id:`equipment_category_usa_air_force_${slug}`,display,domain:'air',category:slug.replaceAll('_',' '),serviceRole:[slug.replaceAll('_',' ')],mobility,parent:'equipment_category_usa_aircraft_total_inventory',sourceIds:['src_force_usa_crs_air_force_inventory_2025']});
addEquipment({id:'equipment_category_usa_air_force_tanker_subset',display:'Tanker aircraft subset of mobility inventory',domain:'air',category:'tanker aircraft subset',serviceRole:['aerial refueling'],mobility:'fixed_wing',parent:'equipment_category_usa_air_force_mobility',sourceIds:['src_force_usa_crs_air_force_inventory_2025']});
addEquipment({id:'equipment_category_usa_air_force_airlift_subset',display:'Airlift aircraft subset of mobility inventory',domain:'air',category:'airlift aircraft subset',serviceRole:['strategic lift','theater lift'],mobility:'fixed_wing',parent:'equipment_category_usa_air_force_mobility',sourceIds:['src_force_usa_crs_air_force_inventory_2025']});
addEquipment({id:'equipment_category_usa_navy_battle_force_ship',display:'United States Navy battle force ships',domain:'maritime',category:'battle force ship',serviceRole:['fleet operations'],mobility:'surface_vessel',sourceIds:['src_force_usa_crs_navy_force_structure_2025']});
addEquipment({id:'equipment_category_usa_army_training_rotation_capacity',display:'United States Army annual combat training center rotation capacity',domain:'ground',category:'training rotation capacity',serviceRole:['collective training'],mobility:'fixed',unit:'capacity_unit',sourceIds:['src_force_usa_army_budget_overview_2025']});
addEquipment({id:'equipment_category_usa_army_barracks_project',display:'United States Army FY2025 barracks project program',domain:'ground',category:'barracks construction project',serviceRole:['installation support'],mobility:'fixed',unit:'capacity_unit',sourceIds:['src_force_usa_army_budget_overview_2025']});
addEquipment({id:'equipment_category_usa_coast_guard_national_security_cutter',display:'United States Coast Guard national security cutter',domain:'maritime',category:'national security cutter',serviceRole:['maritime security','national defense'],mobility:'surface_vessel',sourceIds:['src_force_usa_coast_guard_budget_2025']});
addEquipment({id:'equipment_category_usa_coast_guard_waterways_commerce_cutter',display:'United States Coast Guard waterways commerce cutter',domain:'maritime',category:'waterways commerce cutter',serviceRole:['waterways management'],mobility:'surface_vessel',sourceIds:['src_force_usa_coast_guard_budget_2025']});
addEquipment({id:'equipment_category_usa_army_major_equipment',display:'United States Army major equipment unresolved aggregate',domain:'ground',category:'Army major equipment',serviceRole:['ground combat and support'],mobility:'varies',unit:'equipment_item',sourceIds:['src_force_usa_army_budget_overview_2025']});
addEquipment({id:'equipment_category_usa_marine_major_equipment',display:'United States Marine Corps major equipment unresolved aggregate',domain:'joint',category:'Marine Corps major equipment',serviceRole:['expeditionary combat and support'],mobility:'varies',unit:'equipment_item',sourceIds:['src_force_usa_crs_fy2025_force_structure']});
writeNdjson('equipment_types.ndjson', equipment);

const exactAircraft = { bomber:139, fighter_attack:1933, rotorcraft:241, special_mission:359, mobility:1191, trainer:969 };
const inventory = [];
const deployments = [];
const maintenance = [];
const conservation = [];
const addPool = ({ slug, display, service, component='active', equipmentId, domain, category, quantity, orgId, sourceIds, parent=null, siblings=[], maintenanceState='unknown' }) => {
  const invId = `inventory_usa_${slug}`; const depId = `deployment_usa_${slug}_national_accounting`; const consId = `conservation_usa_${slug}`;
  inventory.push({
    inventory_record_id: invId, inventory_kind: quantity.kind === 'unknown' ? 'unknown_estimate' : quantity.kind === 'range' ? 'aggregate_total' : 'aggregate_total', country_id:'country_usa', owner_id:'country_usa', controller_id:'country_usa', service, component,
    equipment_type_id:equipmentId, display_name:display, domain, category, representation_tier:'national_capability', accounting_state:'unknown', quantity, organization_id:orgId, formation_id:null, location_id:null, current_deployment_id:depId,
    readiness:{band:'unknown',basis:'unknown',ready_quantity: quantity.unit === 'capacity_unit' ? unknownCapacity('Program total does not establish currently available capacity.') : quantity.unit === 'equipment_item' ? unknownItem('Inventory category does not establish ready quantity.') : unknownPlatform('Inventory category total does not establish ready quantity.'),mobilization_delay_hours:null,limiting_factors:['Readiness and current allocation are not established by aggregate inventory evidence.']},
    maintenance:{state:maintenanceState,quantity: quantity.unit === 'capacity_unit' ? unknownCapacity('Current maintenance allocation is not established.') : quantity.unit === 'equipment_item' ? unknownItem('Current maintenance allocation is not established.') : unknownPlatform('Current maintenance allocation is not established.'),maintenance_record_ids:[`maintenance_usa_${slug}_unknown_state`]},
    counting_scope:{scope_kind:parent ? 'inventory_pool':'national_total',scope_id:invId,parent_inventory_record_id:parent,mutually_exclusive_with:siblings}, individual_platform_ids:[], construction_record_ids:[], conservation_record_id:consId,
    temporal_validity:{valid_from:asOf,valid_to:null,as_of:asOf,observed_at:null,review_after:'2025-10-01T00:00:00Z'}, provenance:provenance(sourceIds), notes:'National accounting pool. No exact current position, route, mission, or readiness is represented.'
  });
  deployments.push({deployment_id:depId,country_id:'country_usa',controller_id:'country_usa',entity_type:'inventory_pool',entity_id:invId,quantity,assignment:'unknown',command_organization_id:orgId,availability_state:'unknown',location:{location_status:'unknown',crs:'EPSG:4326'},movement:{state:'unknown',route_id:null,origin_location_id:null,destination_location_id:null,departed_at:null,estimated_arrival:null},commitment:{commitment_kind:'unknown',operation_or_event_id:null,release_constraints:['National aggregate cannot execute a mission until a conserved child allocation and all support dependencies are resolved.']},support_dependency_ids:[],temporal_validity:{valid_from:asOf,valid_to:null,as_of:asOf,observed_at:null,review_after:'2025-10-01T00:00:00Z'},stale_after:'2025-10-01T00:00:00Z',provenance:provenance(sourceIds),notes:'Accounting deployment only. Unknown national disposition is explicit and no movement is implied.'});
  maintenance.push({maintenance_record_id:`maintenance_usa_${slug}_unknown_state`,country_id:'country_usa',subject_type:'inventory_pool',subject_id:invId,maintenance_kind:'other',state:'unknown',quantity:quantity.unit==='capacity_unit'?unknownCapacity('No source establishes the current maintenance subset.'):quantity.unit==='equipment_item'?unknownItem('No source establishes the current maintenance subset.'):unknownPlatform('No source establishes the current maintenance subset.'),started_at:null,completion_estimate:{kind:'unknown'},facility_id:null,readiness_effect:'unknown',dependency_ids:[],resulting_equipment_type_id:null,temporal_validity:{valid_from:asOf,valid_to:null,as_of:asOf,observed_at:null,review_after:'2025-10-01T00:00:00Z'},provenance:provenance(sourceIds,[],'unknown','low','Explicit unknown record prevents absent maintenance evidence from being interpreted as zero.'),notes:'No current maintenance quantity is asserted.'});
  const state = quantity.kind==='exact'?'balanced':quantity.kind==='range'?'balanced_with_ranges':'blocked_by_unknowns';
  conservation.push({conservation_record_id:consId,country_id:'country_usa',equipment_type_id:equipmentId,scope:{scope_kind:'inventory_pool',scope_id:invId,parent_conservation_record_id:null,exclusion_rule:parent?'Child category is mutually exclusive with siblings and is not added to its parent in cross pool totals.':'This scope is a standalone national pool; child records are reconciliation detail and are not summed twice.'},counting_unit:quantity.unit,period:{opening_at:asOf,closing_at:asOf},opening_inventory:quantity,inflows:[],closing_states:[{accounting_state:'unknown',quantity,inventory_record_ids:[invId]}],outflows:[],result:{state,residual_kind:quantity.kind==='exact'?'exact':quantity.kind==='range'?'range':'unknown',...(quantity.kind==='exact'?{residual_value:0}:quantity.kind==='range'?{residual_minimum:0,residual_maximum:0}:{}),unresolved_record_ids:quantity.kind==='unknown'?[invId]:[]},provenance:provenance(sourceIds),notes:'Opening and closing bookmark are identical. This conservation identity proves the pool is accounted for, not that it is ready or geographically resolved.'});
};

const aircraftParent = 'inventory_usa_air_force_aircraft_total_inventory';
addPool({slug:'air_force_aircraft_total_inventory',display:'USAF estimated FY2025 total aircraft inventory',service:'air_force',equipmentId:'equipment_category_usa_aircraft_total_inventory',domain:'air',category:'aircraft total inventory',quantity:exactPlatform(4832,'Estimated FY2025 total aircraft inventory; parent total is reconciliation only and must not be added to its mission category children.'),orgId:'organization_usa_air_force',sourceIds:['src_force_usa_crs_air_force_inventory_2025']});
const aircraftSlugs = Object.keys(exactAircraft).map((key)=>`inventory_usa_air_force_${key}`);
for (const [slug,value] of Object.entries(exactAircraft)) addPool({slug:`air_force_${slug}`,display:`USAF estimated FY2025 ${slug.replaceAll('_',' ')} aircraft inventory`,service:'air_force',equipmentId:`equipment_category_usa_air_force_${slug}`,domain:'air',category:slug.replaceAll('_',' '),quantity:exactPlatform(value,'Estimated FY2025 total aircraft inventory mission category. Mission categories reconcile exactly to 4,832.'),orgId:'organization_usa_air_force',sourceIds:['src_force_usa_crs_air_force_inventory_2025'],parent:aircraftParent,siblings:aircraftSlugs.filter((id)=>id!==`inventory_usa_air_force_${slug}`)});
addPool({slug:'air_force_tanker_subset',display:'USAF tanker subset of mobility inventory',service:'air_force',equipmentId:'equipment_category_usa_air_force_tanker_subset',domain:'air',category:'tanker aircraft subset',quantity:unknownPlatform('The accepted source combines tanker and airlift aircraft in a 1,191 platform mobility category and does not publish a bookmark exact split.'),orgId:'organization_usa_air_force',sourceIds:['src_force_usa_crs_air_force_inventory_2025'],parent:'inventory_usa_air_force_mobility',siblings:['inventory_usa_air_force_airlift_subset']});
addPool({slug:'air_force_airlift_subset',display:'USAF airlift subset of mobility inventory',service:'air_force',equipmentId:'equipment_category_usa_air_force_airlift_subset',domain:'air',category:'airlift aircraft subset',quantity:unknownPlatform('The accepted source combines tanker and airlift aircraft in a 1,191 platform mobility category and does not publish a bookmark exact split.'),orgId:'organization_usa_air_force',sourceIds:['src_force_usa_crs_air_force_inventory_2025'],parent:'inventory_usa_air_force_mobility',siblings:['inventory_usa_air_force_tanker_subset']});
addPool({slug:'navy_battle_force_ship',display:'United States Navy battle force ship national range',service:'navy',equipmentId:'equipment_category_usa_navy_battle_force_ship',domain:'maritime',category:'battle force ship',quantity:rangePlatform(287,296,'Bounded by the FY2025 request and FY2024 actual count; later retrospective reports conflict on exact October totals, so 1 September remains a range.'),orgId:'organization_usa_navy',sourceIds:['src_force_usa_crs_navy_force_structure_2025']});
addPool({slug:'army_training_rotation_capacity',display:'Army FY2025 funded combat training center rotation plan',service:'army',equipmentId:'equipment_category_usa_army_training_rotation_capacity',domain:'ground',category:'training rotation capacity',quantity:exactCapacity(22,'FY2025 budget plan: 8 NTC, 8 JRTC, 4 JMRC, and 2 exportable Pacific rotations. This is annual planned throughput, not equipment.'),orgId:'organization_usa_army',sourceIds:['src_force_usa_army_budget_overview_2025']});
for (const [slug,display,service,equipmentId,domain,category,orgId,sourceIds,unit] of [
  ['army_equipment_unresolved','Army major equipment national pool', 'army','equipment_category_usa_army_major_equipment','ground','major ground equipment','organization_usa_army',['src_force_usa_army_budget_overview_2025'],'equipment_item'],
  ['marine_equipment_unresolved','Marine Corps major equipment national pool','marine','equipment_category_usa_marine_major_equipment','joint','major Marine Corps equipment','organization_usa_marine_corps',['src_force_usa_crs_fy2025_force_structure'],'equipment_item'],
  ['space_systems_unresolved','Space Force military space systems national pool','space','equipment_category_usa_military_space_system','space','military space systems','organization_usa_space_force',['src_force_usa_crs_air_force_2025'],'equipment_item'],
  ['coast_guard_platforms_unresolved','Coast Guard cutters and aircraft national pool','coast_guard','equipment_category_usa_coast_guard_national_security_cutter','maritime','Coast Guard platforms','organization_usa_coast_guard',['src_force_usa_coast_guard_budget_2025'],'platform'],
]) addPool({slug,display,service,equipmentId,domain,category,quantity:unit==='equipment_item'?unknownItem('Public source confirms the capability and program but this packet has not accepted a complete mutually exclusive national count.'):unknownPlatform('Public source confirms the capability and program but this packet has not accepted a complete mutually exclusive national count.'),orgId,sourceIds});
writeNdjson('inventory.ndjson',inventory); writeNdjson('deployments.ndjson',deployments); writeNdjson('maintenance.ndjson',maintenance); writeNdjson('conservation.ndjson',conservation);

const construction = [
  {construction_record_id:'construction_usa_army_fy2025_barracks_program',country_id:'country_usa',customer_id:'organization_usa_army',equipment_type_id:'equipment_category_usa_army_barracks_project',platform_id:null,program_or_lot:'FY2025 barracks projects',quantity_ordered:exactCapacity(9,'FY2025 budget plan: seven Active Army and two Army Reserve barracks projects.'),quantity_delivered:unknownCapacity('No bookmark source establishes completed projects.'),quantity_accepted:unknownCapacity('No bookmark source establishes accepted projects.'),state:'planned',producer_ids:['institution_usa_army_installations'],production_site_ids:[],milestones:[{milestone_type:'authorized',date_kind:'official_plan',date:'2025-01-01'}],temporal_validity:tv('2025-01-01'),provenance:provenance(['src_force_usa_army_budget_overview_2025']),notes:'Program envelope only. It is not counted as completed installation capacity.'},
  {construction_record_id:'construction_usa_coast_guard_nsc_11',country_id:'country_usa',customer_id:'organization_usa_coast_guard',equipment_type_id:'equipment_category_usa_coast_guard_national_security_cutter',platform_id:null,program_or_lot:'National Security Cutter number 11',quantity_ordered:exactPlatform(1,'The FY2025 justification continues construction and post delivery activity for the eleventh cutter.'),quantity_delivered:unknownPlatform('Delivery status at 1 September 2025 is not accepted by this packet.'),quantity_accepted:unknownPlatform('Acceptance status at 1 September 2025 is not accepted by this packet.'),state:'under_construction',producer_ids:['institution_usa_coast_guard_acquisition'],production_site_ids:[],milestones:[{milestone_type:'construction_started',date_kind:'official_plan',date:null}],temporal_validity:tv('2024-01-01'),provenance:provenance(['src_force_usa_coast_guard_budget_2025']),notes:'Individual hull name and location are not required for this national program record.'},
  {construction_record_id:'construction_usa_coast_guard_wcc_fy2025',country_id:'country_usa',customer_id:'organization_usa_coast_guard',equipment_type_id:'equipment_category_usa_coast_guard_waterways_commerce_cutter',platform_id:null,program_or_lot:'FY2025 Waterways Commerce Cutter procurement',quantity_ordered:exactPlatform(3,'FY2025 procurement request for three waterways commerce cutters.'),quantity_delivered:unknownPlatform('No bookmark source establishes delivered quantity.'),quantity_accepted:unknownPlatform('No bookmark source establishes accepted quantity.'),state:'planned',producer_ids:['institution_usa_coast_guard_acquisition'],production_site_ids:[],milestones:[{milestone_type:'authorized',date_kind:'official_plan',date:'2025-01-01'}],temporal_validity:tv('2025-01-01'),provenance:provenance(['src_force_usa_coast_guard_budget_2025']),notes:'Budget plan, not opening inventory.'},
];
writeNdjson('construction.ndjson',construction);

const claims = [];
for (const [id,[value,rule]] of Object.entries(authorized)) claims.push({claim_id:`claim_usa_fy2025_authorized_end_strength_${id.replace('organization_usa_','')}`,subject_id:id,predicate:'authorized_end_strength',value,unit:'person',as_of:asOf,valid_from:'2025-01-01',evidence_state:'official_claim',confidence:'high',confidence_reason:rule,source_ids:['src_force_usa_public_law_118_159_fy2025_ndaa'],simulation_use:'Authorized ceiling only; assigned and deployable personnel remain unknown.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:'2026-11-06'});
claims.push(
  {claim_id:'claim_usa_air_force_total_aircraft_inventory_4832',subject_id:'inventory_usa_air_force_aircraft_total_inventory',predicate:'estimated_total_aircraft_inventory',value:4832,unit:'platform',as_of:asOf,evidence_state:'independently_reported',confidence:'high',confidence_reason:'CRS reports an estimated FY2025 mission category total that internally sums to 4,832.',source_ids:['src_force_usa_crs_air_force_inventory_2025'],contradiction_set_id:'contradiction_usa_air_force_total_inventory_definitions_2025',simulation_use:'National reconciliation parent only.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:'2026-11-06'},
  {claim_id:'claim_usa_air_force_component_inventory_4903',subject_id:'organization_usa_air_force',predicate:'requested_component_aircraft_inventory_sum',value:4903,unit:'platform',as_of:'2024-04-16',evidence_state:'independently_reported',confidence:'medium',confidence_reason:'CRS force structure table sums active 3,735, reserve 290, and guard 878 using a different request era component definition.',source_ids:['src_force_usa_crs_fy2025_force_structure'],contradiction_set_id:'contradiction_usa_air_force_total_inventory_definitions_2025',simulation_use:'Contradiction only; do not use as the September opening inventory.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:'2026-11-06'},
  {claim_id:'claim_usa_navy_fy2025_requested_battle_force_287',subject_id:'inventory_usa_navy_battle_force_ship',predicate:'requested_battle_force_ships',value:287,unit:'platform',as_of:'2024-03-11',evidence_state:'independently_reported',confidence:'high',confidence_reason:'FY2025 requested fleet total.',source_ids:['src_force_usa_crs_navy_force_structure_2025'],contradiction_set_id:'contradiction_usa_navy_battle_force_bookmark_total_2025',simulation_use:'Lower bound only.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:'2026-11-06'},
  {claim_id:'claim_usa_navy_fy2024_actual_battle_force_296',subject_id:'inventory_usa_navy_battle_force_ship',predicate:'fy2024_actual_battle_force_ships',value:296,unit:'platform',as_of:'2024-09-30',evidence_state:'independently_reported',confidence:'high',confidence_reason:'Prior fiscal year actual fleet total.',source_ids:['src_force_usa_crs_navy_force_structure_2025'],contradiction_set_id:'contradiction_usa_navy_battle_force_bookmark_total_2025',simulation_use:'Upper bound only until a bookmark exact count is independently reconciled.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:'2026-11-06'},
  {claim_id:'claim_usa_army_ctc_rotations_22',subject_id:'inventory_usa_army_training_rotation_capacity',predicate:'planned_annual_combat_training_center_rotations',value:22,unit:'capacity_unit',as_of:'2025-01-01',evidence_state:'official_claim',confidence:'high',confidence_reason:'Official FY2025 Army budget plan.',source_ids:['src_force_usa_army_budget_overview_2025'],simulation_use:'Annual throughput plan, not guaranteed completed rotations.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:'2026-11-06'},
);
writeNdjson('claims.ndjson',claims);
writeNdjson('contradictions.ndjson',[
  {contradiction_set_id:'contradiction_usa_air_force_total_inventory_definitions_2025',question:'Which FY2025 aircraft total is comparable at the 1 September 2025 bookmark?',claim_ids:['claim_usa_air_force_total_aircraft_inventory_4832','claim_usa_air_force_component_inventory_4903'],source_ids:['src_force_usa_crs_air_force_inventory_2025','src_force_usa_crs_fy2025_force_structure'],status:'partially_reconciled',resolution:'The 4,832 mission category total is internally conserved as the opening taxonomy. The 4,903 request era component sum is preserved but excluded because definitions and vintages are not shown to be comparable.',simulation_rule:'Use 4,832 only as a national parent total. Do not combine either total with the other or infer component allocations.',last_reviewed:'2026-08-06',review_after:'2026-11-06'},
  {contradiction_set_id:'contradiction_usa_navy_battle_force_bookmark_total_2025',question:'What was the exact battle force ship total on 1 September 2025?',claim_ids:['claim_usa_navy_fy2025_requested_battle_force_287','claim_usa_navy_fy2024_actual_battle_force_296'],source_ids:['src_force_usa_crs_navy_force_structure_2025'],status:'open',resolution:'The source establishes request and prior actual values but not a contemporaneous September exact. The ledger therefore carries 287 through 296.',simulation_rule:'Sample or scenario select within the range only after an explicit reconciliation exception; never collapse the range to zero or a preferred midpoint.',last_reviewed:'2026-08-06',review_after:'2026-11-06'},
]);

// Rebuild incident edge and inventory references from the final graph. This prevents
// removed relationships or superseded pools from surviving as dangling references.
for (const organization of organizations) {
  organization.relationship_record_ids = [];
  organization.inventory_record_ids = [];
}
for (const relationship of relationships) {
  orgById.get(relationship.source_organization_id)?.relationship_record_ids.push(relationship.relationship_id);
  orgById.get(relationship.target_organization_id)?.relationship_record_ids.push(relationship.relationship_id);
}
for (const pool of inventory) orgById.get(pool.organization_id)?.inventory_record_ids.push(pool.inventory_record_id);
writeNdjson('organizations.ndjson', organizations);

const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
manifest.scope.coverage_matrix = [
  {coverage_id:'coverage_usa_statutory_command_and_guard',service:'joint',domain:'joint',organization_depth:'structured',equipment_taxonomy:'identified',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'identified',conservation:'structured',notes:'Operational chain and state versus federal Guard authority modeled; individual state organizations remain aggregate.'},
  {coverage_id:'coverage_usa_air_force_national_inventory',service:'air_force',domain:'air',organization_depth:'structured',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'not_started',conservation:'structured',notes:'Mission categories conserve to 4,832. Tanker and airlift split, readiness, and component allocation remain unknown.'},
  {coverage_id:'coverage_usa_navy_battle_force',service:'navy',domain:'maritime',organization_depth:'identified',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'identified',conservation:'structured',notes:'Battle force ship total is range bounded; class breakdown and readiness remain unaccepted.'},
  {coverage_id:'coverage_usa_army_force_and_training',service:'army',domain:'ground',organization_depth:'identified',equipment_taxonomy:'identified',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'identified',conservation:'structured',notes:'Personnel authorization and annual CTC plan accepted; equipment inventories and actual completed throughput remain unknown.'},
  {coverage_id:'coverage_usa_marine_corps_national_force',service:'marine',domain:'joint',organization_depth:'identified',equipment_taxonomy:'identified',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'not_started',conservation:'structured',notes:'Authorized personnel accepted; mutually exclusive national equipment inventory remains unknown.'},
  {coverage_id:'coverage_usa_space_force_national_force',service:'space',domain:'space',organization_depth:'identified',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'not_started',conservation:'structured',notes:'Authorized personnel accepted; platform counts remain unknown where public evidence is incomplete or sensitive.'},
  {coverage_id:'coverage_usa_coast_guard_national_force',service:'coast_guard',domain:'maritime',organization_depth:'identified',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'identified',conservation:'structured',notes:'Budget supported military positions and selected acquisition lots accepted; whole fleet inventory remains unknown.'},
];
manifest.reconciliation = {state:'blocked_by_unknowns',organization_records:organizations.length,platform_records:0,equipment_type_records:equipment.length,inventory_records:inventory.length,deployment_records:deployments.length,maintenance_records:maintenance.length,construction_records:construction.length,conservation_records:conservation.length,exact_quantity_records:inventory.filter((r)=>r.quantity.kind==='exact').length,range_quantity_records:inventory.filter((r)=>r.quantity.kind==='range').length,unknown_quantity_records:inventory.filter((r)=>r.quantity.kind==='unknown').length,open_conservation_exceptions:inventory.filter((r)=>r.quantity.kind==='unknown').length,double_booking_exceptions:0,orphan_platform_records:0,orphan_organization_records:0,expired_records:0,relationship_records:relationships.length};
manifest.source_ids = sourceRows.map((row)=>row.source_id);
manifest.unknowns = [
  'Assigned and deployable personnel remain unknown; statutory authorization and budget supported positions are not readiness measures.',
  'Army and Marine Corps major equipment totals remain collecting and are never represented as zero.',
  'Tanker and airlift subsets of the 1,191 aircraft mobility category remain unknown pending a source with compatible definitions.',
  'Navy battle force exact bookmark total, class decomposition, maintenance allocation, and readiness remain unresolved.',
  'Space Force platform counts remain unknown where public aggregate evidence is incomplete or unsuitable for a safe national ledger.',
  'Coast Guard whole fleet count and current maintenance allocation remain unknown; selected planned acquisition lots are not opening inventory.',
  'Individual state Guard organizations, status transitions, and mobilization delays remain uncollected below the national authority model.',
];
manifest.notes = 'Second United States national packet: statutory operational chain, Guard state and federal status, enacted personnel authorities, selected national inventory pools, planned training throughput, and selected construction programs. It deliberately excludes exact present locations, actionable movement, and unsupported readiness.';
manifest.acceptance = {schema_valid:true,internally_consistent:true,research_complete:false,decision_usable:false,simulation_ready:false,untested_claims:['Exact Navy bookmark total and several service equipment categories require independent reconciliation.','Current readiness, maintenance allocation, and mission support availability remain untested.'],blockers:['Army, Marine Corps, Space Force, and Coast Guard mutually exclusive equipment totals are incomplete.','Tanker versus airlift allocation is unknown.','No mission may draw from national aggregates without a conserved child allocation and resolved support package.']};
fs.writeFileSync(path.join(root,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`);

console.log(JSON.stringify({organizations:organizations.length,relationships:relationships.length,equipment:equipment.length,inventory:inventory.length,deployments:deployments.length,maintenance:maintenance.length,construction:construction.length,conservation:conservation.length,claims:claims.length,sources:sourceRows.length},null,2));
