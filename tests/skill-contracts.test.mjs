import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTER_ONLY = process.argv.includes("--router-only");

function readSkill(name) {
  return readFileSync(path.join(ROOT, "skills", name, "SKILL.md"), "utf8");
}

function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert.ok(match, "skill must include YAML frontmatter");
  return { frontmatter: match[1], body: match[2].trim() };
}

function wordCount(content) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function section(body, heading) {
  const header = `## ${heading}`;
  const start = body.indexOf(header);
  assert.notEqual(start, -1, `missing ${heading} section`);
  const end = body.indexOf("\n## ", start + header.length);
  return body.slice(start + header.length, end === -1 ? undefined : end);
}

function assertRequiredFixture(routeCases, fixture) {
  const actual = routeCases.find((candidate) => candidate.id === fixture.id);
  assert.deepEqual(actual, fixture, `routing fixture ${fixture.id} must remain stable`);
}

const usingSuperpowers = readSkill("using-superpowers");
const { body: routerBody } = splitFrontmatter(usingSuperpowers);

for (const anchor of [
  "Route: Micro",
  "Route: Standard",
  "Route: Full",
  "Intent:",
  "Constraints:",
  "Acceptance:",
  "Risk:",
]) {
  assert.ok(routerBody.includes(anchor), `router must contain ${anchor}`);
}

const micro = section(routerBody, "Route: Micro");
assert.match(micro, /no new behavior/, "Micro must prohibit new behavior");

const full = section(routerBody, "Route: Full");
for (const trigger of ["public API", "schema", "security", "concurrency", "irreversible", "subagent"]) {
  assert.ok(full.includes(trigger), `Full must retain the ${trigger} trigger`);
}

assert.match(routerBody, /upgrade/i, "the router must require escalation");
assert.match(routerBody, /verification/i, "the router must require verification");
assert.ok(wordCount(routerBody) <= 500, "router body must fit the 500-word bootstrap budget");

const extension = await import(new URL(`../.pi/extensions/superpowers.ts?contract=${Date.now()}`, import.meta.url));
assert.ok(
  wordCount(extension.buildBootstrapContent(usingSuperpowers)) <= 650,
  "complete bootstrap text must fit the 650-word budget",
);

const routeCases = JSON.parse(readFileSync(path.join(ROOT, "evals", "routing-cases.json"), "utf8"));
assert.ok(Array.isArray(routeCases), "routing cases must be an array");
for (const fixture of [
  { "id": "spelling", "prompt": "Correct a misspelled README heading without changing meaning.", "expected": "Micro", "forbidden": ["spec", "plan", "worktree", "subagent", "review"] },
  { "id": "documentation", "prompt": "Clarify an existing API comment without changing code.", "expected": "Micro", "forbidden": ["spec", "plan", "worktree", "subagent", "review"] },
  { "id": "pure-rename", "prompt": "Rename a private local variable with no behavior change.", "expected": "Micro", "forbidden": ["spec", "plan", "worktree", "subagent", "review"] },
  { "id": "local-bug", "prompt": "Fix a reproducible local off-by-one bug with a regression test.", "expected": "Standard", "forbidden": ["spec", "plan", "worktree", "subagent"] },
  { "id": "local-feature", "prompt": "Add a clear local behavior behind an existing private interface.", "expected": "Standard", "forbidden": ["spec", "plan", "worktree", "subagent"] },
  { "id": "public-api", "prompt": "Change the return type of a public API used across modules.", "expected": "Full", "required": ["review"] },
  { "id": "schema-migration", "prompt": "Add a persisted field and migrate existing records.", "expected": "Full", "required": ["review"] },
  { "id": "security", "prompt": "Change encryption or secret-handling behavior.", "expected": "Full", "required": ["review"] },
  { "id": "authentication", "prompt": "Change login token validation behavior.", "expected": "Full", "required": ["review"] },
  { "id": "authorization", "prompt": "Change which roles may delete a project.", "expected": "Full", "required": ["review"] },
  { "id": "privacy", "prompt": "Start storing a new item of sensitive personal data.", "expected": "Full", "required": ["review"] },
  { "id": "concurrency", "prompt": "Change locking around concurrent writes.", "expected": "Full", "required": ["review"] },
  { "id": "distributed-state", "prompt": "Change retry and ordering behavior across workers.", "expected": "Full", "required": ["review"] },
  { "id": "explicit-full", "prompt": "Use the Full workflow to add a local feature.", "expected": "Full", "required": ["brainstorming", "plan", "review"] },
  { "id": "risk-escalation", "prompt": "Begin a local fix, then reveal it changes authorization checks.", "initialExpected": "Standard", "expected": "Full", "requiresEscalation": true, "required": ["review"] },
]) {
  assertRequiredFixture(routeCases, fixture);
}

if (!ROUTER_ONLY) {
  const brainstorming = splitFrontmatter(readSkill("brainstorming"));
  assert.match(
    brainstorming.frontmatter,
    /^description:.*Full-route work.*substantive design decisions.*explicit brainstorming/m,
    "brainstorming must target Full or substantive design work",
  );
  assert.doesNotMatch(brainstorming.frontmatter, /before any creative work/i);
  assert.match(
    brainstorming.body,
    /Use this skill for Full-route work, unresolved product or architecture\s+choices, or an explicit brainstorming request\. When invoked, its Full design\s+and approval gates remain mandatory\./,
  );
  for (const anchor of [
    "<HARD-GATE>",
    "This applies to EVERY project regardless of perceived simplicity.",
    "## Checklist",
    "Write design doc",
    "User reviews written spec",
    "The terminal state is invoking writing-plans.",
  ]) {
    assert.ok(brainstorming.body.includes(anchor), `brainstorming must retain ${anchor}`);
  }
}

console.log(ROUTER_ONLY ? "router contract checks passed" : "skill contract checks passed");
