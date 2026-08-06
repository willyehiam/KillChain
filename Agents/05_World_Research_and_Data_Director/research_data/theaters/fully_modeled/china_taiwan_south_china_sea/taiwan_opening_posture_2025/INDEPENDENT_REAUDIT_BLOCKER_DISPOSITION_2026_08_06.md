# Taiwan opening posture independent reaudit: blocker disposition

Audit date: 2026-08-06

Scope: corrected `taiwan_opening_posture_2025` research packet on current main. The audited packet records were not edited.

## Disposition

**The two prior technical blockers are closed after independent verification and auditor-side guard hardening. The packet itself remains intentionally blocked from simulation release.**

`manifest.json` correctly keeps `opening_truth: false`, `simulation_readiness: blocked_research_only`, two unresolved blockers, and four unmet release conditions. Closing the technical defects does not authorize promotion.

## Prior blocker 1: contaminated September 1 evidence

Disposition: **CLOSED**

Evidence:

1. All 20 sources have `published_at` and `available_at` no later than `2025-09-01T00:00:00Z`.
2. The final daily activity source, `op_src_twn_august31_2025_activity`, was published on 2025-08-31, is recorded available at `2025-08-31T15:59:59Z`, and covers observations ending on 2025-08-30. It does not depend on a September 1 publication.
3. `op_claim_opening_snapshot` depends only on that safely available source.
4. Every claim source resolves. Every posture and lineage claim resolves. Every posture source resolves. Every contradiction side resolves to a claim.
5. No source, claim, posture record, lineage event, contradiction, or trigger contains the later Justice Mission reference.
6. The later trajectory is present only in the dedicated future-reference firewall and explanatory README, with `may_inform_opening_truth: false` and explicit prohibitions on opening activity, force counts, readiness, and trigger state.
7. The validator checks publication, availability, update, source-availability, and observation dates independently. It also checks the frozen claim-snapshot hash and rejects future-reference text in source metadata even if the hash is recomputed.
8. The auditor extended the guard from the first excluded trajectory to every trajectory, preventing a second future entry from silently reopening the firewall.

Conclusion:

No contaminated September 1 evidence or transitive dependency remains. Unresolved opening force disposition, readiness, access, and theater availability remain explicit unknowns rather than inherited from later events.

## Prior blocker 2: semantic corruption and force-reference leakage

Disposition: **CLOSED AFTER GUARD HARDENING**

The eight named corruption cases are now enumerated and counted from actual successful rejections rather than a hard-coded total:

1. future event hidden in source metadata;
2. post-bookmark publication concealed by an earlier availability date;
3. cross-actor force substitution;
4. readiness or deployment assertion smuggled through prose;
5. automatic allied permission smuggled through prose;
6. deterministic trigger smuggled through prose;
7. a forbidden consumer also inserted into the allowed list;
8. an empty contradiction side.

The negative suite independently rejects all eight.

The current packet contains 33 force-reference occurrences covering 24 unique canonical organization identities. A production-ledger validation resolves them against 68 current canonical organization IDs. Every force reference is restricted to one of three identity-only semantics:

1. `organization_identity_only`;
2. `context_identity_not_observed_participant`;
3. `historical_organization_identity_only`.

For every reference:

1. deployment is `unknown`;
2. readiness is `unknown`;
3. theater availability is `unknown`;
4. access is either `unknown` or `not_applicable`, never granted;
5. the exact four non-inference disclaimers are required;
6. no additional state-bearing field is allowed.

The auditor proved three baseline guard gaps before closing them: arbitrary nonempty reference semantics, arbitrary access values, and unrecognized extra fields could previously pass. New negative fixtures reject forged deployment semantics, invented access permission, smuggled state fields, contradictory disclaimers, and a second future trajectory that reopens the firewall.

## Continuous-integration proof

`npm test` invokes `test:opening-posture-firewall` before typecheck, simulation tests, and build. That script now:

1. validates the production packet against actual country force ledgers rather than fixture IDs;
2. runs 25 adversarial packet mutations, including the eight enumerated semantic corruptions;
3. runs the repository consumer guard with its own failing self-test.

The consumer guard scans executable source outside the research packet and approved audit area for direct references to `taiwan_opening_posture_2025`. Any such consumer causes the test command to fail. Current violations: zero.

## Release gate

This audit closes the two technical correction blockers only. It is not itself a promotion decision. The following manifest gates remain unmet and must be closed by explicit reviewed acceptance records, not inferred from a passing test:

1. `independent_reaudit`: an independent acceptance owner must record acceptance of this reaudit and its scope. Publication of the reaudit does not self-approve it.
2. `all_blocking_findings_closed`: the acceptance record must map both former blockers to the corrected evidence, guards, negative fixtures, and passing production-ledger result. The manifest's `unresolved_blocker_count: 2` remains authoritative until that review is recorded.
3. `scenario_design_approval`: an authorized design review must approve the intended opening-state interpretation, observer/public-report boundary, and explicit unknowns. A research packet cannot choose canonical simulation truth by itself.
4. `contradiction_adjudication_policy`: an executable reviewed policy must define how unresolved and parallel actor claims are preserved, selected, or exposed to scenario initialization. No current contradiction resolution may silently become omniscient truth.

Until all four gates are evidenced and the manifest is separately revised and reviewed, keep `opening_truth: false`, `simulation_readiness: blocked_research_only`, and every forbidden consumer blocked.

## Full-suite result

The final post-hardening `npm test` run passed in full:

1. research foundation validation;
2. production opening-posture validation against 68 canonical ledger organizations;
3. 25 adversarial opening-posture mutations, including all eight named semantic corruptions;
4. repository consumer guard and its negative self-test;
5. Tier A authority validation and 20 authority adversarial regressions;
6. politics regressions;
7. TypeScript typecheck;
8. 43 deterministic simulation tests;
9. production application build; and
10. rendered-HTML validation.

The production packet resolved 33 force-reference occurrences covering 24 unique organization identities, with zero unresolved references and zero forbidden consumers. These are integrity results, not evidence of deployment, readiness, access, theater availability, or simulation acceptance.
