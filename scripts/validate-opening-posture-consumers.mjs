#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const token='taiwan_opening_posture_2025';
const executable=/\.(?:c?js|mjs|jsx|ts|tsx)$/;
const ignored=new Set(['.git','node_modules','.next','dist','build']);

export function validateConsumerImports(repoRoot){
  const violations=[];
  function visit(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      if(ignored.has(entry.name)) continue;
      const full=path.join(dir,entry.name);
      const relative=path.relative(repoRoot,full).replaceAll('\\','/');
      if(relative===`scripts/validate-opening-posture-consumers.mjs`||relative.includes(`/${token}/`)||relative.startsWith(`Agents/09_QA_Balance_and_Adversarial_Playtest_Lead/audits/`)) continue;
      if(entry.isDirectory()) visit(full);
      else if(executable.test(entry.name)&&fs.readFileSync(full,'utf8').includes(token)) violations.push(relative);
    }
  }
  visit(repoRoot);
  return violations;
}

const here=path.dirname(fileURLToPath(import.meta.url));
const rootArgument=process.argv.slice(2).find(value=>!value.startsWith('--'));
const repoRoot=path.resolve(rootArgument??path.join(here,'..'));
const violations=validateConsumerImports(repoRoot);
if(process.argv.includes('--self-test')){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'killweb-consumer-guard-'));
  try{
    fs.mkdirSync(path.join(temp,'lib'),{recursive:true});
    fs.writeFileSync(path.join(temp,'lib','bad.ts'),`import data from '../${token}/manifest.json';\n`);
    assert.deepEqual(validateConsumerImports(temp),['lib/bad.ts']);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
console.log(JSON.stringify({ok:violations.length===0,blocked_packet:token,violations},null,2));
if(violations.length) process.exit(1);
