import fs from "node:fs";

const path = process.argv[2] ?? "top_80_2025_gdp.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

assert(data.schema_version === "1.0.0", "schema_version must be 1.0.0");
assert(data.status === "frozen", "roster must be frozen");
assert(data.reference_year === 2025, "reference_year must be 2025");
assert(data.metric === "nominal_gdp_current_prices_usd", "metric mismatch");
assert(data.unit === "billions_current_usd", "unit mismatch");
assert(data.source?.publisher === "International Monetary Fund", "publisher mismatch");
assert(data.source?.dataset_vintage === "April 2026", "dataset vintage mismatch");
assert(data.source?.dataset_version === "IMF.RES:WEO(9.0.0)", "dataset version mismatch");
assert(data.source?.indicator_id === "NGDPD", "indicator mismatch");
assert(/^[a-f0-9]{64}$/.test(data.source?.source_sha256 ?? ""), "source SHA256 is invalid");

const countries = data.countries ?? [];
assert(countries.length === 80, `expected 80 countries, received ${countries.length}`);

const codes = new Set();
for (let index = 0; index < countries.length; index += 1) {
  const country = countries[index];
  assert(country.rank === index + 1, `rank sequence breaks at index ${index}`);
  assert(/^[A-Z]{3}$/.test(country.country_code ?? ""), `invalid country code at rank ${country.rank}`);
  assert(!codes.has(country.country_code), `duplicate country code ${country.country_code}`);
  codes.add(country.country_code);
  assert(typeof country.name === "string" && country.name.length > 0, `missing name at rank ${country.rank}`);
  assert(Number.isFinite(country.gdp_2025_usd_billions), `invalid GDP at rank ${country.rank}`);
  assert(country.gdp_2025_usd_billions > 0, `nonpositive GDP at rank ${country.rank}`);
  assert(country.series_code === `${country.country_code}.NGDPD.A`, `series code mismatch for ${country.country_code}`);
  assert(country.publication_date === data.source.publication_date, `publication date mismatch for ${country.country_code}`);
  assert(country.latest_actual_period !== null && country.latest_actual_period !== "", `missing latest actual period for ${country.country_code}`);
  if (index > 0) {
    const previous = countries[index - 1];
    assert(
      previous.gdp_2025_usd_billions >= country.gdp_2025_usd_billions,
      `GDP order breaks between ${previous.country_code} and ${country.country_code}`,
    );
  }
}

assert(countries[0]?.country_code === "USA", "United States must rank first");
assert(countries[1]?.country_code === "CHN", "China must rank second");
assert(countries[21]?.country_code === "TWN", "Taiwan must rank 22");
assert(countries[79]?.country_code === "PAN", "Panama must rank 80");
assert(!codes.has("HKG"), "Hong Kong must not count as a sovereign cohort country");
assert(!codes.has("PRI"), "Puerto Rico must not count as a sovereign cohort country");

const excludedCodes = new Set((data.excluded_boundary_economies ?? []).map((item) => item.country_code));
assert(excludedCodes.has("HKG"), "Hong Kong exclusion is missing");
assert(excludedCodes.has("PRI"), "Puerto Rico exclusion is missing");

const boundary = data.boundary_review ?? [];
assert(boundary.length === 10, `expected 10 boundary records, received ${boundary.length}`);
assert(boundary[4]?.country_code === "PAN" && boundary[4]?.included === true, "Panama boundary record mismatch");
assert(boundary[5]?.country_code === "TZA" && boundary[5]?.included === false, "Tanzania boundary record mismatch");

const additions = data.mandatory_strategic_additions ?? [];
const additionCodes = new Set(additions.map((item) => item.country_code));
assert(additionCodes.has("PRK"), "North Korea strategic addition is missing");
for (const code of additionCodes) {
  assert(!codes.has(code), `strategic addition ${code} duplicates the GDP cohort`);
}

const result = {
  status: errors.length === 0 ? "PASS" : "FAIL",
  countries: countries.length,
  first: countries[0]?.country_code ?? null,
  last: countries.at(-1)?.country_code ?? null,
  boundary_records: boundary.length,
  excluded_boundary_economies: excludedCodes.size,
  strategic_additions: additions.length,
  errors,
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
