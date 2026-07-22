import assert from "node:assert/strict";
import { readRepoFile } from "../helpers/skill-contract.mjs";

const reviewSkill = readRepoFile("skills/requesting-code-review/SKILL.md");
const reviewerPrompt = readRepoFile("skills/requesting-code-review/code-reviewer.md");
const taskReviewerPrompt = readRepoFile("skills/subagent-driven-development/task-reviewer-prompt.md");

const reviewConsumers = [
  ["requesting-code-review skill", reviewSkill],
  ["code reviewer prompt", reviewerPrompt],
  ["protected task/frontier reviewer prompt", taskReviewerPrompt],
];

for (const [label, content] of reviewConsumers) {
  assert.match(content, /readiness,\s*admission,\s*acceptance,\s*mandatory[- ]rework,\s*or\s*integration/i,
    `${label} must classify every readiness/admission/integration verdict as Review`);
  assert.match(content, /same bounded Review (?:budget|pass)/i,
    `${label} must charge adjudication against the same bounded Review pass`);
  assert.match(content, /Reviewer,\s*Oracle,\s*analyst,\s*or\s*adjudicator/i,
    `${label} must count Review regardless of agent name`);
  assert.match(content, /authority acceptance IDs?/i,
    `${label} must use authority acceptance IDs`);
  assert.match(content, /current task card/i,
    `${label} must use current task-card terminology`);
  assert.match(content, /exact diff.*evidence paths|exact evidence.*diff paths/is,
    `${label} must require exact diff and evidence paths`);
  assert.match(content, /controller disposition/i,
    `${label} must preserve controller disposition`);
  assert.doesNotMatch(content, /\[BRIEF_FILE\]|scripts\/task-brief|scripts\/review-package/,
    `${label} must not reference unavailable task-brief/review-package helpers`);
}

assert.match(reviewSkill, /Routine frontiers have no independent task Review/i,
  "routine frontiers must not dispatch independent task Review");
assert.match(reviewSkill, /protected[- ]contract.*final (?:whole[- ]change )?Review.*one initial.*one closure/is,
  "protected-contract and final Review must retain initial + one closure semantics");
assert.match(taskReviewerPrompt, /protected contract or frontier boundary/i,
  "task/frontier reviewer must be reserved for protected boundaries");

for (const [label, content] of reviewConsumers) {
  assert.match(content, /acceptanceId|authority acceptance IDs?|protected boundary/i,
    `${label} blocking findings must bind to acceptance or protected boundary`);
  assert.match(content, /concrete failure scenario|reproducible evidence/i,
    `${label} blocking findings must include concrete evidence`);
  assert.match(content, /observable behavior|data integrity|security\/privacy|public\/shared contract/i,
    `${label} blocking findings must prove qualified impact`);
  assert.match(content, /cannot be deferred/i,
    `${label} blocking findings must explain why deferral is unsafe`);
  assert.match(content, /non[- ]blocking|deferred/i,
    `${label} must retain non-blocking/deferred disposition`);
  assert.match(content, /Critical.*(?:regression|security|data|privacy|block)/is,
    `${label} must retain Critical escalation`);
}

for (const [label, content] of [
  ["code reviewer prompt", reviewerPrompt],
  ["protected task/frontier reviewer prompt", taskReviewerPrompt],
]) {
  assert.match(content, /closure[\s\S]*initial findings[\s\S]*fix diff[\s\S]*adjacent\s+regression/i,
    `${label} must freeze closure scope to initial findings, fix diff, and adjacent regression evidence`);
}

console.log("review convergence contract checks passed");
