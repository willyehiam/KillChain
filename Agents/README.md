# KillWeb Agent Studio

This directory defines ten persistent studio roles. These are ownership
boundaries, not ten autonomous coders editing the same files.

## Operating rule

At most three agents should write production code concurrently during a future
development stage. The remaining agents should specify, research, review,
simulate, test, critique, or integrate.

Every task must declare:

1. The player decision it is intended to create.
2. The files and schemas it may change.
3. The files and schemas it may not change.
4. The invariants that must remain true.
5. The expected player facing result.
6. The automated acceptance checks.
7. The performance budget.
8. The owner responsible for integration.

## Canonical roles

1. `01_Game_Director`
2. `02_Core_Gameplay_Designer`
3. `03_Simulation_Architect`
4. `04_Geopolitics_and_Country_AI_Architect`
5. `05_World_Research_and_Data_Director`
6. `06_Military_Intelligence_and_Operations_Designer`
7. `07_Economy_Society_and_Politics_Designer`
8. `08_Map_Interface_and_Experience_Lead`
9. `09_QA_Balance_and_Adversarial_Playtest_Lead`
10. `10_Integration_Performance_and_Production_Lead`

## Decision authority

The Game Director resolves product conflicts. The Simulation Architect controls
authoritative state contracts. The Integration Lead controls merges and release
quality. No specialist may silently invent a second state model, event system,
map ontology, or resource economy inside its own feature.

## Critique and playtest personas

Faction players, strategic personality players, exploit hunters, kill web
auditors, systems auditors, performance agents, interface agents, visual
auditors, and the Armchair General are temporary assignments coordinated by the
QA and Adversarial Playtest Lead.

They attack the game. They do not independently redefine it.
