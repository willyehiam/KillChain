import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const readRows = (name) => fs.readFileSync(path.join(root, name), 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const writeRows = (name, rows) => fs.writeFileSync(path.join(root, name), `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
const asOf = '2025-09-01T00:00:00Z';
const reviewAfter = '2026-11-06';
const tv = (validFrom) => ({valid_from: validFrom, as_of: asOf, observed_at: null, review_after: reviewAfter});
const unknownPerson = (rule) => ({kind: 'unknown', unit: 'person', counting_rule: rule});
const provenance = (sourceIds, method, evidenceState = 'official_claim', confidence = 'high') => ({
  evidence_state: evidenceState,
  confidence,
  source_ids: sourceIds,
  claim_ids: [],
  contradiction_set_ids: [],
  method,
});

let organizations = readRows('organizations.ndjson');
let relationships = readRows('relationships.ndjson');
const orgById = new Map(organizations.map((row) => [row.organization_id, row]));
const relById = new Map(relationships.map((row) => [row.relationship_id, row]));
const cmcTemplate = structuredClone(orgById.get('organization_chn_cmc_joint_staff_department'));
const theaterTemplate = structuredClone(orgById.get('organization_chn_eastern_theater_command'));

const addOrg = ({id, name, nativeName, service, kind, echelon, parent, roles, validFrom, sourceIds, notes}) => {
  if (orgById.has(id)) return orgById.get(id);
  const template = kind === 'operational_command' ? theaterTemplate : cmcTemplate;
  const row = structuredClone(template);
  Object.assign(row, {
    organization_id: id,
    country_id: 'country_chn',
    controller_id: 'institution_chn_cpc_central_committee',
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
      authorized: unknownPerson('Public organization identity does not establish personnel strength.'),
      assigned: unknownPerson('Public organization identity does not establish assigned strength.'),
      deployable: unknownPerson('Public organization identity does not establish deployable strength.'),
    },
    readiness: {state: 'unknown', basis: 'unknown', limiting_factors: ['Readiness is not inferred from public organization identity.']},
    mobilization: {status: 'standing', authority_id: null, minimum_delay_hours: null, equipment_pool_ids: []},
    roles,
    inventory_record_ids: [],
    temporal_validity: tv(validFrom),
    provenance: provenance(sourceIds, 'Public organization identity and command relationship; no current assignment, readiness, or location is inferred.'),
    display_parent_organization_id: parent,
    relationship_record_ids: [],
    notes,
  });
  organizations.push(row);
  orgById.set(id, row);
  return row;
};

const addRel = ({id, source, target, type, active = 'active', domains = ['joint'], missions = [], issue = false, reassign = false, release = false, conditions = [], sourceIds, validFrom, notes}) => {
  const row = {
    relationship_id: id,
    country_id: 'country_chn',
    source_organization_id: source,
    target_organization_id: target,
    relationship_type: type,
    authority_scope: {domains, missions, may_issue_orders: issue, may_reassign_forces: reassign, may_release_for_mission: release},
    activation_state: active,
    conditions,
    precedence: 100,
    temporal_validity: tv(validFrom),
    provenance: provenance(sourceIds, 'Public aggregate command relationship. It does not establish a current force assignment or executable mission authority.'),
    notes,
  };
  if (relById.has(id)) {
    Object.assign(relById.get(id), row);
    return;
  }
  relationships.push(row);
  relById.set(id, row);
};

// Official 2024 terminology: these are four arms, not four services.
for (const id of ['organization_chn_pla_aerospace_force','organization_chn_pla_cyberspace_force','organization_chn_pla_information_support_force','organization_chn_pla_joint_logistic_support_force']) {
  const org = orgById.get(id);
  org.organization_kind = 'strategic_arm';
  org.echelon = 'strategic_arm';
  org.service = 'other';
  org.provenance.source_ids = [...new Set([...org.provenance.source_ids, 'src_force_chn_mod_new_service_system_2024', 'src_force_chn_state_council_force_flags_2025'])];
  org.notes = 'Officially designated one of four PLA arms. The neutral service label prevents an unsupported functional translation from becoming an organizational class.';
}

const cmcOrgSource = ['src_force_chn_defense_white_paper_2019','src_force_chn_us_dod_cmpr_2024'];
for (const [slug, name, nativeName, roles] of [
  ['political_work_department','CMC Political Work Department','中央军委政治工作部',['political work','personnel policy support']],
  ['logistic_support_department','CMC Logistic Support Department','中央军委后勤保障部',['logistics policy','joint sustainment administration']],
  ['equipment_development_department','CMC Equipment Development Department','中央军委装备发展部',['equipment development','acquisition administration']],
  ['training_administration_department','CMC Training Administration Department','中央军委训练管理部',['training policy','training supervision']],
  ['national_defense_mobilization_department','CMC National Defense Mobilization Department','中央军委国防动员部',['mobilization policy','reserve and militia coordination']],
  ['discipline_inspection_commission','CMC Discipline Inspection Commission','中央军委纪律检查委员会',['discipline inspection','anticorruption oversight']],
]) {
  const id = `organization_chn_cmc_${slug}`;
  addOrg({id, name, nativeName, service: 'joint', kind: 'general_staff', echelon: 'general_staff', parent: 'organization_chn_central_military_commission', roles, validFrom: '2016-01-11', sourceIds: cmcOrgSource, notes: 'Aggregate public CMC organ. Internal staffing and workflow remain unknown.'});
  addRel({id: `relationship_chn_${slug}_central_military_commission_supporting`, source: id, target: 'organization_chn_central_military_commission', type: 'supporting', sourceIds: cmcOrgSource, validFrom: '2016-01-11', notes: 'Staff relationship only; the organ is not modeled as an independent operational commander.'});
}

// The public command structure identifies five Army and Air Force theater components and three Navy theater components.
const theaterComponents = [
  ['eastern','army','Eastern Theater Command Army','东部战区陆军'],['eastern','navy','Eastern Theater Command Navy','东部战区海军'],['eastern','air_force','Eastern Theater Command Air Force','东部战区空军'],
  ['southern','army','Southern Theater Command Army','南部战区陆军'],['southern','navy','Southern Theater Command Navy','南部战区海军'],['southern','air_force','Southern Theater Command Air Force','南部战区空军'],
  ['western','army','Western Theater Command Army','西部战区陆军'],['western','air_force','Western Theater Command Air Force','西部战区空军'],
  ['northern','army','Northern Theater Command Army','北部战区陆军'],['northern','navy','Northern Theater Command Navy','北部战区海军'],['northern','air_force','Northern Theater Command Air Force','北部战区空军'],
  ['central','army','Central Theater Command Army','中部战区陆军'],['central','air_force','Central Theater Command Air Force','中部战区空军'],
];
const serviceOrg = {army: 'organization_chn_pla_army', navy: 'organization_chn_pla_navy', air_force: 'organization_chn_pla_air_force'};
const domain = {army: 'ground', navy: 'maritime', air_force: 'air'};
for (const [theater, service, name, nativeName] of theaterComponents) {
  const component = `organization_chn_${theater}_theater_${service}`;
  const command = `organization_chn_${theater}_theater_command`;
  addOrg({id: component, name, nativeName, service, kind: 'operational_command', echelon: service === 'navy' ? 'fleet' : 'functional_command', parent: command, roles: [`${service} theater operations`, 'joint campaign component'], validFrom: '2016-02-01', sourceIds: cmcOrgSource, notes: 'Public aggregate theater component. Subordinate bases, fleets, brigades, and current assignments remain unresolved.'});
  addRel({id: `relationship_chn_${service}_${theater}_theater_component_organize_train_equip`, source: serviceOrg[service], target: component, type: 'organize_train_equip', domains: [domain[service]], missions: ['force development','administration'], issue: true, reassign: false, release: false, sourceIds: cmcOrgSource, validFrom: '2016-02-01', notes: 'Generating-service relationship; it does not override theater operational command.'});
  addRel({id: `relationship_chn_${theater}_theater_command_${service}_component_operational_control`, source: command, target: component, type: 'operational_control', domains: [domain[service]], missions: ['theater joint operations'], issue: true, reassign: true, release: true, sourceIds: cmcOrgSource, validFrom: '2016-02-01', notes: 'Aggregate theater operational relationship; no present deployment or unit allocation is asserted.'});
}

// Public drills establish Rocket Force participation under theater joint direction, not a permanent theater Rocket Force component.
addRel({
  id: 'relationship_chn_pla_rocket_force_eastern_theater_conditional_force_assignment',
  source: 'organization_chn_pla_rocket_force',
  target: 'organization_chn_eastern_theater_command',
  type: 'force_assignment',
  active: 'conditional',
  domains: ['joint'],
  missions: ['theater joint exercise or operation when assigned'],
  issue: false,
  reassign: false,
  release: false,
  conditions: ['Requires a specific CMC assignment; no standing assigned force or current allocation is inferred.'],
  sourceIds: ['src_force_chn_us_dod_cmpr_2024'],
  validFrom: '2024-12-18',
  notes: 'Conditional relationship preserves the distinction between observed participation and permanent subordination.',
});

// All four arms remain under CMC leadership and command; support does not become theater availability.
for (const slug of ['aerospace_force','cyberspace_force','information_support_force','joint_logistic_support_force']) addRel({
  id: `relationship_chn_central_military_commission_pla_${slug}_administrative_control`,
  source: 'organization_chn_central_military_commission',
  target: `organization_chn_pla_${slug}`,
  type: 'administrative_control',
  domains: ['joint'],
  missions: ['arm development and administration'],
  issue: true,
  reassign: true,
  release: false,
  sourceIds: ['src_force_chn_mod_new_service_system_2024','src_force_chn_state_council_force_flags_2025'],
  validFrom: '2024-04-19',
  notes: 'CMC administrative relationship only; operational support allocation remains unknown.',
});

// Rebuild relationship references and preserve display containment separately.
for (const org of organizations) org.relationship_record_ids = [];
for (const relationship of relationships) {
  orgById.get(relationship.source_organization_id)?.relationship_record_ids.push(relationship.relationship_id);
  orgById.get(relationship.target_organization_id)?.relationship_record_ids.push(relationship.relationship_id);
}
writeRows('organizations.ndjson', organizations);
writeRows('relationships.ndjson', relationships);

const manifestPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.reconciliation.organization_records = organizations.length;
manifest.reconciliation.relationship_records = relationships.length;
manifest.unknowns = [
  'The public CMC organ and theater component layer does not establish internal staffing, command workflow latency, or current assignments.',
  'Group armies, bases, brigades, regiments, fleets below theater component level, and Rocket Force base assignments remain unaccepted.',
  'A conditional Rocket Force to Eastern Theater relationship does not assert a permanent theater Rocket Force component.',
  ...manifest.unknowns.filter((value) => !value.startsWith('Subordinate theater service components')),
];
manifest.notes = 'China command checkpoint: official four-service/four-arm classification, public CMC organ layer, five Army and Air Force theater components, three Navy theater components, and typed generating-to-operating relationships. No current assignment, readiness, or location is inferred.';
manifest.acceptance.research_complete = false;
manifest.acceptance.decision_usable = false;
manifest.acceptance.simulation_ready = false;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({organizations: organizations.length, relationships: relationships.length, strategic_arms: 4, theater_components: theaterComponents.length}, null, 2));
