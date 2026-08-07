# Taiwan International Commercial Ports

## Purpose

This packet turns Taiwan's seven officially identified international commercial ports into civilian logistics nodes for the 1 September 2025 opening bookmark. It gives the simulation real source derived locations and a twelve month activity baseline without treating a port as a military target or pretending that observed traffic equals maximum capacity.

## Included ports

1. Keelung
2. Taipei
3. Suao
4. Taichung
5. Kaohsiung
6. Anping
7. Hualien

The identity set comes from Taiwan International Ports Corporation. Point locations come from the Ministry of the Interior Land Surveying and Mapping Center wharf layer. Monthly container and vessel activity comes from Taiwan International Ports Corporation.

## Files

1. `international_commercial_ports.geojson` contains seven source derived point nodes in WGS84.
2. `port_activity_monthly_2024_09_to_2025_08.ndjson` contains twelve complete prebookmark months for every port.
3. `sources.ndjson` records authoritative metadata, live resource URLs, snapshot hashes, and temporal admissibility rules.
4. `manifest.json` states scope, status, gaps, and interpretation limits.
5. `artifact_record.json` freezes hashes, counts, bounds, and transformation claims.
6. `ingest_ports.mjs` rebuilds the normalized artifacts from the three downloaded government resources.
7. `validate_ports.mjs` enforces identity, temporal, provenance, geometry, conservation, and hash invariants.
8. `test_port_regressions.mjs` proves that common corruption and postbookmark leakage are rejected.

## Interpretation limits

The points are official landmark locations, not harbor polygons, berth inventories, defenses, readiness states, damage states, or targeting aimpoints. Twelve month traffic is an observed utilization baseline, not engineering capacity. Any future blockade, evacuation, trade, mobilization, or repair mechanic must consume these nodes through a separate simulation model.

Every feature is marked as civilian infrastructure. Military facilities and military access agreements require separate evidence packets.

## Rebuild

```bash
node ingest_ports.mjs /path/to/wharf_main.zip /path/to/container_activity.csv /path/to/vessel_activity.csv
node validate_ports.mjs
node test_port_regressions.mjs
```

The activity CSV resources are published in Big5 encoding. The ingestion script decodes them directly and rejects any month after August 2025.
