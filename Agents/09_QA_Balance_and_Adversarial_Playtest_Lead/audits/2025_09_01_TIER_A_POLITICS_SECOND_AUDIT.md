# Tier A politics corrected packet second audit

Audit target: `main` commit `58e7ef025d1cf76a2566cb9a1b10c68582441ab9`

Truth date: `2025-09-01T00:00:00Z`

Scope: the corrected United States, China, and Taiwan politics packets, the six blockers in `2025_09_01_TIER_A_POLITICS_RED_TEAM.md`, the nine queued major findings, bookmark leakage, role intervals, source independence, succession, war authority, actor selection, acceptance states, and regression coverage.

## Verdict

All six previously reported blockers are closed in the data and now have executable regression coverage. No residual blocker was found in this second audit.

That is not a simulation-readiness finding. Eight major findings remain open and one is only partially corrected. The packet should remain `needs_review`; it is suitable as a corrected research baseline but not yet as an executable politics engine or a player-visible model of practical influence.

Current packet size is 69 sources, 105 claims, 64 active-roster actors, and three open contradiction sets.

## Prior blocker disposition

| ID | Disposition | Evidence |
| --- | --- | --- |
| B01 | Closed | Taiwan now closes Lin Yu-chang's interval on 28 July, opens Hsu Kuo-yung's interval on 25 August, and returns Hsu in the 1 September actor set. An adversarial substitution of Lin for Hsu is rejected. |
| B02 | Closed | The Taiwan ledger deterministically derives 52 KMT, 51 DPP, 8 TPP, and 2 independent seats from the certified 2024 allocation plus two zero-delta recall rounds. KMT plurality is explicitly distinct from KMT-TPP cooperation. A one-seat mutation is rejected. |
| B03 | Closed | China now contains the CMC, Joint Staff and Political Work command nodes; Zhang Youxia, He Weidong, Liu Zhenli, and Zhang Shengmin; Miao Hua's prebookmark suspension and removal; and explicit uncertainty for He and the Political Work Department. No postbookmark personnel announcement initializes the state. Removing the CMC is rejected. |
| B04 | Closed | Ma Xingrui's Xinjiang interval ends on 1 July. His opening office is restricted to Politburo membership and his promised future appointment remains unresolved. Restoring Xinjiang authority is rejected. |
| B05 | Closed | Rubio's Secretary of State and Acting National Security Advisor roles, the NSC institution, statutory membership, advisory committees, and May staff-capacity modifier are present. Removing the NSC is rejected. |
| B06 | Closed | The foundation validator loads all three local evidence registries into one canonical source namespace, rejects divergent duplicate identifiers, and runs under `npm test`. The foundation gate passes with 81 canonical sources. |

## Bookmark leakage findings

No explicitly dated accepted source is later than 1 September 2025. China treats He Weidong's status as unresolved from observable prebookmark absences and does not import the later official personnel disposition. This closes the concrete leakage risk in B03.

The general firewall remains incomplete under M03 and M08. Sixteen mutable live pages have no publication date, archive locator, retrieval hash, or valid interval. Their 2026 retrieval dates prove when they were fetched, not what their content said at the bookmark. The corrected validator now rejects an explicitly postbookmark source used by an opening claim, but it cannot prove historical content for an undated live page.

## Major finding disposition

### M01 Actor selection is count driven: open

The validator still enforces a numeric target rather than decision-role coverage. The United States retains three governors while omitting the President pro tempore, Treasury, Commerce, and the Chairman of the Joint Chiefs. China improved from 20 to 24 actors by adding command principals, but no common decision-role contract exists. `active_actor_ids` still means the full curated roster rather than the minimum set needed to resolve opening decisions.

Required correction: replace the actor-count target with country-specific required decision roles and keep optional electoral or provincial candidates in a separate researched roster.

### M02 Formal evidence is used for practical relevance: open

No source has an `independence_group` or `source_family`. Sixty-one of 64 actor records rely only on official, legal, or official statistical sources. Those sources can establish formal office, but actor `relevance` values still imply gatekeeping, influence, ideology, or command importance without independent corroboration.

Required correction: type each claim as de jure, observed behavior, or analytic inference; add source-family independence; and make practical influence unknown unless supported independently.

### M03 Mutable source provenance: open

