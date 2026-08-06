# Taiwan national force inventory independent audit

Audit date: 2026-08-06

Audited scope: Taiwan national force inventory packet at exact builder checkpoint `c25bd2d`. The audited organizations, relationships, sources, claims, contradictions, equipment types, inventory, deployments, maintenance, construction, conservation, and manifest records were not edited.

Method: direct record inspection; source, claim, taxonomy, command, accounting, and temporal closure checks; baseline validator and fixture execution; cross-file reconciliation; repository-consumer search; and ten isolated adversarial mutations against the production validator.

## Disposition

**BLOCKED FOR INTERNAL-CONSISTENCY ACCEPTANCE OR SIMULATION PROMOTION.**

The packet is correctly marked `collecting`, `internally_consistent: false`, `research_complete: false`, `decision_usable: false`, and `simulation_ready: false`. Those states must remain. Seven blockers prevent promotion.

## Confirmed correct

1. All 36 opening inventory pools use explicit unknown quantities. No dated estimate is promoted into possessed opening inventory.
2. All 36 inventory records preserve unknown readiness and null location. Their 36 designated deployment records preserve unknown location, movement, assignment, and availability.
3. All 36 designated maintenance records preserve unknown state and quantity.
4. All 36 conservation records preserve the opening unknown and report `blocked_by_unknowns`; no exact conserved national capacity is fabricated.
5. The packet contains no individual platform records, routes, geometry, or exact current positions.
6. The 350-fighter excluding-trainers claim, 400-fighter including-trainers claim, and derived trainer subset are explicitly treated as nested rather than additive. The trainer subset remains unknown.
7. Both construction records preserve ordered, delivered, and accepted quantities as unknown.
8. The ten existing negative fixtures reject their named narrow corruptions, including estimate promotion, exact deployment, plan acceptance, missing JOCC, and premature packet acceptance.

These are strong research defaults. They do not establish semantic closure or a safe simulation interface.

## Blocking findings

### B01: mutable live pages establish historical opening truth without immutable cutoff proof

Evidence:

`src_force_twn_adma_history_2022` and `src_force_twn_oac_subordinate_agencies_2025` have no publication timestamp, availability timestamp, immutable snapshot URI, archive proof, version identifier, or content hash. Both were retrieved on 6 August 2026. They nevertheless assert observation intervals ending exactly at the 1 September 2025 bookmark and support active opening organizations and relationships. The ADMA reliability note expressly says the live page was reviewed after the bookmark.

The validator accepts any self-asserted `observed_from` and `observed_to` interval ending by the bookmark. An isolated mutation changed the ADMA interval to 31 August through 1 September 2025 and removed `accessed_at`; it still passed.

Impact:

Current live-page content can leak backward into the historical opening state. The packet cannot prove that the cited text or institutional listing existed in the stated form by the bookmark.

Exact correction packet:

1. Add machine-readable mutability, publication, availability, retrieval, snapshot, content-hash, version, and observation-coverage fields.
2. Quarantine mutable pages from opening truth unless a prebookmark immutable snapshot or dated official artifact proves the claim.
3. Remove unsupported observation intervals; a dated reform described today is a retrospective claim, not continuous observation proof.
4. Require every opening organization and relationship to resolve only to temporally admissible evidence.
5. Add regressions for fabricated live-page intervals, missing retrieval metadata, and mutable-source reclassification.

### B02: the reconciliation manifest is not derived and reports a false unresolved count

Evidence:

All 36 conservation records have `result.state: blocked_by_unknowns` and identify an unresolved inventory record. The manifest reports `open_conservation_exceptions: 0`, unlike the repository's United States and China ledgers, which count their unresolved unknown pools as open conservation exceptions. The Taiwan validator derives only eight record counts and does not check exact, range, unknown, open-exception, double-booking, orphan, or expired summaries.

An isolated mutation changed `open_conservation_exceptions` from 0 to 999 and still passed.

Impact:

The summary is not truthful or mechanically tied to its child records. A downstream consumer cannot distinguish complete conservation from unresolved accounting.

Exact correction packet:

1. Define reconciliation summary semantics once across all country ledgers.
2. Derive all reconciliation values from records at validation time, including quantity kinds, unresolved exceptions, double bookings, orphans, and expirations.
3. Set Taiwan's unresolved exception count to the derived result; under the existing cross-ledger convention that is 36.
4. Make any summary divergence fail before acceptance.
5. Add fixtures for fabricated summary counts and expired-child/zero-summary mismatch.

### B03: one-to-one national accounting is present in the baseline but not enforced

Evidence:

Each baseline inventory record points to one deployment, maintenance, and conservation record, which is correct. The validator checks only the forward references and whether every deployment names an inventory pool. It does not require exactly one reverse deployment, exactly one maintenance record, or exactly one conservation scope per inventory pool.

An isolated mutation appended a second deployment for the tank pool and updated the manifest's deployment count. The production validator accepted two deployments accounting the same national pool.

Impact:

The same unknown or later exact capacity can be double booked while all current tests remain green.

Exact correction packet:

