# Fail-First Wave Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make large Full work decompose into atomic fail-first execution waves while prohibiting repository-wide validation before finalization.

**Architecture:** The approved spec at `docs/superpowers/specs/2026-07-19-fail-first-wave-execution-design.md` is the workflow contract. First add a dependency-free behavioral evaluation contract and capture the unchanged baseline. Then edit eight disjoint skill domains in isolated Pi worktrees, admit their patch handoffs into one canonical integrator, register upstream drift once, run the union affected closure, and reserve package-wide validation for the final gate.

**Tech Stack:** Markdown Agent Skills, Node.js 24 ESM contract tests and validators, Pi 0.80.6 CLI fresh contexts, `pi-subagents` native isolated worktrees and patch artifacts, Git, SHA-256 upstream manifest.

## Global Constraints

- The package root is `D:/Projects/PiAgent/plugins/pi-superpowers-lite`.
- The approved contract pin is commit `9560068b9e32c473a1072261e50e231cf3bcd6d3`.
- The upstream baseline remains `obra/superpowers` `v6.1.1` at commit `d884ae04edebef577e82ff7c4e143debd0bbec99`.
- Micro and Standard routing semantics do not change.
- DAG/wave ceremony applies only to cohesive Full work with at least two independently mergeable implementation units.
- TDD RED/GREEN remains inside L1 for behavior changes; skill edits follow `writing-skills` RED/GREEN/REFACTOR.
- Repository-wide L3 is prohibited before finalization. No task or intermediate wave may run `npm test` or an equivalent all-repository command.
- L1 claims say only `task-local checks passed`; L2 claims say only `affected closure passed`.
- The canonical package checkout has one integrator writer. Parallel implementers use native `worktree: true` and return patches, not persistent branches.
- Every native wave starts from one frozen clean `HEAD`; a failed worker, unresolved concern, failed task review, empty required patch, ownership drift, or failed `git apply --check` integrates zero patches.
- A high-risk shared contract is independently reviewed before fan-out. All eight skill edits are shared workflow contracts and therefore receive read-only task review before integration.
- Subagent launches omit `timeoutMs`, `maxRuntimeMs`, `turnBudget`, and `toolBudget`.
- Evaluation uses `Mapleluv-Main/gpt-5.6-sol-pro` with `thinking=high`, identical prompts/settings across variants, and no model substitution inside a report.
- Transport failures may be retried up to three times with the identical prompt/model/settings; a missing observation remains missing and fails validation.
- Generated evaluation reports and raw model outputs stay under ignored `.superpowers/evals/`; never stage them.
- Do not change Pi settings, the extension runtime, route fixtures, package version, or unrelated skills.
- Preserve the active local package path; execution occurs on canonical `main` because that path is the configured package source.

## File and Ownership Map

| Owner | Files | Responsibility |
|---|---|---|
| Task 1 | `evals/execution-cases.json`, `evals/README.md`, `scripts/validate-execution-eval-report.mjs`, `tests/validate-execution-eval-report.test.mjs`, `tests/helpers/skill-contract.mjs`, `package.json` | Evaluation contract, fixtures, shared read helpers, unchanged baseline |
| Task 2 | `skills/brainstorming/SKILL.md`, `skills/brainstorming/spec-document-reviewer-prompt.md`, `tests/execution-contracts/brainstorming.test.mjs` | Boundary-first design and reviewed contract spine |
| Task 3 | `skills/writing-plans/SKILL.md`, `skills/writing-plans/plan-document-reviewer-prompt.md`, `tests/execution-contracts/writing-plans.test.mjs` | Executable DAG/wave plans and L2 derivation |
| Task 4 | `skills/subagent-driven-development/SKILL.md`, `skills/subagent-driven-development/implementer-prompt.md`, `tests/execution-contracts/subagent-driven-development.test.mjs` | Native patch waves, quarantine, final L3 ownership |
| Task 5 | `skills/dispatching-parallel-agents/SKILL.md`, `tests/execution-contracts/dispatching-parallel-agents.test.mjs` | Independent implementation dispatch and L2 integration |
| Task 6 | `skills/executing-plans/SKILL.md`, `tests/execution-contracts/executing-plans.test.mjs` | Inline wave execution and scoped checkpoints |
| Task 7 | `skills/using-git-worktrees/SKILL.md`, `tests/execution-contracts/using-git-worktrees.test.mjs` | Selective baseline and later failure attribution |
| Task 8 | `skills/verification-before-completion/SKILL.md`, `tests/execution-contracts/verification-before-completion.test.mjs` | Scope-qualified evidence and claims |
| Task 9 | `skills/finishing-a-development-branch/SKILL.md`, `tests/execution-contracts/finishing-a-development-branch.test.mjs` | State-bound L3 evidence reuse and invalidation |
| Task 10 | `upstream-manifest.json`, `package.json`, `README.md`, `tests/execution-contracts/manifest-registration.test.mjs`, `tests/execution-contracts/run-all.mjs` | Focused registration contract, portable aggregate L2, user-facing workflow |

No two Tasks 2-9 own the same path. `upstream-manifest.json` and aggregate package commands remain integrator-owned so parallel workers cannot conflict there.

## Execution Graph

`S` means the immutable spec at commit `9560068b9e32c473a1072261e50e231cf3bcd6d3`. Wave 1 tasks consume definitions directly from `S`; they do not consume a sibling's unintegrated patch.

