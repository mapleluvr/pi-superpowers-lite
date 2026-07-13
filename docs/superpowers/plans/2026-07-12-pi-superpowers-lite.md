# Pi Superpowers Lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and validate a standalone Pi-native Superpowers package that keeps all fourteen skill names, routes work through Micro/Standard/Full, and replaces the official package plus support package in Pi.

**Architecture:** Start from the pinned `obra/superpowers` v6.1.1 skill snapshot and keep one runtime skill tree. Add one Pi extension that combines the official bootstrap lifecycle with the support package's native Skill/TodoWrite tools. Modify only the seven skills named in the approved design; all other skills and references remain upstream-compatible. Structural tests, extension tests, contract tests, and fresh-context route evaluations gate migration.

**Tech Stack:** TypeScript executed by Pi, Node.js ESM test scripts, TypeBox, `@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui`, SHA-256 manifest checks, Pi CLI for migration smoke tests.

## Global Constraints

- The package path is `D:/Projects/PiAgent/plugins/pi-superpowers-lite`.
- The package name is `@mapleluvr/pi-superpowers-lite` and initial version is `0.1.0`.
- The upstream baseline is `obra/superpowers` `v6.1.1` at commit `d884ae0`.
- Exactly fourteen upstream skill names must remain available.
- The final active package set is `pi-superpowers-lite` plus `pi-subagents`.
- The official Superpowers checkout and `pi-superpowers-support` remain intact for rollback.
- Do not create a second Full skill tree or generate skills at install time.
- Do not add a runtime heuristic route classifier or a persistent mode setting.
- Micro allows only no-new-behavior mechanical changes.
- Standard records Intent, Constraints, Acceptance, and Risk in conversation and does not create a persisted plan, worktree, or subagent by default.
- Full preserves brainstorming, written spec, intent-level plan, isolated execution, proportional review, final whole-change review, and branch finish.
- `verification-before-completion` remains mandatory in every route.
- No active Pi settings change occurs before the final migration task.
- All shell commands run from `D:/Projects/PiAgent/plugins` in Git Bash unless an absolute path is shown; Node 24 is the required local runtime.

---

### Task 1: Create the pinned Pi package foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `README.md`
- Create: `LICENSE`
- Create: `UPSTREAM.md`
- Create: `upstream-manifest.json`
- Create: `skills/` by copying the pinned upstream skill tree
- Create: `.pi/extensions/` directory
- Create: `.gitignore`
- Create: `package-lock.json` by running `npm install`

**Interfaces:**
- Consumes: `C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers` at `d884ae0`.
- Produces: a standalone package with the fourteen expected skill directories and no active extension yet.

- [ ] **Step 1: Confirm the upstream checkout and create the package files**

Run:

```bash
git -C "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers" rev-parse HEAD
test "$(git -C "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers" rev-parse HEAD)" = "d884ae04edebef577e82ff7c4e143debd0bbec99"
```

The second command must pass. If it fails, stop and check out the exact pinned commit before copying:

```bash
git -C "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers" checkout --detach d884ae04edebef577e82ff7c4e143debd0bbec99
```

Do not change the recorded baseline to accommodate another commit without an explicit design revision.

Create the package metadata with this `package.json` contract:

```json
{
  "name": "@mapleluvr/pi-superpowers-lite",
  "version": "0.1.0",
  "description": "A Pi-native, risk-proportional Superpowers skillset",
  "author": "mapleluvr",
  "license": "MIT",
  "type": "module",
  "main": ".pi/extensions/superpowers.ts",
  "files": [".pi", "skills", "scripts", "tests", "evals", "README.md", "LICENSE", "UPSTREAM.md", "upstream-manifest.json", "package.json"],
  "pi": {
    "extensions": ["./.pi/extensions/superpowers.ts"],
    "skills": ["./skills"]
  },
  "peerDependencies": {
    "@earendil-works/pi-ai": "*",
    "@earendil-works/pi-coding-agent": "*",
    "@earendil-works/pi-tui": "*",
    "typebox": "*"
  },
  "devDependencies": {
    "@earendil-works/pi-ai": "^0.79.8",
    "@earendil-works/pi-coding-agent": "^0.79.8",
    "@earendil-works/pi-tui": "^0.79.8",
    "@types/node": "^24.0.0",
    "typebox": "^1.1.24",
    "typescript": "^6.0.3"
  },
  "scripts": {
    "test": "node tests/structure.test.mjs && node tests/extension.test.mjs && node tests/skill-contracts.test.mjs",
    "typecheck": "tsc --noEmit",
    "upstream:init": "node scripts/upstream-sync.mjs init",
    "upstream:check": "node scripts/upstream-sync.mjs check",
    "upstream:sync": "node scripts/upstream-sync.mjs sync"
  }
}
```

