import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const asOf = '2025-09-01T00:00:00Z';
const reviewAfter = '2026-11-06';
const readRows = (name) => fs.readFileSync(path.join(root, name), 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const writeRows = (name, rows) => fs.writeFileSync(path.join(root, name), `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
const unknown = (unit, rule) => ({kind: 'unknown', unit, counting_rule: rule});
const temporal = (validFrom) => ({valid_from: validFrom, as_of: asOf, observed_at: null, review_after: reviewAfter});
const provenance = (sourceIds, evidenceState = 'official_claim', confidence = 'high', method = 'Direct extraction from a dated public source; no current position, readiness, or movement is inferred.') => ({
  evidence_state: evidenceState,
  confidence,
  source_ids: sourceIds,
  claim_ids: [],
  contradiction_set_ids: [],
  method,
});

const sources = readRows('sources.ndjson');
const upsertSource = (row) => {
  const index = sources.findIndex((item) => item.source_id === row.source_id);
  if (index >= 0) sources[index] = row;
  else sources.push(row);
};
upsertSource({
  source_id: 'src_force_twn_us_dod_cmpr_2024',
  title: "Military and Security Developments Involving the People's Republic of China 2024",
  publisher: 'United States Department of Defense',
  published_at: '2024-12-18',
  accessed_at: '2026-08-06',
  url: 'https://media.defense.gov/2024/Dec/18/2003615520/-1/-1/0/MILITARY-AND-SECURITY-DEVELOPMENTS-INVOLVING-THE-PEOPLES-REPUBLIC-OF-CHINA-2024.PDF',
  source_tier: 'A',
  source_type: 'research_report',
  language: 'en',
  relevant_locator: 'Appendix I, printed pages 164 and 165: Taiwan ground, naval, Coast Guard, and air force operational estimates',
  reliability_notes: 'Official US Department of Defense estimate. The report says the tables include equipment considered operational, but it does not establish an exact 1 September 2025 possession, availability, readiness, or deployment state. Aircraft values are explicitly estimated totals.',
});
upsertSource({
  source_id: 'src_force_twn_mnd_fy2025_budget_2024',
  title: 'Ministry of National Defense press release explaining Executive Yuan approval of the 2025 defense budget',
  publisher: 'Ministry of National Defense, Republic of China',
  published_at: '2024-08-22',
  accessed_at: '2026-08-06',
  url: 'https://www.mnd.gov.tw/en/Publication/83354',
  source_tier: 'A',
  source_type: 'official_release',
  language: 'zh',
  relevant_locator: '2025 program priorities: personnel sustainment, equipment availability, reserves, command resilience, and seven follow-on indigenous submarines planned for 2025 through 2038',
  reliability_notes: 'Budget and program evidence only. An appropriation or planned program does not establish quantity possessed, delivered, accepted, ready, or deployed at the bookmark.',
});
upsertSource({
  source_id: 'src_force_twn_mnd_conscript_review_2025',
  title: 'MND routine press conference reference on one-year conscript implementation and 2025 preparations',
  publisher: 'Ministry of National Defense, Republic of China',
  published_at: '2025-03-27',
  accessed_at: '2026-08-06',
  url: 'https://www.mnd.gov.tw/Publication/84221',
  source_tier: 'A',
  source_type: 'official_release',
  language: 'en',
  relevant_locator: '2024 intake of 6,956 conscripts, 2,047 discharged into the reserve system by the reporting date, and 3,761 assigned to named defense units',
  reliability_notes: 'Dated implementation result and training input. These figures are not a complete active or reserve personnel inventory and are not summed into national force strength.',
});
upsertSource({
  source_id: 'src_force_twn_mnd_aircraft_parts_2024',
  title: 'MND press release on repair and return of Air Force parts and accessories',
  publisher: 'Ministry of National Defense, Republic of China',
  published_at: '2024-09-17',
  accessed_at: '2026-08-06',
  url: 'https://www.mnd.gov.tw/en/informationservices/publication/83480',
  source_tier: 'A',
  source_type: 'official_release',
  language: 'en',
  relevant_locator: 'Approved repair-and-return support intended to sustain fighter readiness and availability',
  reliability_notes: 'Confirms a maintenance support pathway, not the number of aircraft in maintenance, the number ready, or the number available on 1 September 2025.',
});
for (const source of sources) {
  source.retrieved_at = source.retrieved_at ?? source.accessed_at;
  if (['src_force_twn_adma_history_2022', 'src_force_twn_oac_subordinate_agencies_2025'].includes(source.source_id)) {
    delete source.observed_from;
    delete source.observed_to;
    source.mutability_class = 'live_mutable';
    source.bookmark_evidence_status = 'quarantined_no_prebookmark_temporal_proof';
    source.available_to_player_at_bookmark = false;
    source.temporal_proof = 'No immutable snapshot, version identifier, content hash, or dated pre-bookmark artifact proves the live page contents at the opening bookmark.';
  } else {
    source.mutability_class = 'immutable_artifact';
    source.bookmark_evidence_status = 'prebookmark_available';
    source.available_to_player_at_bookmark = true;
    source.temporal_proof = `Publisher-dated artifact available on ${source.published_at}; the artifact is used only within its stated claim scope.`;
  }
}
writeRows('sources.ndjson', sources);

let organizations = readRows('organizations.ndjson');
const orgById = new Map(organizations.map((row) => [row.organization_id, row]));
const base = structuredClone(orgById.get('organization_twn_army_command_headquarters'));
const addOrg = ({id, name, nativeName, service, kind, echelon, parent, roles, mobilization = 'standing', notes}) => {
  const row = structuredClone(base);
  Object.assign(row, {
    organization_id: id,
    name,
    native_name: nativeName,
    aliases: [],
    service,
    component: 'active',
    organization_kind: kind,
    echelon,
    supported_organization_ids: [],
    headquarters_location_id: null,
    personnel: {
      authorized: unknown('person', 'The dated source establishes organizational identity, not authorized personnel.'),
      assigned: unknown('person', 'The dated source establishes organizational identity, not assigned personnel.'),
      deployable: unknown('person', 'The dated source establishes organizational identity, not deployable personnel.'),
    },
    readiness: {state: 'unknown', basis: 'unknown', limiting_factors: ['Organization identity does not establish readiness.']},
    mobilization: {status: mobilization, authority_id: null, minimum_delay_hours: null, equipment_pool_ids: []},
    roles,
    inventory_record_ids: [],
    temporal_validity: temporal('2023-09-12'),
    provenance: provenance(['src_force_twn_mnd_national_defense_report_2023']),
    notes,
    display_parent_organization_id: parent,
    relationship_record_ids: [],
  });
  const index = organizations.findIndex((item) => item.organization_id === id);
  if (index >= 0) organizations[index] = row;
  else organizations.push(row);
};

[
  ['organization_twn_joint_operations_command_center','Joint Operations Command Center','聯合作戰指揮中心','joint','joint_command','functional_command','organization_twn_general_staff_headquarters',['continuous joint operational command in peace and war','joint command and control'],'The 2023 report states that the JOCC remains operational in peace and war. This does not establish a readiness percentage or physical location.'],
  ['organization_twn_army_theater_operations_centers_aggregate','Army theater operations centers, aggregate','陸軍作戰區作戰中心','army','operational_command','theater_command','organization_twn_army_command_headquarters',['theater operations center command and control'],'Aggregate public node. Individual centers, locations, and dispositions are outside this national packet.'],
  ['organization_twn_army_numbered_army_commands_aggregate','Numbered Army commands, aggregate','軍團指揮部','army','operational_command','corps','organization_twn_army_command_headquarters',['land force command','main force employment'],'Aggregate public node. The 2024 US estimate of three corps is retained as a dated claim rather than treated as an exact opening count.'],
  ['organization_twn_army_defense_commands_aggregate','Army defense commands, aggregate','防衛指揮部','army','operational_command','functional_command','organization_twn_army_command_headquarters',['territorial defense command','garrison force employment'],'Aggregate public node. No command location or exact opening force allocation is represented.'],
  ['organization_twn_army_aviation_and_special_forces_command','Army Aviation and Special Forces Command','陸軍航空特戰指揮部','army','operational_command','functional_command','organization_twn_army_command_headquarters',['army aviation','special operations'],'Dated public organizational identity only.'],
  ['organization_twn_army_education_training_doctrine_development_command','Army Education, Training and Doctrine Development Command','陸軍教育訓練暨準則發展指揮部','army','operational_command','functional_command','organization_twn_army_command_headquarters',['education','training','doctrine development'],'Training authority is not an operational deployment state.'],
  ['organization_twn_army_logistics_command','Army Logistics Command','陸軍後勤指揮部','army','operational_command','functional_command','organization_twn_army_command_headquarters',['Army logistics','maintenance support'],'Support capability exists; throughput and availability remain unknown.'],
  ['organization_twn_navy_fleet_command','Navy Fleet Command','海軍艦隊指揮部','navy','operational_command','fleet','organization_twn_navy_command_headquarters',['fleet operations','maritime command and control'],'The JOCC control path is explicit; exact ship assignments and locations are not.'],
  ['organization_twn_navy_marine_corps_command','Navy Marine Corps Command','海軍陸戰隊指揮部','marine','operational_command','functional_command','organization_twn_navy_command_headquarters',['amphibious and littoral operations','ground defense'],'Service identity is marine while administrative containment remains under Navy headquarters.'],
  ['organization_twn_navy_education_training_doctrine_development_command','Navy Education, Training and Doctrine Development Command','海軍教育訓練暨準則發展指揮部','navy','operational_command','functional_command','organization_twn_navy_command_headquarters',['education','training','doctrine development'],'Training authority is not an operational deployment state.'],
  ['organization_twn_navy_maintenance_and_repair_command','Navy Maintenance and Repair Command','海軍保修指揮部','navy','operational_command','functional_command','organization_twn_navy_command_headquarters',['naval maintenance','repair support'],'Maintenance command identity does not establish maintenance quantities or fleet availability.'],
  ['organization_twn_air_force_air_combat_command','Air Force Air Combat Command','空軍作戰指揮部','air_force','operational_command','functional_command','organization_twn_air_force_command_headquarters',['air operations','air surveillance and control'],'The JOCC control path is explicit; exact wing assignment, sortie capacity, and location remain unknown.'],
  ['organization_twn_air_force_air_defense_and_missile_command','Air Force Air Defense and Missile Command','空軍防空暨飛彈指揮部','air_force','operational_command','functional_command','organization_twn_air_force_command_headquarters',['integrated air defense','surface-to-air missile operations'],'System and battery quantities remain unknown because the dated source establishes the command and acquisition direction, not opening inventory.'],
  ['organization_twn_air_force_education_training_doctrine_development_command','Air Force Education, Training and Doctrine Development Command','空軍教育訓練暨準則發展指揮部','air_force','operational_command','functional_command','organization_twn_air_force_command_headquarters',['education','training','doctrine development'],'Training authority is not an operational deployment state.'],
  ['organization_twn_air_force_maintenance_and_support_command','Air Force Maintenance and Support Command','空軍保修指揮部','air_force','operational_command','functional_command','organization_twn_air_force_command_headquarters',['aircraft maintenance','Air Force logistics support'],'The public repair pathway does not establish aircraft availability or maintenance allocation.'],
].forEach(([id,name,nativeName,service,kind,echelon,parent,roles,notes]) => addOrg({id,name,nativeName,service,kind,echelon,parent,roles,notes}));
addOrg({id:'organization_twn_indigenous_defense_industry_aggregate',name:'Indigenous defense industry, aggregate',nativeName:'國防產業（彙總）',service:'navy',kind:'other',echelon:'other',parent:null,roles:['indigenous naval construction research category'],notes:'Public aggregate producer category only. It is not a facility, contractor list, throughput estimate, or executable production capacity.'});
{
  const industry = organizations.find((row) => row.organization_id === 'organization_twn_indigenous_defense_industry_aggregate');
  industry.component = 'other';
  industry.provenance = provenance(['src_force_twn_mnd_fy2025_budget_2024'], 'official_claim', 'medium', 'The dated budget source supports an indigenous submarine program, but not producer identity, site, throughput, or capacity.');
  industry.temporal_validity = temporal('2024-08-22');
}

let relationships = readRows('relationships.ndjson');
const rel = ({id, source, target, type, domains, missions, issue, reassign, release, conditions = [], notes, precedence = 80}) => ({
  relationship_id: id,
  country_id: 'country_twn',
  source_organization_id: source,
  target_organization_id: target,
  relationship_type: type,
  authority_scope: {domains, missions, may_issue_orders: issue, may_reassign_forces: reassign, may_release_for_mission: release},
  activation_state: conditions.length ? 'conditional' : 'active',
  conditions,
  precedence,
  temporal_validity: temporal('2023-09-12'),
  provenance: provenance(['src_force_twn_mnd_national_defense_report_2023']),
  notes,
});
const additions = [
  rel({id:'relationship_twn_general_staff_headquarters_joint_operations_command_center_operational_control',source:'organization_twn_general_staff_headquarters',target:'organization_twn_joint_operations_command_center',type:'operational_control',domains:['joint'],missions:['joint operations planning','joint command and control'],issue:true,reassign:true,release:true,notes:'The General Staff command system operates the continuous JOCC.'}),
  rel({id:'relationship_twn_joint_operations_command_center_army_theater_operations_centers_operational_control',source:'organization_twn_joint_operations_command_center',target:'organization_twn_army_theater_operations_centers_aggregate',type:'operational_control',domains:['ground','joint'],missions:['defensive operations','joint land operations'],issue:true,reassign:true,release:true,notes:'The report explicitly places theater operations centers under JOCC command. The target is an aggregate navigation node.'}),
  rel({id:'relationship_twn_army_theater_operations_centers_numbered_army_commands_operational_control',source:'organization_twn_army_theater_operations_centers_aggregate',target:'organization_twn_army_numbered_army_commands_aggregate',type:'operational_control',domains:['ground'],missions:['defensive land operations'],issue:true,reassign:true,release:true,notes:'Aggregate relationship. It does not resolve which formation is assigned to which theater center.'}),
  rel({id:'relationship_twn_army_theater_operations_centers_defense_commands_operational_control',source:'organization_twn_army_theater_operations_centers_aggregate',target:'organization_twn_army_defense_commands_aggregate',type:'operational_control',domains:['ground'],missions:['territorial defense','garrison operations'],issue:true,reassign:true,release:true,notes:'Aggregate relationship. It does not resolve command locations or opening allocations.'}),
  rel({id:'relationship_twn_joint_operations_command_center_navy_fleet_command_operational_control',source:'organization_twn_joint_operations_command_center',target:'organization_twn_navy_fleet_command',type:'operational_control',domains:['maritime','joint'],missions:['joint maritime operations'],issue:true,reassign:true,release:true,notes:'The report explicitly identifies the Fleet Command operations center under JOCC command.'}),
  rel({id:'relationship_twn_joint_operations_command_center_air_force_air_combat_command_operational_control',source:'organization_twn_joint_operations_command_center',target:'organization_twn_air_force_air_combat_command',type:'operational_control',domains:['air','joint'],missions:['joint air operations'],issue:true,reassign:true,release:true,notes:'The report explicitly identifies Air Combat Command under JOCC command.'}),
];
for (const [service, parent, children] of [
  ['army','organization_twn_army_command_headquarters',['organization_twn_army_theater_operations_centers_aggregate','organization_twn_army_numbered_army_commands_aggregate','organization_twn_army_defense_commands_aggregate','organization_twn_army_aviation_and_special_forces_command','organization_twn_army_education_training_doctrine_development_command','organization_twn_army_logistics_command']],
  ['navy','organization_twn_navy_command_headquarters',['organization_twn_navy_fleet_command','organization_twn_navy_marine_corps_command','organization_twn_navy_education_training_doctrine_development_command','organization_twn_navy_maintenance_and_repair_command']],
  ['air_force','organization_twn_air_force_command_headquarters',['organization_twn_air_force_air_combat_command','organization_twn_air_force_air_defense_and_missile_command','organization_twn_air_force_education_training_doctrine_development_command','organization_twn_air_force_maintenance_and_support_command']],
]) for (const child of children) additions.push(rel({id:`relationship_twn_${parent.replace('organization_twn_','')}_${child.replace('organization_twn_','')}_organize_train_equip`,source:parent,target:child,type:'organize_train_equip',domains:[service === 'navy' ? 'maritime' : service === 'air_force' ? 'air' : 'ground'],missions:['organize','train','equip'],issue:true,reassign:false,release:false,notes:'Administrative force-generation relationship. It does not independently release forces for a JOCC mission.',precedence:60}));
relationships = [...new Map([...relationships, ...additions].map((row) => [row.relationship_id, row])).values()];

const quarantinedSourceIds = new Set(['src_force_twn_adma_history_2022', 'src_force_twn_oac_subordinate_agencies_2025']);
const safeSourceIds = (ids) => ids.filter((id) => !quarantinedSourceIds.has(id));
for (const org of organizations) {
  org.provenance.source_ids = safeSourceIds(org.provenance.source_ids);
  if (org.organization_id === 'organization_twn_all_out_defense_mobilization_agency') org.provenance.source_ids = ['src_force_twn_mnd_national_defense_report_2023'];
  if (org.organization_id === 'organization_twn_reserve_command') org.provenance.source_ids = ['src_force_twn_mnd_reserve_employment_2022', 'src_force_twn_mnd_force_structure_2023'];
  if (['organization_twn_ocean_affairs_council', 'organization_twn_coast_guard_administration'].includes(org.organization_id)) {
    org.provenance.source_ids = org.organization_id.endsWith('coast_guard_administration') ? ['src_force_twn_mnd_national_defense_report_2023'] : [];
    org.provenance.evidence_state = 'unknown';
    org.provenance.confidence = 'low';
    org.provenance.method = 'Opening organizational identity is retained as an explicit research hypothesis; the mutable live directory is quarantined and cannot establish opening truth.';
    org.temporal_validity.valid_from = asOf;
  }
}
organizations = organizations.filter((org) => org.organization_id !== 'organization_twn_ocean_affairs_council');
relationships = relationships.filter((relationship) => relationship.source_organization_id !== 'organization_twn_ocean_affairs_council' && relationship.target_organization_id !== 'organization_twn_ocean_affairs_council');
{
  const coastGuard = organizations.find((org) => org.organization_id === 'organization_twn_coast_guard_administration');
  coastGuard.display_parent_organization_id = null;
  coastGuard.provenance.source_ids = ['src_force_twn_mnd_national_defense_report_2023'];
}
for (const relationship of relationships) {
  relationship.provenance.source_ids = safeSourceIds(relationship.provenance.source_ids);
  relationship.authority_scope.may_issue_orders = false;
  relationship.authority_scope.may_reassign_forces = false;
  relationship.authority_scope.may_release_for_mission = false;
  if (!relationship.provenance.source_ids.length) {
    relationship.provenance.evidence_state = 'unknown';
    relationship.provenance.confidence = 'low';
    relationship.provenance.method = 'The live-page evidence is quarantined; this relationship is a nonexecutable research hypothesis pending immutable pre-bookmark proof.';
    relationship.activation_state = 'unknown';
    relationship.temporal_validity.valid_from = asOf;
  }
}

const authorityClaims = relationships.map((relationship) => ({
  authority_claim_id: `authority_claim_${relationship.relationship_id.replace('relationship_', '')}`,
  relationship_id: relationship.relationship_id,
  actor_organization_id: relationship.source_organization_id,
  target_organization_id: relationship.target_organization_id,
  authority_class: relationship.relationship_type,
  activation_predicate: relationship.activation_state === 'conditional' ? relationship.conditions : [],
  effective_interval: {valid_from: relationship.temporal_validity.valid_from, valid_to: null, as_of: asOf},
  powers: {issue_orders: 'unknown', reassign_forces: 'unknown', release_for_mission: 'unknown'},
  release_semantics: 'unproved_nonexecutable',
  source_ids: relationship.provenance.source_ids,
  source_locator: relationship.provenance.source_ids.includes('src_force_twn_mnd_national_defense_report_2023') ? '2023 National Defense Report, Parts II and III; the precise page and legal release power remain unresolved.' : 'No cutoff-safe atomic locator accepted.',
  evidence_state: relationship.provenance.evidence_state,
  notes: 'Organization identity or command association does not itself prove authority to issue orders, reassign forces, or release a mission package.',
}));
writeRows('authority_claims.ndjson', authorityClaims);

for (const org of organizations) {
  org.relationship_record_ids = relationships.filter((row) => row.source_organization_id === org.organization_id || row.target_organization_id === org.organization_id).map((row) => row.relationship_id);
}
writeRows('organizations.ndjson', organizations);
writeRows('relationships.ndjson', relationships);

const manifestPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.scope.services = [...new Set([...manifest.scope.services, 'marine'])];
manifest.reconciliation.organization_records = organizations.length;
manifest.reconciliation.relationship_records = relationships.length;
manifest.source_ids = sources.map((row) => row.source_id);
manifest.unknowns = [
  'The dated command packet resolves the continuous JOCC and principal Army, Navy, Marine Corps, and Air Force functional commands but does not assert exact headquarters coordinates, current allocations, or subordinate unit dispositions.',
  'The 2024 US Department of Defense table is a dated operational estimate, not an exact 1 September 2025 possession, availability, readiness, maintenance, or deployment state.',
  'Active, reserve, Coast Guard, aircraft, naval, ground, air and missile defense, lift, training, construction, maintenance, and munitions opening pools remain nonexecutable pending source reconciliation and independent review.',
  'No source in this packet establishes exact ready, available, deployed, stored, damaged, or maintenance quantities at the bookmark.',
];
manifest.notes = 'Collecting national aggregate packet. The dated command structure checkpoint resolves the public JOCC and principal functional commands without exposing current positions or inventing mission availability.';
manifest.acceptance.internally_consistent = false;
manifest.acceptance.decision_usable = false;
manifest.acceptance.simulation_ready = false;
manifest.acceptance.untested_claims = ['Command relationships require independent review before promotion.'];
manifest.acceptance.blockers = ['National inventory pools and dated estimate claims are not yet reconciled.','Independent command and inventory review has not passed.'];
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const equipment = [];
const equipmentSource = ['src_force_twn_us_dod_cmpr_2024','src_force_twn_mnd_national_defense_report_2023'];
const addEquipment = ({slug, display, domain, category, unit = 'platform', mobility = 'varies', parent = null, roles = [category]}) => {
  const id = `equipment_category_twn_${slug}`;
  equipment.push({
    equipment_type_id: id,
    ontology_id: `ontology_${domain}_${slug}`,
    parent_equipment_type_id: parent,
    counting_unit: unit,
    aggregation_rule: parent ? 'leaf_counts_may_be_summed_when_scopes_are_mutually_exclusive' : unit === 'capacity_unit' ? 'capability_capacity_is_not_additive' : 'parent_is_reconciliation_only_and_must_not_be_summed_with_children',
    display_name: display,
    reporting_names: [],
    taxonomy: {domain, category, entity_kind: unit === 'platform' ? 'platform' : unit === 'munition' ? 'munition' : unit === 'capacity_unit' ? 'facility_system' : 'other', family: null, model: null, variant: null},
    origin_country_ids: [],
    manufacturer_ids: [],
    roles,
    individualization: {supported: unit === 'platform', default_research_resolution: 'national_pool', reason: 'This packet uses aggregate national accounting. Individual identity is deferred until it changes command, mission, loss, or a player decision.'},
    crew_requirements: {operating_crew: unknown('person','Category-level crew requirement is unresolved.'), support_personnel: unknown('person','Category-level support personnel requirement is unresolved.')},
    mobility: {mobility_kind: mobility, self_deploying: ['fixed_wing','rotary_wing','surface_vessel','subsurface_vessel'].includes(mobility) ? true : null, strategic_lift_required: null},
    support_dependency_types: [],
    dependency_requirements: [],
    measured_characteristics: [],
    temporal_validity: temporal('2024-12-18'),
    provenance: provenance(equipmentSource, 'estimated', 'medium', 'Taxonomy and reported class are supported by dated national tables; taxonomy does not assert opening quantity or readiness.'),
    notes: 'Taxonomy record only. It does not establish a 1 September 2025 quantity, condition, readiness, or location.',
  });
  return id;
};

const typeDefs = [
  ['active_personnel','Armed forces active personnel unresolved total','joint','active personnel','person','fixed',null,['military personnel accounting']],
  ['reserve_personnel','Armed forces reserve personnel unresolved total','joint','reserve personnel','person','fixed',null,['reserve personnel accounting']],
  ['coast_guard_personnel','Coast Guard personnel unresolved total','maritime','Coast Guard personnel','person','fixed',null,['Coast Guard personnel accounting']],
  ['ground_force_personnel','Ground force personnel','ground','ground force personnel','person','fixed',null,['ground force personnel accounting']],
  ['army_corps','Army corps formations','ground','army corps','formation','varies',null,['land command formation']],
  ['combined_arms_brigade','Combined arms brigades','ground','combined arms brigade','formation','varies',null,['combined arms maneuver']],
  ['artillery_brigade','Artillery brigades','ground','artillery brigade','formation','varies',null,['ground fires']],
  ['army_aviation_brigade','Army aviation brigades','air','army aviation brigade','formation','rotary_wing',null,['army aviation']],
  ['marine_brigade','Marine brigades','ground','marine brigade','formation','varies',null,['littoral operations']],
  ['tank','Tanks','ground','tank','equipment_item','tracked',null,['armored maneuver']],
  ['artillery_piece','Artillery pieces','ground','artillery piece','equipment_item','varies',null,['ground fires']],
  ['ground_lift','Ground force lift unresolved pool','logistics','ground lift','capacity_unit','varies',null,['ground mobility','logistics']],
  ['naval_combatant_parent','Naval combatants and amphibious ships reconciliation parent','maritime','naval combatant and amphibious ship','platform','surface_vessel',null,['maritime operations']],
  ['amphibious_assault_ship','Amphibious assault ships','maritime','amphibious assault ship','platform','surface_vessel','equipment_category_twn_naval_combatant_parent',['amphibious lift']],
  ['destroyer','Destroyers','maritime','destroyer','platform','surface_vessel','equipment_category_twn_naval_combatant_parent',['surface warfare']],
  ['frigate','Frigates','maritime','frigate','platform','surface_vessel','equipment_category_twn_naval_combatant_parent',['surface warfare']],
  ['corvette','Corvettes under the US DoD classification','maritime','corvette','platform','surface_vessel','equipment_category_twn_naval_combatant_parent',['surface warfare']],
  ['landing_and_amphibious_ship','Medium landing ships, tank landing ships, and amphibious transport docks','maritime','landing and amphibious ship','platform','surface_vessel','equipment_category_twn_naval_combatant_parent',['amphibious lift']],
  ['attack_submarine','Attack submarines','maritime','attack submarine','platform','subsurface_vessel','equipment_category_twn_naval_combatant_parent',['undersea warfare']],
  ['coastal_patrol_missile_craft','Coastal patrol missile craft','maritime','coastal patrol missile craft','platform','surface_vessel','equipment_category_twn_naval_combatant_parent',['coastal defense','surface strike']],
  ['naval_support_ship','Naval support ships unresolved pool','logistics','naval support ship','platform','surface_vessel',null,['fleet support']],
  ['coast_guard_ship','Coast Guard ships','maritime','Coast Guard ship','platform','surface_vessel',null,['maritime law enforcement']],
  ['fighter_including_trainers','Fighters including fighter trainers reconciliation parent','air','fighter including trainer','platform','fixed_wing',null,['air combat','training']],
  ['fighter_excluding_trainers','Fighters excluding fighter trainers','air','fighter','platform','fixed_wing','equipment_category_twn_fighter_including_trainers',['air combat']],
  ['fighter_trainer_subset','Fighter trainer subset','air','fighter trainer','platform','fixed_wing','equipment_category_twn_fighter_including_trainers',['training','air combat']],
  ['bomber_attack_aircraft','Bomber and attack aircraft','air','bomber or attack aircraft','platform','fixed_wing',null,['strike']],
  ['transport_aircraft','Transport aircraft','air','transport aircraft','platform','fixed_wing',null,['airlift']],
  ['special_mission_aircraft','Special mission aircraft','air','special mission aircraft','platform','fixed_wing',null,['intelligence surveillance reconnaissance','airborne command']],
  ['tanker_aircraft','Tanker aircraft unresolved pool','air','tanker aircraft','platform','fixed_wing',null,['aerial refueling']],
  ['rotary_wing_lift','Rotary wing lift unresolved pool','air','rotary wing lift','platform','rotary_wing',null,['air assault','lift']],
  ['air_and_missile_defense','Air and missile defense systems unresolved pool','air','air and missile defense system','battery','varies',null,['integrated air and missile defense']],
  ['joint_command_isr','Joint command, control, intelligence, surveillance and reconnaissance capacity','joint','joint C2ISR capacity','capacity_unit','fixed',null,['joint command and control','intelligence surveillance reconnaissance']],
  ['maintenance_capacity','National military maintenance capacity','logistics','maintenance capacity','capacity_unit','fixed',null,['maintenance','repair']],
  ['training_capacity','National military training capacity','joint','training capacity','capacity_unit','fixed',null,['training']],
  ['mobilization_capacity','National reserve mobilization capacity','joint','mobilization capacity','capacity_unit','fixed',null,['mobilization']],
  ['munition_stockpile','National military munitions stockpile unresolved pool','joint','munition stockpile','munition','fixed',null,['sustained operations']],
  ['planned_follow_on_submarine','Planned follow-on indigenous submarine','maritime','planned submarine','platform','subsurface_vessel',null,['undersea warfare']],
  ['planned_infantry_brigade','Planned infantry backbone brigade','ground','planned infantry brigade','formation','varies',null,['garrison defense']],
];
for (const [slug,display,domain,category,unit,mobility,parent,roles] of typeDefs) addEquipment({slug,display,domain,category,unit,mobility,parent,roles});
writeRows('equipment_types.ndjson', equipment);

const estimateClaims = [
  ['ground_force_personnel',104000,'person','estimated operational total'],
  ['army_corps',3,'formation','estimated operational total'],
  ['combined_arms_brigade',7,'formation','estimated operational total'],
  ['artillery_brigade',3,'formation','estimated operational total'],
  ['army_aviation_brigade',2,'formation','estimated operational total'],
  ['marine_brigade',2,'formation','estimated operational total'],
  ['tank',800,'equipment_item','estimated operational total'],
  ['artillery_piece',1100,'equipment_item','estimated operational total'],
  ['amphibious_assault_ship',1,'platform','estimated operational total'],
  ['destroyer',4,'platform','estimated operational total'],
  ['frigate',22,'platform','estimated operational total'],
  ['corvette',0,'platform','estimated operational total under the report classification'],
  ['landing_and_amphibious_ship',51,'platform','estimated operational total across combined categories'],
  ['attack_submarine',4,'platform','estimated operational total'],
  ['coastal_patrol_missile_craft',43,'platform','estimated operational total'],
  ['coast_guard_ship',170,'platform','estimated total'],
  ['fighter_excluding_trainers',350,'platform','estimated total excluding fighter trainers'],
  ['fighter_including_trainers',400,'platform','estimated total including fighter trainers'],
  ['bomber_attack_aircraft',0,'platform','estimated total'],
  ['transport_aircraft',50,'platform','estimated total'],
  ['special_mission_aircraft',20,'platform','estimated total'],
];
const claims = estimateClaims.map(([slug,value,unit,qualifier]) => ({
  claim_id: `claim_twn_us_dod_2024_${slug}_${value}`,
  subject_id: `inventory_twn_${slug}`,
  predicate: 'us_dod_2024_reported_estimate',
  value,
  unit,
  as_of: '2024-12-18',
  evidence_state: 'estimated',
  confidence: 'medium',
  confidence_reason: `The official US report publishes this as an ${qualifier}. It is not a Taiwan custody ledger or a 1 September 2025 opening count.`,
  source_ids: ['src_force_twn_us_dod_cmpr_2024'],
  ...(slug.startsWith('fighter_') ? {contradiction_set_id:'contradiction_twn_fighter_scope_2024'} : {}),
  simulation_use: 'Research context only. Opening quantity, readiness, availability, and deployment remain unknown until a bookmark-valid national ledger reconciles the estimate.',
  representation_tier: 'national_capability',
  reviewed_at: '2026-08-06',
  review_after: reviewAfter,
  measurement_kind: 'stock_estimate',
  subject_kind: 'inventory_pool',
  component_scope: 'all_components',
  population_definition: qualifier,
  observation_period: {start: null, end: null, precision: 'unknown'},
  as_of_semantics: 'source_publication_date_not_observation_date',
  opening_stock_eligible: false,
}));
claims.push(
  {claim_id:'claim_twn_2023_planned_backbone_infantry_brigades_5',subject_id:'construction_twn_planned_backbone_infantry_brigades',predicate:'planned_formation_count',value:5,unit:'formation',as_of:'2023-09-12',evidence_state:'official_claim',confidence:'high',confidence_reason:'The 2023 NDR said five additional backbone infantry brigades were to be formed by the end of 2023.',source_ids:['src_force_twn_mnd_national_defense_report_2023'],simulation_use:'Plan evidence only. Formation, manning, readiness, and acceptance at the bookmark remain unknown.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:reviewAfter,measurement_kind:'program_plan',subject_kind:'construction_program',component_scope:'unknown',population_definition:'planned formation program',observation_period:{start:null,end:null,precision:'unknown'},as_of_semantics:'source_publication_date',opening_stock_eligible:false},
  {claim_id:'claim_twn_2025_budget_planned_follow_on_submarines_7',subject_id:'construction_twn_planned_follow_on_indigenous_submarines',predicate:'planned_program_quantity',value:7,unit:'platform',as_of:'2024-08-22',evidence_state:'official_claim',confidence:'high',confidence_reason:'The official 2025 budget release describes seven follow-on indigenous submarines over 2025 through 2038.',source_ids:['src_force_twn_mnd_fy2025_budget_2024'],simulation_use:'Program envelope only. Ordered, delivered, accepted, available, and ready quantities remain unknown.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:reviewAfter,measurement_kind:'program_plan',subject_kind:'construction_program',component_scope:'unknown',population_definition:'planned program envelope',observation_period:{start:'2025-01-01',end:'2038-12-31',precision:'official_plan'},as_of_semantics:'source_publication_date',opening_stock_eligible:false},
  {claim_id:'claim_twn_2024_conscript_intake_6956',subject_id:'cohort_twn_2024_one_year_conscripts',predicate:'reported_2024_conscript_intake',value:6956,unit:'person',as_of:'2025-03-27',evidence_state:'official_claim',confidence:'high',confidence_reason:'Dated MND implementation result.',source_ids:['src_force_twn_mnd_conscript_review_2025'],simulation_use:'Historical cohort flow only; not active strength or training capacity.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:reviewAfter,measurement_kind:'cohort_flow',subject_kind:'cohort',component_scope:'unknown',population_definition:'persons entering the 2024 one-year conscript cohort',observation_period:{start:'2024-01-01',end:'2024-12-31',precision:'calendar_year'},as_of_semantics:'reporting_date',opening_stock_eligible:false},
  {claim_id:'claim_twn_2025_reported_conscripts_entered_reserve_2047',subject_id:'cohort_twn_2024_one_year_conscripts',predicate:'reported_conscripts_discharged_into_reserve_system',value:2047,unit:'person',as_of:'2025-03-27',evidence_state:'official_claim',confidence:'high',confidence_reason:'Dated partial implementation result, not the total reserve pool.',source_ids:['src_force_twn_mnd_conscript_review_2025'],simulation_use:'Partial cohort flow only; national reserve total remains unknown.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:reviewAfter,measurement_kind:'cohort_flow',subject_kind:'cohort',component_scope:'reserve_transition',population_definition:'reported members of the 2024 cohort discharged into the reserve system by the reporting date',observation_period:{start:'2024-01-01',end:'2025-03-27',precision:'reported_to_date'},as_of_semantics:'reporting_date',opening_stock_eligible:false},
  {claim_id:'claim_twn_2025_reported_conscripts_assigned_defense_units_3761',subject_id:'cohort_twn_2024_one_year_conscripts',predicate:'reported_conscripts_assigned_to_defense_units',value:3761,unit:'person',as_of:'2025-03-27',evidence_state:'official_claim',confidence:'high',confidence_reason:'Dated partial cohort result, not active strength or ready strength.',source_ids:['src_force_twn_mnd_conscript_review_2025'],simulation_use:'Partial cohort flow only; national active total and readiness remain unknown.',representation_tier:'national_capability',reviewed_at:'2026-08-06',review_after:reviewAfter,measurement_kind:'cohort_flow',subject_kind:'cohort',component_scope:'assignment_flow',population_definition:'reported members of the 2024 cohort assigned to named defense units by the reporting date',observation_period:{start:'2024-01-01',end:'2025-03-27',precision:'reported_to_date'},as_of_semantics:'reporting_date',opening_stock_eligible:false},
);
writeRows('claims.ndjson', claims);
writeRows('cohorts.ndjson', [{cohort_id:'cohort_twn_2024_one_year_conscripts',country_id:'country_twn',cohort_kind:'personnel_flow',population_definition:'Persons reported within implementation of the 2024 one-year conscription cohort.',opening_stock_eligible:false,source_ids:['src_force_twn_mnd_conscript_review_2025'],notes:'Cohort observations are flows and never initialize active personnel, reserve personnel, readiness, or training-capacity stocks.'}]);

writeRows('contradictions.ndjson', [{
  contradiction_set_id: 'contradiction_twn_fighter_scope_2024',
  question: 'What scope does the 2024 US Department of Defense Taiwan fighter estimate cover?',
  claim_ids: ['claim_twn_us_dod_2024_fighter_excluding_trainers_350','claim_twn_us_dod_2024_fighter_including_trainers_400'],
  source_ids: ['src_force_twn_us_dod_cmpr_2024'],
  status: 'partially_reconciled',
  resolution: 'The report states that 350 excludes fighter trainers and 400 includes them. The two claims are nested scopes, not additive inventories.',
  simulation_rule: 'Never sum 350 and 400. Keep the trainer subset and the 1 September 2025 opening fighter inventory unknown until a bookmark-valid source resolves the later count.',
  last_reviewed: '2026-08-06',
  review_after: reviewAfter,
  notes: 'The difference of 50 is not promoted to a trainer inventory because the source does not independently publish that derived category as an opening state.',
}]);

const poolDefs = [
  ['active_personnel','Armed forces active personnel unresolved opening pool','joint','active','joint','active personnel','organization_twn_general_staff_headquarters','person',[]],
  ['reserve_personnel','Armed forces reserve personnel unresolved opening pool','joint','reserve','joint','reserve personnel','organization_twn_reserve_command','person',[]],
  ['coast_guard_personnel','Coast Guard personnel unresolved opening pool','coast_guard','civilian_agency','maritime','Coast Guard personnel','organization_twn_coast_guard_administration','person',[]],
  ['ground_force_personnel','Ground force personnel unresolved opening pool','army','active','ground','ground force personnel','organization_twn_army_command_headquarters','person',['claim_twn_us_dod_2024_ground_force_personnel_104000']],
  ['army_corps','Army corps formation unresolved opening pool','army','active','ground','army corps','organization_twn_army_numbered_army_commands_aggregate','formation',['claim_twn_us_dod_2024_army_corps_3']],
  ['combined_arms_brigade','Combined arms brigade unresolved opening pool','army','active','ground','combined arms brigade','organization_twn_army_numbered_army_commands_aggregate','formation',['claim_twn_us_dod_2024_combined_arms_brigade_7']],
  ['artillery_brigade','Artillery brigade unresolved opening pool','army','active','ground','artillery brigade','organization_twn_army_numbered_army_commands_aggregate','formation',['claim_twn_us_dod_2024_artillery_brigade_3']],
  ['army_aviation_brigade','Army aviation brigade unresolved opening pool','army','active','air','army aviation brigade','organization_twn_army_aviation_and_special_forces_command','formation',['claim_twn_us_dod_2024_army_aviation_brigade_2']],
  ['marine_brigade','Marine brigade unresolved opening pool','marine','active','ground','marine brigade','organization_twn_navy_marine_corps_command','formation',['claim_twn_us_dod_2024_marine_brigade_2']],
  ['tank','Tank unresolved opening pool','army','active','ground','tank','organization_twn_army_command_headquarters','equipment_item',['claim_twn_us_dod_2024_tank_800']],
  ['artillery_piece','Artillery piece unresolved opening pool','army','active','ground','artillery piece','organization_twn_army_command_headquarters','equipment_item',['claim_twn_us_dod_2024_artillery_piece_1100']],
  ['ground_lift','Ground lift unresolved opening pool','army','active','logistics','ground lift','organization_twn_army_logistics_command','capacity_unit',[]],
  ['naval_combatant_parent','Naval combatant reconciliation parent unresolved opening pool','navy','active','maritime','naval combatants and amphibious ships','organization_twn_navy_fleet_command','platform',[]],
  ['amphibious_assault_ship','Amphibious assault ship unresolved opening pool','navy','active','maritime','amphibious assault ship','organization_twn_navy_fleet_command','platform',['claim_twn_us_dod_2024_amphibious_assault_ship_1']],
  ['destroyer','Destroyer unresolved opening pool','navy','active','maritime','destroyer','organization_twn_navy_fleet_command','platform',['claim_twn_us_dod_2024_destroyer_4']],
  ['frigate','Frigate unresolved opening pool','navy','active','maritime','frigate','organization_twn_navy_fleet_command','platform',['claim_twn_us_dod_2024_frigate_22']],
  ['corvette','Corvette classification unresolved opening pool','navy','active','maritime','corvette','organization_twn_navy_fleet_command','platform',['claim_twn_us_dod_2024_corvette_0']],
  ['landing_and_amphibious_ship','Landing and amphibious ship unresolved opening pool','navy','active','maritime','landing and amphibious ship','organization_twn_navy_fleet_command','platform',['claim_twn_us_dod_2024_landing_and_amphibious_ship_51']],
  ['attack_submarine','Attack submarine unresolved opening pool','navy','active','maritime','attack submarine','organization_twn_navy_fleet_command','platform',['claim_twn_us_dod_2024_attack_submarine_4']],
  ['coastal_patrol_missile_craft','Coastal patrol missile craft unresolved opening pool','navy','active','maritime','coastal patrol missile craft','organization_twn_navy_fleet_command','platform',['claim_twn_us_dod_2024_coastal_patrol_missile_craft_43']],
  ['naval_support_ship','Naval support ship unresolved opening pool','navy','active','logistics','naval support ship','organization_twn_navy_fleet_command','platform',[]],
  ['coast_guard_ship','Coast Guard ship unresolved opening pool','coast_guard','civilian_agency','maritime','Coast Guard ship','organization_twn_coast_guard_administration','platform',['claim_twn_us_dod_2024_coast_guard_ship_170']],
  ['fighter_including_trainers','Fighter including trainer reconciliation parent unresolved opening pool','air_force','active','air','fighter including trainer','organization_twn_air_force_air_combat_command','platform',['claim_twn_us_dod_2024_fighter_including_trainers_400']],
  ['fighter_excluding_trainers','Fighter excluding trainer unresolved opening pool','air_force','active','air','fighter','organization_twn_air_force_air_combat_command','platform',['claim_twn_us_dod_2024_fighter_excluding_trainers_350']],
  ['fighter_trainer_subset','Fighter trainer subset unresolved opening pool','air_force','training','air','fighter trainer','organization_twn_air_force_education_training_doctrine_development_command','platform',[]],
  ['bomber_attack_aircraft','Bomber and attack aircraft unresolved opening pool','air_force','active','air','bomber or attack aircraft','organization_twn_air_force_air_combat_command','platform',['claim_twn_us_dod_2024_bomber_attack_aircraft_0']],
  ['transport_aircraft','Transport aircraft unresolved opening pool','air_force','active','air','transport aircraft','organization_twn_air_force_air_combat_command','platform',['claim_twn_us_dod_2024_transport_aircraft_50']],
  ['special_mission_aircraft','Special mission aircraft unresolved opening pool','air_force','active','air','special mission aircraft','organization_twn_air_force_air_combat_command','platform',['claim_twn_us_dod_2024_special_mission_aircraft_20']],
  ['tanker_aircraft','Tanker aircraft unresolved opening pool','air_force','active','air','tanker aircraft','organization_twn_air_force_air_combat_command','platform',[]],
  ['rotary_wing_lift','Rotary wing lift unresolved opening pool','army','active','air','rotary wing lift','organization_twn_army_aviation_and_special_forces_command','platform',[]],
  ['air_and_missile_defense','Air and missile defense unresolved opening pool','air_force','active','air','air and missile defense system','organization_twn_air_force_air_defense_and_missile_command','battery',[]],
  ['joint_command_isr','Joint C2ISR unresolved opening capacity','joint','active','joint','joint C2ISR capacity','organization_twn_joint_operations_command_center','capacity_unit',[]],
  ['maintenance_capacity','National maintenance unresolved opening capacity','joint','active','logistics','maintenance capacity','organization_twn_general_staff_headquarters','capacity_unit',[]],
  ['training_capacity','National training unresolved opening capacity','joint','training','joint','training capacity','organization_twn_general_staff_headquarters','capacity_unit',[]],
  ['mobilization_capacity','National mobilization unresolved opening capacity','joint','mobilization','joint','mobilization capacity','organization_twn_all_out_defense_mobilization_agency','capacity_unit',[]],
  ['munition_stockpile','National munitions stockpile unresolved opening pool','joint','active','joint','munition stockpile','organization_twn_general_staff_headquarters','munition',[]],
];

const inventory = [], deployments = [], maintenanceRows = [], conservation = [];
for (const [slug,display,service,component,domain,category,orgId,unit,claimIds] of poolDefs) {
  const invId = `inventory_twn_${slug}`;
  const depId = `deployment_twn_${slug}_national_accounting`;
  const maintId = `maintenance_twn_${slug}_unknown_state`;
  const consId = `conservation_twn_${slug}`;
  const quantity = unknown(unit, 'Opening quantity at 1 September 2025 is unresolved. Dated estimates and partial flows remain claims and are not promoted into possession.');
  const sourceIds = claimIds.length ? ['src_force_twn_us_dod_cmpr_2024'] : ['src_force_twn_mnd_national_defense_report_2023'];
  if (slug === 'reserve_personnel' || slug === 'training_capacity') sourceIds.push('src_force_twn_mnd_conscript_review_2025');
  const parent = ['amphibious_assault_ship','destroyer','frigate','corvette','landing_and_amphibious_ship','attack_submarine','coastal_patrol_missile_craft'].includes(slug) ? 'inventory_twn_naval_combatant_parent' : ['fighter_excluding_trainers','fighter_trainer_subset'].includes(slug) ? 'inventory_twn_fighter_including_trainers' : null;
  const siblings = parent === 'inventory_twn_naval_combatant_parent' ? ['amphibious_assault_ship','destroyer','frigate','corvette','landing_and_amphibious_ship','attack_submarine','coastal_patrol_missile_craft'].filter((item) => item !== slug).map((item) => `inventory_twn_${item}`) : parent ? ['inventory_twn_fighter_excluding_trainers','inventory_twn_fighter_trainer_subset'].filter((item) => item !== invId) : [];
  const prov = provenance([...new Set(sourceIds)], claimIds.length ? 'estimated' : 'unknown', claimIds.length ? 'medium' : 'low', claimIds.length ? 'A dated aggregate estimate exists, but no source establishes the 1 September 2025 opening state.' : 'Explicit unknown prevents a confirmed capability or organization from being interpreted as a known opening quantity.');
  prov.claim_ids = claimIds;
  const resolvedComponent = claimIds.length ? 'all_components' : component;
  inventory.push({inventory_record_id:invId,inventory_kind:'unknown_estimate',country_id:'country_twn',owner_id:'country_twn',controller_id:'country_twn',service,component:resolvedComponent,equipment_type_id:`equipment_category_twn_${slug}`,display_name:display,domain,category,representation_tier:'national_capability',accounting_state:'unknown',quantity,organization_id:orgId,formation_id:null,location_id:null,current_deployment_id:depId,readiness:{band:'unknown',basis:'unknown',ready_quantity:unknown(unit,'Ready quantity is not established by aggregate estimates or organization existence.'),mobilization_delay_hours:null,limiting_factors:['Possessed, available, ready, and deployed are distinct unresolved states.']},maintenance:{state:'unknown',quantity:unknown(unit,'Maintenance allocation is not publicly established at the bookmark.'),maintenance_record_ids:[maintId]},counting_scope:{scope_kind:parent?'inventory_pool':'national_total',scope_id:invId,parent_inventory_record_id:parent,mutually_exclusive_with:siblings},individual_platform_ids:[],construction_record_ids:[],conservation_record_id:consId,temporal_validity:{valid_from:asOf,valid_to:null,as_of:asOf,observed_at:null,review_after:reviewAfter},provenance:prov,notes:'National accounting pool only. It is not executable and carries no exact position, route, movement, assignment, readiness, or maintenance claim.'});
  deployments.push({deployment_id:depId,country_id:'country_twn',controller_id:'country_twn',entity_type:'inventory_pool',entity_id:invId,quantity,assignment:'unknown',command_organization_id:orgId,availability_state:'unknown',location:{location_status:'unknown',crs:'EPSG:4326'},movement:{state:'unknown',route_id:null,origin_location_id:null,destination_location_id:null,departed_at:null,estimated_arrival:null},commitment:{commitment_kind:'unknown',operation_or_event_id:null,release_constraints:['Research-only national pool; no executable child allocation has been accepted.']},accounting_allocation:{conservation_record_id:consId,executable_child_allocation_id:null,release_gate:'blocked_unaccepted_packet'},support_dependency_ids:[],temporal_validity:{valid_from:asOf,valid_to:null,as_of:asOf,observed_at:null,review_after:reviewAfter},stale_after:reviewAfter,provenance:prov,notes:'Accounting deployment only. Location, movement, theater availability, and mission commitment are explicitly unknown.'});
  maintenanceRows.push({maintenance_record_id:maintId,country_id:'country_twn',subject_type:'inventory_pool',subject_id:invId,maintenance_kind:'other',state:'unknown',quantity:unknown(unit,'No source establishes the maintenance subset at the bookmark.'),started_at:null,completion_estimate:{kind:'unknown'},facility_id:null,readiness_effect:'unknown',dependency_ids:[],resulting_equipment_type_id:null,temporal_validity:{valid_from:asOf,valid_to:null,as_of:asOf,observed_at:null,review_after:reviewAfter},provenance:provenance([...new Set(sourceIds)],'unknown','low','Explicit unknown record prevents absent maintenance evidence from being interpreted as zero or available.'),notes:'No current maintenance quantity or readiness effect is asserted.'});
  conservation.push({conservation_record_id:consId,country_id:'country_twn',equipment_type_id:`equipment_category_twn_${slug}`,scope:{scope_kind:'inventory_pool',scope_id:invId,parent_conservation_record_id:parent?`conservation_twn_${parent.replace('inventory_twn_','')}`:null,exclusion_rule:parent?'Child scope is mutually exclusive with siblings and is not added to its reconciliation parent outside reconciliation.':'Standalone national pool; child detail, if added, must not be summed twice.'},counting_unit:unit,period:{opening_at:asOf,closing_at:asOf},opening_inventory:quantity,inflows:[],closing_states:[{accounting_state:'unknown',quantity,inventory_record_ids:[invId]}],outflows:[],result:{state:'blocked_by_unknowns',residual_kind:'unknown',unresolved_record_ids:[invId]},provenance:prov,notes:'Structural conservation records unresolved opening quantity without pretending a dated estimate is exact possession.'});
}
writeRows('inventory.ndjson', inventory);
writeRows('deployments.ndjson', deployments);
writeRows('maintenance.ndjson', maintenanceRows);
writeRows('conservation.ndjson', conservation);

const aggregationSets = [
  {aggregation_set_id:'aggregation_set_twn_naval_report_categories',sibling_set_id:'sibling_set_twn_naval_report_categories',parent_inventory_record_id:'inventory_twn_naval_combatant_parent',parent_equipment_type_id:'equipment_category_twn_naval_combatant_parent',parent_conservation_record_id:'conservation_twn_naval_combatant_parent',child_inventory_record_ids:['inventory_twn_amphibious_assault_ship','inventory_twn_destroyer','inventory_twn_frigate','inventory_twn_corvette','inventory_twn_landing_and_amphibious_ship','inventory_twn_attack_submarine','inventory_twn_coastal_patrol_missile_craft'],residual_category_id:null,residual_state:'unknown',completeness_state:'source_category_boundaries_unresolved',raw_parent_child_sum_allowed:false},
  {aggregation_set_id:'aggregation_set_twn_fighter_report_scopes',sibling_set_id:'sibling_set_twn_fighter_report_scopes',parent_inventory_record_id:'inventory_twn_fighter_including_trainers',parent_equipment_type_id:'equipment_category_twn_fighter_including_trainers',parent_conservation_record_id:'conservation_twn_fighter_including_trainers',child_inventory_record_ids:['inventory_twn_fighter_excluding_trainers','inventory_twn_fighter_trainer_subset'],residual_category_id:'inventory_twn_fighter_trainer_subset',residual_state:'unknown',completeness_state:'nested_scope_known_values_unreconciled_at_bookmark',raw_parent_child_sum_allowed:false},
];
writeRows('aggregation_sets.ndjson', aggregationSets);

const constructionRows = [
  {construction_record_id:'construction_twn_planned_follow_on_indigenous_submarines',country_id:'country_twn',customer_id:'organization_twn_navy_command_headquarters',equipment_type_id:'equipment_category_twn_planned_follow_on_submarine',platform_id:null,program_or_lot:'2025 through 2038 follow-on indigenous submarine program',quantity_ordered:unknown('platform','The budget release describes seven planned follow-on boats but does not establish that seven were contracted or ordered at the bookmark.'),quantity_delivered:unknown('platform','No source in this packet establishes deliveries.'),quantity_accepted:unknown('platform','No source in this packet establishes acceptance.'),state:'planned',producer_ids:['organization_twn_indigenous_defense_industry_aggregate'],production_site_ids:[],milestones:[{milestone_type:'authorized',date_kind:'official_plan',date:'2025-01-01'}],temporal_validity:temporal('2024-08-22'),provenance:{...provenance(['src_force_twn_mnd_fy2025_budget_2024']),claim_ids:['claim_twn_2025_budget_planned_follow_on_submarines_7']},notes:'Program envelope only. The producer is a public aggregate research category with unknown identity, site, throughput, and capacity. Planned quantity must not become ordered, delivered, accepted, possessed, available, or ready without later evidence.'},
  {construction_record_id:'construction_twn_planned_backbone_infantry_brigades',country_id:'country_twn',customer_id:'organization_twn_army_command_headquarters',equipment_type_id:'equipment_category_twn_planned_infantry_brigade',platform_id:null,program_or_lot:'Five planned infantry backbone brigades',quantity_ordered:unknown('formation','The report stated a planned formation count, not an acquisition order.'),quantity_delivered:unknown('formation','No dated source in this packet proves completed formation.'),quantity_accepted:unknown('formation','No dated source in this packet proves accepted and manned formation.'),state:'planned',producer_ids:['organization_twn_army_command_headquarters'],production_site_ids:[],milestones:[{milestone_type:'other',date_kind:'official_plan',date:'2023-12-31'}],temporal_validity:temporal('2023-09-12'),provenance:{...provenance(['src_force_twn_mnd_national_defense_report_2023']),claim_ids:['claim_twn_2023_planned_backbone_infantry_brigades_5']},notes:'Formation plan only. The packet does not infer completion, manning, equipment, readiness, or deployment.'},
];
writeRows('construction.ndjson', constructionRows);

const orgLookup = new Map(organizations.map((row) => [row.organization_id,row]));
for (const row of organizations) row.inventory_record_ids = inventory.filter((item) => item.organization_id === row.organization_id).map((item) => item.inventory_record_id);
writeRows('organizations.ndjson', organizations);

manifest.dataset_paths.claims = 'claims.ndjson';
manifest.dataset_paths.cohorts = 'cohorts.ndjson';
manifest.dataset_paths.authority_claims = 'authority_claims.ndjson';
manifest.dataset_paths.aggregation_sets = 'aggregation_sets.ndjson';
manifest.scope.components = [...new Set([...manifest.scope.components,'mobilization','training'])];
manifest.scope.coverage_matrix = [
  ['joint','joint','identified','structured','inventory_partial'],['army','ground','identified','structured','inventory_partial'],['marine','ground','identified','structured','inventory_partial'],['navy','maritime','identified','structured','inventory_partial'],['air_force','air','identified','structured','inventory_partial'],['coast_guard','maritime','identified','structured','inventory_partial'],['joint','logistics','identified','structured','inventory_partial'],
].map(([service,domain,organization_depth,equipment_taxonomy,inventoryState],index)=>({coverage_id:`coverage_twn_national_${index+1}`,service,domain,organization_depth,equipment_taxonomy,inventory:inventoryState,dispositions:'identified',maintenance:'identified',construction:'inventory_partial',conservation:'structured',notes:'National aggregate only. Opening quantities remain unknown and nonexecutable; dated numeric evidence is retained as claims.'}));
manifest.reconciliation.equipment_type_records = equipment.length;
manifest.reconciliation.inventory_records = inventory.length;
manifest.reconciliation.deployment_records = deployments.length;
manifest.reconciliation.maintenance_records = maintenanceRows.length;
manifest.reconciliation.construction_records = 2;
manifest.reconciliation.conservation_records = conservation.length;
const recordSets = [organizations, relationships, equipment, inventory, deployments, maintenanceRows, constructionRows, conservation, claims, authorityClaims];
const expired = recordSets.flat().filter((row) => {
  const validTo = row.temporal_validity?.valid_to;
  const review = row.temporal_validity?.review_after ?? row.review_after;
  return (validTo && Date.parse(validTo) <= Date.parse(asOf)) || (review && Date.parse(review) <= Date.parse(asOf));
}).length;
const duplicateExtras = (values) => values.length - new Set(values).size;
manifest.reconciliation.exact_quantity_records = inventory.filter((row) => row.quantity.kind === 'exact').length;
manifest.reconciliation.range_quantity_records = inventory.filter((row) => row.quantity.kind === 'range').length;
manifest.reconciliation.unknown_quantity_records = inventory.filter((row) => row.quantity.kind === 'unknown').length;
manifest.reconciliation.open_conservation_exceptions = conservation.filter((row) => row.result.state !== 'balanced').length;
manifest.reconciliation.double_booking_exceptions = duplicateExtras(deployments.map((row) => row.entity_id)) + duplicateExtras(maintenanceRows.map((row) => row.subject_id)) + duplicateExtras(conservation.map((row) => row.scope.scope_id));
manifest.reconciliation.orphan_platform_records = 0;
manifest.reconciliation.orphan_organization_records = organizations.filter((row) => !row.relationship_record_ids.length).length;
manifest.reconciliation.expired_records = expired;
manifest.unknowns = [
  'Exact 1 September 2025 authorized, possessed, available, ready, deployed, maintenance, stored, damaged, and retired quantities remain unresolved unless expressly stated as a dated claim.',
  'The US Department of Defense 2024 Taiwan balance tables are operational estimates from a prior reporting snapshot, not a Taiwan custody ledger and not an exact bookmark inventory.',
  'The public fighter figures of 350 and 400 are nested scopes. They may not be summed, and the derived difference is not accepted as a separate trainer opening inventory.',
  'National active personnel, national reserve personnel, Coast Guard personnel, tanker aircraft, rotary wing lift, naval support, ground lift, integrated air and missile defense, munitions, maintenance throughput, training throughput, and mobilization throughput remain unknown.',
  'No exact location, route, movement, base assignment, theater allocation, current mission, readiness percentage, or maintenance percentage is represented.',
  'The seven-submarine and five-brigade figures are plan claims. Ordered, delivered, accepted, manned, possessed, available, and ready states remain unknown.',
];
manifest.notes = 'Collecting Taiwan national force packet. Public aggregate estimates are retained as atomic claims while all 1 September 2025 opening pools remain structurally conserved unknowns. No pool is executable pending independent review.';
manifest.acceptance.schema_valid = true;
manifest.acceptance.internally_consistent = false;
manifest.acceptance.research_complete = false;
manifest.acceptance.decision_usable = false;
manifest.acceptance.simulation_ready = false;
manifest.acceptance.untested_claims = ['Dated estimates, command paths, parent-child scopes, and plan-state quarantines require independent review.'];
manifest.acceptance.blockers = ['No exact bookmark custody ledger reconciles the public estimates.','Ready, available, deployed, maintenance, lift, munitions, and mobilization quantities remain unknown.','Independent review has not passed.'];
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
