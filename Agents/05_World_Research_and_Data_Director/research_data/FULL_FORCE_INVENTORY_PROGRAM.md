# Full Force Inventory Program

## Decision

KillWeb scenarios use the complete force universe of every playable country.

A crisis or exercise roster defines the opening disposition of forces. It does
not define the total force available to the country. Justice Mission 2025
therefore identifies the forces observed around Taiwan at the opening bookmark,
while the remainder of the People's Liberation Army, Navy, Air Force, Rocket
Force, Strategic Support capabilities, Coast Guard, militia, reserves, and
mobilization base continue to exist elsewhere in the world.

The same rule applies to the United States, Taiwan, Japan, South Korea, North
Korea, Russia, the Philippines, and every country in the frozen top 80 cohort.

## Core conservation rule

Every documented platform, formation, and capability belongs to either an
individual entity or a counted inventory pool.

Aggregation may change how forces are rendered and controlled. It may never
change how many assets exist.

A force can move between states, commands, formations, bases, and theaters. It
cannot appear, disappear, duplicate, or become combat ready without a recorded
cause.

## Four linked layers

### 1. Possession

What the country owns or controls.

1. Active equipment.
2. Reserve equipment.
3. Stored equipment.
4. Training equipment.
5. Equipment in maintenance or refit.
6. Equipment under construction or accepted but not operational.
7. Paramilitary, Coast Guard, militia, and government controlled civilian
   capacity where it can materially affect a crisis.
8. Foreign operated or leased equipment with explicit control constraints.

### 2. Organization

Who commands and operates the force.

1. Service.
2. Major command.
3. Fleet, army, air command, theater command, or equivalent.
4. Formation.
5. Unit.
6. Home station.
7. Parent and subordinate relationships.
8. Crew and personnel dependencies.
9. Mobilization authority.
10. Political and alliance restrictions.

### 3. Disposition

Where the force is assigned or observed at the scenario bookmark.

1. Home station.
2. Deployed location or operating area.
3. Transit route.
4. Exercise area.
5. Patrol area.
6. Maintenance facility.
7. Reserve or storage region.
8. Unknown or disputed location.
9. Observation time and expiration.
10. Location confidence and source provenance.

### 4. Availability

What the force can actually do now.

1. Ready.
2. Ready with delay.
3. Training.
4. Committed to another mission.
5. In transit.
6. Sustaining.
7. Maintenance.
8. Refit or modernization.
9. Reserve.
10. Stored.
11. Mobilizing.
12. Damaged.
13. Mission killed.
14. Destroyed.
15. Captured or transferred.
16. Under construction.

Nominal inventory is not combat ready inventory.

## Domain coverage

### Maritime

1. Every publicly documented commissioned warship by hull where feasible.
2. Submarines with class, fleet assignment, and uncertainty when individual
   identity or location is not public.
3. Auxiliaries, replenishment ships, survey ships, intelligence ships, hospital
   ships, sealift, and amphibious shipping.
4. Coast Guard and maritime militia capacity where strategically relevant.
5. Ships in reserve, overhaul, trials, construction, or decommissioning process.
6. Homeports, supported operating regions, maintenance capacity, and ammunition
   dependencies.

The entire United States fleet remains available to the world simulation, not
only the Pacific Fleet. Redeployment from another theater consumes time,
readiness, escorts, replenishment, access, and political attention while creating
risk in the theater left behind.

### Air

1. Complete type inventory by service.
2. Squadron, wing, brigade, regiment, or equivalent organization.
3. Operational, training, reserve, maintenance, and stored pools.
4. Tankers, airborne early warning, electronic warfare, transport, maritime
   patrol, intelligence, rescue, and unmanned aircraft.
5. Basing, runway, shelter, maintenance, fuel, munition, crew, and tanker
   dependencies.
6. Public tail or serial identity only where it creates gameplay value.

Aircraft may be controlled as formations at broad zoom and resolved into
individual mission participants when a package is built.

### Ground

1. Complete public order of battle to brigade or regiment where defensible.
2. Active, reserve, territorial, paramilitary, and mobilization formations.
3. Equipment inventories by type and assigned or regional pool.
4. Artillery, air defense, engineering, logistics, aviation, signals, and
   electronic warfare units.
5. Readiness, personnel, transport, stockpile, and mobilization dependencies.
6. Storage and reserve equipment with restoration delay and uncertainty.

Ground vehicle counts may remain pooled within formations. Every pool must still
conserve quantity through transfer, attrition, capture, repair, and replacement.

### Missile and air defense forces

1. Known organizations and bases.
2. Launcher and battery estimates expressed as ranges when exact counts are not
   public.
3. Reload, munition, radar, command, transporter, and support dependencies.
4. Fixed and mobile status.
5. Conventional and strategic command restrictions.
6. Dispersal and survivability states.

A missile count, launcher count, battery count, and firing formation are separate
measurements and must never be substituted for one another.

