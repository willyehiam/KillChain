import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, name), 'utf8'));
const sources = fs.readFileSync(path.join(here, 'sources.ndjson'), 'utf8').trim().split(/\n+/).map((line, index) => {
  try { return JSON.parse(line); } catch (error) { throw new Error(`sources.ndjson line ${index + 1}: ${error.message}`); }
});
const manifest = readJson('manifest.json');
const systemsDoc = readJson('regional_systems.json');
const depsDoc = readJson('dependencies.json');
const accessDoc = readJson('access_relationships.json');
const errors = [];
const cutoff = Date.parse('2025-09-01T23:59:59Z');
const idPattern = /^[a-z0-9_]+$/;
const exactLocationKeys = new Set(['latitude', 'longitude', 'coordinates', 'address', 'mgrs', 'exact_site', 'exact_location']);
const sourceTiers = new Set(['A', 'B', 'C', 'D']);
const sourceTypes = new Set(['official_release', 'law_or_treaty', 'statistical_dataset', 'company_filing', 'news_report', 'research_report', 'academic_paper', 'map', 'imagery', 'video', 'social_post', 'database', 'other']);

function walk(value, at = '$') {
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${at}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (exactLocationKeys.has(key.toLowerCase())) errors.push(`${at}.${key}: exact location field is forbidden`);
    walk(child, `${at}.${key}`);
  }
}

const sourceIds = new Set();
for (const source of sources) {
  if (!source.source_id || !idPattern.test(source.source_id)) errors.push(`invalid source_id ${source.source_id}`);
  if (sourceIds.has(source.source_id)) errors.push(`duplicate source_id ${source.source_id}`);
  sourceIds.add(source.source_id);
  if (!source.title || !source.publisher || !source.url || !source.accessed_at) errors.push(`${source.source_id}: incomplete source record`);
  if (!sourceTiers.has(source.source_tier)) errors.push(`${source.source_id}: invalid source_tier`);
  if (!sourceTypes.has(source.source_type)) errors.push(`${source.source_id}: invalid source_type`);
  if (source.published_at && Date.parse(source.published_at) > cutoff) errors.push(`${source.source_id}: published after opening cutoff`);
}

const systems = systemsDoc.systems;
const access = accessDoc.relationships;
const edges = depsDoc.edges;
const allIds = new Set();
for (const [label, records, key] of [
  ['system', systems, 'system_id'],
  ['access', access, 'relationship_id'],
  ['dependency', edges, 'edge_id']
]) {
  for (const record of records) {
    const id = record[key];
    if (!id || !idPattern.test(id)) errors.push(`invalid ${label} id ${id}`);
    if (allIds.has(id)) errors.push(`duplicate record id ${id}`);
    allIds.add(id);
    if (!record.observed_at || Date.parse(record.observed_at) > cutoff) errors.push(`${id}: missing or post cutoff observed_at`);
    for (const sourceId of record.source_ids || []) if (!sourceIds.has(sourceId)) errors.push(`${id}: unresolved source ${sourceId}`);
  }
}

const systemIds = new Set(systems.map(record => record.system_id));
const endpointIds = new Set([...systemIds, ...access.map(record => record.relationship_id)]);
for (const system of systems) {
  if (!['regional', 'national', 'theater', 'global'].includes(system.aggregation_level)) errors.push(`${system.system_id}: invalid aggregation_level`);
  if (!['aggregate_public', 'synthetic_region'].includes(system.sensitivity_treatment)) errors.push(`${system.system_id}: invalid sensitivity_treatment`);
  if (!system.capacity || !system.redundancy || !system.recovery || !system.uncertainty) errors.push(`${system.system_id}: incomplete systems model`);
  if (!Array.isArray(system.decisions_enabled) || !system.decisions_enabled.length) errors.push(`${system.system_id}: missing decisions_enabled`);
}
for (const relationship of access) {
  if (!relationship.automaticity || !relationship.game_gates?.length) errors.push(`${relationship.relationship_id}: incomplete access gates`);
  if (!relationship.uncertainty || !relationship.decisions_enabled?.length) errors.push(`${relationship.relationship_id}: incomplete uncertainty or decisions`);
}
for (const edge of edges) {
  if (!endpointIds.has(edge.from) || !endpointIds.has(edge.to)) errors.push(`${edge.edge_id}: unresolved endpoint ${edge.from} to ${edge.to}`);
  if (!edge.criticality || !edge.substitutability || !edge.lag) errors.push(`${edge.edge_id}: incomplete dependency semantics`);
}

walk(systemsDoc);
walk(depsDoc);
walk(accessDoc);

const expected = manifest.record_counts;
if (systems.length !== expected.systems) errors.push(`system count ${systems.length} != manifest ${expected.systems}`);
if (edges.length !== expected.dependency_edges) errors.push(`edge count ${edges.length} != manifest ${expected.dependency_edges}`);
if (access.length !== expected.access_relationships) errors.push(`access count ${access.length} != manifest ${expected.access_relationships}`);
if (sources.length !== expected.sources) errors.push(`source count ${sources.length} != manifest ${expected.sources}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({ok: true, systems: systems.length, dependency_edges: edges.length, access_relationships: access.length, sources: sources.length, cutoff: '2025-09-01'}, null, 2));
