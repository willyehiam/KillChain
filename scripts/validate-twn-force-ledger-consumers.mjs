#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const token = 'countries/twn/force_ledger';
const executable = /\.(?:c?js|mjs|jsx|ts|tsx)$/;
const ignored = new Set(['.git','node_modules','.next','dist','build']);

export function validateConsumerImports(repoRoot) {
  const violations = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      if (ignored.has(entry.name)) continue;
      const full = path.join(directory, entry.name);
      const relative = path.relative(repoRoot, full).replaceAll('\\', '/');
      if (relative === 'scripts/validate-twn-force-ledger-consumers.mjs' || relative.startsWith(`Agents/05_World_Research_and_Data_Director/research_data/${token}/`) || relative.startsWith('Agents/09_QA_Balance_and_Adversarial_Playtest_Lead/audits/')) continue;
      if (entry.isDirectory()) visit(full);
      else if (executable.test(entry.name) && fs.readFileSync(full, 'utf8').replaceAll('\\', '/').includes(token)) violations.push(relative);
    }
  }
  visit(repoRoot);
  return violations;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const rootArgument = process.argv.slice(2).find((value) => !value.startsWith('--'));
const repoRoot = path.resolve(rootArgument ?? path.join(here, '..'));
const violations = validateConsumerImports(repoRoot);
if (process.argv.includes('--self-test')) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'killweb-twn-force-consumer-'));
  try {
    fs.mkdirSync(path.join(temp, 'simulation'), {recursive:true});
    fs.writeFileSync(path.join(temp, 'simulation', 'bad.ts'), `import manifest from '../Agents/05_World_Research_and_Data_Director/research_data/countries/twn/force_ledger/manifest.json';\n`);
    assert.deepEqual(validateConsumerImports(temp), ['simulation/bad.ts']);
  } finally { fs.rmSync(temp, {recursive:true, force:true}); }
}
console.log(JSON.stringify({ok:violations.length === 0, blocked_packet:token, reason:'Taiwan force ledger remains collecting and nonexecutable; parent-plus-child raw summation and all other direct executable imports are forbidden.', violations}, null, 2));
if (violations.length) process.exit(1);