| Task | Wave | `dependsOn` | `owns` | `consumes` | `produces` | Exact L1 | Exact L2 after integration | Risk/review |
|---|---:|---|---|---|---|---|---|---|
| 1 | 0 | `S` | `evals/{execution-cases.json,README.md}`; `scripts/validate-execution-eval-report.mjs`; `tests/{validate-execution-eval-report.test.mjs,helpers/skill-contract.mjs}`; `package.json` | `S` §§5-15; unchanged skill tree | evaluator/helper contract; 50-record profiled baseline | `node tests/validate-execution-eval-report.test.mjs` | same command; `node tests/validate-eval-report.test.mjs` | shared test contract; independent approval before fan-out |
| 2 | 1 | Task 1; `S` | `skills/brainstorming/{SKILL.md,spec-document-reviewer-prompt.md}`; `tests/execution-contracts/brainstorming.test.mjs` | `S` §§5-6; Task 1 `brainstorming` profile baseline | boundary/fail-first skill and reviewer-prompt patch; no sibling consumes it in Wave 1 | `node tests/execution-contracts/brainstorming.test.mjs` | same command; `node tests/skill-contracts.test.mjs` | shared architecture workflow; task review |
| 3 | 1 | Task 1; `S` | `skills/writing-plans/{SKILL.md,plan-document-reviewer-prompt.md}`; `tests/execution-contracts/writing-plans.test.mjs` | `S` §§7, 9-11; Task 1 `writing-plans` profile baseline | graph-plan skill and reviewer-prompt patch; no sibling consumes it in Wave 1 | `node tests/execution-contracts/writing-plans.test.mjs` | same command; `node tests/skill-contracts.test.mjs` | shared plan contract; task review |
| 4 | 1 | Task 1; `S` | `skills/subagent-driven-development/{SKILL.md,implementer-prompt.md}`; `tests/execution-contracts/subagent-driven-development.test.mjs` | `S` §§7-13; Task 1 `subagent-driven-development` profile baseline | SDD/implementer patch; no sibling consumes it in Wave 1 | `node tests/execution-contracts/subagent-driven-development.test.mjs` | same command; `node tests/skill-contracts.test.mjs` | execution/concurrency/finalization; task review |
| 5 | 1 | Task 1; `S` | `skills/dispatching-parallel-agents/SKILL.md`; `tests/execution-contracts/dispatching-parallel-agents.test.mjs` | `S` §§4, 7-9; Task 1 `dispatching-parallel-agents` profile baseline | dispatch patch; no sibling consumes it in Wave 1 | `node tests/execution-contracts/dispatching-parallel-agents.test.mjs` | same command; `node tests/skill-contracts.test.mjs` | concurrency contract; task review |
| 6 | 1 | Task 1; `S` | `skills/executing-plans/SKILL.md`; `tests/execution-contracts/executing-plans.test.mjs` | `S` §§4, 6-11; Task 1 `executing-plans` profile baseline | inline-execution patch; no sibling consumes it in Wave 1 | `node tests/execution-contracts/executing-plans.test.mjs` | same command; `node tests/skill-contracts.test.mjs` | shared execution workflow; task review |
| 7 | 1 | Task 1; `S` | `skills/using-git-worktrees/SKILL.md`; `tests/execution-contracts/using-git-worktrees.test.mjs` | `S` §§9-10; Task 1 `using-git-worktrees` profile baseline | selective-baseline patch; no sibling consumes it in Wave 1 | `node tests/execution-contracts/using-git-worktrees.test.mjs` | same command; `node tests/skill-contracts.test.mjs` | attribution integrity; task review |
| 8 | 1 | Task 1; `S` | `skills/verification-before-completion/SKILL.md`; `tests/execution-contracts/verification-before-completion.test.mjs` | `S` §9; Task 1 `verification-before-completion` profile baseline | scoped-evidence patch; no sibling consumes it in Wave 1 | `node tests/execution-contracts/verification-before-completion.test.mjs` | same command; `node tests/skill-contracts.test.mjs` | completion integrity; task review |
| 9 | 1 | Task 1; `S` | `skills/finishing-a-development-branch/SKILL.md`; `tests/execution-contracts/finishing-a-development-branch.test.mjs` | `S` §§11-12; Task 1 `finishing-a-development-branch` profile baseline | L3-reuse patch; no sibling consumes it in Wave 1 | `node tests/execution-contracts/finishing-a-development-branch.test.mjs` | same command; `node tests/skill-contracts.test.mjs` | finalization integrity; task review |
| 10 | 2 | admitted Tasks 2-9 | `upstream-manifest.json`; `package.json`; `README.md`; `tests/execution-contracts/{manifest-registration.test.mjs,run-all.mjs}` | all admitted commits; Task 1 complete baseline | focused manifest/package/docs registration and integrated Lite report | `node tests/execution-contracts/manifest-registration.test.mjs` | `node tests/execution-contracts/run-all.mjs`; `node tests/skill-contracts.test.mjs`; `node tests/validate-execution-eval-report.test.mjs` | shared package/build metadata; task review before finalization |

Wave 1 uses a Pi parallel chain group with `worktree: true`, `failFast: true`, and a conservative concurrency of four. `failFast` does not authorize partial integration.

## Shared Skill-Edit Protocol for Tasks 2-9

Each worker edits one skill domain and completes this sequence before reporting:

1. Read the spec, Task 1 fixtures, its exact task section, and the existing skill/prompt files.
2. Read all five baseline repetitions for every mapped case under the task's named profile from the controller-provided absolute report path. If any required case lacks a genuine intended failure, stop without editing and report `BLOCKED`; do not invent guidance for a failure not observed.
3. Create the dedicated static contract test and run it against the unchanged skill. It must fail for the intended missing rule or forbidden legacy instruction, not for syntax or path errors.
4. Make the minimum skill and supporting-prompt edit that closes the observed failures. Preserve frontmatter trigger semantics and required upstream safety gates.
5. Run the dedicated contract test until green. Do not run another skill's test or any package-wide command.
6. Run five fresh candidate repetitions for every mapped case under the same named profile, model, thinking level, evaluator prompt, and CLI isolation used by Task 1. Save raw outputs and the normalized partial report outside the temporary worktree at the unique controller-provided ignored path.
7. Validate the exact `(caseId, target, repetition, profile)` subset with the exported validator API and manually read every raw response. Static anchors alone do not satisfy GREEN.
8. Run `git diff --check`, inspect the full task diff, and record before/after word counts. The primary `SKILL.md` and any supporting prompt must not exceed their individual baseline word count listed below.
9. Commit only owned paths and write an implementer report accounting for every required baseline and candidate tuple, including verbatim baseline failure/rationalization excerpts, static RED/GREEN evidence, manual scoring notes, word counts, diff scope, and concerns.

Workers do not dispatch reviewers. The controller owns independent review after native patch capture and temporary-worktree cleanup.

