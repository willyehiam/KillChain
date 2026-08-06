# United States force inventory B07 validator correction

Date: 2026-08-06  
Scope: residual validator blocker B07 from the independent re-audit  
Packet: `force_ledger_usa_2025_09_01`  
Disposition: corrected; independent re-audit required

## Correction boundary

This checkpoint changes validation contracts and adversarial coverage. It does not promote any unresolved estimate into opening truth, add a force position, or make the collecting packet executable. The acceptance flags remain false.

The correction adds structured contracts for:

- exact or range opening inventory evidence;
- the two known mutable live Department of Defense pages;
- every local claim's bookmark availability and allowed dependency class;
- complete temporal-governance reconciliation across organizations, relationships, equipment, inventory, deployments, maintenance, construction, conservation, claims, contradictions, training plans, and the Guard state machine.

Guard duty status now requires the exact three unordered exclusion pairs, with no missing or duplicated pair. The builder is idempotent for the Space Command classification note.

## Mandatory residual probes

All seven semantic corruptions are rejected by the production validator:

1. generic unsupported range promoted into opening inventory;
2. all-component Air Force estimate relabeled as active component;
3. duplicated Guard forbidden pair hiding a missing exclusion;
4. annual training plan promoted into opening inventory;
5. known live mutable source reclassified as cutoff-safe;
6. expired conservation record omitted from the manifest summary;
7. postbookmark evidence disguised by prose containing `Historical`.

These probes join the prior sixteen mandatory USA force fixtures. The regression suite therefore contains 23 fixtures.

## Validation result

- production packet validation: PASS;
- USA force regression fixtures: PASS, 23 of 23;
- full repository test suite: PASS, including research schemas, all Tier A force ledgers, opening-posture firewall, political authority regressions, typecheck, 43 simulation tests, production build, and rendered HTML test.

## Release gate

The packet remains `collecting`, with `internally_consistent`, `research_complete`, `decision_usable`, and `simulation_ready` all false. An independent auditor must rerun the seven probes and confirm that the structured contracts cannot be bypassed before B07 is closed for release.
