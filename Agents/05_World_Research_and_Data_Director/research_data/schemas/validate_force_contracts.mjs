#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const schemaRoot = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(schemaRoot, "fixtures", "force_ledger.valid.json");
const canonicalSchemas = [
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
  "force_ledger_bundle.schema.json",
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function exact(quantity) {
  return quantity?.kind === "exact" ? quantity.value : null;
}

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  visit(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  for (const child of Object.values(value)) walk(child, visit);
}

function recordId(record) {
  return Object.entries(record).find(([key]) => key.endsWith("_id"))?.[1] ?? "unknown_record";
}

function validateQuantity(quantity, context, errors) {
  if (!quantity || !["exact", "range", "unknown"].includes(quantity.kind)) {
    errors.push(`${context}: invalid quantity kind`);
    return;
  }
  if (!quantity.unit) errors.push(`${context}: missing counting unit`);
  if (quantity.kind === "exact") {
    if (!Number.isInteger(quantity.value) || quantity.value < 0) {
      errors.push(`${context}: exact quantity must be a nonnegative integer`);
    }
    if (quantity.minimum !== undefined || quantity.maximum !== undefined) {
      errors.push(`${context}: exact quantity may not contain a range`);
    }
  }
  if (quantity.kind === "range") {
    if (!Number.isInteger(quantity.minimum) || !Number.isInteger(quantity.maximum)) {
      errors.push(`${context}: range bounds must be integers`);
    } else if (quantity.minimum < 0 || quantity.maximum < quantity.minimum) {
      errors.push(`${context}: invalid range ordering`);
    }
    if (quantity.value !== undefined) errors.push(`${context}: range may not contain exact value`);
  }
  if (
    quantity.kind === "unknown" &&
    [quantity.value, quantity.minimum, quantity.maximum].some((value) => value !== undefined)
  ) {
    errors.push(`${context}: unknown quantity may not contain numeric values`);
  }
}

function validateTime(record, errors) {
  const validity = record.temporal_validity;
  if (!validity) return;
  const id = recordId(record);
  const validFrom = Date.parse(validity.valid_from);
  const asOf = Date.parse(validity.as_of);
  const validTo = validity.valid_to === null ? null : Date.parse(validity.valid_to);
  const reviewAfter = Date.parse(validity.review_after);
  if (![validFrom, asOf, reviewAfter].every(Number.isFinite)) {
    errors.push(`${id}: invalid temporal validity timestamp`);
    return;
  }
  if (validFrom > asOf) errors.push(`${id}: valid_from is after as_of`);
  if (validTo !== null && (!Number.isFinite(validTo) || validTo < validFrom)) {
    errors.push(`${id}: valid_to is before valid_from`);
  }
  if (reviewAfter < asOf) errors.push(`${id}: review_after is before as_of`);
}

function duplicateIds(records, label, errors) {
  const seen = new Set();
  for (const record of records) {
    const id = recordId(record);
    if (seen.has(id)) errors.push(`${label}: duplicate id ${id}`);
    seen.add(id);
  }
  return seen;
}

function validateBundle(bundle) {
  const errors = [];
  const collections = [
    [bundle.organizations, "organizations"],
    [bundle.equipment_types, "equipment_types"],
    [bundle.platforms, "platforms"],
    [bundle.inventory_pools, "inventory_pools"],
    [bundle.deployments, "deployments"],
    [bundle.maintenance, "maintenance"],
    [bundle.construction, "construction"],
    [bundle.conservation, "conservation"],
  ];
  const allRecords = collections.flatMap(([records]) => records ?? []);
  const allIds = duplicateIds(allRecords, "bundle", errors);
  const organizationIds = new Set(bundle.organizations.map((record) => record.organization_id));
  const equipmentIds = new Set(bundle.equipment_types.map((record) => record.equipment_type_id));
  const platformIds = new Set(bundle.platforms.map((record) => record.platform_id));
  const inventoryIds = new Set(bundle.inventory_pools.map((record) => record.inventory_record_id));
  const deploymentIds = new Set(bundle.deployments.map((record) => record.deployment_id));

  if (bundle.manifest.country_id !== bundle.country_id) errors.push("manifest country mismatch");
  if (bundle.manifest.bookmark_id !== bundle.bookmark_id) errors.push("manifest bookmark mismatch");
  if (bundle.manifest.as_of !== bundle.as_of) errors.push("manifest as_of mismatch");

  for (const record of allRecords) {
    if (record.country_id && record.country_id !== bundle.country_id) {
      errors.push(`${recordId(record)}: country mismatch`);
    }
    validateTime(record, errors);
    walk(record, (value) => {
      if (value.kind && value.unit && ["exact", "range", "unknown"].includes(value.kind)) {
        validateQuantity(value, recordId(record), errors);
      }
    });
  }

  const parentByOrganization = new Map();
  for (const organization of bundle.organizations) {
    const parent = organization.parent_organization_id;
    if (parent && !organizationIds.has(parent)) {
      errors.push(`${organization.organization_id}: unknown parent ${parent}`);
    }
    parentByOrganization.set(organization.organization_id, parent);
  }
  for (const organizationId of organizationIds) {
    const visited = new Set();
    let cursor = organizationId;
    while (cursor) {
      if (visited.has(cursor)) {
        errors.push(`${organizationId}: organization parent cycle`);
        break;
      }
      visited.add(cursor);
      cursor = parentByOrganization.get(cursor);
    }
  }

  for (const platform of bundle.platforms) {
    if (!equipmentIds.has(platform.equipment_type_id)) {
      errors.push(`${platform.platform_id}: unknown equipment type`);
    }
    if (platform.command_organization_id && !organizationIds.has(platform.command_organization_id)) {
      errors.push(`${platform.platform_id}: unknown command organization`);
    }
    if (platform.current_deployment_id && !deploymentIds.has(platform.current_deployment_id)) {
      errors.push(`${platform.platform_id}: unknown deployment`);
    }
  }

  const individualizedPoolMembership = new Map();
  for (const inventory of bundle.inventory_pools) {
    if (!equipmentIds.has(inventory.equipment_type_id)) {
      errors.push(`${inventory.inventory_record_id}: unknown equipment type`);
    }
    if (inventory.organization_id && !organizationIds.has(inventory.organization_id)) {
      errors.push(`${inventory.inventory_record_id}: unknown organization`);
    }
    const total = exact(inventory.quantity);
    const ready = exact(inventory.readiness.ready_quantity);
    const maintenance = exact(inventory.maintenance.quantity);
    if (total !== null && ready !== null && ready > total) {
      errors.push(`${inventory.inventory_record_id}: ready quantity exceeds pool`);
    }
    if (total !== null && maintenance !== null && maintenance > total) {
      errors.push(`${inventory.inventory_record_id}: maintenance quantity exceeds pool`);
    }
    for (const platformId of inventory.individual_platform_ids) {
      if (!platformIds.has(platformId)) {
        errors.push(`${inventory.inventory_record_id}: unknown individualized platform ${platformId}`);
      }
      const previous = individualizedPoolMembership.get(platformId);
      if (previous) {
        errors.push(`${platformId}: counted in both ${previous} and ${inventory.inventory_record_id}`);
      }
      individualizedPoolMembership.set(platformId, inventory.inventory_record_id);
    }
  }

  for (const deployment of bundle.deployments) {
    const exists =
      (deployment.entity_type === "individual_platform" && platformIds.has(deployment.entity_id)) ||
      (deployment.entity_type === "inventory_pool" && inventoryIds.has(deployment.entity_id)) ||
      (deployment.entity_type === "organization" && organizationIds.has(deployment.entity_id)) ||
      deployment.entity_type === "task_force" ||
      deployment.entity_type === "unknown_force";
    if (!exists) errors.push(`${deployment.deployment_id}: unresolved deployed entity`);
    if (deployment.entity_type === "individual_platform" && exact(deployment.quantity) !== 1) {
      errors.push(`${deployment.deployment_id}: individual platform deployment quantity must equal one`);
    }
    if (deployment.command_organization_id && !organizationIds.has(deployment.command_organization_id)) {
      errors.push(`${deployment.deployment_id}: unknown command organization`);
    }
  }

  for (const maintenance of bundle.maintenance) {
    const subject =
      maintenance.subject_type === "individual_platform"
        ? bundle.platforms.find((record) => record.platform_id === maintenance.subject_id)
        : bundle.inventory_pools.find((record) => record.inventory_record_id === maintenance.subject_id);
    if (!subject) {
      errors.push(`${maintenance.maintenance_record_id}: unresolved maintenance subject`);
      continue;
    }
    if (maintenance.subject_type === "individual_platform" && exact(maintenance.quantity) !== 1) {
      errors.push(`${maintenance.maintenance_record_id}: individual platform maintenance quantity must equal one`);
    }
    if (maintenance.subject_type === "inventory_pool") {
      const maintained = exact(maintenance.quantity);
      const pool = exact(subject.quantity);
      if (maintained !== null && pool !== null && maintained > pool) {
        errors.push(`${maintenance.maintenance_record_id}: maintenance quantity exceeds subject pool`);
      }
    }
  }

  for (const construction of bundle.construction) {
    if (!equipmentIds.has(construction.equipment_type_id)) {
      errors.push(`${construction.construction_record_id}: unknown equipment type`);
    }
    const ordered = exact(construction.quantity_ordered);
    const delivered = exact(construction.quantity_delivered);
    const accepted = exact(construction.quantity_accepted);
    if (ordered !== null && delivered !== null && delivered > ordered) {
      errors.push(`${construction.construction_record_id}: delivered exceeds ordered`);
    }
    if (delivered !== null && accepted !== null && accepted > delivered) {
      errors.push(`${construction.construction_record_id}: accepted exceeds delivered`);
    }
  }

  for (const conservation of bundle.conservation) {
    const unit = conservation.counting_unit;
    const terms = [
      conservation.opening_inventory,
      ...conservation.inflows.map((term) => term.quantity),
      ...conservation.closing_states.map((term) => term.quantity),
      ...conservation.outflows.map((term) => term.quantity),
    ];
    if (terms.some((quantity) => quantity.unit !== unit)) {
      errors.push(`${conservation.conservation_record_id}: mixed counting units`);
    }
    const stateInventoryIds = new Set();
    for (const state of conservation.closing_states) {
      for (const inventoryId of state.inventory_record_ids) {
        if (!inventoryIds.has(inventoryId)) {
          errors.push(`${conservation.conservation_record_id}: unknown inventory ${inventoryId}`);
        }
        if (stateInventoryIds.has(inventoryId)) {
          errors.push(`${conservation.conservation_record_id}: inventory ${inventoryId} counted twice`);
        }
        stateInventoryIds.add(inventoryId);
        const inventory = bundle.inventory_pools.find((record) => record.inventory_record_id === inventoryId);
        if (inventory && inventory.accounting_state !== state.accounting_state) {
          errors.push(`${conservation.conservation_record_id}: accounting state mismatch for ${inventoryId}`);
        }
      }
    }
    const exactTerms = terms.every((quantity) => exact(quantity) !== null);
    if (exactTerms) {
      const left = exact(conservation.opening_inventory) +
        conservation.inflows.reduce((sum, term) => sum + exact(term.quantity), 0);
      const right = conservation.closing_states.reduce((sum, term) => sum + exact(term.quantity), 0) +
        conservation.outflows.reduce((sum, term) => sum + exact(term.quantity), 0);
      const residual = left - right;
      if (residual !== 0) errors.push(`${conservation.conservation_record_id}: residual ${residual}`);
      if (conservation.result.state === "balanced" && conservation.result.residual_value !== residual) {
        errors.push(`${conservation.conservation_record_id}: reported residual mismatch`);
      }
    }
    for (const flow of [...conservation.inflows, ...conservation.outflows]) {
      for (const sourceRecordId of flow.source_record_ids) {
        if (!allIds.has(sourceRecordId)) {
          errors.push(`${conservation.conservation_record_id}: unresolved flow record ${sourceRecordId}`);
        }
      }
    }
  }

  const countMap = {
    organization_records: bundle.organizations.length,
    platform_records: bundle.platforms.length,
    equipment_type_records: bundle.equipment_types.length,
    inventory_records: bundle.inventory_pools.length,
    deployment_records: bundle.deployments.length,
    maintenance_records: bundle.maintenance.length,
    construction_records: bundle.construction.length,
    conservation_records: bundle.conservation.length,
  };
  for (const [field, count] of Object.entries(countMap)) {
    if (bundle.manifest.reconciliation[field] !== count) {
      errors.push(`manifest ${field} is ${bundle.manifest.reconciliation[field]}, expected ${count}`);
    }
  }

  return errors;
}

const schemas = canonicalSchemas.map((name) => [name, readJson(path.join(schemaRoot, name))]);
const schemaIds = new Set();
const schemaErrors = [];
for (const [name, schema] of schemas) {
  if (!schema.$id) schemaErrors.push(`${name}: missing $id`);
  if (schemaIds.has(schema.$id)) schemaErrors.push(`${name}: duplicate $id ${schema.$id}`);
  schemaIds.add(schema.$id);
  walk(schema, (value) => {
    if (typeof value.$ref !== "string") return;
    const [file] = value.$ref.split("#");
    if (file && !fs.existsSync(path.join(schemaRoot, file))) {
      schemaErrors.push(`${name}: unresolved schema reference ${value.$ref}`);
    }
  });
}

const validFixture = readJson(fixturePath);
const validErrors = validateBundle(validFixture);

const doubleCountFixture = structuredClone(validFixture);
doubleCountFixture.inventory_pools[0].individual_platform_ids.push("platform_fixture_fighter_001");
doubleCountFixture.inventory_pools[1].individual_platform_ids.push("platform_fixture_fighter_001");
const doubleCountErrors = validateBundle(doubleCountFixture);

const imbalanceFixture = structuredClone(validFixture);
imbalanceFixture.conservation[0].closing_states[0].quantity.value = 1;
const imbalanceErrors = validateBundle(imbalanceFixture);

const errors = [...schemaErrors, ...validErrors];
if (!doubleCountErrors.some((error) => error.includes("counted in both"))) {
  errors.push("negative test did not detect individualized platform double counting");
}
if (!imbalanceErrors.some((error) => error.includes("residual"))) {
  errors.push("negative test did not detect conservation imbalance");
}

const report = {
  status: errors.length ? "FAIL" : "PASS",
  schemas_parsed: schemas.length,
  fixture_records: {
    organizations: validFixture.organizations.length,
    equipment_types: validFixture.equipment_types.length,
    platforms: validFixture.platforms.length,
    inventory_pools: validFixture.inventory_pools.length,
    deployments: validFixture.deployments.length,
    maintenance: validFixture.maintenance.length,
    construction: validFixture.construction.length,
    conservation: validFixture.conservation.length,
  },
  negative_tests: {
    double_count_detected: doubleCountErrors.some((error) => error.includes("counted in both")),
    imbalance_detected: imbalanceErrors.some((error) => error.includes("residual")),
  },
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;