The temporary evaluator invokes Pi as follows for each fresh context, with a generated system-prompt file containing the common evaluator instruction plus the relevant skill tree at that variant:

```bash
pi --no-extensions --no-skills --no-tools --no-context-files --no-session --mode json \
  --provider Mapleluv-Main --model gpt-5.6-sol-pro --thinking high \
  --system-prompt "$SYSTEM_PROMPT_FILE" -p "$FIXTURE_PROMPT"
```

The controller assigns each worker an absolute ignored `REPORT_FILE` and unique `RAW_DIR`. The ignored driver may automate calls and transport retries, but it is not package source and must not be staged. Each repetition is a separate Pi process. The same exact user prompt is used for baseline and candidate.

Baseline word-count ceilings:

| File | Maximum words |
|---|---:|
| `skills/brainstorming/SKILL.md` | 1574 |
| `skills/brainstorming/spec-document-reviewer-prompt.md` | 235 |
| `skills/writing-plans/SKILL.md` | 1096 |
| `skills/writing-plans/plan-document-reviewer-prompt.md` | 235 |
| `skills/subagent-driven-development/SKILL.md` | 1358 |
| `skills/subagent-driven-development/implementer-prompt.md` | 832 |
| `skills/dispatching-parallel-agents/SKILL.md` | 950 |
| `skills/executing-plans/SKILL.md` | 350 |
| `skills/using-git-worktrees/SKILL.md` | 1154 |
| `skills/verification-before-completion/SKILL.md` | 668 |
| `skills/finishing-a-development-branch/SKILL.md` | 1042 |

## Pre-Implementation Selective Baseline and Fail-First Frontier

Run this gate after the reviewed plan is committed and before editing Task 1 files:

- [ ] Record `BASE_SHA=$(git rev-parse HEAD)` and require `git status --short` to be empty.
- [ ] Record `git remote get-url origin` when present. If the remote is GitHub and `gh` is authenticated, record the latest relevant run with `gh run list --branch "$(git branch --show-current)" --limit 1 --json databaseId,status,conclusion,headSha,workflowName`; otherwise record CI status exactly as `unknown`.
- [ ] Run only the untouched direct workflow consumers:

```bash
node tests/skill-contracts.test.mjs
node tests/pi-reference-contract.test.mjs
node tests/validate-eval-report.test.mjs
```

Record the exact commands/results as `selective baseline at $BASE_SHA`. Do not claim the repository is globally clean. A pre-existing focused failure is diagnosed against the untouched base before Task 1; it is not bypassed by running L3.

The named fail-first frontier is Task 1's validator RED/GREEN, the complete 50-record baseline (five repetitions for every case with all applicable profile results), manual raw-output inspection, and independent Task 1 approval. Any missing observation, permissive-validator finding, absent per-profile failure, or blocking review returns to design/planning. Wave 1 cannot start.

---

### Task 1: Freeze the execution-evaluation contract and baseline

**Purpose:** Create mechanical evidence for the new workflow before any skill changes and capture the current failure modes.

**Files/modules:**
- Create: `evals/execution-cases.json`
- Create: `scripts/validate-execution-eval-report.mjs`
- Create: `tests/validate-execution-eval-report.test.mjs`
- Create: `tests/helpers/skill-contract.mjs`
- Modify: `evals/README.md`
- Modify: `package.json`

**Interfaces and dependencies:**
- Consumes: spec commit `9560068b9e32c473a1072261e50e231cf3bcd6d3` and the unchanged eight skill domains.
- Produces: `validateExecutionReport({ fixtures, results, targets, repetitions, caseIds, profiles })`, a CLI validator with explicit `--profile` filtering, ten fixtures with profile-specific assertions, common skill-reading helpers, and the absolute ignored baseline report path for Tasks 2-9.

**Constraints and invariants:**
- Use Node built-ins only.
- Final report cardinality is exactly ten cases x two targets (`baseline`, `lite`) x five repetitions = 100 records.
- Each fixture declares one or more exact profile keys from `brainstorming`, `writing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `executing-plans`, `using-git-worktrees`, `verification-before-completion`, and `finishing-a-development-branch`.
- Each result keeps one `(caseId, target, repetition)` identity and a `profileResults` object. Validator selection has exactly three modes: no filters requires the complete 100-record two-target report; `--target baseline` with no case/profile filters requires the complete 50-record baseline with all applicable profiles; any narrower selection requires one target, at least one `--case`, and exactly one `--profile`. All other filter combinations fail. Duplicates, missing requested records, or missing requested profile results fail.
- The final 100-record report requires the full conjunction of every fixture's profile assertions. Baseline profile results may fail the Lite contract. Every requested Lite profile result must pass.
- Preserve raw model output separately from normalized observations.

**Acceptance evidence:**
- RED: `node tests/validate-execution-eval-report.test.mjs` fails with `ERR_MODULE_NOT_FOUND` before the validator exists.
- GREEN: the same command prints `execution evaluation validator contract checks passed`.
- L2: `node tests/validate-eval-report.test.mjs` still prints `evaluation validator contract checks passed`. The Task 1 validator test itself reads `package.json#files` and proves it contains `evals/execution-cases.json`; complete structure/package traversal is deferred to L3.
- Baseline: `node scripts/validate-execution-eval-report.mjs .superpowers/evals/fail-first-baseline.json --target baseline` accepts exactly 50 records. Every fixture contains all applicable profile results, and every Task 2-9 profile has a genuine intended failure in each mapped case.

**Risk and rollback:** The validator is a shared contract spine. A permissive validator could manufacture confidence; its independent review must approve before Wave 1. Rollback is the single Task 1 commit.

**Implementation intent:**

