# Taiwan national force inventory independent B01-B07 re-audit

Audit date: 2026-08-06  
Audited correction checkpoint: `b529eb1d`  
Audited packet: `force_ledger_twn_2025_09_01`  
Disposition: **BLOCKED**

The corrected Taiwan records were inspected but not edited. The audit used fresh isolated packet copies for every mutation.

## What passed

The unmodified production packet validates with 27 organizations, 30 relationships, 30 atomic authority claims, 38 equipment types, 36 inventory pools, 36 deployments, 36 maintenance records, two construction records, 36 conservation records, 26 claims, one cohort, and two aggregation sets.

All 32 mandatory Taiwan fixtures fail closed with their expected diagnostics. A separate implementation of the ten corruptions from the first audit also confirms that the production validator now rejects:

1. fabricated live-page observation intervals;
2. claim-unit mismatch;
3. unrelated claim subjects;
4. duplicate national accounting deployments;
5. detached equipment hierarchy;
6. hidden coordinates;
7. maintenance-unit mismatch;
8. fabricated reconciliation summaries;
9. administrative control promoted to operational mission release; and
10. anonymous capacity hidden behind a negated prose phrase.

The baseline manifest truthfully derives 36 unknown quantities, 36 open conservation exceptions, zero double bookings, two orphan organizations, and zero expired records. Every inventory pool has exactly one reverse deployment, maintenance record, and conservation scope. Aggregation parentage and sibling sets pass. The executable-consumer self-test blocks direct import of the collecting ledger. Manifest status and all promotion flags remain safely unaccepted.

## Remaining blockers

### R-B01: claim provenance can bypass mutable-source quarantine

An isolated copy replaced the tank stock-estimate claim's immutable Department of Defense source with the quarantined live ADMA page. The validator passed with no errors. Source quarantine is enforced for organizations, relationships, and authority claims, but the claim loop checks only source existence and postbookmark publication date.

Impact: quarantined live content can become the provenance of a stock estimate and then remain linked from an inventory pool. This reopens B01 outside the command graph.

Exact correction packet:

1. Require every claim source to be temporally admissible for that claim's declared bookmark use.
2. Reject `quarantined_no_prebookmark_temporal_proof` sources from stock estimates, program plans, cohort flows, contradictions, and any inventory provenance chain.
3. Bind the accepted source IDs or admissible source roles for every fixed claim contract.
4. Add the isolated quarantined-source substitution as a mandatory fixture.

### R-B02: schema-valid readiness timing escapes hidden-state rejection

An isolated copy changed `inventory_twn_tank.readiness.mobilization_delay_hours` from `null` to `0`. The validator passed with no errors. It checks the readiness band and ready quantity, while its recursive scan rejects only a location/movement key list.

Impact: a collecting unknown pool can acquire executable mobilization timing even though readiness and availability remain expressly unresolved. This reopens the hidden-state portion of B07 using a field allowed by the shared schema.

Exact correction packet:

1. For every unaccepted inventory pool require the complete readiness tuple: unknown band and basis, unknown ready quantity, `mobilization_delay_hours: null`, and no positive readiness or availability state.
2. Apply equivalent complete-state contracts to deployment, maintenance, construction, and authority datasets rather than relying on forbidden key names.
3. Add the zero-hour mobilization mutation as a mandatory fixture.

### R-B03: typed authority claims can promote themselves to proved powers

An isolated copy changed one authority claim to `release_semantics: proved` and set issue, reassignment, and mission-release powers to `proved`. The relationship remained nonexecutable. The validator passed with no errors because it validates only enum membership and relationship identity; it does not enforce the baseline unproved-power contract or consistency between source precision and proved powers.

Impact: broad organizational evidence can assert proved operational power inside the authority dataset even while the relationship view remains blocked. This reopens B06 and creates two contradictory authority representations.

Exact correction packet:

1. Require authority power values and release semantics to match a structured accepted authority contract for each relationship.
2. For this collecting packet require all unproved powers to remain `unknown` or `prohibited` and release semantics to remain `unproved_nonexecutable`, unless an independently reviewed atomic locator is added.
3. Validate two-way consistency between authority claims and relationship authority scopes.
4. Add the proved-power promotion as a mandatory fixture.

### R-B04: unsupported stock/flow semantic combinations fall through

An isolated copy changed the conscript intake claim from `measurement_kind: cohort_flow` to `stock_estimate` while leaving `subject_kind: cohort`. The validator passed with no errors. Known fixed estimates, cohort flows, and program plans each have branches, but unsupported combinations have no rejecting final branch.

Impact: cohort flow separation is not closed; a flow can be relabeled as a stock without attaching it to an inventory pool. This reopens B04.

Exact correction packet:

1. Define an exhaustive allowed matrix of measurement kind, subject kind, unit, period, population, component scope, and opening-stock eligibility.
2. Reject every unrecognized combination rather than allowing fallthrough.
3. Bind every claim ID to one allowed semantic contract and reject missing or extra claim contracts.
4. Add the cohort-to-stock relabeling as a mandatory fixture.

## B01-B07 disposition

- Original ten bypasses: closed.
- Derived summary and one-to-one conservation checks: closed for the tested packet.
- Aggregation hierarchy and parent-plus-child protection: closed for the tested packet.
- Collecting status and executable-consumer firewall: closed for the tested packet.
- Mutable claim provenance, complete hidden-state rejection, typed authority power contracts, and exhaustive cohort-flow semantics: **open blockers**.

Do not set `internally_consistent`, `decision_usable`, or `simulation_ready` until R-B01 through R-B04 are corrected, converted into mandatory regressions, and independently re-audited.

## Test record

- Production Taiwan packet: PASS.
- Mandatory Taiwan fixtures: PASS, 32 of 32 rejected as expected.
- Independent original bypass reattempts: PASS, 10 of 10 rejected.
- Executable-consumer self-test: PASS.
- Full repository suite: PASS, including research schemas and all Tier A ledgers, both consumer firewalls, 34 political-authority regressions, politics regressions, typecheck, 43 simulation tests, the production build, and rendered HTML validation.
