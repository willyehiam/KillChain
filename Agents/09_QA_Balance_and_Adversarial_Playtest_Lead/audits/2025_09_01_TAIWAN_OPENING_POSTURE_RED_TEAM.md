# Taiwan opening posture red team

## Audit target and disposition

Audited current `main` through `58e7ef0`, covering 21 sources, 20 atomic claims, 8 posture records, 5 exercise lineage records, 8 crisis trigger hypotheses, 5 contradiction records, 33 force-reference occurrences representing 24 unique canonical organizations, and the local validation and status firewall.

**Disposition: blocked.** The packet is suitable only as an unaccepted research draft. It must not initialize the simulation, country AI, balance, missions, tutorials, or opening narrative. The declared status says the same thing, but the repository does not yet enforce that declaration outside the packet.

Severity count: **2 blocking, 12 major, 4 minor**.

The public aggregate safety boundary is respected. I found no exact mobile positions, coordinates, routes, named platforms, vulnerable component detail, target sequence, or attack guidance. The structured readiness values also avoid a direct claim that any referenced formation is combat ready. Those are real strengths, but they do not cure the temporal and semantic defects below.

## Independent evidence checks

1. Taiwan's official September 1 page is explicitly dated `2025.09.01` and says the reporting interval ran from 06:00 August 31 to 06:00 September 1, UTC+8. The packet instead records `published_at: 2025-08-31` and `available_at: 2025-08-31T22:00:00Z`, exactly the observation-window endpoint. The source does not establish publication at that endpoint. [Taiwan Ministry of National Defense, September 1 activity report](https://www.mnd.gov.tw/en/Publication/84847).
2. The safely prebookmark August 31 page is dated August 31 and reports the preceding 24-hour interval. It is a defensible last-known public snapshot if no exact pre-00:00Z release evidence can be produced for the September 1 page. [Taiwan Ministry of National Defense, August 31 activity report](https://www.mnd.gov.tw/en/news/plaact/84845).
3. Taiwan's April 3 report supports 59 aircraft sorties, 23 PLAN ships, and 8 official ships as reporting-window observations. It does not identify unique platforms or place those anonymous vessels under a packet-specific command node. [Taiwan Ministry of National Defense, April 3 activity report](https://www.mnd.gov.tw/en/Publication/84237).
4. Taiwan's Han Kuang planning release supports gray-zone transition, mobilization, decentralized authority, force protection, logistics, and civil-military exercise subjects. It describes exercises and intended validation, not accepted opening readiness. [Taiwan Ministry of National Defense, Han Kuang 41 planning material](https://www.mnd.gov.tw/en/Publication/84323).
5. The Taiwan Relations Act supports defensive assistance, capacity to resist coercion, and a President-and-Congress decision in response to danger. It does not support a direct treaty-style automatic combat-entry rule, and it does not by itself evidence the packet's INDOPACOM or Department of Defense force references. [United States Congress, Taiwan Relations Act](https://www.congress.gov/bill/96th-congress/house-bill/2479).
6. The cited EDCA release supports named access sites, infrastructure investment, interoperability, and continuing consultation. It does not define mission-by-mission permission or automatically resolve Philippine authorization for a Taiwan contingency. [United States Department of Defense, EDCA sites release](https://www.defense.gov/News/Releases/Release/Article/3349257/philippines-us-announce-locations-of-four-new-edca-sites/).

## Blocking findings

### B01 The opening snapshot crosses the bookmark firewall

Affected IDs: `op_src_twn_september1_2025_activity`, `op_claim_late_august_variation`, `op_claim_opening_snapshot`, `op_claim_taiwan_response_pattern`, `op_claim_force_disposition_unknown`, `op_posture_opening_activity`, `op_posture_twn_response_pool`, `op_contradiction_activity_inventory`.

The packet turns the end of the observation interval into the source's availability time and rewrites the official page's September 1 publication date to August 31. Observability is not publication. At the bookmark, the activity may have occurred while the complete official report was not yet public. The record therefore cannot be called the final complete prebookmark report without exact release evidence.

Correction packet:

1. Remove this source and every dependent opening claim from the September 1 00:00Z truth set, or move the bookmark after a verified publication timestamp.
2. Use the August 31 report as the last unquestionably available daily snapshot until an archived September 1 release timestamp is accepted.
3. Add separate `observation_started_at`, `observation_ended_at`, `source_published_at`, `source_available_at`, and `first_archived_at` fields.
4. Require source evidence for availability, not a researcher-assigned timestamp.
5. Add a regression fixture where observation ends before the bookmark but publication occurs after it.

### B02 The validator and status firewall are local metadata theater

Affected files: `validate_opening_posture.mjs`, `test_opening_posture.mjs`, `manifest.json`, repository `package.json`.

`npm test` does not execute either opening-posture validator. No repository-wide consumer test enforces `forbidden_consumers`. The local validator accepts eight mechanically demonstrated corruptions: a future event hidden in source metadata, postbookmark publication hidden behind an earlier `available_at`, cross-actor force substitution, readiness asserted in prose, automatic allied permission asserted in prose, a deterministic trigger asserted in prose, the same consumer listed as both allowed and forbidden, and an empty contradiction side already present in production.

Evidence: `2025_09_01_TAIWAN_OPENING_POSTURE_VALIDATOR_GAPS.mjs` reproduces all eight accepted corruptions without modifying the audited records.

Correction packet:

1. Add the clean validator and negative suite to the mandatory research foundation and `npm test` path.
2. Validate every temporal field, forbidden future language in sources as well as claims, and mutual exclusion of allowed and forbidden consumers.
3. Add semantic schemas for evidence-bearing force references, access decisions, readiness assertions, triggers, and contradiction sides rather than attempting to police free prose.
4. Add a repository-wide import audit that fails if a forbidden consumer imports a blocked packet.
5. Replace free-text release conditions with required approval records and unresolved-blocker counts.

## Major findings

### M01 All 24 force references prove existence, not relevance

All 24 unique identifiers resolve to the three canonical ledgers, but none of the 33 occurrences carries relationship-level evidence explaining why the cited source supports that organization in that posture record. The validator permits a PRC political record to reference `organization_usa_transportation_command` because it checks only global existence.

Affected IDs: all `force_refs` in `posture_records.json` and `exercise_lineage.json`.

Correction packet: replace string references with objects containing `organization_id`, `reference_semantics`, `claim_ids`, `relationship_ids`, `knowledge_state`, `does_not_imply`, and an actor-country consistency rule. Distinguish policy authority, command relevance, observed participation, available pool, and deployed force.

### M02 Anonymous observations are mapped to unsupported command identities

`op_posture_opening_activity` maps anonymous PLAN ships to Eastern Theater Command and one ambiguous `official ship` to the China Coast Guard. The Taiwan report establishes activity categories, not command assignment or the official ship's organization. The same problem affects the April activity lineage.

Correction packet: preserve observed categories as anonymous actor-reported tracks. Link a command or Coast Guard organization only when the source identifies it or when a separately sourced inference is recorded with uncertainty and alternatives.

### M03 Actor reporting is promoted into deterministic opening truth

The manifest requires `opening_truth: true`, while the decisive activity data are Taiwan official reports and several geopolitical statements are actor claims or researcher-derived negative inferences. A genuine fog-of-war simulation needs truth, actor belief, public report, and designer hypothesis to remain separate.

Affected IDs: `op_claim_opening_snapshot`, all `official_claim` posture inputs, and `manifest.opening_truth`.

Correction packet: create truth-state, observer-state, and public-report layers. The September activity report belongs to Taiwan's public intelligence picture, with reporting confidence and latency, not automatically to omniscient world truth.

### M04 Political objectives are asymmetric and incomplete

The PRC receives a political-objective record. Taiwan receives command and response records. The United States receives a policy shorthand. Japan and the Philippines are collapsed into the synthetic actor `regional_partners`. No Taiwan objective set, United States decision coalition, Japanese sovereign decision node, Philippine sovereign decision node, or domestic authorization state is represented.

Correction packet: add actor-specific objective hypotheses, red lines, domestic decision authorities, uncertainty, and alternative objectives for China, Taiwan, the United States, Japan, and the Philippines. Do not merge sovereign actors into a regional bucket.

### M05 Allied access is described correctly in prose but cannot make a decision

`op_posture_allied_access` says access is not automatic, but it contains only United States force references and a generic `conditional` readiness value. There is no host-nation authority, mission class, consultation state, escalation band, duration, revocation, or base-specific permission object. The cited EDCA release stresses continued consultation, which is not an executable permission model.

Correction packet: use bilateral access-decision records with host actor, requesting actor, mission category, location class, legal basis, approval state, decision authority, political cost, latency, expiration, and revocation. Default every unapproved mission to denied, not available.

### M06 Source freezing is self-referential rather than evidentiary

Every `artifact_sha256` hashes a researcher-authored string made from source ID, title, publisher, and locator. It does not hash archived source bytes or an accepted excerpt. A researcher can rewrite the evidence label and recompute the hash, as the adversarial fixture demonstrates. Several `relevant_locator` values are broad descriptions rather than page, article, section, or paragraph locators.

Affected IDs: all 21 source records.

Correction packet: store an archived artifact or immutable snapshot URI, byte hash, MIME type, retrieval timestamp, precise locator, excerpt hash, and source-to-claim mapping. Treat inaccessible official pages as unresolved until an archive is captured.

### M07 Exercise lineage dates exceed what the atomic claims prove

Lineage records hard-code start and end dates, but the validator merely checks that the end is before the bookmark. It does not require the claim or source to establish both boundaries, start before end, or non-overlap. For example, the cited August 3, 2022 release does not by itself prove the packet's August 10 end date.

Affected IDs: all five `op_lineage_*` records.

Correction packet: add separate boundary claims and sources, uncertainty for open-ended exercises, observed versus declared end, and validator rules for interval ordering and claim coverage.

### M08 The contradiction register mostly contains category lessons, not contradictions

`op_contradiction_activity_inventory` and `op_contradiction_exercise_readiness` are compatible category distinctions. `op_contradiction_commitment_entry` is explicitly resolved as two truths at different layers. `op_contradiction_access_permission` has an empty mission-permission side. Every record is pre-resolved, so none can drive uncertainty or adjudication.

Affected IDs: all five `op_contradiction_*` records, especially `op_contradiction_access_permission`.

Correction packet: require at least two nonempty, mutually inconsistent propositions about the same predicate, evidence on every side, adjudication status, favored interpretation, confidence, information needed to resolve it, and simulation treatment while unresolved. Move category lessons into modeling rules.

### M09 Crisis triggers are decorative and ready to become rails

All eight triggers have unknown probability, identical effects, no actor, no evidence, no observables, no threshold, no falsifier, no competing explanation, no cooldown, no reversibility, and no cost. They are disabled today, but enabling them would create authored plot switches rather than adaptive crisis dynamics.

Affected IDs: all eight `op_trigger_*` records.

Correction packet: model triggers as hypotheses over observable state with actor-specific perception, threshold bands, false-positive risk, prerequisites, alternatives, reversible escalation, decision options, and no guaranteed historical outcome.

### M10 Official source balance does not establish independent truth

Exercise capabilities are primarily described by PRC official exercise releases; response and activity are described by Taiwan official releases; access is described by alliance-party releases. Evidence states correctly say `official_claim` in many places, but confidence is uniformly high and no independent or adversarial source is attached to the same predicates.

Correction packet: keep official-claim confidence separate from factual confidence, add independent authoritative corroboration where available, represent actor incentives, and prevent one actor's exercise language from becoming capability or success probability.

### M11 The United States decision chain omits Congress while citing a law that requires it

The Taiwan Relations Act says the President and Congress determine appropriate action in response to danger. The posture references the President, Department of Defense, and INDOPACOM, but not Congress, and inherits the force-ledger problem of using the Department rather than the operational Secretary of Defense node.

Affected IDs: `op_posture_usa_policy`, `op_claim_us_policy_commitment`, `op_claim_us_no_automatic_entry`.

Correction packet: represent President, Congress, Secretary of State, Secretary of Defense, and combatant command as distinct political, policy, and operational stages. The law supports a decision process, not an already available strike chain.

### M12 Readiness and political permission share one overloaded field

`op_posture_allied_access.readiness: conditional` encodes political access using a force-readiness vocabulary. A consumer can interpret it as conditional force availability. Other records use the same field for `unknown`, `not_assessed`, and `not_inferred`, mixing epistemic status with physical readiness.

Correction packet: separate `readiness_assessment`, `evidence_status`, `access_permission`, and `inference_prohibition` into typed fields. Remove readiness from policy-only records.

## Minor findings

### N01 The README's future-reference statement is literally false

It says Justice Mission 2025 is named only in the dedicated firewall, but the name also appears in the README, validator, and test. The opening data records do not otherwise contain it, so this is documentation imprecision rather than a data leak.

### N02 The validator reports the wrong force-reference count

Production output calls all 62 organization IDs loaded from the three ledgers `canonical_force_refs`. The packet actually contains 33 occurrences and 24 unique references. Report all three measures explicitly.

### N03 The manifest omits force-reference coverage

The manifest records sources, claims, postures, lineage, triggers, contradictions, and exceptions, but neither 33 reference occurrences nor 24 unique references. Add reconciliation counts and country breakdowns.

### N04 `published_at` conflates underlying event date and cited artifact date

The Anti-Secession Law record uses the law's 2005 date although the cited court webpage URL is dated 2016. Similar law and treaty records need separate instrument-effective, cited-artifact-published, and first-known dates.

## Force-reference reconciliation result

All 24 unique references exist in the canonical ledgers. There are no unresolved IDs and no exact deployment coordinates. This is a referential-integrity pass only.

1. China, 11 unique: CMC; CMC Joint Staff Department; Eastern Theater Command; Army; Navy; Air Force; Rocket Force; Information Support Force; Joint Logistic Support Force; China Coast Guard; militia.
2. Taiwan, 9 unique: President as commander in chief; Ministry of National Defense; General Staff Headquarters; Army, Navy, and Air Force command headquarters; Coast Guard Administration; All-out Defense Mobilization Agency; Reserve Command.
3. United States, 4 unique: President as commander in chief; Department of Defense; Indo-Pacific Command; Transportation Command.

No structured readiness claim accompanies 23 of the unique organizations beyond `unknown`, `not_assessed`, or `not_inferred`; the allied-access record uses the ambiguous value `conditional`. The packet does not support present deployment or availability for any of the 24.

## Validation evidence

The following passed at the audited head:

1. `validate_opening_posture.mjs`
2. `test_opening_posture.mjs`, 12 negative cases
3. fixture-mode opening posture validation, 24 unique force IDs
4. repository `npm test`, including foundation validation, type checking, 43 deterministic simulation tests, production build, and rendered HTML
5. all standalone research, force-ledger, regional-system, and corpus-integrity validators

The new adversarial audit test also passes by proving eight invalid semantic states are accepted by the current validator. A passing local validator therefore does not establish bookmark fidelity, evidence integrity, force relevance, political authorization, or scenario neutrality.

## Integration recommendation

Keep `simulation_readiness` blocked. Do not satisfy the Agent 09 release condition merely because this review exists. Promotion requires B01 and B02 corrections, revalidation of every source availability timestamp, per-reference evidence semantics, sovereign allied-access decisions, observer-specific knowledge, and unresolved contradiction treatment. The correction should be a new reviewed packet revision, not a silent edit to this audited checkpoint.