- Fixtures use the exact IDs `stable-disjoint-components`, `unstable-shared-interface`, `overlapping-ownership`, `failed-worker`, `successful-intermediate-wave`, `missing-focused-command`, `finalization`, `same-state-finishing`, `material-invalidation`, and `live-effect-gate`.
- Each normalized result includes `caseId`, `target`, `repetition`, shared observations, and `profileResults`. Profile results hold the relevant skill calls, task/wave ownership and dependency observations, handoff kind, failed-wave integration count, pre-finalization L3 count, intermediate claims, finalization state, L3 events with material-cause references, live-effect ordering, and profile `pass`.
- The validator applies each fixture's profile-specific assertion set and enforces `fullSuiteCallsBeforeFinalization === 0`, disjoint same-wave ownership, satisfied dependencies, native `patch` handoff when expected, zero integration after failed waves, scoped intermediate claims, passing final L3 before completion, a material-cause reference before every later L3, and live effects only after L3 plus final approval.
- Validator tests cover all three legal selection modes; reject target-only Lite, case-without-profile, profile-without-case, and mixed ambiguous filters; cover duplicate/missing tuples, absent/wrong profiles, a partial profile falsely satisfying another skill's assertions, and failure of the final report when any applicable profile is absent.
- `tests/helpers/skill-contract.mjs` exports only path-safe read/frontmatter/section/word-count helpers used by the eight dedicated contract tests.
- Extend `evals/README.md` with the execution protocol, raw-evidence rule, exact model settings, five repetitions per case/profile, `profileResults` schema, and partial/final validator commands.
- Add `evals/execution-cases.json` to `package.json#files` and append only `node tests/validate-execution-eval-report.test.mjs` to the current test script. Wave 1 contract tests are registered later by Task 10.
- Create the ignored temporary runner under `.superpowers/evals/`, run all ten baseline cases five times, manually read all 50 raw responses, normalize observations without fabricating absent fields, and keep the report untracked.

**Commit:**

```bash
git add evals/execution-cases.json evals/README.md scripts/validate-execution-eval-report.mjs tests/validate-execution-eval-report.test.mjs tests/helpers/skill-contract.mjs package.json
git commit -m "test: define fail-first execution evaluations"
```

After commit, dispatch an independent read-only review of Task 1. Wave 1 must not start until that review approves the validator and fixtures.

---

### Task 2: Make brainstorming freeze independently executable boundaries

**Purpose:** Ensure large Full design defines stable, reversible component boundaries and reviewed contract spines before task fan-out.

**Files/modules:**
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/brainstorming/spec-document-reviewer-prompt.md`
- Create: `tests/execution-contracts/brainstorming.test.mjs`

**Interfaces and dependencies:**
- Consumes: immutable spec sections 5-6 at the spec pin plus Task 1 profile `brainstorming` for `stable-disjoint-components`, `unstable-shared-interface`, and `overlapping-ownership`.
- Produces: a boundary-map/fail-first brainstorming patch for later integrated runtime use. No Wave 1 sibling consumes this unintegrated patch.

**Constraints and invariants:**
- Preserve Full-only triggering, one-question dialogue, alternatives, user/delegated approval, durable spec, and writing-plans terminal transition.
- Do not require DAG ceremony for one dependency chain or split transactional invariants artificially.

**Acceptance evidence:**
- RED/GREEN: `node tests/execution-contracts/brainstorming.test.mjs` fails on the old missing boundary/contract-spine requirements, then passes.
- Pressure GREEN: five Lite repetitions for each of the three mapped cases produce a boundary map and fail-first frontier; unstable high-risk contracts are reviewed and pinned before fan-out; destructive transitions use additive/compatibility phases with finalization-only cutover; overlapping units remain sequential.
- Profile validation: `node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite --profile brainstorming --case stable-disjoint-components --case unstable-shared-interface --case overlapping-ownership` passes.

**Risk and rollback:** This is the architecture gate for every large Full task. Task review is mandatory; rollback is its isolated patch/atomic canonical commit.

**Implementation intent:**
- Add a compact conditional section for Full objectives with two or more independent units.
- Require responsibility, owns, contract, producer/consumer, mutable-resource, focused-verification, and reversibility fields.
- Require a named fail-first architecture/probe frontier that must disprove risky assumptions before broad implementation.
- Require contract-spine review/pin/invalidation for public/shared, security, migration, or concurrency boundaries.
- Require additive or compatibility phases for destructive contract transitions and reserve live cutover for finalization.
- Teach the spec reviewer to reject artificial decomposition, unstable fan-out contracts, missing fail-first evidence, destructive intermediate states, and missing selective verification surfaces.
- Remove redundant prose rather than increasing either file.

**Commit:**

```bash
git add skills/brainstorming/SKILL.md skills/brainstorming/spec-document-reviewer-prompt.md tests/execution-contracts/brainstorming.test.mjs
git commit -m "feat: design Full work for parallel waves"
```

---

### Task 3: Make writing-plans emit executable task graphs

**Purpose:** Replace ambiguous serial lists for qualifying Full work with concise ownership DAGs, exact selective commands, and a single finalization section.

**Files/modules:**
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/writing-plans/plan-document-reviewer-prompt.md`
- Create: `tests/execution-contracts/writing-plans.test.mjs`

**Interfaces and dependencies:**
- Consumes: immutable spec sections 7 and 9-11 at the spec pin plus Task 1 profile `writing-plans` for `stable-disjoint-components`, `unstable-shared-interface`, `overlapping-ownership`, and `missing-focused-command`.
- Produces: a writing-plans patch defining fields `task`, `wave`, `dependsOn`, `owns`, `produces`, `consumes`, `risk`, `L1`, and `L2`, plus fail-first and finalization sections. No Wave 1 sibling consumes this unintegrated patch.

**Constraints and invariants:**
- Keep intent-level plans; do not duplicate the spec or pre-write routine implementation.
- A plan without a trustworthy selective command must redesign the unit or defer it to final integration; it cannot relabel L3 as L2.
- No implementation task may contain an L3 command.

**Acceptance evidence:**
- RED/GREEN: `node tests/execution-contracts/writing-plans.test.mjs` fails on missing graph/L2/finalization fields and then passes.
- Pressure GREEN: five Lite repetitions for each of the four mapped cases produce correct waves, keep overlapping units sequential, and reject early L3 when focused verification is absent.
- Profile validation: `node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite --profile writing-plans --case stable-disjoint-components --case unstable-shared-interface --case overlapping-ownership --case missing-focused-command` passes.

**Risk and rollback:** Plan shape controls every downstream writer and test scope. Task review is mandatory; rollback is its isolated patch/atomic canonical commit.

