# Project Lineage

## Phase 01: KillChain concept

The initial concept centered on a highly performant WebGL or WebGPU simulator for
modern crises, especially the Taiwan Strait. The desired influences included
Civilization, Hearts of Iron, Palantir Gotham, Anduril, and modern defense
technology interfaces.

The proposed conflict catalog expanded quickly across Europe, the Middle East,
Africa, South Asia, East Asia, maritime chokepoints, the Pacific, and alternative
history.

The design included conventional warfare, information warfare, gray zone
activity, cyber operations, economic pressure, political influence, special
operations, proxy support, infrastructure disruption, blockade, deception, and
covert action.

## Phase 02: Kill chain depth

The defining military interaction became:

1. Gather intelligence.
2. Reveal possible targets.
3. Find and classify actual targets.
4. Maintain custody while the adversary hides or deceives.
5. Select desired effects and packages.
6. Obtain authorization.
7. Execute with actual assets.
8. Assess uncertain results.
9. Decide whether to restrike, retask, or disengage.

## Phase 03: First playable prototype

The first build explored:

1. A Taiwan Strait map.
2. Real time with pause and time acceleration.
3. Moving tracks.
4. Fog of war.
5. A track selection panel.
6. A decision loop.
7. Effects packages.
8. Authorization.
9. Execution.
10. Combat assessment.
11. Deterministic adversary reactions.
12. Justice Mission scenario data.

## What the prototype proved

1. The map can be the primary interaction surface.
2. Track confidence and custody can create gameplay.
3. An effects package is more interesting than clicking one unit to attack
   another.
4. Assessment should remain uncertain.
5. A deterministic simulation can support replay and audits.
6. Historical scenario research can translate into playable pressure.

## What the prototype failed to prove

1. A global world simulation.
2. National economics, politics, science, culture, religion, and industry.
3. Theater logistics and real order of battle.
4. Actual platform provenance for every mission.
5. Adaptive national AI.
6. Long campaign progression.
7. A polished world map at multiple scales.
8. A readable and intuitive interface.
9. HOI4 scale strategic depth.
10. A coherent abstraction model for approximately 80 playable countries.

## Important player criticism of the prototype

1. The original line drawn geography did not feel like a real map.
2. The map initially occupied only a section rather than serving as the base
   screen.
3. Units and time acceleration did not make the world feel alive enough.
4. Text was too small, thin, low contrast, and performative.
5. Some buttons and workbenches did not work.
6. Effects packages were ambiguous.
7. The player could not tell whether a strike came from air, sea, land, or
   underwater.
8. The game appeared to permit effects without visible or reachable friendly
   assets.
9. A target could continue moving after multiple high confidence destruction
   assessments.
10. The mechanics felt closer to a prototype workflow than a game.

## Phase 04: KillWeb

KillWeb retains the strongest idea from KillChain but expands the subject from
one engagement chain to the web of national power that creates, constrains, and
reacts to every engagement.

The new minimum ambition is HOI4 scale gameplay depth in a contemporary global
simulation.

## Branch policy

1. `OGKillChain` preserves the first version.
2. `main` is the KillWeb line.
3. Old code may be studied, reused, or replaced.
4. The new architecture must not be selected merely because the prototype
   already implemented it.
