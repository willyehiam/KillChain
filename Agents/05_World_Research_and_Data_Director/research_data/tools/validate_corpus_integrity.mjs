#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCorpus } from "./corpus_integrity.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const arguments_ = process.argv.slice(2);
const strictWarningsIndex = arguments_.indexOf("--strict-warnings");
const strictWarnings = strictWarningsIndex !== -1;
if (strictWarnings) arguments_.splice(strictWarningsIndex, 1);
const researchRoot = path.resolve(arguments_[0] ?? path.join(scriptDirectory, ".."));
const report = validateCorpus(researchRoot);

console.log(JSON.stringify({ research_root: researchRoot, ...report }, null, 2));
if (report.errors.length > 0 || (strictWarnings && report.warnings.length > 0)) process.exitCode = 1;