**Implementation intent:**
- Add the applicability predicate and one compact execution-graph template.
- Require exact L2 derivation source, reverse consumers, shared build/config surfaces, commands/filters, and exclusion rationale.
- Add baseline SHA/CI/selective-evidence fields and finalization preconditions.
- Replace the generic per-task `Regression: exact broader command` slot with declared L0/L1 evidence and wave-owned L2; keep L3 only in the finalization section.
- Extend the plan reviewer to reject overlap, dependency violations, missing patch ownership, early L3, and fake affected closures.

**Commit:**

```bash
git add skills/writing-plans/SKILL.md skills/writing-plans/plan-document-reviewer-prompt.md tests/execution-contracts/writing-plans.test.mjs
git commit -m "feat: plan Full work as execution graphs"
```

---

### Task 4: Execute SDD plans as quarantined native patch waves

**Purpose:** Let SDD run truly independent writers concurrently while preserving one canonical integrator and one final L3 owner.

**Files/modules:**
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Create: `tests/execution-contracts/subagent-driven-development.test.mjs`

**Interfaces and dependencies:**
- Consumes: immutable spec sections 7-13 at the spec pin plus Task 1 profile `subagent-driven-development` for `stable-disjoint-components`, `failed-worker`, `successful-intermediate-wave`, `finalization`, and `live-effect-gate`.
- Produces: an SDD/implementer patch defining native wave dispatch, patch admission/quarantine, L1/L2 execution, first final-gate L3, and reusable evidence. No Wave 1 sibling consumes this unintegrated patch.

**Constraints and invariants:**
- Keep risk-gated task review and mandatory final whole-change review.
- `failFast` is optimization only; any failed/unresolved worker integrates zero wave patches.
- Native worktree handoff is a patch. Persistent branch language applies only to separately managed worktrees.
- The implementer prompt must prohibit package-wide/repository-wide suites and require only declared L1.

**Acceptance evidence:**
- RED/GREEN: `node tests/execution-contracts/subagent-driven-development.test.mjs` first fails on serial/per-task-full-suite/branch assumptions, then passes.
- Pressure GREEN: five Lite repetitions for each mapped case use isolated patch writers, quarantine failed waves, run L2 after successful integration, wait until finalization for L3, and gate live effects behind L3 plus final review.
- Profile validation: `node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite --profile subagent-driven-development --case stable-disjoint-components --case failed-worker --case successful-intermediate-wave --case finalization --case live-effect-gate` passes.

**Risk and rollback:** This changes concurrency, integration, and completion ownership. Task review is mandatory; rollback is its isolated patch/atomic canonical commit.

**Implementation intent:**
- Replace the serial process with graph loading, frozen wave base, native parallel dispatch, report/task-review gate, patch admission, canonical atomic commits, union L2, and next-wave clean-state rules.
- Require non-empty write patches, changed-path subset checks including renames/deletes, and `git apply --check` before any patch application.
- Treat conflict, path drift, shared-resource collision, or contract mismatch as re-planning evidence.
- Define finalization preconditions, initial L3 ownership, material invalidation, L3 evidence fields, final review, focused fix evidence, renewed L3, and re-review.
- Replace implementer `full suite once before committing` with exact declared L1 and scope-qualified reporting.
- Preserve concise report/status and no-timeout project rules.

**Commit:**

```bash
git add skills/subagent-driven-development/SKILL.md skills/subagent-driven-development/implementer-prompt.md tests/execution-contracts/subagent-driven-development.test.mjs
git commit -m "feat: execute SDD tasks in isolated waves"
```

---

### Task 5: Generalize parallel dispatch to implementation waves

**Purpose:** Make parallel dispatch usable for disjoint implementation work, not only unrelated failure investigation, without reintroducing an intermediate full suite.

**Files/modules:**
- Modify: `skills/dispatching-parallel-agents/SKILL.md`
- Create: `tests/execution-contracts/dispatching-parallel-agents.test.mjs`

**Interfaces and dependencies:**
- Consumes: immutable spec sections 4 and 7-9 at the spec pin plus Task 1 profile `dispatching-parallel-agents` for `stable-disjoint-components`, `overlapping-ownership`, `failed-worker`, and `successful-intermediate-wave`.
- Produces: a parallel-dispatch patch defining the independence predicate and Full-wave handoff. No Wave 1 sibling consumes this unintegrated patch.

**Constraints and invariants:**
- Preserve focused contexts and one domain per agent.
- Investigation-only fanout remains read-only and may omit worktrees; implementation fanout requires isolation and declared ownership.
- No intermediate `run full test suite` instruction remains.

**Acceptance evidence:**
- RED/GREEN: `node tests/execution-contracts/dispatching-parallel-agents.test.mjs` fails on failure-only/full-suite guidance and then passes.
- Pressure GREEN: five Lite repetitions for each of the four mapped cases select isolated parallel patches only for disjoint ownership, keep colliding work sequential, quarantine a failed wave, and use L2 after successful integration.
- Profile validation: `node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite --profile dispatching-parallel-agents --case stable-disjoint-components --case overlapping-ownership --case failed-worker --case successful-intermediate-wave` passes.

**Risk and rollback:** Incorrect independence claims can corrupt parallel work. Task review is mandatory; rollback is its isolated patch/atomic canonical commit.

**Implementation intent:**
- Replace the failure-only flow with one predicate covering independent investigation and implementation units.
- Reference SDD for Full implementation-wave admission rather than duplicating its full algorithm.
- State immutable inputs, disjoint writes, isolated mutable resources, and zero-partial-integration requirements.
- Remove the narrative session example and repeated full-suite sections to stay below the existing word count.

**Commit:**

```bash
git add skills/dispatching-parallel-agents/SKILL.md tests/execution-contracts/dispatching-parallel-agents.test.mjs
git commit -m "feat: dispatch independent implementation waves"
```

---

### Task 6: Make inline plan execution honor waves and scoped checkpoints

**Purpose:** Preserve the same graph and validation semantics when delegation is unavailable or execution occurs in a separate session.

**Files/modules:**
- Modify: `skills/executing-plans/SKILL.md`
- Create: `tests/execution-contracts/executing-plans.test.mjs`

