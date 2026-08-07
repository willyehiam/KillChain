# Corpus Integrity Gate

## Purpose

This gate checks the complete machine readable research corpus before data is
accepted into a bookmark or handed to later simulation design. It is
deterministic, offline, dependency free, and intentionally cheaper than full
JSON Schema validation.

## Run

```sh
node Agents/05_World_Research_and_Data_Director/research_data/tools/validate_corpus_integrity.mjs
node Agents/05_World_Research_and_Data_Director/research_data/tools/test_corpus_integrity.mjs
```

Pass `--strict-warnings` to make warnings fail a run. Pass a directory as the
first argument to validate another corpus root.

## Enforced invariants

1. Every JSON, GeoJSON, and nonempty NDJSON line parses.
2. Source, claim, observation, opening state, and other recognized factual
   records carry the required temporal fields.
3. Temporal ranges do not end before they begin.
4. Every `source_ids` and `derived_from_source_ids` reference resolves to a
   source record in the same corpus.
5. Recognized entity definition identifiers are syntactically valid and unique.
6. Coordinates are in bounds and carry an explicit precision in meters.
7. Shell records with empty or null state explain that the value is unknown or
   not yet researched.
8. Opening state records cannot begin after 1 September 2025 unless the record
   is explicitly marked as a retrospective or trajectory reference.

## Knowledge firewall

The firewall evaluates semantic state dates such as `observed_from`,
`valid_from`, and `as_of`. It does not reject a later publication merely because
it was published after the bookmark. A later source may establish a prebookmark
fact retrospectively. Its factual record must still describe prebookmark state.

Future events inside an opening state file must carry one of the approved
reference only markers. The preferred marker is:

```json
{"use":"reference_only_not_initial_state"}
```

## False positive controls

1. Schema documents and every directory named `fixtures` are excluded from
   normal corpus validation because they contain illustrative identifiers and
   deliberately invalid coordinates or records.
2. Identifiers used as foreign keys are not treated as entity definitions.
   A claim identifier owns an identity only when the object also has the atomic
   claim shape. A contradiction identifier owns an identity only when the object
   has the contradiction set shape.
3. Dataset identifiers may appear across a manifest, geometry layer, and
   measures file, so they are not globally unique by design.
4. A collection level coordinate precision applies to all GeoJSON features in
   that collection.
5. Empty arrays are allowed in ordinary records. They require an explanation
   only when the record explicitly declares itself a shell.

## Limits

This gate does not prove that a claim is true, sources are independent, a
coordinate is correctly geolocated, or an inventory reconciles. It also does
not replace JSON Schema validation. Reviewers still must assess evidence quality,
contradictions, sensitive detail, and domain specific conservation rules.
