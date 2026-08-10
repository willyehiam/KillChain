#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const checkOnly = process.argv.includes("--check");
const differences = [];
const bookmarkId = "bookmark_global_fracture_2025_09_01";
const asOf = "2025-09-01T00:00:00Z";
const accessedAt = "2026-08-10";

function legalSource(sourceId, title, publisher, url, relevantLocator, effectiveFrom) {
  return {
    source_id: sourceId,
    title,
    publisher,
    accessed_at: accessedAt,
    source_tier: "A",
    source_type: "law_or_treaty",
    url,
    relevant_locator: relevantLocator,
    source_family_id: `family_${publisher.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replaceAll(/^_|_$/g, "")}`,
    mutability_class: "legal_instrument",
    bookmark_temporal_proof: {
      status: "historically_valid_instrument_at_bookmark",
      effective_from: effectiveFrom,
      rule: "The historically valid legal instrument controls. Retrieval date does not move the instrument across the bookmark firewall.",
    },
  };
}

function datedSource(sourceId, title, publisher, publishedAt, url, relevantLocator, sourceFamilyId, notes) {
  const source = {
    source_id: sourceId,
    title,
    publisher,
    published_at: publishedAt,
    accessed_at: accessedAt,
    source_tier: "A",
    source_type: "official_release",
    url,
    relevant_locator: relevantLocator,
    source_family_id: sourceFamilyId,
    mutability_class: "dated_publication",
    bookmark_temporal_proof: {
      status: "dated_prebookmark_publication",
      published_at: publishedAt,
    },
  };
  if (notes) source.reliability_notes = notes;
  return source;
}

const sources = [
  legalSource(
    "src_jpn_constitution",
    "The Constitution of Japan",
    "Japanese Law Translation",
    "https://www.japaneselawtranslation.go.jp/en/laws/view/174/en",
    "Articles 9, 65, 66, 67, 70, 71, 72, and 73",
    "1947-05-03",
  ),
  legalSource(
    "src_jpn_armed_attack_response_act",
    "Act on the Peace and Independence of Japan and Maintenance of the Security of the Nation and the People in Armed Attack Situations, etc., and Survival-Threatening Situations",
    "Japanese Law Translation",
    "https://www.japaneselawtranslation.go.jp/en/laws/view/4925/en",
    "Article 9, paragraphs 4 through 7",
    "2004-09-17",
  ),
  legalSource(
    "src_jpn_us_forces_support_act",
    "Act Concerning Measures Implemented by Japan in Connection with Actions of the United States Armed Forces and Others in Armed Attack Situations, etc., and Survival-Threatening Situations",
    "Japanese Law Translation",
    "https://www.japaneselawtranslation.go.jp/en/laws/view/5069/en",
    "Articles 1 and 10",
    "2004-09-17",
  ),
  legalSource(
    "src_jpn_us_security_treaty",
    "Treaty of Mutual Cooperation and Security between Japan and the United States of America",
    "Ministry of Foreign Affairs of Japan",
    "https://www.mofa.go.jp/na/st/page1we_000093.html",
    "Articles 3 through 6",
    "1960-06-23",
  ),
  datedSource(
    "src_jpn_cabinet_2025_09_01",
    "List of Ministers, Second Ishiba Cabinet",
    "Prime Minister's Office of Japan",
    "2025-09-01",
    "https://japan.kantei.go.jp/103/meibo/daijin/index_e.html",
    "Inaugurated November 11, 2024; list explicitly marked as of September 1, 2025",
    "family_prime_ministers_office_of_japan",
    "The dated cabinet page is the controlling bookmark roster. Later cabinet archive pages are reference only and are not used to import later office changes.",
  ),
  datedSource(
    "src_jpn_pm_action_2025_09_01",
    "Comprehensive Disaster Prevention Drills for FY2025",
    "Prime Minister's Office of Japan",
    "2025-09-01",
    "https://japan.kantei.go.jp/103/actions/202509/01bousai.html",
    "Prime Minister Ishiba and Cabinet activity on the bookmark date",
    "family_prime_ministers_office_of_japan",
  ),
  datedSource(
    "src_jpn_hayashi_press_2025_09_01",
    "Press Conference by Chief Cabinet Secretary Hayashi, September 1 Afternoon",
    "Prime Minister's Office of Japan",
    "2025-09-01",
    "https://japan.kantei.go.jp/tyoukanpress/202509/1_p.html",
    "Dated title and office on the bookmark date",
    "family_prime_ministers_office_of_japan",
  ),
  datedSource(
    "src_jpn_mod_jjoc_2025_03_11",
    "Press Conference by Defense Minister Nakatani on March 11, 2025",
    "Ministry of Defense of Japan",
    "2025-03-11",
    "https://www.mod.go.jp/en/article/2025/03/4a61f7ad0126463257ef3078dc8a8153cd4a1493.html",
    "JJOC implementation date and appointment of General Nagumo",
    "family_ministry_of_defense_of_japan",
  ),
  datedSource(
    "src_jpn_joint_staff_uchikura_2025_08_01",
    "Greeting from the Chief of Staff, Joint Staff",
    "Joint Staff, Ministry of Defense of Japan",
    "2025-08-01",
    "https://www.mod.go.jp/js/about/message/2025/0801.html",
    "Appointment of General Uchikura as eighth Chief of Staff, Joint Staff",
    "family_joint_staff_ministry_of_defense_of_japan",
  ),
  datedSource(
    "src_jpn_party_leaders_2025_07_25",
    "Interparty Leaders Meeting on July 25, 2025",
    "Japan Innovation Party",
    "2025-07-25",
    "https://o-ishin.jp/news/2025/07/25/17297.html",
    "Dated attendee list naming seven government and opposition party leaders",
    "family_japan_innovation_party",
  ),
  datedSource(
    "src_jpn_defense_white_paper_2025_jjoc",
    "Defense of Japan 2025, Special Feature on Joint Operations Command",
    "Ministry of Defense of Japan",
    "2025-07-15",
    "https://www.mod.go.jp/j/press/wp/wp2025/html/nt110000.html",
    "JJOC command relationship and cross domain operational role",
    "family_ministry_of_defense_of_japan",
  ),
];