Sixteen live sources lack a publication date, archive snapshot, content hash, and validity interval. The new explicit postdate regression closes only the easiest leakage path.

Required correction: snapshot mutable sources and require `retrieved_at`, `content_hash`, `valid_from`, `valid_to`, and an archive locator before they can be sole evidence for a historical opening claim.

### M04 United States succession: open

The model still stops after the Vice President and describes further succession only as “statutory.” It has no 3 U.S.C. 19 graph, President pro tempore, eligibility conditions, resignation conditions, or distinction between becoming President and acting as President.

Required correction: encode an ordered conditional succession graph and add Chuck Grassley at the bookmark.

### M05 United States war authority: open

The War Powers Resolution remains a boolean. Consultation, 48-hour reporting, 60-day termination, 30-day withdrawal, authorization, appropriations, and claimed emergency predicates are not executable states.

Required correction: represent the statutory and asserted executive pathways as timed state transitions with separate legality, political support, reporting, authorization, and funding gates.

### M06 China portfolios inferred from old membership: partially corrected, still open

Claim values for Shi Taifeng, Li Ganjie, Li Shulei, Chen Jining, Yuan Jiajun, and Ma Xingrui now state membership rather than invented 2025 portfolios, and Ma's stale provincial authority is corrected. Their actor-level `relevance` fields still assign organization, united-front, publicity, ideology, or provincial influence from 2022 roster evidence.

Required correction: source each current portfolio independently or reduce relevance to formal membership with practical influence unknown.

### M07 Taiwan war authority: open

The packet correctly states that presidential and Legislative Yuan authorities are separate legal and political gates, but it still has no executable sequence, emergency branch, initiating instrument, budget dependency, or accepted constitutional workflow.

Required correction: preserve disputed branches and commission a constitutional workflow review before exposing a binary war action.

### M08 Semantic validation: partially improved, still open

Blocker-specific assertions now cover Taiwan role expiry and seat reconciliation, China CMC and Ma status, United States NSC and Rubio status, canonical source collision, and explicit postbookmark evidence. However, the validator still does not require every active actor to have an atomic role claim, a role start date, source-family independence, or a declared subject entity.

Atomic temporal keys are now mandatory on every claim. Measured semantic gaps remain: five United States actors have no atomic role claim; 57 active role claims use an `as_of` snapshot but lack `effective_from`; six claim subjects are outside the active entity roster; and two opening claims cite sources omitted from their bookmark source lists.

Required correction: create researched, active, and player-known entity registries; require interval-bearing active-role claims; require bookmark claim-source closure; and add generic semantic fixtures rather than country-name assertions alone.

### M09 Acceptance-state contradiction: open

All three bookmarks say `passed_for_politics_lane`, while all three manifests say `political_actor_roster_reviewed: false`, `bookmark_firewall_passed: false`, and `independent_review_complete: false`. The actor lists also still conflate researched, active, and player-known actors.

Required correction: define one authoritative lane acceptance state and separate `researched_actor_ids`, `active_actor_ids`, and `player_known_actor_ids`. A lane cannot be passed while its roster and independent review are false.

## Minor finding disposition

1. N01 is closed. Taiwan's newest source date is now 29 August 2025 and agrees with the accepted registry.
2. N02 is closed. Taiwan's open questions now request review of real medium-confidence or workflow issues rather than stale actor confidence.
3. N03 is closed. `src_twn_dpp_local_leaders` was removed and no politics source is wholly orphaned across claims, institutions, actors, contradictions, and bookmark references.

## Added adversarial coverage

`test_tier_a_politics_regressions.mjs` creates isolated mutated corpora and proves rejection of all six prior blocker regressions plus explicit postbookmark evidence. It is mandatory under `npm test`.

The seven mutations are:

1. Restore an ended Taiwan party role to the opening roster.
2. Break the Taiwan seat reconciliation by one seat.
3. Remove the China CMC.
4. Restore Ma Xingrui's Xinjiang authority.
5. Remove the United States NSC.
6. Insert a divergent duplicate canonical source identifier.
7. Move a source supporting an opening claim past the bookmark.

## Acceptance decision

The blocker correction packet is accepted. The politics lane is not accepted for simulation consumption. It may advance only after M03, M04, M05, M07, M08, and M09 are closed; M01, M02, and M06 may remain explicit unknowns only if the game does not yet consume practical influence or actor-selection mechanics.
