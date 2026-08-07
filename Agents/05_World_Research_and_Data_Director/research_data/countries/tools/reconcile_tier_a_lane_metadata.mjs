#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const toolsRoot = path.dirname(fileURLToPath(import.meta.url));
const countriesRoot = path.resolve(toolsRoot, '..');
const countryCodes = ['usa', 'chn', 'twn'];
const checkOnly = process.argv.includes('--check');
const coreFamilies = ['organizations','relationships','equipment_types','platforms','inventory','deployments','maintenance','construction','conservation'];
const statuses = ['shell','collecting','needs_review','verified','stale','deprecated'];
const errors = [];
const reports = [];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readRows = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const serialized = (value) => `${JSON.stringify(value, null, 2)}\n`;
const datasetRows = (ledgerDir, manifest, family, fallback = null) => {
  const relative = manifest.dataset_paths?.[family] ?? fallback;
  if (!relative) return [];
  const file = path.join(ledgerDir, relative);
  return fs.existsSync(file) ? readRows(file) : [];
};

for (const code of countryCodes) {
  const countryDir = path.join(countriesRoot, code);
  const ledgerDir = path.join(countryDir, 'force_ledger');
  const manifest = readJson(path.join(ledgerDir, 'manifest.json'));
  const profilesPath = path.join(countryDir, 'profile.json');
  const coveragePath = path.join(countryDir, 'lane_coverage.json');
  const researchManifestPath = path.join(countryDir, 'research_manifest.json');
  const evidencePath = path.join(countryDir, 'evidence_registry.json');
  const politicsPath = path.join(countryDir, 'politics_and_institutions.json');
  const geographyDir = path.join(countryDir, 'geography');
  const geographyManifestPath = path.join(geographyDir, 'manifest.json');
  const geographySourcesPath = path.join(geographyDir, 'sources.ndjson');
  const geographyArtifactPath = path.join(geographyDir, 'artifact_record.json');
  const infrastructureDir = path.join(countryDir, 'infrastructure');
  const infrastructureManifestPath = path.join(infrastructureDir, 'manifest.json');
  const portsDir = path.join(infrastructureDir, 'ports');
  const portsManifestPath = path.join(portsDir, 'manifest.json');
  const portsSourcesPath = path.join(portsDir, 'sources.ndjson');
  const portsArtifactPath = path.join(portsDir, 'artifact_record.json');
  const airportsDir = path.join(infrastructureDir, 'airports');
  const airportsManifestPath = path.join(airportsDir, 'manifest.json');
  const airportsSourcesPath = path.join(airportsDir, 'sources.ndjson');
  const airportsArtifactPath = path.join(airportsDir, 'artifact_record.json');
  const profile = readJson(profilesPath);
  const coverage = readJson(coveragePath);
  const researchManifest = readJson(researchManifestPath);
  const evidence = readJson(evidencePath);
  const politics = readJson(politicsPath);
  const hasGeography = fs.existsSync(geographyManifestPath) && fs.existsSync(geographySourcesPath) && fs.existsSync(geographyArtifactPath);
  const geographyManifest = hasGeography ? readJson(geographyManifestPath) : null;
  const geographySources = hasGeography ? readRows(geographySourcesPath) : [];
  const geographyArtifact = hasGeography ? readJson(geographyArtifactPath) : null;
  const hasPorts = fs.existsSync(portsManifestPath) && fs.existsSync(portsSourcesPath) && fs.existsSync(portsArtifactPath);
  const portsManifest = hasPorts ? readJson(portsManifestPath) : null;
  const portsSources = hasPorts ? readRows(portsSourcesPath) : [];
  const portsArtifact = hasPorts ? readJson(portsArtifactPath) : null;
  const hasAirports = fs.existsSync(airportsManifestPath) && fs.existsSync(airportsSourcesPath) && fs.existsSync(airportsArtifactPath);
  const airportsManifest = hasAirports ? readJson(airportsManifestPath) : null;
  const airportsSources = hasAirports ? readRows(airportsSourcesPath) : [];
  const airportsArtifact = hasAirports ? readJson(airportsArtifactPath) : null;
  const hasInfrastructure = fs.existsSync(infrastructureManifestPath) && hasPorts && hasAirports;
  const infrastructureManifest = hasInfrastructure ? readJson(infrastructureManifestPath) : null;
  const infrastructureSources = [...portsSources, ...airportsSources];
  const recordsByFamily = Object.fromEntries(coreFamilies.map((family) => [family, datasetRows(ledgerDir, manifest, family)]));
  const sources = datasetRows(ledgerDir, manifest, 'sources', 'sources.ndjson');
  const claims = datasetRows(ledgerDir, manifest, 'claims', 'claims.ndjson');
  const contradictions = datasetRows(ledgerDir, manifest, 'contradictions', 'contradictions.ndjson');
  const deployments = recordsByFamily.deployments;
  const publishedDates = sources.map((source) => source.published_at).filter(Boolean).sort();
  const recordCount = Object.values(recordsByFamily).reduce((sum, rows) => sum + rows.length, 0);
  const geometry = deployments.reduce((counts, deployment) => {
    const status = deployment.location?.location_status;
    if (status === 'exact') counts.exact += 1;
    else if (status === 'approximate' || status === 'area') counts.approximate += 1;
    else counts.unknown += 1;
    return counts;
  }, {exact:0, approximate:0, unknown:0});

  const politicsRecordCount = (politics.institutions?.length ?? 0) + (politics.political_actors?.length ?? 0);
  const openPoliticsContradictions = evidence.contradiction_sets.filter((set) => set.status === 'open').length;
  const politicsSourceIds = evidence.sources.map((source) => source.source_id);
  profile.source_ids = [...new Set([
    'src_imf_weo_2026_04_ngdpd_2025',
    ...politicsSourceIds,
    ...geographySources.map((source) => source.source_id),
    ...infrastructureSources.map((source) => source.source_id),
  ])];
  profile.coverage.politics_and_institutions.record_count = politicsRecordCount;
  profile.coverage.politics_and_institutions.source_count = evidence.sources.length;
  const politicsLane = coverage.lanes.politics_and_institutions;
  politicsLane.record_count = politicsRecordCount;
  politicsLane.source_count = evidence.sources.length;
  politicsLane.claim_count = evidence.claims.length;
  politicsLane.contradiction_count = openPoliticsContradictions;
  researchManifest.accepted_source_count = evidence.sources.length;
  researchManifest.accepted_claim_count = evidence.claims.length;
  researchManifest.open_contradiction_count = openPoliticsContradictions;

  const profileLane = profile.coverage.military_organization_inventory;
  profileLane.status = manifest.status;
  profileLane.record_count = recordCount;
  profileLane.source_count = sources.length;
  profileLane.open_question_count = manifest.unknowns?.length ?? manifest.acceptance?.blockers?.length ?? 0;
  profileLane.notes = `${manifest.notes} Counts are derived from the canonical force ledger and do not imply acceptance.`;
  profile.completeness.force_ledger_status = manifest.status;

  const matrixLane = coverage.lanes.military_organization_inventory;
  matrixLane.status = manifest.status;
  matrixLane.owner = 'agent_05_world_research_and_data_director';
  matrixLane.record_count = recordCount;
  matrixLane.source_count = sources.length;
  matrixLane.claim_count = claims.length;
  matrixLane.contradiction_count = contradictions.length;
  matrixLane.exact_geometry_count = geometry.exact;
  matrixLane.approximate_geometry_count = geometry.approximate;
  matrixLane.unknown_geometry_count = geometry.unknown;
  matrixLane.oldest_source_date = publishedDates.at(0) ?? null;
  matrixLane.newest_source_date = publishedDates.at(-1) ?? null;
  matrixLane.reviewed_at = manifest.reviewed_at ?? null;
  matrixLane.review_after = manifest.review_after ?? null;
  matrixLane.coverage_disposition = 'collecting_nonexecutable_pending_reconciliation';
  matrixLane.blocking_questions = [...(manifest.acceptance?.blockers ?? [])];
  matrixLane.notes = `${manifest.notes} The lane is collecting and remains unavailable to executable simulation consumers.`;

  if (hasGeography) {
    const geographyDates = geographySources.map((source) => source.published_at).filter(Boolean).sort();
    const geographyProfileLane = profile.coverage.geography_provinces_terrain;
    geographyProfileLane.status = geographyManifest.status;
    geographyProfileLane.record_count = geographyArtifact.feature_count;
    geographyProfileLane.source_count = geographySources.length;
    geographyProfileLane.open_question_count = geographyManifest.known_gaps?.length ?? 0;
    geographyProfileLane.notes = `${geographyManifest.notes} Counts are derived from the frozen geography artifact and do not imply independent acceptance.`;
    profile.dataset_paths.provinces = `geography/${geographyArtifact.path}`;
    profile.completeness.province_layer_status = geographyManifest.status;
    profile.unknowns = (profile.unknowns ?? []).filter((entry) => !entry.startsWith('County, city, island, base, port, and critical corridor strategic geography is not yet populated.'));
    if (!profile.unknowns.includes('County and city boundary geometry is collecting; lower level administration, terrain, hydrography, ports, bases, and strategic corridors remain unpopulated.')) {
      profile.unknowns.push('County and city boundary geometry is collecting; lower level administration, terrain, hydrography, ports, bases, and strategic corridors remain unpopulated.');
    }

    const geographyMatrixLane = coverage.lanes.geography_provinces_terrain;
    geographyMatrixLane.status = geographyManifest.status;
    geographyMatrixLane.owner = geographyManifest.owner;
    geographyMatrixLane.record_count = geographyArtifact.feature_count;
    geographyMatrixLane.source_count = geographySources.length;
    geographyMatrixLane.claim_count = 0;
    geographyMatrixLane.contradiction_count = geographyManifest.open_contradiction_ids?.length ?? 0;
    geographyMatrixLane.exact_geometry_count = geographyArtifact.feature_count;
    geographyMatrixLane.approximate_geometry_count = 0;
    geographyMatrixLane.unknown_geometry_count = 0;
    geographyMatrixLane.oldest_source_date = geographyDates.at(0) ?? null;
    geographyMatrixLane.newest_source_date = geographyDates.at(-1) ?? null;
    geographyMatrixLane.reviewed_at = geographyManifest.last_reviewed;
    geographyMatrixLane.review_after = geographyManifest.review_after;
    geographyMatrixLane.coverage_disposition = 'collecting_source_derived_pending_independent_review';
    geographyMatrixLane.blocking_questions = [...(geographyManifest.known_gaps ?? [])];
    geographyMatrixLane.notes = `${geographyManifest.notes} The published polygons are exact source derived geometry at the declared operational precision.`;
    researchManifest.files.administrative_geography = 'geography/manifest.json';
  }
  if (hasInfrastructure) {
    const infrastructureDates = infrastructureSources.map((source) => source.published_at).filter(Boolean).sort();
    const portNodeCount = portsArtifact.artifacts?.port_nodes?.feature_count ?? 0;
    const portActivityCount = portsArtifact.artifacts?.monthly_activity?.record_count ?? 0;
    const airportNodeCount = airportsArtifact.artifacts?.airport_nodes?.feature_count ?? 0;
    const airportActivityCount = airportsArtifact.artifacts?.monthly_activity?.record_count ?? 0;
    const infrastructureRecordCount = portNodeCount + portActivityCount + airportNodeCount + airportActivityCount;
    const infrastructureProfileLane = profile.coverage.energy_transport_communications_logistics;
    infrastructureProfileLane.status = infrastructureManifest.status;
    infrastructureProfileLane.record_count = infrastructureRecordCount;
    infrastructureProfileLane.source_count = infrastructureSources.length;
    infrastructureProfileLane.open_question_count = infrastructureManifest.known_gaps?.length ?? 0;
    infrastructureProfileLane.notes = `${infrastructureManifest.notes} Counts include ${portNodeCount} civilian port nodes, ${airportNodeCount} civilian airport nodes, and ${portActivityCount + airportActivityCount} monthly observations and do not imply independent acceptance.`;
    profile.dataset_paths.infrastructure = 'infrastructure/manifest.json';
    profile.completeness.infrastructure_layer_status = infrastructureManifest.status;
    profile.unknowns = (profile.unknowns ?? []).filter((entry) => !entry.startsWith('Strategic industry, energy, transport, communications, logistics, alliances, sanctions, and crisis commitments are not yet populated.'));
    profile.unknowns = profile.unknowns.filter((entry) => !entry.startsWith('County and city boundary geometry is collecting; lower level administration, terrain, hydrography, ports, bases, and strategic corridors remain unpopulated.'));
    profile.unknowns = profile.unknowns.filter((entry) => !entry.startsWith('Seven international commercial port nodes and twelve month activity baselines are collecting;'));
    const refinedInfrastructureUnknown = 'Seven international commercial ports, seventeen civilian access airports, and twelve month activity baselines are collecting; full facility geometry, capacity, hinterland links, energy, communications, repair, substitution, and military access remain unpopulated.';
    if (!profile.unknowns.includes(refinedInfrastructureUnknown)) profile.unknowns.push(refinedInfrastructureUnknown);
    const refinedGeographyUnknown = 'County and city boundary geometry is collecting; lower level administration, terrain, hydrography, bases, and strategic corridors remain unpopulated.';
    if (!profile.unknowns.includes(refinedGeographyUnknown)) profile.unknowns.push(refinedGeographyUnknown);

    const infrastructureMatrixLane = coverage.lanes.energy_transport_communications_logistics;
    infrastructureMatrixLane.status = infrastructureManifest.status;
    infrastructureMatrixLane.owner = infrastructureManifest.owner;
    infrastructureMatrixLane.record_count = infrastructureRecordCount;
    infrastructureMatrixLane.source_count = infrastructureSources.length;
    infrastructureMatrixLane.claim_count = 0;
    infrastructureMatrixLane.contradiction_count = infrastructureManifest.open_contradiction_ids?.length ?? 0;
    infrastructureMatrixLane.exact_geometry_count = portNodeCount + airportNodeCount;
    infrastructureMatrixLane.approximate_geometry_count = 0;
    infrastructureMatrixLane.unknown_geometry_count = 0;
    infrastructureMatrixLane.oldest_source_date = infrastructureDates.at(0) ?? null;
    infrastructureMatrixLane.newest_source_date = infrastructureDates.at(-1) ?? null;
    infrastructureMatrixLane.reviewed_at = infrastructureManifest.last_reviewed;
    infrastructureMatrixLane.review_after = infrastructureManifest.review_after;
    infrastructureMatrixLane.coverage_disposition = 'collecting_civilian_access_nodes_pending_independent_review';
    infrastructureMatrixLane.blocking_questions = [...(infrastructureManifest.known_gaps ?? [])];
    infrastructureMatrixLane.notes = `${infrastructureManifest.notes} The exact source derived points are civilian access nodes and observed activity is not engineering capacity.`;
    researchManifest.files.civilian_access_infrastructure = 'infrastructure/manifest.json';
    researchManifest.files.civilian_international_ports = 'infrastructure/ports/manifest.json';
    researchManifest.files.civilian_access_airports = 'infrastructure/airports/manifest.json';
  }
  coverage.overall_status = 'collecting';
  coverage.rollup = Object.fromEntries([
    ['lanes_total', Object.keys(coverage.lanes).length],
    ...statuses.map((status) => [status, Object.values(coverage.lanes).filter((lane) => lane.status === status).length]),
  ]);

  for (const [file, value] of [[profilesPath, profile], [coveragePath, coverage], [researchManifestPath, researchManifest]]) {
    const output = serialized(value);
    if (checkOnly) {
      if (fs.readFileSync(file, 'utf8') !== output) errors.push(`${code}: ${path.basename(file)} is not reconciled to force_ledger/manifest.json`);
    } else fs.writeFileSync(file, output);
  }
  reports.push({country:code,politics:{record_count:politicsRecordCount,source_count:evidence.sources.length,claim_count:evidence.claims.length,contradiction_count:openPoliticsContradictions},military:{status:manifest.status,record_count:recordCount,source_count:sources.length,claim_count:claims.length,contradiction_count:contradictions.length,geometry},geography:hasGeography?{status:geographyManifest.status,record_count:geographyArtifact.feature_count,source_count:geographySources.length,exact_geometry_count:geographyArtifact.feature_count}:null,infrastructure:hasInfrastructure?{status:infrastructureManifest.status,record_count:infrastructureManifest.record_counts.total_records,source_count:infrastructureSources.length,exact_geometry_count:infrastructureManifest.record_counts.access_nodes}:null});
}

console.log(JSON.stringify({status:errors.length ? 'FAIL' : 'PASS',mode:checkOnly ? 'check' : 'write',countries:reports,errors}, null, 2));
if (errors.length) process.exitCode = 1;