function claim(claimId, subjectId, predicate, value, sourceIds, evidenceState = "accepted") {
  return {
    claim_id: claimId,
    subject_id: subjectId,
    predicate,
    value,
    as_of: asOf,
    evidence_state: evidenceState,
    confidence: "high",
    source_ids: sourceIds,
  };
}

const claims = [
  claim("claim_jpn_constitution_article_9", "country_jpn", "constitutional_force_constraint", "Article 9 renounces war as a sovereign right and the threat or use of force as means of settling international disputes.", ["src_jpn_constitution"]),
  claim("claim_jpn_cabinet_executive_power", "institution_jpn_cabinet", "holds_executive_power", true, ["src_jpn_constitution"]),
  claim("claim_jpn_prime_minister_diet_designation", "institution_jpn_prime_minister", "designated_by", "National Diet resolution from among Diet members", ["src_jpn_constitution"]),
  claim("claim_jpn_prime_minister_administrative_supervision", "institution_jpn_prime_minister", "authority", "Control and supervision over administrative branches while representing the Cabinet", ["src_jpn_constitution"]),
  claim("claim_jpn_cabinet_foreign_affairs_treaties", "institution_jpn_cabinet", "foreign_affairs_authority", "Manages foreign affairs and concludes treaties subject to prior or, depending on circumstances, subsequent Diet approval", ["src_jpn_constitution"]),
  claim("claim_jpn_prime_minister_vacancy", "institution_jpn_cabinet", "prime_minister_vacancy_effect", "Cabinet resigns en masse and continues functions until a new Prime Minister is appointed", ["src_jpn_constitution"]),
  claim("claim_jpn_defense_operations_basic_plan", "institution_jpn_cabinet", "defense_operations_precondition", "Prime Minister prepares a draft Basic Response Plan and seeks a Cabinet decision", ["src_jpn_armed_attack_response_act"]),
  claim("claim_jpn_defense_operations_diet_approval", "institution_jpn_diet", "defense_operations_gate", "Prime Minister requests Diet approval before a defense operations order", ["src_jpn_armed_attack_response_act"]),
  claim("claim_jpn_defense_operations_urgent_exception", "institution_jpn_prime_minister", "urgent_defense_operations_rule", "A defense operations order may precede Diet approval only when particularly urgent and there is no time for prior approval", ["src_jpn_armed_attack_response_act"]),
  claim("claim_jpn_allied_support_services", "institution_jpn_ministry_of_defense", "allied_action_support_scope", ["supply_excluding_weapons", "transportation", "repair_and_maintenance", "medical_care", "communications", "airport_and_port_operations", "base_operations", "accommodation", "storage", "facility_use", "training"], ["src_jpn_us_forces_support_act"]),
  claim("claim_jpn_treaty_consultation", "alliance_jpn_usa_security_treaty", "consultation_trigger", "At either party's request when Japan's security or international peace and security in the Far East is threatened", ["src_jpn_us_security_treaty"]),
  claim("claim_jpn_treaty_article_v_scope", "alliance_jpn_usa_security_treaty", "article_v_geographic_scope", "Armed attack against either party in territories under the administration of Japan", ["src_jpn_us_security_treaty"]),
  claim("claim_jpn_treaty_article_v_process", "alliance_jpn_usa_security_treaty", "article_v_response_rule", "Each party acts to meet the common danger in accordance with its constitutional provisions and processes", ["src_jpn_us_security_treaty"]),
  claim("claim_jpn_treaty_article_vi_facilities", "alliance_jpn_usa_security_treaty", "article_vi_facility_access", "United States land, air, and naval forces are granted use of facilities and areas in Japan under separate arrangements", ["src_jpn_us_security_treaty"]),
  claim("claim_jpn_jjoc_established", "institution_jpn_jjoc", "established_at", "2025-03-24", ["src_jpn_mod_jjoc_2025_03_11", "src_jpn_defense_white_paper_2025_jjoc"]),
  claim("claim_jpn_jjoc_command_role", "institution_jpn_jjoc", "operational_role", "Commander receives Minister of Defense orders and centrally commands major Ground, Maritime, Air, space, and cyber forces for operations", ["src_jpn_defense_white_paper_2025_jjoc"]),
  claim("claim_jpn_actor_ishiba_role", "actor_jpn_ishiba_shigeru", "office", "Prime Minister", ["src_jpn_cabinet_2025_09_01", "src_jpn_pm_action_2025_09_01"]),
  claim("claim_jpn_actor_hayashi_role", "actor_jpn_hayashi_yoshimasa", "office", "Chief Cabinet Secretary", ["src_jpn_cabinet_2025_09_01", "src_jpn_hayashi_press_2025_09_01"]),
  claim("claim_jpn_actor_iwaya_role", "actor_jpn_iwaya_takeshi", "office", "Minister for Foreign Affairs", ["src_jpn_cabinet_2025_09_01"]),
  claim("claim_jpn_actor_nakatani_role", "actor_jpn_nakatani_gen", "office", "Minister of Defense", ["src_jpn_cabinet_2025_09_01", "src_jpn_mod_jjoc_2025_03_11"]),
  claim("claim_jpn_actor_kato_role", "actor_jpn_kato_katsunobu", "office", "Minister of Finance", ["src_jpn_cabinet_2025_09_01"]),
  claim("claim_jpn_actor_muto_role", "actor_jpn_muto_yohji", "office", "Minister of Economy, Trade and Industry", ["src_jpn_cabinet_2025_09_01"]),
  claim("claim_jpn_actor_koizumi_role", "actor_jpn_koizumi_shinjiro", "office", "Minister of Agriculture, Forestry and Fisheries", ["src_jpn_cabinet_2025_09_01"]),
  claim("claim_jpn_actor_akazawa_role", "actor_jpn_akazawa_ryosei", "office", "Minister in charge of Economic Revitalization", ["src_jpn_cabinet_2025_09_01"]),
  claim("claim_jpn_actor_kiuchi_role", "actor_jpn_kiuchi_minoru", "office", "Minister in charge of Economic Security", ["src_jpn_cabinet_2025_09_01"]),
  claim("claim_jpn_actor_murakami_role", "actor_jpn_murakami_seiichiro", "office", "Minister for Internal Affairs and Communications", ["src_jpn_cabinet_2025_09_01"]),
  claim("claim_jpn_actor_abe_role", "actor_jpn_abe_toshiko", "office", "Minister of Education, Culture, Sports, Science and Technology", ["src_jpn_cabinet_2025_09_01"]),
  claim("claim_jpn_actor_noda_role", "actor_jpn_noda_yoshihiko", "office", "Constitutional Democratic Party president", ["src_jpn_party_leaders_2025_07_25"]),
  claim("claim_jpn_actor_saito_role", "actor_jpn_saito_tetsuo", "office", "Komeito representative", ["src_jpn_party_leaders_2025_07_25"]),
  claim("claim_jpn_actor_tamaki_role", "actor_jpn_tamaki_yuichiro", "office", "Democratic Party for the People representative", ["src_jpn_party_leaders_2025_07_25"]),
  claim("claim_jpn_actor_maehara_role", "actor_jpn_maehara_seiji", "office", "Japan Innovation Party co-representative", ["src_jpn_party_leaders_2025_07_25"]),
  claim("claim_jpn_actor_tamura_role", "actor_jpn_tamura_tomoko", "office", "Japanese Communist Party chair", ["src_jpn_party_leaders_2025_07_25"]),
  claim("claim_jpn_actor_oishi_role", "actor_jpn_oishi_akiko", "office", "Reiwa Shinsengumi co-representative", ["src_jpn_party_leaders_2025_07_25"]),
  claim("claim_jpn_actor_kamiya_role", "actor_jpn_kamiya_sohei", "office", "Sanseito representative", ["src_jpn_party_leaders_2025_07_25"]),
  claim("claim_jpn_actor_uchikura_role", "actor_jpn_uchikura_hiroaki", "office", "Chief of Staff, Joint Staff", ["src_jpn_joint_staff_uchikura_2025_08_01"]),
  claim("claim_jpn_actor_nagumo_role", "actor_jpn_nagumo_kenichiro", "office", "Commander, Joint Operations Command", ["src_jpn_mod_jjoc_2025_03_11"]),
];

