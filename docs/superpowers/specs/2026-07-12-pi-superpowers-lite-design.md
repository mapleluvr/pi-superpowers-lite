# Pi Superpowers Lite Design

**Date:** 2026-07-12
**Status:** Approved for implementation planning
**Package:** `@mapleluvr/pi-superpowers-lite` `0.1.0`
**Upstream baseline:** `obra/superpowers` `v6.1.1` at commit `d884ae0`

## 1. Purpose

Build a standalone, Pi-native Superpowers package that preserves all fourteen
upstream skill names and a complete Full workflow while making proportional
execution the default. The package replaces both the official Superpowers Pi
package and `pi-superpowers-support` in the active Pi configuration.

The Lite package optimizes four areas:

1. Route work by risk instead of applying the complete workflow to every task.
2. Keep plans at the intent, constraint, interface, and acceptance level.
3. Replace per-task review fan-out with risk-gated task review and one final
   whole-change review in Full mode.
4. Load skills through Pi's native resource system and inject one compact
   bootstrap per effective context.

Verification remains mandatory in every route. Root-cause evidence, behavioral
tests, security controls, and data safety are not removed to make the workflow
appear lighter.

## 2. Scope

### 2.1 Included

- A new local Git repository at
  `D:/Projects/PiAgent/plugins/pi-superpowers-lite`.
- A Pi package named `@mapleluvr/pi-superpowers-lite`, initially versioned
  `0.1.0`.
- Exactly these fourteen skill names:
  - `brainstorming`
  - `dispatching-parallel-agents`
  - `executing-plans`
  - `finishing-a-development-branch`
  - `receiving-code-review`
  - `requesting-code-review`
  - `subagent-driven-development`
  - `systematic-debugging`
  - `test-driven-development`
  - `using-git-worktrees`
  - `using-superpowers`
  - `verification-before-completion`
  - `writing-plans`
  - `writing-skills`
- Every markdown reference, prompt template, and script referenced by those
  skills.
- A single Pi extension that owns bootstrap lifecycle, `TodoWrite`, and the
  explicit `Skill` compatibility tool.
- Upstream provenance, parity checks, offline structural tests, extension
  tests, route contracts, and behavioral evaluation fixtures.
- A reversible migration from the official Superpowers package plus the local
  support package to this package.

### 2.2 Excluded

- Claude, Codex, OpenCode, Antigravity, or other harness integrations.
- A runtime heuristic classifier implemented in TypeScript.
- A mode settings UI or persistent global route selection.
- A second copy of the skill tree for Full mode.
- Automatic network fetches or automatic merges from upstream.
- Creation or publication of a GitHub repository in this phase.
- Deletion or archival of the existing `pi-superpowers-support` repository.
- Changes to `pi-subagents`.

## 3. Package Boundary

The installable package has one skill source and one extension source:

```text
pi-superpowers-lite/
  .pi/extensions/superpowers.ts
  skills/
  tests/
  evals/
  scripts/
  docs/superpowers/specs/
  docs/superpowers/plans/
  upstream-manifest.json
  UPSTREAM.md
  package.json
  README.md
  LICENSE
```

`package.json` declares one Pi extension and the `skills/` directory. The
package does not require another Superpowers package. `pi-subagents` remains a
separate optional companion for Full workflows that dispatch subagents.

The extension may delegate to focused internal modules, but Pi sees one
extension entry. The skill files under `skills/` are the runtime source of
truth; no generated or patched copy is required at install time.

The final active package set is:

```text
pi-superpowers-lite
pi-subagents
```

The official `obra/superpowers` package and `pi-superpowers-support` are removed
from Pi settings after Lite validation, not before.

## 4. Route Contract

Routing is an instruction-level decision made by `using-superpowers`. The
extension does not classify user requests. A route applies to one task and is
not stored globally or inherited permanently by later tasks.

For file changes or other substantive execution, the agent states the selected
route and a short reason. Pure informational answers do not need a route
announcement.

```text
Route: Standard - local behavior change with focused regression coverage.
```

### 4.1 Micro

Micro is allowed only when every condition below is true:

- The requested outcome is explicit and contains no unresolved design choice.
- The change introduces no new behavior.
- The change is local, reversible, and mechanically understood.
- It does not affect a public API, shared contract, security boundary, data
  model, persistence behavior, concurrency, or distributed state.
- A focused verification directly demonstrates the requested result.

Typical Micro work includes documentation, comments, formatting, pure renames,
static value changes without executable semantics, and explicit mechanical
replacement.

