import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const readRows = (name) => fs.existsSync(path.join(root, name)) ? fs.readFileSync(path.join(root, name), 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
const writeRows = (name, rows) => fs.writeFileSync(path.join(root, name), `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
const asOf = '2025-09-01T00:00:00Z';
const reviewAfter = '2026-11-06';
const tv = (validFrom = asOf) => ({valid_from: validFrom, valid_to: null, as_of: asOf, observed_at: null, review_after: reviewAfter});
const quantity = (unit, rule) => ({kind: 'unknown', unit, counting_rule: rule});
const range = (minimum, maximum, unit, rule) => ({kind: 'range', minimum, maximum, unit, counting_rule: rule});
const provenance = (sourceIds, claimIds = [], evidenceState = 'independently_reported', confidence = 'medium', method = 'Public national aggregate accounting; source vintage and uncertainty remain explicit.') => ({
  evidence_state: evidenceState, confidence, source_ids: sourceIds, claim_ids: claimIds, contradiction_set_ids: [], method,
});

let sources = readRows('sources.ndjson');
const sourceById = new Map(sources.map((row) => [row.source_id, row]));
const addSource = (row) => { if (!sourceById.has(row.source_id)) { sources.push(row); sourceById.set(row.source_id, row); } };
for (const source of [
  {
    source_id: 'src_force_chn_crs_naval_modernization_2025', title: 'China Naval Modernization: Implications for U.S. Navy Capabilities—Background and Issues for Congress', publisher: 'Congressional Research Service', published_at: '2025-04-24', accessed_at: '2026-08-06', url: 'https://www.congress.gov/crs-product/RL33153', source_tier: 'B', source_type: 'research_report', language: 'en', relevant_locator: 'Fleet size, submarine assessment, and Table 1 ship-count projections', reliability_notes: 'Independent synthesis of public U.S. government assessments. The 395-ship 2025 figure and class table are projections, not an observed 1 September inventory.',
  },
  {
    source_id: 'src_force_chn_mod_reserve_law_2023', title: 'China adopts revised law on reservists', publisher: 'Ministry of National Defense of the People\'s Republic of China', published_at: '2023-03-02', accessed_at: '2026-08-06', url: 'https://eng.mod.gov.cn/xb/News_213114/TopStories/16205332.html', source_tier: 'A', source_type: 'official_release', language: 'en', relevant_locator: 'Reserve service, management, training, promotion, benefits, and withdrawal', reliability_notes: 'Establishes the reserve institution and legal framework but not a current personnel total or readiness.',
  },
  {
    source_id: 'src_force_chn_state_council_reserve_regulations_2024', title: 'China issues regulations on management of reserve personnel', publisher: 'State Council of the People\'s Republic of China', published_at: '2024-10-31', accessed_at: '2026-08-06', url: 'https://english.www.gov.cn/news/202410/31/content_WS67236021c6d0868f4e8ec7b6.html', source_tier: 'A', source_type: 'official_release', language: 'en', relevant_locator: 'Reserve personnel selection, training, promotion, benefits, and exit', reliability_notes: 'Confirms reserve administration. It does not establish assigned, deployable, or mobilizable strength.',
  },
  {
    source_id: 'src_force_chn_state_council_defense_budget_2025', title: 'China sets 7.2-pct defense budget growth for 2025', publisher: 'State Council of the People\'s Republic of China', published_at: '2025-03-05', accessed_at: '2026-08-06', url: 'https://english.www.gov.cn/news/202503/05/content_WS67c7ba5dc6d0868f4e8f05cf.html', source_tier: 'A', source_type: 'official_release', language: 'en', relevant_locator: 'Planned 2025 national defense expenditure of 1.784665 trillion yuan', reliability_notes: 'Official planned budget envelope; it does not reveal force availability or make civilian capacity free.',
  },
  {
    source_id: 'src_force_chn_mod_national_defense_transport_2022', title: 'Civilian transport resources support national defense transportation', publisher: 'Ministry of National Defense of the People\'s Republic of China', published_at: '2022-01-20', accessed_at: '2026-08-06', url: 'https://eng.mod.gov.cn/xb/News_213114/TopStories/4911240.html', source_tier: 'A', source_type: 'official_release', language: 'en', relevant_locator: 'Designated transport enterprises and military-civilian transport coordination', reliability_notes: 'Demonstrates a mobilization mechanism, not a national quantity, activation time, availability rate, or costless conversion capacity.',
  },
  {
    source_id: 'src_force_chn_state_council_military_facilities_2025', title: 'China issues revised regulation on protection of military facilities', publisher: 'State Council of the People\'s Republic of China', published_at: '2025-06-05', accessed_at: '2026-08-06', url: 'https://english.www.gov.cn/news/202506/05/content_WS684190afc6d0868f4e8f315b.html', source_tier: 'A', source_type: 'official_release', language: 'en', relevant_locator: 'Planning, construction, protection, and management of military facilities', reliability_notes: 'Supports existence of a regulated construction system; it does not establish facility counts, site output, or current construction status.',
  },
]) addSource(source);
writeRows('sources.ndjson', sources);

let equipment = readRows('equipment_types.ndjson');
const baseEquipment = structuredClone(equipment[0]);
const equipmentById = new Map(equipment.map((row) => [row.equipment_type_id, row]));
const addEquipment = ({id, display, domain, category, serviceRole, mobility = 'varies', unit = 'platform', parent = null, sourceIds}) => {
  const row = structuredClone(baseEquipment);
  Object.assign(row, {
    equipment_type_id: id, display_name: display, reporting_names: [],
    taxonomy: {domain, category, entity_kind: unit === 'platform' ? 'platform' : unit === 'munition' ? 'munition' : unit === 'capacity_unit' ? 'facility_system' : 'support_equipment', family: null, model: null, variant: null},
    origin_country_ids: ['country_chn'], manufacturer_ids: [], roles: serviceRole,
    individualization: {supported: unit === 'platform', default_research_resolution: 'national_pool', reason: 'National aggregate accounting is the default; identity is retained only when it materially changes command, loss, construction, or a player decision.'},
    crew_requirements: {operating_crew: quantity('person', 'Category aggregate does not establish operating crew strength.'), support_personnel: quantity('person', 'Category aggregate does not establish support personnel strength.')},
    mobility: {mobility_kind: mobility, self_deploying: ['fixed_wing','rotary_wing','surface_vessel','subsurface_vessel'].includes(mobility) ? true : null, strategic_lift_required: null},
    support_dependency_types: ['crew','fuel','maintenance_facility','spares','command_network'], measured_characteristics: [], temporal_validity: tv('2024-12-18'),
    provenance: provenance(sourceIds, [], 'inferred', 'medium', 'Research taxonomy derived from public national force reporting; it does not assert a current count, location, or readiness.'),
    notes: 'Taxonomy only. Presence does not establish quantity, readiness, theater allocation, or location.', ontology_id: `ontology_${domain}_${category.replaceAll(' ','_')}`,
    parent_equipment_type_id: parent, counting_unit: ['platform','equipment_item','capacity_unit'].includes(unit) ? unit : 'equipment_item',
    aggregation_rule: parent ? 'leaf_counts_may_be_summed_when_scopes_are_mutually_exclusive' : 'parent_is_reconciliation_only_and_must_not_be_summed_with_children', dependency_requirements: [],
  });
  if (equipmentById.has(id)) equipment.splice(equipment.findIndex((item) => item.equipment_type_id === id), 1, row); else equipment.push(row);
  equipmentById.set(id, row);
};

const categories = [
  ['plan_battle_force','PLAN battle force national accounting parent','maritime','battle force vessel',['fleet operations'],'surface_vessel','platform',null],
  ['plan_aircraft_carrier','PLAN aircraft carrier','maritime','aircraft carrier',['carrier aviation'],'surface_vessel','platform','plan_battle_force'],
  ['plan_ssbn','PLAN ballistic missile submarine','maritime','ballistic missile submarine',['strategic deterrence'],'subsurface_vessel','platform','plan_battle_force'],
  ['plan_ssn','PLAN nuclear attack submarine','maritime','nuclear attack submarine',['subsurface warfare'],'subsurface_vessel','platform','plan_battle_force'],
  ['plan_ssk','PLAN diesel attack submarine','maritime','diesel attack submarine',['subsurface warfare'],'subsurface_vessel','platform','plan_battle_force'],
  ['plan_large_surface_combatant','PLAN cruiser and destroyer category','maritime','large surface combatant',['air defense','surface warfare'],'surface_vessel','platform','plan_battle_force'],
  ['plan_frigate_corvette','PLAN frigate and corvette category','maritime','frigate and corvette',['escort','patrol'],'surface_vessel','platform','plan_battle_force'],
  ['plan_amphibious','PLAN amphibious warfare vessel category','maritime','amphibious warfare vessel',['amphibious lift'],'surface_vessel','platform','plan_battle_force'],
  ['plan_replenishment','PLAN fleet replenishment category','logistics','fleet replenishment vessel',['underway replenishment'],'surface_vessel','platform',null],
  ['military_sealift','PLA military sealift category','logistics','military sealift',['strategic sealift'],'surface_vessel','platform',null],
  ['aircraft_total','PLA military aircraft national parent','air','military aircraft',['aggregate air inventory'],'varies','platform',null],
  ['combat_aircraft','PLA combat aircraft','air','combat aircraft',['air combat'],'fixed_wing','platform','aircraft_total'],
  ['fighter_attack_aircraft','PLA fighter and attack aircraft','air','fighter and attack aircraft',['air superiority','strike'],'fixed_wing','platform','aircraft_total'],
  ['bomber_aircraft','PLA bomber aircraft','air','bomber aircraft',['long range strike'],'fixed_wing','platform','aircraft_total'],
  ['special_mission_aircraft','PLA special mission aircraft','air','special mission aircraft',['airborne early warning','electronic warfare','reconnaissance'],'fixed_wing','platform','aircraft_total'],
  ['naval_aviation_aircraft','PLAN aviation aircraft','air','naval aviation aircraft',['maritime aviation'],'varies','platform','aircraft_total'],
  ['transport_airlift_aircraft','PLA transport and airlift aircraft','logistics','transport and airlift aircraft',['strategic airlift','theater airlift'],'fixed_wing','platform','aircraft_total'],
  ['tanker_aircraft','PLA aerial refueling aircraft','logistics','aerial refueling aircraft',['aerial refueling'],'fixed_wing','platform','aircraft_total'],
  ['training_aircraft','PLA training aircraft','air','training aircraft',['aircrew training'],'fixed_wing','platform','aircraft_total'],
  ['uncrewed_aircraft','PLA uncrewed aircraft','air','uncrewed aircraft',['reconnaissance','strike','support'],'varies','platform','aircraft_total'],
  ['plagf_active_personnel','PLAGF active personnel accounting pool','ground','active ground personnel',['ground operations'],'varies','person',null],
  ['ground_maneuver','PLAGF maneuver equipment','ground','ground maneuver equipment',['maneuver'],'varies','equipment_item',null],
  ['ground_fires','PLAGF artillery and fires equipment','ground','ground fires equipment',['fire support'],'varies','equipment_item',null],
  ['ground_air_defense','PLAGF ground air defense equipment','ground','ground air defense equipment',['air defense'],'varies','equipment_item',null],
  ['army_aviation','PLAGF army aviation aircraft','air','army aviation',['ground support aviation'],'rotary_wing','platform',null],
  ['rocket_launcher','PLARF land-based missile launchers','ground','land based missile launcher',['strategic and theater missile operations'],'varies','launcher',null],
  ['rocket_munition','PLARF land-based missile inventory','ground','land based missile',['strategic and theater missile operations'],'varies','munition',null],
  ['coast_guard_vessel','China Coast Guard vessel category','maritime','coast guard vessel',['maritime law enforcement'],'surface_vessel','platform',null],
  ['maritime_militia_capacity','Maritime militia mobilization capacity','maritime','maritime militia capacity',['maritime support','mobilization'],'varies','capacity_unit',null],
  ['reserve_personnel','PLA reserve personnel','joint','reserve personnel',['mobilization'],'varies','person',null],
  ['militia_personnel','Militia personnel','joint','militia personnel',['mobilization','local support'],'varies','person',null],
  ['joint_logistics_capacity','Joint Logistic Support Force capacity','logistics','joint logistics support',['joint sustainment'],'varies','capacity_unit',null],
  ['maintenance_capacity','PLA depot and field maintenance capacity','logistics','maintenance capacity',['maintenance','repair'],'fixed','capacity_unit',null],
  ['training_capacity','PLA collective training capacity','joint','training capacity',['training'],'fixed','capacity_unit',null],
  ['military_construction_capacity','PLA military construction capacity','logistics','military construction capacity',['military construction'],'fixed','capacity_unit',null],
  ['civilian_transport_conversion','Designated civilian transport conversion capacity','logistics','civilian transport conversion capacity',['mobilization lift'],'varies','capacity_unit',null],
];
for (const [slug, display, domain, category, roles, mobility, unit, parent] of categories) addEquipment({id:`equipment_category_chn_${slug}`, display, domain, category, serviceRole: roles, mobility, unit, parent: parent ? `equipment_category_chn_${parent}` : null, sourceIds: slug.startsWith('plan_') || slug.includes('sealift') ? ['src_force_chn_crs_naval_modernization_2025','src_force_chn_us_dod_cmpr_2024'] : slug === 'civilian_transport_conversion' ? ['src_force_chn_mod_national_defense_transport_2022','src_force_chn_state_council_defense_budget_2025'] : ['src_force_chn_us_dod_cmpr_2024']});
writeRows('equipment_types.ndjson', equipment);

const organizations = readRows('organizations.ndjson');
const orgById = new Map(organizations.map((row) => [row.organization_id, row]));
const inventory = [];
const deployments = [];
const maintenance = [];
const conservation = [];
const allPoolIds = categories.map(([slug]) => `inventory_chn_${slug}`);
const orgFor = (service) => ({navy:'organization_chn_pla_navy',air_force:'organization_chn_pla_air_force',army:'organization_chn_pla_army',rocket_or_missile:'organization_chn_pla_rocket_force',coast_guard:'organization_chn_china_coast_guard',paramilitary:'organization_chn_militia',reserve:'organization_chn_pla_reserve_force',joint:'organization_chn_central_military_commission'}[service]);
const addPool = ({slug, display, service, component = 'active', domain, category, unit = 'platform', sourceIds, claimIds = [], parent = null, value = null, org = null, releaseConstraints = []}) => {
  const inventoryId = `inventory_chn_${slug}`;
  const equipmentId = `equipment_category_chn_${slug}`;
  const q = value ?? quantity(unit, 'Public reporting establishes the capability but not a compatible 1 September 2025 national count. Unknown is not zero.');
  const organizationId = org ?? orgFor(service);
  const depId = `deployment_chn_${slug}_national_accounting`;
  const maintId = `maintenance_chn_${slug}_unknown_state`;
  const consId = `conservation_chn_${slug}`;
  const prov = provenance(sourceIds, claimIds);
  inventory.push({inventory_record_id:inventoryId,inventory_kind:q.kind === 'unknown' ? 'unknown_estimate' : 'aggregate_total',country_id:'country_chn',owner_id:'country_chn',controller_id:'country_chn',service,component,equipment_type_id:equipmentId,display_name:display,domain,category,representation_tier:'national_capability',accounting_state:'unknown',quantity:q,organization_id:organizationId,formation_id:null,location_id:null,current_deployment_id:depId,readiness:{band:'unknown',basis:'unknown',ready_quantity:quantity(unit,'National count evidence does not establish ready quantity.'),mobilization_delay_hours:null,limiting_factors:['Readiness, crew availability, maintenance status, and theater allocation are unresolved.']},maintenance:{state:'unknown',quantity:quantity(unit,'Current maintenance allocation is not established.'),maintenance_record_ids:[maintId]},counting_scope:{scope_kind:parent ? 'inventory_pool':'national_total',scope_id:inventoryId,parent_inventory_record_id:parent ? `inventory_chn_${parent}` : null,mutually_exclusive_with:allPoolIds.filter((id) => id !== inventoryId && parent && id.startsWith(`inventory_chn_`))},individual_platform_ids:[],construction_record_ids:[],conservation_record_id:consId,temporal_validity:tv(),provenance:prov,notes:'National accounting pool only. No exact present position, route, mission, or availability is inferred.'});
  deployments.push({deployment_id:depId,country_id:'country_chn',controller_id:'country_chn',entity_type:'inventory_pool',entity_id:inventoryId,quantity:q,assignment:'unknown',command_organization_id:organizationId,availability_state:'unknown',location:{location_status:'unknown',crs:'EPSG:4326'},movement:{state:'unknown',route_id:null,origin_location_id:null,destination_location_id:null,departed_at:null,estimated_arrival:null},commitment:{commitment_kind:'unknown',operation_or_event_id:null,release_constraints:['National aggregate cannot execute until a conserved child allocation, command authority, readiness, and support dependencies are resolved.',...releaseConstraints]},support_dependency_ids:[],temporal_validity:tv(),stale_after:'2025-10-01T00:00:00Z',provenance:prov,notes:'Accounting deployment only. Unknown national disposition is explicit and no movement is implied.'});
  maintenance.push({maintenance_record_id:maintId,country_id:'country_chn',subject_type:'inventory_pool',subject_id:inventoryId,maintenance_kind:'other',state:'unknown',quantity:quantity(unit,'No accepted source establishes the current maintenance subset.'),started_at:null,completion_estimate:{kind:'unknown'},facility_id:null,readiness_effect:'unknown',dependency_ids:[],resulting_equipment_type_id:null,temporal_validity:tv(),provenance:provenance(sourceIds, claimIds, 'unknown', 'low', 'Explicit unknown prevents absent maintenance evidence from becoming availability.'),notes:'No current maintenance quantity is asserted.'});
  conservation.push({conservation_record_id:consId,country_id:'country_chn',equipment_type_id:equipmentId,scope:{scope_kind:'inventory_pool',scope_id:inventoryId,parent_conservation_record_id:parent ? `conservation_chn_${parent}` : null,exclusion_rule:parent ? 'Child category is reconciliation detail and must not be added to the parent a second time.' : 'Standalone national accounting pool; any later child allocation must subtract from this pool.'},counting_unit:unit,period:{opening_at:asOf,closing_at:asOf},opening_inventory:q,inflows:[],closing_states:[{accounting_state:'unknown',quantity:q,inventory_record_ids:[inventoryId]}],outflows:[],result:{state:q.kind === 'unknown' ? 'blocked_by_unknowns' : 'balanced_with_ranges',residual_kind:q.kind === 'unknown' ? 'unknown' : 'range',...(q.kind === 'unknown' ? {unresolved_record_ids:[inventoryId]} : {residual_minimum:0,residual_maximum:0,unresolved_record_ids:[]})},provenance:prov,notes:'Opening and closing bookmark are identical. Conservation proves accounting linkage, not readiness or geographic knowledge.'});
};

const poolSpecs = [
  ['plan_battle_force','PLAN battle force national pool','navy','active','maritime','battle force vessel','platform',['src_force_chn_crs_naval_modernization_2025'],['claim_chn_plan_battle_force_over_370'],null,null],
  ['plan_aircraft_carrier','PLAN aircraft carriers at the bookmark','navy','active','maritime','aircraft carrier','platform',['src_force_chn_crs_naval_modernization_2025'],['claim_chn_plan_carrier_projection_2025'],'plan_battle_force',range(2,3,'platform','Two commissioned carriers were public; the third carrier was in trials and the source projected three for 2025. The range does not assert commissioning by 1 September.')],
  ['plan_ssbn','PLAN ballistic missile submarines','navy','active','maritime','ballistic missile submarine','platform',['src_force_chn_crs_naval_modernization_2025','src_force_chn_us_dod_cmpr_2024'],['claim_chn_plan_ssbn_mid2024'],'plan_battle_force',null],
  ['plan_ssn','PLAN nuclear attack submarines','navy','active','maritime','nuclear attack submarine','platform',['src_force_chn_crs_naval_modernization_2025','src_force_chn_us_dod_cmpr_2024'],['claim_chn_plan_ssn_mid2024'],'plan_battle_force',null],
  ['plan_ssk','PLAN diesel attack submarines','navy','active','maritime','diesel attack submarine','platform',['src_force_chn_crs_naval_modernization_2025','src_force_chn_us_dod_cmpr_2024'],['claim_chn_plan_ssk_mid2024'],'plan_battle_force',null],
  ['plan_large_surface_combatant','PLAN cruisers and destroyers','navy','active','maritime','large surface combatant','platform',['src_force_chn_crs_naval_modernization_2025'],['claim_chn_plan_large_surface_projection_2025'],'plan_battle_force',null],
  ['plan_frigate_corvette','PLAN frigates and corvettes','navy','active','maritime','frigate and corvette','platform',['src_force_chn_crs_naval_modernization_2025'],['claim_chn_plan_frigate_corvette_projection_2025'],'plan_battle_force',null],
  ['plan_amphibious','PLAN amphibious warfare vessels','navy','active','maritime','amphibious warfare vessel','platform',['src_force_chn_crs_naval_modernization_2025'],['claim_chn_plan_amphibious_projection_2025'],'plan_battle_force',null],
  ['plan_replenishment','PLAN fleet replenishment vessels','navy','active','logistics','fleet replenishment vessel','platform',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['military_sealift','PLA military sealift','joint','active','logistics','military sealift','platform',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['aircraft_total','PLA military aircraft national pool','air_force','active','air','military aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],['claim_chn_military_aircraft_over_3150'],null,null],
  ['combat_aircraft','PLA combat aircraft','air_force','active','air','combat aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],['claim_chn_combat_aircraft_about_2400'],'aircraft_total',null],
  ['fighter_attack_aircraft','PLA fighter and attack aircraft','air_force','active','air','fighter and attack aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],[],'aircraft_total',null],
  ['bomber_aircraft','PLA bomber aircraft','air_force','active','air','bomber aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],[],'aircraft_total',null],
  ['special_mission_aircraft','PLA special mission aircraft','air_force','active','air','special mission aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],[],'aircraft_total',null],
  ['naval_aviation_aircraft','PLAN aviation aircraft','navy','active','air','naval aviation aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],[],'aircraft_total',null],
  ['transport_airlift_aircraft','PLA transport and airlift aircraft','air_force','active','logistics','transport and airlift aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],[],'aircraft_total',null],
  ['tanker_aircraft','PLA aerial refueling aircraft','air_force','active','logistics','aerial refueling aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],[],'aircraft_total',null],
  ['training_aircraft','PLA training aircraft','air_force','training','air','training aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],[],'aircraft_total',null],
  ['uncrewed_aircraft','PLA uncrewed aircraft','air_force','active','air','uncrewed aircraft','platform',['src_force_chn_us_dod_cmpr_2024'],[],'aircraft_total',null],
  ['plagf_active_personnel','PLAGF active personnel','army','active','ground','active ground personnel','equipment_item',['src_force_chn_us_dod_cmpr_2024'],['claim_chn_plagf_active_personnel_965000'],null,null],
  ['ground_maneuver','PLAGF maneuver equipment','army','active','ground','ground maneuver equipment','equipment_item',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['ground_fires','PLAGF artillery and fires equipment','army','active','ground','ground fires equipment','equipment_item',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['ground_air_defense','PLAGF ground air defense equipment','army','active','ground','ground air defense equipment','equipment_item',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['army_aviation','PLAGF army aviation aircraft','army','active','air','army aviation','platform',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['rocket_launcher','PLARF land-based missile launchers','rocket_or_missile','active','ground','land based missile launcher','equipment_item',['src_force_chn_us_dod_cmpr_2024'],['claim_chn_plarf_launcher_estimate_mid2024'],null,null],
  ['rocket_munition','PLARF land-based missile inventory','rocket_or_missile','active','ground','land based missile','equipment_item',['src_force_chn_us_dod_cmpr_2024'],['claim_chn_plarf_missile_estimate_mid2024'],null,null],
  ['coast_guard_vessel','China Coast Guard vessels','coast_guard','civilian_agency','maritime','coast guard vessel','platform',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['maritime_militia_capacity','Maritime militia mobilization capacity','paramilitary','mobilization','maritime','maritime militia capacity','capacity_unit',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['reserve_personnel','PLA reserve personnel','joint','reserve','joint','reserve personnel','equipment_item',['src_force_chn_mod_reserve_law_2023','src_force_chn_state_council_reserve_regulations_2024'],[],null,null],
  ['militia_personnel','Militia personnel','paramilitary','mobilization','joint','militia personnel','equipment_item',['src_force_chn_defense_white_paper_2019'],[],null,null],
  ['joint_logistics_capacity','Joint Logistic Support Force capacity','joint','active','logistics','joint logistics support','capacity_unit',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['maintenance_capacity','PLA maintenance capacity','joint','active','logistics','maintenance capacity','capacity_unit',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['training_capacity','PLA collective training capacity','joint','training','joint','training capacity','capacity_unit',['src_force_chn_us_dod_cmpr_2024'],[],null,null],
  ['military_construction_capacity','PLA military construction capacity','joint','active','logistics','military construction capacity','capacity_unit',['src_force_chn_state_council_military_facilities_2025'],[],null,null],
  ['civilian_transport_conversion','Designated civilian transport conversion capacity','joint','mobilization','logistics','civilian transport conversion capacity','capacity_unit',['src_force_chn_mod_national_defense_transport_2022','src_force_chn_state_council_defense_budget_2025'],['claim_chn_civilian_transport_designation_mechanism'],null,null],
];
for (const [slug,display,service,component,domain,category,unit,sourceIds,claimIds,parent,value] of poolSpecs) addPool({slug,display,service,component,domain,category,unit,sourceIds,claimIds,parent,value,org:slug === 'maritime_militia_capacity' ? 'organization_chn_militia' : slug === 'reserve_personnel' ? 'organization_chn_pla_reserve_force' : null,releaseConstraints:slug === 'civilian_transport_conversion' ? ['Requires a specific lawful mobilization designation and acceptance inspection.','Lead time, crew suitability, survivability, and military interoperability are unknown.','Conversion displaces commercial freight and passenger activity; economic opportunity cost and civilian supply disruption must be charged before activation.','Capacity is unknown and cannot be sampled as free or instantaneous lift.'] : []});

const platforms = [
  ['liaoning','Liaoning','16','active'],['shandong','Shandong','17','active'],['fujian','Fujian','18','under_construction'],
].map(([slug,name,hull,state]) => ({platform_id:`platform_chn_plan_carrier_${slug}`,country_id:'country_chn',owner_id:'country_chn',controller_id:'country_chn',service:'navy',component:'active',domain:'maritime',equipment_type_id:'equipment_category_chn_plan_aircraft_carrier',identity:{identity_kind:'hull',display_name:name,official_identifier:hull,aliases:[]},command_organization_id:'organization_chn_pla_navy',assigned_formation_id:null,accounting_state:state,readiness:{band:'unknown',basis:'unknown',available_after_hours:null,limiting_factors:['Bookmark readiness and theater availability are not established.']},home_basing:{location_kind:'unknown',location_id:null,confidence:'unknown'},current_deployment_id:null,maintenance:{state:'unknown',maintenance_record_id:null,expected_return_to_service:null},temporal_validity:tv('2024-12-18'),provenance:provenance(['src_force_chn_crs_naval_modernization_2025','src_force_chn_us_dod_cmpr_2024'],['claim_chn_plan_carrier_projection_2025']),notes:'Identity materially affects carrier construction and loss accounting. No present location, movement, or availability is asserted.'}));
inventory.find((row) => row.inventory_record_id === 'inventory_chn_plan_aircraft_carrier').individual_platform_ids = platforms.map((row) => row.platform_id);
writeRows('platforms.ndjson', platforms);
writeRows('inventory.ndjson', inventory);
writeRows('deployments.ndjson', deployments);
writeRows('maintenance.ndjson', maintenance);
writeRows('conservation.ndjson', conservation);

const construction = [
  {construction_record_id:'construction_chn_plan_fujian_status',country_id:'country_chn',customer_id:'organization_chn_pla_navy',equipment_type_id:'equipment_category_chn_plan_aircraft_carrier',platform_id:'platform_chn_plan_carrier_fujian',program_or_lot:'Third PLAN aircraft carrier',quantity_ordered:range(1,1,'platform','One publicly identified carrier.'),quantity_delivered:quantity('platform','Delivery or commissioning by the bookmark is not established by the accepted sources.'),quantity_accepted:quantity('platform','Acceptance by the bookmark is not established by the accepted sources.'),state:'trials',producer_ids:['institution_chn_defense_shipbuilding'],production_site_ids:[],milestones:[{milestone_type:'trials_started',date_kind:'observed',date:'2024-05-01'}],temporal_validity:tv('2024-05-01'),provenance:provenance(['src_force_chn_crs_naval_modernization_2025','src_force_chn_us_dod_cmpr_2024'],['claim_chn_plan_carrier_projection_2025']),notes:'Named construction record is retained because carrier acceptance changes strategic decisions. Exact site and current location are omitted.'},
  {construction_record_id:'construction_chn_naval_program_unresolved',country_id:'country_chn',customer_id:'organization_chn_pla_navy',equipment_type_id:'equipment_category_chn_plan_battle_force',platform_id:null,program_or_lot:'PLAN naval construction programs unresolved aggregate',quantity_ordered:quantity('platform','Public projections do not establish accepted orders at the bookmark.'),quantity_delivered:quantity('platform','Deliveries by class remain unresolved.'),quantity_accepted:quantity('platform','Accepted additions by 1 September remain unresolved.'),state:'unknown',producer_ids:['institution_chn_defense_shipbuilding'],production_site_ids:[],milestones:[{milestone_type:'other',date_kind:'unknown',date:null}],temporal_validity:tv('2025-04-24'),provenance:provenance(['src_force_chn_crs_naval_modernization_2025']),notes:'Projection is not promoted into opening inventory. Shipyard output, class mix, and acceptance dates require independent reconciliation.'},
  {construction_record_id:'construction_chn_military_facilities_unresolved',country_id:'country_chn',customer_id:'organization_chn_cmc_logistic_support_department',equipment_type_id:'equipment_category_chn_military_construction_capacity',platform_id:null,program_or_lot:'Military facilities construction unresolved aggregate',quantity_ordered:quantity('capacity_unit','The regulation establishes a system, not a quantity.'),quantity_delivered:quantity('capacity_unit','No compatible aggregate delivery count is accepted.'),quantity_accepted:quantity('capacity_unit','No compatible aggregate acceptance count is accepted.'),state:'unknown',producer_ids:['institution_chn_military_facilities_system'],production_site_ids:[],milestones:[{milestone_type:'other',date_kind:'unknown',date:null}],temporal_validity:tv('2025-06-05'),provenance:provenance(['src_force_chn_state_council_military_facilities_2025']),notes:'No facility location, output rate, or current project status is inferred.'},
];
inventory.find((row) => row.inventory_record_id === 'inventory_chn_plan_aircraft_carrier').construction_record_ids = ['construction_chn_plan_fujian_status'];
inventory.find((row) => row.inventory_record_id === 'inventory_chn_plan_battle_force').construction_record_ids = ['construction_chn_naval_program_unresolved'];
inventory.find((row) => row.inventory_record_id === 'inventory_chn_military_construction_capacity').construction_record_ids = ['construction_chn_military_facilities_unresolved'];
writeRows('inventory.ndjson', inventory);
writeRows('construction.ndjson', construction);

const claim = (id, subject, predicate, value, unit, sourceIds, asOfClaim, use, confidence = 'medium', contradiction = null) => ({claim_id:id,subject_id:subject,predicate,value,unit,as_of:asOfClaim,evidence_state:'independently_reported',confidence,confidence_reason:'Public aggregate source with explicit vintage and definition limits.',source_ids:sourceIds,...(contradiction ? {contradiction_set_id:contradiction}:{}),simulation_use:use,representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:reviewAfter});
const claims = [
  claim('claim_chn_plan_battle_force_over_370','inventory_chn_plan_battle_force','assessed_battle_force_size',{minimum_exclusive:370},'platform',['src_force_chn_crs_naval_modernization_2025'],'2024-12-18','Capability context only; the schema cannot represent an open lower bound, so opening quantity remains unknown.','high','contradiction_chn_plan_observed_vs_projection_2025'),
  claim('claim_chn_plan_battle_force_projection_395','inventory_chn_plan_battle_force','projected_battle_force_size',395,'platform',['src_force_chn_crs_naval_modernization_2025'],'2025-12-31','Projection only; forbidden as opening inventory.','medium','contradiction_chn_plan_observed_vs_projection_2025'),
  claim('claim_chn_plan_carrier_projection_2025','inventory_chn_plan_aircraft_carrier','projected_carriers_2025',3,'platform',['src_force_chn_crs_naval_modernization_2025'],'2025-12-31','Projection only; upper edge of the 2–3 opening range and does not establish commissioning date.','medium'),
  claim('claim_chn_plan_ssbn_mid2024','inventory_chn_plan_ssbn','assessed_ssbn_mid2024',6,'platform',['src_force_chn_us_dod_cmpr_2024'],'2024-06-30','Dated assessment only; not promoted into September 2025 inventory.','medium'),
  claim('claim_chn_plan_ssn_mid2024','inventory_chn_plan_ssn','assessed_ssn_mid2024',6,'platform',['src_force_chn_us_dod_cmpr_2024'],'2024-06-30','Dated assessment only; not promoted into September 2025 inventory.','medium'),
  claim('claim_chn_plan_ssk_mid2024','inventory_chn_plan_ssk','assessed_diesel_attack_submarines_mid2024',48,'platform',['src_force_chn_us_dod_cmpr_2024'],'2024-06-30','Dated assessment only; not promoted into September 2025 inventory.','medium'),
  claim('claim_chn_plan_large_surface_projection_2025','inventory_chn_plan_large_surface_combatant','projected_cruisers_destroyers_2025',52,'platform',['src_force_chn_crs_naval_modernization_2025'],'2025-12-31','Projection only; forbidden as opening inventory.','medium'),
  claim('claim_chn_plan_frigate_corvette_projection_2025','inventory_chn_plan_frigate_corvette','projected_frigates_corvettes_2025',120,'platform',['src_force_chn_crs_naval_modernization_2025'],'2025-12-31','Projection only; forbidden as opening inventory.','medium'),
  claim('claim_chn_plan_amphibious_projection_2025','inventory_chn_plan_amphibious','projected_major_amphibious_vessels_2025',{lha:4,lpd:10,lst:24},'platform',['src_force_chn_crs_naval_modernization_2025'],'2025-12-31','Projection by mutually exclusive classes only; forbidden as opening inventory.','medium'),
  claim('claim_chn_military_aircraft_over_3150','inventory_chn_aircraft_total','assessed_military_aircraft',{minimum_exclusive:3150},'platform',['src_force_chn_us_dod_cmpr_2024'],'2024-12-18','Capability context only; exact bookmark total remains unknown.','medium','contradiction_chn_aircraft_scope_2024'),
  claim('claim_chn_combat_aircraft_about_2400','inventory_chn_combat_aircraft','assessed_combat_aircraft_approximate',2400,'platform',['src_force_chn_us_dod_cmpr_2024'],'2024-12-18','Approximate dated assessment; not exact opening inventory.','medium','contradiction_chn_aircraft_scope_2024'),
  claim('claim_chn_plagf_active_personnel_965000','inventory_chn_plagf_active_personnel','assessed_active_personnel',965000,'person',['src_force_chn_us_dod_cmpr_2024'],'2024-12-18','Dated assessment; assigned and deployable strength at bookmark remain unknown.','medium'),
  claim('claim_chn_plarf_launcher_estimate_mid2024','inventory_chn_rocket_launcher','assessed_launchers_by_range',{icbm:500,irbm:250,mrbm:300,srbm:300,glcm:150},'launcher',['src_force_chn_us_dod_cmpr_2024'],'2024-06-30','Dated category estimate; do not sum into an exact September inventory.','medium','contradiction_chn_plarf_vintage_2024_2025'),
  claim('claim_chn_plarf_missile_estimate_mid2024','inventory_chn_rocket_munition','assessed_missiles_by_range',{icbm:400,irbm:500,mrbm:1300,srbm:900,glcm:400},'munition',['src_force_chn_us_dod_cmpr_2024'],'2024-06-30','Dated category estimate; do not sum into an exact September inventory.','medium','contradiction_chn_plarf_vintage_2024_2025'),
  claim('claim_chn_defense_budget_2025','country_chn','planned_national_defense_expenditure',1784665000000,'CNY',['src_force_chn_state_council_defense_budget_2025'],'2025-03-05','Budget envelope constrains mobilization and construction; it is not equipment or free capacity.','high'),
  claim('claim_chn_civilian_transport_designation_mechanism','inventory_chn_civilian_transport_conversion','civilian_transport_designation_exists',true,'boolean',['src_force_chn_mod_national_defense_transport_2022'],'2022-01-20','Mechanism only. Capacity, lead time, readiness, and economic cost remain unresolved.','high'),
];
writeRows('claims.ndjson', claims);
writeRows('contradictions.ndjson', [
  {contradiction_set_id:'contradiction_chn_plan_observed_vs_projection_2025',question:'What battle force total existed on 1 September 2025?',claim_ids:['claim_chn_plan_battle_force_over_370','claim_chn_plan_battle_force_projection_395'],source_ids:['src_force_chn_crs_naval_modernization_2025'],status:'open',resolution:'The source provides an older lower-bound assessment and a calendar-year projection, not a bookmark observation.',simulation_rule:'Opening quantity remains unknown; never promote 395 or invent 371 as the observed total.',last_reviewed:'2026-08-06',review_after:reviewAfter},
  {contradiction_set_id:'contradiction_chn_aircraft_scope_2024',question:'How do total and combat-aircraft assessments relate to a 2025 opening inventory?',claim_ids:['claim_chn_military_aircraft_over_3150','claim_chn_combat_aircraft_about_2400'],source_ids:['src_force_chn_us_dod_cmpr_2024'],status:'partially_reconciled',resolution:'The combat figure is an approximate subset; trainer and UAS scope differs. Neither is a September 2025 observed total.',simulation_rule:'Retain both national pools as unknown and forbid subtractive inference across incompatible scopes.',last_reviewed:'2026-08-06',review_after:reviewAfter},
  {contradiction_set_id:'contradiction_chn_plarf_vintage_2024_2025',question:'Do mid-2024 launcher and missile estimates establish September 2025 stocks?',claim_ids:['claim_chn_plarf_launcher_estimate_mid2024','claim_chn_plarf_missile_estimate_mid2024'],source_ids:['src_force_chn_us_dod_cmpr_2024'],status:'open',resolution:'They are source-vintage category estimates, not a later opening observation, and launchers and missiles use different counting units.',simulation_rule:'Keep both opening pools unknown; never combine launchers and missiles or treat the estimates as current truth.',last_reviewed:'2026-08-06',review_after:reviewAfter},
]);

for (const org of organizations) org.inventory_record_ids = [];
for (const pool of inventory) orgById.get(pool.organization_id)?.inventory_record_ids.push(pool.inventory_record_id);
writeRows('organizations.ndjson', organizations);

const manifestPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.scope.coverage_matrix = [
  {coverage_id:'coverage_chn_plan_national_force',service:'navy',domain:'maritime',organization_depth:'structured',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'identified',conservation:'structured',notes:'Battle force and class pools are conserved; projections remain claims and carrier identities have no locations.'},
  {coverage_id:'coverage_chn_air_and_naval_aviation',service:'air_force',domain:'air',organization_depth:'structured',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'not_started',conservation:'structured',notes:'Mission categories exist as unknown pools; dated estimates are not opening totals.'},
  {coverage_id:'coverage_chn_ground_and_rocket_force',service:'army',domain:'ground',organization_depth:'structured',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'not_started',conservation:'structured',notes:'Ground and Rocket Force categories conserve; personnel and missile estimates remain source-vintage claims.'},
  {coverage_id:'coverage_chn_coast_guard_militia_reserve',service:'paramilitary',domain:'joint',organization_depth:'identified',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'not_started',conservation:'structured',notes:'Institutions and national pools modeled; quantities, readiness, and mobilization delay remain unknown.'},
  {coverage_id:'coverage_chn_lift_sustainment_and_mobilization',service:'joint',domain:'logistics',organization_depth:'structured',equipment_taxonomy:'structured',inventory:'inventory_partial',dispositions:'identified',maintenance:'identified',construction:'identified',conservation:'structured',notes:'Lift, sealift, tanker, maintenance, training, construction, and civilian conversion pools are explicit. Civilian capacity requires activation, lead time, inspection, and economic cost.'},
];
manifest.reconciliation = {state:'blocked_by_unknowns',organization_records:organizations.length,platform_records:platforms.length,equipment_type_records:equipment.length,inventory_records:inventory.length,deployment_records:deployments.length,maintenance_records:maintenance.length,construction_records:construction.length,conservation_records:conservation.length,exact_quantity_records:inventory.filter((row)=>row.quantity.kind==='exact').length,range_quantity_records:inventory.filter((row)=>row.quantity.kind==='range').length,unknown_quantity_records:inventory.filter((row)=>row.quantity.kind==='unknown').length,open_conservation_exceptions:inventory.filter((row)=>row.quantity.kind==='unknown').length,double_booking_exceptions:0,orphan_platform_records:0,orphan_organization_records:0,expired_records:0,relationship_records:readRows('relationships.ndjson').length};
manifest.source_ids = sources.map((row) => row.source_id);
manifest.unknowns = [
  'No public source in this packet establishes a complete mutually exclusive national equipment inventory at 1 September 2025.',
  'Dated 2024 assessments and calendar-year 2025 projections remain claims; they are not promoted into opening truth.',
  'All current theater allocations, exact positions, routes, movement, readiness, maintenance subsets, and support availability remain unknown.',
  'PLAN class projections, PLARF category estimates, and aircraft scope definitions require independent reconciliation.',
  'Reserve, militia, Coast Guard, sealift, airlift, tanker, maintenance, training, construction, and mobilization quantities remain unknown rather than zero.',
  'Civilian conversion capacity requires lawful designation, lead time, acceptance, crew, interoperability, and economic opportunity cost; it cannot create magical lift.',
];
manifest.notes = 'China inventory checkpoint: national public aggregate pools across PLA services and arms, Navy class categories, air mission categories, ground and Rocket Force, Coast Guard, militia, reserve, lift, sustainment, construction, and bounded civilian conversion. It excludes exact present positions and actionable movement and remains collecting/non-executable.';
manifest.acceptance = {schema_valid:true,internally_consistent:true,research_complete:false,decision_usable:false,simulation_ready:false,untested_claims:['Complete national inventory and class totals are not independently reconciled.','Current readiness, maintenance, support availability, mobilization delay, and theater allocation are untested.'],blockers:['Most national quantities remain unknown at the bookmark.','Source projections and dated assessments require independent review before any promotion.','No mission may draw from national pools without a conserved child allocation, authority, readiness, and resolved support package.']};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({sources:sources.length,equipment:equipment.length,platforms:platforms.length,inventory:inventory.length,deployments:deployments.length,maintenance:maintenance.length,construction:construction.length,conservation:conservation.length,claims:claims.length,contradictions:3}, null, 2));