const contradictionSets = [
  {
    contradiction_set_id: "contradiction_jpn_taiwan_automatic_intervention",
    question: "Does an armed attack on Taiwan automatically activate Article V or Japanese defense operations authority?",
    claim_ids: ["claim_jpn_treaty_article_v_scope", "claim_jpn_treaty_article_v_process", "claim_jpn_constitution_article_9"],
    source_ids: ["src_jpn_us_security_treaty", "src_jpn_constitution"],
    status: "resolved_for_initialization",
    simulation_rule: "No. Do not auto activate Article V or Japanese force employment from an attack outside territories administered by Japan. Create a separate political, factual, and legal decision chain.",
    last_reviewed: accessedAt,
    review_after: "2027-02-10",
    notes: "This is a scope guard, not a prediction that Japan remains neutral.",
  },
  {
    contradiction_set_id: "contradiction_jpn_diet_approval_timing",
    question: "Must Diet approval always precede a defense operations order?",
    claim_ids: ["claim_jpn_defense_operations_diet_approval", "claim_jpn_defense_operations_urgent_exception"],
    source_ids: ["src_jpn_armed_attack_response_act"],
    status: "resolved_with_conditional_branch",
    simulation_rule: "Prior approval is the normal gate. The urgent branch is available only after an independently represented urgency fact and creates an immediate subsequent approval obligation.",
    last_reviewed: accessedAt,
    review_after: "2027-02-10",
    notes: "Urgency cannot be manufactured by the player as a free bypass.",
  },
  {
    contradiction_set_id: "contradiction_jpn_formal_and_practical_influence",
    question: "Do formal offices establish each actor's practical influence over a particular crisis decision?",
    claim_ids: claims.filter((entry) => entry.predicate === "office").map((entry) => entry.claim_id),
    source_ids: ["src_jpn_cabinet_2025_09_01", "src_jpn_party_leaders_2025_07_25", "src_jpn_joint_staff_uchikura_2025_08_01", "src_jpn_mod_jjoc_2025_03_11"],
    status: "open",
    simulation_rule: "Office supports roster inclusion only. Keep practical influence unaccepted until multiple independent source families support it.",
    last_reviewed: accessedAt,
    review_after: "2026-11-10",
    notes: "The roster is not an election, coup, succession, or coalition forecast.",
  },
];

