# Engine Principles

## Principle 01: Deterministic authority

The same starting state, command stream, content version, and random seed must
produce the same authoritative result.

## Principle 02: Headless simulation

The simulation must not depend on React, browser rendering, wall clock time, map
animation, or user interface component state.

## Principle 03: Commands do not mutate state

Commands request an action. The engine validates the request and emits explicit
events that change state.

## Principle 04: One state model

National, theater, mission, map, AI, save, replay, and multiplayer systems use
one authoritative ontology.

## Principle 05: Truth and belief are separate

The authoritative world is not automatically available to players or AI
countries.

## Principle 06: Resources are conserved

Personnel, equipment, money, fuel, munitions, transport, platform time, political
authority, and other capacities require identified sources and sinks.

## Principle 07: Time is explicit

Every process has a scheduled start, duration, update rule, completion, and
cancelation behavior.

## Principle 08: Geography is causal

Distance, access, route, throughput, location, network connectivity, and
environment affect outcomes.

## Principle 09: Aggregation preserves truth

Zooming or changing simulation resolution cannot create or erase assets,
resources, damage, orders, uncertainty, or dependencies.

## Principle 10: Effects are auditable

Every meaningful outcome can be traced to commands, events, resources,
assumptions, and uncertainty.

## Principle 11: Content is data driven

Countries, institutions, units, platforms, technologies, laws, events, plans,
and scenarios should use validated content schemas wherever possible.

## Principle 12: Performance is measured

Optimization follows profiling. Technology changes require an observed
bottleneck and benchmark.

## Principle 13: Failure is explicit

A command succeeds, fails validation, is delayed, is canceled, or partially
executes through named events. Silent failure is invalid.

## Principle 14: Compatibility is designed

Saves, replays, content versions, and multiplayer require stable identifiers,
versioned schemas, and migration policy.

## Principle 15: The interface is a projection

The UI presents authorized views and submits commands. It does not invent game
rules or directly modify authoritative state.