**Interfaces and dependencies:**
- Consumes: immutable spec sections 4 and 6-11 at the spec pin plus Task 1 profile `executing-plans` for `successful-intermediate-wave`, `missing-focused-command`, and `finalization`.
- Produces: an executing-plans patch for sequential inline execution by topological wave with L1/L2 checkpoints and final-only L3. No Wave 1 sibling consumes this unintegrated patch.

**Constraints and invariants:**
- Do not pretend inline execution has parallel writers when `subagent` is unavailable.
- Preserve critical plan review and stop-on-blocker behavior.
- No task-level or wave-level L3.

**Acceptance evidence:**
- RED/GREEN: `node tests/execution-contracts/executing-plans.test.mjs` fails because the old process lacks wave/L1/L2/finalization semantics, then passes.
- Pressure GREEN: five Lite repetitions for each of the three mapped cases execute eligible tasks in topological order, stop on scoped failure, reject missing focused evidence, and delay L3 until finalization.
- Profile validation: `node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite --profile executing-plans --case successful-intermediate-wave --case missing-focused-command --case finalization` passes.

**Risk and rollback:** Ambiguous inline semantics could silently bypass the new contract. Task review is mandatory; rollback is its isolated patch/atomic canonical commit.

**Implementation intent:**
- Read graph/fail-first frontier once, execute each wave's tasks sequentially in one writer, run task L1 and union L2, and checkpoint the scoped result.
- On graph/closure contradictions, return to plan review rather than guessing.
- Invoke finishing only after finalization and a valid L3 evidence record exists.

**Commit:**

```bash
git add skills/executing-plans/SKILL.md tests/execution-contracts/executing-plans.test.mjs
git commit -m "feat: execute plans with scoped verification"
```

---

### Task 7: Replace the generic worktree full baseline with selective attribution

**Purpose:** Establish useful base evidence without running repository-wide tests before finalization or claiming global cleanliness.

**Files/modules:**
- Modify: `skills/using-git-worktrees/SKILL.md`
- Create: `tests/execution-contracts/using-git-worktrees.test.mjs`

**Interfaces and dependencies:**
- Consumes: immutable spec sections 9-10 at the spec pin plus Task 1 profile `using-git-worktrees` for `missing-focused-command`.
- Produces: a using-git-worktrees patch defining frozen base SHA, available CI status, selective base evidence, and final-failure attribution. No Wave 1 sibling consumes this unintegrated patch.

**Constraints and invariants:**
- Preserve isolation detection, native-tool preference, ignore checks, setup, and user consent rules.
- Never describe selective evidence as a globally clean baseline.
- If final L3 fails, reproduce only the specific failure against the frozen base in an isolated worktree.

**Acceptance evidence:**
- RED/GREEN: `node tests/execution-contracts/using-git-worktrees.test.mjs` fails on generic `npm test / cargo test / pytest / go test ./...` baseline guidance, then passes.
- Pressure GREEN: five Lite repetitions for the mapped case record SHA/CI, run declared L0-L2 only, state `selective baseline`, and redesign rather than running early L3 when no focused command exists.
- Profile validation: `node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite --profile using-git-worktrees --case missing-focused-command` passes.

**Risk and rollback:** Deferred global failures need honest attribution. Task review is mandatory; rollback is its isolated patch/atomic canonical commit.

**Implementation intent:**
- Replace Step 3 and related report/mistake/red-flag text with exact plan-scope evidence.
- Keep missing CI as unknown, not green.
- Add targeted base reproduction after final L3 failure; do not add a second full baseline path.

**Commit:**

```bash
git add skills/using-git-worktrees/SKILL.md tests/execution-contracts/using-git-worktrees.test.mjs
git commit -m "feat: use selective worktree baselines"
```

---

### Task 8: Scope verification claims without weakening fresh evidence

**Purpose:** Make focused commands sufficient for focused claims while reserving whole-change claims for L3.

**Files/modules:**
- Modify: `skills/verification-before-completion/SKILL.md`
- Create: `tests/execution-contracts/verification-before-completion.test.mjs`

**Interfaces and dependencies:**
- Consumes: immutable spec section 9 at the spec pin plus Task 1 profile `verification-before-completion` for `successful-intermediate-wave` and `finalization`.
- Produces: a verification patch defining L1/L2/L3 claim vocabulary and `FULL command`. No Wave 1 sibling consumes this unintegrated patch.

**Constraints and invariants:**
- Preserve the Iron Law: no claim without fresh evidence for that exact scope.
- `FULL command` means the complete declared command without truncation, not an all-repository suite.
- A passing focused check must never support `all tests pass` or whole-change completion.

**Acceptance evidence:**
- RED/GREEN: `node tests/execution-contracts/verification-before-completion.test.mjs` fails on unqualified full-command/partial-evidence language, then passes.
- Pressure GREEN: five Lite repetitions for each of the two mapped cases report only task-local or affected-closure success before finalization and require passing L3 for whole-change completion.
- Profile validation: `node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite --profile verification-before-completion --case successful-intermediate-wave --case finalization` passes.

**Risk and rollback:** Over-broad claims undermine trust; over-broad commands recreate the cost problem. Task review is mandatory; rollback is its isolated patch/atomic canonical commit.

**Implementation intent:**
- Add a scope-selection step before command selection.
- Make the claim table distinguish L1, L2, and L3 evidence.
- Rewrite `partial proves nothing` rationalizations as `evidence outside the declared scope proves nothing`; keep all freshness and output-reading rules.

**Commit:**

```bash
git add skills/verification-before-completion/SKILL.md tests/execution-contracts/verification-before-completion.test.mjs
git commit -m "feat: scope verification evidence"
```

---

### Task 9: Reuse valid L3 evidence during branch finishing

**Purpose:** Prevent a duplicate repository-wide suite at the same verified state while rerunning whenever material state changes.

**Files/modules:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Create: `tests/execution-contracts/finishing-a-development-branch.test.mjs`

**Interfaces and dependencies:**
- Consumes: immutable spec sections 11-12 at the spec pin plus Task 1 profile `finishing-a-development-branch` for `same-state-finishing` and `material-invalidation`.
- Produces: a finishing patch defining evidence matching for pre-option finishing and retained post-merge verification. No Wave 1 sibling consumes this unintegrated patch.

