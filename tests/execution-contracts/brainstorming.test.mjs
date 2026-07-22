import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/brainstorming/SKILL.md");
const reviewer = readRepoFile("skills/brainstorming/spec-document-reviewer-prompt.md");

assert.match(skill, /docs\/superpowers\/work\/<feature>/i,
  "Full design must use one feature authority directory");
for (const artifact of ["README.md", "intent.md", "contracts/", "decisions/"]) {
  assert.match(skill, new RegExp(artifact.replace(/[./]/g, "\\$&"), "i"),
    `authority structure must explain ${artifact}`);
}
for (const authority of [
  /acceptance.*stable (?:ID|identifier)/i,
  /hard constraints?/i,
  /non-goals?/i,
  /protected invariants?/i,
  /live or destructive effects?|destructive or live effects?/i,
]) {
  assert.match(skill, authority, `minimal intent must contain ${authority}`);
}
assert.match(skill, /contracts?.*(?:only|when).*(?:public|shared|security|migration|concurrency)/is,
  "contract documents must be risk-triggered rather than universal");
assert.match(skill, /do not include|exclude/i,
  "the skill must define a subtractive durable-authority boundary");
for (const excluded of ["task lists", "DAGs", "waves", "implementation paths", "model/reviewer allocation"]) {
  assert.match(skill, new RegExp(excluded.replace("/", "\\/"), "i"),
    `durable intent must exclude ${excluded}`);
}
assert.doesNotMatch(skill, /include a boundary map before approval/i,
  "durable specs must not require a complete implementation-unit boundary map");
assert.match(skill, /writing-plans.*(?:initialize|create).*(?:ignored|\.superpowers\/work).*current frontier/is,
  "approved authority must hand off to dynamic workspace initialization");

for (const check of [
  /observable outcome/i,
  /stable acceptance (?:ID|identifier)|acceptance.*stable/i,
  /protected invariant/i,
  /implementation (?:task|DAG|wave|path).*(?:leak|detail)|(?:task|DAG|wave).*(?:not belong|exclude)/is,
  /contract.*(?:necessary|public|shared|security|migration|concurrency)/is,
]) {
  assert.match(reviewer, check, `authority reviewer must check ${check}`);
}
assert.doesNotMatch(reviewer, /missing path ownership/i,
  "authority review must not demand derived task ownership");

assert.ok(wordCount(skill) <= 1574, "brainstorming must not exceed its baseline word count");
assert.ok(wordCount(reviewer) <= 235, "spec reviewer prompt must not exceed its baseline word count");

console.log("brainstorming execution contract checks passed");
