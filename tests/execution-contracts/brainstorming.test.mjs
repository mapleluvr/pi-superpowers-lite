import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/brainstorming/SKILL.md");
const reviewer = readRepoFile("skills/brainstorming/spec-document-reviewer-prompt.md");

assert.match(skill, /two or more independently (?:mergeable|executable) units/i,
  "parallel-wave design must be conditional on at least two independent units");
assert.match(skill, /single (?:dependency chain|sequential chain).*does not require|do not force.*single (?:dependency chain|sequential chain)/is,
  "a single dependency chain must not require DAG ceremony");
assert.match(skill, /transactional invariant.*(?:one unit|together|do not split)/is,
  "transactional invariants must not be split artificially");

for (const field of [
  "responsibility",
  "owns",
  "contract",
  "produces",
  "consumes",
  "mutable resources",
  "focused verification",
  "reversibility",
]) {
  assert.match(skill, new RegExp(field, "i"), `boundary map must include ${field}`);
}

assert.match(skill, /fail-first (?:architecture\/probe )?frontier/i,
  "design must name a fail-first frontier");
assert.match(skill, /before (?:broad|wider) implementation|before fan-out/i,
  "the fail-first frontier must run before broad implementation");
for (const boundary of ["public/shared", "security", "migration", "concurrency"]) {
  assert.match(skill, new RegExp(boundary, "i"), `contract spine must cover ${boundary} boundaries`);
}
for (const action of ["reviewed", "pinned", "invalidat"] ) {
  assert.match(skill, new RegExp(action, "i"), `contract spine must be ${action}`);
}
assert.match(skill, /additive or compatibility (?:phase|path)/i,
  "destructive transitions must use additive or compatibility phases");
assert.match(skill, /(?:live )?cutover.*finalization|finalization.*(?:live )?cutover/is,
  "live cutover must wait for finalization");

for (const rejection of [
  /artificial decomposition/i,
  /unstable.*fan-out|fan-out.*unstable/is,
  /missing.*fail-first/i,
  /destructive intermediate/i,
  /missing.*selective verification/i,
]) {
  assert.match(reviewer, rejection, `spec reviewer must reject ${rejection}`);
}

assert.ok(wordCount(skill) <= 1574, "brainstorming must not exceed its baseline word count");
assert.ok(wordCount(reviewer) <= 235, "spec reviewer prompt must not exceed its baseline word count");

console.log("brainstorming execution contract checks passed");