**Constraints and invariants:**
- Reuse requires exact clean `HEAD`, exact command list, passing result, relevant tool/runtime versions, and hashes/identities for relevant non-secret external inputs.
- Never store secret values.
- Missing/failed evidence, dirty state, changed HEAD/base, command change, or source/test/build/dependency/fixture/environment change requires L3.
- Existing post-merge full verification remains because the merged state is a new material base.

**Acceptance evidence:**
- RED/GREEN: `node tests/execution-contracts/finishing-a-development-branch.test.mjs` fails on unconditional Step 1 suite execution and then passes.
- Pressure GREEN: five Lite repetitions for each of the two mapped cases reuse same-state evidence with one total L3 and rerun L3 only in the invalidation case with a cited material cause.
- Profile validation: `node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite --profile finishing-a-development-branch --case same-state-finishing --case material-invalidation` passes.

**Risk and rollback:** Stale reuse can ship unverified code. Task review is mandatory; rollback is its isolated patch/atomic canonical commit.

**Implementation intent:**
- Replace Step 1 with evidence validation followed by conditional L3.
- Define the minimal evidence record fields and state-bound freshness.
- Keep merge/PR options and cleanup unchanged.
- Keep post-merge verification and explicitly mark changed base/HEAD as its material cause.

**Commit:**

```bash
git add skills/finishing-a-development-branch/SKILL.md tests/execution-contracts/finishing-a-development-branch.test.mjs
git commit -m "feat: reuse final verification evidence"
```

---

## Wave 1 Patch Review, Admission, and Integration Gate

The controller performs this gate; no worker owns the canonical checkout or dispatches its own reviewer.

- [ ] Record `WAVE_BASE=$(git rev-parse HEAD)`, `WAVE_BASE_TREE=$(git rev-parse HEAD^{tree})`, and require `git status --short` to be empty before dispatch.
- [ ] Dispatch Tasks 2-9 in one parallel group with isolated worktrees, `failFast: true`, and concurrency four.
- [ ] Wait for every worker. Any failed, blocked, missing-output, or unresolved-concern result quarantines every wave artifact and integrates zero patches.
- [ ] After Pi captures each patch and removes its temporary worktree, confirm the required write patch is non-empty and that its task brief, implementer report, raw-output index, and complete profiled candidate evidence exist at controller-owned saved paths.
- [ ] Build one read-only review package per task from `WAVE_BASE`, the saved patch, brief, report, raw-output index, and evidence. Dispatch fresh independent reviewers from the controller; reviewers receive no write task. Wait for every verdict.
- [ ] Any Critical/Important finding, non-approval, or evidence mismatch quarantines all patches and integrates zero. Resolve the cause and redispatch a replacement wave from the unchanged clean base.
- [ ] After all reviews approve, enumerate every patch's added/modified/deleted/renamed paths and require them to be a subset of that task's ownership row.
- [ ] For each artifact, set `PATCH_FILE` to its absolute saved path and run `git apply --check "$PATCH_FILE"` against the frozen canonical base before applying any patch. Any failure rejects the complete set before application.
- [ ] Initialize an ordered `WAVE_COMMITS` ledger. Apply approved patches in Task 2 through Task 9 order. After each apply, run only its dedicated contract test, inspect the diff, create the specified atomic canonical commit, and append that SHA to `WAVE_COMMITS`.
- [ ] After all eight commits, run the union L2 commands:

```bash
for test_file in tests/execution-contracts/*.test.mjs; do node "$test_file" || exit 1; done
node tests/skill-contracts.test.mjs
```

Expected: all eight dedicated contract scripts and the existing cross-skill contract pass. This is the affected workflow closure, not package-wide L3.

### Canonical Recovery on Admission or L2 Failure

If a dedicated contract fails after the current patch is applied but before commit, first run `git apply --reverse --check "$PATCH_FILE"`, then `git apply --reverse "$PATCH_FILE"`, and require a clean status. Do not use `git reset --hard` or discard unrelated files.

If any prior wave commit exists when a task contract or union L2 fails, abandon the wave: revert each SHA in `WAVE_COMMITS` in reverse order with `git revert --no-edit`, stopping on any revert conflict. Then require:

```bash
test -z "$(git status --short)"
test "$(git rev-parse HEAD^{tree})" = "$WAVE_BASE_TREE"
```

Record the new clean `RETRY_BASE=$(git rev-parse HEAD)`; its tree must equal the original wave-base tree even though revert commits changed history. Diagnose and revise the failed boundary, task, or test, then redispatch all Wave 1 work from `RETRY_BASE`. Task 10 is forbidden until one complete revised wave passes admission, all task reviews, every dedicated contract, and union L2.

---

### Task 10: Register the integrated workflow and prove the affected closure

**Purpose:** Register all intentional upstream drift, expose the new contracts to package tests, document the workflow, and run integrated behavior without entering finalization.

**Files/modules:**
- Modify: `upstream-manifest.json`
- Modify: `package.json`
- Modify: `README.md`
- Create: `tests/execution-contracts/manifest-registration.test.mjs`
- Create: `tests/execution-contracts/run-all.mjs`

**Interfaces and dependencies:**
- Consumes: all admitted Tasks 2-9 commits, Task 1 validator/baseline, and the spec.
- Produces: manifest-complete package metadata, aggregate contract test registration, user documentation, and a valid 100-record baseline/Lite execution report.

**Constraints and invariants:**
- Do not edit any skill or Wave 1 domain contract test in this task.
- Every changed imported file gets `lite-modified`; preserve its original `upstreamHash`.
- `executing-plans/SKILL.md` moves from `pi-adapted` to `lite-modified` while retaining Pi-specific content.
- Do not run `npm test`, `tests/structure.test.mjs`, or `upstream:check` in this task.

