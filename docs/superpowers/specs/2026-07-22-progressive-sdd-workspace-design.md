# Progressive SDD Workspace Design

**Status:** Approved design, pending written-spec confirmation
**Date:** 2026-07-22
**Baseline:** `13a87ba6796b353a405dd02fc15d5afe9ccfa3f9`

## Purpose

Separate stable authority from derived execution state. Durable documents say what must be true; the controller inspects current code and chooses one execution frontier at a time, including whether parallelism has enough net benefit to justify its coordination cost.

This design adds filesystem structure while removing implementation prediction from specifications. It preserves Full routing, protected contracts, native patch admission, L0-L3 verification, rollback, scoped claims, bounded final review, and reusable state-bound L3 evidence.

For new Full work it overrides older defaults that require a complete implementation-unit map in the spec, a committed static task graph from `writing-plans`, or copied plan/authority/correction briefs. Legacy specs and plans remain readable inputs.

## Problem

The current workflow is schema-heavy but filesystem-light:

```text
spec -> plan -> task brief -> authority -> correction -> review packet
```

Each translation can omit or reinterpret a requirement. A recent Full run accumulated six authority files and 177 evidence files while successive candidates still missed mandatory production boundaries. Longer briefs did not fix task size, acceptance mapping, or stale-authority selection.

The workflow needs four explicit classes:

1. durable authority;
2. current derived execution state;
3. evidence;
4. immutable superseded history.

## Goals and Non-Goals

Goals:

- one durable authority directory per Full objective;
- minimal intent plus contracts only where consumers need stability;
- one task card as the worker's sole instruction artifact;
- only the current frontier planned;
- runtime Inline/Parallel choice based on current evidence and net benefit;
- machine-readable current/superseded identity;
- one structured evidence record per gate by default;
- one review budget for all readiness adjudicators;
- mandatory re-decomposition after two core-contract candidate failures.

Non-goals:

- removing Full routing or final review;
- letting workers change product intent or protected contracts;
- building a scheduler extension, classifier UI, or numeric parallelism score;
- persisting every command output or model transcript;
- automatically migrating historical or active runs.

## 1. Durable Authority

New Full objectives use:

```text
docs/superpowers/work/<feature>/
  README.md
  intent.md
  contracts/       # only when needed
  decisions/       # only when needed
```

### README.md

The index records the feature identity, short description, authority status (`draft`, `approved`, `superseded`, or `retired`), links, and replacement authority when superseded. It does not carry active tasks, waves, progress, test results, or evidence paths.

The runtime manifest binds the approved Git commit and content hashes; the README does not attempt to embed its own commit identity.

### intent.md

The minimal specification contains:

- intent and user-observable outcome;
- acceptance entries with stable IDs;
- hard constraints and non-goals;
- protected invariants;
- authorization boundaries for live or destructive effects.

It excludes task lists, DAGs, waves, speculative implementation paths, ordinary implementation steps, model/reviewer allocation, runtime evidence names, and predicted parallel boundaries. An exact path is durable authority only when the path itself is a user-granted closed scope or protected boundary.

### contracts/

Create a contract only for a public API, shared data format, security boundary, migration, or concurrency/ordering invariant that consumers must not reinterpret. It describes observable semantics or machine schema, not implementation. Consumers bind its Git blob or content hash. Compatibility transitions are additive or versioned while old consumers remain active.

### decisions/

Create an ADR only when multiple reasonable choices exist, the choice constrains future work, and final code will not preserve the reason. Review findings and temporary serial/parallel choices stay in runtime state.

### Identity and Amendment

A run binds the authority path, approved commit, `intent.md` hash, and consumed contract hashes. Changing authority invalidates every unexecuted derived frontier/task. Historical evidence remains history but cannot prove the new authority.

Task decomposition and execution mode changes do not amend authority. Runtime discovery that changes product semantics, a protected invariant, or a protected contract stops for one explicit amendment and user approval.

## 2. Dynamic Workspace

Every Full execution creates a Git-ignored root:

