import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const readNdjson = (name) => fs.readFileSync(path.join(root, name), 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));

const manifest = readJson('manifest.json');
const sources = readNdjson('sources.ndjson');
const claims = readNdjson('claims.ndjson');
const organizations = readNdjson('organizations.ndjson');
const relationships = readNdjson('relationships.ndjson');
const errors = [];
const fail = (message) => errors.push(message);
const unique = (rows, key) => new Set(rows.map((row) => row[key])).size === rows.length;
const sourceIds = new Set(sources.map((row) => row.source_id));
const organizationIds = new Set(organizations.map((row) => row.organization_id));

if (manifest.country_id !== 'country_kor') fail('wrong country');
if (manifest.bookmark_id !== 'bookmark_global_fracture_2025_09_01') fail('wrong bookmark');
if (manifest.status !== 'collecting') fail('packet must remain collecting');
if (sources.length !== 2 || claims.length !== 10 || organizations.length !== 9 || relationships.length !== 6) fail('record totals diverge');
if (!unique(sources, 'source_id') || !unique(claims, 'claim_id') || !unique(organizations, 'organization_id') || !unique(relationships, 'relationship_id')) fail('duplicate identifier');
for (const claim of claims) {
  if (claim.opening_stock_eligible !== false) fail(`claim promoted to opening stock: ${claim.claim_id}`);
  for (const sourceId of claim.source_ids ?? []) if (!sourceIds.has(sourceId)) fail(`unresolved source ${sourceId}`);
}
for (const organization of organizations) {
  if (organization.personnel.authorized.kind !== 'unknown' || organization.personnel.assigned.kind !== 'unknown' || organization.personnel.deployable.kind !== 'unknown') fail(`invented personnel quantity: ${organization.organization_id}`);
  if (organization.readiness.state !== 'unknown') fail(`invented readiness: ${organization.organization_id}`);
}
for (const relationship of relationships) {
  if (!organizationIds.has(relationship.source_organization_id) || !organizationIds.has(relationship.target_organization_id)) fail(`orphan relationship: ${relationship.relationship_id}`);
  if (relationship.authority_scope.may_reassign_forces || relationship.authority_scope.may_release_for_mission) fail(`relationship invents force release: ${relationship.relationship_id}`);
}
if (relationships.some((row) => row.source_organization_id === 'organization_kor_us_combined_forces_command')) fail('CFC cannot assign forces in this tranche');
if (manifest.reconciliation.inventory_records !== 0 || manifest.reconciliation.conservation_records !== 0 || manifest.reconciliation.opening_stock_eligible_claims !== 0) fail('organization tranche invents executable inventory');
if (manifest.acceptance.research_complete || manifest.acceptance.decision_usable || manifest.acceptance.simulation_ready) fail('packet must remain nonexecutable');

const report = {status: errors.length ? 'FAIL' : 'PASS',packet: manifest.force_ledger_id,records:{sources:sources.length,claims:claims.length,organizations:organizations.length,relationships:relationships.length},errors};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
