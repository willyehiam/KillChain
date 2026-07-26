# Interface, Map, and Design System

## Core interface rule

The world map is the base screen. Systems appear on, over, beside, and through
the map when relevant. The map is not a rectangular widget inside a dashboard.

## Map requirements

1. Real world geography.
2. Panning.
3. Zooming.
4. Rotation where useful.
5. Dark vector geography by default.
6. Immediate satellite imagery toggle.
7. A globe at strategic zoom.
8. Visible satellite orbits and space assets when relevant.
9. Designed theater and area of interest overlays.
10. Smooth movement at all supported time speeds.
11. Formation aggregation at distant zoom.
12. Individual unit selection at closer zoom.
13. Routes, ranges, sensor coverage, and logistics.
14. Civilian and military movement.
15. Temporal playback and forecast where appropriate.

## Unit and formation symbols

Symbols must communicate:

1. Domain.
2. Affiliation.
3. Unit or platform type.
4. Formation membership.
5. Readiness.
6. Movement.
7. Confidence when observed by an adversary.
8. Selected or tasked state.
9. Damage or degraded capability.
10. Civilian status.

Symbols should be visually distinct without requiring labels at all times.

## Motion

Most mobile military and civilian entities should move according to orders,
routes, patrol patterns, missions, schedules, or simulated activity.

Time acceleration must visibly accelerate:

1. Movement.
2. Patrols.
3. Flights.
4. Shipping.
5. Sensor revisits.
6. Plans.
7. Construction.
8. Production.
9. Political and diplomatic events.

Stationary equipment remains stationary unless it disperses, redeploys, or
moves.

## Design influences

The desired balance is approximately:

1. Half Brass Hands level clarity, polish, restraint, and intentionality.
2. Half Palantir style map operations, workbenches, data provenance, and
   decision workflows.

Civilization contributes legibility and abstraction.

HOI4 contributes dense strategic overlays and map based command.

Technical mono and surveillance references may influence tone, but they cannot
become decorative role play.

## Interface philosophy

The Maven lesson is not dark panels. It is helping ordinary operators make sense
of complicated webs of data.

Every interface element should answer at least one question:

1. What is happening?
2. How certain are we?
3. When was this updated?
4. What is the source?
5. Why does it matter?
6. What can I do?
7. What will that require?
8. What could go wrong?
9. What changed after I acted?

## Readability requirements

1. Strong contrast.
2. Comfortable body text.
3. Clear type hierarchy.
4. No tiny decorative metadata.
5. No thin text on dark surfaces.
6. No overflow.
7. No clipped labels.
8. No permanent panel that obscures map context without purpose.
9. Clear button states.
10. Clear empty, loading, disabled, and error states.

## Workbenches

Potential contextual workbenches include:

1. Country.
2. Economy.
3. Diplomacy.
4. Theater.
5. Intelligence collection.
6. Track.
7. Target nomination.
8. Mission package.
9. Logistics.
10. Combat assessment.
11. Infrastructure.
12. Technology.
13. Politics.

They open over the map and should preserve geographic context.

## Maven reference lessons

The supplied screenshots emphasized:

1. Satellite and video imagery as primary evidence.
2. Target collections and workflow columns.
3. Target nomination forms.
4. Before and after assessment.
5. Asset recommendation.
6. Mission scheduling timelines.
7. Map overlays and range rings.
8. Source and telemetry panels.
9. Confidence and status.
10. Tasking and effects pairing.

KillWeb should adapt these interaction concepts into an original, more readable,
more game oriented system.

## Rejected prototype tendencies

1. Invented coastlines.
2. Map as a secondary panel.
3. Dense permanent chrome.
4. Decorative microcopy.
5. Abstract effects packages without platform identity.
6. Weak state feedback.
7. Static time acceleration.
8. Visual complexity without mechanical depth.
