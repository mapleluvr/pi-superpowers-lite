import assert from "node:assert/strict";
import { readRepoFile } from "../helpers/skill-contract.mjs";

const reviewSkill = readRepoFile("skills/requesting-code-review/SKILL.md");
const reviewerPrompt = readRepoFile("skills/requesting-code-review/code-reviewer.md");
const sddSkill = readRepoFile("skills/subagent-driven-development/SKILL.md");

assert.doesNotMatch(reviewSkill, /Review early, review often/i,
  "review policy must not encourage unbounded review frequency");
for (const anchor of [
  /one initial review/i,
  /one closure review/i,
  /one review packet per pass/i,
  /re-review scope/i,
  /new non-Critical findings.*deferred/is,
  /controller.*(?:disposition|defer|reject)|labels are advisory/is,
]) {
  assert.match(reviewSkill, anchor, `review convergence contract must contain ${anchor}`);
}
for (const anchor of [
  /acceptanceId|protected boundary/i,
  /concrete failure scenario|reproducible evidence/i,
  /observable behavior|data integrity|security|public\/shared contract/i,
  /cannot be deferred/i,
  /non-blocking/i,
]) {
  assert.match(reviewSkill, anchor, `blocking finding must prove ${anchor}`);
}
assert.doesNotMatch(reviewSkill, /Important findings block progression until fixed/i,
  "unqualified Important findings must not block by label alone");
assert.match(reviewSkill, /Critical.*(?:regression|security|data|privacy)|Critical.*block/is,
  "Critical escalation must remain available");

assert.match(reviewerPrompt, /acceptance.*(?:item|boundary)|protected boundary/i,
  "reviewer must bind blocking findings to an acceptance or protected boundary");
assert.match(reviewerPrompt, /reproducible|concrete failure scenario/i,
  "reviewer must provide a concrete failure scenario");
assert.match(reviewerPrompt, /defer|non-blocking/i,
  "reviewer must have a non-blocking disposition");
assert.match(reviewerPrompt, /closure|fix diff|new findings.*introduced|scope/i,
  "reviewer prompt must constrain closure scope");
assert.doesNotMatch(reviewerPrompt, /test gaps.*Important|Important.*test gaps/i,
  "test gaps must not be unconditionally blocking");

for (const anchor of [
  /at most two review passes/i,
  /one initial review/i,
  /one closure review/i,
  /one review packet per pass/i,
  /closure.*(?:initial findings|fix diff)/is,
  /routine tasks do not dispatch a task reviewer/i,
  /new non-Critical.*deferred/is,
  /Critical.*regression/is,
  /final whole-branch review/i,
]) {
  assert.match(sddSkill, anchor, `SDD review budget must contain ${anchor}`);
}
assert.doesNotMatch(sddSkill, /Critical or Important findings block progression/i,
  "SDD must require qualified impact, not severity labels alone");

console.log("review convergence contract checks passed");
