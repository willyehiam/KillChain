# Tier A force structure red team

Audit targets: commits `1f4fe5f`, `18aac53`, and `61c0407`, reviewed on remote `main` at `d83163c`.

Truth date: `2025-09-01T00:00:00Z`

Scope: all 62 organization records, all 29 aggregate equipment taxonomy records, all 18 local sources, the three force ledger manifests, every empty ledger family, provenance, parent relationships, and `validate_tier_a_force_ledgers.mjs` for the United States, China, and Taiwan.

## Verdict

These packets are acceptable only as an initial command and taxonomy scaffold. They are not force structures, force ledgers, orders of battle, or playable military opening states.

The packets contain zero platforms, zero inventory pools, zero deployments, zero maintenance states, zero construction states, zero conservation records, and zero accepted contradiction records. They cannot tell the simulation what exists, who controls it, where it is assigned, whether it is available, what supports it, or what can execute a mission. The validator nevertheless reports `PASS` for all three countries.

Integration disposition: retain the commits as collecting stage scaffolding, but block all promotion to `reviewed`, `accepted`, `simulation_ready`, or any equivalent state. No simulation, map, package recommender, country AI, balance model, or player interface may treat these records as evidence of complete force coverage.

Severity count: 4 blocking, 12 major, 4 minor.

## Validation evidence

The following commands passed against the combined repository:

1. `npm test`, including type checking, 43 simulation tests, production build, and rendered HTML verification.
2. `node Agents/05_World_Research_and_Data_Director/research_data/tools/validate_foundation.mjs`
3. `node Agents/05_World_Research_and_Data_Director/research_data/tools/validate_research.mjs`
4. `node Agents/05_World_Research_and_Data_Director/research_data/tools/validate_top80.mjs Agents/05_World_Research_and_Data_Director/research_data/countries/top_80_2025/top_80_2025_gdp.json`
5. `node Agents/05_World_Research_and_Data_Director/research_data/schemas/validate_force_contracts.mjs`
6. `node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/generate_top80_shells.mjs --check`
7. `node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/validate_top80_shells.mjs`
8. `node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/validate_registry_profiles.mjs`
9. `node Agents/05_World_Research_and_Data_Director/research_data/countries/validate_tier_a_structure.mjs`
10. `node Agents/05_World_Research_and_Data_Director/research_data/countries/validate_tier_a_force_ledgers.mjs`
11. `node Agents/05_World_Research_and_Data_Director/research_data/theaters/fully_modeled/china_taiwan_south_china_sea/taiwan_regional_systems_2025/validate_regional_systems.mjs`
12. `node Agents/05_World_Research_and_Data_Director/research_data/tools/test_corpus_integrity.mjs`
13. `node Agents/05_World_Research_and_Data_Director/research_data/tools/validate_corpus_integrity.mjs`

The earlier politics audit reported 53 unresolved Tier A profile source identifiers in the foundation registry. That known failure is not a force packet defect and is no longer present at the audited head. Commits `c4a3bab` and `d83163c` unified the source namespace and made foundation validation mandatory. The foundation validator now passes with 65 sources and three Tier A force ledgers.

An initial `npm test` attempt failed because dependencies were absent from the fresh audit worktree. A clean dependency installation was blocked by the execution environment cache path. Reusing the repository's existing locked dependency tree produced a complete passing test run. This was an audit environment problem, not a source defect.

The corpus validator reports zero warnings. That result does not establish military correctness. It demonstrates that the present gates validate syntax and internal references while accepting operationally empty ledgers and false semantic relationships.

## Blocking findings

### B01 The force ledgers contain no forces

Affected records: all three `manifest.json` files and every `platforms.ndjson`, `inventory.ndjson`, `deployments.ndjson`, `maintenance.ndjson`, `construction.ndjson`, and `conservation.ndjson` file under the United States, China, and Taiwan force ledgers.

