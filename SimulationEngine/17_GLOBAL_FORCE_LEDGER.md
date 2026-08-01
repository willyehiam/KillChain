# Global Force Ledger

## Status

Approved simulation requirement.

This document records a future engine contract. It does not authorize engine
implementation during the research stage.

## Player expectation

Every top 80 country participates with its complete military inventory and force
structure.

The Taiwan opening may begin with the assets observed during Justice Mission
2025, but those assets are only the deployed crisis posture. The rest of the
Chinese force remains in the world. The same applies to the entire United States
fleet and armed forces, every Japanese and Korean service, Russian forces in
other theaters, Philippine forces, allied forces, and every other represented
country.

The world cannot be a collection of isolated scenario inventories.

## Authoritative ledger

The future `WorldState` owns one global force ledger.

Every military entity or pool has:

1. Stable identity.
2. Controller.
3. Service and command hierarchy.
4. Formation or inventory pool.
5. Quantity.
6. Availability state.
7. Geographic state.
8. Current assignment.
9. Personnel and crew dependencies.
10. Sustainment dependencies.
11. Damage and maintenance state.
12. Source scenario metadata.

A crisis roster points into this ledger. It does not create a separate copy.

## Inventory conservation

For every equipment type and country:

`opening_inventory + production + imports + captures = active + committed + transit + training + maintenance + reserve + stored + damaged + destroyed + exports + retirements`

Every term must be represented by an authoritative event or state.

Aggregation and expansion preserve this equation.

## Global activity

Forces continue to act while the player does nothing.

1. Patrols continue.
2. Exercises begin and end.
3. Training consumes readiness and produces experience.
4. Maintenance starts and completes.
5. Construction and procurement advance.
6. Deployments rotate.
7. Other crises consume forces and munitions.
8. Governments mobilize or demobilize.
9. Allies request support.
10. Adversaries exploit weakened theaters.

The player may redirect forces, but the world does not wait for the player.

## Redeployment contract

A platform outside the active theater can participate only after satisfying:

1. Command authority.
2. Political authority.
3. Release from its current mission.
4. Route and access.
5. Transit time.
6. Fuel and replenishment.
7. Crew and readiness.
8. Maintenance.
9. Basing or operating support.
10. Risk created in the theater it leaves.

This makes the Atlantic Fleet, continental United States forces, Russian Far
East, Korean Peninsula, Indian Ocean, Europe, Middle East, and other regions part
of the same strategic board.

## Mission package constraint

Every mission package names its executing platforms and supporting platforms
from the global force ledger.

A package cannot execute when:

1. The delivery platform does not exist.
2. The platform is unavailable.
3. The platform is outside supported reach.
4. Required tanker, escort, sensor, communications, basing, or replenishment
   support is absent.
5. The platform is already committed to an incompatible mission.
6. Required munitions are unavailable.
7. Political or command authority is missing.

There are no anonymous attacks and no hand of god effects.

## Resolution and performance

Complete accounting does not require every asset to run at maximum frequency or
appear as a separate map symbol.

### Global resolution

1. Commands.
2. Fleets.
3. Armies.
4. Air regions.
5. Strategic reserves.
6. Major deployments.
7. Aggregate readiness and movement.

### Theater resolution

1. Task forces.
2. Wings and squadrons.
3. Brigades and regiments.
4. Support formations.
5. Transit routes.
6. Operational reserves.

### Mission resolution

1. Individual ships.
2. Executing aircraft.
3. Missile batteries.
4. Sensor platforms.
5. Tankers, escorts, and support assets.
6. Tracks and uncertain target identities.

Inactive forces advance through scheduled events and coarse deterministic
updates. Active theaters receive higher frequency updates. Moving between
resolutions never changes inventory, readiness, damage, location, or commitments.

## Fog of war

The authoritative ledger is not the player interface.

1. A faction sees its own force information according to institutional access.
2. Enemy forces appear as observations, tracks, estimates, and hypotheses.
3. Unknown deployments remain unknown.
4. Deception can create false tracks but cannot create real platforms.
5. Intelligence can reveal a force without changing its authoritative state.
6. Losing track custody does not remove the real force from the world.

## Required engine audits

1. Country inventory reconciliation.
2. Platform double booking.
3. Impossible location transitions.
4. Unsupported mission execution.
5. Readiness creation without cause.
6. Equipment duplication during aggregation.
7. Destroyed platform activity.
8. Formation constituent mismatch.
9. Production and loss reconciliation.
10. Deterministic replay of every inventory transition.

## Research dependency

The engine contract depends on the dated and sourced national ledgers defined in:

`Agents/05_World_Research_and_Data_Director/research_data/FULL_FORCE_INVENTORY_PROGRAM.md`

Research records historical uncertainty. Scenario content converts that evidence
into one explicit starting state. The simulation then evolves that state through
authoritative events.