const evidenceRegistry = {
  schema_version: "0.2.0",
  registry_id: "evidence_registry_jpn_2025_09_01",
  country_id: "country_jpn",
  bookmark_id: bookmarkId,
  as_of: asOf,
  status: "needs_review",
  staging_rules: {
    post_bookmark_opening_claims_forbidden: true,
    live_mutable_sources_require_prebookmark_temporal_proof: true,
    office_does_not_prove_practical_influence: true,
    treaty_does_not_bypass_domestic_authority: true,
    missing_force_or_facility_evidence_is_unknown_not_zero: true,
  },
  sources,
  claims,
  contradiction_sets: contradictionSets,
  notes: "First substantive Japan packet. It accepts political, constitutional, alliance scope, and joint command facts only. It does not accept force quantities, readiness, locations, facilities, or crisis deployments.",
};

const institutions = [
  ["institution_jpn_cabinet", "Cabinet of Japan", "executive", "second_ishiba_cabinet"],
  ["institution_jpn_prime_minister", "Prime Minister of Japan", "executive_office", "ishiba_incumbent"],
  ["institution_jpn_diet", "National Diet", "legislature", "constitutional_legislature"],
  ["institution_jpn_ldp", "Liberal Democratic Party", "political_party", "governing_party"],
  ["institution_jpn_komeito", "Komeito", "political_party", "governing_coalition_partner"],
  ["institution_jpn_cdp", "Constitutional Democratic Party", "political_party", "major_opposition"],
  ["institution_jpn_dpfp", "Democratic Party for the People", "political_party", "opposition"],
  ["institution_jpn_jip", "Japan Innovation Party", "political_party", "opposition"],
  ["institution_jpn_jcp", "Japanese Communist Party", "political_party", "opposition"],
  ["institution_jpn_reiwa", "Reiwa Shinsengumi", "political_party", "opposition"],
  ["institution_jpn_sanseito", "Sanseito", "political_party", "opposition"],
  ["institution_jpn_ministry_of_defense", "Ministry of Defense", "executive_ministry", "nakatani_incumbent"],
  ["institution_jpn_joint_staff", "Joint Staff", "military_staff", "uchikura_incumbent"],
  ["institution_jpn_jjoc", "Joint Operations Command", "operational_command", "established_and_operating"],
].map(([institutionId, name, category, openingStatus]) => ({
  institution_id: institutionId,
  name,
  category,
  opening_status: openingStatus,
  source_ids: category === "political_party" ? ["src_jpn_party_leaders_2025_07_25"] : category.includes("military") || category === "operational_command" || institutionId === "institution_jpn_ministry_of_defense" ? ["src_jpn_mod_jjoc_2025_03_11", "src_jpn_joint_staff_uchikura_2025_08_01"] : ["src_jpn_constitution", "src_jpn_cabinet_2025_09_01"],
}));

