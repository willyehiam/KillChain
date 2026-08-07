# Taiwan residual force semantic correction R-B01 through R-B04

Correction date: 2026-08-07  
Preceding independent audit: `INDEPENDENT_REAUDIT_B01_B07_2026_08_06.md`  
Packet: `force_ledger_twn_2025_09_01`  
Disposition: **CORRECTED, PENDING INDEPENDENT RE-AUDIT**

This correction closes the four residual bypasses reported against the collecting Taiwan national force packet. It does not promote the packet. The manifest remains collecting, internally inconsistent, not decision usable, and not simulation ready until a separate review accepts the correction and the unresolved national inventory research is completed.

## R-B01: claim provenance quarantine

The validator now has one opening-evidence admissibility contract. A source is admissible only when it is explicitly marked prebookmark available, available to the player at the bookmark, not quarantined, and not published after the bookmark.

The contract is applied to:

1. organizations and relationships;
2. authority claims;
3. numeric claims;
4. cohorts and contradictions;
5. equipment, inventory, deployment, maintenance, construction, and conservation provenance chains.

Live mutable sources remain quarantined even if a future record adds a snapshot field. Snapshot existence alone does not silently change their bookmark evidence status.

Mandatory regression: `audit_claim_quarantined_source.json`.

## R-B02: complete unknown-state contracts

Every unaccepted national inventory pool now requires a complete unknown state:

1. no location;
2. unknown readiness band and basis;
3. unknown ready quantity in the pool counting unit;
4. null mobilization delay;
5. unknown embedded maintenance state and quantity.

Deployments require an exact unknown location and movement tuple. Maintenance records require null timing and facility state, an unknown completion estimate, and an unknown readiness effect. Planned construction cannot acquire a platform, production site, ordered quantity, delivered quantity, or accepted quantity. These state-bearing records also reject undeclared top-level fields.

Mandatory regression: `audit_hidden_mobilization_delay.json`.

## R-B03: authority power contract

Every authority claim in the collecting packet must retain the complete unproved, nonexecutable contract. Its issue-order, force-reassignment, and mission-release powers may be unknown or prohibited, but cannot be conditional or proved. Authority powers are checked in both directions against the corresponding relationship scope.

An accepted atomic authority locator will require an explicit data and validator change. Editing a record value alone cannot promote a command relationship.

Mandatory regression: `audit_promoted_authority_power.json`.

## R-B04: exhaustive stock, plan, and flow semantics

The validator now has an exhaustive semantic matrix for stock estimates, program plans, and cohort flows. It checks subject type, counting unit, component scope, observation precision, and opening-stock exclusion.

Every one of the 26 claims is also bound to a fixed accepted contract covering:

1. claim identity;
2. subject identity;
3. value and unit;
4. measurement and subject kinds;
5. component and population definitions;
6. observation precision and as-of semantics;
7. exact source set.

Unknown claim identities, missing accepted claims, additional claims, and unsupported semantic combinations fail closed.

Mandatory regression: `audit_unsupported_stock_flow_semantics.json`.

## Verification record

The unmodified production packet passes with 27 organizations, 30 relationships, 30 authority claims, 38 equipment types, 36 unknown inventory pools, 36 deployments, 36 maintenance records, two planned construction records, 36 blocked conservation records, 26 claims, one cohort, and two aggregation sets.

All 36 mandatory Taiwan force fixtures fail closed with their expected diagnostics, including the four residual bypass reproductions.

The packet intentionally retains:

1. 36 unknown opening quantities;
2. 36 open conservation exceptions;
3. zero accepted executable child allocations;
4. false `internally_consistent`, `decision_usable`, and `simulation_ready` flags.

Independent re-audit remains required before any acceptance flag changes.
