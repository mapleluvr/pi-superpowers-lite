# Fail-First Wave Execution Design

**Date:** 2026-07-19
**Status:** Approved for implementation planning
**Package:** `@mapleluvr/pi-superpowers-lite`
**Base design:** `docs/superpowers/specs/2026-07-12-pi-superpowers-lite-design.md`

## 1. Purpose

The current Lite router reduces ceremony before work starts, but Full execution can
still repeat repository-wide verification during worktree setup, after each task,
after each parallel batch, and again during branch finishing. It also describes
Full work mostly as a serial task list, so it does not require boundaries that make
large changes safe to implement concurrently.

This increment makes cohesive large Full work lighter by designing for independent
failure, isolated parallel writers, atomic integration, and selective intermediate
verification. Repository-wide verification becomes a finalization-only gate.

This document overrides the base design wherever the two conflict. Micro and
Standard routing semantics do not change.

## 2. Goals

1. Design component and interface boundaries before decomposing large work.
2. Put the highest-uncertainty or highest-risk proof before broad implementation.
3. Express independently mergeable work as a dependency graph and parallel waves.
4. Keep one writer per worktree and one integrator in the canonical checkout.
5. Make each implementation task independently testable, mergeable, and revertible.
6. Run only task-local and affected-closure validation before finalization.
7. Run repository-wide validation only at the final whole-change gate and after a
   later material change invalidates that evidence.
8. Preserve TDD for behavior changes, mandatory verification, risk-triggered task
   review, mandatory final review, and post-effect smoke checks.

## 3. Non-Goals

- No runtime task classifier, dependency analyzer, scheduler, or test selector.
- No requirement to parallelize a single dependency chain.
- No artificial components created only to increase concurrency.
- No weakening of transactional, security, migration, concurrency, or shared-state
  ownership boundaries.
- No change to Micro or Standard route selection.
- No removal of the final Full review or branch-finishing safety checks.

## 4. Applicability

The task-graph and wave contract applies only when one cohesive Full objective has
at least two independently mergeable implementation units.

A Full task with one dependency chain keeps the concise intent-level plan. It still
uses the validation levels and finalization rules in this document, but does not
need a synthetic DAG table or parallel dispatch.

Tightly coupled state and transactional invariants remain one ownership boundary.
The model must not split them merely to produce more tasks.

## 5. Boundary-First Design

Before naming implementation tasks, brainstorming records a boundary map for the
large Full objective:

- component or interface name;
- single responsibility;
- owned paths or generated artifacts;
- stable public or internal contract;
- producers and consumers;
- mutable external resources used by tests or execution;
- focused verification surface;
- reversibility or compatibility strategy.

A unit is eligible for independent implementation only when it has a stable input
contract, a disjoint write set, a focused verification surface, and no uncoordinated
shared mutable resource.

### 5.1 Contract Spine

If a shared interface is not stable, a sequential contract-spine wave precedes
fan-out. It defines the smallest contract, fixture, schema, type surface, mock, or
compatibility shim that lets dependents work independently.

A contract spine that affects a public/shared API, security boundary, migration,
or concurrency contract must pass an independent risk review before fan-out.
Dependents pin the reviewed contract by commit, schema version, or content hash.
Any later contract change invalidates all dependent in-flight waves and requires
re-planning from a new clean base.

Destructive contract transitions use additive or compatibility phases so every
intermediate canonical state remains selectively buildable, testable, and
revertible. Final cutover is a finalization activity.

## 6. Fail-First Planning

Fail-first has two meanings:

1. **Work ordering:** Put the probe most likely to disprove the architecture before
   broad implementation. Examples include protocol compatibility, dependency
   behavior, build feasibility, migration dry runs, or a risky concurrency contract.
2. **Validation ordering:** Run the cheapest deterministic high-signal check first
   and stop when it fails. Do not continue to a more expensive validation level.

Every large plan names its fail-first frontier and the evidence required to cross
it. A failed frontier stops fan-out and returns to design or planning.

Fail-first does not replace TDD. Behavioral RED/GREEN evidence remains part of L1.

## 7. Execution Graph

A qualifying plan contains one compact graph table with these fields:

