# Top 80 Country Cohort

## Status

Selection method is defined. The actual versioned cohort has not yet been frozen.

## Why this cannot be an unqualified list

"Top 80 by GDP" changes depending on:

1. Nominal GDP or purchasing power parity.
2. Source.
3. Reference year.
4. Market exchange rate revisions.
5. Whether territories or only sovereign states are included.
6. Treatment of countries with missing or disputed statistics.

The corpus must not mix these choices invisibly.

## Proposed canonical rule

For the first cohort:

1. Rank sovereign playable states by nominal GDP in current United States
   dollars.
2. Use one complete reference year from one canonical dataset.
3. Prefer the World Bank indicator `NY.GDP.MKTP.CD`.
4. Cross check major discrepancies against the IMF World Economic Outlook.
5. Record the dataset release date and every manual inclusion or exclusion.
6. Freeze the resulting list under a cohort version such as
   `top80_nominal_2025_v1`.

The reference year remains subject to source availability and founder approval.

## Playability overlay

GDP rank determines the initial research cohort, not identical content depth.

Each country will also receive:

1. Strategic archetype.
2. Region.
3. Regime and institutional model.
4. Conflict relevance.
5. Data availability.
6. Bespoke content tier.
7. Starting bookmark importance.

A lower GDP country that is central to an active theater may need deeper bespoke
content than a higher GDP country outside the opening campaign focus.

## Cohort artifact

The frozen list must record:

1. Rank.
2. ISO alpha 3 code.
3. Country name.
4. GDP value and unit.
5. Reference year.
6. Source ID.
7. Inclusion status.
8. Research status.
9. Bespoke content tier.
10. Notes.

## Next action

Retrieve and archive the canonical official dataset, produce the candidate list,
review edge cases, and request founder approval before freezing version 1.
