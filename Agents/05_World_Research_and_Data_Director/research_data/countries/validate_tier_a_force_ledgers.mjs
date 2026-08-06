#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const countriesRoot = path.dirname(fileURLToPath(import.meta.url));
const schemaRoot = path.resolve(countriesRoot, "..", "schemas");
const countryCodes = ["usa", "chn", "twn"];
const bookmarkId = "bookmark_global_fracture_2025_09_01";
const bookmarkAsOf = "2025-09-01T00:00:00Z";

const schemaFiles = [
  "common.schema.json",
  "force_ledger_manifest.schema.json",
  "military_organization_record.schema.json",
  "equipment_type_record.schema.json",
  "force_platform_record.schema.json",
  "force_inventory_record.schema.json",
  "force_deployment_record.schema.json",
  "force_maintenance_record.schema.json",
  "force_construction_record.schema.json",
  "inventory_conservation_record.schema.json",
  "source_record.schema.json",
  "contradiction_set.schema.json",
];

const families = {
  organizations: {
    pathKey: "organizations",
    countKey: "organization_records",
    schemaFile: "military_organization_record.schema.json",
  },
  equipment_types: {
    pathKey: "equipment_types",
    countKey: "equipment_type_records",
    schemaFile: "equipment_type_record.schema.json",
  },
  platforms: {
    pathKey: "platforms",
    countKey: "platform_records",
    schemaFile: "force_platform_record.schema.json",
  },
  inventory: {
    pathKey: "inventory",
    countKey: "inventory_records",
    schemaFile: "force_inventory_record.schema.json",
  },
  deployments: {
    pathKey: "deployments",
    countKey: "deployment_records",
    schemaFile: "force_deployment_record.schema.json",
  },
  maintenance: {
    pathKey: "maintenance",
    countKey: "maintenance_records",
    schemaFile: "force_maintenance_record.schema.json",
  },
  construction: {
    pathKey: "construction",
    countKey: "construction_records",
    schemaFile: "force_construction_record.schema.json",
  },
  conservation: {
    pathKey: "conservation",
    countKey: "conservation_records",
    schemaFile: "inventory_conservation_record.schema.json",
  },
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const schemaDocuments = new Map(
  schemaFiles.map((file) => [file, readJson(path.join(schemaRoot, file))]),
);

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function valueMatchesType(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function resolveReference(reference, rootFile) {
  const [filePart, fragment = ""] = reference.split("#", 2);
  const targetFile = filePart ? path.basename(filePart) : rootFile;
  let target = schemaDocuments.get(targetFile);
  if (!target) throw new Error(`Unregistered schema reference ${reference}`);
  if (fragment) {
    for (const rawPart of fragment.replace(/^\//u, "").split("/")) {
      const part = rawPart.replace(/~1/gu, "/").replace(/~0/gu, "~");
      target = target?.[part];
      if (target === undefined) throw new Error(`Unresolved schema pointer ${reference}`);
    }
  }
  return { schema: target, rootFile: targetFile };
}

function validateSchema(value, schema, rootFile, location, errors) {
  if (schema.$ref) {
    const resolved = resolveReference(schema.$ref, rootFile);
    validateSchema(value, resolved.schema, resolved.rootFile, location, errors);
    return;
  }

  if (schema.anyOf) {
    const matched = schema.anyOf.some((candidate) => {
      const candidateErrors = [];
      validateSchema(value, candidate, rootFile, location, candidateErrors);
      return candidateErrors.length === 0;
    });
    if (!matched) errors.push(`${location}: does not match any allowed schema`);
    return;
  }

  if (schema.oneOf) {
    const matches = schema.oneOf.filter((candidate) => {
      const candidateErrors = [];
      validateSchema(value, candidate, rootFile, location, candidateErrors);
      return candidateErrors.length === 0;
    }).length;
    if (matches !== 1) errors.push(`${location}: must match exactly one allowed schema`);
    return;
  }

  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowedTypes.some((type) => valueMatchesType(value, type))) {
      errors.push(`${location}: expected ${allowedTypes.join(" or ")}`);
      return;
    }
  }

  if (schema.const !== undefined && !sameValue(value, schema.const)) {
    errors.push(`${location}: value differs from required constant`);
  }
  if (schema.enum && !schema.enum.some((candidate) => sameValue(value, candidate))) {
    errors.push(`${location}: value is outside the allowed enumeration`);
  }
  if (schema.not) {
    const notErrors = [];
    validateSchema(value, schema.not, rootFile, location, notErrors);
    if (notErrors.length === 0) errors.push(`${location}: matches a prohibited schema`);
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${location}: string is shorter than ${schema.minLength}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) {
      errors.push(`${location}: string does not match ${schema.pattern}`);
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${location}: number is below ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${location}: number exceeds ${schema.maximum}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${location}: array has fewer than ${schema.minItems} items`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${location}: array has more than ${schema.maxItems} items`);
    }
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${location}: array items must be unique`);
    }
    if (schema.items) {
      value.forEach((item, index) => validateSchema(item, schema.items, rootFile, `${location}/${index}`, errors));
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${location}: missing required property ${required}`);
    }
    for (const [key, propertyValue] of Object.entries(value)) {
      if (schema.properties?.[key]) {
        validateSchema(propertyValue, schema.properties[key], rootFile, `${location}/${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${location}: unexpected property ${key}`);
      } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        validateSchema(propertyValue, schema.additionalProperties, rootFile, `${location}/${key}`, errors);
      }
    }
  }

  for (const clause of schema.allOf ?? []) {
    validateSchema(value, clause, rootFile, location, errors);
  }
  if (schema.if) {
    const conditionErrors = [];
    validateSchema(value, schema.if, rootFile, location, conditionErrors);
    if (conditionErrors.length === 0 && schema.then) {
      validateSchema(value, schema.then, rootFile, location, errors);
    } else if (conditionErrors.length > 0 && schema.else) {
      validateSchema(value, schema.else, rootFile, location, errors);
    }
  }
}

