import fs from "node:fs";
import path from "node:path";

const MACHINE_EXTENSIONS = new Set([".json", ".geojson", ".ndjson"]);
const GEOJSON_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
]);
const STABLE_ID_PATTERN = /^[a-z0-9][a-z0-9_:-]*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[Tt][0-9:.+-]+[Zz]?)?$/;
const DATE_FIELDS = new Set([
  "accessed_at",
  "approved_at",
  "as_of",
  "closing_at",
  "effective_from",
  "effective_to",
  "last_reviewed",
  "newest_source_date",
  "observed_at",
  "observed_from",
  "observed_to",
  "occurred_after_start",
  "oldest_source_date",
  "opening_at",
  "published_at",
  "review_after",
  "reviewed_at",
  "started_at",
  "stale_after",
  "valid_from",
  "valid_to",
  "world_time",
]);
const TEMPORAL_START_FIELDS = [
  "as_of",
  "effective_from",
  "observed_at",
  "observed_from",
  "occurred_after_start",
  "started_at",
  "valid_from",
];
const TEMPORAL_END_PAIRS = [
  ["observed_from", "observed_to"],
  ["valid_from", "valid_to"],
  ["effective_from", "effective_to"],
  ["opening_at", "closing_at"],
];
const SOURCE_REFERENCE_FIELDS = new Set([
  "derived_from_source_ids",
  "source_ids",
]);
const PRIMARY_ID_FIELDS = [
  "source_id",
  "claim_id",
  "contradiction_set_id",
  "observation_id",
  "derived_id",
  "condition_id",
  "event_id",
  "manifest_id",
  "registry_id",
  "bookmark_state_id",
  "matrix_id",
  "force_ledger_id",
  "relationship_id",
  "equipment_type_id",
  "organization_id",
  "inventory_record_id",
  "deployment_id",
  "maintenance_record_id",
  "construction_record_id",
  "conservation_record_id",
  "platform_id",
  "facility_id",
  "site_id",
  "route_id",
  "infrastructure_id",
  "feature_id",
  "indicator_id",
  "authority_id",
  "theater_id",
];
const STRONG_PRIMARY_ID_FIELDS = new Set([
  "source_id",
  "claim_id",
  "contradiction_set_id",
  "observation_id",
  "derived_id",
  "condition_id",
  "event_id",
  "manifest_id",
  "registry_id",
  "bookmark_state_id",
  "matrix_id",
  "force_ledger_id",
]);
const UNKNOWN_EXPLANATION_PATTERN = /\b(?:absent|empty|no|not|pending|shell|unknown|unresolved|yet)\b/i;
const FIREWALL_USES = new Set([
  "reference_only_not_initial_state",
  "retrospective_reference_only",
]);
const FIREWALL_SIMULATION_USES = new Set([
  "reference_only",
  "trajectory_reference_only",
]);

function diagnostic(code, file, pointer, message) {
  return { code, file, pointer, message };
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function listMachineFiles(root, excludedDirectories) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = path.join(directory, entry.name);
      const relativePath = toPosix(path.relative(root, fullPath));
      if (entry.isDirectory()) {
        if (!excludedDirectories.some((excluded) => relativePath === excluded || relativePath.startsWith(`${excluded}/`))) {
          visit(fullPath);
        }
      } else if (MACHINE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  visit(root);
  return files.sort();
}

function parseMachineFile(file, root, errors) {
  const relativeFile = toPosix(path.relative(root, file));
  const text = fs.readFileSync(file, "utf8");
  if (path.extname(file) !== ".ndjson") {
    try {
      return [{ value: JSON.parse(text), file: relativeFile, pointer: "" }];
    } catch (error) {
      errors.push(diagnostic("PARSE_JSON", relativeFile, "", error.message));
      return [];
    }
  }

  const records = [];
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    if (!rawLine.trim()) continue;
    try {
      records.push({ value: JSON.parse(rawLine), file: relativeFile, pointer: `/line/${index + 1}` });
    } catch (error) {
      errors.push(diagnostic("PARSE_NDJSON", relativeFile, `/line/${index + 1}`, error.message));
    }
  }
  return records;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function childPointer(pointer, key) {
  const escaped = String(key).replaceAll("~", "~0").replaceAll("/", "~1");
  return `${pointer}/${escaped}`;
}

function walk(value, context, visitor) {
  visitor(value, context);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, { ...context, pointer: childPointer(context.pointer, index) }, visitor));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    walk(entry, { ...context, pointer: childPointer(context.pointer, key), parent: value, key }, visitor);
  }
}

