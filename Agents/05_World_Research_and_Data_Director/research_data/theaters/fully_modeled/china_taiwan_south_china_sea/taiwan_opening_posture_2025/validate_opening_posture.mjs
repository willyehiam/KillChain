import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cutoffText = '2025-09-01T00:00:00Z';
const cutoff = Date.parse(cutoffText);
const idPattern = /^[a-z0-9_]+$/;
const forbiddenFuture = /justice mission 2025/i;
const unsafeKey = /^(?:lat|latitude|lon|lng|longitude|coord|coords|coordinate|coordinates|geometry|geom|bbox|position|centroid|center|centre|geohash|wkt|polyline|exactsite|exactlocation|address|mgrs)$/i;
const coordinateText = /(?:^|\s|\[|\()[-+]?\d{1,3}\.\d{3,}\s*[,/]\s*[-+]?\d{1,3}\.\d{3,}(?:$|\s|\]|\))/;
const requiredFiles = ['manifest.json','sources.ndjson','claims.ndjson','posture_records.json','exercise_lineage.json','crisis_triggers.json','contradictions.json','force_reconciliation.json','future_reference_firewall.json'];

function readJson(root,name,errors){try{return JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));}catch(error){errors.push(`${name}: ${error.message}`);return {};}}
function readNdjson(root,name,errors){try{return fs.readFileSync(path.join(root,name),'utf8').split(/\r?\n/).filter(Boolean).map((line,index)=>{try{return JSON.parse(line);}catch(error){errors.push(`${name} line ${index+1}: ${error.message}`);return null;}}).filter(Boolean);}catch(error){errors.push(`${name}: ${error.message}`);return [];}}
function walk(value,errors,at='$'){
  if(typeof value==='string'){
    if(coordinateText.test(value)) errors.push(`${at}: coordinate pair is forbidden`);
    return;
  }
  if(Array.isArray(value)){if(value.length>=2&&value.length<=4&&value.every(Number.isFinite)) errors.push(`${at}: coordinate like array is forbidden`);value.forEach((v,i)=>walk(v,errors,`${at}[${i}]`));return;}
  if(!value||typeof value!=='object') return;
  for(const [key,child] of Object.entries(value)){if(unsafeKey.test(key.replaceAll(/[^a-z]/gi,''))) errors.push(`${at}.${key}: unsafe location field is forbidden`);walk(child,errors,`${at}.${key}`);}
}
function indexUnique(rows,key,label,errors){const map=new Map();for(const row of rows){const id=row?.[key];if(typeof id!=='string'||!idPattern.test(id)) errors.push(`${label}: invalid ${key} ${id}`);else if(map.has(id)) errors.push(`${label}: duplicate ${id}`);else map.set(id,row);}return map;}
function dateNoLater(value,label,errors){const parsed=Date.parse(value);if(Number.isNaN(parsed)) errors.push(`${label}: invalid date`);else if(parsed>cutoff) errors.push(`${label}: leaks post bookmark knowledge`);}
function loadCanonicalForceIds(root,reconciliation,errors,override){
  if(override) return new Set(override);
  const ids=new Set();
  for(const ledger of reconciliation.ledgers??[]){
    const file=path.resolve(root,ledger.path);
    if(!fs.existsSync(file)){errors.push(`force ledger missing ${ledger.path}`);continue;}
    const rows=fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
    for(const row of rows) ids.add(row.organization_id);
  }
  return ids;
}

