import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/executing-plans/SKILL.md");

assert.match(skill, /read.*execution graph.*fail-first frontier|read.*fail-first frontier.*execution graph/is,
  "inline execution must load graph and fail-first frontier once");
assert.match(skill, /topological wave/i, "tasks must follow topological waves");
assert.match(skill, /sequentially.*one writer|one writer.*sequentially/is,
  "inline mode must execute eligible tasks sequentially in one writer");
assert.match(skill, /exact.*L1/i, "each task must run its declared L1");
assert.match(skill, /union L2/i, "each integrated wave must run union L2");
assert.match(skill, /task-local checks passed/i);
assert.match(skill, /affected closure passed/i);
assert.match(skill, /graph.*closure.*(?:return|back).*plan review|(?:return|back).*plan review.*graph.*closure/is,
  "graph or closure contradictions must return to plan review");
assert.match(skill, /redesign.*(?:unit|boundary)|focused harness|defer.*final integration/is,
  "missing focused evidence must redesign, add a harness, or defer");
assert.match(skill, /No task or intermediate wave.*L3/i,
  "task and wave execution must prohibit L3");
assert.match(skill, /finalization.*valid L3 evidence record|valid L3 evidence record.*finalization/is,
  "finishing must require finalization-owned L3 evidence");
assert.match(skill, /finishing-a-development-branch/i);
assert.ok(wordCount(skill) <= 350, "executing-plans must not exceed its baseline word count");

console.log("executing-plans execution contract checks passed");