Micro executes:

```text
inspect -> change -> focused verification
```

Micro does not create a spec, plan, worktree, subagent, or independent review.
Any bug fix, condition change, behavior change, interface change, or uncertainty
is at least Standard, even if the diff is one line.

### 4.2 Standard Inline

Standard is the default for clear, local behavior changes with bounded risk and
direct verification. Before implementation, the agent records four short
fields in the conversation:

```text
Intent: the observable outcome
Constraints: boundaries the implementation must preserve
Acceptance: evidence that proves completion
Risk: known risk and why Full is not required
```

Standard executes in the current session and current workspace. It does not
create a persisted spec or implementation plan, create a worktree, or dispatch
a subagent by default.

Behavior changes and bug fixes use TDD. Non-behavioral work uses validation
appropriate to the artifact. Completion always passes through fresh
verification. Independent review is risk-gated: local changes use implementer
self-review, while public interfaces, security, migrations, concurrency, or a
large blast radius require Full rather than an ad hoc Standard review chain.

### 4.3 Full

Full is selected when any of these conditions is present:

- Product, architecture, or behavioral design decisions are unresolved.
- A public API, shared interface, or cross-module contract changes.
- A data model, schema, migration, persistence format, or durable state changes.
- Authentication, authorization, security, privacy, or sensitive data is
  involved.
- Concurrency, asynchronous lifecycle, distributed state, retry semantics, or
  ordering guarantees are involved.
- An operation is destructive, irreversible, or has a high blast radius.
- Work must be decomposed into independent tasks, parallel execution, or
  cross-agent collaboration.
- The user explicitly requests the Full workflow.

Full preserves this complete path:

```text
brainstorming -> written spec -> intent-level plan -> isolated execution
-> proportional task review -> final whole-change review -> branch finish
```

A worktree is the default when the environment is not already isolated. Full
retains TDD for behavior and bug fixes and retains mandatory final review.

### 4.4 Override and Escalation

The user may explicitly request Micro, Standard, or Full. An explicit Full
request is always honored. An explicit lighter request is honored only while
its route safety conditions remain true. Discovering a security, data,
contract, concurrency, destructive, or architecture risk upgrades the task to
Full. The agent announces the reason before continuing.

Automatic downgrade is not allowed after implementation starts. A subagent
executing a scoped task follows the route and contract supplied by its parent
rather than re-running the top-level router.

## 5. Skill Modification Boundary

Seven skills are Lite-modified:

| Skill | Required change |
| --- | --- |
| `using-superpowers` | Replace the one-percent mandatory invocation rule with the three-route contract, explicit override, and escalation. |
| `brainstorming` | Trigger only for Full, substantive design decisions, or explicit user request; preserve the Full design and approval gate once invoked. |
| `writing-plans` | Produce intent-level plans that reference the spec and include constraints, interfaces, dependencies, acceptance, and risk; use exact code only for fragile or non-obvious logic. |
| `systematic-debugging` | Preserve reproduction and root cause; add a short deterministic path and reserve deep instrumentation and hypothesis expansion for uncertain, intermittent, multi-component, or repeatedly failing cases. |
| `test-driven-development` | Keep RED-GREEN-REFACTOR mandatory for behavior, regression, and shared contracts; use direct validation for documentation, formatting, pure renames, generated artifacts, and static configuration without executable semantics. |
| `subagent-driven-development` | Keep isolated implementers and final whole-change review; make task review mandatory only for high-risk boundaries. |
| `requesting-code-review` | Make Micro no-review, Standard risk-gated, and Full final review mandatory; require delta, remaining risk, and new evidence for re-review. |

Seven skills retain upstream semantics apart from Pi-relative references needed
to keep links valid:

- `dispatching-parallel-agents`
- `executing-plans`
- `finishing-a-development-branch`
- `receiving-code-review`
- `using-git-worktrees`
- `verification-before-completion`
- `writing-skills`

Unchanged skills remain on-demand and therefore do not increase bootstrap cost.
`verification-before-completion` is a shared invariant for every route.

Full mode preserves the complete workflow stages but intentionally uses the
new intent-level planning and proportional review contracts. Full is not a
byte-for-byte copy of the upstream orchestration.

## 6. Review Topology

Micro performs focused verification and no independent review.

Standard performs implementer self-review. A risk discovered during self-review
causes escalation to Full instead of adding arbitrary partial ceremony.

Full uses:

