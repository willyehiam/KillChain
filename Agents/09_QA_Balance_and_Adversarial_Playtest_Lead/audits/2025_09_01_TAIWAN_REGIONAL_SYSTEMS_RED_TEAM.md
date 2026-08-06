# Taiwan regional systems red team audit

## Review target

This audit reviews the Taiwan regional systems packet through commit `f838c981e93c888ad3db7b16e520d6dc2d8efcb6` as an independent Agent 09 and Armchair General assessment.

Scope reviewed:

1. 23 systems
2. 16 dependency edges
3. 4 access relationships
4. 28 sources
5. Packet validator and corpus integrity validator
6. Opening truth validity at `2025-09-01T00:00:00Z`

## Verdict

The packet may remain integrated as a research checkpoint and evidence index. It is not acceptable as simulation input, a balance baseline, or a claim that the Taiwan regional economy and access system has been modeled.

The current structure contains useful questions and sensible safety intent, but most gameplay fields are prose labels. It cannot conserve fuel, cargo, electricity, bandwidth, lift, repair labor, political authority, or time. Eight systems are disconnected from the dependency graph. Several high impact capacities are inferred from evidence that does not establish the modeled capability. The validators confirm shape, not truth or causal validity.

Severity count:

1. Blocking: 3
2. Major: 9
3. Minor: 3

## Validation results

The following repository checks pass on current `main`:

```text
node Agents/05_World_Research_and_Data_Director/research_data/theaters/fully_modeled/china_taiwan_south_china_sea/taiwan_regional_systems_2025/validate_regional_systems.mjs

node Agents/05_World_Research_and_Data_Director/research_data/tools/validate_corpus_integrity.mjs

node Agents/05_World_Research_and_Data_Director/research_data/tools/test_corpus_integrity.mjs
```

The packet reports 23 systems, 16 edges, 4 access relationships, and 28 sources. The corpus reports 156 files, 302 parsed records, 118 sources, and no diagnostics.

That pass is materially weaker than it appears. An isolated adversarial copy was modified to contain alternative exact location aliases, WKT point text, an arbitrary capacity tier, a system with no sources, and a dependency self loop. Both the packet validator and corpus validator still returned `PASS`. No production packet file was modified during this test.

## Blocking findings

### B1. The model cannot execute or conserve resources

Affected IDs: all 23 systems, all 16 dependency edges, and all 4 access relationships.

Evidence:

1. Twenty three records use 14 different free text capacity tiers.
2. Recovery uses 15 free text categories.
3. Redundancy uses 9 free text categories.
4. Confidence uses 15 free text categories.
5. No record defines a conserved resource, unit, stock, inflow, outflow, demand, utilization, transfer limit, loss rate, or allocation rule.
6. Dependency edges have no transfer coefficient, threshold, degradation function, resource type, priority rule, or repair state.
7. Access relationships grant no typed mission permission, throughput, duration, revocation condition, or political cost.
8. `decisions_enabled` is prose and has no action identifier, precondition, cost, state transition, or measurable result.

Player consequence: choices such as rationing fuel, rerouting cargo, activating backup communications, and prioritizing semiconductor power cannot produce deterministic state changes. Any implementation would have to invent the actual rules later, making this packet decorative rather than authoritative.

Required correction packet: `TWRS-C01 Typed resource network contract`.

### B2. Validators accept unsupported causality and concealed exact location data

Affected IDs: validator logic and every validated record family.

Evidence:

1. The exact location blacklist checks only seven keys. It does not reject `lat`, `lon`, `geometry`, `bbox`, `position`, `centroid`, `geohash`, or WKT strings.
2. A system can omit `source_ids` entirely and pass both validators.
3. A dependency can be changed into a self loop and pass both validators.
4. Capacity, redundancy, recovery, confidence, criticality, substitutability, lag, and automaticity accept arbitrary strings.
5. The validator checks that a decision string exists but not whether the decision is executable.
6. No validator checks graph coverage, contradictory dependencies, duplicate claims, edge direction, source claim fit, or causal completeness.