1. Enforce a bijection between each national inventory pool and its national accounting deployment, maintenance record, and conservation scope.
2. Require IDs to be unique across every dataset.
3. Reject duplicate entity accounting even when manifest counts are arithmetically truthful.
4. Add duplicate deployment, maintenance, conservation, and record-ID fixtures.

### B04: claim-to-record semantics are inconsistent and unvalidated

Evidence:

`claim_twn_us_dod_2024_ground_force_personnel_104000` uses unit `personnel`, while its subject inventory and taxonomy use `person`. `claim_twn_2024_conscript_intake_6956` is a historical flow in `person` but its subject is a training-capacity stock counted in `capacity_unit`. Two other conscript cohort-flow claims point at active and reserve stock pools. Prose warns against treating these flows as totals, but the schema does not distinguish stock, flow, throughput, cohort, or period.

The validator checks source existence and claim date only. It accepted a tank claim changed from `equipment_item` to `person`, and it separately accepted reassigning the tank claim to the training-capacity pool.

Impact:

Incompatible categories and flows can be attached to an inventory pool and later promoted or compared as though they measured the same thing.

Exact correction packet:

1. Normalize the ground-force personnel unit to the canonical `person` unit.
2. Move conscript intake, discharge, and assignment observations to typed cohort-flow or event records outside opening inventory stocks.
3. Add stock-versus-flow, period, scope, component, unit, subject-kind, and population-definition metadata to claims.
4. Enforce claim-to-subject compatibility and prohibit a derived record from having stronger evidence, certainty, temporal precision, or component scope than its claim.
5. Add mandatory unit mismatch, unrelated-subject, flow-to-stock, and claim-value-divergence fixtures.

### B05: nested taxonomy and conservation structure can silently detach or double count

Evidence:

The baseline correctly links seven naval children to a naval reconciliation parent and links the fighter excluding-trainers and trainer-subset categories to the including-trainers parent. Corresponding conservation records also contain parent IDs. The validator does not compare equipment parentage with conservation parentage, enforce complete mutually exclusive sibling sets, or guard consumers against summing parents with children.

An isolated mutation detached the frigate equipment type from the naval parent while leaving conservation parentage unchanged. It passed. There is no repository-wide force-ledger consumer guard comparable to the Taiwan opening-posture guard.

Impact:

Category hierarchy and conservation hierarchy can disagree, and a consumer can sum reconciliation parents with children or omit children without detection.

Exact correction packet:

1. Require equipment, inventory, deployment, maintenance, and conservation aggregation graphs to be isomorphic for every nested scope.
2. Require explicit mutually exclusive sibling-set IDs, residual categories, and completeness state.
3. Prohibit raw parent-plus-child summation through a scoped query interface and repository consumer guard.
4. Add detached-child, missing-sibling, duplicate-sibling, parent-plus-child, and residual-omission fixtures.

### B06: command release authority is asserted more precisely than its evidence model proves

Evidence:

The command packet gives active `operational_control` and mission-release power to MND, General Staff Headquarters, JOCC, theater operations centers, Fleet Command, and Air Combat Command edges. Every relationship is labeled `official_claim` with high confidence, but no relationship cites an atomic claim, page, section, quotation, authority type, activation predicate, or effective interval. The 2023 National Defense Report source locator names broad Parts II and III, while relationship methods say `Direct extraction` of precise issue, reassignment, and mission-release powers.

The validator checks only three required JOCC release paths and prohibits release on an edge still labeled `organize_train_equip`. It accepted an isolated mutation that retyped an administrative generating edge as active operational control with mission-release power.

Impact:

Hierarchy identity can be promoted into executable operational authority, and an attacker can bypass the sole prohibition by renaming the edge.

Exact correction packet:

1. Create atomic authority claims for every modeled power, with page or section locator, actor, target, authority class, predicate, scope, effective interval, and release semantics.
2. Separate constitutional/statutory command chain, administrative control, organize-train-equip responsibility, operational control, supported/supporting relations, and conditional mobilization employment.
3. Keep unproved issue, reassignment, and mission-release powers unknown or conditional.
4. Validate authority provenance by typed source role and claim semantics, not relationship label.
5. Add administrative-to-OPCON, label-swapping, unconditional reserve-employment, and unsupported-release fixtures.

### B07: the passing validator and status flags do not form a semantic firewall

Evidence:

Ten isolated corruptions were applied to packet copies. All ten were accepted:

| Adversarial mutation | Production validator |
| --- | --- |
| mutable live page assigned an arbitrary interval without snapshot proof | accepted |
| claim unit made incompatible with inventory taxonomy | accepted |
| claim subject reassigned to an unrelated capacity pool | accepted |
| duplicate deployment accounts the same pool twice | accepted |
| taxonomy child detached from its reconciliation parent | accepted |
| exact coordinates inserted into organization metadata | accepted |
| maintenance unit made incompatible with inventory | accepted |
| manifest open-conservation summary fabricated | accepted |
| administrative edge promoted to operational mission release | accepted |
| anonymous capacity bypassed with the phrase `This is not a conserved child allocation` | accepted |

