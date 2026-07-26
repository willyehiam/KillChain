# Time, Scheduling, and Events

## Time model

KillWeb uses real time with pause from the player perspective.

The simulation should use explicit deterministic time rather than browser frame
time or wall clock time.

## Multiple cadences

Different systems may evaluate at different deterministic cadences:

1. Immediate validation for commands.
2. Short intervals for active missions and track custody.
3. Hourly intervals for movement, readiness, and logistics.
4. Daily intervals for national policy and markets.
5. Weekly intervals for production, politics, and diplomacy.
6. Monthly intervals for demographics, construction, and institutional change.

These are hypotheses. Exact cadence belongs to later design.

## Event queue

The queue should order events by:

1. Simulation time.
2. Priority class.
3. Stable sequence number.

This prevents nondeterministic ordering when several events share a time.

## Event categories

1. Command result.
2. Movement.
3. Resource reservation.
4. Resource transfer.
5. Production.
6. Construction.
7. Detection and observation.
8. Belief update.
9. Operation phase.
10. Engagement.
11. Damage.
12. Recovery.
13. Political.
14. Diplomatic.
15. Economic.
16. Scenario.
17. Plan review.

## Scheduling rule

Systems should react to:

1. Relevant events.
2. Explicit pulses.
3. Scheduled reviews.

They should not scan the entire world every rendered frame.

## Pause and speed

Player speed changes how quickly simulation time advances. It does not change
simulation rules.

The renderer interpolates movement and animation between authoritative updates.

## Cancelation and interruption

Long actions need:

1. Start event.
2. Reserved capacity.
3. Progress.
4. Interrupt conditions.
5. Cancelation policy.
6. Partial completion policy.
7. Released or lost resources.
8. Completion event.

## Simultaneity

Conflicting events at the same time require explicit resolution rules. The engine
must never depend on incidental array order or rendering order.
