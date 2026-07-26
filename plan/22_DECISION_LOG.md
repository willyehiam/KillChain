# Decision Log

## 2026 07 25: Initial ambition

### Decision

Build a highly detailed modern war and geopolitical simulator for the web,
influenced by Civilization, Hearts of Iron, Palantir Gotham, Maven, and Anduril.

## 2026 07 25: Kill chain as playable mechanic

### Decision

Intelligence collection, target discovery, identification, custody, package
selection, authorization, execution, and uncertain assessment must be actual
mechanics.

## 2026 07 25: Depth standard

### Decision

The game may contain Civilization and Hearts of Iron levels of complexity.
Simplicity must not come from removing meaningful systems.

## 2026 07 25: Quality agents

### Decision

Future development must include faction playtests, strategic personalities,
exploit hunters, kill chain auditors, systems auditors, performance agents,
interface agents, visual auditors, and a hostile Armchair General critic.

## 2026 07 25: Map first interface

### Decision

The main screen is the map. Systems overlay the map. The map is not a secondary
panel.

## 2026 07 25: Real map

### Decision

Use actual world geography with pan, zoom, designed overlays, satellite imagery,
and meaningful movement rather than invented line drawn borders.

## 2026 07 25: Progressive complexity

### Decision

The basic loop must be simple and repeatable. Players discover deeper systems
progressively.

## 2026 07 25: Player scope

### Decision

The player should have broad Civilization and HOI4 style control. Realistic
institutional detail should create strategy without turning the game into work.

## 2026 07 25: Persistent world

### Decision

Use one world. Other simultaneous crises remain part of the strategic chessboard.

## 2026 07 25: Time model

### Decision

Real time with pause.

## 2026 07 25: Command resolution

### Decision

Support national, city or base, formation, and individual strategic unit
resolution. Allow immediate movement between aggregated and detailed views.

## 2026 07 25: Military domains

### Decision

Include maritime, air, ground, space, cyber, information, logistics, political,
and economic conflict.

## 2026 07 25: Mission reach

### Decision

Routes, distance, basing, fuel, refueling, support assets, readiness, and base
survival must determine mission feasibility.

## 2026 07 25: Tutorial

### Decision

The opening ten minutes should introduce a legible crisis and the basic decision
loop rather than expose every system.

## 2026 07 25: Visual direction

### Decision

Target a balance of Brass Hands polish and Palantir operational clarity.

## 2026 07 25: Interface restraint

### Decision

Remove performative technical ornament, tiny text, thin typography, and weak
contrast. Every interface element must be useful.

## 2026 07 25: Justice Mission reference

### Decision

Use Justice Mission 2025 public exercise geography and reported force activity
as a historical source for a Taiwan crisis scenario, while clearly labeling
fictional divergence.

## 2026 07 26: Causal packages

### Decision

Every mission package must identify its delivery platform, support, origin,
route, range, inventory, authority, risk, and assessment evidence.

## 2026 07 26: Branch preservation

### Decision

Preserve the first playable version on `OGKillChain`.

## 2026 07 26: Minimum strategic depth

### Decision

The expanded game should target at least HOI4 scale gameplay depth.

## 2026 07 26: Playable nation ambition

### Decision

Eventually support approximately the top 80 countries by GDP as playable
countries through shared systems, archetypes, regional content, and bespoke major
power content.

## 2026 07 26: Current starting window

### Decision

Use summer or fall 2026 as the current target bookmark window, subject to later
research and exact date selection.

## 2026 07 26: Rename

### Decision

Graduate the project name from KillChain to KillWeb because the scope now
includes the complete web of national power, information, logistics, command,
effects, and consequence.

## 2026 07 26: Mainline

### Decision

`main` is the active KillWeb line. `OGKillChain` remains the preserved prototype.

## 2026 07 26: Current stage

### Decision

Remain in brainstorming. Do not advance into research, design, engineering, or
development until the relevant gate is approved.

## 2026 07 26: Parallel research corpus

### Decision

While brainstorming remains open, authorize the World Research and Data Director
to build corpus infrastructure and begin bounded public source collection for
the top 80 country ambition, strategic infrastructure, major theaters, secondary
crises, and political event chains.

### Constraint

This is a parallel workstream, not a declaration that the full research stage has
begun. Research may inform brainstorming but may not silently lock game design.

## 2026 07 26: Brainstorming answer status

### Decision

The architecture thesis derived from Difficulty and AI and Hearts of Iron IV is
an important brainstorming input. It is not the final answer to the brainstorming
stage.

## 2026 07 26: Publishing cadence

### Decision

Publish coherent, validated checkpoints to GitHub `main` frequently rather than
holding a large body of local work for one final push.

## 2026 07 26: WebGPU first, accessible fallback

### Decision

Use WebGPU as the premium rendering and optional nonauthoritative compute path,
but do not make WebGPU the only way to play.

The future client should support:

1. WebGPU core for the highest visual density and effects.
2. WebGPU compatibility mode when available on older graphics stacks.
3. A reduced WebGL2 renderer for supported browsers or devices without WebGPU.

The authoritative deterministic simulation must remain renderer independent.
