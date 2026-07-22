---
name: subagent-driven-development
description: Use for Full-route work when executing an approved implementation plan with independent tasks in the current session
---

# Subagent-Driven Development

## Overview

Execute an approved Full plan with isolated implementers, native patch handoffs, one canonical integrator, scoped verification, bounded risk review, and a mandatory final whole-branch review.

**Core principle:** parallelize only proved-independent writes; quarantine uncertainty; pay repository-wide verification once at finalization; review only where impact justifies the gate.

## Route Gate

Use this skill only for Full work with an approved spec and executable plan. Wave execution requires **two or more independently mergeable implementation units**. A single dependency chain stays inline through `executing-plans`; shared mutable ownership or an unsplit transactional invariant stays under one writer.

Standard work remains Inline without Full artifacts. Micro work never uses SDD.

## Pre-Flight

Read the plan once and create `.superpowers/sdd/progress.md`. Before dispatch:

- resolve plan/spec contradictions and missing selective commands;
- require reviewed, pinned high-risk contract spines before their consumers fan out;
- verify graph dependencies, `owns` sets, exact `mutableResources` identities, their same-wave isolation, and the named fail-first frontier;
- defer settings, migrations, deploys, destructive cutovers, and other live effects;
- record the branch start and exact clean `HEAD`, tree, and status.

Do not silently guess through a contradiction.

## Native Patch Waves

For each topological wave:

1. Freeze one clean wave base (`WAVE_BASE`, tree, and empty status). A **single canonical integrator** owns the real checkout.
2. Run every plan-declared L0 probe for the current frontier against that base. Record the command, result, and frontier identity. Failed or unavailable L0 means zero fanout: stop and re-plan before dispatch.
3. Extract one brief per task with exact `dependsOn`, `owns`, `mutableResources`, passed L0 evidence, risk, and declared L1. Only after L0 passes, dispatch one native parallel group with `worktree: true`; `failFast` is only an optimization.
4. Each implementer verifies the supplied L0 identity, runs task L1, self-review, and commits only owned paths. Native Pi destroys its temporary branch/worktree after capture; the native handoff is a **patch**, not a branch merge. Persistent-branch language applies only to separately managed worktrees.
5. Wait for every worker and captured patch. Any failed, blocked, missing, or unresolved worker quarantines the entire wave and **integrates zero** patches.
6. Before any patch is applied anywhere, preflight the complete set: every required patch is non-empty; changed paths are a subset of `owns`, including renames and deletions; same-wave write sets and exact `mutableResources` identities do not overlap; and `git apply --check` passes against the unchanged frozen base. Any mismatch integrates zero.
7. Complete the bounded risk review where required. Only impact-qualified Critical or Important findings block the whole wave; unsupported severity labels become `defer` or `reject`.
8. Apply approved patches in plan order on canonical. After each apply, run only its dedicated L1, inspect the diff, and make the declared atomic commit. A conflict, path drift, shared-resource collision, or contract mismatch triggers the recovery below, not ad-hoc conflict surgery.
9. Run the wave's **union L2** affected closure once.
10. On a **post-apply L1 failure before commit**, reverse-apply only the current uncommitted patch, then revert every earlier commit from this wave in reverse order without rewriting history.
11. On a **union-L2 failure after all wave patches are committed**, do not reverse-apply any patch. Revert every commit from this wave in reverse order without rewriting history.
12. For either recovery, stop on cleanup conflict; otherwise require clean status and the original `WAVE_BASE` tree before re-planning and redispatching the whole wave from a new clean base. Record commits and scoped evidence only for a passing wave; start the next wave only from clean state.

No task or intermediate wave runs repository-wide L3.

## Risk-Gated Task Review

Evaluate task-level risk from behavior and blast radius, not file count. Candidate protected boundaries include public/shared contracts, security/privacy, migrations, concurrency, ordering, or high blast radius, but a task-level review is dispatched only when the approved plan names that boundary as a pinned spine or proves it cannot safely be deferred to final review. Routine tasks do not dispatch a task reviewer; they still require implementer tests, self-review, a clean owned patch, and ledger evidence.

Each non-final review unit has at most two review passes: one initial review and one closure review. Send one review packet per pass. Do not serialize separate spec, privacy, test-quality, or style reviews for the same task. The closure packet freezes the initial finding IDs, exact fix diff, focused evidence, and adjacent regressions. It must not rediscover the whole task.

A reviewer finding blocks only when it is an impact-qualified Critical or Important finding tied to an acceptance ID or protected boundary, with a concrete failure scenario, observable behavior/data/security/public-contract impact, and proof that it cannot wait for L2, L3, or final review. Test completeness, speculative coverage, wording, metadata, and refactoring suggestions are non-blocking without that proof. The controller records `fix`, `defer`, or `reject`; reviewer labels alone do not block.

After closure, new non-Critical findings not introduced by the fix go to the final-review ledger. Reopen only for a demonstrated Critical regression, false evidence behind a disposition, or explicit route escalation. Task review never replaces the final whole-branch review.

## Implementer Dispatch

Pass artifact paths, not the full plan or session history. A brief names the frozen base, owned paths, exact `mutableResources` identities, controller-passed L0 evidence and frontier identity, exact declared L1, interfaces, report path, and model. The implementer must not run L2, package-wide, repository-wide, migration, deployment, or settings effects. It reports only task-local evidence and concerns.

Treat statuses explicitly: `SOURCE_READY`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`. Only `SOURCE_READY` with a complete report and patch may enter complete-set preflight. Never turn a failed dispatch into implied approval.

## Finalization and L3

Enter finalization only after all waves, union L2 checks, cleanup, and ledger entries pass with no unresolved findings. SDD owns the first repository-wide L3.

Run the exact declared L3 commands fail-first. On success, write a reusable evidence record bound to:

- clean HEAD, tree, and status before and after every command;
- exact commands and passing results;
- relevant tool/runtime versions;
- hashes or identities of relevant non-secret external inputs (never secret values).

Then dispatch one mandatory final whole-branch review from the recorded branch start through `HEAD`, including the spec, plan, commits, full diff, L1/L2/L3 evidence, known risk, and deferred live effects. The final gate has one initial pass, at most one consolidated fix wave, and one closure re-review. The closure scope is the accepted findings, fix diff, and regression evidence; unrelated non-Critical findings become deferred final-review risks. A confirmed Critical regression or false evidence may reopen the gate.

Run focused L1/L2 for accepted fixes. A source, test, build, dependency, command, base, or relevant environment change is **material invalidation**: rerun L3 once at the new clean state, then perform the bounded closure review with the new diff, remaining risk, and new evidence. Read-only review alone does not invalidate L3.

Live effects occur only after passing L3 and final approval. Run post-effect smoke evidence, then invoke `finishing-a-development-branch`, which may reuse the exact matching L3 record.

## Durable Progress and Handoffs

The ignored ledger is the recovery map. Record wave base, task/patch identities, commits, L1/L2 status, review decisions, L3 identity, and residual risk. Trust it and Git history after compaction.

Keep briefs, implementer reports, patch hashes, review packages, and large evidence in files. The controller owns synthesis and canonical writes.

## Red Flags

Never run parallel writers on overlapping paths, admit only part of a failed wave, merge a native temporary branch, call L1/L2 repository-wide completion, run early L3, skip required review, use `HEAD~1` as the whole-branch base, store secrets in evidence, or execute live effects before the final gates.