function validateDocument(value, schemaFile) {
  const errors = [];
  validateSchema(value, schemaDocuments.get(schemaFile), schemaFile, "/", errors);
  return errors;
}

function readNdjson(file, errors) {
  const records = [];
  const content = fs.readFileSync(file, "utf8");
  for (const [index, line] of content.split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    try {
      records.push({ line: index + 1, value: JSON.parse(line) });
    } catch (error) {
      errors.push(`${file}:${index + 1}: invalid JSON: ${error.message}`);
    }
  }
  return records;
}

function resolveDatasetPath(ledgerDir, relativePath, label, errors) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    errors.push(`${label}: canonical dataset path is not registered`);
    return null;
  }
  const resolved = path.resolve(ledgerDir, relativePath);
  const allowedPrefix = `${path.resolve(ledgerDir)}${path.sep}`;
  if (!resolved.startsWith(allowedPrefix)) {
    errors.push(`${label}: dataset path escapes force_ledger directory`);
    return null;
  }
  if (!fs.existsSync(resolved)) {
    errors.push(`${label}: missing dataset ${relativePath}`);
    return null;
  }
  return resolved;
}

function collectSourceReferences(value, references = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectSourceReferences(item, references);
    return references;
  }
  if (value === null || typeof value !== "object") return references;
  if (value.provenance?.source_ids) {
    for (const sourceId of value.provenance.source_ids) references.add(sourceId);
  }
  for (const child of Object.values(value)) collectSourceReferences(child, references);
  return references;
}

const report = {
  status: "PASS",
  bookmark_id: bookmarkId,
  countries: {},
  errors: [],
};

