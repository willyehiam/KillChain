# United States force inventory residual B07 independent re-audit

Date: 2026-08-06  
Audited revision: `b529eb1d066eedbc309672718d927dbb2f5a52ee` (includes USA correction `0698a82f213019ca2051e70c1b289069e13b4e61`)  
Packet: `force_ledger_usa_2025_09_01`  
Audit boundary: validator and fixtures only; no audited United States force record was edited  
Disposition: **BLOCKING — B07 remains open**

## Executive result

The production packet validates and all 23 mandatory USA fixtures reject their specified single-file corruptions. The full repository suite also passes. Those green results do not close B07: an isolated adversarial copy can alter the mutable `validator_contracts.json` sidecar together with the ledger and make three formerly blocked semantic corruptions validate successfully.

The packet correctly remains `collecting`, `internally_consistent: false`, `research_complete: false`, `decision_usable: false`, and `simulation_ready: false`.

## Prior bypass disposition

| Probe | Independent result | Disposition |
| --- | --- | --- |
| generic unsupported range or exact quantity | rejected when the ledger alone is changed; accepted when the sidecar self-authorizes mismatched evidence | **blocking** |
| duplicate Guard exclusion pairs | rejected by the hard-coded canonical unordered set and duplicate check | closed |
| plan-to-inventory promotion | rejected when the plan claim remains typed `plan_only`; accepted when the sidecar relabels it and self-authorizes the pool | **blocking** |
| known live-source reclassification | rejected when only the source changes; accepted when the sidecar's required tuple changes with it | **blocking** |
| expired conservation omitted from summary | rejected by exact sidecar coverage plus the derived expiry count | closed for the named bypass |
| postbookmark claim disguised by prose tokens | rejected from structured publication time and bookmark-use state | closed for the named bypass |
| Air Force component mismatch | rejected by the hard-coded all-component parent and six-category rules | closed |

## Blocking evidence

All probes ran against isolated copies of the packet and preserved record counts. In the two quantity probes, inventory, deployment, conservation, and manifest count mirrors were reconciled so a secondary arithmetic error could not mask the semantic result.

### B07-R1 — opening quantity allowlist can authorize unrelated evidence

Mutation:

1. Change `inventory_usa_army_equipment_unresolved` from unknown to an exact quantity of 22 equipment items.
2. Reconcile its deployment, conservation identity, and manifest exact/unknown counts.
3. Add the pool to `opening_quantity_evidence.accepted_inventory_quantities`.
4. Relabel the Army authorized-personnel claim as an `accepted_custody_point_observation` in the sidecar and cite it as the quantity evidence.

Observed result: `validate_national_packet.mjs` exits zero with `status: PASS`.

Why this is corrupt: the cited claim concerns an authorized personnel ceiling of 442,300 persons, not 22 equipment items and not observed inventory custody. The validator checks sidecar eligibility labels but not claim subject, measurement kind, unit, value, observation semantics, or equality with the accepted inventory quantity.

### B07-R2 — plan classification can be rewritten by the same sidecar that consumes it

Mutation:

1. Promote the 22-rotation Army training plan into the same exact equipment pool and reconcile accounting mirrors.
2. Cite `claim_usa_army_ctc_rotations_22` from the inventory provenance.
3. Change that claim's sidecar dependency class from `plan_only` to `accepted_custody_point_observation` and mark it opening eligible.
4. Add a matching opening-quantity allowlist entry.

Observed result: `validate_national_packet.mjs` exits zero with `status: PASS`.

Why this is corrupt: the claim's subject remains a training throughput plan and its unit remains `capacity_unit`; neither can prove possessed equipment. The current guard trusts the mutable dependency label instead of validating typed claim semantics.

### B07-R3 — live-source quarantine policy can redefine its own required tuple

Mutation:

1. Reclassify `src_force_usa_dod_about` from `live_mutable` and quarantined to `static`, prebookmark available.
2. Add an unsupported prebookmark publication date and prose-only temporal assertion.
3. Change that source's `known_live_source_policies` entry so the required values now match the corruption and clear its forbidden-proof list.

Observed result: `validate_national_packet.mjs` exits zero with `status: PASS`.

Why this is corrupt: the validator hard-codes the two source identifiers, but it accepts the required mutability, quarantine, availability, and forbidden-proof values from the same mutable sidecar. The sidecar therefore acts as self-authorizing policy rather than a claim that is checked against canonical rules.

## Exact correction packet

1. Treat `validator_contracts.json` as data under validation, never as the root of policy authority. Hard-code or schema-pin the literal quarantine tuple for both known live source IDs: `live_mutable`, `quarantined_no_prebookmark_temporal_proof`, player unavailable, retrieval metadata present, explicit no-proof reason, and the canonical forbidden immutable-proof fields.
2. Give every USA claim typed semantics in the claim record or an independently pinned contract: `subject_kind`, `measurement_kind`, `unit`, `component_scope`, `population`, `observation_period`, `as_of_semantics`, `evidence_purpose`, and `opening_stock_eligible`.
3. For every accepted exact or range opening quantity, require a one-to-one evidence contract whose claim subject equals the inventory pool, whose unit and quantity equal the pool, whose measurement is a stock or custody observation, whose source is cutoff-safe, and whose observation directly covers the bookmark. A sidecar label alone must not satisfy any of these conditions.
4. Derive plan-only status from typed claim/source semantics. A construction, procurement, authorization, budget, or training plan may enter opening inventory only through a separate delivered-and-accepted custody claim; changing a sidecar dependency label must not convert a plan into inventory.
5. Add three mandatory compound regressions reproducing B07-R1 through B07-R3. Each fixture must mutate both the ledger/source and the sidecar, and each must be rejected by a stable semantic diagnostic.
6. Keep all acceptance gates false after correction. A separate independent rerun must pass the 23 existing fixtures, the three compound fixtures, the clean validator, and the full repository suite before B07 can close.

## Verification

- clean USA packet validator: PASS;
- existing USA adversarial fixtures: PASS, 23 of 23;
- named residual bypasses hard-rejected without sidecar corruption: 7 of 7;
- compound sidecar-corruption probes: **3 accepted incorrectly**;
- full repository `npm test`: PASS at the audited tree, including Tier A research validation, Taiwan's 32 fixtures, opening posture, political authority, typecheck, 43 simulation tests, production build, and rendered HTML.

The passing suite proves regression stability, not semantic release. B07 remains a release blocker until the three false-green paths are mechanically closed and independently re-audited.