Player consequence: a structurally valid packet can still encode impossible loops, invented capacities, nonfunctional decisions, and sensitive geometry under unrecognized field names.

Required correction packet: `TWRS-C02 Semantic schema and negative fixtures`.

### B3. Opening truth is not reproducible at the bookmark

Affected IDs: all 28 sources, `twrs_port_japan_regional_depth`, `twrs_src_japan_ports_2024`, `twrs_access_us_japan`, and `twrs_src_us_japan_treaty`.

Evidence:

1. All 28 sources are mutable URLs with neither an archived artifact nor a content hash.
2. Thirteen sources omit `published_at`.
3. The packet validator permits records through `2025-09-01T23:59:59Z`, while opening truth is `2025-09-01T00:00:00Z`.
4. The Japan port source was published on 29 August 2025 but explicitly corrected on 2 September 2025. The currently served national total may therefore contain knowledge unavailable at the bookmark.
5. The claimed Japan treaty source is not the signed 1960 treaty. The linked State Department page is a 29 April 1959 embassy telegram containing a draft treaty. Its source record incorrectly labels the publication date as 19 January 1960.

Player consequence: repeated builds can silently change opening state, and a central allied access rule currently rests on misidentified legal evidence.

Required correction packet: `TWRS-C03 Bookmark provenance freeze`.

## Major findings

### M1. National container throughput is mislabeled as southern gateway capacity

Affected IDs: `twrs_port_taiwan_south`, `twrs_dep_port_south_to_power_fuel`.

The 13.93 million TEU figure is Taiwan's national 2024 port total, not southern Taiwan capacity. The record also combines container handling, energy imports, exports, and replenishment in one node even though the README correctly states these functions are not interchangeable.

Correction: split southern container capability from regional liquid fuel, LNG, coal, bulk, and replenishment interfaces. Use port specific evidence for every numerical proxy and separate commercial scale from crisis usable throughput.

### M2. Four capacities are asserted without capability evidence

Affected IDs: `twrs_port_china_fujian`, `twrs_port_japan_regional_depth`, `twrs_air_allied_access`, `twrs_sealift_commercial_pool`.

1. Fujian is labeled `high` while its own proxy says a primary regional series is pending.
2. Japan's national container total does not establish southwest theater throughput.
3. Treaties and EDCA announcements establish legal frameworks, not `high` air access capacity.
4. Port and route throughput does not establish a large charterable sealift pool.

Correction: encode these as unknown estimates until physical capacity evidence exists. Do not promote macroeconomic scale into mission capacity.

### M3. Fuel policy floors are treated as capacity

Affected IDs: `twrs_energy_taiwan_liquid_fuels`, `twrs_energy_taiwan_lng_coal`, `twrs_dep_grid_power_fuel`, `twrs_dep_route_to_power_fuel`, `twrs_dep_route_to_liquid_fuel`, `twrs_dep_fuel_to_air`.

The cited 90 day crude, 30 day coal, and 8 day LNG values are legal minimums. The cited report explicitly states actual stocks exceeded the legal floor. Days of stock are meaningless without opening inventory, accessible share, fuel grade, conversion limits, civilian and military burn, generation mix, rationing, and replenishment flows.

Correction: represent policy floor, estimated opening stock, usable stock, daily demand, conversion constraints, and uncertainty separately.

### M4. Access rules ignore the institutions that make permission political

Affected IDs: all 4 access relationships.

1. Japan access lacks authoritative final treaty and status agreement citations, mission classes, consultation pathways, Japanese executive decisions, constitutional constraints, and local operating limits.
2. Philippines access compresses the presidency, defense institutions, armed forces, local consultation, courts, public opinion, agreed activity, and treaty trigger into four strings.
3. The Taiwan Relations Act is a United States policy framework, not a basing relationship. Material support, intelligence sharing, transit, Taiwan consent, combat entry, and war authority require separate gates.
4. The commercial relationship cites traffic statistics and UNCTAD but provides no legal source for emergency direction or carrier compulsion authority.

