# Taiwan Civilian Aviation Access Layer

## Purpose

This packet establishes the civilian aviation access nodes visible at the 1 September 2025 opening bookmark. It contains seventeen official aerodrome reference points and twelve months of observed civilian activity for each airport.

## Files

1. `civilian_access_airports.geojson` contains the seventeen official airport reference points and trailing twelve month activity summaries.
2. `airport_activity_monthly_2024_09_to_2025_08.ndjson` preserves all 204 monthly observations.
3. `sources.ndjson` records the official eAIP and CAA workbooks, their temporal status, and frozen hashes.
4. `ingest_airports.mjs` recreates both canonical data artifacts from frozen raw downloads.
5. `artifact_record.json` records output hashes, bounds, transformations, and interpretation limits.
6. `manifest.json` records scope, gaps, and acceptance state.
7. `validate_airports.mjs` enforces identity, geometry, conservation, provenance, time, and semantic gates.
8. `test_airport_regressions.mjs` proves that the gates reject corrupt or promoted records.

## Inclusion rule

The active set contains Taiwan Taoyuan, Kaohsiung, Taipei Songshan, Hualien, Taitung, Penghu, Taichung, Tainan, Chiayi, Qimei, Wangan, Lanyu, Green Island, Kinmen, Matsu Beigan, Matsu Nangan, and Hengchun.

Pingtung is excluded because the CAA source says civilian operations ceased on 11 August 2011. Hsinchu is excluded because the retained statistics column does not establish an active civilian access airport at the bookmark. Neither exclusion is a claim about military activity.

## Truth boundary

Every point is an aerodrome reference point, not a runway, apron, terminal, fuel store, warehouse, defense site, or aimpoint. Observed activity is utilization, not capacity. `military_facility_status`, `target_status`, and `dual_use_status` remain `not_assessed`; the packet does not infer military presence or absence.

The 2025 workbook was published after the bookmark. Its January through August rows are retained as retrospective evidence, marked unavailable to the player at the bookmark, and may not leak future publication knowledge into gameplay.

## Rebuild

```bash
node ingest_airports.mjs /path/to/eAIP_pages /path/to/2024.ods /path/to/2025.ods
node validate_airports.mjs
node test_airport_regressions.mjs
```

The eAIP directory must contain one frozen HTML page named by ICAO code for each included airport. The ingestion script checks every source hash before writing output.
