import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/subagent-driven-development/SKILL.md");
const implementer = readRepoFile("skills/subagent-driven-development/implementer-prompt.md");

assert.match(skill, /two or more independently mergeable (?:implementation )?units/i,
  "parallel SDD must require independently mergeable units");
assert.match(skill, /single canonical integrator/i, "one integrator must own canonical writes");
assert.match(skill, /frozen (?:clean )?(?:wave )?base/i, "waves must use one frozen clean base");
assert.match(skill, /worktree:\s*true/i, "native Pi implementation workers must use isolated worktrees");
assert.match(skill, /native.*handoff.*patch|native.*patch handoff/is,
  "native worktree output must be treated as a patch handoff");

for (const preflight of [
  /non-empty.*patch|patch.*non-empty/i,
  /renames? and deletions?|renames?\/deletions?/i,
  /changed paths?.*(?:subset|within).*owns/is,
  /overlap/i,
  /git apply --check/i,
  /before (?:any )?patch.*appl/is,
]) {
  assert.match(skill, preflight, `wave admission must include ${preflight}`);
}
assert.match(skill, /failed|blocked|unresolved/i);
assert.match(skill, /integrates? zero|zero.*integrat/is,
  "a failed wave must integrate zero patches");
assert.match(skill, /(?:run|execute).{0,80}(?:plan-declared )?L0.{0,80}current frontier/is,
  "controller must run the current frontier L0");
assert.match(skill, /only after L0 passes.{0,80}dispatch/is,
  "dispatch must be gated on passing L0");
assert.match(skill, /(?:failed|unavailable).{0,40}L0.{0,80}(?:zero|no) fanout|(?:zero|no) fanout.{0,80}(?:failed|unavailable).{0,40}L0/is,
  "failed or unavailable L0 must stop fanout");
assert.match(skill, /reverse-(?:apply|appl)|git apply --reverse/is,
  "post-apply L1 failure must remove the current uncommitted patch");
assert.match(skill, /(?:revert|reverting).{0,100}(?:prior|earlier|all).{0,80}commits?.{0,80}wave|(?:revert|reverting).{0,100}wave.{0,80}commits?/is,
  "post-apply failure must revert prior commits from the failed wave");
assert.match(skill, /(?:original|frozen|WAVE_BASE).{0,50}tree|tree.{0,50}(?:original|frozen|WAVE_BASE)/is,
  "failed-wave recovery must prove the original tree");
assert.match(skill, /without rewriting history|do not rewrite history/i,
  "recovery must use non-destructive history");
assert.match(skill, /union L2/i, "successful waves must run union L2");
assert.match(skill, /repository-wide L3.*finalization|finalization.*repository-wide L3/is,
  "repository-wide L3 must be finalization-only");

for (const evidence of [
  /clean HEAD/i,
  /exact.*commands?/i,
  /tool\/runtime versions?|tool.*runtime.*versions?/i,
  /non-secret external.*hash|external.*non-secret.*hash/is,
  /material invalidation/i,
  /final whole-(?:branch|change) review/i,
  /live effects?.*(?:after|behind).*L3/is,
]) {
  assert.match(skill, evidence, `finalization must include ${evidence}`);
}

assert.match(implementer, /passed L0 evidence|L0 evidence.*passed/i,
  "implementers must require controller-provided passing L0 evidence");
assert.match(implementer, /L0 evidence.{0,100}(?:missing|mismatched).{0,160}(?:BLOCKED|NEEDS_CONTEXT)|(?:missing|mismatched).{0,100}L0 evidence.{0,160}(?:BLOCKED|NEEDS_CONTEXT)/is,
  "missing or mismatched L0 evidence must block implementation");
assert.match(implementer, /exact declared L1/i,
  "implementers must run only the declared task-local command");
assert.match(implementer, /must not run.*(?:package-wide|repository-wide)/is,
  "implementers must not run repository-wide suites");
assert.match(implementer, /task-local checks passed/i,
  "implementer claims must be scope-qualified");
assert.doesNotMatch(implementer, /full suite once before committing/i,
  "legacy per-task full-suite guidance must be removed");

assert.ok(wordCount(skill) <= 1358, "SDD skill must not exceed its baseline word count");
assert.ok(wordCount(implementer) <= 832, "implementer prompt must not exceed its baseline word count");

console.log("subagent-driven-development execution contract checks passed");
