# Tier A politics opening state red team

Audit target: remote `main` commit `03d639282ebcaa06713bc4c585d2e117d141dd7e`

Truth date: `2025-09-01T00:00:00Z`

Scope: United States, China, and Taiwan politics evidence registries, political actors, institutions, contradictions, bookmark integration, manifests, coverage records, and `validate_tier_a_structure.mjs`.

## Verdict

The packet is not acceptable as opening truth. Most mechanical validation passes, but the foundation validator fails and five additional blocking defects alter active officeholders or omit national security command structures that a player would need to make the first consequential decision. Passing validators must not be interpreted as factual verification.

Severity count: 6 blocking, 9 major, 3 minor.

## Validation evidence

All commands completed successfully against the audited commit before this review was written:

1. `npm test`
2. `npm run validate:artifact`
3. `node Agents/05_World_Research_and_Data_Director/research_data/validate_research.mjs`
4. `node Agents/05_World_Research_and_Data_Director/research_data/countries/validate_top80.mjs`
5. `node Agents/05_World_Research_and_Data_Director/research_data/countries/generate_top80_shells.mjs --check`
6. `node Agents/05_World_Research_and_Data_Director/research_data/countries/validate_top80_shells.mjs`
7. `node Agents/05_World_Research_and_Data_Director/research_data/countries/validate_registry_profiles.mjs`
8. `node Agents/05_World_Research_and_Data_Director/research_data/countries/validate_tier_a_structure.mjs`
9. `node Agents/05_World_Research_and_Data_Director/research_data/countries/validate_tier_a_force_ledgers.mjs`
10. `node Agents/05_World_Research_and_Data_Director/research_data/countries/test_corpus_integrity.mjs`
11. `node Agents/05_World_Research_and_Data_Director/research_data/countries/validate_corpus_integrity.mjs`

The corpus validator reported zero warnings. That result is itself evidence that the present gates test structure, not opening truth.

`node Agents/05_World_Research_and_Data_Director/research_data/tools/validate_foundation.mjs` failed with 53 unknown Tier A profile sources. This is a blocking integration failure and means the complete validation suite does not pass.

## Blocking findings

### B01 Taiwan ruling party secretary is wrong

Affected records: `actor_twn_lin_yu_chang`, `claim_twn_actor_lin_yu_chang_role`, `bookmark_state_twn_2025_09_01`, and Taiwan politics counts.

