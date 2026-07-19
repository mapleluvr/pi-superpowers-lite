import assert from "node:assert/strict";
import { readRepoFile, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/verification-before-completion/SKILL.md");

assert.match(skill, /NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE/);
assert.match(skill, /identify.*scope.*tier|scope.*tier.*identify/is,
  "verification must identify claim scope and evidence tier first");
assert.match(skill, /L1.*task-local checks passed/is);
assert.match(skill, /L2.*affected closure passed/is);
assert.match(skill, /L3.*repository-wide.*passed/is);
for (const field of [/exact command/i, /exit code/i, /timestamp/i, /HEAD|tree identity/i, /dirty state/i]) {
  assert.match(skill, field, `evidence record must bind ${field}`);
}
assert.match(skill, /state.*changes?.*invalid|invalid.*state.*changes?/is,
  "material state changes must invalidate evidence");
assert.match(skill, /L1|L2/);
assert.match(skill, /must not.*(?:all checks|whole change|repository-wide)|cannot.*(?:all checks|whole change|repository-wide)/is,
  "scoped evidence must not support whole-change claims");
assert.match(skill, /Do not run L3.*(?:L1|L2)|(?:L1|L2).*Do not run L3/is,
  "a scoped claim must not force repository-wide validation");
assert.match(skill, /agent.*report/i);
assert.ok(wordCount(skill) <= 668, "verification skill must not exceed its baseline word count");

console.log("verification-before-completion execution contract checks passed");
