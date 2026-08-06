# Research Stage Kickoff

## Status

1. Stage: research.
2. Started: 2026-08-01.
3. Design authority: the approved brainstorming constitution in `plan/`.
4. Implementation authority: none. Simulation engine construction remains a
   later stage.
5. First benchmark: Justice Mission 2025.
6. First playable detailed theater: Taiwan Strait.
7. Initial playable countries: United States, China, and Taiwan.
8. Global layer: macro simulation for all represented countries.
9. Canonical opening bookmark: 1 September 2025.

## Research objectives

1. Build a stable source and claim system before scaling collection.
2. Freeze a reproducible top 80 economy cohort.
3. Reconstruct the global opening state at the 1 September 2025 historical
   cutoff.
4. Create country dossiers covering political leadership, institutions, economy,
   military structure, inventory, strategic industry, infrastructure, alliances,
   and active crises.
5. Create theater dossiers that preserve operational time, geography, force
   measures, uncertainty, and contradictions.
6. Create global infrastructure datasets at the level needed for meaningful
   strategic decisions.
7. Propose playable abstractions without deciding game mechanics prematurely.

## Research sequence

### Checkpoint 0: Corpus integrity

1. Validate all schemas.
2. Add a contradiction record.
3. Add cross reference checks.
4. Add provenance completeness checks.
5. Freeze controlled vocabularies.
6. Publish a validation report.

### Checkpoint 1: Justice Mission benchmark

1. Register primary and secondary sources.
2. Encode the five publicly announced live fire polygons.
3. Preserve the later reporting of additional zones as a known gap until their
   exact public notices are recovered.
4. Encode aircraft activity as sorties, not unique airframes.
5. Encode naval presence by reporting window and peak count.
6. Encode individually identified hulls separately from aggregate counts.
7. Encode rockets separately from launchers and firing formations.
8. Preserve all platform identification contradictions.
9. Separate official claims, observations, inferences, and estimates.
10. Produce a benchmark acceptance report.

### Checkpoint 2: Top 80 cohort

Status: complete. The cohort is frozen to the IMF April 2026 WEO vintage and 2025 NGDPD values.

1. Select one complete GDP reference year.
2. Retrieve and archive the canonical dataset.
3. Resolve territories and missing values.
4. Produce a ranked candidate cohort.
5. Cross check boundary cases.
6. Freeze a versioned roster only after review.

### Checkpoint 3: Starting bookmark

Status: date and knowledge boundary frozen.

1. Use 1 September 2025 as the canonical opening date.
2. Freeze the historical information cutoff at the opening instant.
3. Assemble governments, leaders, alliances, conflicts, sanctions, economies,
   and force posture as they existed at that boundary.
4. Label every later historical event as an optional reference trajectory.
5. Reject future knowledge from opening datasets unless it is explicitly marked
   as designer reference material unavailable to the simulation.

### Checkpoint 4: Country and global coverage

1. Create every country dossier shell.
2. Research the first playable countries in depth.
3. Research other countries in tiered depth.
4. Build political actor rosters.
5. Build complete, dated force ledgers for every top 80 country, including all services, reserves, maintenance, storage, construction, commands, formations, basing, and global deployments.
6. Build strategic infrastructure and industry datasets.
7. Build crisis and event chain datasets.

## Acceptance gates

A dataset may be marked `verified` only when all applicable gates pass.

1. Every factual record has at least one registered source.
2. Every record has an observation interval, validity interval, or as of date.
3. Source independence is not overstated.
4. Force measures use the correct unit.
5. Mobile observations are historical and expire.
6. Exact coordinates are justified by a public source and gameplay need.
7. Contradictions are recorded rather than resolved by convenience.
8. Unknown values remain unknown.
9. Designed and synthetic records are labeled.
10. Machine readable files pass schema and cross reference validation.
11. A reviewer records the review date and known gaps.
12. Simulation representation proposals remain proposals until design review.
13. Opening state records contain no unmarked information learned after
    1 September 2025.

## Representation levels

Research should collect only enough detail to support the approved player
abstraction.

1. Global level: countries, alliances, trade, influence, strategic networks, and
   theater level force posture.
2. National level: provinces, governments, economy, political actors, military
   branches, production, logistics, and public strategic infrastructure.
3. Theater level: formations, bases, routes, sensors, missions, and operational
   events.
4. Tactical workbench level: tracks, observations, target hypotheses, mission
   packages, effects, and assessment.

Individual units and sites are represented only when their identity creates a
meaningful decision. Repetitive entities should be aggregated and expand on
demand.

## Safety and fidelity boundary

The corpus represents public historical and structural information for a private
strategy game. It does not need speculative vulnerable component coordinates,
current covert positions, or instructions for attacking real systems.

When exact knowledge is unavailable, the correct outputs are an approximate
region, a capability aggregate, a synthetic game object, or an explicit unknown.

## Immediate deliverables

1. Corpus integrity validation.
2. Justice Mission 2025 benchmark completion.
3. Complete force ledger data contracts.
4. United States, China, and Taiwan dossier foundations.
5. Opening state source ledger for 1 September 2025.
6. Global country dossier generation workflow.
7. Theater and infrastructure research work packages.
8. Autonomous research wave reporting.

## Stage exit criteria

The research stage is not complete until:

1. The 1 September 2025 opening bookmark is reconstructed and reviewed.
2. The top 80 cohort is frozen.
3. The first playable countries have reviewed dossiers.
4. The Taiwan Strait has a reviewed theater dataset.
5. Global macro starting state coverage and complete top 80 force ledgers exist.
6. Critical infrastructure taxonomies have representative datasets.
7. Provenance, contradiction, and validation tooling is operational.
8. Known gaps are explicit enough for game design to choose abstractions.
