# Justice Mission 2025 Validation Report

## Checkpoint

1. Validation date: 2026-08-01.
2. Dataset version: 0.1.0.
3. Dataset status: collecting.
4. Machine readable files checked: 6.
5. Result: pass for the checks listed below.

## Record counts

1. Registered sources: 7.
2. Atomic claims: 20.
3. Contradiction sets: 6.
4. Force observations: 13.
5. Derived force measures: 4.
6. Exact initial exercise polygons: 5.

## Checks passed

1. JSON and NDJSON syntax.
2. Stable identifier format.
3. Identifier uniqueness within each record class.
4. Manifest source references.
5. Manifest contradiction references.
6. Claim source references.
7. Contradiction claim and source references.
8. Derived force measure input references.
9. GeoJSON feature collection type.
10. Five expected initial polygons present.
11. Polygon ring closure.
12. Longitude and latitude bounds.
13. Minimum required source fields.
14. Minimum required claim fields.
15. Minimum two claims per contradiction set.

## Semantic checks passed by review

1. 207 is represented as a sortie total, not unique aircraft.
2. 17 is represented as PLAN peak presence across complete daily windows, not 31
   unique ships.
3. 27 is represented as reported munitions, not launcher count.
4. 71 and 77 retain their different information cutoffs.
5. Five exact polygons remain distinct from later reported warning areas.
6. Type 075 class participation remains distinct from hull identity.
7. Standard official ship reports remain distinct from the exercise specific
   Coast Guard peak.
8. Founder supplied asset identities are preserved as discovery leads and not
   verified facts.

## Not yet validated

1. Full JSON Schema evaluation through a dedicated validator.
2. Exact geometry of later warning areas.
3. Original language validation of every named PLAN hull.
4. Atomic primary evidence for every named Coast Guard hull.
5. Exact Type 075 hull identity.
6. Exact rocket system designation.
7. Exact firing unit echelon below brigade level.
8. Direct primary source for the 27 rocket impact breakdown.
9. Exact start and end time of every exercise activity.
10. Independent geospatial reconstruction of vessel routes.

## Acceptance result

The dataset is accepted as a collecting benchmark. It is not yet eligible for
`verified` status and is not an approved historical scenario starting state.

The next acceptance review requires recovery of primary material for the rocket
firings, later warning areas, and named asset identities.
