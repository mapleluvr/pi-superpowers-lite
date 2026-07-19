import assert from "node:assert/strict";
import { readRepoFile, readSection, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/using-git-worktrees/SKILL.md");
const baseline = readSection(skill, "Step 3: Record Selective Baseline");

assert.ok(baseline, "skill must define Step 3: Record Selective Baseline");
assert.match(baseline, /frozen base SHA/i);
assert.match(baseline, /CI status/i);
assert.match(baseline, /unknown/i, "missing CI must remain unknown");
assert.match(baseline, /declared L0-L2|L0.*L2/is,
  "baseline must run only plan-declared selective tiers");
assert.match(baseline, /selective baseline/i);
assert.match(baseline, /not.*globally clean|never.*globally clean/is,
  "selective evidence must not claim global cleanliness");
assert.doesNotMatch(baseline, /npm test|cargo test|pytest|go test \.\/\.\.\.|go test \.\/\.\.\./i,
  "baseline must not prescribe generic repository-wide suites");
assert.match(baseline, /redesign.*(?:unit|boundary)|focused harness|defer.*final integration/is,
  "missing focused evidence must redesign, add a harness, or defer");
assert.match(skill, /final L3.*fails?.*specific failure.*frozen base|specific failure.*frozen base.*final L3/is,
  "later L3 attribution must reproduce only the specific failure on the base");
assert.match(skill, /isolated worktree/i);

for (const preserved of [
  /Detect Existing Isolation/,
  /Native Worktree Tools \(preferred\)/,
  /git check-ignore/,
  /ask for consent/i,
]) {
  assert.match(skill, preserved, `worktree safety must retain ${preserved}`);
}
assert.ok(wordCount(skill) <= 1154, "using-git-worktrees must not exceed its baseline word count");

console.log("using-git-worktrees execution contract checks passed");
