import assert from "node:assert/strict";
import { readRepoFile } from "../helpers/skill-contract.mjs";

const sdd = readRepoFile("skills/subagent-driven-development/SKILL.md");
const implementer = readRepoFile("skills/subagent-driven-development/implementer-prompt.md");
const inline = readRepoFile("skills/executing-plans/SKILL.md");
const dispatch = readRepoFile("skills/dispatching-parallel-agents/SKILL.md");
const executionText = [sdd, implementer, inline, dispatch].join("\n---\n");

for (const artifact of [
  /\.superpowers\/work\/<run-id>\/manifest\.json/i,
  /frontier\.json/i,
  /frontier\.md/i,
  /tasks\/T\d+\.md|task cards?/i,
]) {
  assert.match(executionText, artifact, `execution consumers must reference ${artifact}`);
}

assert.match(sdd, /one structured record per gate/i,
  "SDD must default to compact structured gate evidence");
assert.match(sdd, /evidence\/l0\/record\.json[\s\S]{0,240}evidence\/l1\/<task-id>\.json[\s\S]{0,240}evidence\/l2\/record\.json/is,
  "SDD must name compact L0/L1/L2 evidence records");
assert.match(sdd, /finalization\/evidence\/l3\.json/i,
  "SDD must name finalization L3 evidence");
assert.match(sdd, /Do not create[\s\S]{0,180}duplicate.*(?:log|JSON|status|manifest)/i,
  "SDD must prohibit duplicate evidence ledgers");
assert.match(sdd, /hidden dependency[\s\S]{0,160}supersede/i,
  "hidden dependencies must supersede stale frontiers");
assert.match(sdd, /local defect[\s\S]{0,180}correction frontier/i,
  "local defects must become correction frontiers");
assert.match(sdd, /two rejected candidates[\s\S]{0,220}core-contract[\s\S]{0,220}re-?decomposition/i,
  "repeated core-contract failure must re-decompose before another attempt");
assert.match(inline, /current tasks[\s\S]{0,160}in order/i,
  "Inline must run only the current frontier tasks in order");
assert.match(inline, /terminal frontier L2[\s\S]{0,120}exactly once after all current tasks/is,
  "Inline must run one terminal frontier L2");
assert.match(dispatch, /net benefit[\s\S]{0,180}(?:Inline fallback|fallback to Inline|choose Inline)/is,
  "Parallel dispatch must fall back to Inline when net benefit is unclear");

assert.doesNotMatch(executionText, /\[BRIEF_FILE\]|task brief|authority brief|scripts\/task-brief|scripts\/review-package|\.superpowers\/sdd\/progress\.md|duplicate progress ledger/i,
  "execution consumers must not reference legacy brief helpers or duplicate ledgers");
assert.doesNotMatch(sdd, /fix wave|final-review ledger/i,
  "SDD finalization must use correction frontiers and manifest risk rather than old wave/ledger artifacts");

console.log("progressive execution consumer contract checks passed");