The anonymous-capacity check is a substring search over prose rather than a structured allocation reference. The exact-location check covers inventory and deployment fields but not organizations, construction, equipment, provenance, notes, or arbitrary added state. The package test runs the local validator, but no consumer guard prevents executable code from directly reading these research records while ignoring manifest status.

Impact:

Green tests can coexist with double booking, incompatible evidence, hidden exact locations, unsupported command release, and anonymous capacity. The packet's safe status is currently a convention, not a repository-enforced boundary.

Exact correction packet:

1. Load and semantically validate every packet dataset and every manifest summary.
2. Replace prose magic with typed conserved-allocation IDs resolving to child ledger records and explicit release gates.
3. Recursively reject forbidden location, readiness, availability, movement, and assignment state outside an allowlisted schema.
4. Add a repository consumer guard with a failing self-test; research-only records may not be imported by executable code until a reviewed acceptance artifact authorizes it.
5. Turn all ten mutations above into mandatory failing regressions before internal consistency may become true.

## Major findings

### M01: publication time is used as observation time for the 2024 estimates

All United States Department of Defense table claims use `as_of: 2024-12-18`, the report publication date. The source description does not establish that every table population was observed on that day. Separate publication, source availability, observation interval, estimation period, and bookmark relevance. When the observation cutoff is unspecified, preserve it as unknown rather than copying publication time.

### M02: active-component scope is not proved for the aggregate estimates

Most estimated inventory subjects are labeled `component: active`, although the source is described only as an operational estimate and the packet does not cite a component definition for each table. The opening quantity remains unknown, which prevents immediate capacity fabrication, but the subject metadata can still collapse reserve or training populations into active scope. Use `all_components` or explicit unknown unless the source defines the component population, and add an all-component-to-active regression.

### M03: construction plan semantics need outcome and authorization states

The five-brigade record retains `state: planned` at the 2025 bookmark even though its plan milestone is 31 December 2023. That is safer than inferring completion, but the elapsed plan needs an explicit `outcome_unknown` or stale-plan state and follow-up evidence. The submarine record uses milestone `authorized` based on a budget approval description; distinguish proposal, executive budget approval, appropriation, contract award, construction start, delivery, and acceptance.

### M04: category-scope ambiguities are not represented as contradictions

The only contradiction record covers the nested fighter values. The naval categories declare amphibious assault ship, landing and amphibious ships, corvette, and coastal patrol/missile craft to be mutually exclusive siblings without source-local definitions proving the boundaries. Record category-definition uncertainty and overlap explicitly; do not assert mutual exclusivity solely from adjacent table labels.

### M05: construction has an unresolved producer identity

`construction_twn_planned_follow_on_indigenous_submarines.producer_ids` references `institution_twn_indigenous_defense_industry`, which resolves nowhere else in the packet or repository. It is effectively anonymous production capacity. Either create a typed public aggregate institution record or leave the producer unknown; require all non-null producer and site references to resolve.

### M06: source independence and derivation cannot be evaluated

Sources have no source-family, upstream dependency, archive, or derivation graph. Most numeric estimates come from one Department of Defense report. Preserve that as one evidence family, not many independent confirmations, and require independence metadata before confidence can increase.

## Minor findings

### N01: evidence confidence is stronger than the reproducibility metadata

Precise command relationships and plan records use `official_claim` with high confidence while their source locators are broad and no atomic claim links exist. Confidence should reflect reproducibility and claim scope, not publisher status alone.

### N02: temporal formats are mixed

Source and claim dates use date-only values while bookmark and validity values use full timestamps. Normalize to explicit UTC instants or typed date/interval values and validate ordering without host-timezone ambiguity.

### N03: packet descriptions overstate the current validator

The checkpoint says the validator checks one-to-one accounting and unit compatibility. It checks inventory-to-taxonomy unit equality and designated forward references, but not reverse uniqueness or claim/maintenance/conservation unit compatibility. Update the description only after those invariants are actually enforced.

## Baseline test result

Before audit publication, the Taiwan production validator passed with 27 organizations, 32 relationships, 38 equipment types, 36 inventory records, 36 deployments, 36 maintenance records, two construction records, 36 conservation records, 26 claims, and one contradiction. All ten builder fixtures passed.

That green baseline proves the packet's deliberate unknown defaults and narrow guards. The ten isolated accepted corruptions prove it does not support internal-consistency acceptance.

The full repository `npm test` suite also passed on the audit worktree. It included research-foundation and all three Tier A force-ledger validators and regressions, the opening-posture firewall, 34 authority regressions, politics regressions, TypeScript typecheck, 43 deterministic simulation tests, the production build, and rendered-HTML validation. This is a repository regression result, not evidence that B01 through B07 are closed.

## Promotion gate

The packet may remain as a useful public aggregate research scaffold. Do not promote it until:

1. B01 through B07 are corrected;
2. every manifest reconciliation value is derived and truthful;
3. claim, taxonomy, stock/flow, component, temporal, and authority semantics are compatible;
4. all ten isolated corruptions become mandatory failures;
5. a repository consumer guard prevents status bypass;
6. the exact correction commit passes the full repository suite; and
7. a second independent auditor records acceptance without editing the audited records.
