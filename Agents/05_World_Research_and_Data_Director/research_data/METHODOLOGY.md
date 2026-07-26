# Research Methodology

## 1. Begin with a decision

Research starts with a player or simulation decision, not with a desire to scrape
everything.

Example:

> Can this country sustain a distant air campaign after losing access to its
> closest base?

That question requires basing, aircraft roles, tanker availability, fuel,
munitions, access agreements, route distance, readiness, and alternate airfields.
It does not require every administrative building on every base.

## 2. Separate sources from claims

A source is a document, dataset, image, map, database, statement, or report.

A claim is one atomic proposition extracted from one or more sources.

One source may support many claims. Several sources may support or contradict one
claim. Simulation entities should never cite an entire bibliography when the
actual supporting passage is unknown.

## 3. Build temporal truth

All research is time bounded.

Use:

1. `published_at` for when a source appeared.
2. `observed_at` for a point observation.
3. `valid_from` and `valid_to` for an interval.
4. `as_of` for a source snapshot.
5. `review_after` for maintenance.

If a ship was observed at a coordinate on one date, the corpus records a dated
observation. It does not convert that observation into the ship's present
location.

## 4. Normalize identity

Every durable entity receives a stable corpus ID.

Identity resolution should record:

1. Official name.
2. Common English name.
3. Native name.
4. Aliases.
5. Country.
6. Organization.
7. Platform, facility, formation, or network class.
8. Known identifiers such as hull number or ICAO code.
9. Identity confidence.

Two reports that may refer to the same platform remain separate until evidence
supports a merge.

## 5. Normalize force measures

Every number must declare its measure:

1. Unique platform.
2. Detected platform.
3. Peak simultaneous presence.
4. Sortie.
5. Formation.
6. Unit.
7. Personnel.
8. Launcher.
9. Munition.
10. Event.
11. Estimate range.

Counts with different measures must not be added.

## 6. Normalize geography

For each geometry record:

1. Coordinate reference system.
2. Geometry type.
3. Precision in meters when meaningful.
4. Location status.
5. Source.
6. Observation or validity time.
7. Whether the geometry is public, inferred, synthetic, or withheld.

Public map coordinates may still be approximate. A point at the center of a large
base should not imply meter level knowledge of a specific asset.

## 7. Score evidence

Confidence is a structured judgment, not a decorative percentage.

Evaluate:

1. Source proximity to the event.
2. Source competence.
3. Source incentives and bias.
4. Independence from other cited sources.
5. Temporal proximity.
6. Geospatial precision.
7. Internal consistency.
8. Corroboration.
9. Contradiction.
10. Whether the claim is direct or inferred.

The corpus stores both a categorical confidence and the reasoning.

## 8. Preserve contradictions

When credible sources disagree:

1. Keep each atomic claim.
2. Link them through a contradiction set.
3. Describe the disagreement.
4. Record which interpretation the scenario currently uses.
5. Keep the alternative available for later review or uncertainty modeling.

Do not collapse disagreement into false precision.

## 9. Translate into game representation

Research and simulation data are separate layers.

Each approved claim may propose:

1. Individual representation.
2. Formation representation.
3. Regional capacity.
4. Network edge or node.
5. Event modifier.
6. Country capability.
7. Starting belief.
8. Scenario branch.
9. Synthetic abstraction.
10. No gameplay representation.

The game design team decides which proposal is fun and necessary.

## 10. Review and maintenance

Every dossier has:

1. Owner.
2. Status.
3. Coverage window.
4. Last reviewed date.
5. Next review trigger.
6. Known gaps.
7. Open contradictions.
8. Schema version.

Fast changing data receives shorter review intervals than geography or historical
events.
