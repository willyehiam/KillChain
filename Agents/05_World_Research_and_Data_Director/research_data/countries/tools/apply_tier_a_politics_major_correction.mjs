import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);

function read(code, name) {
  return JSON.parse(fs.readFileSync(path.join(root, code, name), 'utf8'));
}

function write(code, name, value) {
  fs.writeFileSync(path.join(root, code, name), `${JSON.stringify(value, null, 2)}\n`);
}

function addUnique(array, value, key) {
  if (!array.some(item => item[key] === value[key])) array.push(value);
}

for (const code of ['usa', 'twn']) {
  const manifest = read(code, 'research_manifest.json');
  manifest.files.war_authority_workflow = 'war_authority_workflow.json';
  manifest.acceptance.politics_lane_authority_contract_reviewed = false;
  write(code, 'research_manifest.json', manifest);

  const bookmark = read(code, 'bookmark_state.json');
  bookmark.knowledge_firewall_status = 'needs_independent_review';
  bookmark.acceptance_state = {
    politics_lane_status: 'needs_review',
    bookmark_firewall_passed: false,
    independent_review_complete: false,
    authority_contract_reviewed: false
  };
  write(code, 'bookmark_state.json', bookmark);
}

{
  const evidence = read('twn', 'evidence_registry.json');
  addUnique(evidence.sources, {
    source_id: 'src_twn_constitution_main_text',
    title: 'Constitution of the Republic of China (Taiwan), Main Text',
    publisher: 'Office of the President, Republic of China (Taiwan)',
    published_at: '1947-01-01',
    accessed_at: '2026-08-06',
    source_tier: 'A',
    source_type: 'law_or_treaty',
    source_family_id: 'family_twn_office_of_president_constitution',
    url: 'https://english.president.gov.tw/Page/94',
    relevant_locator: 'Articles 36, 38, 39, 58, and 63',
    reliability_notes: 'Constitutional text supports institutional gates. It does not by itself settle disputed sequencing between the Executive Yuan, Legislative Yuan, and President.'
  }, 'source_id');
  for (const source of evidence.sources) {
    source.source_family_id ??= `family_${source.publisher.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  }
  if (!evidence.notes.includes('War authority is now carried')) evidence.notes = `${evidence.notes} War authority is now carried in a separate structured workflow; constitutional prose cannot initialize an executable permission by itself.`;
  write('twn', 'evidence_registry.json', evidence);

  const manifest = read('twn', 'research_manifest.json');
  manifest.accepted_source_count = evidence.sources.length;
  write('twn', 'research_manifest.json', manifest);
  const lane = read('twn', 'lane_coverage.json');
  lane.lanes.politics_and_institutions.source_count = evidence.sources.length;
  lane.lanes.politics_and_institutions.blocking_questions = [
    'Independent constitutional review of the structured presidential, Executive Yuan, and Legislative Yuan war authority gates and unresolved sequencing.',
    'Independent review of the corrected DPP secretary-general interval and recall-adjusted legislative seat ledger.',
    'Independent review of actor relevance without treating the roster as a practical influence forecast.'
  ];
  write('twn', 'lane_coverage.json', lane);
}

{
  const evidence = read('usa', 'evidence_registry.json');
  for (const source of evidence.sources) {
    source.source_family_id ??= `family_${source.publisher.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  }
  if (!evidence.notes.includes('War authority is now carried')) evidence.notes = `${evidence.notes} War authority is now carried in a separate structured workflow; constitutional or executive-branch prose cannot initialize an executable permission by itself.`;
  write('usa', 'evidence_registry.json', evidence);
}