Correction: create a per mission permission state machine with approving authority, legal basis, domestic support, consultation, lead time, scope, capacity grant, duration, conditions, revocation, and political cost.

### M5. More than one third of systems are disconnected flavor text

Affected IDs:

1. `twrs_port_taiwan_north`
2. `twrs_port_taiwan_central`
3. `twrs_port_china_fujian`
4. `twrs_port_china_yangtze_delta`
5. `twrs_port_japan_regional_depth`
6. `twrs_route_east_taiwan`
7. `twrs_satellite_weather_ocean`
8. `twrs_satellite_optical_earth_observation`

These eight systems have no incoming or outgoing dependency edge. Their decisions cannot affect the modeled graph.

Correction: connect each system through typed resource flows and demand nodes, or remove it from the executable packet and retain it only as research evidence.

### M6. Several dependency edges encode arbitrary geography or incomplete alternatives

Affected IDs: `twrs_dep_route_to_power_fuel`, `twrs_dep_port_south_to_power_fuel`, `twrs_dep_cables_to_semis_north`, `twrs_dep_port_air_to_semis`, `twrs_dep_routes_to_sealift`, `twrs_dep_pnt_to_airlift`.

1. One synthetic Luzon route family is made the input for Taiwan power and liquid fuel replenishment without evidence that it represents the relevant global supply paths.
2. A single southern port aggregate becomes the specialized energy gateway despite distinct terminal types and geography.
3. Cable dependence is connected only to northern semiconductor production.
4. Air cargo dependence is connected only to southern semiconductor production.
5. Commercial sealift depends only on the Taiwan Strait edge although the packet defines alternatives.
6. Allied air access depends on GPS alone while the packet provides no model for alternative constellations, inertial navigation, local aids, or degraded procedures.

Correction: replace these edges with a resource flow network, substitution matrix, and explicit evidence or documented modeling assumption for every link.

### M7. Recovery and redundancy fields are largely invented

Affected IDs: all 23 systems.

The README admits recovery distributions need historical calibration, but every system already declares a recovery speed. No record identifies damage state, repair workload, spares, workforce, repair vessel or crew availability, queue, access condition, or empirical recovery case.

Correction: mark unresearched recovery values unknown. Add repair resources, work units, damage states, and calibrated probability distributions before recovery affects play.

### M8. Semiconductor revenue is not production capacity

Affected IDs: `twrs_semiconductor_north`, `twrs_semiconductor_central`, `twrs_semiconductor_south`, and their five connected dependency edges.

Science park revenue establishes economic significance but not wafer output, process mix, qualified substitution, input inventory, water demand, power quality, tool recovery, or the share of production relevant to strategic supply chains. The packet acknowledges limited interchangeability but cannot enforce it.

Correction: keep revenue as economic exposure. Model production using safely aggregated product families, capacity indices, input requirements, inventory buffers, utility quality, substitution limits, and recovery requirements.

### M9. Uncertainty is descriptive rather than playable

Affected IDs: all 23 systems and all 4 access relationships.

Confidence labels have no probability, estimate range, distribution, source disagreement, update rule, or distinction between player knowledge and ground truth. A confidence string cannot generate fog of war or scenario variation.

Correction: separate truth state from player estimate and encode bounded distributions, provenance, update cadence, stale intelligence behavior, and reveal conditions.

## Minor findings

### m1. System names overstate what is known

Affected IDs: `twrs_port_japan_regional_depth`, `twrs_air_allied_access`, `twrs_sealift_commercial_pool`.

Terms such as `depth`, `access network`, and `pool` imply usable theater capacity that the evidence does not establish. Use neutral research labels until capability is measured.

### m2. Source tier treatment is inconsistent