Copy TypeScript peer/dev dependencies from the verified support package, using
Pi 0.79-compatible ranges for the initial package. Do not add a runtime
Superpowers dependency.

- [ ] **Step 2: Copy only the Pi-relevant upstream assets**

Run:

```bash
cp -R "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers/skills" "pi-superpowers-lite/skills"
cp "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers/LICENSE" "pi-superpowers-lite/LICENSE"
```

Do not copy upstream `.claude-plugin`, `.codex`, `.opencode`, or other
harness-specific manifests. Keep every file under `skills/`, including
references, prompt templates, and scripts used by the fourteen skills.

- [ ] **Step 3: Record upstream provenance and initialize ignore rules**

`UPSTREAM.md` must identify:

```text
Repository: https://github.com/obra/superpowers
Tag: v6.1.1
Commit: d884ae04edebef577e82ff7c4e143debd0bbec99
Snapshot source: local Pi checkout used during foundation task
Synchronization: scripts/upstream-sync.mjs with an explicit local checkout
```

The initial `upstream-manifest.json` must have this shape:

```json
{
  "repository": "https://github.com/obra/superpowers",
  "tag": "v6.1.1",
  "commit": "d884ae04edebef577e82ff7c4e143debd0bbec99",
  "files": []
}
```

Use `.gitignore` entries for `node_modules/`, `.superpowers/`, and generated
evaluation results while keeping the directory marker:

```text
node_modules/
.superpowers/
evals/results/*
!evals/results/.gitkeep
```

Do not ignore source, tests, fixtures, or reports intended for review.

- [ ] **Step 4: Verify the foundation before moving on**

Run:

