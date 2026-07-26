# Simulation Test Strategy

## Unit tests

Test local rules such as:

1. Production consumes inputs.
2. Movement consumes time and fuel.
3. Damage reduces capacity.
4. Repair consumes time and resources.
5. Confidence decays.
6. Access changes reach.

## Command tests

Every command should have:

1. Valid success case.
2. Missing authority.
3. Missing resource.
4. Invalid target.
5. Geographic impossibility.
6. Schedule conflict.
7. Duplicate delivery.
8. Cancelation.

## Invariant tests

Run after:

1. Every event in development.
2. Every simulation pulse in test.
3. Every long simulation checkpoint.
4. Every save load.

## Property tests

Generate many legal and illegal states to find:

1. Negative resources.
2. Duplicate assignment.
3. Unbounded loops.
4. Impossible movement.
5. Replay divergence.
6. Aggregation loss.

## Replay tests

1. Execute a scenario.
2. Record commands and seeds.
3. Replay.
4. Compare authoritative state.
5. Compare event stream.
6. Compare permitted belief projections.

## Long simulations

Run AI countries for years without rendering.

Measure:

1. Economic growth.
2. War frequency.
3. War duration.
4. Equipment shortages.
5. Energy shortages.
6. Alliance concentration.
7. Political collapse.
8. Stalemate.
9. Escalation.
10. Simulation performance.

## Counterfactual tests

Run the same starting world with one changed decision and inspect whether the
causal divergence is plausible and bounded.

## Fog of war tests

1. No truth leak.
2. Confidence decay.
3. Source contradiction.
4. Decoy.
5. Track split.
6. Lost custody.
7. Assessment error.
8. Cross institution disagreement.

## Operations tests

1. Actual platform.
2. Actual inventory.
3. Route.
4. Range.
5. Support.
6. Authority.
7. Conflict.
8. Countermeasure.
9. Damage.
10. Assessment.

## Performance tests

Tests should report stable measurements and preserve benchmark fixtures for
regression.

## Failure artifacts

A failed simulation test should save:

1. Seed.
2. Commands.
3. Event log.
4. Minimal state snapshot.
5. Invariant.
6. Reproduction instruction.
