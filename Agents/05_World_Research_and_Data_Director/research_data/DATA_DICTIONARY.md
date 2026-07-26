# Data Dictionary

## Identifier conventions

1. Source: `src_<publisher>_<date>_<slug>`
2. Claim: `clm_<domain>_<uuid>`
3. Country: ISO 3166 alpha 3 where appropriate.
4. Organization: `org_<country>_<slug>`
5. Formation: `frm_<country>_<slug>`
6. Platform: `plt_<country>_<class>_<identifier>`
7. Facility: `fac_<country>_<type>_<slug>`
8. Infrastructure: `inf_<country_or_global>_<type>_<slug>`
9. Industrial site: `ind_<country>_<type>_<slug>`
10. Theater: `theater_<slug>`
11. Event: `evt_<date>_<slug>`

IDs are stable and must not encode mutable names or current owners beyond what is
necessary for namespace clarity.

## Common temporal fields

1. `published_at`: source publication timestamp.
2. `observed_at`: point observation timestamp.
3. `valid_from`: first supported validity time.
4. `valid_to`: last supported validity time.
5. `as_of`: snapshot date.
6. `accessed_at`: research access timestamp.
7. `reviewed_at`: last human or agent review.
8. `review_after`: scheduled maintenance threshold.

Use ISO 8601 in UTC where a time is known. Use a date only when the source does
not support a time. Never invent midnight to imply false precision.

## Common epistemic fields

1. `evidence_state`
2. `confidence`
3. `confidence_reason`
4. `source_ids`
5. `derived_from_source_ids`
6. `contradiction_set_id`
7. `designed_for_simulation`
8. `notes`

## Geospatial fields

1. `geometry`: GeoJSON geometry.
2. `crs`: normally `EPSG:4326`.
3. `location_status`
4. `precision_m`
5. `geometry_source_ids`
6. `geometry_observed_at`
7. `geometry_valid_to`

Longitude precedes latitude in GeoJSON.

## Force quantity fields

1. `quantity`
2. `quantity_min`
3. `quantity_max`
4. `measure`
5. `measure_scope`
6. `unique_identity_supported`
7. `observation_window`

Allowed measures include:

1. `unique_platform`
2. `detected_platform`
3. `peak_presence`
4. `sortie`
5. `formation`
6. `unit`
7. `personnel`
8. `launcher`
9. `munition`
10. `event`
11. `capacity`

## Representation tiers

1. `individual`: a named platform, facility, or institution.
2. `formation`: an aggregated unit with conserved composition.
3. `regional_network`: capacity and dependencies across a region.
4. `national_capability`: a country level capability.
5. `synthetic_node`: designed detail derived from public aggregates.
6. `event_only`: represented through an event or modifier.
7. `background_only`: retained for context but not simulated.

## Status fields

Corpus status:

1. `queued`
2. `collecting`
3. `needs_review`
4. `verified`
5. `disputed`
6. `deprecated`

Simulation adoption:

1. `not_reviewed`
2. `candidate`
3. `accepted`
4. `rejected`
5. `superseded`