function hasTemporalField(record, fields) {
  return fields.some((field) => typeof record[field] === "string" && record[field].length > 0);
}

function requireTemporalFields(record, context, errors) {
  let requirement = null;
  if (record.source_id && record.title && record.publisher) {
    requirement = ["accessed_at"];
  } else if (record.claim_id) {
    requirement = ["observed_at", "valid_from", "as_of", "effective_from"];
  } else if (record.observation_id) {
    requirement = ["observed_at", "observed_from"];
  } else if (record.bookmark_state_id || record.force_ledger_id || record.matrix_id) {
    requirement = ["as_of"];
  } else if (record.geometry && isGeoJsonGeometry(record.geometry) && record.source_ids) {
    requirement = ["observed_at", "valid_from", "effective_from", "as_of"];
  }

  if (requirement && !hasTemporalField(record, requirement)) {
    errors.push(
      diagnostic(
        "MISSING_TEMPORAL",
        context.file,
        context.pointer,
        `record requires one of: ${requirement.join(", ")}`,
      ),
    );
  }
}

function validateDates(record, context, errors) {
  for (const [field, value] of Object.entries(record)) {
    if (!DATE_FIELDS.has(field) || value === null || value === undefined) continue;
    if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
      errors.push(
        diagnostic("INVALID_TEMPORAL", context.file, childPointer(context.pointer, field), `invalid ISO date or timestamp: ${JSON.stringify(value)}`),
      );
    }
  }
  for (const [startField, endField] of TEMPORAL_END_PAIRS) {
    if (typeof record[startField] !== "string" || typeof record[endField] !== "string") continue;
    const start = Date.parse(record[startField]);
    const end = Date.parse(record[endField]);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      errors.push(
        diagnostic("TEMPORAL_ORDER", context.file, context.pointer, `${endField} precedes ${startField}`),
      );
    }
  }
}

function isSourceRecord(record) {
  return Boolean(record.source_id && record.title && record.publisher);
}

function primaryIdentity(record) {
  for (const field of PRIMARY_ID_FIELDS) {
    const value = record[field];
    if (typeof value !== "string") continue;
    if (STRONG_PRIMARY_ID_FIELDS.has(field)) return { field, value };
    if (field === "relationship_id" && record.relationship_type) return { field, value };
    if (field === "equipment_type_id" && record.taxonomy) return { field, value };
    if (field === "organization_id" && record.organization_kind) return { field, value };
    if (field === "inventory_record_id" && record.inventory_kind) return { field, value };
    if (field === "deployment_id" && record.entity_type && record.assignment) return { field, value };
    if (field === "maintenance_record_id" && record.maintenance_kind) return { field, value };
    if (field === "construction_record_id" && record.program_or_lot) return { field, value };
    if (field === "conservation_record_id" && record.period && record.opening_inventory) return { field, value };
    if (field === "platform_id" && (record.platform_kind || record.identity)) return { field, value };
    if (field === "facility_id" && record.facility_type && record.name) return { field, value };
    if (field === "site_id" && record.site_type && record.name) return { field, value };
    if (field === "route_id" && record.route_type) return { field, value };
    if (field === "infrastructure_id" && record.infrastructure_type) return { field, value };
    if (field === "feature_id" && record.feature_type) return { field, value };
    if (field === "indicator_id" && record.indicator_type) return { field, value };
    if (field === "authority_id" && record.authority_type) return { field, value };
    if (field === "theater_id" && record.name) return { field, value };
  }
  return null;
}

function isGeoJsonGeometry(value) {
  return isObject(value) && GEOJSON_TYPES.has(value.type) && Object.hasOwn(value, "coordinates");
}

function coordinatePrecision(record) {
  const candidates = [
    record.precision_m,
    record.coordinate_precision_m,
    record.properties?.precision_m,
    record.properties?.coordinate_precision_m,
    record.metadata?.precision_m,
    record.metadata?.coordinate_precision_m,
  ];
  return candidates.find((value) => typeof value === "number" && Number.isFinite(value) && value >= 0);
}

function validateCoordinateTree(coordinates, context, errors) {
  if (!Array.isArray(coordinates)) {
    errors.push(diagnostic("INVALID_COORDINATE", context.file, context.pointer, "coordinates must be arrays"));
    return;
  }
  if (coordinates.length >= 2 && coordinates.every((value) => typeof value === "number")) {
    const [longitude, latitude] = coordinates;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      errors.push(diagnostic("INVALID_COORDINATE", context.file, context.pointer, `longitude or latitude is out of bounds: ${coordinates}`));
    }
    return;
  }
  coordinates.forEach((entry, index) => validateCoordinateTree(entry, { ...context, pointer: childPointer(context.pointer, index) }, errors));
}

