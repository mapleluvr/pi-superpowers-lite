import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/writing-plans/SKILL.md");
const reviewer = readRepoFile("skills/writing-plans/plan-document-reviewer-prompt.md");

assert.match(skill, /\.superpowers\/work\/<run-id>/i,
  "writing-plans must initialize the ignored run workspace");
for (const artifact of ["manifest.json", "frontier.md", "frontier.json", "task card"]) {
  assert.match(skill, new RegExp(artifact.replace(".", "\\."), "i"),
    `workspace initialization must produce ${artifact}`);
}
assert.match(skill, /Git-ignored|ignored workspace/i,
  "derived execution state must remain Git-ignored");
assert.match(skill, /does not|do not|never/i,
  "the skill must explicitly bound derived planning");
assert.doesNotMatch(skill, /Save plans to:/i,
  "writing-plans must not require a committed static plan");
assert.match(skill, /(?:inspect|read).*(?:current )?code.*tests?|tests?.*(?:inspect|read).*(?:current )?code/is,
  "frontier selection must follow current-code inspection");
assert.match(skill, /selective baseline/i,
  "workspace initialization must record a selective baseline");
assert.match(skill, /legacy[\s\S]{0,100}(?:spec|plan)[\s\S]{0,180}(?:explicit )?safe boundary/i,
  "an approved legacy spec or plan must be admissible only at an explicit safe boundary");
assert.match(skill, /bind[\s\S]{0,120}legacy[\s\S]{0,160}(?:commit|hash|identity)[\s\S]{0,160}(?:one|single)[\s\S]{0,80}run/i,
  "legacy bootstrap must bind source identity to one run");
assert.match(skill, /(?:do not|never)[\s\S]{0,120}(?:copy|rename|migrate)[\s\S]{0,160}(?:task card|durable authority)|(?:task card|durable authority)[\s\S]{0,160}(?:do not|never)[\s\S]{0,120}(?:copy|rename|migrate)/i,
  "legacy bootstrap must not copy or bulk-migrate legacy authority");
assert.match(skill, /active legacy run[\s\S]{0,120}(?:unchanged|not migrated|do not migrate)/i,
  "active legacy runs must remain unchanged");
assert.match(skill, /highest-value.*earliest verifiable frontier|earliest verifiable.*highest-value/is,
  "planning must select the nearest high-value frontier");
assert.match(skill, /current frontier/i,
  "planning scope must be the current frontier");
assert.match(skill, /does not.{0,100}(?:promise|precompute)|do not.{0,100}(?:promise|precompute)/i,
  "writing-plans must not predict the full task graph");
assert.match(skill, /task count|later (?:tasks|waves|frontiers)/i,
  "the non-prediction rule must cover later work");

for (const factor of [
  /disjoint.*(?:writes|paths).*mutable resources|mutable resources.*disjoint/is,
  /stable.*interfaces?|contract spine/i,
  /focused L1/i,
  /critical path/i,
  /coordination.*cost|worktree.*cost|patch-admission.*cost/is,
]) {
  assert.match(skill, factor, `parallel net-benefit decision must consider ${factor}`);
}
assert.match(skill, /(?:unclear|not clear).*(?:Inline|serial)|(?:Inline|serial).*(?:unclear|not clear)/is,
  "uncertain parallel benefit must fall back to Inline");
assert.match(skill, /qualitative.*(?:rationale|decision)|(?:rationale|decision).*qualitative/is,
  "parallel choice must use qualitative rationale rather than a score");
assert.match(skill, /sole.*(?:worker|task-specific).*(?:instruction|authority)|task card.*sole/is,
  "one task card must be the only task-specific worker authority");

for (const check of [
  /authority.*(?:commit|hash)/is,
  /exactly one current frontier|one current frontier/i,
  /later (?:task|wave|frontier).*(?:predicted|precomputed)|static.*(?:DAG|graph)/is,
  /parallel.*(?:independence|net benefit)/is,
  /L3.*finalization|finalization.*L3/is,
]) {
  assert.match(reviewer, check, `frontier reviewer must check ${check}`);
}

assert.ok(wordCount(skill) <= 1096, "writing-plans must not exceed its baseline word count");
assert.ok(wordCount(reviewer) <= 235, "frontier reviewer prompt must not exceed its baseline word count");

console.log("writing-plans execution contract checks passed");
