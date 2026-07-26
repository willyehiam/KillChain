# KillWeb Simulation Engine

This directory documents the provisional architecture of the future KillWeb
simulation.

## Status

Brainstorming artifact only.

This directory does not authorize implementation. It records principles,
contracts, alternatives, invariants, and open technical questions so future
design and engineering agents share one conceptual foundation.

## Central requirement

Build one deterministic causal world simulation that can be viewed and commanded
at national, theater, formation, platform, and intelligence track resolutions.

## Proposed conceptual flow

1. Previous authoritative state.
2. Player or AI command.
3. Command validation.
4. Resource and authority reservation.
5. Seeded uncertainty.
6. Authoritative events.
7. New authoritative state.
8. Faction observations.
9. Updated faction beliefs.
10. Interface projection.

## Reading order

1. `00_ENGINE_PRINCIPLES.md`
2. `01_STATE_MODEL.md`
3. `02_TIME_SCHEDULING_AND_EVENTS.md`
4. `03_TRUTH_BELIEF_AND_INTELLIGENCE.md`
5. `04_SPATIAL_MODEL_AND_RESOLUTION.md`
6. `05_COMMAND_EVENT_AND_CAUSALITY.md`
7. `06_RESOURCES_AND_INVARIANTS.md`
8. `07_COUNTRY_AI_ARCHITECTURE.md`
9. `08_OPERATIONS_AND_MISSION_PACKAGES.md`
10. `09_NATIONAL_SYSTEMS_AND_NETWORKS.md`
11. `10_PERSISTENCE_REPLAY_AND_MULTIPLAYER.md`
12. `11_WEB_RUNTIME_AND_PERFORMANCE.md`
13. `12_TEST_STRATEGY.md`
14. `13_SCHEMA_BACKLOG.md`
15. `14_CONTENT_AND_MODDING.md`
16. `15_TECHNOLOGY_OPTIONS.md`
17. `16_OPEN_ENGINE_QUESTIONS.md`

## Prototype relationship

The existing `lib/sim.ts` proves useful concepts but is not automatically the
future KillWeb engine. It should be studied for deterministic mechanics and
discarded where it constrains the larger architecture.
