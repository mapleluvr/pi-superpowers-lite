import assert from "node:assert/strict";
import { readRepoFile, readSection, wordCount } from "../helpers/skill-contract.mjs";

const skill = readRepoFile("skills/using-git-worktrees/SKILL.md");
const setup = readSection(skill, "Step 2: Project Setup");
const baseline = readSection(skill, "Step 3: Record Selective Baseline");

assert.ok(setup, "skill must define Step 2: Project Setup");
assert.match(setup, /current frontier|frontier-declared/i, "setup must come from the current frontier");
assert.doesNotMatch(setup, /plan-declared|approved plan/i, "setup must not depend on a static plan");
assert.match(setup, /dependency-only/i, "setup must be classified as dependency-only");
assert.match(setup, /lifecycle (?:hooks|scripts).*(?:disabled|suppressed)|(?:disabled|suppressed).*lifecycle (?:hooks|scripts)/is,
  "dependency setup must suppress lifecycle execution");
assert.match(setup, /(?:build|test).*(?:L1|L2|L3)|(?:L1|L2|L3).*(?:build|test)/is,
  "build/test work must use an explicit verification tier");
assert.doesNotMatch(setup, /auto-detect and run/i, "setup must not auto-run from marker files");
assert.doesNotMatch(setup, /cargo build|npm install(?![^\n]*--ignore-scripts)/i,
  "setup must not prescribe build-capable defaults");

assert.ok(baseline, "skill must define Step 3: Record Selective Baseline");
assert.match(baseline, /frozen base SHA/i);
assert.match(baseline, /CI status/i);
assert.match(baseline, /unknown/i, "missing CI must remain unknown");
assert.match(baseline, /(?:current )?frontier.{0,100}(?:declared )?L0-L2|L0.*L2/is,
  "baseline must run only current-frontier selective tiers");
assert.doesNotMatch(baseline, /plan-declared|approved plan/i,
  "selective baseline must not depend on a static plan");
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