```bash
find "pi-superpowers-lite/skills" -mindepth 2 -maxdepth 2 -name SKILL.md | sort | wc -l
find "pi-superpowers-lite/skills" -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

Expected: exactly 14 `SKILL.md` files and the exact names listed in the design
spec. This task may use bulk copying without a TDD cycle because the copied
upstream assets are a pinned, mechanically reproduced input.

- [ ] **Step 5: Initialize the package repository and install dependencies**

```bash
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" rev-parse --show-toplevel 2>/dev/null || git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" init -b main
npm --prefix "D:/Projects/PiAgent/plugins/pi-superpowers-lite" install
```

The repository-root command must print the new package path, and `npm install`
must create a lockfile using Node 24 without adding a runtime Superpowers
dependency.

- [ ] **Step 6: Commit the foundation**

```bash
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" add .gitignore package.json package-lock.json tsconfig.json README.md LICENSE UPSTREAM.md upstream-manifest.json skills
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" commit -m "chore: scaffold Pi Superpowers Lite package"
```

---

### Task 2: Add structural parity and upstream sync checks

**Files:**
- Create: `scripts/upstream-sync.mjs`
- Create: `tests/structure.test.mjs`
- Create: `tests/upstream-sync.test.mjs`
- Modify: `upstream-manifest.json`
- Modify: `package.json` only if dependency-free script commands need correction

**Interfaces:**
- Consumes: the copied `skills/` tree and `upstream-manifest.json`.
- Produces: `npm run upstream:check` and structural tests that fail on unregistered drift.

- [ ] **Step 1: Write the failing structural and sync tests**

`tests/structure.test.mjs` must assert the exact expected set:

```js
const EXPECTED_SKILLS = [
  "brainstorming",
  "dispatching-parallel-agents",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-git-worktrees",
  "using-superpowers",
  "verification-before-completion",
  "writing-plans",
  "writing-skills",
];
```

The test must fail while `upstream-manifest.json.files` is empty and must cover:

- directory names and frontmatter names;
- unique names;
- all referenced relative files exist;
- exactly one extension and one skill path in `package.json`;
- every imported file is represented in the manifest;
- all unchanged file hashes match the upstream baseline hash;
- modified files have status `lite-modified` or `pi-adapted`.

Run:

```bash
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/tests/structure.test.mjs"
```

Expected: FAIL because the manifest has no file entries yet.

`tests/upstream-sync.test.mjs` must create temporary source/package trees and
exercise the exported `runSync({ mode, sourceDir, packageDir, expectedCommit })`
function. It must fail until the script supports initialization, unchanged-file
copying, and refusal to overwrite a modified file after upstream drift.

- [ ] **Step 2: Implement manifest initialization and comparison**

Implement `scripts/upstream-sync.mjs` with three commands:

```text
node scripts/upstream-sync.mjs init --source "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers"
node scripts/upstream-sync.mjs check --source "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers"
node scripts/upstream-sync.mjs sync --source "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers"
```

Export `runSync({ mode, sourceDir, packageDir, expectedCommit })` for the
Node test. The `init` mode must first verify the source Git HEAD equals
`d884ae04edebef577e82ff7c4e143debd0bbec99`, then register every existing
copied file as `unchanged` only when local and source hashes match. Later
`check` and `sync` commands must reject another source commit. `sync` may copy
only entries already marked `unchanged`; it must never overwrite a
`lite-modified` or `pi-adapted` file after upstream drift.

Use Node `crypto.createHash("sha256")` and `fs` APIs only. The script must:

1. Accept an explicit `--source` checkout path.
2. Refuse to use the network.
3. Enumerate imported files under `skills/` in stable lexical order.
4. Compare each local file against the same relative path under the explicit source checkout.
5. For `init`, verify the exact pinned commit and seed all matching copied files as `unchanged`.
6. For `check`, print additions, deletions, modified files, and manifest status mismatches, then exit non-zero on unexpected drift.
7. For `sync`, copy only files currently marked `unchanged`; refuse to overwrite `lite-modified` or `pi-adapted` files whose upstream hash changed.
8. Update upstream hash fields only after a successful check of the requested source.
9. Never delete a local Lite file silently.

- [ ] **Step 3: Generate the initial manifest from v6.1.1**

Run:

```bash
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/scripts/upstream-sync.mjs" init --source "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers"
```

Before any Lite edits, every imported file must be marked `unchanged` and its
local and upstream hashes must match. Run the structural and sync tests again
and expect PASS.

- [ ] **Step 4: Verify deterministic failure for unregistered drift**

Temporarily change one copied reference file in a disposable copy of the
package, run `upstream:check`, and confirm it exits non-zero. Restore the
working tree from Git before continuing. The committed package must have a
clean structural check.

- [ ] **Step 5: Commit parity tooling**

```bash
git -C "pi-superpowers-lite" add scripts/upstream-sync.mjs tests/structure.test.mjs tests/upstream-sync.test.mjs upstream-manifest.json
git -C "pi-superpowers-lite" commit -m "test: add upstream parity checks"
```

---

### Task 3: Add and test the combined Pi extension

**Files:**
- Create: `.pi/extensions/superpowers.ts`
- Create: `tests/extension.test.mjs`
- Modify: `upstream-manifest.json` for the Pi-adapted extension entry

**Interfaces:**
- Consumes: Pi `ExtensionAPI`, native `systemPromptOptions.skills`, and local `skills/using-superpowers/SKILL.md`.
- Produces: one bootstrap lifecycle, native `Skill`, and `TodoWrite` tools.

- [ ] **Step 1: Write failing extension contract tests**

Build a fake `ExtensionAPI` harness that captures `registerTool`, `registerCommand`,
and `on`. The first tests must assert:

```js
assert.equal(packageMetadata.pi.extensions.length, 1);
assert.equal(packageMetadata.pi.skills.length, 1);
assert.equal(bootstrapMarker, "superpowers:using-superpowers bootstrap for pi");
```

The fake lifecycle must verify these behaviors:

- `context` inserts one bootstrap message before non-compaction messages;
- a second `context` event sees the marker and inserts nothing;
- `session_compact` re-enables insertion;
- `agent_end` disables normal reinsertion;
- `before_agent_start` captures only the supplied `Skill[]`;
- `Skill` loads an exposed file and rejects a disk-only file;
- an exposed but unreadable skill returns an error containing its path;
- an unreadable bootstrap emits a readable error and injects no stale content;
- an exposed `using-superpowers` path outside the package root produces one warning;
- `session_start` clears TodoWrite state;
- the Pi mapping is at most 150 words.

Run:

```bash
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/tests/extension.test.mjs"
```

Expected: FAIL because `.pi/extensions/superpowers.ts` does not exist.

- [ ] **Step 2: Implement the bootstrap controller**

Port the official Pi lifecycle from upstream v6.1.1, retaining the exact marker
`superpowers:using-superpowers bootstrap for pi`. The implementation must read
its own skill file, strip frontmatter, append a compact Pi mapping, and use the
same `messageContainsBootstrap` and first-non-compaction insertion behavior.

Export the pure `piToolMapping()` and `buildBootstrapContent(skillBody)` helpers
for the Node contract test. The Pi mapping must say, in at most 150 words:

```text
Use Skill({ skill: "name" }) for an installed skill.
Use lowercase Pi tools for file and shell work.
Use subagent from pi-subagents when available.
Do not invent Task calls when no subagent tool exists.
Use TodoWrite when an installed todo tool is available.
```

If the bootstrap file cannot be read, cache a failure for the current session,
log the path, and notify through `ctx.ui` when available. Do not inject stale
content.

- [ ] **Step 3: Implement native skill capture and Skill tool**

Use this interface in the extension:

```ts
interface PiSkillDefinition {
  name: string;
  description?: string;
  filePath: string;
}
```

Capture `event.systemPromptOptions.skills` on `before_agent_start` into a map
where the first unexpected duplicate wins. `Skill.execute` must use only that
map, return the complete selected body without frontmatter, and report available
names or the unreadable path on failure. Do not import `node:os`, directory
scanners, settings parsers, or `node:path` discovery helpers.

- [ ] **Step 4: Integrate TodoWrite and conflict warning**

Copy the tested support behavior from commit `7938cea` without the old
bootstrap injection or filesystem discovery. Register `TodoWrite`, `/todos`,
and `/todo-clear`. On `before_agent_start`, compare the resolved
`using-superpowers.filePath` with the package root and issue at most one warning
per session when it resolves elsewhere.

- [ ] **Step 5: Run the extension tests and typecheck**

```bash
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/tests/extension.test.mjs"
npm --prefix "D:/Projects/PiAgent/plugins/pi-superpowers-lite" run typecheck
```

Expected: both pass with no diagnostics.

- [ ] **Step 6: Commit the extension**

```bash
git -C "pi-superpowers-lite" add .pi/extensions/superpowers.ts tests/extension.test.mjs upstream-manifest.json
git -C "pi-superpowers-lite" commit -m "feat: add Pi bootstrap and compatibility tools"
```

---

### Task 4: Implement the route router and Micro/Standard/Full policy

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`
- Modify: `skills/brainstorming/SKILL.md`
- Create: `tests/skill-contracts.test.mjs`
- Create: `evals/routing-cases.json`
- Modify: `upstream-manifest.json`

