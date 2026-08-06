# Complete Force Ledger Data Contract

## Purpose

This directory defines the canonical research contract for the complete military
force universe of every represented country. Scenario rosters and exercise
observations point into these ledgers. They never create additional platforms,
formations, or equipment.

These files are research contracts. They do not implement the simulation engine.

## Canonical record family

| Record | Responsibility | Must not be used for |
| --- | --- | --- |
| `force_ledger_manifest.schema.json` | Coverage, file paths, reconciliation status, and review state for one country | Individual assets or quantities |
| `military_organization_record.schema.json` | Services, commands, formations, units, personnel, readiness, and mobilization relationships | Equipment totals |
| `equipment_type_record.schema.json` | Normalized class, model, variant, roles, mobility, support needs, and sourced characteristics | Possession or disposition |
| `force_platform_record.schema.json` | One uniquely represented hull, airframe, satellite, launcher, or named system | Anonymous pooled equipment |
| `force_inventory_record.schema.json` | One mutually exclusive equipment pool or aggregate reconciliation total | Counting an individualized platform twice |
| `force_deployment_record.schema.json` | Dated disposition, assignment, movement, commitment, and support dependencies | Player knowledge or intelligence tracks |
| `force_maintenance_record.schema.json` | Maintenance, repair, overhaul, refit, modernization, and expected return | Procurement or production |
| `force_construction_record.schema.json` | Ordered, built, delivered, and accepted quantities | Treating announced orders as operational inventory |
| `inventory_conservation_record.schema.json` | Opening balance, inflows, closing states, outflows, and residual | Combining incompatible counting units |
| `force_ledger_bundle.schema.json` | Portable envelope for integration tests and small country ledgers | Required production storage layout |

The older `military_inventory.schema.json` and
`military_organization.schema.json` are compatibility contracts for early
research records. New complete force ledgers use the record family above.

## Three identities that must remain separate

1. Equipment type answers what the thing is.
2. Platform or inventory pool answers what the country possesses.
3. Deployment answers where that possessed thing is assigned during a valid
   time interval.

A deployment cannot create possession. A scenario cannot create a platform. An
intelligence track cannot mutate the authoritative research record.

## Inventory conservation

Every reconciliation uses one country, equipment type, scope, interval, and
counting unit.

`opening inventory + production or acceptance + imports + transfers in + captures = closing accounting states + exports + transfers out + retirements + destruction + losses`

The following measures are never interchangeable:

1. Platforms.
2. Equipment items.
3. Launchers.
4. Batteries.
5. Munitions.
6. Formations.
7. Personnel.
8. Capacity units.

National totals, service totals, formation totals, named platforms, and local
observations may describe the same underlying inventory. They are related by
scope and parent references, not added together.

If three ships are represented individually and a class total is five, the
operational pool contains two ships. The class total may remain as a parent
reconciliation record but cannot be summed with either its children or the two
ship pool.

## Required unknowns

Unknown is a first class value. Researchers do not convert missing evidence into
zero, inactivity, poor readiness, or a fabricated location.

1. Unknown quantity uses `kind: unknown` and carries no numeric value.
2. A range requires both minimum and maximum, with minimum not greater than
   maximum.
3. Unknown home basing uses a null location identifier and explicit confidence.
4. Unknown readiness records its basis as unknown.
5. Announced construction remains separate from delivered and accepted inventory.
6. Maintenance estimates do not become exact return dates without evidence.

## Provenance and time

Every canonical record contains `temporal_validity` and `provenance`.

`temporal_validity` separates the period a fact describes, the observation time,
the corpus cutoff, and the next mandatory review. Records that expire are not
silently reused at later bookmarks.

`provenance` contains evidence state, confidence, source identifiers, optional
claim identifiers, contradiction sets, and method. Field specific measured
characteristics carry their own provenance because specifications often conflict
even when the equipment type identity is certain.

## Readiness rules

Possession is not readiness. Readiness must identify its evidence basis.

1. Inventory count does not imply mission capable count.
2. A platform in overhaul is not available merely because it remains commissioned.
3. A reserve pool requires mobilization delay and an operating organization.
4. A ready aircraft still depends on crew, runway, fuel, weapons, maintenance,
   command, and any required tanker or escort.
5. Scenario assumptions are permitted only when labeled as such and preserved
   separately from observed research.

## Reconciled ledger gate

A manifest may use `status: reconciled` only when:

1. All national services, components, and strategically relevant government
   forces have an explicit coverage decision.
2. Organization parents resolve without cycles.
3. Every platform and pool resolves to a country, controller, equipment type,
   service, and command or an explicit unknown.
4. Every individualized platform is excluded from operational pools.
5. Every deployment resolves to a ledger entity and does not exceed its quantity.
6. Maintenance quantities do not exceed their subject pools.
7. Delivered equipment remains outside active inventory until accepted.
8. Conservation residuals are zero or bounded by explicit unknowns.
9. Open contradictions and stale observations are counted in reconciliation.
10. All source, claim, contradiction, location, facility, organization, and
    dependency references resolve.

`blocked_by_unknowns` is an acceptable reviewed outcome. Silent imbalance is not.

## Storage convention

Large ledgers should use one NDJSON file per record family and register each path
in the manifest. Small fixtures may use `force_ledger_bundle.schema.json`.

Identifiers are stable across bookmarks. New evidence creates a new dated record
or validity interval rather than reusing an identifier for a different platform,
formation, or pool.

## Validation

Run:

```bash
node Agents/05_World_Research_and_Data_Director/research_data/schemas/validate_force_contracts.mjs
```

The validator parses every schema and checks the valid fixture for reference
integrity, temporal ordering, range ordering, quantity conservation, readiness
bounds, deployment bounds, and double counting between platforms and pools.

