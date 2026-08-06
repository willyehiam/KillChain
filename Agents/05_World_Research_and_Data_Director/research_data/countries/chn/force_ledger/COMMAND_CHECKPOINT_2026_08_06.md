# China national force command checkpoint

Audit date: 2026-08-06

Scope: public aggregate command structure as of the 1 September 2025 bookmark. No exact headquarters coordinates, current positions, unit movements, readiness, or nonpublic assignments are included.

## Result

Force-audit major M03 is structurally closed in this collecting packet. The Aerospace Force, Cyberspace Force, Information Support Force, and Joint Logistic Support Force are now typed as the four officially designated `strategic_arm` organizations rather than service commands. Neutral service classification prevents a research translation such as “intelligence service” from silently replacing the official arm identity.

Force-audit major M04 is materially advanced at the public aggregate layer:

1. six public CMC organs were added for political work, logistic support, equipment development, training administration, national defense mobilization, and discipline inspection;
2. five Army theater components, five Air Force theater components, and three Navy theater components were added;
3. generating services now organize, train, and equip their theater components without gaining mission-release authority;
4. theater commands hold aggregate operational relationships to those public components;
5. Rocket Force participation in the Eastern Theater is conditional on a specific CMC assignment and does not create a fictitious permanent theater Rocket Force component; and
6. all four strategic arms remain under CMC administrative authority without implying theater availability.

The accepted graph now contains 38 organizations and 53 typed relationships. Group armies, bases, brigades, regiments, subordinate fleet elements, internal workflow latency, staffing, current assignments, and support allocation remain unknown.

## Guard coverage

The China national validator and four adversarial fixtures are mandatory in `npm run validate:research-foundation`. They reject:

1. reclassifying an arm as a service;
2. removing a required CMC organ;
3. turning conditional Rocket Force participation into a standing assignment; and
4. allowing a generating service to release a theater component for a mission.

The research-foundation suite passes. This checkpoint remains `status: collecting`, `research_complete: false`, `decision_usable: false`, and `simulation_ready: false`. It cannot initialize a scenario or release any force for a mission.