**Interfaces:**
- Consumes: Pi bootstrap and native skill names from Task 3.
- Produces: the route policy that all later modified skills reference.

- [ ] **Step 1: Write failing contract tests and route fixtures**

`tests/skill-contracts.test.mjs` must assert that `using-superpowers` contains
these exact policy anchors:

```text
Route: Micro
Route: Standard
Route: Full
Intent:
Constraints:
Acceptance:
Risk:
```

It must also assert that the Micro section contains `no new behavior`, the Full
section contains each trigger family (`public API`, `schema`, `security`,
`concurrency`, `irreversible`, `subagent`), and the router contains both
`upgrade` and `verification`. Strip frontmatter and assert the body is at most
500 words. Import `buildBootstrapContent` from the extension and assert the
complete injected text is at most 650 words.

`evals/routing-cases.json` must contain at least these cases with expected route
and forbidden artifacts:

```json
[
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
  { "id": "risk-escalation", "prompt": "Begin a local fix, then reveal it changes authorization checks.", "initialExpected": "Standard", "expected": "Full", "requiresEscalation": true, "required": ["review"] }
]
```

Run the contract test before editing and expect FAIL.

- [ ] **Step 2: Rewrite `using-superpowers` as a compact route router**

Keep the frontmatter name `using-superpowers`. Replace the universal one-percent
invocation rule with these ordered actions:

