# Taiwan Administrative Geography

## Scope

This packet contains the first operational province layer in the KillWeb research corpus. It preserves all 22 first order municipalities, counties, and cities in the official Taiwan Ministry of the Interior boundary release identified as `1140318`.

The source geometry is real administrative geometry. It is not a hand drawn theater outline. The ingestion process requests WGS84 coordinates, preserves every coordinate without simplification, assigns stable identifiers, and records both the authoritative dataset page and the public prebookmark mirror used to retrieve the geometry.

## Important interpretation rule

The source includes outlying islands administratively assigned by Taiwan, including distant geometries associated with Yilan and Kaohsiung. Their inclusion preserves the source. It does not decide sovereignty, maritime jurisdiction, international recognition, or player knowledge.

## Files

1. `admin_level_1_counties_1140318.geojson` is the normalized 22 feature map layer.
2. `sources.ndjson` separates the authoritative metadata source from the retrieval mirror.
3. `manifest.json` records scope, acceptance state, gaps, and review dates.
4. `artifact_record.json` freezes hashes, counts, bounds, and transformation claims.
5. `ingest_admin1.mjs` deterministically rebuilds the normalized artifact from a downloaded source response.
6. `validate_geography.mjs` enforces identity, time, provenance, geometry, and hash invariants.
7. `test_geography_regressions.mjs` proves that common truncation, relabeling, and bookmark firewall failures are rejected.

## Status

The layer is `collecting`, not verified. County geometry is populated, while lower level administration, terrain, hydrology, bases, transport, and strategic overlays remain separate packets. The international commercial port packet now exists under `../infrastructure/ports`, but it is not part of this administrative artifact.

## Rebuild

```bash
node ingest_admin1.mjs /path/to/arcgis_response.geojson
node validate_geography.mjs
node test_geography_regressions.mjs
```
