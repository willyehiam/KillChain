# United States national force inventory independent re-audit

Audit date: 2026-08-06  
Audited correction: `ec0206a`  
Verified on current remote `main`: `c25bd2d405006f80eefed3086eea753f9ea790fc`

The audited United States force records were not edited. The re-audit ran the packet validator, all 16 mandatory fixtures, seven additional isolated semantic-corruption probes, and the full repository suite.

## Blocker disposition

### B01 — Navy pseudo-range: closed in the records

The 287 request and 296 prior actual are separate retrospective claims from the post-bookmark CRS report. The opening Navy battle-force pool is unknown. Its provenance does not cite the post-bookmark report, and both claims say they are unavailable to the player and are not bounds. The mandatory pseudo-range and post-bookmark-source fixtures are rejected.

### B02 — 4,832 Air Force estimate: closed in the records

The parent and six mission-category pools are all-component unknowns. The 4,832 and category figures remain dated claims; their arithmetic reconciles without becoming opening quantities. Tanker and airlift subsets remain unknown. The parent-claim, category-claim, structural-parent, and component-mismatch probes are rejected.

### B03 — Reserve and Guard authority: closed in the records; validator hardening still required under B07

Sections 12301, 12302, 12304, and 12406 now carry distinct conditional activation routes. Sections 10101 and 12401 no longer manufacture activation. State and federal edges are conditional, and the research state machine records state active duty, Title 32, and Title 10 as mutually exclusive per conserved child allocation. Existing authority fixtures pass.

However, an isolated copy with all three `forbidden_combinations` replaced by the same duplicated pair passed validation. The validator checks only array length, not exact unordered set membership.

### B04 — annual training plan: closed in the records; validator hardening still required under B07

The 22-rotation target exists only in `training_plans.json`; completed, scheduled, remaining, canceled, and available quantities are unknown, and the plan is nonexecutable. It is absent from inventory, deployment, maintenance, and conservation. The mandatory promotion fixture is rejected.

An isolated copy could nevertheless promote another planned capacity into an exact generic national inventory pool while updating deployment, conservation, and manifest counts. The validator accepted it because exact/range opening quantities are not governed by a structured acceptance allowlist.

### B05 — mutable live sources: closed in the records; validator hardening still required under B07

The two live Defense Department discovery pages are quarantined, unavailable at the bookmark, and unused by opening organizations, relationships, equipment, or inventory. The mandatory restored-interval fixture is rejected.

An isolated copy that reclassified one known live source to `unknown`, marked it prebookmark-available, and supplied a fabricated prebookmark date passed. Known mutable identities are not protected against semantic reclassification.

### B06 — expired-state accounting: closed for the current records; validator hardening still required under B07

All current inventory, deployment, and maintenance review dates are 6 November 2026, and the computed manifest count of zero is correct at the audit time. The mandatory expired-inventory fixture is rejected.

An isolated copy with an expired conservation record still passed because the summary computation only scans inventory, deployments, and maintenance rather than every temporally governed packet dataset.

### B07 — semantic validator coverage: blocking

All 16 mandatory fixtures pass, but six of seven additional isolated corruptions were accepted:

| Probe | Result |
| --- | --- |
| generic range promoted into a reconciled national pool | accepted incorrectly |
| Air Force all-component pool changed to active component | rejected correctly |
| Guard forbidden-pair list replaced with three copies of one pair | accepted incorrectly |
| planned capacity promoted to exact opening inventory | accepted incorrectly |
| known live source reclassified and marked prebookmark | accepted incorrectly |
| expired conservation omitted from manifest expiration count | accepted incorrectly |
| post-bookmark personnel claim admitted by the prose token `Historical` | accepted incorrectly |

The last probe is especially important: cutoff eligibility is inferred from a case-sensitive prose regular expression. The corrupted post-bookmark claim still satisfied the exact authorized-personnel assertion.

The packet must remain `internally_consistent: false`. B07 is not closed.

## Exact correction packet

1. Add a structured opening-quantity evidence contract. Every exact or range inventory must cite an accepted, prebookmark, scope-compatible custody or point-observation claim. For this packet, reject all exact/range inventory unless its ID is explicitly accepted by that contract; do not infer eligibility from matching deployment and conservation arithmetic.
2. Validate the Guard exclusion graph as the exact unordered set `{state_active_duty,title_32}`, `{state_active_duty,title_10}`, and `{title_32,title_10}` with no duplicates. Validate transition state references and authority-source closure as well.
3. Separate plan state from opening inventory mechanically. A construction or training plan may enter inventory only through a structured delivered-and-accepted event backed by a prebookmark claim; matching words in a predicate are insufficient.
4. Protect known live source identities from reclassification. Validate their required mutability, quarantine, player-availability, snapshot/hash, and temporal-proof tuple; a fabricated date cannot convert a live page into an immutable artifact.
5. Compute expiration across organizations, relationships, equipment, inventory, deployment, maintenance, construction, conservation, claims, contradictions, training plans, and the Guard state machine, or rename the manifest field to its narrower actual scope.
6. Replace the `Historical|unavailable|Contradiction` prose regex with structured claim fields for bookmark eligibility, player availability, retrospective-only use, and allowed dependency classes. No post-bookmark claim may support an opening assertion.
7. Add the six accepted corruptions above as mandatory fixtures and rerun this independent audit.

## Remaining release gates

Even after B07 is fixed, this packet must remain non-decision-usable and non-simulation-ready until mutually exclusive Army, Marine Corps, Space Force, and Coast Guard equipment totals are reconciled; tanker and airlift allocations are resolved; readiness, maintenance allocation, and support availability are established; and every mission draws only from conserved child allocations with lawful authority and support dependencies.

## Verification

- United States packet validator: PASS on the unmodified packet.
- United States mandatory fixtures: PASS, 16 of 16 rejected.
- Additional re-audit probes: 1 of 7 rejected; 6 semantic bypasses accepted.
- Full `npm test` on exact remote SHA `c25bd2d405006f80eefed3086eea753f9ea790fc`: PASS, including research foundation, opening-posture firewall, 34 authority regressions, politics regressions, typecheck, 43 deterministic simulation tests, production build, and rendered HTML.

The green repository suite confirms regression stability. It does not override the B07 adversarial evidence.
