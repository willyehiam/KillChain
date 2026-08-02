# Frozen Top 80 Country Cohort

## Authority

The machine readable authority is `top_80_2025_gdp.json`.

The portable tabular projection is `top_80_2025_gdp.csv`.

The human readable review is
`../../TOP_80_COUNTRIES.md`.

## Source

1. Publisher: International Monetary Fund.
2. Dataset: World Economic Outlook Database.
3. Vintage: April 2026.
4. Dataset version: `IMF.RES:WEO(9.0.0)`.
5. Indicator: `NGDPD`.
6. Reference year: 2025.
7. Unit: billions of current United States dollars.
8. Publication date: 2026-04-14.
9. Source registry ID: `src_imf_weo_2026_04_ngdpd_2025`.

## Cohort rule

1. Rank sovereign states and Taiwan by the published value.
2. Exclude nonsovereign territories and special administrative regions from the
   80 country count.
3. Preserve excluded economies as strategic subnational entities.
4. Freeze the source vintage.
5. Add essential theater actors outside the GDP cutoff without displacing ranked
   members.

## Boundary resolution

Hong Kong and Puerto Rico cross the unfiltered economy cutoff but are excluded
from the country count.

The resulting country boundary is:

1. Rank 80: Panama.
2. Rank 81: Tanzania.
3. Rank 82: Uruguay.
4. Rank 83: Myanmar.

Taiwan is included at rank 22.

## Statistical interpretation

The 2025 column combines published actual data and IMF staff estimates depending
on the latest actual reporting period available for each country. Every country
record preserves that period.

The ranking determines cohort membership only. It does not measure military
power, player difficulty, state capacity, or required content depth.

## Validation

Run from the repository root:

`node Agents/05_World_Research_and_Data_Director/research_data/tools/validate_top80.mjs Agents/05_World_Research_and_Data_Director/research_data/countries/top_80_2025/top_80_2025_gdp.json`