1. An implementer per plan task when subagent-driven execution is selected.
2. Implementer tests and self-review for every task.
3. Task-level independent review only when the task crosses a public contract,
   security boundary, migration boundary, concurrency boundary, or similarly
   high-risk interface.
4. One mandatory final review of the entire change for spec compliance and code
   quality.
5. One fix wave for a final findings set rather than a separate fixer per
   finding.

A re-review request includes the new diff, unresolved risk, and verification
added since the previous review. An unchanged submission is not re-reviewed.
This changes ordinary review dispatch cost from approximately proportional to
task count toward one final review, while preserving targeted review where an
early defect would be expensive.

## 7. Pi Runtime

### 7.1 Bootstrap lifecycle

The extension reads its own `using-superpowers/SKILL.md`, strips frontmatter,
and injects the compact body with a concise Pi tool mapping. It uses the same
bootstrap marker as the official Pi extension so migration-time coexistence
cannot produce two bootstrap messages regardless of extension order.

The extension:

- enables injection on `session_start`;
- injects at most once in an effective context;
- does not re-inject on normal later turns;
- enables injection after `session_compact`;
- skips injection when the compatible marker is already present;
- stops repeated injection after `agent_end` until compaction or a new session.

The injected bootstrap budget is:

```text
using-superpowers body: at most 500 words
Pi mapping and wrapper: at most 150 words
total: at most 650 words
```

A missing or unreadable bootstrap is reported rather than silently replaced
with stale cached content.

### 7.2 Native skill map

Pi's package loader owns skill discovery and conflict resolution. During
`before_agent_start`, the extension captures `systemPromptOptions.skills` into
an in-memory `Map<name, filePath>`.

The explicit `Skill` tool resolves only that map, reads the selected file,
strips frontmatter, and returns the complete body. It never scans git, npm,
settings, `.pi/skills`, or `.agents/skills` independently.

If the selected skill is absent, the tool reports only Pi's current available
names. If the file cannot be read, the error includes the selected path. If
Pi resolves `using-superpowers` to a path outside this package root, the
extension emits one warning per session and instructs the user to remove the
conflicting package.

### 7.3 TodoWrite

`TodoWrite` retains an in-session list with pending, in-progress, and completed
states and optional priority. The list resets on `session_start` and is not
persisted to disk. The router does not require TodoWrite for Micro and uses it
for Standard or Full only when task tracking provides value.

### 7.4 Subagents

The package does not implement a subagent wrapper. When `pi-subagents` is
available, Full skills use its native `subagent` tool. Without it, Full execution
continues sequentially in the current session or reports the missing optional
capability. It never fabricates unsupported `Task` calls.

## 8. Upstream Provenance and Sync

`UPSTREAM.md` records the upstream repository, tag, commit, snapshot date,
license, synchronization procedure, and the intentional Lite design delta.

`upstream-manifest.json` is machine-readable and records, for every imported
file:

- relative path;
- status: `unchanged`, `lite-modified`, or `pi-adapted`;
- SHA-256 of the upstream baseline;
- current local SHA-256 when applicable.

Offline parity tests enforce that:

- unchanged files still match the pinned upstream hash;
- every changed imported file has an explicit modified status;
- no imported file drifts without manifest registration;
- all fourteen expected skills and their referenced assets exist.

Synchronization uses an explicit local upstream checkout:

```text
npm run upstream:check -- --source <upstream-checkout>
npm run upstream:sync  -- --source <upstream-checkout>
```

Neither command accesses the network. `upstream:check` reports additions,
deletions, and changed upstream files. `upstream:sync` may update only files
marked unchanged. If a Lite-modified or Pi-adapted baseline changed upstream,
the command exits non-zero and requires manual reconciliation. After manual
reconciliation, the manifest, structural suite, and behavioral evaluation are
run again.

## 9. Verification Strategy

### 9.1 Structural tests

The offline test suite verifies:

- exactly fourteen unique expected skill names;
- frontmatter names match directory names;
- all relative markdown, template, and script links resolve;
- package manifest declares one Pi extension and one skill tree;
- upstream hashes and file statuses are consistent;
- the bootstrap word budget is enforced.

### 9.2 Extension tests

Extension tests verify:

- one initial bootstrap;
- no duplicate on ordinary turns;
- reinjection after compaction;
- skip behavior when the compatible official marker exists;
- native skill-map loading and denial of unexposed disk skills;
- one conflict warning for an out-of-package `using-superpowers` path;
- TodoWrite reset on session start;
- readable errors for missing bootstrap and skill files.

