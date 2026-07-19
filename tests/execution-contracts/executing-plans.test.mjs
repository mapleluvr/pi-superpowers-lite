import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/executing-plans/SKILL.md");

assert.match(skill, /execution graph.*when present|if.*execution graph|with.*execution graph/is,
  "inline execution must treat the graph as conditional");
assert.match(skill, /(?:graphless|without an execution graph).{0,120}single (?:dependency )?chain|single (?:dependency )?chain.{0,120}(?:graphless|without an execution graph)/is,
  "graphless Full single chains must execute without a synthetic DAG");
assert.match(skill, /fail-first frontier/i, "inline execution must load the fail-first frontier once");
assert.match(skill, /topological wave/i, "graph plans must follow topological waves");
assert.match(skill, /(?:run|execute).{0,80}L0.{0,120}before.{0,80}L1/is,
  "each inline frontier must pass L0 before L1");
assert.match(skill, /L0.{0,80}(?:fail|unavailable).{0,80}(?:stop|block)/is,
  "failed or unavailable L0 must stop inline execution");
assert.match(skill, /sequentially.*one writer|one writer.*sequentially/is,
  "inline mode must execute eligible tasks sequentially in one writer");
assert.match(skill, /exact.*L1/i, "each task must run its declared L1");
assert.match(skill, /union L2/i, "each integrated wave must run union L2");
assert.match(skill, /graphless[\s\S]{0,120}union L2[\s\S]{0,80}exactly once after all listed tasks/i,
  "graphless chains must run exactly one union L2 after every task finishes");
assert.match(skill, /never between tasks/i,
  "graphless chains must not run L2 between tasks");
assert.match(skill, /task-local checks passed/i);
assert.match(skill, /affected closure passed/i);
assert.match(skill, /graph.*closure.*(?:return|back).*plan review|(?:return|back).*plan review.*graph.*closure/is,
  "graph or closure contradictions must return to plan review");
assert.match(skill, /do not (?:invent|synthesize|create).{0,40}(?:synthetic )?(?:DAG|graph)|no synthetic (?:DAG|graph)/is,
  "single-chain execution must not invent a graph");
assert.match(skill, /redesign.*(?:unit|boundary)|focused harness|defer.*final integration/is,
  "missing focused evidence must redesign, add a harness, or defer");
assert.match(skill, /No task or intermediate wave.*L3/i,
  "task and wave execution must prohibit L3");
assert.match(skill, /finalization.*valid L3 evidence record|valid L3 evidence record.*finalization/is,
  "finishing must require finalization-owned L3 evidence");
assert.match(skill, /finishing-a-development-branch/i);
assert.ok(wordCount(skill) <= 350, "executing-plans must not exceed its baseline word count");

console.log("executing-plans execution contract checks passed");
