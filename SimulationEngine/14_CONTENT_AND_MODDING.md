# Content and Modding

## Goal

Separate reusable simulation rules from country, scenario, unit, technology,
event, and strategy content.

## Content categories

1. Countries.
2. Regions.
3. Institutions.
4. Leaders.
5. Factions.
6. Units and platforms.
7. Equipment.
8. Technologies.
9. Laws.
10. Policies.
11. Events.
12. Strategy plans.
13. Scenarios.
14. Sources.
15. Localization.

## Content validation

Content should be validated for:

1. Schema.
2. References.
3. Units.
4. Dates.
5. Geography.
6. Provenance.
7. Compatibility.
8. Balance bounds.
9. Missing localization.
10. Duplicate identifiers.

## Script boundary

Content may configure and compose approved mechanics. It should not bypass
invariants or directly mutate hidden state.

## Historical strategies

Country plans can encode:

1. Initial objectives.
2. Preconditions.
3. Focus areas.
4. Assumptions.
5. Branches.
6. Abort conditions.
7. Review.

Plans should not guarantee historical outcomes.

## Modding ambition

Potential future modding levels:

1. Data only content.
2. Scenario and bookmark creation.
3. Country and strategy content.
4. Interface themes.
5. Approved scripted mechanics.
6. Full simulation extensions through a controlled API.

## Safety and stability

Mods must not:

1. Corrupt saves silently.
2. Break deterministic replay without declaring it.
3. Access hidden multiplayer truth.
4. Execute unrestricted server code.

## Research provenance

Historical content should be able to retain source and confidence metadata even
when distributed as a mod.