```text
.superpowers/work/<run-id>/
  manifest.json
  frontiers/
    F001-<slug>/
      frontier.md
      frontier.json
      tasks/
        T001.md
      handoffs/
        T001/
      evidence/
        l0/
        l1/
        l2/
  finalization/
    evidence/
    reviews/
```

### manifest.json

This is the sole runtime entry point. It records run ID, authority identity, frozen run base, current frontier, completed/blocked/superseded frontiers, canonical HEAD and clean-state identity, unresolved protected risks, and finalization status.

There is no separate `progress.md`. Recovery reads the manifest, current frontier, and only referenced contracts.

### Frontier Files

`frontier.md` answers only:

1. Why now?
2. What observable boundary closes?
3. What assumptions must L0 disprove?
4. Serial or parallel, and why?
5. What ends or invalidates this frontier?

`frontier.json` is the controller-owned executable index: base and authority identity, mode, task cards, ownership/resource sets, exact L0/L1/L2 commands, protected acceptance mappings, status, and invalidation reason. It predicts no later frontier.

Lifecycle:

```text
derived -> l0-passed -> dispatched|inline -> source-ready
-> admitted -> l2-passed -> completed
```

`blocked` and `superseded` are immutable historical states. The manifest points to exactly one current frontier, and workers never receive superseded frontiers as current input.

## 3. writing-plans Becomes Workspace Initialization

`writing-plans` remains the thinking boundary after intent approval, but no longer writes or commits a complete implementation plan. It:

1. reads approved authority;
2. inspects current code and tests;
3. records a selective baseline;
4. selects the highest-value earliest verifiable frontier;
5. chooses Inline or Parallel for that frontier;
6. initializes the manifest, frontier, and task cards;
7. hands off to SDD or `executing-plans`.

It does not promise task count or precompute later waves. After each frontier, the controller derives the next one from the new canonical state without returning to a durable planning gate unless authority changes.

## 4. Parallelism and Task Cards

Parallelism is a runtime optimization. Choose Parallel only when current evidence shows:

- at least two independently useful outcomes;
- disjoint writes and mutable resources;
- stable consumed interfaces or a completed contract spine;
- independent focused L1 checks;
- material critical-path reduction;
- coordination, worktree, patch-admission, and union-L2 cost below expected savings.

Record a qualitative rationale, not a score. When independence or benefit is unclear, choose Inline. Never split a transaction or manufacture tasks to satisfy a DAG.

One task card is the worker's sole instruction artifact. It contains observable outcome, frozen base, authority/contract hashes, owned paths, actual mutable resources, consumed/produced interfaces, controller-passed L0, exact L1, stop conditions, and handoff path. It does not copy the full intent or history, and new runs do not create separate authority briefs.

A hidden dependency returns `NEEDS_CONTEXT`; the worker does not widen scope.

## 5. Dispatch and Evidence

Before dispatch, the controller verifies:

- every reference and hash;
- each mandatory path has one owner;
- parallel path/resource sets are disjoint;
- each task has focused L1;
- each protected acceptance maps to a real production entry point or controller-owned probe;
- no gap exists between allowlist, acceptance, and verification.

Worker self-report is not authority. Routine behavior may use implementer TDD. Protected or previously false-positive boundaries require a controller-frozen probe before dispatch.

Each gate produces one structured record by default:

```text
evidence/l0/record.json
evidence/l1/<task-id>.json
evidence/l2/record.json
finalization/evidence/l3.json
```

A record binds command/result, scope-qualified claim, HEAD/tree/status, authority identity, relevant non-secret fingerprints, attempts, and optional raw-output hash/path. Save raw output only for diagnosis, contractual inspection, or cross-session independent evidence. Do not create duplicate log/JSON/status/manifest files for one command.

L0 remains pre-dispatch assumption proof, L1 task-local, L2 frontier affected closure, and L3 repository-wide finalization.

## 6. Execution and Recovery

SDD and Inline Execution consume the same frontier format.

Parallel SDD retains frozen-base writers, complete-set preflight, disjoint ownership/resources, one canonical integrator, atomic commits, union L2, and zero partial integration after a failed frontier. Inline uses one writer with the same L0, task L1, terminal frontier L2, and scope labels.

