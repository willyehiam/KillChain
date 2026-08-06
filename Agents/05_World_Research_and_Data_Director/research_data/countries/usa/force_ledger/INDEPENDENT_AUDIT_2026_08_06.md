# United States national force inventory independent audit

Audit date: 2026-08-06

Audited scope: United States national force inventory packet through `24e817e`, rechecked on current main through `6c484f5`. A remote comparison through `c15728f` showed no later change to the audited United States packet. The audited force records were not edited.

Method: direct inspection of the manifest, organizations, relationships, inventory, deployments, maintenance, construction, conservation, claims, contradictions, sources, validator, and all four existing regression fixtures; arithmetic reconciliation; official-source comparison; and eight isolated adversarial mutations against the production validator.

## Disposition

**BLOCKED FOR INTERNAL-CONSISTENCY ACCEPTANCE OR PROMOTION.**

The packet is correctly marked `collecting`, `research_complete: false`, `decision_usable: false`, and `simulation_ready: false`. Those states must remain. The stronger assertion `internally_consistent: true` is not supported. Seven blockers remain.

## Confirmed correct

1. The six published Air Force mission-category values add arithmetically to 4,832: 139 bombers, 1,933 fighter or attack aircraft, 241 rotorcraft, 359 special-mission aircraft, 1,191 mobility aircraft, and 969 trainers.
2. Assigned and deployable personnel are generally preserved as unknown rather than inferred from statutory authorization.
3. Readiness, maintenance allocation, tanker count, airlift count, Navy readiness, and exact Navy bookmark total are not fabricated as positive operational availability.
4. Tanker and airlift records are mutually exclusive children of mobility and each remains quantity unknown.
5. National deployments expose neither geometry nor movement routes.
6. Parent totals are accompanied by prose warning against summing them with child categories.
7. The four existing negative fixtures correctly reject a missing Secretary of Defense, National Guard Bureau operational-control collapse, an orphan deployment, and a one-aircraft category reconciliation error.

These are useful foundations. They do not close the blockers below.

## Blocking findings

### B01: the Navy opening range is neither bookmark-safe nor a valid bound

Evidence:

`inventory_usa_navy_battle_force_ship` encodes a range of 287 to 296 for 1 September 2025. The lower number is an FY2025 requested fleet and the upper number is an FY2024 actual fleet. A request and a prior-year actual do not mathematically bound the fleet on the bookmark date. Both claims depend on `src_force_usa_crs_navy_force_structure_2025`, published 8 October 2025. The cited report separately records 293 ships on 1 October 2025; it does not establish the packet's 1 September lower and upper bounds.

Impact:

The range can exclude the true opening value, and the source was unavailable at the bookmark. `contradiction_usa_navy_battle_force_bookmark_total_2025` labels same-source, non-contemporaneous values as usable bounds and permits scenario sampling from an unproved interval.

Exact correction packet:

1. Quarantine the 287 to 296 range from opening inventory and player knowledge.
2. Store the FY2025 request and FY2024 actual only as separately typed planning and historical claims.
3. Set the 1 September battle-force quantity to explicit unknown unless dated prebookmark evidence or a later immutable retrospective source directly observes that date.
4. If retrospective evidence is used for opening truth, distinguish `available_to_researcher_after_bookmark` from `available_to_player_at_bookmark` and require direct temporal coverage.
5. Reject ranges unless each endpoint is proved to bound the same population at the same time.
6. Add negative fixtures for postbookmark source leakage and request-plus-prior-actual pseudo-bounds.

### B02: the 4,832 Air Force estimate is promoted to exact active-component opening inventory

Evidence:

The CRS source calls the table an **estimated FY2025 Total Aircraft Inventory** derived from Department of the Air Force budget data. The packet's claim preserves `estimated_total_aircraft_inventory`, but the parent and all six child inventory records use `quantity.kind: exact`, `component: active`, and `valid_from: 2025-09-01`. The packet's own contradiction records a different request-era component sum of 4,903 and explicitly says component allocation is not comparable. Nevertheless, the 4,832 parent and every category child are assigned to the active component.

Impact:

Arithmetic conservation is correct, but epistemic certainty, component scope, and bookmark timing are not. Reserve and Guard aircraft can be silently collapsed into active-component capacity, and an FY2025 estimate becomes a point observation on 1 September.

Exact correction packet:

1. Preserve the six-category arithmetic as an estimated FY2025 national taxonomy, not an exact bookmark observation.
2. Change certainty to a typed estimate and set component scope to `all_components`, `joint_component_pool`, or explicit unknown; do not use `active` without evidence.
3. Separate fiscal-year estimate validity from bookmark observation time.
4. Keep component allocations unknown until compatible active, Guard, and Reserve evidence reconciles to the same total and definition.
5. Require inventory values to match their claim predicate, evidence state, temporal scope, and component scope.
6. Add negative fixtures for estimate-to-exact promotion, all-component-to-active collapse, and claim/inventory value divergence.

### B03: reserve and Guard authority edges assert powers their cited statutes do not grant