function validateGeometry(record, context, inheritedPrecision, errors, validatedGeometryOwners) {
  validatedGeometryOwners.add(record);
  const ownPrecision = coordinatePrecision(record);
  const availablePrecision = ownPrecision ?? inheritedPrecision;
  if (record.type === "FeatureCollection" && Array.isArray(record.features)) {
    const collectionPrecision = coordinatePrecision(record) ?? inheritedPrecision;
    for (const [index, feature] of record.features.entries()) {
      if (!isObject(feature)) continue;
      validateGeometry(
        feature,
        { ...context, pointer: childPointer(childPointer(context.pointer, "features"), index) },
        collectionPrecision,
        errors,
        validatedGeometryOwners,
      );
    }
    return;
  }
  if (record.type === "Feature" && isGeoJsonGeometry(record.geometry)) {
    const featurePrecision = coordinatePrecision(record) ?? availablePrecision;
    if (featurePrecision === undefined) {
      errors.push(diagnostic("MISSING_COORDINATE_PRECISION", context.file, context.pointer, "GeoJSON feature has coordinates but no precision label"));
    }
    validateCoordinateTree(record.geometry.coordinates, { ...context, pointer: childPointer(childPointer(context.pointer, "geometry"), "coordinates") }, errors);
    return;
  }
  if (isGeoJsonGeometry(record.geometry)) {
    if (availablePrecision === undefined) {
      errors.push(diagnostic("MISSING_COORDINATE_PRECISION", context.file, context.pointer, "geometry record has coordinates but no precision_m label"));
    }
    validateCoordinateTree(record.geometry.coordinates, { ...context, pointer: childPointer(childPointer(context.pointer, "geometry"), "coordinates") }, errors);
  }
  if (typeof record.latitude === "number" && typeof record.longitude === "number") {
    if (availablePrecision === undefined) {
      errors.push(diagnostic("MISSING_COORDINATE_PRECISION", context.file, context.pointer, "latitude and longitude require a precision_m label"));
    }
    validateCoordinateTree([record.longitude, record.latitude], context, errors);
  }
}

function hasExplicitUnknownExplanation(record) {
  if (Array.isArray(record.unknowns) && record.unknowns.length > 0) return true;
  if (record.quantity?.kind === "unknown") return true;
  if (record.location_status === "unknown") return true;
  if (record.evidence_state === "unknown" || record.confidence === "unknown") return true;
  return typeof record.notes === "string" && UNKNOWN_EXPLANATION_PATTERN.test(record.notes);
}

function validateUnknownHandling(record, context, errors) {
  if (record.status !== "shell") return;
  const containsUnknownState = Object.entries(record).some(
    ([key, value]) => key !== "notes" && (value === null || (Array.isArray(value) && value.length === 0)),
  );
  if (containsUnknownState && !hasExplicitUnknownExplanation(record)) {
    errors.push(
      diagnostic("IMPLICIT_UNKNOWN", context.file, context.pointer, "shell record contains empty or null state without an explicit unknown explanation"),
    );
  }
}

function isOpeningStateFile(relativeFile) {
  return relativeFile.endsWith("/bookmark.json") || relativeFile.endsWith("/bookmark_state.json") || relativeFile === "bookmark.json" || relativeFile === "bookmark_state.json";
}

function hasFirewallMarker(record) {
  return (
    record.initial_state === false ||
    FIREWALL_USES.has(record.use) ||
    FIREWALL_SIMULATION_USES.has(record.simulation_use) ||
    record.knowledge_firewall === "retrospective" ||
    record.post_cutoff_handling === "reference_only"
  );
}

function validateBookmarkFirewall(record, context, cutoff, openingStateFile, errors) {
  const isOpeningState = openingStateFile || record.initial_state === true || record.simulation_use === "opening_state";
  if (!isOpeningState || hasFirewallMarker(record)) return;
  for (const field of TEMPORAL_START_FIELDS) {
    if (typeof record[field] !== "string") continue;
    const timestamp = Date.parse(record[field]);
    if (!Number.isNaN(timestamp) && timestamp > cutoff) {
      errors.push(
        diagnostic(
          "BOOKMARK_FIREWALL",
          context.file,
          childPointer(context.pointer, field),
          `${field} begins after the opening bookmark without a reference only marker`,
        ),
      );
    }
  }
}