const actorRows = [
  ["actor_jpn_ishiba_shigeru", "ISHIBA Shigeru", "Prime Minister", ["institution_jpn_prime_minister", "institution_jpn_cabinet", "institution_jpn_ldp"], "head_of_government_and_defense_authority", "incumbent", ["src_jpn_cabinet_2025_09_01", "src_jpn_pm_action_2025_09_01"]],
  ["actor_jpn_hayashi_yoshimasa", "HAYASHI Yoshimasa", "Chief Cabinet Secretary", ["institution_jpn_cabinet", "institution_jpn_ldp"], "cabinet_coordination_and_public_information", "cabinet_member", ["src_jpn_cabinet_2025_09_01", "src_jpn_hayashi_press_2025_09_01"]],
  ["actor_jpn_iwaya_takeshi", "IWAYA Takeshi", "Minister for Foreign Affairs", ["institution_jpn_cabinet", "institution_jpn_ldp"], "foreign_policy_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01"]],
  ["actor_jpn_nakatani_gen", "NAKATANI Gen", "Minister of Defense", ["institution_jpn_cabinet", "institution_jpn_ministry_of_defense", "institution_jpn_ldp"], "defense_policy_and_operational_order_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01", "src_jpn_mod_jjoc_2025_03_11"]],
  ["actor_jpn_kato_katsunobu", "KATO Katsunobu", "Minister of Finance", ["institution_jpn_cabinet", "institution_jpn_ldp"], "fiscal_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01"]],
  ["actor_jpn_muto_yoji", "MUTO Yoji", "Minister of Economy, Trade and Industry", ["institution_jpn_cabinet", "institution_jpn_ldp"], "industry_energy_and_trade_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01"]],
  ["actor_jpn_koizumi_shinjiro", "KOIZUMI Shinjiro", "Minister of Agriculture, Forestry and Fisheries", ["institution_jpn_cabinet", "institution_jpn_ldp"], "food_security_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01"]],
  ["actor_jpn_akazawa_ryosei", "AKAZAWA Ryosei", "Minister in charge of Economic Revitalization", ["institution_jpn_cabinet", "institution_jpn_ldp"], "economic_policy_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01"]],
  ["actor_jpn_kiuchi_minoru", "KIUCHI Minoru", "Minister in charge of Economic Security", ["institution_jpn_cabinet", "institution_jpn_ldp"], "economic_security_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01"]],
  ["actor_jpn_murakami_seiichiro", "MURAKAMI Seiichiro", "Minister for Internal Affairs and Communications", ["institution_jpn_cabinet", "institution_jpn_ldp"], "domestic_administration_and_communications_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01"]],
  ["actor_jpn_abe_toshiko", "ABE Toshiko", "Minister of Education, Culture, Sports, Science and Technology", ["institution_jpn_cabinet", "institution_jpn_ldp"], "science_and_technology_policy_principal", "cabinet_member", ["src_jpn_cabinet_2025_09_01"]],
  ["actor_jpn_noda_yoshihiko", "NODA Yoshihiko", "Constitutional Democratic Party president", ["institution_jpn_cdp"], "major_opposition_leader", "not_cabinet_successor", ["src_jpn_party_leaders_2025_07_25"]],
  ["actor_jpn_saito_tetsuo", "SAITO Tetsuo", "Komeito representative", ["institution_jpn_komeito"], "governing_coalition_party_leader", "not_cabinet_successor", ["src_jpn_party_leaders_2025_07_25"]],
  ["actor_jpn_tamaki_yuichiro", "TAMAKI Yuichiro", "Democratic Party for the People representative", ["institution_jpn_dpfp"], "opposition_party_leader", "not_cabinet_successor", ["src_jpn_party_leaders_2025_07_25"]],
  ["actor_jpn_maehara_seiji", "MAEHARA Seiji", "Japan Innovation Party co-representative", ["institution_jpn_jip"], "opposition_diet_leader", "not_cabinet_successor", ["src_jpn_party_leaders_2025_07_25"]],
  ["actor_jpn_tamura_tomoko", "TAMURA Tomoko", "Japanese Communist Party chair", ["institution_jpn_jcp"], "opposition_party_leader", "not_cabinet_successor", ["src_jpn_party_leaders_2025_07_25"]],
  ["actor_jpn_oishi_akiko", "OISHI Akiko", "Reiwa Shinsengumi co-representative", ["institution_jpn_reiwa"], "opposition_party_leader", "not_cabinet_successor", ["src_jpn_party_leaders_2025_07_25"]],
  ["actor_jpn_kamiya_sohei", "KAMIYA Sohei", "Sanseito representative", ["institution_jpn_sanseito"], "opposition_party_leader", "not_cabinet_successor", ["src_jpn_party_leaders_2025_07_25"]],
  ["actor_jpn_uchikura_hiroaki", "UCHIKURA Hiroaki", "Chief of Staff, Joint Staff", ["institution_jpn_joint_staff", "institution_jpn_ministry_of_defense"], "senior_military_adviser", "not_political_successor", ["src_jpn_joint_staff_uchikura_2025_08_01"]],
  ["actor_jpn_nagumo_kenichiro", "NAGUMO Ken-ichiro", "Commander, Joint Operations Command", ["institution_jpn_jjoc", "institution_jpn_ministry_of_defense"], "joint_operational_commander", "not_political_successor", ["src_jpn_mod_jjoc_2025_03_11"]],
];

