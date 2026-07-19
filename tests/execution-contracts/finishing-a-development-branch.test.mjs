import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/finishing-a-development-branch/SKILL.md");

assert.match(skill, /L3 evidence record/i);
for (const field of [
  /HEAD/i,
  /clean.*dirty|dirty.*clean/is,
  /exact.*command/i,
  /tool.*runtime.*version|runtime.*tool.*version/is,
  /external config.*hash|environment fingerprint/is,
]) {
  assert.match(skill, field, `L3 reuse must bind ${field}`);
}
assert.match(skill, /secret.*never.*record|never.*record.*secret/is);
assert.match(skill, /reuse/i);
assert.match(skill, /missing.*failed|failed.*missing/is);
assert.match(skill, /merge.*updated base|updated base.*merge/is);
assert.match(skill, /final fix/i);
assert.match(skill, /dependenc|build|test|environment/i);
assert.match(skill, /read-only review.*(?:does not|doesn't).*invalid/is,
  "read-only review must preserve matching evidence");
assert.match(skill, /merged (?:target|result).*(?:run|rerun).*L3|(?:run|rerun).*L3.*merged (?:target|result)/is,
  "local merge must verify the merged state");
assert.doesNotMatch(skill, /npm test\s*\/\s*cargo test|pytest\s*\/\s*go test/i,
  "finishing must not prescribe a duplicate generic suite");
for (const option of [
  /1\. Merge back to <base-branch> locally/,
  /2\. Push and create a Pull Request/,
  /3\. Keep the branch as-is/,
  /4\. Discard this work/,
]) {
  assert.match(skill, option, `branch menu must preserve ${option}`);
}
assert.match(skill, /Type 'discard' to confirm/);
assert.ok(wordCount(skill) <= 1042, "finishing skill must not exceed its baseline word count");

console.log("finishing-a-development-branch execution contract checks passed");