Evidence:

Five service-to-reserve edges are active `mobilization_authority` relationships with power to issue and reassign orders, but cite only 10 U.S.C. §10101. That section names the reserve components; it does not grant the modeled mobilization power. The President-to-Army-National-Guard and President-to-Air-National-Guard activation edges cite only 10 U.S.C. §12401. That section describes federal-service status; it does not itself supply an activation route. Actual call or activation authority depends on a specific statute and predicates, including routes such as §12406 and other reserve call authorities.

The Guard model also lacks a machine-readable, mutually exclusive status transition across state active duty, Title 32, and Title 10. A consumer can retain an active state-control edge while also applying federal activation because exclusivity exists only in prose.

Impact:

The packet can authorize impossible mobilization and simultaneous incompatible command states.

Exact correction packet:

1. Retype §10101 relationships as component identity only or replace them with authority-specific evidence.
2. Model each reserve call route separately with actor, predicate, scope, duration, consent or notice requirements, and termination.
3. Treat §12401 as status semantics, not activation authority.
4. Add specific Guard activation routes with controlling statutes and typed conditions.
5. Add an exclusive status state machine for state active duty, Title 32, and Title 10, including partial-unit transitions and return to state control.
6. Distinguish administrative control, organize-train-equip responsibility, statutory command chain, combatant command authority, and doctrinal OPCON.
7. Add fixtures that reject identity statutes as authority provenance and reject simultaneous incompatible Guard states.

### B04: an annual Army training plan is represented as exact opening inventory and deployment

Evidence:

The Army budget source proposes 22 annual combat-training-center rotations. The packet creates an exact inventory pool, matching deployment quantity, maintenance record, and balanced conservation record for 22 `capacity_unit` at the opening bookmark. The counting rule says this is planned annual throughput and not equipment, but the schema still promotes it into opening inventory and deployment.

Impact:

Planned annual throughput can be consumed as present capacity, despite no evidence of completed rotations, remaining-year capacity, scheduling, or current availability.

Exact correction packet:

1. Move the 22 rotations to a typed annual plan or throughput target outside opening inventory.
2. Represent completed, scheduled, remaining, canceled, and available rotations separately, each with an observation interval.
3. Do not create deployment, maintenance, or inventory conservation entries for a budget target.
4. Keep opening executable training capacity unknown until dated execution evidence exists.
5. Add a fixture that rejects `availability_state: ready` and inventory promotion for a plan-only source.

### B05: mutable live pages claim unproved bookmark intervals

Evidence:

`src_force_usa_dod_about` and `src_force_usa_dod_combatant_commands` have no publication date, retrieval date, archived snapshot, content hash, or immutable version. They nevertheless assert `observed_from: 2025-01-01` through `observed_to: 2025-09-01`. Multiple organization records use those sources to establish bookmark truth. The reliability note acknowledges that at least one live page later changed.

Impact:

Current website contents can leak backward into the 1 September opening state with no proof that the cited content existed then.

Exact correction packet:

1. Quarantine live-page claims from temporal opening truth unless an archived or dated prebookmark artifact proves the content.
2. Add machine-readable source mutability, retrieval time, snapshot URI, content hash, publication time, availability time, and observation coverage.
3. Permit mutable pages for current identity discovery only; require immutable evidence for historical interval claims.
4. Add a source-temporal firewall and negative fixture for unsupported observed intervals.

### B06: 45 expired force-state records coexist with `expired_records: 0`

Evidence:

All 15 inventory, 15 deployment, and 15 maintenance records have `review_after: 2025-10-01`. At the 6 August 2026 audit, all 45 are expired by their own metadata. `manifest.json` was reviewed on 6 August 2026 but reports `expired_records: 0` and `internally_consistent: true` without changing or revalidating those record-level dates.

Impact:

The reconciliation summary is factually inconsistent with its children, and stale records appear current to downstream consumers.

Exact correction packet:

1. Compute expiration from record metadata and a declared evaluation time; never hard-code zero.
2. Mark all expired records stale until source-backed revalidation occurs.
3. Revalidation must update record review metadata and evidence, not only the manifest review date.
4. Make any false expired-record count fail acceptance.
5. Add an expired-child/zero-summary regression fixture.

### B07: the passing validator does not establish semantic consistency

Evidence:

Eight isolated corruptions were applied to copies of the production packet. All eight were accepted by `validate_national_packet.mjs`:

| Adversarial mutation | Current validator |
| --- | --- |
| Air Force claim changed from 4,832 to 1 while inventory remained 4,832 | accepted |
| Army assigned strength fabricated as exact 999,999 | accepted |
| Air Force inventory source moved after the bookmark | accepted |
| bomber maintenance changed to 9,999 platforms | accepted |
| planned cutter request changed to completed with three delivered and accepted | accepted |
| planned Army training capacity changed to ready | accepted |
| bomber parent inventory link removed | accepted |
| Guard activation provenance replaced with reserve-identity statute §10101 | accepted |