**Acceptance evidence:**
- RED: create `tests/execution-contracts/manifest-registration.test.mjs`, then run it before metadata edits. It fails on stale statuses, missing aggregate script registration, and missing README/spec linkage.
- GREEN: after focused metadata/docs changes, `node tests/execution-contracts/manifest-registration.test.mjs` passes. It checks exactly the eleven expected path/status/original-upstream-hash entries, `package.json#files`, the single aggregate-script entry, and README linkage without traversing the full imported tree.
- L2 static closure: `node tests/execution-contracts/run-all.mjs`, `node tests/skill-contracts.test.mjs`, and `node tests/validate-execution-eval-report.test.mjs` all pass. Complete structure and upstream traversal remain L3.
- L2 behavior: five fresh Lite repetitions for every one of the ten cases combine with the preserved baseline into 100 records; every applicable profile result is present, the full-conjunction validator passes, and manual inspection finds no false-positive normalization.
- Size: the combined eight primary `SKILL.md` files are at most 8192 words and each file/prompt stays within its individual ceiling.

**Risk and rollback:** Manifest mistakes break parity or permit drift. Behavior gaps trigger one focused fix wave in the owning skill, renewed task-local evidence/review, and rerun of only affected integrated cases before this task can pass.

**Implementation intent:**
- In `manifest-registration.test.mjs`, pin the exact eleven path-to-original-`upstreamHash` pairs read from the untouched Task 1 base, then require those hashes to remain unchanged while statuses become `lite-modified`.
- Mark the eleven modified imported files listed in the spec as `lite-modified`.
- Create `tests/execution-contracts/run-all.mjs`: lexically enumerate sibling `*.test.mjs` files, exclude itself, import them sequentially, fail on the first rejected import, and print the exact executed count.
- Append `node tests/execution-contracts/run-all.mjs` to `package.json#scripts.test`; keep existing test order and append only once.
- Keep `evals/execution-cases.json` in the package allowlist and keep generated results excluded.
- Add a concise README section describing applicability, contract spine, patch waves, L0-L3, finalization-only L3, and scoped claims. Link the approved spec instead of copying it.
- Run all ten Lite cases with the same Task 1 settings. Preserve raw evidence, manually inspect all 50 outputs, merge normalized observations with the untouched 50-record baseline, and validate the 100-record report.

**Commit:**

```bash
git add upstream-manifest.json package.json README.md tests/execution-contracts/manifest-registration.test.mjs tests/execution-contracts/run-all.mjs
git commit -m "docs: register fail-first wave execution"
```

After commit, dispatch a fresh read-only Task 10 reviewer over the Task 10 base/diff, focused registration evidence, integrated 100-record report, and manual scoring notes. Critical or Important findings block finalization.

---

## Finalization Gate

Finalization starts only after Task 10 is committed, the canonical checkout is clean, the union L2 is green, no implementation task remains, and no blocking task-review finding is open.

- [ ] Record `L3_HEAD=$(git rev-parse HEAD)`, require `git status --short` to be empty, and capture the exact commands, Node/npm/Pi versions, and hashes or non-sensitive identities for relevant external inputs as the pre-run execution fingerprint.
- [ ] Run the first repository-wide L3 exactly here:

```bash
npm test
npm run typecheck
npm run upstream:check -- --source "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers"
node scripts/validate-execution-eval-report.mjs .superpowers/evals/fail-first-final.json
npm pack --dry-run --json
```

`npm test` owns package tests including complete structure traversal. Typecheck and the production pinned-upstream parity check are separate scripts and run exactly once here. Immediately before the parity command, require `git -C "C:/Users/mapleland/.pi/agent/git/github.com/obra/superpowers" rev-parse HEAD` to equal `d884ae04edebef577e82ff7c4e143debd0bbec99`.

Expected:

- every package test exits 0 with pristine output;
- TypeScript exits 0;
- upstream check reports zero additions, deletions, modifications, and manifest mismatches;
- the execution report contains exactly 100 valid records with every applicable profile result;
- the tarball includes both committed evaluation fixtures and excludes `.superpowers/` and generated result JSON.

- [ ] Immediately after each L3 command, require both `test "$(git rev-parse HEAD)" = "$L3_HEAD"` and `test -z "$(git status --short)"`. If either fails, that command did not produce reusable evidence: diagnose the tracked change, commit or reverse it deliberately, and restart L3 from a newly recorded state.
- [ ] Immediately before evidence capture, read `HEAD` and clean status again, recompute the tool/config/environment fingerprint, and require exact equality with the pre-run state. Only then write the ignored L3 evidence record with the verified state, command list/results, output summary, and timestamp.
- [ ] Generate a whole-change review package from `9560068b9e32c473a1072261e50e231cf3bcd6d3` through final `HEAD`.
- [ ] Dispatch independent oracle and reviewer inspections of the spec, plan, complete diff, static evidence, pressure reports, integrated behavioral report, L3 record, and residual risks.
- [ ] Critical or Important findings block completion. Apply all final findings in one consolidated fix wave, run focused L1/L2 for changed ownership, create a material-fix commit, rerun the full L3 because `HEAD` changed, and re-review with the new evidence.
- [ ] Run a fresh Pi process smoke that loads the modified skills from `D:/Projects/PiAgent/plugins/pi-superpowers-lite`; do not change active settings.
- [ ] Invoke `finishing-a-development-branch` only if a branch integration choice is needed. At unchanged verified `HEAD`, it must reuse the final L3 evidence instead of rerunning; a post-merge changed base must run L3 again.

## Plan Self-Review Mapping

- Spec sections 4-8: applicability, boundaries, DAG, native patch waves -> Tasks 2-6 and Wave 1 gate.
- Spec sections 9-10: L0-L3 and baseline attribution -> Tasks 1, 3, 6-8, and Task 10 L2.
- Spec sections 11-12: finalization, live effects, reusable L3 -> Tasks 4, 8, 9, and Finalization Gate.
- Spec sections 13-15: review, exact skill scope, static and behavioral tests -> all task reviews, Tasks 1-10, and final whole-change review.
- Spec acceptance criteria -> Task 10 plus Finalization Gate.

No implementation task invokes repository-wide L3. The only pre-final commands are dedicated contract tests, existing direct workflow consumers, a focused eleven-entry registration assertion, and fresh-context behavioral cases. Complete structure traversal, full upstream parity, package tests, typecheck, and tarball inspection appear only in the Finalization Gate.