Evidence: the manifests and validator agree on zero records in all six operational families. The only populated families are organizations and aggregate taxonomy. The manifests explicitly admit that named platforms, quantities, dispositions, readiness, maintenance, construction, logistics dependencies, and conservation are unresolved.

Impact: no country can generate a lawful force package. A carrier, air wing, tanker, submarine, missile battery, sensor, port, airbase, repair yard, or reserve brigade cannot be assigned, moved, depleted, repaired, destroyed, or double booked. Any game action consuming this packet would be an unsupported hand of god effect.

Correction packet:

1. Populate a reconciled national inventory baseline for each service and component.
2. Individualize every capital ship, submarine, major auxiliary, strategic aircraft, strategic missile unit, high value sensor, and other platform whose identity changes command, location, loss, or mission availability.
3. Represent other equipment in nonoverlapping pools with explicit counting units and scopes.
4. Assign every platform and pool to a generating organization, operational relationship, accounting state, and confidence interval.
5. Add deployment, maintenance, construction, and conservation records before any package can reserve an asset.
6. Preserve unknowns as explicit ranges or unknown quantities rather than zero.

Acceptance: the opening ledger can answer what exists, what is available, who administratively owns it, who operationally controls it, where it is assigned at the permitted abstraction level, what it needs, and how every conserved quantity reconciles.

### B02 One parent field cannot represent real command relationships

Affected schema: `military_organization_record.schema.json`, especially `parent_organization_id` and `command_relationship`.

Affected United States records: `organization_usa_department_of_defense`, `organization_usa_joint_chiefs_of_staff`, all three military department records, all six service records, all reserve and Guard records, and all eleven combatant command records.

Affected China records: `organization_chn_central_military_commission`, all four service records, all four strategic arm records, all five theater command records, `organization_chn_peoples_armed_police_force`, `organization_chn_china_coast_guard`, `organization_chn_pla_reserve_force`, and `organization_chn_militia`.

Affected Taiwan records: all twelve organization records.

