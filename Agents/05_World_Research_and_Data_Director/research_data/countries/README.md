# Country Dossiers

## Canonical registry

`country_registry.json` contains the frozen 80 country GDP cohort plus 11
mandatory strategic additions for the 1 September 2025 bookmark.

The registry is the authority for country identity, research tier, coverage
status, priority, and dossier path. It does not claim that every registered
country is already populated.

The Tier A foundations are:

1. `usa/profile.json`
2. `chn/profile.json`
3. `twn/profile.json`

Each profile links to a force ledger manifest. The acceptance questions and
collection order are in `TIER_A_FOUNDATION.md`.

The remaining 77 members of the frozen top 80 cohort have deterministic dossier
shells containing only roster backed identity, GDP cohort, research tier, and
opening bookmark metadata. These shells deliberately leave substantive country
state unknown. Their numeric zeros count accepted corpus records and never mean
that a country has zero real world people, units, facilities, or capacity.

Regenerate and verify those shells from the repository root:

```text
node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/generate_top80_shells.mjs
node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/generate_top80_shells.mjs --check
node Agents/05_World_Research_and_Data_Director/research_data/countries/tools/validate_top80_shells.mjs
```

## Organization

Each selected country receives one directory named by lowercase ISO alpha 3 code.

Example:

```text
countries/
  usa/
    README.md
    profile.json
    claims.ndjson
    sources.json
    organizations.geojson
    facilities.geojson
    infrastructure.geojson
    force_ledger/
      manifest.json
      organizations.ndjson
      equipment_types.ndjson
      inventory.ndjson
      deployments.ndjson
    starting_state.json
```

Files are introduced only when sourced data exists. Empty completeness theater is
not useful.

## Required dossier sections

1. Government and leadership.
2. Constitutional and practical decision authority.
3. Institutions and domestic factions.
4. Economy, finance, and trade.
5. Population, culture, religion, and legitimacy.
6. Science, technology, and education.
7. Energy and strategic resources.
8. Industry and dual use capacity.
9. Military command and service structure.
10. Personnel, force structure, inventory, and readiness.
11. Basing, access, mobility, and logistics.
12. Intelligence, cyber, information, and space capability.
13. Alliances, dependencies, claims, and strategic objectives.
14. Publicly documented strategic infrastructure.
15. Starting bookmark state and alternative plans.

## Fidelity rule

Country depth is driven by gameplay relevance and evidence. A dossier is allowed
to say unknown. It is not allowed to fill gaps with confident sounding prose.