| Field | Meaning |
|---|---|
| `task` | Stable task identifier and atomic outcome |
| `wave` | Topological execution wave |
| `dependsOn` | Tasks or reviewed contract pins required first |
| `owns` | Exact paths or bounded path patterns this task may write |
| `produces` | Interface, artifact, patch, or behavior emitted |
| `consumes` | Frozen inputs, contracts, fixtures, or predecessor outputs |
| `risk` | Boundary that controls review and escalation |
| `L1` | Exact task-local commands and expected evidence |
| `L2` | Affected-closure membership and commands after integration |

Tasks in the same wave must have:

- no dependency path between them;
- disjoint `owns` sets, including generated files;
- immutable or pinned shared inputs;
- isolated ports, databases, temp paths, caches, and other mutable resources;
- no order-dependent integration semantics.

A task outcome is atomic when it can be applied, verified, and reverted without a
half-installed handshake with a sibling. Atomicity describes the deliverable and
canonical commit boundary; it does not require the worker to use exactly one local
commit.

## 8. Pi Parallel Execution

### 8.1 Ownership Model

- The canonical checkout has one integrator writer.
- Each parallel implementer receives an isolated worktree.
- All worktrees in one wave start from the same clean, frozen canonical `HEAD`.
- The next wave cannot start until the previous wave is integrated, selectively
  verified, committed, and the canonical checkout is clean.

When Pi native `subagent` execution uses `worktree: true`, the handoff is a captured
patch. The temporary worktree and branch are deleted after capture. The workflow
must not describe that handoff as a branch merge.

Separately managed persistent worktrees may use ordinary branch integration, but
they must satisfy the same base, ownership, and validation contracts.

### 8.2 Wave Completion and Quarantine

Use `failFast: true` when the selected Pi parallel-group form exposes it. It reduces
wasted work but is not a rollback mechanism; already-running siblings may finish.

A wave is worker-successful only when every dispatched implementation task reports
successful execution and satisfies its task acceptance. `BLOCKED`,
`NEEDS_CONTEXT`, execution failure, missing required output, or unresolved
`DONE_WITH_CONCERNS` fails the wave.

If any worker fails:

1. wait for or stop the remaining wave according to runtime state;
2. quarantine every patch from that wave;
3. integrate zero patches;
4. diagnose the failed boundary or task;
5. revise the graph or task brief if independence was false;
6. redispatch from the unchanged clean canonical `HEAD`.

### 8.3 Native Patch Admission

Before applying any patch from a worker-successful native wave, the integrator must:

1. require a non-empty patch for every task that declared writes;
2. enumerate added, modified, deleted, and renamed paths;
3. verify every changed path is a subset of that task's `owns` declaration;
4. run `git apply --check` against the frozen canonical wave base for every patch;
5. reject the whole patch set before application if any admission check fails.

After all patches pass admission, the integrator applies them one at a time in a
stable topological order, runs the patch's contract checks, and records each
accepted task as an atomic canonical commit. After the whole wave is present, the
integrator runs the union L2 affected closure.

A patch conflict, write-set drift, shared-resource collision, or contract mismatch
proves the independence assumption false. The integrator stops and re-plans instead
of improvising cross-task changes.

## 9. Validation Levels

### L0: Contract or Probe

The cheapest evidence that can disprove an assumption before implementation:
parse/load checks, schema checks, toolchain probes, interface compilation, migration
dry runs, or focused reproduction.

### L1: Task-Local

The exact evidence owned by one task:

- behavioral RED/GREEN when TDD applies;
- focused unit or contract tests;
- task-local type, lint, parse, or build checks;
- direct contract consumers needed to establish the task outcome.

L1 supports only the claim: `task-local checks passed`.

### L2: Affected Closure

The integrated changed units and the conservative dependency closure that can be
selected without becoming repository-wide verification.

Every plan must state:

- how the closure was derived;
- included packages, modules, reverse consumers, and shared build/config surfaces;
- exact commands and filters;
- why excluded areas cannot observe the change.

