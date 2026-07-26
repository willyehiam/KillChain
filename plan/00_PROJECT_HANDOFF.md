# KillWeb Project Handoff

## One sentence

KillWeb is a web based modern grand strategy game in which the player governs a
real country, changes history from a recognizable contemporary starting point,
and can move fluidly from Civilization style national abstraction to HOI4 style
theater command and Maven inspired intelligence and mission execution.

## Current project state

1. The project was originally named KillChain.
2. A first playable Justice Mission prototype was built.
3. The prototype demonstrated a map first command interface, deterministic
   simulation, fog of war, track custody, package composition, authorization,
   execution, adversary reactions, and combat assessment.
4. The first prototype exposed serious limitations in scope, causality,
   readability, map quality, unit provenance, strategic depth, and world
   simulation.
5. The preserved prototype lives on the `OGKillChain` branch.
6. The active `main` branch now begins the KillWeb planning lineage.
7. KillWeb must aim at no less than HOI4 scale of gameplay depth.
8. KillWeb remains in brainstorming. A parallel public source research corpus
   workstream is authorized, but engine implementation, visual redesign, and a
   production coding swarm remain gated.

## Founder intent

The player should feel like an all seeing strategic power similar to Civilization
or HOI4, not like an employee trapped in a perfectly realistic government role.
Complex systems should be abstracted into legible and enjoyable decisions.

The player must still be able to open the abstraction and inspect the actual
forces, sensors, logistics, intelligence, routes, weapons, support platforms,
authorities, risks, and assessment evidence behind an operation.

The world should remain open after any initial crisis. Successfully defending
Taiwan does not end the game. The player may pursue a radically different grand
strategy, including diplomacy, economic coercion, regime competition, alliance
restructuring, proxy activity, or further war.

## Product thesis

Every strategic decision can be opened until the player can see the assets,
information, institutions, dependencies, and risks that make it possible, but the
player is never forced to micromanage them.

## Minimum ambition

1. One persistent world rather than isolated scenario boxes.
2. Real time with pause.
3. A recognizable modern historical starting condition.
4. Eventually playable from the perspective of approximately the 80 highest GDP
   nations.
5. National systems at least comparable in depth to a modern HOI4 conversion.
6. More granular modern military command than Civilization.
7. Optional individual mission and intelligence depth.
8. Adaptive country AI with genuine fog of war.
9. A map first web interface with a real pannable and zoomable world map.
10. Deterministic simulation, replay, resource conservation, and auditable
    causality.

## Immediate instruction for a new AI

1. Read this directory before proposing work.
2. Do not mistake the existing prototype for the intended final architecture.
3. Do not begin implementation while the project remains in brainstorming.
4. Do not reduce the vision to a Taiwan crisis simulator.
5. Do not add technical looking interface elements without a decision purpose.
6. Do not permit military effects without actual platforms and support.
7. Do not claim precise historical knowledge without a source and confidence.
8. Preserve `OGKillChain`.
9. Treat `main` as KillWeb.
10. Record every new durable decision in `22_DECISION_LOG.md`.
11. Treat architecture essays as brainstorming inputs, not as proof that the
    brainstorming stage is complete.
12. Store research work under
    `Agents/05_World_Research_and_Data_Director/research_data/`.

## Canonical north star questions

1. What decision is the player trying to make?
2. Why is that decision fun?
3. What information does the player receive?
4. What remains uncertain?
5. What actions can the player take?
6. What capacity, institution, asset, or authority makes the action possible?
7. What other systems will react?
8. What is deliberately abstracted?
9. What can go wrong?
10. How will the game explain the result?
