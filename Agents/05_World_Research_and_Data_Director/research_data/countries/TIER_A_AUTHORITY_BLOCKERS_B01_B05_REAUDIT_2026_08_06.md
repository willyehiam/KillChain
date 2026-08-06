# Independent Tier A authority blockers B01–B05 re-audit

**Audit date:** 2026-08-06  
**Audited head:** `48172ff26b9919305e6923b216fb8a91e6e7c882`  
**Correction floor:** `6c484f5` or later  
**Scope:** United States and Taiwan structured war-authority workflows, their evidence registries, the shared authority validator, and all 34 authority regressions.  
**Independence rule:** no audited politics, authority, evidence, bookmark, coverage, or manifest record was edited.

## Blocker disposition

| Blocker | Disposition | Evidence |
|---|---|---|
| B01 — United States activation can be confused with later WPR obligations | **Closed** | The state-machine contract requires activation to precede post-activation obligations. Emergency and contested presidential-force routes record `forces_introduced_at`; the 48-hour report and regular consultation are post-activation obligations, not activation prerequisites. Later noncompliance records a statutory violation without retroactively converting the prior activation into non-activation. Regression A21 rejects moving the report gate into activation. |
| B02 — WPR clocks can lose anchors or become indefinite | **Closed** | The report clock is anchored to `event_usa_forces_introduced` and `forces_introduced_at`, with a 48-hour duration. The termination clock is anchored to the earlier of report submission or the time the report was required, with 60 days plus a separately conditioned maximum 30-day withdrawal extension. Unknown anchors preserve explicit conservative/permissive bounds and may not coerce to zero, false, or “no clock.” Regressions A22, A23, and A29 reject missing anchors, no-clock coercion, and impossible deadline ordering. |
| B03 — Taiwan emergency-decree ratification can be treated as a prerequisite or revive an expired decree | **Closed** | Issuance enters `provisionally_effective_pending_ratification` after the crisis, Executive Yuan Council, and presidential gates. Legislative ratification is a ten-day post-activation obligation anchored to issuance. Timely ratification produces `ratified_effective`; rejection, expiry, or late ratification produces `ceased_forthwith`. Event history is append-only so provisional consequences are preserved. Regressions A24 and A30–A34 cover prerequisite, pre-ratification, timely ratification, rejection, expiry, and late-ratification cases. |
| B04 — Taiwan immediate defense can execute indefinitely or from a self-created trigger | **Closed** | The route is `research_only_non_executable`; every candidate transition has `executable: false`. It requires an independently represented attack or operationally imminent threat that the presidency cannot create or adjudicate. Purpose is limited to the represented trigger, offensive expansion is rejected, null review time is not “no deadline,” formal-war transition is explicit, indefinite continuation is forbidden, and repeated activation requires a new independent trigger. Regressions A25 and A26 reject execution and presidential trigger manufacture. |
| B05 — mutable live pages can leak into opening truth | **Closed** | Live mutable sources in both evidence registries either need pre-bookmark archive proof or carry `quarantined_no_prebookmark_temporal_proof` with continuity inference forbidden. The validator rejects a live source without proof/quarantine, rejects quarantined sources in accepted opening claims, and scans workflows plus non-registry opening surfaces for exact source-id leakage. Regressions A27 and A28 exercise both bypasses. |

## Direct bypass attempts

The re-audit independently reran the mutation suite and confirmed rejection of:

1. a WPR report inserted retroactively as an activation prerequisite;
2. a timed termination gate with no executable anchor;
3. an unknown WPR anchor coerced into no clock;
4. impossible termination/withdrawal-extension ordering;
5. legislative ratification inserted into Taiwan decree activation;
6. pre-ratification non-effect;
7. rejection, expiry, or late ratification allowed to preserve/revive the decree;
8. an executable or indefinitely continuing immediate-defense route;
9. a presidency-created immediate-defense trigger;
10. a live mutable source with neither historical proof nor quarantine; and
11. a quarantined live source imported into opening truth.

## Test results

- `validate:tier-a-political-authority`: **PASS**, two countries, zero errors.
- `test:tier-a-political-authority-regressions`: **PASS**, A01–A34.
- Full `npm test` after this audit: **PASS** — research validation, opening-posture firewall, authority and politics regressions, typecheck, 43 simulation tests, production build, and rendered HTML validation.

## Remaining release gates

The five audited technical blockers are closed. That does **not** promote the political packets or settle unresolved law and fact. Release still requires:

1. independent legal review of the U.S. “hostilities” threshold, disputed Article II scope, operation-specific WPR clock facts, and the concurrent-resolution removal question;
2. independent constitutional review of Taiwan’s exact formal war sequence, immediate-defense-to-formal-war threshold, and martial-law timing;
3. research on Taiwan emergency budget continuity;
4. completion of non-politics country lanes, bookmark firewall review, and independent review recorded in each research manifest; and
5. an explicit human promotion decision after those reviews. Current `bookmark_firewall_passed`, `independent_review_complete`, and `politics_lane_authority_contract_reviewed` acceptance fields correctly remain false.

No remaining technical B01–B05 blocker was found. No audited record was modified, and this audit document alone must not change acceptance state.