Affected IDs: `twrs_src_tsmc_annual_2024`, `twrs_src_fuel_stock_policy_2024`.

A first party annual report is assigned Tier B while a news account of legislative testimony is also Tier B. Source tier should distinguish publisher authority from whether the source actually supports the derived claim.

### m3. Packet status is easy to misread

Affected IDs: `twrs_manifest_regional_systems_2025` and packet README.

`research_checkpoint` is correct, but the presence of executable looking dependencies and successful validators can be mistaken for engine readiness.

Correction: add explicit `simulation_readiness: blocked` and unresolved correction packet identifiers to the manifest.

## Required correction packets

### TWRS C01. Typed resource network contract

Owner: Simulation Lead with World Data support.

Required output:

1. Controlled resource types and units
2. Stocks, flows, demand, utilization, loss, and allocation priority
3. Capacity estimates with minimum, central, maximum, source, and temporal basis
4. Dependency transfer functions and lag distributions
5. Substitution matrices with capacity loss, switching delay, and cost
6. Damage states and repair work requirements
7. Typed player actions and deterministic state transitions
8. Conservation tests for energy, fuel, cargo, bandwidth, lift, and repair resources

Acceptance: a deterministic replay can reroute one resource, ration demand, degrade one node, consume repair capacity, and conserve every modeled quantity.

### TWRS C02. Semantic schema and negative fixtures

Owner: Systems Lead with Agent 09 review.

Required output:

1. JSON schemas and controlled vocabularies
2. Required sources or explicit `modeled_assumption` records
3. Graph coverage, self loop, duplicate, endpoint type, and edge direction checks
4. Typed decision identifiers and preconditions
5. Exact location detection covering aliases, coordinate arrays, GeoJSON, WKT, geohashes, centroids, and encoded geometry
6. Negative fixtures for arbitrary tiers, missing sources, false edges, orphan nodes, post bookmark sources, and unsafe geometry

Acceptance: every adversarial mutation described in this audit fails validation.

### TWRS C03. Bookmark provenance freeze

Owner: World Research Lead.

Required output:

1. Content hash or archived artifact for every opening truth source
2. `published_at`, `available_at`, `last_updated_at`, and `accessed_at`
3. Exact bookmark cutoff at `2025-09-01T00:00:00Z`
4. Pinned pre correction Japan port data or an explicit unknown at the bookmark
5. Authentic final Japan treaty and implementing agreement sources
6. Claim level excerpts or table references with units and year

Acceptance: the opening packet rebuilds identically even if a live source changes.

### TWRS C04. Regional topology correction

Owner: World Data Lead.

Required output:

1. Function specific port and energy gateway abstractions
2. Domestic transport, warehousing, and demand regions
3. Power generation, fuel input, reserve, transmission, and load regions
4. Cable route capacity and priority bandwidth pools
5. Air and maritime route alternatives
6. Semiconductor inputs, outputs, buffers, and safe substitution indices
7. Removal or connection of all eight orphan systems

Acceptance: every retained system changes at least one meaningful player choice and has a traceable path to a strategic outcome.

### TWRS C05. Political access state machine

Owner: Politics and Country AI Leads.

Required output:

1. Mission specific permissions
2. Approving institutions and decision makers
3. Treaty trigger and consultation rules
4. Domestic support and escalation conditions
5. Lead time, throughput grant, duration, restrictions, revocation, and political cost
6. Distinct assistance, intelligence, transit, staging, strike support, and combat entry pathways

Acceptance: Japan, Philippines, Taiwan, and commercial access can each approve, narrow, delay, condition, or reject a request for legible reasons.

## Integration decision

The packet can remain on `main` because it is clearly useful as a research checkpoint and does not contain exact actionable targeting geometry. It must remain quarantined from simulation ingestion. No engine adapter, balance work, or gameplay claim should consume it until B1, B2, and B3 are closed and the major causal corrections are revalidated by Agent 09.