```text
1. Decide whether the message is informational or substantive work.
2. If substantive, classify Micro, Standard, or Full using risk conditions.
3. State the route and one reason.
4. Load only skills needed by that route.
5. Reclassify upward if new risk appears; never silently downgrade.
6. Run verification before claiming completion.
```

The body must include the exact Micro M1 conditions, the Standard four-field
conversation contract, the Full trigger list, explicit user override, and
per-task route scope. Keep the text within the 500-word bootstrap budget after
frontmatter.

- [ ] **Step 3: Narrow the brainstorming trigger without weakening Full**

Change the frontmatter description so it triggers for Full or substantive
design decisions rather than every creative action. Add a short opening rule:

```text
Use this skill for Full-route work, unresolved product or architecture
choices, or an explicit brainstorming request. When invoked, its Full design
and approval gates remain mandatory.
```

Do not remove the existing Full brainstorming process.

- [ ] **Step 4: Run the route contract tests**

```bash
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/tests/skill-contracts.test.mjs"
```

Expected: PASS for router and brainstorming contracts.

- [ ] **Step 5: Commit the route policy**

```bash
git -C "pi-superpowers-lite" add skills/using-superpowers/SKILL.md skills/brainstorming/SKILL.md tests/skill-contracts.test.mjs evals/routing-cases.json upstream-manifest.json
git -C "pi-superpowers-lite" commit -m "feat: add proportional work routing"
```

---

### Task 5: Make planning, debugging, TDD, and review proportional

**Files:**
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `tests/skill-contracts.test.mjs`
- Modify: `upstream-manifest.json`

**Interfaces:**
- Consumes: route contract from Task 4.
- Produces: route-aware process skills with the same names and Full-capable interfaces.

- [ ] **Step 1: Add failing contract assertions for each modified skill**

Extend `tests/skill-contracts.test.mjs` with these assertions:

```js
assert.match(writingPlans, /intent|constraints|interfaces|acceptance/i);
assert.match(writingPlans, /pseudocode|fragile|non-obvious/i);
assert.match(systematicDebugging, /short|deterministic|obvious/i);
assert.match(tdd, /documentation|rename|static configuration/i);
assert.match(requestingReview, /Micro|Standard|Full/i);
assert.match(sdd, /final.*review/i);
assert.match(sdd, /task-level.*risk|risk.*task-level/i);
```

The assertions must fail against the unmodified upstream texts where the new
policy is absent.

- [ ] **Step 2: Rewrite `writing-plans` around intent-level plans**

Preserve Full plan artifacts, self-review, exact paths, tests, and acceptance.
Replace the default plan step format with:

```text
Purpose and observable outcome
Files/modules and ownership boundary
Interfaces and cross-task dependencies
Constraints and invariants
Acceptance evidence
Risk and rollback
Pseudocode only for fragile or non-obvious logic
```

State explicitly that ordinary tasks do not copy full function bodies, complete
test files, or repeated TDD narration. A Full plan still contains enough
implementation detail for a capable executor and still writes a durable plan.

- [ ] **Step 3: Add proportional debugging and TDD exceptions**

In `systematic-debugging`, retain the Iron Law and root-cause requirement but
add a deterministic short path for obvious reproducible failures. Deep
instrumentation, multiple hypotheses, and cross-component boundary logging
remain required for uncertain or intermittent cases.

In `test-driven-development`, retain RED-GREEN-REFACTOR for behavior changes,
regressions, and shared contracts. Add a bounded exception for documentation,
formatting, pure renames, generated artifacts, and static configuration with no
executable semantics; require direct artifact validation for those exceptions.

- [ ] **Step 4: Flatten review fan-out**

In `requesting-code-review`, define Micro as no independent review, Standard as
risk-gated, and Full as mandatory final whole-change review. Require every
re-review request to state the new diff, remaining risk, and new evidence.

