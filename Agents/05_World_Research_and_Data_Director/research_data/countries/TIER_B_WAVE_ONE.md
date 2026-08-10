# Tier B Wave One

## Status

The first Tier B research wave is structurally open for the 1 September 2025 bookmark.

The wave contains Japan, South Korea, North Korea, Russia, India, Australia, and the Philippines. These countries connect the first Taiwan centered theater to the Korean Peninsula, Ukraine, the Indian Ocean, strategic deterrence, global alliances, and major industrial systems.

This checkpoint creates research questions and work contracts. It does not claim that any country has been substantively researched. Every generated lane remains `shell`, every accepted evidence count remains zero, and no force ledger or bookmark state exists for these countries yet.

## Why this wave comes first

1. Japan and the Philippines shape access, basing, maritime geography, and political participation around Taiwan.
2. South Korea and North Korea create a simultaneous peninsula deterrence problem that can consume forces and alter escalation choices.
3. Russia connects the Pacific to the active Ukraine war, Arctic posture, strategic forces, sanctions, and global redeployment tradeoffs.
4. India connects China to the Himalayan frontier, Pakistan, the Indian Ocean, energy routes, and an independent intervention calculus.
5. Australia contributes long distance access, alliance choices, northern basing, sustainment, industry, and Indian Ocean reach.

These are research priorities, not assumptions about how any country will behave in the game.

## Generated artifacts

Each country receives:

1. `research_manifest.json` with identity, bookmark, file links, acceptance gates, and explicit unknowns.
2. `lane_coverage.json` with eight bounded research lanes and country specific blocking questions.
3. `WORK_PACKAGES.md` with eight lane packages plus bookmark integration.

The generated files are deterministic. Recreate or verify them with:

```text
node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/generate_tier_b_wave_one.mjs
node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/generate_tier_b_wave_one.mjs --check
```

Validate the full wave with:

```text
node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/validate_tier_b_wave_one.mjs
```

## Collection order

### Pass 1: Identity, authority, and map frame

1. Opening government and practical decision authority.
2. Twenty plausible political actors where public evidence supports inclusion.
3. Province level administrative geometry and stable identifiers.
4. Alliance, access, war authority, emergency, and succession pathways.

### Pass 2: Complete national force universe

1. Ministries, joint commands, services, components, formations, reserves, and relevant government forces.
2. Equipment taxonomy and mutually exclusive national inventory pools.
3. Named platforms only when identity changes command, mission, loss, or a player decision.
4. Readiness, maintenance, training, storage, construction, mobilization, and current commitment states.
5. Conservation records that prevent duplicated units and magical mission packages.

### Pass 3: Strategic capacity and endurance

1. Public bases, ports, airfields, headquarters, depots, maintenance, and access nodes.
2. Shipbuilding, aerospace, vehicles, missiles, munitions, electronics, semiconductors, and repair capacity.
3. Energy, transport, communications, data, trade, finance, and logistics networks.
4. Substitution, repair, surge, import, political access, and resilience constraints.

### Pass 4: Crisis integration

1. Opening deployments and active commitments.
2. Existing wars, crises, sanctions, patrols, and exercises.
3. Intervention routes, competing commitments, and redeployment risk.
4. Theater overlays that reference the conserved national force ledger rather than creating assets.

## Promotion gates

1. A lane advances from `shell` only after at least one source and one atomic claim are accepted.
2. A planning question never becomes an opening fact.
3. A country cannot create a force ledger from a crisis roster alone.
4. A force pool cannot become executable until identity, quantity, authority, readiness, support, and conservation gates pass.
5. A post bookmark source cannot establish opening knowledge without explicit retrospective justification and firewall review.
6. Independent review remains mandatory before a country or lane becomes decision usable.

## Immediate next work

1. Register primary government, constitutional, statistical, defense, geography, and alliance sources for Japan.
2. Build the first atomic politics and authority packet for Japan without entering later events into the opening bookmark.
3. In parallel research ordering, prepare the source registries for South Korea and the Philippines because their access decisions directly shape the first theater.
4. Keep North Korean quantities and locations explicitly uncertain wherever public evidence cannot support precision.
5. Do not begin engine implementation from these shells.
