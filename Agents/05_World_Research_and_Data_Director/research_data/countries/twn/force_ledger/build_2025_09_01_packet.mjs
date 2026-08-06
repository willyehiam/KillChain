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