export function validateOpeningPosture(root=here,options={}){
  const errors=[];
  for(const file of requiredFiles) if(!fs.existsSync(path.join(root,file))) errors.push(`missing file ${file}`);
  const manifest=readJson(root,'manifest.json',errors);
  const sources=readNdjson(root,'sources.ndjson',errors);
  const claims=readNdjson(root,'claims.ndjson',errors);
  const posture=readJson(root,'posture_records.json',errors);
  const lineage=readJson(root,'exercise_lineage.json',errors);
  const triggers=readJson(root,'crisis_triggers.json',errors);
  const contradictions=readJson(root,'contradictions.json',errors);
  const reconciliation=readJson(root,'force_reconciliation.json',errors);
  const firewall=readJson(root,'future_reference_firewall.json',errors);
  const sourceIndex=indexUnique(sources,'source_id','sources',errors);
  const claimIndex=indexUnique(claims,'claim_id','claims',errors);
  if(manifest.as_of!==cutoffText||manifest.opening_truth!==false) errors.push('manifest: packet must remain outside canonical opening truth');
  if(manifest.simulation_readiness!=='blocked_research_only') errors.push('manifest: status firewall must remain blocked');
  for(const consumer of ['simulation_initialization','country_ai','balance_calibration','mission_generation']) if(!manifest.status_firewall?.forbidden_consumers?.includes(consumer)) errors.push(`manifest: missing forbidden consumer ${consumer}`);
  const allowed=new Set(manifest.status_firewall?.allowed_consumers??[]);
  for(const consumer of manifest.status_firewall?.forbidden_consumers??[]) if(allowed.has(consumer)) errors.push(`manifest: consumer ${consumer} cannot be both allowed and forbidden`);
  if(!Array.isArray(manifest.status_firewall?.release_conditions)||manifest.status_firewall.release_conditions.some(item=>!item.condition_id||item.status!=='unmet')) errors.push('manifest: release conditions require structured unmet approval records');
  if(!Number.isInteger(manifest.status_firewall?.unresolved_blocker_count)||manifest.status_firewall.unresolved_blocker_count<1) errors.push('manifest: unresolved blocker count must remain explicit');
  const expected={sources:sources.length,claims:claims.length,posture_records:posture.records?.length??0,exercise_lineage:lineage.events?.length??0,crisis_triggers:triggers.triggers?.length??0,contradictions:contradictions.contradictions?.length??0,force_exceptions:reconciliation.exceptions?.length??0};
  for(const [key,value] of Object.entries(expected)) if(manifest.record_counts?.[key]!==value) errors.push(`manifest: count ${key} expected ${value}`);
  for(const source of sources){
    for(const field of ['title','publisher','url','published_at','available_at','accessed_at','source_type','source_tier','relevant_locator','claim_snapshot','artifact_sha256']) if(!source[field]) errors.push(`${source.source_id}: missing ${field}`);
    dateNoLater(source.available_at,`${source.source_id}.available_at`,errors);
    dateNoLater(source.published_at,`${source.source_id}.published_at`,errors);
    for(const field of ['last_updated_at','source_available_at','observation_started_at','observation_ended_at']) if(source[field]&&!String(source[field]).startsWith('unknown_')) dateNoLater(source[field],`${source.source_id}.${field}`,errors);
    if(forbiddenFuture.test(JSON.stringify(source))) errors.push(`${source.source_id}: future reference leaked into source metadata`);
    const hash=crypto.createHash('sha256').update(source.claim_snapshot??'').digest('hex');
    if(hash!==source.artifact_sha256) errors.push(`${source.source_id}: frozen artifact hash mismatch`);
  }
  const validEvidence=new Set(['official_claim','derived','observed','modeled_assumption']);
  const validConfidence=new Set(['high','medium','low','unknown']);
  for(const item of claims){
    if(!item.statement||!item.source_ids?.length) errors.push(`${item.claim_id}: statement and source_ids required`);
    for(const id of item.source_ids??[]) if(!sourceIndex.has(id)) errors.push(`${item.claim_id}: unresolved source ${id}`);
    if(!validEvidence.has(item.evidence_state)) errors.push(`${item.claim_id}: invalid evidence_state`);
    if(!validConfidence.has(item.confidence)) errors.push(`${item.claim_id}: invalid confidence`);
    if(item.as_of!==cutoffText||item.temporal_validity?.as_of!==cutoffText) errors.push(`${item.claim_id}: as_of mismatch`);
    if(forbiddenFuture.test(JSON.stringify(item))) errors.push(`${item.claim_id}: future reference leaked into opening claim`);
  }
  const canonicalForceIds=loadCanonicalForceIds(root,reconciliation,errors,options.canonicalForceIds);
  const forceBearing=[...(posture.records??[]),...(lineage.events??[])];
  for(const record of forceBearing){
    for(const id of record.claim_ids??[]) if(!claimIndex.has(id)) errors.push(`${record.posture_id??record.lineage_id}: unresolved claim ${id}`);
    for(const id of record.source_ids??[]) if(!sourceIndex.has(id)) errors.push(`${record.posture_id??record.lineage_id}: unresolved source ${id}`);
    for(const ref of record.force_refs??[]){
      const label=record.posture_id??record.lineage_id;
      if(!ref||typeof ref!=='object'||Array.isArray(ref)){errors.push(`${label}: force reference must be a semantic object`);continue;}
      if(!canonicalForceIds.has(ref.organization_id)) errors.push(`${label}: unresolved force reference ${ref.organization_id}`);
      for(const field of ['reference_semantics','deployment_status','readiness_status','access_status','theater_availability_status']) if(!ref[field]) errors.push(`${label}: force reference missing ${field}`);
      if(ref.deployment_status!=='unknown'||ref.readiness_status!=='unknown'||ref.theater_availability_status!=='unknown') errors.push(`${label}: unsupported organization state must remain unknown`);
      for(const concept of ['deployment','readiness','access','theater_availability']) if(!(ref.does_not_imply??[]).some(item=>item.includes(concept))) errors.push(`${label}: force identity does not disclaim ${concept}`);
    }
    if(forbiddenFuture.test(JSON.stringify(record))) errors.push(`${record.posture_id??record.lineage_id}: future reference leaked into opening record`);
  }
  for(const record of posture.records??[]){
    if(record.valid_at!==cutoffText) errors.push(`${record.posture_id}: valid_at mismatch`);
    if(record.category==='observed_activity'&&record.count_semantics!=='activity_instances_not_unique_platforms') errors.push(`${record.posture_id}: observed activity cannot be treated as unique platform inventory`);
    if('readiness' in record) errors.push(`${record.posture_id}: overloaded readiness field is forbidden`);
    if(!['unknown','not_applicable_policy_record'].includes(record.readiness_assessment)) errors.push(`${record.posture_id}: unsupported readiness assessment`);
    if(!['unknown_not_approved','not_applicable'].includes(record.access_permission)) errors.push(`${record.posture_id}: unsupported access permission state`);
    if(record.theater_availability!=='unknown') errors.push(`${record.posture_id}: theater availability must remain unknown`);
    const prose=record.summary??'';
    if(/fully combat ready|forward deployed|immediately available/i.test(prose)) errors.push(`${record.posture_id}: readiness or deployment assertion is forbidden in prose`);
    if(/automatically authorize|automatic permission is granted|permission is automatic/i.test(prose)) errors.push(`${record.posture_id}: automatic allied permission is forbidden in prose`);
  }
  for(const event of lineage.events??[]){if(event.status!=='historical_prebookmark_observed') errors.push(`${event.lineage_id}: lineage status must be historical prebookmark observed`);dateNoLater(`${event.ended_on}T23:59:59Z`,`${event.lineage_id}.ended_on`,errors);}
  for(const trigger of triggers.triggers??[]){if(trigger.knowledge_state!=='scenario_hypothesis'||trigger.probability!=='unknown'||trigger.activation!=='disabled_until_scenario_rules_are_reviewed') errors.push(`${trigger.trigger_id}: trigger must remain a disabled scenario hypothesis`);if(/already fired|forces automatic|guaranteed|deterministic/i.test(trigger.description??'')) errors.push(`${trigger.trigger_id}: deterministic trigger prose is forbidden`);if(forbiddenFuture.test(JSON.stringify(trigger))) errors.push(`${trigger.trigger_id}: future reference leaked into trigger`);}
  for(const item of contradictions.contradictions??[]){if((item.positions??[]).length<2) errors.push(`${item.contradiction_id}: at least two contradiction positions required`);for(const side of item.positions??[]){if(!(side.claim_ids??[]).length) errors.push(`${item.contradiction_id}: empty contradiction side is forbidden`);for(const id of side.claim_ids??[]) if(!claimIndex.has(id)) errors.push(`${item.contradiction_id}: unresolved claim ${id}`);}if(!item.resolution) errors.push(`${item.contradiction_id}: resolution policy required`);}
  if((reconciliation.exceptions??[]).length) errors.push('force reconciliation: unresolved exceptions are blocked');
  if(firewall.excluded_reference_trajectories?.[0]?.may_inform_opening_truth!==false) errors.push('future reference firewall is open');
  for(const [name,value] of [['manifest',manifest],['sources',sources],['claims',claims],['posture',posture],['lineage',lineage],['triggers',triggers],['contradictions',contradictions],['reconciliation',reconciliation]]) walk(value,errors,name);
  return {ok:errors.length===0,errors,counts:expected,canonical_force_refs:canonicalForceIds.size};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const fixtureIds=process.env.OPENING_POSTURE_FIXTURE==='1'
    ? JSON.parse(fs.readFileSync(path.join(here,'fixture_force_ids.json'),'utf8'))
    : undefined;
  const report=validateOpeningPosture(here,{canonicalForceIds:fixtureIds});
  console.log(JSON.stringify(report,null,2));
  if(!report.ok) process.exitCode=1;
}
