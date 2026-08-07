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
  const profile = readJson(profilesPath);
  const coverage = readJson(coveragePath);
  const researchManifest = readJson(researchManifestPath);
  const evidence = readJson(evidencePath);
  const politics = readJson(politicsPath);
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
  profile.source_ids = [...new Set(['src_imf_weo_2026_04_ngdpd_2025', ...politicsSourceIds])];
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
  reports.push({country:code,politics:{record_count:politicsRecordCount,source_count:evidence.sources.length,claim_count:evidence.claims.length,contradiction_count:openPoliticsContradictions},military:{status:manifest.status,record_count:recordCount,source_count:sources.length,claim_count:claims.length,contradiction_count:contradictions.length,geometry}});
}

console.log(JSON.stringify({status:errors.length ? 'FAIL' : 'PASS',mode:checkOnly ? 'check' : 'write',countries:reports,errors}, null, 2));
if (errors.length) process.exitCode = 1;