for (const countryCode of countryCodes) {
  const ledgerDir = path.join(countriesRoot, countryCode, "force_ledger");
  const manifestPath = path.join(ledgerDir, "manifest.json");
  const countryErrors = [];
  const manifest = readJson(manifestPath);

  countryErrors.push(
    ...validateDocument(manifest, "force_ledger_manifest.schema.json").map(
      (error) => `${manifestPath}: ${error}`,
    ),
  );
  if (manifest.country_id !== `country_${countryCode}`) {
    countryErrors.push(`${manifestPath}: country_id does not match directory`);
  }
  if (manifest.bookmark_id !== bookmarkId || manifest.as_of !== bookmarkAsOf) {
    countryErrors.push(`${manifestPath}: canonical bookmark mismatch`);
  }

  const counts = {};
  let totalRecords = 0;
  const familyRecords = {};
  const sourceReferences = new Set();
  for (const [familyName, family] of Object.entries(families)) {
    const datasetPath = resolveDatasetPath(
      ledgerDir,
      manifest.dataset_paths?.[family.pathKey],
      `${countryCode}.${familyName}`,
      countryErrors,
    );
    if (!datasetPath) {
      counts[familyName] = null;
      continue;
    }

    const records = readNdjson(datasetPath, countryErrors);
    familyRecords[familyName] = records.map((record) => record.value);
    counts[familyName] = records.length;
    totalRecords += records.length;

    for (const record of records) {
      countryErrors.push(
        ...validateDocument(record.value, family.schemaFile).map(
          (error) => `${datasetPath}:${record.line}: ${error}`,
        ),
      );
      if (record.value.country_id && record.value.country_id !== manifest.country_id) {
        countryErrors.push(`${datasetPath}:${record.line}: country_id differs from manifest`);
      }
      collectSourceReferences(record.value, sourceReferences);
    }

    if (manifest.reconciliation?.[family.countKey] !== records.length) {
      countryErrors.push(
        `${manifestPath}: ${family.countKey} is ${manifest.reconciliation?.[family.countKey]}, expected ${records.length}`,
      );
    }
  }

  const sourceDatasetPath = manifest.status === "shell" && manifest.dataset_paths?.sources === null
    ? null
    : resolveDatasetPath(
      ledgerDir,
      manifest.dataset_paths?.sources,
      `${countryCode}.sources`,
      countryErrors,
    );
  const sources = sourceDatasetPath ? readNdjson(sourceDatasetPath, countryErrors) : [];
  counts.sources = sources.length;
  const localSourceIds = new Set();
  for (const source of sources) {
    countryErrors.push(
      ...validateDocument(source.value, "source_record.schema.json").map(
        (error) => `${sourceDatasetPath}:${source.line}: ${error}`,
      ),
    );
    if (localSourceIds.has(source.value.source_id)) {
      countryErrors.push(`${sourceDatasetPath}:${source.line}: duplicate source_id ${source.value.source_id}`);
    }
    localSourceIds.add(source.value.source_id);
  }

  const contradictionDatasetPath = manifest.status === "shell" && manifest.dataset_paths?.contradictions === null
    ? null
    : resolveDatasetPath(
      ledgerDir,
      manifest.dataset_paths?.contradictions,
      `${countryCode}.contradictions`,
      countryErrors,
    );
  const contradictions = contradictionDatasetPath
    ? readNdjson(contradictionDatasetPath, countryErrors)
    : [];
  counts.contradictions = contradictions.length;
  for (const contradiction of contradictions) {
    countryErrors.push(
      ...validateDocument(contradiction.value, "contradiction_set.schema.json").map(
        (error) => `${contradictionDatasetPath}:${contradiction.line}: ${error}`,
      ),
    );
    for (const sourceId of contradiction.value.source_ids ?? []) sourceReferences.add(sourceId);
  }

  for (const sourceId of manifest.source_ids ?? []) sourceReferences.add(sourceId);
  for (const sourceId of sourceReferences) {
    if (!localSourceIds.has(sourceId)) {
      countryErrors.push(`${manifestPath}: unresolved local force ledger source_id ${sourceId}`);
    }
  }
  for (const sourceId of localSourceIds) {
    if (!manifest.source_ids.includes(sourceId)) {
      countryErrors.push(`${manifestPath}: local source_id ${sourceId} is omitted from manifest.source_ids`);
    }
  }

  const organizations = familyRecords.organizations ?? [];
  const organizationIds = new Set(organizations.map((record) => record.organization_id));
  for (const organization of organizations) {
    if (organization.parent_organization_id && !organizationIds.has(organization.parent_organization_id)) {
      countryErrors.push(
        `${manifestPath}: organization ${organization.organization_id} has unresolved parent ${organization.parent_organization_id}`,
      );
    }
    for (const supportedId of organization.supported_organization_ids ?? []) {
      if (!organizationIds.has(supportedId)) {
        countryErrors.push(
          `${manifestPath}: organization ${organization.organization_id} supports unresolved organization ${supportedId}`,
        );
      }
    }
  }

  if (manifest.status === "shell") {
    if (totalRecords !== 0) countryErrors.push(`${manifestPath}: shell ledger contains records`);
    if (manifest.reconciliation.state !== "not_started") {
      countryErrors.push(`${manifestPath}: shell reconciliation must be not_started`);
    }
    if (manifest.source_ids.length !== 0) {
      countryErrors.push(`${manifestPath}: shell ledger cites sources without accepted records`);
    }
    if (manifest.unknowns.length === 0) {
      countryErrors.push(`${manifestPath}: shell ledger must describe unresolved evidence`);
    }
    for (const key of ["services", "components", "government_forces"]) {
      if (manifest.scope[key].length !== 0) {
        countryErrors.push(`${manifestPath}: shell scope ${key} implies unsupported coverage`);
      }
    }
  }

  if (manifest.status !== "shell" && manifest.reconciliation.state === "not_started") {
    countryErrors.push(`${manifestPath}: populated ledger cannot retain not_started reconciliation`);
  }

  report.countries[countryCode] = {
    status: countryErrors.length ? "FAIL" : "PASS",
    manifest_status: manifest.status,
    records: counts,
    unknown_statements: manifest.unknowns.length,
  };
  report.errors.push(...countryErrors);
}

if (report.errors.length) report.status = "FAIL";
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
