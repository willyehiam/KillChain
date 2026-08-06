import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateOpeningPosture } from './validate_opening_posture.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const files=['manifest.json','sources.ndjson','claims.ndjson','posture_records.json','exercise_lineage.json','crisis_triggers.json','contradictions.json','force_reconciliation.json','future_reference_firewall.json'];
const forceIds=new Set(JSON.parse(fs.readFileSync(path.join(here,'fixture_force_ids.json'),'utf8')));
function fixture(mutator){const root=fs.mkdtempSync(path.join(os.tmpdir(),'opening-posture-'));for(const file of files) fs.copyFileSync(path.join(here,file),path.join(root,file));mutator(root);const report=validateOpeningPosture(root,{canonicalForceIds:forceIds});fs.rmSync(root,{recursive:true,force:true});return report;}
function mutateJson(root,file,fn){const full=path.join(root,file);const value=JSON.parse(fs.readFileSync(full,'utf8'));fn(value);fs.writeFileSync(full,JSON.stringify(value,null,2)+'\n');}
function mutateNdjson(root,file,fn){const full=path.join(root,file);const value=fs.readFileSync(full,'utf8').trim().split(/\n+/).map(JSON.parse);fn(value);fs.writeFileSync(full,value.map(JSON.stringify).join('\n')+'\n');}
function reject(name,mutator,needle){const report=fixture(mutator);assert.equal(report.ok,false,`${name} unexpectedly passed`);assert.ok(report.errors.some(x=>x.includes(needle)),`${name} did not report ${needle}: ${report.errors.join('; ')}`);}
const clean=validateOpeningPosture(here,{canonicalForceIds:forceIds});
assert.deepEqual(clean.errors,[],`production packet invalid: ${clean.errors.join('; ')}`);
reject('future source',root=>mutateNdjson(root,'sources.ndjson',rows=>{rows[0].available_at='2025-09-01T00:00:01Z';}),'post bookmark');
reject('future event leakage',root=>mutateJson(root,'posture_records.json',doc=>{doc.records[0].summary='Derived from Justice Mission 2025';}),'future reference leaked');
reject('unsafe geometry',root=>mutateJson(root,'posture_records.json',doc=>{doc.records[0].coordinates=[121.56,25.03];}),'forbidden');
reject('unresolved source',root=>mutateNdjson(root,'claims.ndjson',rows=>{rows[0].source_ids=['op_src_missing'];}),'unresolved source');
reject('unresolved force',root=>mutateJson(root,'posture_records.json',doc=>{doc.records[0].force_refs=['organization_unaccepted'];}),'unresolved force reference');
reject('invented readiness',root=>mutateJson(root,'posture_records.json',doc=>{doc.records[0].readiness='fully_ready';}),'unsupported readiness inference');
reject('unique platform inflation',root=>mutateJson(root,'posture_records.json',doc=>{doc.records.find(x=>x.category==='observed_activity').count_semantics='unique_platform_inventory';}),'cannot be treated as unique platform inventory');
reject('factualized trigger',root=>mutateJson(root,'crisis_triggers.json',doc=>{doc.triggers[0].knowledge_state='historical_fact';}),'disabled scenario hypothesis');
reject('future lineage',root=>mutateJson(root,'exercise_lineage.json',doc=>{doc.events[0].ended_on='2025-12-30';}),'post bookmark');
reject('open status firewall',root=>mutateJson(root,'manifest.json',doc=>{doc.simulation_readiness='simulation_ready';}),'status firewall must remain blocked');
reject('mutated artifact',root=>mutateNdjson(root,'sources.ndjson',rows=>{rows[0].claim_snapshot+=' changed';}),'frozen artifact hash mismatch');
console.log(JSON.stringify({ok:true,negative_cases:11,canonical_force_refs:forceIds.size},null,2));
