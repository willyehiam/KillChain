# KillWeb World Research Corpus

## Status

The research stage is active.

The approved brainstorming constitution is the design authority for research
priorities. Large scale collection is incomplete, and no file in this directory
should be interpreted as a live or exhaustive picture of the world.

Research may populate sourced historical and structural data. It may not silently
turn provisional findings into game rules or begin simulation engine
implementation.

## Purpose

Build a sourced, temporal, uncertain, maintainable representation of the modern
world that can eventually initialize and update KillWeb campaigns.

The corpus exists to answer player and simulation questions such as:

1. What capabilities does a country plausibly possess?
2. Which institutions can authorize or execute an action?
3. Which fixed facilities, networks, routes, industries, and resources make an
   action possible?
4. What was publicly observed in a theater at a particular time?
5. What is known, estimated, disputed, designed, or deliberately abstracted?
6. Which facts materially change gameplay?

## Nonnegotiable rules

1. Every factual claim has a source and an as of date or observation interval.
2. Exact coordinates appear only when a public source supports that precision.
3. Mobile force locations require an observation time and expire as current
   information after their evidence window.
4. A sortie is not an airframe.
5. Peak detected presence is not a unique platform total.
6. A formation is not a launcher count.
7. A munition count is not a delivery platform count.
8. Unknown is a valid value.
9. Designed and synthetic game data must never masquerade as observed history.
10. Research precision is justified by gameplay value, not collected for its own
    sake.

## Directory map

1. `countries/` owns country dossiers and the future top 80 cohort.
2. `theaters/` owns wars, military crises, force activity, and operational
   geography.
3. `political_event_chains/` owns nonmilitary events that can alter the campaign
   starting state.
4. `global_infrastructure/` owns network and strategic asset taxonomies.
5. `sources/` owns source registry and archival conventions.
6. `schemas/` owns machine readable data contracts.
7. `METHODOLOGY.md` defines the research workflow.
8. `SOURCE_POLICY.md` defines evidence acceptance and safety.
9. `DATA_DICTIONARY.md` defines common fields and units.
10. `TOP_80_COUNTRIES.md` owns country cohort selection.
11. `RESEARCH_QUEUE.md` owns execution order and status.
12. `RESEARCH_STAGE_KICKOFF.md` owns the active stage charter and quality gates.

## Evidence states

Every claim must use one of:

1. `observed`
2. `official_claim`
3. `independently_reported`
4. `inferred`
5. `estimated`
6. `disputed`
7. `designed`
8. `synthetic`
9. `unknown`

These states describe epistemic status. They do not describe which faction in the
game knows the claim. Faction belief states are generated later by the
simulation.

## Geospatial states

Every location must use one of:

1. `fixed_exact`
2. `fixed_approximate`
3. `reported_point`
4. `reported_area`
5. `route`
6. `administrative_area`
7. `synthetic_region`
8. `withheld`
9. `unknown`

A numeric precision value and the source must accompany any point or polygon.

## Corpus workflow

1. Define a gameplay question.
2. Register candidate sources.
3. Extract atomic claims.
4. Normalize time, geography, units, and entity identity.
5. Record contradictions instead of overwriting them.
6. Review confidence and independence.
7. Translate approved claims into a simulation representation proposal.
8. Validate schemas and cross references.
9. Record a review date.
10. Publish a coherent checkpoint.

## First benchmark

Justice Mission 2025 is the initial methodology benchmark because existing
project research already distinguishes exercise polygons, ships, Coast Guard
vessels, aircraft sorties, firing formations, rockets, and uncertain unique
platform counts.

The benchmark must be normalized into this corpus before the same method is
scaled to other theaters.