Recovery:

- hidden dependency: supersede, integrate zero, and rederive;
- local defect with a valid boundary: create a small correction frontier, optionally referencing the failed diff;
- invalid foundational boundary: preserve the patch as forensic history and derive from a clean base;
- two rejected candidates for one frontier due core-contract failure: prohibit a third same-shape rebuild and require re-decomposition, a smaller acceptance boundary, or a prior contract/probe frontier.

A finding that changes product semantics or a protected contract requires authority amendment. An implementation-only finding creates a correction frontier. Historical task cards are not rewritten into `authority-v2` documents.

## 7. Review and Finalization

Routine frontiers have no task review. Independent review is reserved for a protected contract before consumers and the final whole change.

Any independent agent asked to decide readiness, acceptance, mandatory rework, or integration counts against the same review budget, whether named Reviewer, Oracle, analyst, or adjudicator. Each review unit allows one initial packet, one consolidated fix frontier, and one closure packet. Existing impact-qualified blocking and deferred-risk rules remain.

Finalization begins only after all durable acceptance IDs are mapped and satisfied, latest L2 is green, canonical state is clean, and no protected blocker remains. It runs one L3, writes state-bound evidence, performs final review, expresses accepted fixes as one correction frontier, reruns invalidated focused evidence and L3 only after material change, then permits approved live effects and post-effect smoke.

Matching L3 evidence remains reusable when HEAD, tree, status, commands, tools, and relevant fingerprints are unchanged.

## 8. Migration and Bootstrap

- New Full objectives default to `docs/superpowers/work/<feature>/`.
- Legacy specs and plans remain valid inputs and are not bulk-renamed.
- A legacy plan may initialize one run, but is not copied into every task card.
- Active legacy runs do not change layout or evidence semantics mid-run.
- A legacy run enters the new model only through an explicit safe-boundary restart.

For this feature's self-hosting implementation, after this written spec is confirmed the controller may invoke `writing-plans` to initialize the new ignored workspace directly from this approved spec even though the installed skill still describes a committed static plan. This approved design controls that bootstrap; no legacy static plan document is required.

## 9. Implementation Surface

Expected changes are limited to workflow skills, prompts, README, manifest classifications, and focused execution-contract tests:

- `brainstorming` and spec review;
- `writing-plans` and frontier review;
- `subagent-driven-development`, implementer, and task review;
- `executing-plans`;
- `requesting-code-review` where adjudication counting applies;
- `using-superpowers` Full handoff.

No Pi extension lifecycle, TodoWrite/Skill runtime, upstream sync, classifier UI, scheduler, or behavioral evaluator is required. References to unavailable `scripts/task-brief` and `scripts/review-package` must be removed or replaced with real templates.

## 10. Acceptance

Focused contracts must prove:

1. new Full authority uses the feature directory and minimal intent model;
2. brainstorming no longer requires per-unit implementation ownership in durable specs;
3. writing-plans initializes only the current ignored workspace/frontier;
4. SDD and Inline consume the same frontier/task-card contract;
5. no separate authority brief is generated;
6. Parallel requires demonstrated independence and net benefit, with Inline fallback;
7. manifest/supersession prevents stale artifacts becoming current;
8. one structured record per gate is the default;
9. readiness/admission adjudicators share the review budget;
10. two core-contract candidate failures force re-decomposition;
11. legacy inputs remain supported without automatic migration;
12. package references resolve to real files or templates.

## Risks

- **Runtime ambiguity:** protected intent/contracts remain durable, and dispatch must map acceptance to real entry points.
- **Repeated replanning:** one manifest pointer and immutable history preserve progress; correction frontiers may reuse valid local work.
- **Architecture drift:** product or protected-contract changes require authority amendment and approval.
- **Artifact growth:** one record per gate, raw logs only when needed, no duplicate progress or authority briefs.
- **Excessive serial execution:** every frontier records the qualitative net-benefit decision and may become Parallel as soon as independence is demonstrated.