Preferred evidence comes from workspace/package graphs, project references, build
graphs, import graphs, and test-ownership metadata. Without reliable graph data,
the conservative fallback is the changed component, direct consumers, contract
tests, changed-package build/typecheck, and every shared config surface touched.

If no trustworthy selective boundary or focused command exists, the task is not
independently verifiable. The plan must create a focused harness, redesign the
boundary, or defer the unit to final integration. It must never relabel an
all-repository command as L2.

L2 supports only the claim: `affected closure passed`.

### L3: Repository-Wide

The complete repository-wide test/build/validation commands declared for final
delivery. L3 is prohibited before finalization for large Full work.

Only a passing L3 supports `repository-wide tests pass` and whole-change completion.

In `verification-before-completion`, "run the FULL command" means run the declared
scoped command completely and without truncation. It does not mean run L3 at every
completion boundary.

## 10. Baseline Attribution

Removing an early full-suite baseline must not turn unknown baseline health into a
claim of cleanliness.

Before implementation:

1. record the frozen base SHA;
2. record available CI status without treating missing CI as green;
3. run the plan's L0-L2 commands against the untouched base;
4. label the result `selective baseline`, never `repository globally clean`.

If final L3 exposes a failure, reproduce that specific failing command or test
against the frozen base in an isolated worktree before attributing it to the change.
Do not run a new full baseline suite merely for attribution.

## 11. Finalization

Finalization begins only when:

- every planned implementation wave is integrated;
- the final union L2 is green;
- no implementation task remains;
- no blocking review finding remains;
- the canonical checkout is in the intended final integration state.

SDD or the selected Full execution path owns the first L3 at this gate. A failed L3
stops completion and enters targeted systematic debugging. More L3 runs occur only
after a material correction or state change invalidates the prior evidence; there
is no arbitrary maximum run count.

Material causes include source, tests, build configuration, dependencies, fixtures,
toolchain/environment inputs, dirty-state cleanup, or integration into a changed
base. A read-only review with no execution-relevant change is not a material cause.

If final review produces a fix, run focused L1/L2 evidence for that fix, then run a
fresh L3 and re-review as required by the existing Full review contract.

### 11.1 Live Effects

Live migration, destructive operation, active-settings change, deployment, or
externally visible security/permission change occurs only after L3 is green and the
mandatory final review approves the exact change. L0-L2 may use disposable fixtures
and dry runs. After the live effect, run focused post-effect smoke evidence.

## 12. Reusable L3 Evidence

The first passing final-gate L3 emits an evidence record containing:

- exact Git `HEAD`;
- confirmation that the worktree was clean;
- exact full-suite commands and exit results;
- relevant tool/runtime versions;
- hashes of relevant non-secret external config/environment inputs;
- output summary and the point at which evidence was captured.

Secret values are never stored. Where a secret affects execution, record only a
one-way hash or a non-sensitive identity/version marker.

`finishing-a-development-branch` may reuse this evidence only when the current
`HEAD`, clean state, command list, and execution fingerprint all match and the
prior result passed. Missing, failed, stale, or mismatched evidence requires a new
L3. A new base or post-merge HEAD invalidates prior evidence, so the existing
post-merge repository-wide verification remains valid.

Freshness is state-bound, not a time-to-live heuristic.

## 13. Review Semantics

- Risk-triggered task review remains unchanged for ordinary tasks.
- A high-risk contract spine must be independently approved before fan-out.
- Reviewers use implementer L1 evidence and run only doubt-driven focused checks.
- Wave integration uses L2, not L3.
- Final whole-change review remains mandatory and receives the passing L3 evidence.
- Important or Critical findings still block progression.

## 14. Skill and Prompt Changes

The implementation changes the smallest set that currently owns the conflicting
behavior:

