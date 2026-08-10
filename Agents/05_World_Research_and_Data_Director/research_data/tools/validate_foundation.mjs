#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_ACCOUNTING_STATES = [
  "active",
  "committed",
  "in_transit",
  "training",
  "maintenance",
  "reserve",
  "stored",
  "under_construction",
  "damaged",
  "destroyed",
  "exported",
  "retired",
  "captured",
  "unknown",
];

const REQUIRED_LANES = [
  "politics_and_institutions",
  "economy_trade_finance_resources",
  "military_organization_inventory",
  "fixed_facilities_basing",
  "strategic_industry_conversion",
  "energy_transport_communications_logistics",
  "geography_provinces_terrain",
  "crises_alliances_sanctions_deployments",
];

const NEW_SCHEMAS = [
  "bookmark.schema.json",
  "country_registry.schema.json",
  "country_dossier.schema.json",
  "military_organization_record.schema.json",
  "military_organization_relationship.schema.json",
  "equipment_type_record.schema.json",
  "force_inventory_record.schema.json",
  "force_deployment_record.schema.json",
  "force_ledger_manifest.schema.json",
];

const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${file}: ${error.message}`);
    return null;
  }
}

function readNdjson(file) {
  try {
    return fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          fail(`${file}:${index + 1}: ${error.message}`);
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    fail(`${file}: ${error.message}`);
    return [];
  }
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sameMembers(actual, expected) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    expected.every((item) => actual.includes(item))
  );
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const researchRoot = path.resolve(process.argv[2] ?? path.join(scriptDirectory, ".."));
const schemaRoot = path.join(researchRoot, "schemas");
const countriesRoot = path.join(researchRoot, "countries");
const bookmarkRoot = path.join(researchRoot, "bookmarks", "2025_09_01");
const TIER_A_COUNTRY_DIRECTORIES = ["usa", "chn", "twn"];
const LOCAL_EVIDENCE_COUNTRY_DIRECTORIES = [...TIER_A_COUNTRY_DIRECTORIES, "jpn"];

for (const schema of NEW_SCHEMAS) {
  readJson(path.join(schemaRoot, schema));
}

const cohort = readJson(path.join(countriesRoot, "top_80_2025", "top_80_2025_gdp.json"));
const registry = readJson(path.join(countriesRoot, "country_registry.json"));
const bookmark = readJson(path.join(bookmarkRoot, "bookmark.json"));
const globalSources = readNdjson(path.join(researchRoot, "sources", "sources.ndjson"));
const bookmarkSources = readNdjson(path.join(bookmarkRoot, "sources.ndjson"));
const countryLocalSources = LOCAL_EVIDENCE_COUNTRY_DIRECTORIES.flatMap((countryCode) => {
  const registryPath = path.join(countriesRoot, countryCode, "evidence_registry.json");
  const evidenceRegistry = readJson(registryPath);
  return (evidenceRegistry?.sources ?? []).map((source) => ({
    source,
    origin: path.relative(researchRoot, registryPath),
  }));
});
const tierAGeographySources = TIER_A_COUNTRY_DIRECTORIES.flatMap((countryCode) => {
  const sourcePath = path.join(countriesRoot, countryCode, "geography", "sources.ndjson");
  if (!fs.existsSync(sourcePath)) return [];
  return readNdjson(sourcePath).map((source) => ({
    source,
    origin: path.relative(researchRoot, sourcePath),
  }));
});
const tierAInfrastructureSources = TIER_A_COUNTRY_DIRECTORIES.flatMap((countryCode) => {
  const infrastructureRoot = path.join(countriesRoot, countryCode, "infrastructure");
  if (!fs.existsSync(infrastructureRoot)) return [];
  return fs.readdirSync(infrastructureRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const sourcePath = path.join(infrastructureRoot, entry.name, "sources.ndjson");
      if (!fs.existsSync(sourcePath)) return [];
      return readNdjson(sourcePath).map((source) => ({
        source,
        origin: path.relative(researchRoot, sourcePath),
      }));
    });
});

const sourceRecords = [
  ...globalSources.map((source) => ({ source, origin: "sources/sources.ndjson" })),
  ...bookmarkSources.map((source) => ({
    source,
    origin: "bookmarks/2025_09_01/sources.ndjson",
  })),
  ...countryLocalSources,
  ...tierAGeographySources,
  ...tierAInfrastructureSources,
];
const canonicalSourceById = new Map();

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

for (const { source, origin } of sourceRecords) {
  if (!source?.source_id) {
    fail(`${origin}: source missing source_id`);
    continue;
  }
  const existing = canonicalSourceById.get(source.source_id);
  if (existing) {
    assert(
      canonicalJson(existing.source) === canonicalJson(source),
      `${source.source_id}: divergent duplicate source records in ${existing.origin} and ${origin}`,
    );
  } else {
    canonicalSourceById.set(source.source_id, { source, origin });
  }
}

const allSources = [...canonicalSourceById.values()].map(({ source }) => source);
const sourceIds = new Set(canonicalSourceById.keys());

for (const source of allSources) {
  for (const field of ["source_id", "title", "publisher", "accessed_at", "source_tier", "source_type"]) {
    assert(source[field] !== undefined, `${source.source_id ?? "unknown source"}: missing ${field}`);
  }
}

assert(bookmark?.status === "frozen", "Bookmark must be frozen");
assert(bookmark?.world_time === "2025-09-01T00:00:00Z", "Unexpected bookmark world time");
for (const condition of bookmark?.opening_conditions ?? []) {
  for (const sourceId of condition.source_ids ?? []) {
    assert(sourceIds.has(sourceId), `${condition.condition_id}: unknown source ${sourceId}`);
  }
}
for (const event of bookmark?.historical_trajectory_references ?? []) {
  assert(
    Date.parse(event.occurred_after_start) > Date.parse(bookmark.world_time),
    `${event.event_id}: trajectory does not occur after the bookmark`,
  );
  assert(
    event.use === "reference_only_not_initial_state",
    `${event.event_id}: post start event may not initialize world state`,
  );
  for (const sourceId of event.source_ids ?? []) {
    assert(sourceIds.has(sourceId), `${event.event_id}: unknown source ${sourceId}`);
  }
}

assert(cohort?.countries?.length === 80, "GDP cohort must contain 80 ranked countries");
assert(
  cohort?.mandatory_strategic_additions?.length === 11,
  "Strategic addition list must contain 11 countries",
);
assert(registry?.countries?.length === 91, "Country registry must contain 91 records");
assert(
  registry?.registry_id === "country_registry_2025_09_01_v1",
  "Country registry identifier must match the fall 2025 bookmark",
);
assert(
  registry?.bookmark_id === bookmark?.bookmark_id,
  "Country registry and bookmark identifiers must match",
);

const countryIds = new Set();
const countryCodes = new Set();
for (const country of registry?.countries ?? []) {
  assert(!countryIds.has(country.country_id), `Duplicate country id ${country.country_id}`);
  assert(!countryCodes.has(country.country_code), `Duplicate country code ${country.country_code}`);
  countryIds.add(country.country_id);
  countryCodes.add(country.country_code);
}

for (const ranked of cohort?.countries ?? []) {
  const registered = registry.countries.find((country) => country.country_code === ranked.country_code);
  assert(Boolean(registered), `Ranked country missing from registry: ${ranked.country_code}`);
  if (!registered) continue;
  assert(
    registered.roster_basis === "top_80_2025_nominal_gdp",
    `${ranked.country_code}: incorrect roster basis`,
  );
  assert(registered.gdp_rank === ranked.rank, `${ranked.country_code}: GDP rank mismatch`);
  assert(
    registered.gdp_2025_usd_billions === ranked.gdp_2025_usd_billions,
    `${ranked.country_code}: GDP value mismatch`,
  );
}

for (const addition of cohort?.mandatory_strategic_additions ?? []) {
  const registered = registry.countries.find((country) => country.country_code === addition.country_code);
  assert(Boolean(registered), `Strategic addition missing from registry: ${addition.country_code}`);
  if (registered) {
    assert(
      registered.roster_basis === "mandatory_strategic_addition",
      `${addition.country_code}: incorrect strategic roster basis`,
    );
  }
}

const tierACodes = registry.countries
  .filter((country) => country.depth_tier === "A")
  .map((country) => country.country_code);
assert(
  sameMembers(tierACodes, ["USA", "CHN", "TWN"]),
  `Tier A must be USA, CHN, and TWN; found ${tierACodes.join(", ")}`,
);

let profileCount = 0;
let rankedProfileCount = 0;
let strategicAdditionProfileCount = 0;
let tierAProfileCount = 0;
let forceLedgerCount = 0;
let provinceLayerCount = 0;
let infrastructureLayerCount = 0;

for (const country of registry.countries.filter((entry) => entry.profile_path)) {
  const profilePath = path.join(researchRoot, country.profile_path);
  const profile = readJson(profilePath);
  if (!profile) continue;
  profileCount += 1;
  if (country.roster_basis === "top_80_2025_nominal_gdp") rankedProfileCount += 1;
  if (country.roster_basis === "mandatory_strategic_addition") {
    strategicAdditionProfileCount += 1;
  }

  assert(profile.country_id === country.country_id, `${country.country_code}: profile id mismatch`);
  assert(profile.country_code === country.country_code, `${country.country_code}: profile code mismatch`);
  assert(profile.bookmark_id === bookmark.bookmark_id, `${country.country_code}: profile bookmark mismatch`);
  assert(profile.as_of === bookmark.world_time, `${country.country_code}: profile time mismatch`);
  assert(profile.depth_tier === country.depth_tier, `${country.country_code}: profile tier mismatch`);
  if (country.depth_tier === "A") tierAProfileCount += 1;
  assert(
    sameMembers(Object.keys(profile.coverage ?? {}), REQUIRED_LANES),
    `${country.country_code}: dossier must contain exactly eight coverage lanes`,
  );
  assert(
    profile.completeness?.political_actor_target === 20,
    `${country.country_code}: political actor target must be 20`,
  );
  assert((profile.unknowns ?? []).length > 0, `${country.country_code}: shell must state unknowns`);

  for (const sourceId of profile.source_ids ?? []) {
    assert(sourceIds.has(sourceId), `${country.country_code}: unknown profile source ${sourceId}`);
  }

  if (profile.dataset_paths.provinces) {
    const provincePath = path.resolve(path.dirname(profilePath), profile.dataset_paths.provinces);
    assert(fs.existsSync(provincePath), `${country.country_code}: province layer does not exist`);
    const provinceLayer = readJson(provincePath);
    if (provinceLayer) {
      provinceLayerCount += 1;
      assert(provinceLayer.type === "FeatureCollection", `${country.country_code}: province layer must be GeoJSON`);
      assert(
        provinceLayer.features?.length === profile.coverage.geography_provinces_terrain.record_count,
        `${country.country_code}: province layer count differs from dossier metadata`,
      );
      assert(
        profile.completeness?.province_layer_status !== "absent",
        `${country.country_code}: populated province layer cannot be reported as absent`,
      );
    }
  } else {
    assert(
      profile.completeness?.province_layer_status === "absent",
      `${country.country_code}: absent province layer has a populated status`,
    );
  }

  if (profile.dataset_paths.infrastructure) {
    const infrastructureManifestPath = path.resolve(path.dirname(profilePath), profile.dataset_paths.infrastructure);
    assert(fs.existsSync(infrastructureManifestPath), `${country.country_code}: infrastructure manifest does not exist`);
    const infrastructureManifest = readJson(infrastructureManifestPath);
    if (infrastructureManifest) {
      infrastructureLayerCount += 1;
      assert(infrastructureManifest.country_id === undefined || infrastructureManifest.country_id === country.country_id, `${country.country_code}: infrastructure manifest country mismatch`);
      assert(infrastructureManifest.coverage?.as_of === bookmark.world_time, `${country.country_code}: infrastructure bookmark mismatch`);
      assert(infrastructureManifest.record_counts?.total_records === profile.coverage.energy_transport_communications_logistics.record_count, `${country.country_code}: infrastructure record count differs from dossier metadata`);
      assert(profile.completeness?.infrastructure_layer_status !== "absent", `${country.country_code}: populated infrastructure layer cannot be reported as absent`);
      const childManifests = Object.values(infrastructureManifest.child_manifests ?? {}).map((relative) => {
        const childPath = path.resolve(path.dirname(infrastructureManifestPath), relative);
        assert(fs.existsSync(childPath), `${country.country_code}: infrastructure child manifest does not exist: ${relative}`);
        return readJson(childPath);
      }).filter(Boolean);
      if (childManifests.length) {
        const childRecordCount = childManifests.reduce((sum, child) => sum + (child.record_counts?.total_records ?? 0), 0);
        assert(childRecordCount === infrastructureManifest.record_counts?.total_records, `${country.country_code}: infrastructure rollup does not conserve child record counts`);
        const childSourceIds = new Set(childManifests.flatMap((child) => child.source_ids ?? []));
        assert(sameMembers([...childSourceIds], infrastructureManifest.source_ids ?? []), `${country.country_code}: infrastructure rollup source set differs from children`);
      }
    }
  } else {
    assert(profile.completeness?.infrastructure_layer_status === undefined || profile.completeness?.infrastructure_layer_status === "absent", `${country.country_code}: absent infrastructure layer has a populated status`);
  }

  if (!profile.dataset_paths.force_ledger) {
    assert(
      country.depth_tier !== "A",
      `${country.country_code}: Tier A profile must link a force ledger`,
    );
    assert(
      profile.completeness?.force_ledger_status === "absent",
      `${country.country_code}: missing force ledger must be reported as absent`,
    );
    continue;
  }

  const forcePath = path.resolve(path.dirname(profilePath), profile.dataset_paths.force_ledger);
  const ledger = readJson(forcePath);
  if (!ledger) continue;
  forceLedgerCount += 1;

  assert(ledger.country_id === country.country_id, `${country.country_code}: force ledger id mismatch`);
  assert(ledger.bookmark_id === bookmark.bookmark_id, `${country.country_code}: force ledger bookmark mismatch`);
  assert(ledger.as_of === bookmark.world_time, `${country.country_code}: force ledger time mismatch`);
  assert(
    sameMembers(ledger.accounting_states ?? [], REQUIRED_ACCOUNTING_STATES),
    `${country.country_code}: force ledger accounting states are incomplete`,
  );
  assert(
    ledger.scope?.individualization_rule ===
      "individualize_only_when_identity_changes_command_mission_loss_or_player_decision",
    `${country.country_code}: force individualization rule changed`,
  );
  if (ledger.status === "shell") {
    for (const field of [
      "organization_records",
      "equipment_type_records",
      "inventory_records",
      "deployment_records",
    ]) {
      assert(ledger.reconciliation?.[field] === 0, `${country.country_code}: shell ${field} must be zero`);
    }
    assert((ledger.unknowns ?? []).length > 0, `${country.country_code}: force shell must state unknowns`);
  }
}

assert(profileCount === 91, `Expected all 91 registry country profiles, found ${profileCount}`);
assert(rankedProfileCount === 80, `Expected 80 ranked country profiles, found ${rankedProfileCount}`);
assert(
  strategicAdditionProfileCount === 11,
  `Expected 11 strategic addition profiles, found ${strategicAdditionProfileCount}`,
);
assert(tierAProfileCount === 3, `Expected three Tier A profiles, found ${tierAProfileCount}`);
assert(forceLedgerCount === 3, `Expected three Tier A force ledgers, found ${forceLedgerCount}`);
assert(provinceLayerCount === 1, `Expected one collecting province layer, found ${provinceLayerCount}`);
assert(infrastructureLayerCount === 1, `Expected one collecting infrastructure layer, found ${infrastructureLayerCount}`);

const report = {
  status: errors.length ? "FAIL" : "PASS",
  research_root: researchRoot,
  bookmark: bookmark?.bookmark_id,
  sources: allSources.length,
  ranked_countries: cohort?.countries?.length ?? 0,
  strategic_additions: cohort?.mandatory_strategic_additions?.length ?? 0,
  registry_countries: registry?.countries?.length ?? 0,
  country_profiles: profileCount,
  ranked_country_profiles: rankedProfileCount,
  strategic_addition_profiles: strategicAdditionProfileCount,
  tier_a_profiles: tierAProfileCount,
  tier_a_force_ledgers: forceLedgerCount,
  collecting_province_layers: provinceLayerCount,
  collecting_infrastructure_layers: infrastructureLayerCount,
  schemas_parsed: NEW_SCHEMAS.length,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
