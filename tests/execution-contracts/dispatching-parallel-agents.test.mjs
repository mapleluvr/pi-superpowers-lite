import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/dispatching-parallel-agents/SKILL.md");

assert.match(skill, /investigation and implementation|investigations? or implementation/i,
  "parallel dispatch must cover both investigations and implementation units");
for (const predicate of [
  /immutable inputs/i,
  /disjoint (?:write|owns)/i,
  /no (?:same-wave )?dependency path/i,
  /isolated mutable resources/i,
]) {
  assert.match(skill, predicate, `independence predicate must include ${predicate}`);
}
assert.match(skill, /investigation.*read-only/is, "investigation fanout must remain read-only");
assert.match(skill, /investigation.*(?:omit|without).*worktree/is,
  "read-only investigations may omit worktrees");
assert.match(skill, /implementation.*worktree:\s*true/is,
  "implementation fanout must use isolated native worktrees");
assert.match(skill, /patch handoff/i, "implementation workers must return patches");
assert.match(skill, /subagent-driven-development/i,
  "implementation admission must delegate to SDD rather than duplicate it");
assert.match(skill, /failed.*wave.*(?:integrates? zero|zero.*integrat)/is,
  "a failed implementation wave must integrate zero patches");
assert.match(skill, /overlap.*sequential|sequential.*overlap/is,
  "overlapping ownership must stay sequential");
assert.match(skill, /union L2|L2.*successful integration/is,
  "successful integration must use affected-closure L2");
assert.doesNotMatch(skill, /run (?:the )?full (?:test )?suite/i,
  "parallel dispatch must not prescribe an intermediate full suite");
assert.match(skill, /one (?:agent|domain) per (?:independent )?(?:problem )?domain/i,
  "each agent must keep one focused domain");
assert.ok(wordCount(skill) <= 950, "parallel-dispatch skill must not exceed its baseline word count");

console.log("dispatching-parallel-agents execution contract checks passed");
