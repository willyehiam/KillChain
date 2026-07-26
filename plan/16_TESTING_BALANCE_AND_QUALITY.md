# Testing, Balance, and Quality

## Quality statement

KillWeb must be treated like a serious grand strategy game, not a collection of
generated interface demos.

## Simulation tests

1. Unit tests.
2. Command validation tests.
3. Event transition tests.
4. Invariant tests.
5. Deterministic replay tests.
6. Save and migration tests.
7. Long simulation tests.
8. Cross system integration tests.
9. Faction belief tests.
10. Impossible transition tests.

## Conservation tests

1. Personnel.
2. Money.
3. Equipment.
4. Munitions.
5. Fuel.
6. Industrial output.
7. Transport capacity.
8. Political authority.
9. Intelligence collection capacity.
10. Platform time.

## Strategic balance tests

1. Infinite loops.
2. Dominant strategies.
3. Useless mechanics.
4. Impossible counters.
5. Broken incentives.
6. Unbounded growth.
7. Permanent stalemate.
8. Automatic escalation.
9. Riskless aggression.
10. Overpowered information.
11. Alliance exploitation.
12. Economy and military disconnect.

## Kill web audits

1. Lost tracks.
2. Stale intelligence.
3. Decoys.
4. Duplicate tracks.
5. Collateral shielding.
6. Authorization failures.
7. Platform conflicts.
8. Support conflicts.
9. Unreachable targets.
10. Uncertain damage assessment.
11. False positive assessment.
12. Restrike logic.

## AI playtests

1. United States.
2. China.
3. Taiwan.
4. Iran.
5. Israel.
6. Gulf states.
7. Russia.
8. Ukraine.
9. Japan.
10. Secondary regional actors.

Each should play under genuine fog of war.

## Interface tests

1. Every panel.
2. Every menu.
3. Every modal.
4. Every tooltip.
5. Every overlay.
6. Every empty state.
7. Every loading state.
8. Every disabled state.
9. Every error state.
10. Extreme data states.
11. Long labels.
12. Large numbers.
13. Dense map clusters.
14. Keyboard and pointer interaction.

## Visual quality

1. Text never escapes its container.
2. Contrast remains readable.
3. Labels avoid collisions where possible.
4. Important map symbols remain distinct.
5. Motion is clear at every time speed.
6. Panels do not unnecessarily hide the map.
7. Supported desktop resolutions remain usable.
8. Supported browsers render consistently.

## Performance tests

Stress:

1. Tracks.
2. Formations.
3. Platforms.
4. Sensors.
5. Operations.
6. Infrastructure nodes.
7. Routes.
8. Simultaneous engagements.
9. AI countries.
10. Long campaign duration.

## Armchair General standard

The critic should ask:

1. Is this a real strategic choice or a scripted button?
2. Does the opponent have a counter?
3. Does the effect consume actual capacity?
4. Does geography matter?
5. Does intelligence matter?
6. Can the plan fail for understandable reasons?
7. Does this system interact with the rest of the game?
8. Is the game pretending to be deep through terminology?

## Release gate

A milestone is not complete because it renders. It must play, explain, replay,
survive adversarial strategies, and remain coherent under stress.
