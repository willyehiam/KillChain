#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const validator = path.join(directory, "validate_acceptance_fixture.mjs");
const fixture = JSON.parse(fs.readFileSync(path.join(directory, "acceptance_fixture.json"), "utf8"));
const matrix = JSON.parse(fs.readFileSync(path.join(directory, "participation_matrix.json"), "utf8"));
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "killweb-acceptance-mutations-"));
const results = [];

function runMutation(name, mutateFixture, mutateMatrix, expectedFragment) {
  const candidateFixture = structuredClone(fixture);
  const candidateMatrix = structuredClone(matrix);
  mutateFixture?.(candidateFixture);
  mutateMatrix?.(candidateMatrix);
  const fixturePath = path.join(temporaryRoot, `${name}.fixture.json`);
  const matrixPath = path.join(temporaryRoot, `${name}.matrix.json`);
  fs.writeFileSync(fixturePath, `${JSON.stringify(candidateFixture, null, 2)}\n`);
  fs.writeFileSync(matrixPath, `${JSON.stringify(candidateMatrix, null, 2)}\n`);
  const run = spawnSync(process.execPath, [validator], {
    encoding: "utf8",
    env: {
      ...process.env,
      KILLWEB_ACCEPTANCE_FIXTURE: fixturePath,
      KILLWEB_PARTICIPATION_MATRIX: matrixPath,
    },
  });
  const output = `${run.stdout}\n${run.stderr}`;
  results.push({
    name,
    passed: run.status !== 0 && output.includes(expectedFragment),
    exit_status: run.status,
    expected_fragment: expectedFragment,
  });
}

runMutation(
  "reject_automatic_country_entry",
  null,
  (candidate) => { candidate.countries[3].automatic_entry = true; },
  "automatic entry is forbidden",
);
runMutation(
  "reject_access_as_combat_authority",
  null,
  (candidate) => { candidate.acceptance_rules.access_implies_combat_authority = true; },
  "Access cannot imply combat authority",
);
runMutation(
  "reject_future_truth_leak",
  (candidate) => { candidate.future_branch_input.opening_faction_knowledge = true; },
  null,
  "Future branch leaked into opening knowledge",
);
runMutation(
  "reject_resource_overspend",
  (candidate) => {
    const transfer = candidate.commands[3].operations.find((operation) => operation.operation === "transfer");
    transfer.quantity = 99;
  },
  null,
  "insufficient isr_capability_token",
);
runMutation(
  "reject_missing_authority_route",
  null,
  (candidate) => { candidate.countries[4].authority_route_ids.push("route_kor_missing"); },
  "missing authority route route_kor_missing",
);

fs.rmSync(temporaryRoot, { recursive: true });

const failures = results.filter((result) => !result.passed);
console.log(JSON.stringify({
  status: failures.length ? "FAIL" : "PASS",
  mutation_tests: results,
}, null, 2));
if (failures.length) process.exitCode = 1;