### Space

1. Public military and dual use satellites by constellation and mission.
2. Launch, control, relay, tracking, and ground segment dependencies.
3. Orbital status, revisit, coverage, tasking capacity, and degradation.
4. Commercial capacity that can be contracted, compelled, denied, or disrupted.
5. Replacement launch capacity and manufacturing delay.

### Cyber, information, and command capabilities

These are represented as organizations, access, capacity, preparation, and
effects rather than imaginary physical platforms.

1. Public command structures.
2. Persistent access and preparation pools.
3. Defensive capacity.
4. Information distribution capacity.
5. Command network resilience.
6. Legal and political authorities.
7. Dependencies on communications, data centers, commercial platforms, and
   allied access.

## Minimum inventory record

Every inventory record must support:

1. Stable entity or pool identifier.
2. Country and controlling actor.
3. Service and command hierarchy.
4. Domain, category, class, model, and variant.
5. Count or count range.
6. Individual identity when represented.
7. Personnel and crew requirement where relevant.
8. Formation assignment.
9. Home station or geographic state.
10. Availability state.
11. Readiness estimate and confidence.
12. Maintenance and modernization state.
13. Current commitment.
14. Mobility and deployment constraints.
15. Sustainment dependencies.
16. Acquisition, transfer, loss, and retirement history.
17. Source identifiers.
18. Validity interval.
19. Contradictions and unknown fields.
20. Proposed simulation resolution.

## Scenario initialization

The starting bookmark creates a complete force ledger.

1. The observed crisis force becomes the initial deployed posture.
2. Forces elsewhere retain their real world assignments and commitments.
3. Training, patrol, maintenance, and construction continue while the player does
   nothing.
4. Other wars and crises continue to consume forces.
5. Redeployment requires a legal route, transit time, access, logistics, and
   command decision.
6. A force pulled from one theater creates an opportunity or risk elsewhere.
7. Allies and adversaries can respond to visible mobilization and movement.
8. Hidden or uncertain forces remain uncertain to factions without appropriate
   intelligence.

## Map and control abstraction

The inventory database is complete even when the map is visually aggregated.

1. Global zoom shows commands, fleets, air regions, armies, strategic reserves,
   and major deployments.
2. Theater zoom shows task forces, wings, brigades, patrols, and support
   networks.
3. Operational zoom exposes individual ships, mission aircraft, batteries, and
   tactically meaningful units.
4. Tactical workbenches expose tracks and hypotheses rather than omniscient true
   identities.
5. Units merge into and expand from formations without changing the conserved
   underlying ledger.
6. Only relevant movement and event updates require high frequency simulation.
7. Dormant forces use scheduled events and coarse updates until activated.

This permits the entire force universe to remain in play without rendering or
updating every platform every frame.

## Research precision rules

1. Exact public counts are preserved as exact counts.
2. Conflicting counts become contradiction records.
3. Estimated inventories use ranges and confidence.
4. Unlocated mobile forces remain assigned to a command, base region, or unknown
   disposition rather than receiving invented coordinates.
5. Current covert locations are not required.
6. Readiness is never inferred directly from inventory count.
7. Procurement announcements remain separate from accepted and operational
   equipment.
8. Stored equipment remains separate from restorable reserve equipment.
9. Historical observations expire.
10. Every snapshot is tied to the campaign cutoff date.

## Acceptance gates

A country force ledger reaches reviewed status only when:

1. Every service and strategically relevant government force is included.
2. Inventory totals reconcile across entity and pool records.
3. Named hull lists reconcile with class totals.
4. Aircraft formation totals reconcile with service inventory ranges.
5. Ground formations and equipment pools do not double count the same assets.
6. Active, maintenance, training, reserve, stored, and construction states are
   separated.
7. Overseas deployments and foreign basing are represented.
8. Major support assets and logistics dependencies are included.
9. Unknown readiness and location remain explicit.
10. Every count has a source and validity date.
11. No scenario package can use a platform absent from the force ledger.
12. Every loss, transfer, production event, and repair conserves inventory.

## Collection order

### Wave 1

1. United States.
2. China.
3. Taiwan.

### Wave 2

1. Japan.
2. South Korea.
3. North Korea.
4. Russia.
5. Philippines.
6. Australia.
7. India.
8. Vietnam.
9. Indonesia.
10. Canada.
11. United Kingdom.
12. France.

### Wave 3

1. Remaining major intervention powers.
2. Remaining countries in the top 80 cohort.
3. Relevant nonstate and territorial security forces.

All waves use the same completeness standard. The waves determine research order,
not which countries are allowed to matter.

## Definition of done

KillWeb has achieved global force coverage when every top 80 country has a dated,
sourced, quantity conserving ledger for its complete military inventory and
organization, even where individual identity, readiness, or precise location must
remain uncertain.

Justice Mission and other crisis datasets then become disposition overlays on
that global ledger rather than isolated lists of assets.
