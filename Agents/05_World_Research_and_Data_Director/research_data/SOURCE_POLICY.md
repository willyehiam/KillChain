# Source and Safety Policy

## Purpose

Ensure that KillWeb research is accurate enough to support a serious game,
maintainable enough to survive time, and disciplined enough not to become an
unsourced or live targeting database.

## Source priority

### Tier A: Primary and authoritative

1. Laws, budgets, treaties, and official statistical releases.
2. Defense ministry and military publications.
3. International organizations.
4. Government geospatial and infrastructure datasets.
5. Company filings and operator documentation.
6. Court records and election authorities.

Primary does not mean unbiased. Official claims still require an epistemic label.

### Tier B: Independent professional reporting

1. Reputable international and local news organizations.
2. Peer reviewed research.
3. Established research institutes.
4. Professional trade and industry publications.
5. Audited commercial or nonprofit datasets.

### Tier C: Specialist open source analysis

1. Analysts who publish sources and methodology.
2. Vessel or aircraft identification with reproducible evidence.
3. Geolocation analysis with visible landmarks or imagery provenance.
4. Conflict databases with documented coding rules.

### Tier D: Discovery only

1. Wikipedia.
2. Aggregator pages.
3. Social posts without provenance.
4. Search snippets.
5. Anonymous claims.

Tier D may identify a lead. It may not be the sole basis for a high confidence
simulation fact.

## Source registry requirements

Record:

1. Stable source ID.
2. Title.
3. Publisher.
4. Author when available.
5. Publication date.
6. Observation interval when different.
7. URL or archive reference.
8. Access date.
9. Source tier.
10. Language.
11. License or usage note.
12. Relevant pages, table, figure, timestamp, or section.
13. Reliability notes.

## Independence

Five outlets repeating one wire report are one evidentiary chain, not five
independent confirmations.

Record `derived_from_source_ids` whenever a source depends on another known
source.

## Geospatial policy

### Fixed public facilities

Exact public coordinates may be stored when:

1. The facility is publicly acknowledged.
2. The source already publishes the location at that precision.
3. The coordinate represents the facility, not an inferred vulnerable component.
4. The gameplay need is documented.

### Networks

Electricity, communications, fuel, and transport systems should usually be
represented as public regional networks and strategic nodes. The corpus does not
claim to know every local substation, switch, valve, depot, or control system.

### Mobile assets

Mobile asset records must:

1. Include `observed_at` or an interval.
2. Include the observation source.
3. Include precision and confidence.
4. Expire from any current picture.
5. Never be labeled real time unless the application is actually ingesting a
   lawful public live source and the project has separately approved that use.

KillWeb's historical bookmarks and fictional scenarios do not need a live
operational tracking system.

### Sensitive detail

Do not enrich public facility records with speculative weak points, access
routes, security procedures, or attack instructions. Game vulnerability is
modeled through abstract attributes and network dependencies.

## Confidence vocabulary

1. `confirmed`: direct, authoritative, and independently consistent.
2. `high`: strong evidence with minor uncertainty.
3. `medium`: credible but incomplete or partly inferred.
4. `low`: plausible lead requiring verification.
5. `disputed`: credible evidence materially conflicts.
6. `unknown`: evidence cannot support a value.

## Corrections

Never silently replace a material claim.

1. Add the corrected claim.
2. Deprecate the previous claim.
3. Link the replacement.
4. Explain the correction.
5. Preserve provenance.
