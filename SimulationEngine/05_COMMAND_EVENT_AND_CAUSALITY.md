# Command, Event, and Causality

## Command lifecycle

1. Actor issues command.
2. Engine validates identity and authority.
3. Engine validates prerequisites.
4. Engine validates geography and access.
5. Engine validates resources.
6. Engine validates schedule and conflicts.
7. Engine reserves capacity.
8. Engine emits acceptance, rejection, or delay.
9. Execution systems emit progress and outcome events.
10. Observers create faction specific evidence.

## Command contents

A command should include:

1. Stable command identifier.
2. Issuing actor.
3. Authority.
4. Requested action.
5. Targets or objective.
6. Parameters.
7. Constraints.
8. Desired start.
9. Client sequence.
10. Content and schema version.

## Rejection

Rejections should state:

1. Reason.
2. Missing prerequisite.
3. Conflicting reservation.
4. Earliest possible alternative where known.
5. Player facing remedy.

## Reservation

Resources should be reserved before execution where conflict matters.

Examples:

1. Platform.
2. Crew.
3. Munitions.
4. Fuel.
5. Tanker support.
6. Airfield capacity.
7. Sensor collection.
8. Transport.
9. Political authority.
10. Budget.

## Event structure

An event should include:

1. Identifier.
2. Type.
3. Simulation time.
4. Sequence.
5. Responsible system.
6. Causal command or event.
7. Affected entities.
8. Payload.
9. Random sample references where relevant.
10. Schema version.

## Causal graph

Major outcomes should be traceable:

1. Policy created budget.
2. Budget funded production.
3. Production created inventory.
4. Inventory was allocated to a theater.
5. A mission reserved it.
6. A platform delivered it.
7. Engagement created damage.
8. Sensors observed evidence.
9. Assessment changed belief.
10. Leadership made a new decision.

## No direct interface mutation

The UI may submit commands and display projections. It may not update truth
because a button was pressed.

## Idempotence

Duplicate command delivery must not execute the same action twice.

## Audit

The engine should support a player facing explanation and a developer facing
complete causal trace.