| File | Required change |
|---|---|
| `skills/brainstorming/SKILL.md` | Boundary map, contract-spine, fail-first design |
| `skills/brainstorming/spec-document-reviewer-prompt.md` | Review decomposition safety and non-artificial boundaries |
| `skills/writing-plans/SKILL.md` | DAG/waves, ownership, L0-L3, finalization section |
| `skills/writing-plans/plan-document-reviewer-prompt.md` | Validate graph, closure derivation, commands, and no early L3 |
| `skills/subagent-driven-development/SKILL.md` | Wave dispatch, patch admission, quarantine, L1/L2/final L3 |
| `skills/subagent-driven-development/implementer-prompt.md` | Task-local evidence only; remove per-task full suite |
| `skills/dispatching-parallel-agents/SKILL.md` | Implementation waves and affected-closure integration |
| `skills/executing-plans/SKILL.md` | Execute eligible waves and scoped checkpoints |
| `skills/using-git-worktrees/SKILL.md` | Selective base evidence; no generic full baseline |
| `skills/verification-before-completion/SKILL.md` | Scope-qualified claims and FULL-command clarification |
| `skills/finishing-a-development-branch/SKILL.md` | Reuse valid L3 evidence and rerun only on invalidation |

`requesting-code-review`, `task-reviewer-prompt.md`, and the final review requirement
already match the proportional policy and do not change.

Every imported upstream file changed by this increment becomes `lite-modified` in
`upstream-manifest.json`. `executing-plans/SKILL.md` retains its Pi-specific content
but moves from `pi-adapted` to `lite-modified` because it now changes workflow
semantics.

## 15. Tests and Behavioral Evaluation

### 15.1 Static Contracts

Tests must reject:

- a generic repository-wide baseline in `using-git-worktrees`;
- per-task full-suite instructions in SDD or its implementer prompt;
- full-suite-after-batch instructions in parallel dispatch;
- any definition of `FULL command` as mandatory L3;
- native Pi worktree handoff described as branch merge;
- a writing task with an admitted empty patch;
- changed paths outside `owns`;
- modified upstream files left out of the manifest classification.

Tests must require L0-L3 definitions, finalization criteria, affected-closure
derivation, patch admission, failed-wave quarantine, scoped claims, and reusable L3
evidence.

### 15.2 Fresh-Context Cases

Behavioral cases cover:

1. stable disjoint components -> isolated parallel wave;
2. unstable shared interface -> reviewed contract-spine before fan-out;
3. overlapping paths or mutable test resource -> sequential ownership;
4. failed worker -> zero patch integrations and no L3;
5. successful intermediate wave -> L2 only and scope-limited claim;
6. missing focused command -> redesign or focused harness, never early L3;
7. finalization -> first L3 only after every wave and green L2;
8. read-only final review at the same state -> no duplicate L3 during finishing;
9. material final fix or fingerprint change -> new L3;
10. live migration/settings/deployment -> effect only after L3 and final approval.

The evaluator mechanically checks at least:

- `fullSuiteCallsBeforeFinalization === 0`;
- same-wave ownership sets are disjoint and dependencies are satisfied;
- native isolated writers return patch handoffs;
- failed waves have zero integration events;
- intermediate claims use `task-local` or `affected closure`;
- final completion follows passing L3 evidence;
- every later L3 references an intervening material-cause event.

## 16. Acceptance Criteria

The increment is accepted when:

1. Oracle and reviewer approve this design and its implementation plan.
2. All listed skills and prompts implement the approved semantics.
3. No intermediate workflow path deliberately invokes repository-wide L3.
4. Native wave integration uses patch admission, ownership validation, and
   failed-wave quarantine.
5. Plans derive exact L2 scope and commands or reject the decomposition.
6. Baseline attribution never claims global cleanliness from selective evidence.
7. High-risk shared contracts are reviewed and pinned before fan-out.
8. Finalization gates all live effects behind green L3 and final review.
9. Valid same-state L3 evidence is reused by branch finishing.
10. Static contracts, fresh-context cases, typecheck, parity, package tests, and a
    final whole-package L3 pass.
11. A final independent whole-change review has no unresolved Important or Critical
    finding.

## 17. Residual Risks

- Repositories without reliable dependency metadata require conservative manual L2
  derivation and may offer less parallelism.
- Semantically interacting patches can pass independently and fail only at wave L2.
- Deferring L3 can make a true cross-repository failure more expensive to discover.
  Frozen-base attribution and conservative closures reduce but do not remove this
  risk.
- Execution fingerprints can omit an external influence; uncertain inputs invalidate
  reuse rather than being assumed unchanged.