const politicalActors = actorRows.map(([actorId, name, office, institutionIds, relevance, successionEligibility, sourceIds]) => ({
  actor_id: actorId,
  name,
  office,
  institution_ids: institutionIds,
  relevance,
  succession_eligibility: successionEligibility,
  confidence: "high",
  source_ids: sourceIds,
  selection_basis_status: "institutional_relevance_only",
  practical_influence: {
    status: "unaccepted",
    source_ids: [],
    source_family_ids: [],
    minimum_independent_source_families: 2,
  },
}));

const politics = {
  schema_version: "0.1.0",
  country_id: "country_jpn",
  bookmark_id: bookmarkId,
  as_of: asOf,
  status: "needs_review",
  government: {
    system_summary: "Parliamentary constitutional monarchy. Executive power is vested in the Cabinet, whose Prime Minister is designated by the National Diet.",
    head_of_state_actor_id: null,
    head_of_government_actor_id: "actor_jpn_ishiba_shigeru",
    head_of_state_note: "The Emperor is the constitutional symbol of the State and is intentionally not treated as a policy commanding political actor in this packet.",
    governing_institution_ids: ["institution_jpn_cabinet", "institution_jpn_prime_minister", "institution_jpn_diet", "institution_jpn_ldp", "institution_jpn_komeito"],
    major_opposition_institution_ids: ["institution_jpn_cdp", "institution_jpn_dpfp", "institution_jpn_jip"],
    formal_decision_authority: [
      {
        domain: "executive_government",
        rule: "Executive power is vested in the Cabinet. The Prime Minister is designated by the Diet and supervises administrative branches while representing the Cabinet.",
        claim_ids: ["claim_jpn_cabinet_executive_power", "claim_jpn_prime_minister_diet_designation", "claim_jpn_prime_minister_administrative_supervision"],
        source_ids: ["src_jpn_constitution"],
      },
      {
        domain: "defense_operations",
        rule: "A Basic Response Plan, Cabinet decision, and Diet approval are separate gates. Only a particularly urgent necessity permits an order before prior Diet approval, and it creates a later approval obligation.",
        claim_ids: ["claim_jpn_defense_operations_basic_plan", "claim_jpn_defense_operations_diet_approval", "claim_jpn_defense_operations_urgent_exception"],
        source_ids: ["src_jpn_armed_attack_response_act"],
      },
      {
        domain: "operational_command",
        rule: "After lawful civilian authorization, the Minister of Defense issues operational orders and the Joint Operations Command centrally commands assigned major forces.",
        claim_ids: ["claim_jpn_jjoc_established", "claim_jpn_jjoc_command_role"],
        source_ids: ["src_jpn_mod_jjoc_2025_03_11", "src_jpn_defense_white_paper_2025_jjoc"],
      },
    ],
    succession: {
      first_successor_actor_id: null,
      status: "designation_order_not_yet_sourced",
      constitutional_continuity: "The Cabinet resigns en masse upon a Prime Minister vacancy but continues functions until a new Prime Minister is appointed.",
      claim_ids: ["claim_jpn_prime_minister_vacancy"],
      source_ids: ["src_jpn_constitution"],
      unknowns: ["The controlling 2025 Cabinet designation order for temporary performance of Prime Minister duties has not been accepted and must not be inferred from later succession events."],
    },
    alliance_commitment_context: [
      {
        commitment: "Japan United States security treaty",
        opening_rule: "Consultation and Article V response are distinct. Article V applies to an armed attack against either party in territories under Japan's administration and requires each party to use its own constitutional processes.",
        automatic_taiwan_intervention: false,
        claim_ids: ["claim_jpn_treaty_consultation", "claim_jpn_treaty_article_v_scope", "claim_jpn_treaty_article_v_process", "claim_jpn_treaty_article_vi_facilities"],
        source_ids: ["src_jpn_us_security_treaty"],
      },
    ],
  },
  institutions,
  political_actors: politicalActors,
  actor_selection_policy: {
    target_count: 20,
    inclusion_rule: "Opening officeholders, coalition and opposition party leaders, and the senior joint command principals needed to resolve national decisions.",
    practical_influence_requires_multiple_families: true,
    inclusion_is_forecast: false,
  },
  unknowns: [
    "Practical influence, factional bargaining power, public support elasticity, and coalition behavior are not established by formal office evidence.",
    "The temporary Prime Minister duty designation order is not accepted, so no first successor actor is initialized.",
    "No military quantity, readiness, disposition, facility, or deployment is established by this politics packet.",
    "Japan's decision in a Taiwan contingency is not predetermined by the alliance treaty or this roster.",
  ],
};