In `subagent-driven-development`, retain per-task implementer tests and
self-review. Change task reviewer dispatch to a high-risk predicate covering
public/shared contracts, security, migrations, concurrency, or high blast
radius. Retain one final whole-branch review and one consolidated fix wave.

- [ ] **Step 5: Run contract tests and inspect modified skill hashes**

```bash
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/tests/skill-contracts.test.mjs"
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/scripts/upstream-sync.mjs" check --source "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers"
```

Expected: contract tests pass; sync check reports exactly the seven planned
`lite-modified` files and no unregistered drift.

- [ ] **Step 6: Commit the proportional process skills**

```bash
git -C "pi-superpowers-lite" add skills/writing-plans/SKILL.md skills/systematic-debugging/SKILL.md skills/test-driven-development/SKILL.md skills/requesting-code-review/SKILL.md skills/subagent-driven-development/SKILL.md tests/skill-contracts.test.mjs upstream-manifest.json
git -C "pi-superpowers-lite" commit -m "feat: make process skills route-aware"
```

---

### Task 6: Adapt Pi references and preserve the seven unchanged skills

**Files:**
- Modify: `skills/using-superpowers/references/pi-tools.md`
- Modify: any imported reference whose links or commands point to excluded harnesses
- Create: `tests/pi-reference-contract.test.mjs`
- Modify: `package.json`
- Modify: `upstream-manifest.json`

**Interfaces:**
- Consumes: all copied upstream references and the native `Skill`, `TodoWrite`, and `subagent` tools.
- Produces: a Pi-only reference graph without unsupported Task/Agent calls or broken relative links.

- [ ] **Step 1: Write failing Pi reference checks**

The test must reject unsupported runtime instructions outside an explicit
historical/example allowlist:

```js
const forbiddenRuntimePatterns = [
  /\bTask\s*\(/,
  /registerTaskTool/,
  /Claude Code's `Skill` tool/,
];
```

It must also resolve every relative markdown link and verify that the Pi mapping
mentions lowercase file tools, native `Skill`, optional `subagent`, and the
absence of fabricated Task calls.

- [ ] **Step 2: Update only Pi-facing references**

Use `skills/using-superpowers/references/pi-tools.md` as the canonical mapping.
Replace active instructions that require a non-Pi Task/Agent/Skill wrapper with
Pi equivalents. Preserve historical examples when they are clearly labeled as
examples and do not instruct runtime behavior.

Do not rewrite the seven unchanged process skills merely to reduce wording.
Only fix references required for Pi correctness or valid local links.

Update `package.json` so the aggregate command is:

```json
"test": "node tests/structure.test.mjs && node tests/upstream-sync.test.mjs && node tests/extension.test.mjs && node tests/skill-contracts.test.mjs && node tests/pi-reference-contract.test.mjs"
```

- [ ] **Step 3: Verify reference and parity behavior**

```bash
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/tests/pi-reference-contract.test.mjs"
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/tests/structure.test.mjs"
```

Expected: both pass and the manifest lists all Pi-adapted files explicitly.

- [ ] **Step 4: Commit Pi reference adaptation**

```bash
git -C "pi-superpowers-lite" add skills tests/pi-reference-contract.test.mjs package.json upstream-manifest.json
git -C "pi-superpowers-lite" commit -m "fix: align skill references with Pi tools"
```

---

### Task 7: Add behavioral evaluation fixtures and run oracle/reviewer approval

**Files:**
- Modify: `evals/routing-cases.json`
- Create: `evals/README.md`
- Create: `evals/results/.gitkeep`
- Create: `scripts/validate-eval-report.mjs`
- Create: `tests/validate-eval-report.test.mjs`
- Create: `evals/results/2026-07-12-initial.json` as ignored local output
- Modify: `package.json`

**Interfaces:**
- Consumes: the completed Lite skill tree and route fixtures.
- Produces: a reviewable baseline-vs-Lite evaluation report before migration.

- [ ] **Step 1: Define the evaluation protocol**

`evals/README.md` must state that every case runs in a fresh context, first
against upstream v6.1.1 and then against Lite, with the same model and sampling
settings. Results use exactly one record for every `(caseId, target)` pair,
where target is `upstream` or `lite`:

