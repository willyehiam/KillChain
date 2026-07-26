# Persistence, Replay, and Multiplayer

## Save model

A future save may contain:

1. Snapshot of authoritative state.
2. Event log after the snapshot.
3. Command log.
4. Random state.
5. Content version.
6. Schema version.
7. Scenario metadata.
8. Player and faction assignments.
9. Optional belief and interface state.

## Replay

A deterministic replay should reconstruct:

1. Authoritative state.
2. Player commands.
3. AI commands.
4. Random samples.
5. Events.
6. Belief updates.
7. Major decision traces.

## Branching history

Players should be able to preserve a campaign state and explore an alternative
decision branch.

Branches should share immutable history until divergence.

## Debugging

Developers should be able to:

1. Jump to an event.
2. Inspect causal parents.
3. Inspect state before and after.
4. Inspect reservations.
5. Inspect AI decision traces.
6. Compare replay outputs.

## Multiplayer principle

An authoritative server should own truth in multiplayer.

Clients:

1. Receive authorized projections.
2. Submit commands.
3. Predict only presentation where safe.
4. Never authoritatively resolve state.

## Single player principle

Single player may run the same simulation package in a worker or local service.

## Synchronization

The protocol needs:

1. Stable command identifiers.
2. Ordering.
3. Idempotence.
4. Acknowledgment.
5. Snapshot recovery.
6. Content compatibility.
7. Desynchronization detection.

## Save evolution

Schema migrations must be versioned and tested against representative campaign
fixtures.

## Privacy and hidden information

Multiplayer projections must not send hidden truth to unauthorized clients,
including truth that the interface merely chooses not to render.
