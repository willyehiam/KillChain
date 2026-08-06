#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const researchRoot = path.resolve(scriptDirectory, '..');
const validator = path.join(scriptDirectory, 'validate_tier_a_structure.mjs');
const foundationValidator = path.join(researchRoot, 'tools', 'validate_foundation.mjs');
const failures = [];
const results = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function runMutation(name, mutate, expectedDiagnostic, command = validator) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'killweb-politics-regression-'));
  const copiedResearchRoot = path.join(temporaryRoot, 'research_data');
  try {
    fs.cpSync(researchRoot, copiedResearchRoot, { recursive: true });
    mutate(copiedResearchRoot);
    const result = spawnSync(process.execPath, [command === validator ? path.join(copiedResearchRoot, 'countries', path.basename(command)) : path.join(copiedResearchRoot, 'tools', path.basename(command)), command === validator ? path.join(copiedResearchRoot, 'countries') : copiedResearchRoot], {
      encoding: 'utf8',
    });
    const output = `${result.stdout}\n${result.stderr}`;
    const passed = result.status !== 0 && output.includes(expectedDiagnostic);
    results.push({ name, passed, expected_diagnostic: expectedDiagnostic });
    if (!passed) failures.push(`${name}: validator did not reject with ${expectedDiagnostic}`);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

runMutation('B01 ended Taiwan party role cannot initialize the bookmark', root => {
  const politicsPath = path.join(root, 'countries', 'twn', 'politics_and_institutions.json');
  const bookmarkPath = path.join(root, 'countries', 'twn', 'bookmark_state.json');
  const politics = readJson(politicsPath);
  const bookmark = readJson(bookmarkPath);
  const hsu = politics.political_actors.find(actor => actor.actor_id === 'actor_twn_hsu_kuo_yung');
  Object.assign(hsu, { actor_id: 'actor_twn_lin_yu_chang', name: 'Lin Yu-chang', office: 'DPP Secretary-General' });
  bookmark.political_actors = bookmark.political_actors.map(actorId => actorId === 'actor_twn_hsu_kuo_yung' ? 'actor_twn_lin_yu_chang' : actorId);
  writeJson(politicsPath, politics);
  writeJson(bookmarkPath, bookmark);
}, 'opening actor actor_twn_lin_yu_chang has only role evidence that ended before');

runMutation('B02 Taiwan seat ledger must reconcile', root => {
  const evidencePath = path.join(root, 'countries', 'twn', 'evidence_registry.json');
  const evidence = readJson(evidencePath);
  evidence.claims.find(claim => claim.claim_id === 'claim_twn_legislative_seats_2025_09_01').value.kmt = 53;
  writeJson(evidencePath, evidence);
}, 'opening kmt seats do not reconcile');

runMutation('B03 China CMC institution is mandatory', root => {
  const politicsPath = path.join(root, 'countries', 'chn', 'politics_and_institutions.json');
  const politics = readJson(politicsPath);
  politics.institutions = politics.institutions.filter(institution => institution.institution_id !== 'institution_chn_cmc');
  writeJson(politicsPath, politics);
}, 'CMC institution is absent');

runMutation('B04 Ma Xingrui cannot retain Xinjiang opening authority', root => {
  const politicsPath = path.join(root, 'countries', 'chn', 'politics_and_institutions.json');
  const politics = readJson(politicsPath);
  politics.political_actors.find(actor => actor.actor_id === 'actor_chn_ma_xingrui').office = 'Xinjiang authority';
  writeJson(politicsPath, politics);
}, 'Ma Xingrui retains unsupported Xinjiang opening authority');

runMutation('B05 United States NSC institution is mandatory', root => {
  const politicsPath = path.join(root, 'countries', 'usa', 'politics_and_institutions.json');
  const politics = readJson(politicsPath);
  politics.institutions = politics.institutions.filter(institution => institution.institution_id !== 'institution_usa_nsc');
  writeJson(politicsPath, politics);
}, 'NSC institution is absent');

runMutation('B06 canonical source identifiers reject divergent duplicates', root => {
  const evidence = readJson(path.join(root, 'countries', 'usa', 'evidence_registry.json'));
  const duplicate = { ...evidence.sources[0], title: `${evidence.sources[0].title} divergent` };
  fs.appendFileSync(path.join(root, 'sources', 'sources.ndjson'), `${JSON.stringify(duplicate)}\n`);
}, 'divergent duplicate source records', foundationValidator);

runMutation('Opening claims reject explicit post-bookmark evidence', root => {
  const evidencePath = path.join(root, 'countries', 'usa', 'evidence_registry.json');
  const evidence = readJson(evidencePath);
  evidence.sources.find(source => source.source_id === 'src_usa_rubio_acting_nsa_reuters_2025').published_at = '2025-09-02';
  writeJson(evidencePath, evidence);
}, 'post-bookmark source src_usa_rubio_acting_nsa_reuters_2025');

console.log(JSON.stringify({ status: failures.length ? 'FAIL' : 'PASS', regressions: results, failures }, null, 2));
if (failures.length) process.exit(1);