Evidence: Lin Yu-chang resigned after the 26 July recall vote. The DPP announced Hsu Kuo-yung as secretary general on 20 August, before the bookmark. [Taiwan News, 20 August 2025](https://www.taiwannews.com.tw/news/6183577) and [Taipei Times, 21 August 2025](https://www.taipeitimes.com/News/taiwan/archives/2025/08/21/2003842420).

Impact: The opening party organization actor, relationships, and influence channels point to a former officeholder.

Correction packet: add dated resignation and appointment sources; close Lin's effective interval; add `actor_twn_hsu_kuo_yung` and a role claim effective no later than 25 August; update the bookmark actor set and all derived counts; add a regression assertion that no opening actor role ended before the bookmark.

Acceptance: a temporal query at the bookmark returns Hsu, not Lin, as DPP secretary general.

### B02 Taiwan divided government is asserted without the evidence needed to reproduce it

Affected records: `institution_twn_legislative_yuan`, `institution_twn_kmt`, `institution_twn_tpp`, `politics_and_institutions.government.legislative_context`, and `bookmark_state_twn_2025_09_01`.

Evidence: The packet cites institutional functions and leaders, but no seat ledger or recall result that establishes opposition control at the bookmark. The Central Election Commission records the 2025 recall outcomes, including all seven 23 August contests being rejected. [CEC recall database](https://db.cec.gov.tw/ElecTable/Recall) and [CEC decision on the seven 23 August contests](https://www.cec.gov.tw/central/article/61391).

Impact: The budget, war support, cabinet accountability, and coalition gates depend on a legislative balance that the evidence graph cannot calculate.

Correction packet: add the 2024 legislative result and party seat allocation; add both 2025 recall rounds with effective dates; derive the 1 September seat ledger; cite that ledger from each opening status; distinguish formal KMT plurality from KMT and TPP cooperation, which is a political relationship rather than a constitutional fact.

Acceptance: a deterministic derivation from election and recall records produces every opening seat count and the stated control relationship.

### B03 China's wartime command architecture is absent

Affected records: `institution_chn_cpc_central_committee`, `actor_chn_xi_jinping`, `bookmark_state_chn_2025_09_01`, and the missing Central Military Commission institution and actors.

Evidence: Xi's record names the Central Military Commission chairmanship, yet the packet has no CMC institution and no military command actor other than Xi. Publicly visible command figures and personnel uncertainty were material by the bookmark. Later official confirmation identifies He Weidong as a CMC vice chair and Miao Hua as the former Political Work Department head, but that October disclosure is retrospective evidence and must not be leaked into 1 September player knowledge. [PRC Ministry of National Defense, 17 October 2025](https://eng.mod.gov.cn/2025xb/P/16417354.html).

Impact: A war game cannot model command availability, civil military handoff, purge uncertainty, or a degraded decision chain with the entire command body omitted.

Correction packet: add a CMC institution; add Zhang Youxia, He Weidong, Liu Zhenli, and the relevant department heads with source dated effective intervals; represent Miao Hua's removal and He Weidong's prebookmark public absence as observations and uncertainty; keep later confirmation in retrospective provenance only; expose public knowledge separately from latent truth.

Acceptance: the opening state can answer who holds each formal CMC node, which nodes are publicly uncertain, and which evidence was knowable on 1 September.

### B04 Ma Xingrui's opening relevance is stale and falsely high confidence

Affected records: `actor_chn_ma_xingrui`, `claim_chn_actor_ma_xingrui_role`, and `bookmark_state_chn_2025_09_01`.

Evidence: The actor is labelled a `senior_provincial_and_party_leader` using only a 2022 Politburo source. Xinhua reported on 1 July 2025 that Ma no longer served as Xinjiang party secretary and would receive another appointment. [Xinhua, 1 July 2025](https://english.news.cn/20250701/1023a087516248058aeb3471d29db066/c.html).

Impact: The packet converts unresolved status into active provincial authority and assigns `high` confidence.

Correction packet: end the Xinjiang office interval on 1 July; separate Politburo membership from provincial command; represent the promised future appointment as unresolved; remove provincial authority from the bookmark unless a prebookmark appointment source exists.

Acceptance: no rule can route Xinjiang decisions through Ma at the bookmark without dated supporting evidence.

### B05 United States national security coordination is materially incomplete

Affected records: `actor_usa_marco_rubio`, `claim_usa_actor_rubio_role`, `institution_usa_executive_branch`, `bookmark_state_usa_2025_09_01`, and the missing National Security Council institution.

Evidence: Rubio is recorded only as Secretary of State. President Trump named him interim National Security Advisor on 1 May 2025, and the dual role remained central to the 1 September decision architecture. [Reuters, 1 May 2025](https://www.reuters.com/world/us/white-house-national-security-adviser-waltz-leave-post-source-says-2025-05-01/) and [Reuters, 23 May 2025](https://www.reuters.com/world/us/white-house-national-security-council-hit-by-more-firings-sources-say-2025-05-23/).

Impact: Foreign policy advice, National Security Council coordination, and presidential access are incorrectly split or absent.

Correction packet: add Rubio's acting National Security Advisor office with an effective interval; add the National Security Council and its chair, advisor, and department relationships; add the May restructuring as an institutional modifier; distinguish statutory departmental authority from advisory influence.

Acceptance: an opening national security decision resolves Rubio's two offices and the NSC coordination path without inventing an unrecorded advisor.

### B06 Foundation source registration is broken for all Tier A politics profiles

Affected records: `countries/usa/profile.json`, `countries/chn/profile.json`, `countries/twn/profile.json`, `sources/sources.ndjson`, `bookmarks/2025_09_01/sources.ndjson`, and `tools/validate_foundation.mjs`.

Evidence: The foundation validator constructs its accepted source namespace only from the global and bookmark NDJSON registries. Tier A profiles cite local politics registry identifiers that are absent from both accepted registries. It reports exactly 53 unresolved identifiers.

United States, 19 missing registrations: `src_usa_white_house_administration`, `src_usa_white_house_cabinet`, `src_usa_rubio_swearing_2025`, `src_usa_hegseth_swearing_2025`, `src_usa_white_house_national_security_team`, `src_usa_white_house_wiles_2025`, `src_usa_white_house_miller_2025`, `src_usa_constitution_article_i`, `src_usa_constitution_article_ii`, `src_usa_constitution_amendment_xxv`, `src_usa_war_powers_resolution`, `src_usa_olc_presidential_force_1980`, `src_usa_senate_republican_leadership`, `src_usa_senate_democratic_leadership`, `src_usa_house_republican_leadership`, `src_usa_house_democratic_leader`, `src_usa_council_of_governors_2025`, `src_usa_nato_hague_2025`, `src_usa_taiwan_relations_act`.

China, 10 missing registrations: `src_chn_prc_constitution`, `src_chn_cpc_first_plenum_2022`, `src_chn_psc_2025`, `src_chn_state_council_institutions`, `src_chn_xi_triple_role_2025`, `src_chn_party_leadership_2022`, `src_chn_npc_2023_state_leaders`, `src_chn_cppcc_2025`, `src_chn_han_zheng_2025`, `src_chn_dprk_treaty_anniversary_2021`.

Taiwan, 24 missing registrations: `src_twn_president_authority`, `src_twn_vice_president_authority`, `src_twn_legislative_functions`, `src_twn_additional_articles`, `src_twn_central_government`, `src_twn_inauguration_2024`, `src_twn_cec_presidential_result_2024`, `src_twn_cho_2025`, `src_twn_cheng_2025`, `src_twn_resilience_committee`, `src_twn_inauguration_luncheon_2024`, `src_twn_dpp_congress_2025`, `src_twn_mnd_koo_2025`, `src_twn_legislative_leadership_2025`, `src_twn_kmt_chu_2025`, `src_twn_kmt_fu_2025`, `src_twn_tpp_caucus_2025`, `src_twn_tpp_huang_chair_2025`, `src_twn_taichung_lu`, `src_twn_new_taipei_hou`, `src_twn_taipei_chiang`, `src_twn_dpp_local_leaders`, `src_twn_kaohsiung_chen_2025`, `src_twn_us_taiwan_relations_act`.

Impact: A profile can pass the Tier A structure validator while failing the repository's foundation contract. Downstream tooling has no canonical source record for any politics profile citation.

Correction packet: choose one canonical source namespace; either register all 53 local records in the accepted global or bookmark registry with preserved metadata, or change the foundation validator to load every Tier A evidence registry as a first class source namespace; enforce global identifier uniqueness and content equality when an identifier appears in more than one registry; add `validate_foundation.mjs` to the mandatory test command and continuous integration; remove the orphan `src_twn_dpp_local_leaders` rather than registering it unless it supports an accepted claim.

Acceptance: `validate_foundation.mjs` passes, every profile source resolves to exactly one canonical source record, and duplicate identifiers with divergent content fail validation.

## Major findings

### M01 Actor selection is count driven, not decision driven

Affected records: every `political_actors` roster and `validate_tier_a_structure.mjs`.

The validator rewards exactly twenty plausible people but does not require coverage of command, treasury, industry, intelligence, legislature, opposition, or succession roles. The United States includes three governors while omitting the acting National Security Advisor role, President pro tempore, Treasury, Commerce, and the Chairman of the Joint Chiefs. China includes provincial leaders while omitting the CMC.

Correction packet: replace the minimum actor count with required decision role coverage; document a selection rule; add influence, jurisdiction, alignment, relationships, and player decision hooks; keep background candidates outside the active bookmark roster.

### M02 Official and party sources are being used to imply practical influence

Affected records: all actor `relevance` fields, especially all China actors, plus United States and Taiwan party actors.

China's ten sources are entirely PRC official or Xinhua. Official sources can establish formal title, but they cannot independently establish practical influence, faction, loyalty, purge risk, coalition behavior, or likely crisis response. Party biographies have the same limitation for United States and Taiwan party power.

Correction packet: constrain official evidence to de jure claims; add independent authoritative corroboration for practical influence; assign source class and independence group; lower confidence or mark unknown when practical claims have only self published evidence.

### M03 Mutable live pages lack temporal provenance

Affected records: live White House, cabinet, legislature, party, and government pages across all three packets.

The source model stores a publication date but no retrieval snapshot, content hash, valid interval, or archived copy. A live officeholder page can change after the bookmark while continuing to support a historical claim.

Correction packet: add `retrieved_at`, `content_hash`, `valid_from`, `valid_to`, and archival snapshot fields; prohibit mutable live pages as sole evidence for historical office state; validate source date against the bookmark.

### M04 United States succession is oversimplified

Affected records: `actor_usa_jd_vance`, `actor_usa_mike_johnson`, `actor_usa_marco_rubio`, `actor_usa_pete_hegseth`, `actor_usa_pam_bondi`, and `actor_usa_kristi_noem`.

The packet labels statutory successors but cites only the Twenty Fifth Amendment for the Vice President. It omits the President pro tempore, 3 U.S.C. 19, eligibility, resignation, acting status, and possible supplantation. [Congressional Research Service R46450](https://www.congress.gov/crs-product/R46450).

Correction packet: add 3 U.S.C. 19 and an explicit ordered succession graph; add Chuck Grassley at the bookmark; encode eligibility and resignation conditions; distinguish becoming President under the Twenty Fifth Amendment from acting as President under statute.

### M05 United States war authority is not executable

Affected records: `claim_usa_war_powers_framework`, `claim_usa_executive_claims_limited_unilateral_force_authority`, and `contradiction_usa_war_authority_scope`.

The packet correctly admits ambiguity but collapses the War Powers Resolution into a boolean. It cannot produce consultation, 48 hour reporting, 60 day termination, 30 day withdrawal, appropriations, authorization, or claimed emergency conditions as player decisions.

Correction packet: decompose the statute into dated triggers and obligations; add authorization and appropriations pathways; preserve executive legal theories as claims, not settled law; bind every intervention option to support, legality, reporting, and deadline state.

### M06 China portfolios are inferred from 2022 membership lists

Affected records: `actor_chn_shi_taifeng`, `actor_chn_li_ganjie`, `actor_chn_ma_xingrui`, `actor_chn_chen_jining`, `actor_chn_yuan_jiajun`, and their role claims.

Politburo membership does not establish a 2025 functional portfolio. The packet adds organization, united front, ideology, and provincial relevance labels that the cited 2022 first plenum list does not prove.

Correction packet: create separate membership and current portfolio claims; add dated 2025 office sources; end changed portfolios; remove functional relevance labels that have no direct evidence.

### M07 Taiwan war authority remains a research question, not a game rule

Affected records: `claim_twn_president_declares_war`, `claim_twn_legislative_yuan_war_and_peace_bills`, Taiwan formal decision authority, and `coverage_disposition`.

The packet records two constitutional provisions but does not establish sequence, initiating instrument, emergency practice, budget dependency, or judicial and legislative remedies. Its own blocking question requests independent constitutional review, while the coverage disposition calls the packet usable.

Correction packet: keep separate legal and political gates; obtain a constitutional workflow review; encode unresolved branches rather than choosing a binary permission; downgrade opening usability until the workflow is accepted.

### M08 Validators cannot detect semantic falsehood

Affected file: `validate_tier_a_structure.mjs`.

The validator checks identifiers, counts, references, and roster inclusion. It does not check that a claim subject exists, that every active actor has a dated role claim, that a claim matches the actor office, that a cited source supports the locator, that effective dates contain the bookmark, that source classes are independent, or that high confidence requires adequate corroboration.

Correction packet: add referential validation for every subject; temporal interval checks; actor office to claim consistency; source locator presence; independent source family rules for practical claims; and targeted regression fixtures for B01 through B05.

### M09 Bookmark acceptance states contradict each other

Affected records: all three `bookmark_state.json` files, all three `research_manifest.json` files, and the validator.

Each bookmark says `passed_for_politics_lane`, while each manifest says `bookmark_firewall_passed: false`. The validator requires the bookmark actor set to equal the full research roster, which conflates researched candidates with actors active in opening player knowledge.

Correction packet: define one authoritative firewall state; fail on conflicting states; split `researched_actor_ids`, `active_actor_ids`, and `player_known_actor_ids`; require dated evidence for the latter two; prevent postbookmark retrospective evidence from changing player knowledge.

## Minor findings

### N01 Taiwan coverage date is stale

Affected record: `lane_coverage_twn_2025_09_01`.

`newest_source_date` is `2025-06-28`, while the evidence registry contains sources dated through `2025-08-01` even before the required B01 correction.

Correction packet: derive oldest and newest dates from referenced sources and validate both.

### N02 Taiwan blocking question is stale

Affected record: `lane_coverage_twn_2025_09_01.blocking_questions`.

It asks for corroboration of two medium confidence actor claims, but all actor claims are now marked high confidence.

Correction packet: generate open questions from current claim state or require a reviewed manual update whenever confidence changes.

### N03 An unused Taiwan source remains counted

Affected record: `src_twn_dpp_local_leaders` and Taiwan source counts.

The source is retained without supporting a claim or record, inflating apparent coverage.

Correction packet: link it to an atomic supported claim or remove it from accepted source counts; warn on orphan sources.

## Correction order and acceptance gate

1. Repair the canonical source namespace in B06 before accepting any further politics changes.
2. Correct B01, B04, and B05 before any simulation consumes the bookmark.
3. Build the seat ledger in B02 and the command graph in B03.
4. Add temporal provenance and semantic validator rules from M03 and M08.
5. Resolve or explicitly gate the legal workflows in M04, M05, and M07.
6. Rerun the complete validation suite plus regression fixtures for every blocker.
7. Obtain a second independent audit of the corrected packet.

No country politics lane should advance beyond `needs_review`, and no `coverage_disposition` should contain `usable_for_opening_state`, until all six blockers are closed. This audit does not verify the remaining content.