```json
{
  "caseId": "authentication",
  "target": "lite",
  "expectedRoute": "Full",
  "observedRoute": "Full",
  "skillCalls": ["using-superpowers", "brainstorming"],
  "artifacts": ["spec", "plan"],
  "subagentCalls": 0,
  "reviewCalls": 1,
  "escalatedToFull": false,
  "pass": true
}
```

- [ ] **Step 2: Write failing report-validator tests**

`tests/validate-eval-report.test.mjs` must import
`validateReport({ fixtures, results })`. Use in-memory fixtures to verify that
validation fails for a missing target, a duplicate `(caseId, target)` pair, a
safety case routed below Full, a Micro artifact violation, a Standard subagent
without escalation, and a risk-escalation case without `escalatedToFull: true`.
It must pass for one complete upstream/Lite result pair per fixture.

Run before implementing the validator and expect FAIL because the export does
not exist.

- [ ] **Step 3: Add report validation**

`scripts/validate-eval-report.mjs` must export
`validateReport({ fixtures, results })`, provide a CLI for the committed fixture
file and a result path, and require exactly one result per `(caseId, target)`
pair. It must enforce:

- public API, schema migration, security, authentication, authorization,
  privacy, concurrency, and distributed-state Lite cases observe Full;
- Micro Lite cases have no spec, plan, worktree, subagent, or independent review;
- Standard Lite cases have no subagent unless `escalatedToFull` is true;
- the `risk-escalation` Lite case observes Full and has
  `escalatedToFull: true`.

Update the aggregate package test command to append
`node tests/validate-eval-report.test.mjs`.

- [ ] **Step 4: Run fresh-context evaluations**

Use the delegated `oracle` and `reviewer` agents for independent runs. Run one
fresh sample per fixture for both upstream and Lite, save the report under
`evals/results/`, and run:

```bash
node "D:/Projects/PiAgent/plugins/pi-superpowers-lite/scripts/validate-eval-report.mjs" "evals/results/2026-07-12-initial.json"
```

All safety-critical cases must pass before migration. Any disagreement is
resolved by the parent session using the route contract, not by silently
loosening the expected result.

- [ ] **Step 5: Commit evaluation infrastructure and record approval evidence**

Store the ignored report path and oracle/reviewer verdict in the final review
artifact. Do not commit model transcripts or secrets. Commit the validator,
fixtures, tests, protocol, and directory marker:

```bash
git -C "pi-superpowers-lite" add evals/routing-cases.json evals/README.md evals/results/.gitkeep scripts/validate-eval-report.mjs tests/validate-eval-report.test.mjs package.json
git -C "pi-superpowers-lite" commit -m "test: add route behavior evaluation"
```

---

### Task 8: Complete package documentation and full offline verification

**Files:**
- Modify: `README.md`
- Modify: `UPSTREAM.md`
- Modify: `package.json` scripts/dependencies if verification exposes a concrete defect

**Interfaces:**
- Consumes: all implementation tasks and evaluation report.
- Produces: an installable, documented, locally verified package before settings migration.

- [ ] **Step 1: Document installation and route behavior**

README must state:

```text
Install this package instead of obra/superpowers and pi-superpowers-support.
Keep pi-subagents as an optional companion for Full workflows.
Micro is mechanical/no-new-behavior only.
Standard is inline with proportional tests and verification.
Full is risk-triggered and preserves the complete workflow.
```

Document rollback by restoring the two previous settings entries.

- [ ] **Step 2: Run the complete offline suite**

```bash
npm --prefix "D:/Projects/PiAgent/plugins/pi-superpowers-lite" test
npm --prefix "D:/Projects/PiAgent/plugins/pi-superpowers-lite" run typecheck
npm --prefix "D:/Projects/PiAgent/plugins/pi-superpowers-lite" run upstream:check -- --source "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers"
git -C "pi-superpowers-lite" diff --check
git -C "pi-superpowers-lite" status --short
```

Expected: all tests and typecheck pass; upstream check reports only the seven
approved Lite modifications and Pi-adapted files; no unrelated working-tree
changes exist.

- [ ] **Step 3: Commit package documentation**

```bash
git -C "pi-superpowers-lite" add README.md UPSTREAM.md package.json
git -C "pi-superpowers-lite" commit -m "docs: document Pi Superpowers Lite"
```