const workflow = {
  schema_version: "0.1.0",
  workflow_id: "war_authority_jpn_2025_09_01",
  country_id: "country_jpn",
  bookmark_id: bookmarkId,
  as_of: asOf,
  status: "needs_independent_legal_review",
  purpose: "Research contract for lawful Japanese defense operations, alliance consultation, allied support, and operational command. It rejects a generic declare war button and automatic Taiwan intervention.",
  routes: [
    {
      route_id: "route_jpn_alliance_consultation",
      classification: "diplomatic_security_consultation",
      automatic_force_authority: false,
      trigger: "Request by either treaty party when Japan's security or peace and security in the Far East is threatened",
      gate_ids: ["gate_jpn_treaty_party_request_or_agreement"],
      source_ids: ["src_jpn_us_security_treaty"],
    },
    {
      route_id: "route_jpn_defense_operations_normal",
      classification: "domestic_defense_authority",
      transition: { from_state: "ordinary_security_posture", to_state: "defense_operations_authorized" },
      gate_ids: ["gate_jpn_qualifying_situation", "gate_jpn_basic_response_plan", "gate_jpn_cabinet_decision", "gate_jpn_prior_diet_approval", "gate_jpn_prime_minister_order"],
      source_ids: ["src_jpn_armed_attack_response_act"],
    },
    {
      route_id: "route_jpn_defense_operations_urgent",
      classification: "conditional_urgent_domestic_defense_authority",
      transition: { from_state: "ordinary_security_posture", to_state: "provisionally_authorized_pending_diet_approval" },
      gate_ids: ["gate_jpn_qualifying_situation", "gate_jpn_independent_urgent_necessity", "gate_jpn_basic_response_plan", "gate_jpn_cabinet_decision", "gate_jpn_prime_minister_order"],
      post_activation_gate_ids: ["gate_jpn_subsequent_diet_approval"],
      repeated_activation_policy: "reject_without_new_independent_trigger_event",
      source_ids: ["src_jpn_armed_attack_response_act"],
    },
    {
      route_id: "route_jpn_allied_action_support",
      classification: "bounded_logistics_and_services_support",
      automatic_kinetic_authority: false,
      gate_ids: ["gate_jpn_qualifying_situation", "gate_jpn_basic_response_plan", "gate_jpn_defense_minister_support_order", "gate_jpn_prime_minister_support_approval_when_required"],
      allowed_service_claim_id: "claim_jpn_allied_support_services",
      source_ids: ["src_jpn_us_forces_support_act", "src_jpn_armed_attack_response_act"],
    },
    {
      route_id: "route_jpn_joint_operational_execution",
      classification: "civilian_authority_to_military_execution",
      authority_prerequisite: "A separate lawful operations route has reached an authorized state",
      gate_ids: ["gate_jpn_defense_minister_operational_order", "gate_jpn_jjoc_tasking"],
      source_ids: ["src_jpn_mod_jjoc_2025_03_11", "src_jpn_defense_white_paper_2025_jjoc"],
    },
  ],
  decision_gates: [
    ["gate_jpn_treaty_party_request_or_agreement", "diplomatic_event", [], "Recorded request or agreement to consult under Article IV"],
    ["gate_jpn_qualifying_situation", "independent_world_state_fact", [], "Independently represented armed attack, anticipated armed attack, or survival threatening situation matching the selected statutory route"],
    ["gate_jpn_independent_urgent_necessity", "independent_world_state_fact", [], "Particularly urgent necessity with no time for prior Diet approval; cannot be created solely by player assertion"],
    ["gate_jpn_basic_response_plan", "executive_plan", ["institution_jpn_prime_minister"], "Draft Basic Response Plan records situation, objectives, measures, and authority requested"],
    ["gate_jpn_cabinet_decision", "cabinet_decision", ["institution_jpn_cabinet"], "Cabinet decision accepts the Basic Response Plan"],
    ["gate_jpn_prior_diet_approval", "legislative_approval", ["institution_jpn_diet"], "Diet approval before the defense operations order"],
    ["gate_jpn_prime_minister_order", "prime_minister_order", ["institution_jpn_prime_minister"], "Prime Minister issues the defense operations order"],
    ["gate_jpn_subsequent_diet_approval", "post_activation_legislative_approval", ["institution_jpn_diet"], "Diet approval sought immediately after urgent activation; failure effects require independent legal review"],
    ["gate_jpn_defense_minister_support_order", "ministerial_order", ["institution_jpn_ministry_of_defense"], "Defense Minister orders the bounded support measure"],
    ["gate_jpn_prime_minister_support_approval_when_required", "conditional_prime_minister_approval", ["institution_jpn_prime_minister"], "Prime Minister approval when Article 10 paragraph 3 applies"],
    ["gate_jpn_defense_minister_operational_order", "civilian_operational_order", ["institution_jpn_ministry_of_defense"], "Defense Minister issues an operational order within already activated authority"],
    ["gate_jpn_jjoc_tasking", "joint_command_tasking", ["institution_jpn_jjoc"], "JJOC assigns and commands forces without creating political authority or inventory"],
  ].map(([gateId, gateType, requiredInstitutionIds, completionEvidence]) => ({ gate_id: gateId, gate_type: gateType, required_institution_ids: requiredInstitutionIds, completion_evidence: completionEvidence })),
  taiwan_contingency_guard: {
    attack_on_taiwan_auto_activates_japanese_authority: false,
    attack_on_taiwan_auto_activates_treaty_article_v: false,
    required_next_step: "Create an Article IV consultation event and separately evaluate Japanese statutory facts, Cabinet choice, Diet support, alliance access, and domestic support.",
  },
  acceptance_rules: {
    generic_declare_war_button_allowed: false,
    treaty_equals_automatic_intervention: false,
    consultation_equals_force_authority: false,
    allied_support_equals_kinetic_participation: false,
    jjoc_tasking_creates_political_authority: false,
    urgent_branch_requires_independent_fact: true,
    force_execution_requires_conserved_inventory: true,
  },
  unresolved_interpretations: [
    { question_id: "unknown_jpn_urgent_diet_failure_effect", question: "What exact termination or remediation follows if subsequent Diet approval is denied?", status: "not_established_by_packet_sources", source_ids: ["src_jpn_armed_attack_response_act"] },
    { question_id: "unknown_jpn_taiwan_survival_threat_threshold", question: "Which Taiwan contingency facts would satisfy the statutory survival threatening situation threshold?", status: "scenario_dependent_not_predetermined", source_ids: ["src_jpn_armed_attack_response_act"] },
    { question_id: "unknown_jpn_public_support_thresholds", question: "What political support and coalition thresholds should modify but not replace formal legal gates?", status: "game_design_and_evidence_work_required", source_ids: [] },
  ],
  source_ids: ["src_jpn_constitution", "src_jpn_armed_attack_response_act", "src_jpn_us_forces_support_act", "src_jpn_us_security_treaty", "src_jpn_mod_jjoc_2025_03_11", "src_jpn_defense_white_paper_2025_jjoc"],
};

