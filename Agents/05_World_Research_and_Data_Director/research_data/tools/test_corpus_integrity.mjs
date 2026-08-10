#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCorpus } from "./corpus_integrity.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(scriptDirectory, "fixtures", "corpus_integrity");

const passing = validateCorpus(path.join(fixtures, "pass"), { excludedDirectories: [] });
assert.equal(passing.status, "PASS", JSON.stringify(passing.errors, null, 2));
assert.equal(passing.counts.sources, 1, "compiler authoring sources must not duplicate generated corpus records");

const failing = validateCorpus(path.join(fixtures, "fail"), { excludedDirectories: [] });
assert.equal(failing.status, "FAIL");
const codes = new Set(failing.errors.map((error) => error.code));
for (const expected of [
  "BOOKMARK_FIREWALL",
  "DUPLICATE_ID",
  "IMPLICIT_UNKNOWN",
  "MISSING_COORDINATE_PRECISION",
  "MISSING_TEMPORAL",
  "PARSE_JSON",
  "PARSE_NDJSON",
  "UNKNOWN_SOURCE",
]) {
  assert(codes.has(expected), `missing expected diagnostic ${expected}`);
}

console.log(JSON.stringify({ status: "PASS", passing_fixture: passing.counts, failing_diagnostics: [...codes].sort() }, null, 2));