---

### Task 9: Final delegated review before migration

**Files:**
- Read-only: the complete `pi-superpowers-lite` repository and approved design spec.
- Create: review artifact under the session's delegated-review output directory.

**Interfaces:**
- Consumes: all commits, tests, parity output, and the baseline-vs-Lite evaluation report.
- Produces: oracle/reviewer approval required before active settings change.

- [ ] **Step 1: Create a complete review package from Git's empty tree**

Run from Git Bash:

```bash
EMPTY_TREE=$(printf '' | git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" hash-object -t tree --stdin)
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" diff --stat "$EMPTY_TREE" HEAD
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" diff "$EMPTY_TREE" HEAD
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" log --oneline --decorate --all
```

The empty-tree comparison includes the root spec commit and every later file.
Include the design spec, implementation plan, full diff, test output, parity
output, and evaluation report path in the delegated reviewer brief.

- [ ] **Step 2: Delegate independent review**

Ask `oracle` to review design/spec compliance and route safety. Ask `reviewer`
to review code quality, package/runtime correctness, and migration safety. The
parent session adjudicates findings by severity:

- Critical or Important findings block migration and require one consolidated
  fix task followed by re-review.
- Minor findings are recorded for later and do not silently change the scope.
- A reviewer cannot waive a design constraint without an explicit updated
  spec decision.

- [ ] **Step 3: Fix and re-review before migration**

Apply one consolidated fix wave for blocking findings, rerun Task 8's complete
offline suite and the evaluation validator, commit verified fixes, and send the
new diff/evidence back to the reviewer that raised each blocking finding.
Do not change active Pi settings until both delegated verdicts approve.

- [ ] **Step 4: Record the pre-migration approval**

```bash
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" status --short
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" diff --check
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" log --oneline --decorate -8
```

Record final oracle/reviewer verdicts, the approved commit, and all verification
commands in the review artifact.

---

### Task 10: Install locally, migrate active Pi settings, and report

**Files:**
- Modify: `C:/Users/mapleland/.pi/agent/settings.json`
- No repository source changes unless migration reveals a tested defect.

**Interfaces:**
- Consumes: the package and commit approved in Task 9.
- Produces: active Pi configuration with exactly one Superpowers package and a final release report.

- [ ] **Step 1: Save the current package entries**

Record these existing values before editing:

```text
https://github.com/obra/superpowers
D:\Projects\PiAgent\plugins\superpowers-support-work\gadgj-pi-superpowers-support
```

- [ ] **Step 2: Replace only the two superseded entries**

Change them to one entry:

```json
"D:\\Projects\\PiAgent\\plugins\\pi-superpowers-lite"
```

Leave the `pi-subagents` entry, package order relative to unrelated packages,
and all non-package settings unchanged.

- [ ] **Step 3: Verify settings and package discovery**

```bash
node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('C:/Users/mapleland/.pi/agent/settings.json','utf8')); const p=s.packages||[]; if (p.includes('https://github.com/obra/superpowers')) throw new Error('official package remains'); if (p.some(x=>typeof x==='string'&&x.includes('pi-superpowers-support'))) throw new Error('support package remains'); if (!p.some(x=>typeof x==='string'&&x.endsWith('pi-superpowers-lite'))) throw new Error('Lite package missing'); console.log('settings migration verified')"
pi list
```

Expected: exactly one Lite package path and the unchanged `pi-subagents` entry.

- [ ] **Step 4: Reload and run the active-session smoke test**

Run `/reload` in the active Pi session. Verify:

1. `Skill({ skill: "using-superpowers" })` loads the Lite file.
2. A second context build does not add another compatible bootstrap marker.
3. `Skill` can load all fourteen names from Pi's native list.
4. One Micro, one Standard, and one Full fixture produces the expected route.
5. A rollback dry-run can restore the two saved package entries without changing
   unrelated settings.

- [ ] **Step 5: Issue the post-migration report**

```bash
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" status --short
git -C "D:/Projects/PiAgent/plugins/pi-superpowers-lite" log --oneline --decorate -8
```

Do not commit the user's settings file. The final report includes the approved
commit, test and parity output, evaluation result, active settings state,
smoke-test result, rollback state, and residual risks.
