import assert from "node:assert/strict";
import { readRepoFile } from "../helpers/skill-contract.mjs";

const manifest = JSON.parse(readRepoFile("upstream-manifest.json"));
const pkg = JSON.parse(readRepoFile("package.json"));
const readme = readRepoFile("README.md");

const expected = new Map([
  ["skills/brainstorming/SKILL.md", "e14914605f640e0841758e45d0ab2a53243b59b921f929e47921c99668f2e61d"],
  ["skills/brainstorming/spec-document-reviewer-prompt.md", "95a0a195de9d984be2fffa95bab16fc8c563bc296a9cfc5e9c29cb3ece0d7457"],
  ["skills/writing-plans/SKILL.md", "272e1af349f5062c28dc282b3e21b220d58d683a7314a10c455b7432ec91d845"],
  ["skills/writing-plans/plan-document-reviewer-prompt.md", "aa728b96aad603c8be28875a4305637f6c984aa81ffcadcb13e743202fa2a0c7"],
  ["skills/subagent-driven-development/SKILL.md", "41ab239a6ad1c487cd839fdac972a8c9cf0f5e90efa59a63f963767864f0df4c"],
  ["skills/subagent-driven-development/implementer-prompt.md", "49018b28dc11bc9f3d13a28959bb10ae1a96eabc5d8f19f4079d901f9ff2bf64"],
  ["skills/subagent-driven-development/task-reviewer-prompt.md", "2eb9d54373420de25bc0bd00635d3a3123a6c0eb30c881168e6f3348e2387331"],
  ["skills/dispatching-parallel-agents/SKILL.md", "f0df13f584049059cc5619f90061405b89dcc6e28ab3f2a8517d27d99c7a46a6"],
  ["skills/executing-plans/SKILL.md", "bbd8d28bb655a52817cc129ce49f9e46fa7c6303f72ed5de95bfe914ef8e0ce8"],
  ["skills/using-git-worktrees/SKILL.md", "e2c3ec142e52868a51af246c620cd76ab648dcf27d6900d47e6ffd07159a9794"],
  ["skills/verification-before-completion/SKILL.md", "ea52d15aabaf72bc6b558efe2c126f161b53961090ddcd712000273bfe8c7b6c"],
  ["skills/finishing-a-development-branch/SKILL.md", "e6d4a812de900d33c6eacfb40747f99427f25c304a7b7099120f9373b115a47f"],
  ["skills/requesting-code-review/code-reviewer.md", "b2f2ec7596925fe52dac158fdfbca19b3a7d779d619c481e6706a6c0001662d3"],
]);

const entries = new Map(manifest.files.map((entry) => [entry.path, entry]));
assert.equal(expected.size, 13);
for (const [path, upstreamHash] of expected) {
  const entry = entries.get(path);
  assert.ok(entry, `manifest must contain ${path}`);
  assert.equal(entry.upstreamHash, upstreamHash, `${path} must preserve its original upstream hash`);
  assert.equal(entry.status, "lite-modified", `${path} must register intentional Lite drift`);
}

assert.ok(pkg.files.includes("evals/execution-cases.json"), "execution fixtures must ship");
assert.ok(pkg.files.includes("evals/execution-evaluator-prompt.md"), "canonical execution evaluator prompt must ship");
assert.ok(pkg.files.includes("tests"), "focused execution contracts must ship");
assert.ok(
  pkg.files.includes("docs/superpowers/specs/2026-07-19-fail-first-wave-execution-design.md"),
  "the incremental design linked by the packaged README must ship",
);
assert.ok(
  pkg.files.includes("docs/superpowers/specs/2026-07-22-review-convergence-design.md"),
  "the review convergence design linked by the packaged README must ship",
);
assert.ok(
  pkg.files.includes("docs/superpowers/specs/2026-07-22-progressive-sdd-workspace-design.md"),
  "the progressive workspace design linked by the packaged README must ship",
);
assert.match(readme, /Durable Authority.*Dynamic Frontier/is);
assert.match(readme, /docs\/superpowers\/work\/<feature>/i);
assert.match(readme, /\.superpowers\/work\/<run-id>/i);
assert.match(readme, /current frontier/i);
assert.match(readme, /net\s+benefit/i);
assert.match(readme, /legacy.*(?:spec|plan).*compatible|compatible.*legacy.*(?:spec|plan)/is);
assert.doesNotMatch(readme, /final-review ledger|fix wave|dependency graph with disjoint write sets/i);
assert.match(readme, /Review Convergence/);
assert.match(readme, /one initial pass and one closure pass/);
assert.match(readme, /acceptance.*protected boundary/i);
const aggregate = "node tests/execution-contracts/run-all.mjs";
assert.equal(pkg.scripts.test.split(aggregate).length - 1, 1,
  "package test must register the execution aggregate exactly once");

assert.match(readme, /docs\/superpowers\/specs\/2026-07-19-fail-first-wave-execution-design\.md/);
assert.match(readme, /at least two independently useful|two or more independently useful/i);
assert.match(readme, /protected contract|contract spine/i);
assert.match(readme, /patch handoff|worktree:\s*true/i);
assert.match(readme, /(?:exact mutable resource identit|mutable resource[\s\S]{0,120}exact identit)/i);
assert.match(readme, /post-apply L1[\s\S]{0,220}reverse[\s\S]{0,220}frontier L2[\s\S]{0,220}(?:without|do not)[\s\S]{0,100}reverse/i);
assert.match(readme, /L0.*L1.*L2.*L3/is);
assert.match(readme, /finalization-only L3|L3.*only.*finalization/is);
assert.match(readme, /task-local checks passed/i);
assert.match(readme, /affected closure passed/i);
assert.match(readme, /repository-wide suite passed/i);

console.log("execution manifest registration checks passed");
