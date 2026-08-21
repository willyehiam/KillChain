import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const readNdjson = (name) => fs.readFileSync(path.join(root, name), 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));

const manifest = readJson('manifest.json');
const sources = readNdjson('sources.ndjson');
const claims = readNdjson('claims.ndjson');
const errors = [];
const fail = (message) => errors.push(message);
const bookmark = new Date(manifest.as_of);
const sourceById = new Map(sources.map((row) => [row.source_id, row]));
const claimById = new Map(claims.map((row) => [row.claim_id, row]));
const value = (suffix) => claimById.get(`claim_jpn_mod_2025_${suffix}`)?.value;

if (manifest.country_id !== 'country_jpn') fail('wrong country');
if (manifest.bookmark_id !== 'bookmark_global_fracture_2025_09_01') fail('wrong bookmark');
if (manifest.status !== 'collecting') fail('packet must remain collecting');
if (sources.length !== 1) fail('expected one primary source in this tranche');
if (claims.length !== 54) fail(`expected 54 claims, found ${claims.length}`);
if (sourceById.size !== sources.length) fail('duplicate source id');
if (claimById.size !== claims.length) fail('duplicate claim id');

for (const source of sources) {
  if (source.source_tier !== 'A') fail(`non Tier A source: ${source.source_id}`);
  if (new Date(source.published_at) > bookmark) fail(`post bookmark source: ${source.source_id}`);
  if (source.bookmark_evidence_status !== 'prebookmark_available') fail(`source unavailable at bookmark: ${source.source_id}`);
}
for (const claim of claims) {
  if (claim.opening_stock_eligible !== false) fail(`dated claim promoted to opening stock: ${claim.claim_id}`);
  if (claim.as_of !== '2025-03-31') fail(`claim has wrong observation date: ${claim.claim_id}`);
  if (!claim.source_ids?.length) fail(`claim has no source: ${claim.claim_id}`);
  for (const sourceId of claim.source_ids ?? []) if (!sourceById.has(sourceId)) fail(`unresolved source ${sourceId} in ${claim.claim_id}`);
  if (!Number.isInteger(claim.value) || claim.value < 0) fail(`invalid quantity in ${claim.claim_id}`);
}

const exact = claims.filter((row) => row.quantity_precision === 'exact').length;
const approximate = claims.filter((row) => row.quantity_precision === 'approximate').length;
if (exact !== 49 || approximate !== 5) fail(`precision totals diverge: exact ${exact}, approximate ${approximate}`);
if (manifest.reconciliation.claim_records !== claims.length) fail('manifest claim count diverges');
if (manifest.reconciliation.exact_precision_claims !== exact) fail('manifest exact precision count diverges');
if (manifest.reconciliation.approximate_precision_claims !== approximate) fail('manifest approximate precision count diverges');
if (manifest.reconciliation.opening_stock_eligible_claims !== 0) fail('manifest promotes claims to opening stock');
if (manifest.reconciliation.inventory_records !== 0 || manifest.reconciliation.conservation_records !== 0) fail('claim tranche invents executable inventory');

const authorizedComponents = value('gsdf_personnel_authorized') + value('msdf_personnel_authorized') + value('asdf_personnel_authorized') + value('joint_staff_etc_personnel_authorized');
const actualComponents = value('gsdf_personnel_actual') + value('msdf_personnel_actual') + value('asdf_personnel_actual') + value('joint_staff_etc_personnel_actual');
if (authorizedComponents !== value('sdf_personnel_authorized_total')) fail('authorized personnel components do not reconcile');
if (actualComponents !== value('sdf_personnel_actual_total')) fail('actual personnel components do not reconcile');

const sum = (ids) => ids.reduce((total, id) => total + value(id), 0);
const gsdfAircraft = ['gsdf_lr_2','gsdf_ah_1s','gsdf_oh_1','gsdf_uh_1j','gsdf_uh_2','gsdf_ch_47j_ja','gsdf_uh_60ja','gsdf_ah_64d','gsdf_v_22'];
const msdfAircraft = ['msdf_p_1','msdf_p_3c','msdf_us_2','msdf_sh_60j','msdf_sh_60k','msdf_sh_60l','msdf_mch_101'];
const asdfAircraft = ['asdf_f_15j_dj','asdf_f_2a_b','asdf_f_35a','asdf_c_1','asdf_c_2','asdf_c_130h','asdf_kc_767','asdf_kc_46a','asdf_kc_130h','asdf_e_2c','asdf_e_2d','asdf_e_767','asdf_rq_4b','asdf_ch_47j','asdf_uh_60j'];
if (sum(gsdfAircraft) !== 310) fail('GSDF listed aircraft subtotal diverges');
if (sum(msdfAircraft) !== 156) fail('MSDF listed aircraft subtotal diverges');
if (sum(asdfAircraft) !== 451) fail('ASDF listed aircraft subtotal diverges');

const ships = ['msdf_destroyers','msdf_submarines','msdf_mine_warfare_ships','msdf_patrol_combatant_craft','msdf_amphibious_ships','msdf_auxiliary_ships'];
if (sum(ships) !== 140) fail('listed commissioned ship category subtotal diverges');

for (const id of ['gsdf_mortars','gsdf_mobile_combat_vehicles','gsdf_armored_vehicles','gsdf_light_armored_vehicles','gsdf_amphibious_vehicles']) {
  if (claimById.get(`claim_jpn_mod_2025_${id}`)?.quantity_precision !== 'approximate') fail(`source approximation lost for ${id}`);
}
for (const claim of claims.filter((row) => row.domain === 'personnel')) {
  if (!claim.population_definition.includes('nested scopes')) fail(`personnel nesting rule missing: ${claim.claim_id}`);
}

if (manifest.acceptance.research_complete || manifest.acceptance.decision_usable || manifest.acceptance.simulation_ready) fail('claim tranche must remain nonexecutable');

const report = {
  status: errors.length ? 'FAIL' : 'PASS',
  packet: manifest.force_ledger_id,
  records: { sources: sources.length, claims: claims.length, exact, approximate },
  reconciliations: { authorized_personnel: authorizedComponents, actual_personnel: actualComponents, gsdf_aircraft: sum(gsdfAircraft), msdf_aircraft: sum(msdfAircraft), asdf_aircraft: sum(asdfAircraft), listed_ship_categories: sum(ships) },
  errors
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
