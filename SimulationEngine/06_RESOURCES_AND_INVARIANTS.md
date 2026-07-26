# Resources and Invariants

## Conserved resources

Potential conserved or accounted capacities include:

1. Money.
2. Personnel.
3. Equipment.
4. Munitions.
5. Fuel.
6. Energy.
7. Industrial output.
8. Raw materials.
9. Transport capacity.
10. Maintenance capacity.
11. Platform time.
12. Airfield capacity.
13. Port capacity.
14. Sensor capacity.
15. Processing capacity.
16. Political authority.
17. Administrative capacity.
18. Alliance access.

## Stock and flow

Each resource should define:

1. Unit.
2. Producers.
3. Consumers.
4. Storage.
5. Transfer.
6. Loss.
7. Decay.
8. Reservation.
9. Release.
10. Accounting cadence.

## Core invariants

1. No negative conserved stock.
2. One persistent platform cannot occupy incompatible locations.
3. One platform cannot execute incompatible missions simultaneously.
4. Every territory has one authoritative controller at a time.
5. Every resource increase has a source.
6. Every resource decrease has a sink.
7. Equipment cannot exist in stockpile and deployment simultaneously.
8. Destroyed entities cannot act without a recovery or replacement event.
9. Every event references valid entities.
10. Every command receives an explicit result.
11. Belief never silently overwrites truth.
12. Unauthorized factions do not receive truth.
13. Same state, commands, seed, and content produce the same result.
14. Aggregation conserves constituent state.
15. Mission reach requires a valid support chain.

## Network invariants

1. Flow cannot exceed edge or node capacity.
2. Disconnected demand cannot receive supply.
3. Damage reduces capacity through an explicit event.
4. Recovery requires time and capacity.
5. Rerouting respects access and capacity.

## Political invariants

Political values may not be physically conserved, but every large change should
have a cause and bounded update rule.

## Invariant enforcement

Possible layers:

1. Command validation.
2. Event validation.
3. State transition assertions.
4. Periodic world audits.
5. Replay comparison.
6. Property based tests.

## Failure policy

An invariant violation should stop or quarantine the simulation in development.
It should never be silently corrected without an audit event.