### 9.3 Skill contract tests

Static contracts assert that the policy cannot drift silently:

- Micro forbids new behavior;
- Standard omits persisted specs, plans, worktrees, and subagents by default;
- every Full trigger remains present;
- user override and automatic escalation remain present;
- every route retains verification;
- TDD exceptions are restricted to non-behavioral changes;
- Full final review remains mandatory;
- ordinary tasks do not require task-level review.

### 9.4 Behavioral evaluation

Fresh-context fixtures cover at least:

- spelling, documentation, and pure rename -> Micro;
- one-line bug and local behavior change -> Standard;
- ordinary local feature -> Standard;
- public API and schema migration -> Full;
- authentication, authorization, security, and privacy -> Full;
- concurrency and distributed state -> Full;
- explicit Full request -> Full;
- risk discovered during implementation -> upgrade to Full.

The same model and sampling settings run first against upstream and then Lite.
Each result records route, skill calls, generated artifacts, subagent dispatches,
and review fan-out. Safety, migration, and concurrency fixtures require a
100 percent Full result. Micro fixtures must not create a spec, plan, worktree,
or subagent. Standard fixtures must not dispatch a subagent without a Full
escalation.

Model evaluation is not part of the ordinary offline `npm test` command. It is
mandatory before the first release, and its report is saved as a reviewable
artifact.

## 10. Migration and Rollback

Migration occurs only after the local package passes structural, extension,
skill contract, typecheck, and behavioral evaluation.

The Pi settings package list changes from:

```text
https://github.com/obra/superpowers
D:/Projects/PiAgent/plugins/superpowers-support-work/gadgj-pi-superpowers-support
```

to:

```text
D:/Projects/PiAgent/plugins/pi-superpowers-lite
```

The `pi-subagents` entry remains unchanged. The user runs `/reload`, then the
acceptance smoke test verifies `pi list`, one bootstrap marker, all fourteen
skill names, a successful explicit `Skill` call, and one representative task
per route.

Rollback restores the two previous package entries, removes the Lite package
entry, and reloads Pi. Existing repositories and installed checkouts remain on
disk throughout the migration.

## 11. Delivery Phases

1. **Foundation:** create package metadata, copy the pinned Pi-relevant
   snapshot, preserve the license, and establish structural and parity tests.
2. **Lite workflow:** modify the seven approved skills and add route contracts
   and evaluation fixtures.
3. **Pi runtime:** combine official bootstrap lifecycle with the corrected
   support tools and add extension tests.
4. **Migration:** install the local package, remove the two superseded package
   entries, reload, and complete route smoke tests.

Each phase must leave a testable package and must not change active Pi settings
until Phase 4.

## 12. Risks and Mitigations

- **Natural-language route variance:** use explicit boundary language,
  adversarial fixtures, and fresh-context evaluation.
- **Micro expanding into unsafe behavior:** require all Micro conditions and
  make any behavior change at least Standard.
- **Standard silently accumulating risk:** require a risk field and mandatory
  escalation triggers.
- **Full becoming a second divergent workflow:** keep one skill tree and one
  set of modified planning and review contracts.
- **Upstream drift:** pin commit hashes, classify imported files, and block
  automatic updates to modified files.
- **Migration-time duplicate bootstrap:** share the official Pi marker and
  remove old package entries only after validation.
- **Name collision selecting the wrong skill tree:** inspect Pi's resolved
  `using-superpowers` path and warn once when it is outside the package root.
- **Review savings weakening safety:** retain mandatory final Full review and
  targeted task review for critical boundaries.

## 13. Acceptance Criteria

The implementation is accepted when all of the following are true:

1. Pi loads exactly one Superpowers package after migration.
2. All fourteen original skill names are available through Pi discovery and
   the explicit `Skill` tool.
3. Bootstrap text is at most 650 words and appears once per effective context.
4. The structural, parity, skill contract, extension, and typecheck suites pass.
5. All safety, migration, and concurrency evaluation fixtures select Full.
6. Micro fixtures produce no spec, plan, worktree, subagent, or independent
   review.
7. Standard fixtures record the inline four-field contract and do not create
   Full artifacts without escalation.
8. Full can complete brainstorming, written spec, intent-level plan, isolated
   execution, proportional task review, final whole-change review, and branch
   finish.
9. The official Superpowers checkout and the support repository remain intact
   and provide a tested rollback path.
