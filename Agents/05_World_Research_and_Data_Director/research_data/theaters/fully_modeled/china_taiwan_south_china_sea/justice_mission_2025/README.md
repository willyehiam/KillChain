# Justice Mission 2025 Benchmark

## Purpose

This directory is the first end to end test of the KillWeb research method.

The benchmark is intentionally strict. It preserves reporting windows, source
perspective, force measure types, exact public exercise geography, and unresolved
contradictions. It does not invent a complete order of battle.

## Scope

1. Exercise name: Justice Mission 2025.
2. Primary activity: 2025-12-29 through 2025-12-31.
3. Public live fire window: 2025-12-30 from 08:00 to 18:00 UTC+8.
4. Theater: Taiwan Strait and surrounding waters and airspace.
5. Actors represented in this checkpoint: PLA Eastern Theater Command, PLA
   service elements, China Coast Guard, Taiwan Ministry of National Defense, and
   Taiwan response forces where publicly reported.

## Files

1. `manifest.json`: dataset identity, coverage, sources, and known gaps.
2. `sources.ndjson`: one source record per line.
3. `exercise_zones.geojson`: five exact polygons publicly announced by the
   Eastern Theater Command through Xinhua.
4. `force_measures.json`: reporting window observations with explicit units.
5. `claims.ndjson`: atomic claims and candidate identifications.
6. `contradictions.ndjson`: unresolved and partially reconciled claim sets.
7. `CONTRADICTIONS.md`: human readable interpretation rules.
8. `VALIDATION.md`: validation state and remaining checks.

## Confirmed baseline

1. The Eastern Theater Command announced drills around Taiwan beginning on
   December 29, 2025.
2. The announced mission themes included sea and air readiness patrols, seizure
   of comprehensive superiority, blockade of key ports and areas, and deterrence
   of external intervention.
3. Five live fire polygons were publicly announced for December 30.
4. Taiwan reported 130 PLA aircraft sorties, 14 PLAN ships, and 8 official ships
   during the 24 hours ending at 06:00 on December 30.
5. Taiwan reported 77 PLA aircraft sorties, 17 PLAN ships, and 8 official ships
   during the 24 hours ending at 06:00 on December 31.
6. The two complete Taiwan reporting windows therefore total 207 sorties. This
   is not a count of unique aircraft.
7. The maximum PLAN count in those two complete reporting windows is 17 ships.
   The counts must not be added into 31 unique ships.
8. Public reporting supports 27 rocket impacts from two firing periods. It does
   not support a public exact launcher count.

## Important distinctions

1. The 71 aircraft figure is an interim second day snapshot reported by 15:00.
2. The 77 aircraft figure covers the complete 24 hour window ending at 06:00 the
   following morning.
3. The 15 China Coast Guard vessel figure is an exercise specific snapshot.
4. The 8 official ship figures are standard Taiwan daily reports with a
   different reporting scope.
5. Those pairs are not direct contradictions once their time and scope are
   retained.
6. Named hulls do not prove the total unique ship count.
7. A Type 075 class identification does not by itself settle which hull
   participated.
8. PHL-16 or PCL-191 identification is an inference unless a primary source
   identifies the firing system.

## Current quality state

1. Exact five zone geometry: high confidence.
2. Complete daily sortie and PLAN counts: high confidence as Taiwan official
   observations.
3. Exercise objectives: high confidence as an official PRC claim.
4. Rocket count: medium confidence pending direct primary source extraction.
5. Ground formation identity: medium confidence pending primary source
   validation.
6. Individually named PLAN hulls: collecting.
7. Individually named Coast Guard hulls: collecting.
8. Exact additional warning zones: unresolved.
9. Unique aircraft and launcher counts: unknown.

## Simulation use

This benchmark can later support:

1. A precrisis exercise that can become a quarantine or blockade.
2. Time bounded exclusion areas that disrupt civilian movement.
3. Aggregate sortie generation from unknown unique airframes.
4. Naval and Coast Guard presence without omniscient identity.
5. Political warfare and external intervention deterrence objectives.
6. Fog of war in which official reporting, sensor observations, and actor claims
   diverge.

It is not yet an approved scenario starting state.