export function validateCorpus(root, options = {}) {
  const cutoffText = options.bookmarkCutoff ?? "2025-09-01T00:00:00Z";
  const cutoff = Date.parse(cutoffText);
  if (Number.isNaN(cutoff)) throw new Error(`Invalid bookmark cutoff: ${cutoffText}`);
  const excludedDirectories = options.excludedDirectories ?? ["schemas", "tools/fixtures"];
  const errors = [];
  const warnings = [];
  const records = [];
  const files = listMachineFiles(root, excludedDirectories);

  for (const file of files) records.push(...parseMachineFile(file, root, errors));

  const sources = new Map();
  const primaryIds = new Map();
  const sourceReferences = [];
  const validatedGeometryOwners = new WeakSet();
  let objectCount = 0;
  let geometryCount = 0;

  for (const parsed of records) {
    const openingStateFile = isOpeningStateFile(parsed.file);
    walk(parsed.value, { file: parsed.file, pointer: parsed.pointer, parent: null, key: null }, (value, context) => {
      if (!isObject(value)) return;
      objectCount += 1;
      validateDates(value, context, errors);
      requireTemporalFields(value, context, errors);
      validateUnknownHandling(value, context, errors);
      validateBookmarkFirewall(value, context, cutoff, openingStateFile, errors);

      if (isSourceRecord(value)) {
        if (sources.has(value.source_id)) {
          errors.push(diagnostic("DUPLICATE_ID", context.file, context.pointer, `duplicate source_id ${value.source_id}; first defined at ${sources.get(value.source_id)}`));
        } else {
          sources.set(value.source_id, `${context.file}${context.pointer}`);
        }
      }

      const identity = primaryIdentity(value);
      if (identity && !isSourceRecord(value)) {
        if (!STABLE_ID_PATTERN.test(identity.value)) {
          errors.push(diagnostic("INVALID_STABLE_ID", context.file, childPointer(context.pointer, identity.field), `invalid stable identifier ${identity.value}`));
        }
        const key = `${identity.field}:${identity.value}`;
        if (primaryIds.has(key)) {
          errors.push(diagnostic("DUPLICATE_ID", context.file, context.pointer, `duplicate ${identity.field} ${identity.value}; first defined at ${primaryIds.get(key)}`));
        } else {
          primaryIds.set(key, `${context.file}${context.pointer}`);
        }
      }

      for (const field of SOURCE_REFERENCE_FIELDS) {
        if (!Object.hasOwn(value, field)) continue;
        if (!Array.isArray(value[field])) {
          errors.push(diagnostic("INVALID_SOURCE_REFERENCE", context.file, childPointer(context.pointer, field), `${field} must be an array`));
          continue;
        }
        value[field].forEach((sourceId, index) => sourceReferences.push({ sourceId, file: context.file, pointer: childPointer(childPointer(context.pointer, field), index) }));
      }

      if (
        !validatedGeometryOwners.has(value) &&
        value.type === "FeatureCollection" ||
        (!validatedGeometryOwners.has(value) && value.type === "Feature") ||
        (!validatedGeometryOwners.has(value) && isGeoJsonGeometry(value.geometry)) ||
        (!validatedGeometryOwners.has(value) && typeof value.latitude === "number" && typeof value.longitude === "number")
      ) {
        geometryCount += 1;
        validateGeometry(value, context, undefined, errors, validatedGeometryOwners);
      }
    });
  }

  for (const reference of sourceReferences) {
    if (typeof reference.sourceId !== "string" || !sources.has(reference.sourceId)) {
      errors.push(diagnostic("UNKNOWN_SOURCE", reference.file, reference.pointer, `source reference does not resolve: ${JSON.stringify(reference.sourceId)}`));
    }
  }

  if (sources.size === 0) warnings.push(diagnostic("NO_SOURCES", "", "", "corpus contains no recognized source records"));

  errors.sort((a, b) => `${a.file}${a.pointer}${a.code}`.localeCompare(`${b.file}${b.pointer}${b.code}`));
  warnings.sort((a, b) => `${a.file}${a.pointer}${a.code}`.localeCompare(`${b.file}${b.pointer}${b.code}`));
  return {
    status: errors.length === 0 ? "PASS" : "FAIL",
    bookmark_cutoff: cutoffText,
    counts: {
      files: files.length,
      parsed_records: records.length,
      objects: objectCount,
      sources: sources.size,
      primary_ids: primaryIds.size + sources.size,
      source_references: sourceReferences.length,
      geometry_records: geometryCount,
    },
    errors,
    warnings,
  };
}
