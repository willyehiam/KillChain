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
  if(manifest.as_of!==cutoffText||manifest.opening_truth!==true) errors.push('manifest: canonical bookmark mismatch');
  if(manifest.simulation_readiness!=='blocked_research_only') errors.push('manifest: status firewall must remain blocked');
  for(const consumer of ['simulation_initialization','country_ai','balance_calibration','mission_generation']) if(!manifest.status_firewall?.forbidden_consumers?.includes(consumer)) errors.push(`manifest: missing forbidden consumer ${consumer}`);
  const expected={sources:sources.length,claims:claims.length,posture_records:posture.records?.length??0,exercise_lineage:lineage.events?.length??0,crisis_triggers:triggers.triggers?.length??0,contradictions:contradictions.contradictions?.length??0,force_exceptions:reconciliation.exceptions?.length??0};
  for(const [key,value] of Object.entries(expected)) if(manifest.record_counts?.[key]!==value) errors.push(`manifest: count ${key} expected ${value}`);
  for(const source of sources){
    for(const field of ['title','publisher','url','published_at','available_at','accessed_at','source_type','source_tier','relevant_locator','claim_snapshot','artifact_sha256']) if(!source[field]) errors.push(`${source.source_id}: missing ${field}`);
    dateNoLater(source.available_at,`${source.source_id}.available_at`,errors);
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
    for(const id of record.force_refs??[]) if(!canonicalForceIds.has(id)) errors.push(`${record.posture_id??record.lineage_id}: unresolved force reference ${id}`);
    if(forbiddenFuture.test(JSON.stringify(record))) errors.push(`${record.posture_id??record.lineage_id}: future reference leaked into opening record`);
  }
  for(const record of posture.records??[]){
    if(record.valid_at!==cutoffText) errors.push(`${record.posture_id}: valid_at mismatch`);
    if(record.category==='observed_activity'&&record.count_semantics!=='activity_instances_not_unique_platforms') errors.push(`${record.posture_id}: observed activity cannot be treated as unique platform inventory`);
    if(!['unknown','not_assessed','not_inferred','conditional'].includes(record.readiness)) errors.push(`${record.posture_id}: unsupported readiness inference`);
  }
  for(const event of lineage.events??[]){if(event.status!=='historical_prebookmark_observed') errors.push(`${event.lineage_id}: lineage status must be historical prebookmark observed`);dateNoLater(`${event.ended_on}T23:59:59Z`,`${event.lineage_id}.ended_on`,errors);}
  for(const trigger of triggers.triggers??[]){if(trigger.knowledge_state!=='scenario_hypothesis'||trigger.probability!=='unknown'||trigger.activation!=='disabled_until_scenario_rules_are_reviewed') errors.push(`${trigger.trigger_id}: trigger must remain a disabled scenario hypothesis`);if(forbiddenFuture.test(JSON.stringify(trigger))) errors.push(`${trigger.trigger_id}: future reference leaked into trigger`);}
  for(const item of contradictions.contradictions??[]){for(const side of item.positions??[]) for(const id of side.claim_ids??[]) if(!claimIndex.has(id)) errors.push(`${item.contradiction_id}: unresolved claim ${id}`);if(!item.resolution) errors.push(`${item.contradiction_id}: resolution policy required`);}
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