Evidence: the schema permits one parent and one relationship. Real forces simultaneously have administrative, operational, supporting, mobilization, state, party, and statutory relationships. The United States statutory operational chain runs from the President through the Secretary of Defense to combatant commanders, while military departments organize, train, and equip forces. The Joint Chiefs are not in the operational chain. [Congressional Research Service IF10542](https://www.congress.gov/crs-product/IF10542). The Department of Defense also distinguishes geographic and functional combatant commands rather than one generic theater echelon. [Department of Defense combatant commands](https://www.defense.gov/About/combatantcommands/).

Impact: the model must choose one relationship and discard the others. It cannot correctly answer who may order a force, who sustains it, who may reassign it, what happens after mobilization, or whether the same headquarters serves multiple authorities. This will create impossible orders and magical access to assets.

Correction packet:

1. Replace the single command edge with a relationship ledger containing source organization, target organization, relationship type, authority scope, effective interval, conditions, and provenance.
2. Keep one containment parent only for navigation if needed, and explicitly prohibit treating containment as command.
3. Permit multiple concurrent relationships and dual status.
4. Add cycle checks by relationship type and rules for valid authority transitions.
5. Make package authorization query the relationship ledger rather than the display tree.

Acceptance: test cases correctly resolve a United States combatant command assignment, a National Guard state to federal transition, a PLA theater service component, and Taiwan reserve mobilization without rewriting the organization tree.

### B03 The equipment taxonomy cannot conserve inventories or compose packages

Affected records: all records matching `equipment_category_usa_*`, `equipment_category_chn_*`, and `equipment_category_twn_*`.

The affected identifiers are:

1. United States: `equipment_category_usa_ground_maneuver_system`, `equipment_category_usa_surface_combatant`, `equipment_category_usa_submarine`, `equipment_category_usa_combat_aircraft`, `equipment_category_usa_air_mobility_aircraft`, `equipment_category_usa_military_space_system`, `equipment_category_usa_missile_air_defense_system`, and `equipment_category_usa_joint_command_network`.
2. China: `equipment_category_chn_ground_maneuver_system`, `equipment_category_chn_ground_fire_support_system`, `equipment_category_chn_surface_combatant`, `equipment_category_chn_submarine`, `equipment_category_chn_combat_aircraft`, `equipment_category_chn_ground_air_defense_system`, `equipment_category_chn_missile_launcher_system`, `equipment_category_chn_military_space_system`, `equipment_category_chn_cyber_operations_system`, `equipment_category_chn_joint_logistics_support_system`, and `equipment_category_chn_coast_guard_patrol_vessel`.
3. Taiwan: `equipment_category_twn_ground_maneuver_system`, `equipment_category_twn_coastal_defense_missile_system`, `equipment_category_twn_surface_combatant`, `equipment_category_twn_submarine`, `equipment_category_twn_combat_aircraft`, `equipment_category_twn_ground_air_defense_system`, `equipment_category_twn_uncrewed_aircraft_system`, `equipment_category_twn_joint_command_isr_system`, `equipment_category_twn_coast_guard_patrol_vessel`, and `equipment_category_twn_mobilization_support_system`.

Evidence:

1. The records define no counting unit and no category hierarchy.
2. Identical concepts are duplicated into country specific type identifiers, preventing a common ontology.
3. Launchers, munitions, sensors, command systems, and support equipment are conflated. For example, a missile system depends on a launcher and a munition without stating whether the conserved item is the firing unit, launcher, battery, radar, or missile.
4. Software, doctrine, organizations, and physical equipment are mixed under the same equipment type contract.
5. Every one of the 29 records declares `individualization.supported` as false, including surface combatants and submarines. This contradicts the manifest rule to individualize assets whose identity changes command, mission, loss, or player decision.
6. Aggregate categories encode false mobility. A category containing both fixed and mobile air defense cannot truthfully be `other`, not self deploying, and not requiring strategic lift.

Impact: quantities cannot be added or subtracted safely. A missile expenditure may accidentally destroy a launcher count. A named ship cannot inherit its category. A package cannot distinguish an aircraft from its weapons, sensor support, tanker, runway, and command path. Cross country comparisons become string matching.

Correction packet:

1. Create a global ontology with stable domain, class, family, model, and variant identifiers shared across countries.
2. Add explicit counting units and prohibit reconciliation across different units.
3. Separate platforms, payloads, munitions, launchers, sensors, communications, software, facilities, and support equipment.
4. Permit named platform records to reference a model or variant while aggregate pools reference the same type.
5. Add `varies` or unknown mobility semantics at aggregate levels.
6. Add weapon integration, magazine, sensor, datalink, runway, basing, fuel, maintenance, and support relationships as typed edges with provenance.
7. Add mutation tests that fail when launchers and missiles are combined, named platforms overlap pools, or parent and child taxonomy totals are summed.

Acceptance: a package names the delivery platform, effect payload, munition quantity, sensor and command support, source inventory record, and postmission accounting state with no double counting.

### B04 The force validator certifies emptiness and cannot detect semantic corruption

Affected file: `validate_tier_a_force_ledgers.mjs`.

Evidence: all three countries report `PASS` with no operational records. The validator checks schema shape, local source resolution, manifest counts, and whether named parents exist. It does not require any minimum decision coverage for collecting packets. It does not detect duplicate organization identifiers, duplicate equipment identifiers, parent cycles, self parenting, contradictory command edges, invalid echelon and organization combinations, temporal interval errors, source date misuse, category overlap, taxonomy incompatibility, unsupported completeness, orphan sources, or empty contradiction registries.

Impact: a packet can be internally tidy and militarily useless or wrong. Downstream agents will optimize toward a green check rather than a faithful world model.

Correction packet:

1. Split `schema_valid`, `internally_consistent`, `research_complete`, `decision_usable`, and `simulation_ready` into separate states.
2. Require explicit coverage matrices and acceptance thresholds for every promoted state.
3. Add uniqueness, graph cycle, relationship compatibility, temporal, provenance, and ontology validation.
4. Require nonempty operational families before `decision_usable`.
5. Add negative fixtures for every blocking and major finding in this audit.
6. Make a pass report list what was not tested.

Acceptance: the current three packets pass schema validation but fail decision usability by design, and deliberate semantic mutants fail with specific diagnostics.

## Major findings

### M01 The United States operational chain uses the wrong nodes and command classes

Affected records: `organization_usa_president_commander_in_chief`, `organization_usa_department_of_defense`, `organization_usa_joint_chiefs_of_staff`, and all eleven `organization_usa_*_command` records.

The operational authority node is the Secretary of Defense, not the abstract Department of Defense. The President to Department to command tree obscures the statutory chain. All eleven commands are assigned echelon `theater_command`, even though the official directory distinguishes geographic and functional missions. Cyber Command, Special Operations Command, Strategic Command, and Transportation Command are functional. Space Command has a geographic area beginning above 100 kilometers and cannot be classified correctly by the present binary assumption. [Department of Defense command overview](https://www.defense.gov/Resources/Military-Departments/Our-Story/Combatant-Commands/index.html/).

Correction packet: add office authority nodes or bind incumbent officeholders to institutions; classify each command using an explicit command scope; represent the Secretary of Defense operational chain; keep the Joint Chiefs advisory and planning roles outside operational command.

### M02 The United States Guard is reduced to an Army or Air Force reserve pool

Affected records: `organization_usa_army_national_guard` and `organization_usa_air_national_guard`. Missing records include the National Guard Bureau, state and territorial Joint Force Headquarters, governors, adjutants general, and status transitions.

The official National Guard explanation states that Guard forces have state and federal responsibilities, are commanded by governors through adjutants general in peacetime, and may be activated by the President for federal missions. [National Guard FAQ](https://www.nationalguard.mil/About-the-Guard/Army-National-Guard/FAQ/). A single parent under the Army or Air Force erases this decision space.

Correction packet: add the National Guard Bureau and state level command abstraction; encode State Active Duty, Title 32, and Title 10 status; make controller, funding, mission authority, and command change with status; model dual status commanders as conditional relationships.

### M03 China's four strategic arms are mislabeled as service commands

Affected records: `organization_chn_pla_aerospace_force`, `organization_chn_pla_cyberspace_force`, `organization_chn_pla_information_support_force`, and `organization_chn_pla_joint_logistic_support_force`.

The cited official announcement explicitly distinguishes four services from four arms. [PRC Ministry of National Defense, 19 April 2024](https://eng.mod.gov.cn/xb/News_213114/NewsRelease/16302071.html). The records assign all four `organization_kind: service_command` and `echelon: service_command`. Information Support Force is also assigned the service label `intelligence`, which is a speculative functional translation rather than the official arm identity.

Correction packet: add `strategic_arm` as an organization kind and echelon or use a neutral supported classification; retain each official name; represent missions as sourced claims rather than service labels; add uncertainty around internal command and support relationships.

### M04 China's CMC and theater command skeleton omits the organizations that make it executable

Affected records: `organization_chn_central_military_commission`, `organization_chn_cmc_joint_staff_department`, and all five theater command records.

Missing decision nodes include the CMC Political Work Department, Logistic Support Department, Equipment Development Department, Training Administration Department, National Defense Mobilization Department, Discipline Inspection Commission, theater service components, group armies, fleets, air force bases, Rocket Force bases, and the Joint Logistic Support Center structure. The Eastern Theater Command record has no Army, Navy, Air Force, Rocket Force, Coast Guard, or logistics relationships even though it is the central command for the opening Taiwan crisis.

Correction packet: build the public CMC organ layer; add each theater's service components; connect generating services to operational theaters through typed relationships; preserve uncertainty for nonpublic assignments; prioritize the Eastern Theater Command to mission usable depth before any Taiwan scenario consumes the packet.

### M05 Taiwan's own source names critical command organizations that the packet omits

Affected records: the entire Taiwan organization file. Missing records include MND policy staff, Armaments Bureau, Political Warfare Bureau, the five General Staff offices, Military Intelligence Bureau, Communications Development Office, Information and Electronic Warfare Command, Air Defense Missile Command, General Service Command, and the command system's joint operational command center.

The packet's 2016 official source explicitly lists policy staff, subordinate bureaus, General Staff offices, and execution commands. [Taiwan MND organization page](https://www.mnd.gov.tw/en/informationservices/publication/61179). A later official hierarchy page also describes separate policymaking, command, and armaments systems and an always operating joint operational command center. That later publication is retrospective corroboration only and must not be injected into opening player knowledge without a prebookmark source. [Taiwan MND hierarchy and responsibilities](https://www.mnd.gov.tw/en/informationservices/publication/10010).

Impact: Taiwan cannot conduct intelligence, air defense, electronic warfare, logistics, armament acquisition, or joint command through actual responsible organizations.

Correction packet: extract every public organization from the prebookmark law and organization source; distinguish policy, command, and armaments systems; add the March 2025 Quadrennial Defense Review as a prebookmark strategic source; map only public relationships and mark hidden details unknown.

### M06 Taiwan reserve employment requires concurrent administrative and operational relationships

Affected records: `organization_twn_all_out_defense_mobilization_agency`, `organization_twn_reserve_command`, and `organization_twn_army_command_headquarters`.

The record places Reserve Command only under the mobilization agency while its own roles say the Army coordinates employment of mobilized reserve forces. The current schema cannot represent reserve administration, training, mobilization authority, and wartime operational employment at once.

Correction packet: represent the mobilization agency's administrative relationship, Army coordinated employment, local defense area assignments, and the effective state transition separately; add mobilization delay and equipment pool evidence rather than `null` placeholders.

### M07 Every accepted record misuses evidence date as `valid_from`

Affected records: all 62 organization records and all 29 equipment taxonomy records.

Machine check: 91 of 91 records have `temporal_validity.valid_from` equal to the publication date or asserted observation start of at least one cited source. This makes source publication masquerade as the date the organization, relationship, or equipment category became valid. United States combatant commands appear to begin on 6 January 2025. The Air Force appears to begin on 11 August 2025. China's theater commands appear to begin on 18 December 2024. Taiwan's Army command relationship appears to begin on a 2022 press release date.

Impact: historical replay will create and delete institutions based on research dates. Even at the opening bookmark, a changed relationship cannot be distinguished from a newly published source.

Correction packet: separate `claim_valid_from`, `observed_from`, `source_published_at`, `retrieved_at`, and organization existence intervals; use unknown start dates when the evidence does not establish them; add validator rules prohibiting automatic equality to source dates unless the source explicitly reports the effective date.

### M08 Provenance is adequate for names but not for completeness, capability, or practical command

Affected records: all 18 sources and all provenance blocks.

United States sources are federal statutes, department pages, and CRS summaries. China's packet uses four PRC official sources and one United States Department of Defense report. Taiwan uses six Taiwan government sources. Official sources can establish public names, legal structures, and official mission claims. They do not independently prove complete order of battle, practical command, readiness, availability, or capability quality.

Several mutable pages were accessed on 6 August 2026 but are assigned observation intervals ending on 1 September 2025 without an archived snapshot, content hash, or quoted evidence. The current Department of Defense URLs now redirect to postbookmark branding. The China report URL is a search directory rather than a versioned document. Page locators are broad descriptions instead of reproducible page or section citations.

Correction packet: archive every mutable page; store content hash, retrieval time, language, exact locator, and quoted or extracted claim boundary; use direct versioned PDF links; separate official claim confidence from independent corroboration; require multiple independent source families for practical command, readiness, and completeness.

### M09 Manifest scope overstates accepted coverage

Affected records: all three manifests, especially `scope.services`, `scope.government_forces`, `scope.covered_domains`, and `notes`.

The United States manifest lists nine services or functional areas and six domains. China lists ten service areas and eight domains. Taiwan lists six service areas and six domains. Yet none contains subordinate forces, inventories, or operational states. Listing a service or domain under `covered` invites false absence and downstream completion assumptions.

Correction packet: replace covered lists with a matrix of `not_started`, `identified`, `structured`, `inventory_partial`, `reconciled`, and `decision_usable`; scope every status by organization depth and equipment family; make omitted categories explicit unknowns.

### M10 The capability categories are not a minimum viable military ontology

Affected records: all 29 equipment categories.

The United States has no explicit strategic bomber, tanker, airborne early warning, ISR, helicopter, sealift, replenishment, amphibious, artillery, missile, munition, nuclear, cyber platform, electronic warfare, engineering, or medical category. China and Taiwan have similarly large gaps. China has no amphibious or maritime auxiliary categories despite the Taiwan opening. Taiwan has no air mobility, tanker, helicopter, mine warfare, maritime auxiliary, artillery, or logistics platform categories.

Correction packet: define a global minimum ontology from actual player decisions and package dependencies, not one category per service mission; add a required coverage matrix so omission means unknown rather than absent; prioritize delivery, sensing, command, sustainment, protection, and munition chains.

### M11 Dependency arrays are decorative and unresolvable

Affected records: all 29 `support_dependency_types` arrays.

The arrays contain words such as `crew`, `fuel`, `port`, `runway`, `tanker`, `radar`, `launcher`, and `command_network`, but no referenced objects, quantities, capacities, substitution rules, range limits, failure modes, or temporal availability. A combat aircraft's tanker dependency cannot name a tanker. A surface combatant's port dependency cannot identify compatible berths or maintenance capacity.

Correction packet: replace decorative strings with typed relationship records that reference actual pools or required capability classes; add capacity, consumption, range, timing, compatibility, resilience, and confidence; make package validation traverse these relationships.

### M12 Known uncertainty is not represented as contradictions

Affected records: all three `contradictions.ndjson` files and each manifest's reconciliation counts.

Each contradiction file contains only a newline, so the validator correctly reports zero records. This is implausible for public force research at national scale. The packets themselves contain unresolved distinctions involving command authority, source recency, reserve control, equipment counting units, and completeness, but none is promoted into an auditable contradiction set.

Correction packet: create contradiction records for material competing claims and model ambiguity; distinguish an unknown from a disagreement; require a contradiction or explicit no conflict justification for high impact claims supported only by a mutable or interested official source.

## Minor findings

### N01 One United States statutory source label and URL disagree

Affected source: `src_force_usa_title10_section162_2024`.

The identifier and title say 2024, `published_at` is 6 January 2025, and the URL requests the 2024 edition while embedding a 2012 granule identifier. The statute may still resolve, but the metadata is not reproducible.

Correction packet: link the exact 2024 section record or versioned GovInfo document; store laws in effect date separately from publication date; validate URL edition against source identifier.

### N02 Source types conflate government reports with independent research

Affected sources: `src_force_chn_defense_white_paper_2019`, `src_force_twn_mnd_national_defense_report_2023`, and similar records typed `research_report`.

These are official government publications by the force being described. Their source type should preserve institutional interest and independence group rather than appear equivalent to external research.

Correction packet: add publisher interest, independence group, and evidence purpose fields; distinguish official white papers from legislative research and independent analysis.

### N03 Organization component values mix legal status with institution type

Affected examples: national command authorities use `civilian_agency` in the United States and Taiwan, while China's CMC is `active`. Coast guards, ministries, reserve pools, and armed services use the same component field for incompatible concepts.

Correction packet: separate military component status, institution type, civilian or military character, and mobilization status. Do not use one enum for all four.

### N04 Uniform review dates do not express evidence volatility

Affected records: all 91 accepted organization and taxonomy records.

Every record uses `review_after: 2026-11-06`, regardless of whether the source is a statute, a mutable live page, a rapidly changing command, or a decades old organization chart.

Correction packet: derive review cadence from source mutability, claim volatility, and decision impact; review live command relationships sooner than stable statutory definitions.

## Exact correction work packets

### Packet F01 Relationship graph contract

Owner: Simulation architecture and World Research.

Deliverables: typed organization relationship schema, containment tree rules, authority scopes, effective intervals, provenance, multiple concurrent relationships, transition events, cycle validator, and four country specific regression fixtures.

Closes: B02, M01, M02, M03, M06, and N03.

### Packet F02 Global equipment ontology

Owner: Simulation architecture and World Research.

Deliverables: global taxonomy identifiers, hierarchy, counting units, platform and payload separation, mobility uncertainty, individualization rules, compatibility relationships, and negative conservation fixtures.

Closes: B03, M10, M11, and N02.

### Packet F03 Force ledger acceptance states

Owner: Integration and Agent 09.

Deliverables: separate schema, consistency, research completeness, decision usability, and simulation readiness statuses; coverage matrix; promotion thresholds; semantic validator diagnostics; mutation tests.

Closes: B01, B04, and M09.

### Packet F04 United States executable command foundation

Owner: United States country researcher.

Deliverables: Secretary of Defense authority node, geographic and functional command classes, service generation relationships, combatant command assignments, National Guard Bureau, status transitions, state abstraction, and provenance.

Closes: M01 and M02.

### Packet F05 China executable command foundation

Owner: China country researcher.

Deliverables: CMC organs, correct strategic arm classification, theater service components, generating to operating relationships, Eastern Theater Command priority depth, reserve and militia relationships, and explicit uncertainty.

Closes: M03 and M04.

### Packet F06 Taiwan executable command foundation

Owner: Taiwan country researcher.

Deliverables: policy, command, and armaments systems; General Staff offices and execution commands; joint operational command center; reserve administrative and operational relationships; March 2025 QDR source; and public provenance.

Closes: M05 and M06.

### Packet F07 Temporal provenance repair

Owner: Corpus architecture.

Deliverables: separate effective, observed, published, and retrieved dates; archives and content hashes; direct document locators; source independence metadata; 91 corrected intervals; automatic backdating detection.

Closes: M07, M08, N01, N02, and N04.

### Packet F08 First conserved inventory slice

Owner: United States, China, and Taiwan country researchers with independent review.

Deliverables: one complete cross domain operational slice per country with named high value platforms, aggregate pools, organizations, deployments at the approved abstraction, maintenance, construction, and conservation. For the Taiwan theater, the slice must include delivery platforms, munitions, sensing, command, logistics, and base dependencies sufficient to explain every executable package.

Closes: B01 and exposes defects in B03 before national scale ingestion.

## Correction order and acceptance gate

1. Implement F03 immediately so green validation cannot be confused with force readiness.
2. Implement F01 and F02 before adding large inventory volumes. Otherwise research will be migrated twice or conserved incorrectly.
3. Repair temporal provenance through F07 before accepting new historical claims.
4. Execute F04, F05, and F06 to decision usable command depth.
5. Prove the contracts through F08 before scaling to complete national inventories.
6. Rerun the complete validation suite and every new mutation fixture.
7. Obtain a second independent audit of corrected packets.

No force lane may advance beyond `collecting`, and no simulation may infer capability absence from these packets, until all four blocking findings are closed. The current organization records may support a labeled command overview only. The equipment categories may support research queue planning only. They must not authorize, generate, recommend, or resolve military effects.
