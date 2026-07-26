# Source Registry

## Purpose

Maintain the evidence graph behind every corpus claim.

## Planned artifacts

1. `sources.ndjson`: one normalized record per source.
2. `source_families.json`: wire services, official feeds, and derivative chains.
3. `archives.json`: stable archive or local reference metadata where permitted.
4. `licenses.json`: reuse and attribution constraints.
5. `retrieval_log.ndjson`: retrieval attempts and failures.

## Rule

A URL is not a citation by itself. Every research record must identify the
specific passage, page, table, figure, timestamp, geometry, or dataset row that
supports the claim.
