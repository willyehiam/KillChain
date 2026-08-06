import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const readJson=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const writeJson=(name,value)=>fs.writeFileSync(path.join(root,name),`${JSON.stringify(value,null,2)}\n`);
const readNd=name=>fs.readFileSync(path.join(root,name),'utf8').trim().split(/\n+/).map(JSON.parse);
const writeNd=(name,rows)=>fs.writeFileSync(path.join(root,name),`${rows.map(JSON.stringify).join('\n')}\n`);

let sources=readNd('sources.ndjson').filter(source=>source.source_id!=='op_src_twn_september1_2025_activity');
const august31=sources.find(source=>source.source_id==='op_src_twn_august31_2025_activity');
Object.assign(august31,{
  observation_started_at:'2025-08-29T22:00:00Z',
  observation_ended_at:'2025-08-30T22:00:00Z',
  source_published_at:'2025-08-31',
  source_available_at:'2025-08-31T15:59:59Z',
  availability_basis:'Official page date is 31 August in UTC+8, establishing an upper bound before the 1 September 00:00Z bookmark.',
  first_archived_at:'unknown_not_captured'
});
august31.available_at=august31.source_available_at;
august31.claim_snapshot=`${august31.source_id}|${august31.title}|${august31.publisher}|${august31.relevant_locator}`;
august31.artifact_sha256=crypto.createHash('sha256').update(august31.claim_snapshot).digest('hex');
writeNd('sources.ndjson',sources);

const claims=readNd('claims.ndjson');
for(const claim of claims){
  claim.source_ids=claim.source_ids.map(id=>id==='op_src_twn_september1_2025_activity'?'op_src_twn_august31_2025_activity':id);
  claim.source_ids=[...new Set(claim.source_ids)];
}
Object.assign(claims.find(c=>c.claim_id==='op_claim_late_august_variation'),{
  statement:'The safely prebookmark 29 and 31 August public reports show variation in aircraft activity alongside continuing aggregate naval and official ship reporting.',
  confidence:'medium'
});
Object.assign(claims.find(c=>c.claim_id==='op_claim_opening_snapshot'),{
  statement:'The last public daily report established as available before the bookmark reported 5 aircraft sorties, 6 PLAN ships, and 1 official ship. These are Taiwan public-report activity instances, not unique platforms or omniscient truth.',
  confidence:'high'
});
Object.assign(claims.find(c=>c.claim_id==='op_claim_taiwan_response_pattern'),{
  statement:'Taiwan publicly described an integrated ISR response supported by mission aircraft, vessels, and shore based missile systems in the safely prebookmark April report.',
  source_ids:['op_src_twn_april3_2025_activity'],
  confidence:'high'
});
Object.assign(claims.find(c=>c.claim_id==='op_claim_force_disposition_unknown'),{
  statement:'Organization identity and public activity counts do not establish deployment, readiness, access, or theater availability; all four remain explicit unknowns.',
  source_ids:['op_src_cmpr_2024','op_src_twn_august31_2025_activity'],
  confidence:'high'
});
writeNd('claims.ndjson',claims);

const posture=readJson('posture_records.json');
for(const record of posture.records){
  record.source_ids=(record.source_ids??[]).map(id=>id==='op_src_twn_september1_2025_activity'?'op_src_twn_august31_2025_activity':id);
  record.source_ids=[...new Set(record.source_ids)];
  record.readiness_assessment=record.category==='political_access'?'not_applicable_policy_record':'unknown';
  record.evidence_status='research_only_not_opening_truth';
  record.access_permission=record.category==='political_access'?'unknown_not_approved':'not_applicable';
  record.theater_availability='unknown';
  record.inference_prohibition=['organization_identity_does_not_imply_deployment','organization_identity_does_not_imply_readiness','organization_identity_does_not_imply_access','organization_identity_does_not_imply_theater_availability'];
  delete record.readiness;
  record.force_refs=(record.force_refs??[]).map(organization_id=>({
    organization_id,
    reference_semantics: record.category==='observed_activity'?'context_identity_not_observed_participant':'organization_identity_only',
    deployment_status:'unknown',
    readiness_status:'unknown',
    access_status:record.category==='political_access'?'unknown':'not_applicable',
    theater_availability_status:'unknown',
    does_not_imply:['deployment','readiness','access','theater_availability']
  }));
}
const opening=posture.records.find(r=>r.posture_id==='op_posture_opening_activity');
opening.summary='Last safely available prebookmark public report records non surge aggregate activity; it is Taiwan public-report knowledge, not unique platform inventory, command attribution, or omniscient truth.';
const command=posture.records.find(r=>r.posture_id==='op_posture_twn_command');
command.source_ids=['op_src_twn_april3_2025_activity'];
const response=posture.records.find(r=>r.posture_id==='op_posture_twn_response_pool');
response.source_ids=['op_src_twn_han_kuang_41_plan','op_src_twn_april3_2025_activity'];
writeJson('posture_records.json',posture);

const lineage=readJson('exercise_lineage.json');
for(const event of lineage.events){
  event.force_refs=(event.force_refs??[]).map(organization_id=>({organization_id,reference_semantics:'historical_organization_identity_only',deployment_status:'unknown',readiness_status:'unknown',access_status:'not_applicable',theater_availability_status:'unknown',does_not_imply:['opening_deployment','opening_readiness','opening_access','opening_theater_availability']}));
}
writeJson('exercise_lineage.json',lineage);

const contradictions=readJson('contradictions.json');
contradictions.contradictions=contradictions.contradictions.filter(item=>item.contradiction_id!=='op_contradiction_access_permission');
writeJson('contradictions.json',contradictions);

const manifest=readJson('manifest.json');
manifest.opening_truth=false;
manifest.knowledge_layer='unaccepted_public_report_and_research_hypothesis';
manifest.record_counts.sources=sources.length;
manifest.record_counts.contradictions=contradictions.contradictions.length;
manifest.status_firewall.release_conditions=[
  {condition_id:'independent_reaudit',status:'unmet'},
  {condition_id:'all_blocking_findings_closed',status:'unmet'},
  {condition_id:'scenario_design_approval',status:'unmet'},
  {condition_id:'contradiction_adjudication_policy',status:'unmet'}
];
manifest.status_firewall.unresolved_blocker_count=2;
writeJson('manifest.json',manifest);