The validator does not load `maintenance.ndjson`, `construction.ndjson`, or equipment types; does not reconcile claims to represented values; does not validate assigned personnel; does not enforce source dates; and does not prove authority-source semantics or parent-child links. The four existing fixtures therefore establish narrow shape invariants, not the manifest's broad internal-consistency claim.

Impact:

Mechanically impossible readiness, anonymous capacity, false authority, source-date leakage, and broken conservation semantics can all pass the promotion gate.

Exact correction packet:

1. Load and validate every dataset named in the manifest.
2. Enforce claim-to-record value, unit, certainty, component, and temporal agreement.
3. Enforce assigned and deployable personnel bounds and unknown-state rules.
4. Enforce maintenance, readiness, deployment, construction, and conservation inequalities by compatible counting unit and scope.
5. Enforce source publication and availability firewalls at the bookmark.
6. Enforce structural parent-child closure and nonadditive consumer semantics.
7. Enforce authority provenance by typed statute role, not source presence alone.
8. Turn all eight mutations above into mandatory failing regressions before `internally_consistent` may become true.

## Major findings

### M01: tanker and airlift unknowns are not jointly constrained to mobility

The two subsets are correctly unknown and mutually exclusive, but the schema does not state that their union plus any residual mobility categories equals or is bounded by 1,191. Add a typed partition with residual unknown, compatible definitions, and upper-bound conservation. Unknown must not mean unconstrained infinity.

### M02: construction semantics overstate budget requests and plans

The Army record uses `quantity_ordered: 9` and an `authorized` milestone for a budget plan. The Waterways Commerce Cutter record uses `quantity_ordered: 3` and `authorized` for a procurement request. National Security Cutter 11 is `under_construction` with a null start date based on a budget justification. Replace commercial-order and authorization language with typed request, enacted appropriation, contract award, start, launch, delivery, and acceptance states; leave each unproved state unknown.

### M03: statutory command chain is conflated with doctrinal OPCON

President-to-Secretary and Secretary-to-combatant-command relationships are typed `operational_control`, although the sources establish the statutory chain of command. Store statutory command transmission separately from force assignment and doctrinal combatant command authorities. Do not infer a uniform power to reassign and release all forces from chain identity alone.

### M04: Coast Guard budget-supported positions are stored as authorized end strength

The Coast Guard's 42,330 budget-supported military positions appear under `personnel.authorized`, while their own counting rule says they are not a statutory active-duty end-strength ceiling. Add a distinct `budget_supported_positions` field and keep statutory authorization unknown where no ceiling exists. Extend personnel validation beyond its current hard-coded subset.

### M05: provenance cannot demonstrate source independence

Sources have no family ID, dependency graph, archive proof, or derivation metadata. The Air Force table is one CRS analysis of Department budget data. Both Navy range endpoints come from the same later CRS report. Add source-family and dependency fields; do not count two claims from one source family as independent reconciliation.

### M06: nonadditive parent and child pools rely on prose

Deployments contain both the 4,832 parent and all six children. Counting rules warn not to sum them, but no repository-wide consumer guard prevents double counting, and the validator accepted removal of a child parent link. Require structural aggregation edges, scoped query APIs, and a consumer import guard that forbids raw summation across aggregation levels.

### M07: personnel claims are not reconciled to organization records

The validator hard-codes selected statutory values but does not prove that claim records, organizations, and source evidence agree, and it ignores assigned strength. Derive accepted values from claims or enforce exact equality and temporal/source closure. Add impossible assigned-greater-than-authorized and claim-divergence fixtures.

### M08: readiness and maintenance are safe only by convention

The production records preserve unknowns, which is good, but the validator accepts fabricated ready capacity and maintenance greater than total inventory. Add state-transition and quantity invariants so current safe values cannot be silently corrupted.

## Minor findings

### N01: evidence states are inconsistent across layers

The Air Force claim is `independently_reported`, while inventory provenance for the same single source is `official_claim` with high confidence. Define one evidence-state vocabulary and require derived records not to be stronger than their claims.

### N02: review metadata uses mixed date formats

Some fields use dates and others full timestamps. Normalize all temporal fields to one explicit UTC representation and validate interval ordering.

### N03: unknown equipment pools cite capability confirmation without a capability claim

Army, Marine Corps, Space Force, and Coast Guard unknown pools state that a source confirms capability, but do not identify a specific capability claim. Link each placeholder to a typed claim or make provenance explicit as taxonomy-only.

## Promotion gate

The packet may remain in research as a useful scaffold, but do not promote it or retain `internally_consistent: true` until:

1. B01 through B07 are corrected;
2. all eight adversarial mutations are mandatory failures;
3. the 45 expired records are revalidated or marked stale;
4. authority and component semantics are independently reviewed; and
5. a second auditor reruns the full repository suite on the exact remote commit.

The minimum safe interim change is to set `internally_consistent: false`, preserve all non-executable acceptance flags, and quarantine the Navy range, Air Force component attribution, plan-derived capacity, and unsupported mobilization edges from every consumer.

