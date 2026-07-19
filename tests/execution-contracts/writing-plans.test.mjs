import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/writing-plans/SKILL.md");
const reviewer = readRepoFile("skills/writing-plans/plan-document-reviewer-prompt.md");

assert.match(skill, /two or more independently mergeable (?:implementation )?units/i,
  "execution graphs must be conditional on parallelizable Full work");
assert.match(skill, /single (?:dependency|sequential) chain.*(?:serial|no DAG)|(?:no DAG|serial).*single (?:dependency|sequential) chain/is,
  "single-chain Full work must remain serial without DAG ceremony");

for (const field of ["task", "wave", "dependsOn", "owns", "mutableResources", "produces", "consumes", "risk", "L1", "L2"]) {
  assert.match(skill, new RegExp(`\\b${field}\\b`, "i"), `execution graph must define ${field}`);
}

for (const requirement of [
  /fail-first frontier/i,
  /base SHA/i,
  /CI status/i,
  /selective baseline/i,
  /reverse consumers/i,
  /shared (?:build|configuration|config).*surfaces/is,
  /exact commands? and filters?/i,
  /exclusion rationale/i,
]) {
  assert.match(skill, requirement, `plan must define ${requirement}`);
}

assert.match(skill, /mutableResources.*(?:database|port|cache|service|temp)|(?:database|port|cache|service|temp).*mutableResources/is,
  "plans must assign exact mutable resource identities");
assert.match(skill, /Task Structure[\s\S]*Mutable resources:/i,
  "each task brief must carry mutable resource ownership");
assert.match(skill, /redesign.*(?:unit|boundary)|focused harness|defer.*final integration/is,
  "missing focused verification must redesign, add a harness, or defer integration");
assert.match(skill, /L3.*finalization|finalization.*L3/is,
  "L3 must be owned by finalization");
assert.match(skill, /No implementation task may contain an L3 command/i,
  "implementation tasks must prohibit L3 commands");
assert.doesNotMatch(skill, /Regression: `exact broader command`/,
  "task templates must not imply a broader suite after each task");

for (const rejection of [
  /overlap/i,
  /dependency violation/i,
  /missing patch ownership/i,
  /early L3/i,
  /fake affected closure/i,
]) {
  assert.match(reviewer, rejection, `plan reviewer must reject ${rejection}`);
}

assert.ok(wordCount(skill) <= 1096, "writing-plans must not exceed its baseline word count");
assert.ok(wordCount(reviewer) <= 235, "plan reviewer prompt must not exceed its baseline word count");

console.log("writing-plans execution contract checks passed");
