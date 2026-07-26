# Spatial Model and Resolution

## Geographic foundation

Use real world geography and a coherent coordinate system.

The future spatial model must support:

1. Globe.
2. Political boundaries.
3. Administrative regions.
4. Land and maritime areas.
5. Airspace.
6. Routes.
7. Infrastructure nodes.
8. Bases and cities.
9. Theater boundaries.
10. Areas of interest.
11. Sensor geometry.
12. Orbits.

## Strategic graph

The simulation may combine geographic geometry with graphs for:

1. Roads.
2. Rail.
3. Shipping.
4. Air routes.
5. Pipelines.
6. Electricity.
7. Communications.
8. Logistics.
9. Trade.
10. Command and access.

## Level of detail

### Distant

1. Countries.
2. Regions.
3. Trade flows.
4. Alliance posture.
5. Major formations.
6. Global infrastructure.
7. Satellite constellations.

### Theater

1. Bases.
2. Ports.
3. Airfields.
4. Formations.
5. Routes.
6. Coverage.
7. Logistics.
8. Strategic sites.

### Mission

1. Platforms.
2. Tracks.
3. Search areas.
4. Sensor footprints.
5. Routes.
6. Engagement geometry.
7. Civilian proximity.

## Aggregation contract

Every aggregate should preserve:

1. Constituent count or estimated count.
2. Inventory.
3. Readiness.
4. Damage.
5. Location distribution.
6. Orders.
7. Supply.
8. Identity and confidence.
9. Formation relationships.
10. Ownership.

## Movement

Movement requires:

1. Origin.
2. Destination or route.
3. Access.
4. Speed.
5. Transport mode.
6. Fuel or other consumption.
7. Capacity.
8. Threat.
9. Schedule.
10. Interruption behavior.

## Rendering relationship

The map may animate continuously. The authoritative simulation updates on
deterministic events.

Interpolation cannot alter location used for authoritative calculations.

## Dynamic resolution risk

The engine must not simulate inactive areas with rules so coarse that activating
the theater changes what would have happened.

Future design must define a conservative aggregation method and error tolerance.