const bookmarkState = {
  schema_version: "0.2.0",
  bookmark_state_id: "bookmark_state_jpn_2025_09_01",
  country_id: "country_jpn",
  bookmark_id: bookmarkId,
  as_of: asOf,
  status: "collecting",
  knowledge_firewall_status: "needs_independent_review",
  government: {
    dataset_path: "politics_and_institutions.json",
    head_of_state_actor_id: null,
    head_of_government_actor_id: "actor_jpn_ishiba_shigeru",
    first_constitutional_successor_actor_id: null,
    opening_summary: "The Second Ishiba Cabinet governed on September 1, 2025. The Prime Minister, Cabinet, Diet, Defense Minister, Joint Staff, and Joint Operations Command are represented as distinct decision and execution institutions.",
    authority_model: "Use war_authority_workflow.json. Alliance consultation, defense authority, allied support, and operational tasking are separate routes.",
    status: "needs_review",
  },
  political_actors: politicalActors.map((actor) => actor.actor_id),
  administrative_geography: [],
  economic_state: "../top_80_2025/top_80_2025_gdp.json",
  military_posture: null,
  fixed_facilities: [],
  strategic_industry: [],
  infrastructure_networks: [],
  alliances: ["alliance_jpn_usa_security_treaty"],
  sanctions: [],
  active_crises: [],
  foreign_deployments: [],
  unresolved_assumptions: [
    "No first Prime Minister successor is initialized without the controlling designation order.",
    "An attack on Taiwan does not automatically activate Japanese force employment or Article V.",
    "Formal office supports roster inclusion but does not establish practical influence, loyalty, coalition behavior, or successor probability.",
    "Force inventory, readiness, location, basing, logistics, and deployment remain unknown and nonexecutable.",
  ],
  source_ids: sources.map((source) => source.source_id),
  claim_ids: claims.map((entry) => entry.claim_id),
  notes: "Only the politics, authority, alliance scope, and command institution packet is collecting. All other country systems remain absent or shell unless separately linked.",
  acceptance_state: {
    politics_lane_status: "needs_review",
    alliance_lane_status: "needs_review",
    bookmark_firewall_passed: false,
    independent_review_complete: false,
    authority_contract_reviewed: false,
  },
};

function write(fileName, value) {
  const target = path.join(directory, fileName);
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (checkOnly) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) differences.push(fileName);
  } else {
    fs.writeFileSync(target, content);
  }
}

write("evidence_registry.json", evidenceRegistry);
write("politics_and_institutions.json", politics);
write("war_authority_workflow.json", workflow);
write("bookmark_state.json", bookmarkState);

console.log(JSON.stringify({
  status: differences.length ? "FAIL" : "PASS",
  mode: checkOnly ? "check" : "write",
  sources: sources.length,
  claims: claims.length,
  political_actors: politicalActors.length,
  generated_files: 4,
  differences,
}, null, 2));

if (differences.length) process.exitCode = 1;
