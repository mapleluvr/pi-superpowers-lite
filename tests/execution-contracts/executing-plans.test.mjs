import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/executing-plans/SKILL.md");

assert.match(skill, /\.superpowers\/work\/<run-id>\/manifest\.json/i,
  "inline execution must start from the dynamic run manifest");
assert.match(skill, /frontier execution[\s\S]{0,180}exactly one current frontier|exactly one current frontier[\s\S]{0,180}frontier execution/i,
  "inline frontier execution must load exactly one current frontier");
assert.match(skill, /currentFrontier[\s\S]{0,100}(?:null|none)[\s\S]{0,220}finalization[\s\S]{0,100}ready[\s\S]{0,220}(?:enter|resume|continue)[\s\S]{0,100}finalization/i,
  "a terminal-ready manifest must resume directly into finalization");
assert.match(skill, /(?:null|none)[\s\S]{0,160}(?:stop|invalid|reject)[\s\S]{0,180}(?:unless|except)[\s\S]{0,120}finalization[\s\S]{0,80}ready|(?:unless|except)[\s\S]{0,120}finalization[\s\S]{0,80}ready[\s\S]{0,180}(?:null|none)[\s\S]{0,160}(?:stop|invalid|reject)/i,
  "other null-current-frontier states must fail closed");
assert.match(skill, /frontier\.json/i, "inline execution must consume the frontier index");
assert.match(skill, /current tasks[\s\S]{0,160}in order|in order[\s\S]{0,160}current tasks/i,
  "inline mode must run current tasks in order");
assert.match(skill, /sequentially.*one writer|one writer.*sequentially/is,
  "inline mode must execute tasks sequentially in one writer");
assert.match(skill, /(?:run|execute).{0,80}L0.{0,120}before.{0,80}L1/is,
  "the current frontier must pass L0 before task L1");
assert.match(skill, /L0.{0,80}(?:fail|unavailable).{0,80}(?:stop|block)/is,
  "failed or unavailable L0 must stop inline execution");
assert.match(skill, /task cards?/i, "inline execution must use task cards");
assert.match(skill, /exact declared L1/i, "each task must run its declared L1");
assert.match(skill, /terminal frontier L2/i,
  "inline mode must run one terminal frontier L2");
assert.match(skill, /exactly once after all current tasks/i,
  "inline mode must run frontier L2 exactly once after all current tasks");
assert.match(skill, /never between tasks/i,
  "inline mode must not run L2 between tasks");
assert.match(skill, /task-local checks passed/i);
assert.match(skill, /affected closure passed/i);
assert.match(skill, /hidden dependency[\s\S]{0,160}supersede/i,
  "inline hidden dependencies must supersede the frontier");
assert.match(skill, /local defect[\s\S]{0,180}correction frontier/i,
  "inline local defects must create correction frontiers");
assert.match(skill, /two rejected candidates[\s\S]{0,220}core-contract[\s\S]{0,220}re-?decomposition/i,
  "two rejected core-contract candidates must force re-decomposition");
assert.doesNotMatch(skill, /execution graph|topological wave|synthetic DAG|task brief|authority brief|duplicate progress ledger|\.superpowers\/sdd\/progress\.md/i,
  "inline execution must not consume legacy graph, brief, or ledger artifacts");
assert.match(skill, /No task or intermediate frontier.*L3/i,
  "task and frontier execution must prohibit L3");
assert.match(skill, /finalization.*valid L3 evidence record|valid L3 evidence record.*finalization/is,
  "finishing must require finalization-owned L3 evidence");
assert.match(skill, /finishing-a-development-branch/i);
assert.ok(wordCount(skill) <= 350, "executing-plans must not exceed its baseline word count");

console.log("executing-plans execution contract checks passed");
