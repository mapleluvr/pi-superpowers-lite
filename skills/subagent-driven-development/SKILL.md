---
name: subagent-driven-development
description: Use for Full-route work when a current dynamic frontier requires isolated parallel implementation
---

# Subagent-Driven Development

## Overview

Execute one current Full frontier with isolated implementers, native patch handoffs, one canonical integrator, scoped verification, bounded risk review, compact evidence, and a mandatory final whole-branch review.

**Core principle:** parallelize only proved-independent writes; quarantine uncertainty; pay repository-wide verification once at finalization; review only where impact justifies the gate.

## Route Gate

Use this skill only with approved durable authority and `.superpowers/work/<run-id>/manifest.json`. Read `manifest.json` once; it must name exactly one current frontier. Load that frontier's `frontier.md`, `frontier.json`, and task cards under `tasks/T*.md`. Do not consume legacy plans, authority summaries, or copied session history as execution authority.

Parallel SDD requires frontier mode `Parallel`, two or more independently useful outcomes, disjoint `owns` and `mutableResources`, stable consumed interfaces, focused L1 checks, and net benefit after coordination, worktree, patch-admission, and frontier L2 cost. A single dependency chain stays inline through `executing-plans`; shared mutable ownership or an unsplit transactional invariant stays under one writer.

Standard work remains Inline without Full artifacts. Micro work never uses SDD.

## Pre-Flight

Before dispatch:

- verify manifest/frontier authority hashes, frozen base, current `HEAD`, tree, and clean status;
- run L0 for the current frontier exactly as declared in `frontier.json`; record command, result, base, and frontier identity;
- Failed or unavailable L0 means zero fanout: stop and rederive before dispatch;
- verify every task card, `owns` set, exact `mutableResources` identity, dependency, acceptance mapping, and declared L1;
- defer settings, migrations, deploys, destructive cutovers, and other live effects.

Only after L0 passes, dispatch. Do not silently guess through a contradiction.

## Native Patch Frontiers

For one current frontier:

1. Freeze one clean frontier base (`FRONTIER_BASE`, tree, and empty status). A **single canonical integrator** owns the real checkout.
2. Dispatch each implementation task card in one native parallel group with `worktree: true`; `failFast` is only an optimization.
3. Each implementer verifies the supplied manifest, frontier, base, ownership, `mutableResources`, and passed L0 identity; runs exact L1 and self-review; then leaves only owned changes for native patch capture. Native Pi destroys its temporary branch/worktree after capture; the native handoff is a **patch**, not a branch merge. Persistent-branch language applies only to separately managed worktrees.
4. Wait for every worker and captured patch. Any failed, blocked, missing, or unresolved worker quarantines the entire frontier and **integrates zero** patches.
5. Before any patch is applied anywhere, preflight the complete set: every required patch is non-empty; changed paths are a subset of `owns`, including renames and deletions; same-frontier write sets and exact `mutableResources` identities do not overlap; and `git apply --check` passes against the unchanged frozen base. Any mismatch integrates zero.
6. Complete bounded risk review where required. Only impact-qualified Critical or Important findings block the frontier; unsupported severity labels become `defer` or `reject`.
7. Apply approved patches in frontier task order on canonical. After each apply, run only its dedicated L1, inspect the diff, and make the declared atomic commit. A conflict, path drift, shared-resource collision, or contract mismatch triggers recovery below, not ad-hoc conflict surgery.
8. Run the frontier L2 affected closure once.
9. On a **post-apply L1 failure before commit**, reverse-apply only the current uncommitted patch, then revert every earlier commit from this frontier in reverse order without rewriting history.
10. On a **frontier L2 failure after all frontier patches are committed**, do not reverse-apply any patch. Revert every commit from this frontier in reverse order without rewriting history.
11. For either recovery, stop on cleanup conflict; otherwise require clean status and the original `FRONTIER_BASE` tree before rederiving and redispatching from a new clean base. Record commits and scoped evidence only for a passing frontier.

No task or intermediate frontier runs repository-wide L3.

## Risk-Gated Task Review

Evaluate task-level risk from behavior and blast radius, not file count. Candidate protected boundaries include public/shared contracts, security/privacy, migrations, concurrency, ordering, or high blast radius, but a task-level review is dispatched only when the current frontier names that boundary as a pinned spine or proves it cannot safely be deferred to final review. Routine tasks do not dispatch a task reviewer; they still require implementer tests, self-review, a clean owned patch, and structured gate evidence.

Each non-final review unit has at most two review passes: one initial review and one closure review. Send one packet per pass. Do not serialize separate spec, privacy, test-quality, or style reviews for the same task. The closure packet freezes initial finding IDs, exact fix diff, focused evidence, and adjacent regressions. It must not rediscover the whole task.

A reviewer finding blocks only when it is an impact-qualified Critical or Important finding tied to an acceptance ID or protected boundary, with a concrete failure scenario, observable behavior/data/security/public-contract impact, and proof that it cannot wait for L2, L3, or final review. Test completeness, speculative coverage, wording, metadata, and refactoring suggestions are non-blocking without that proof. The controller records `fix`, `defer`, or `reject`; reviewer labels alone do not block.

After closure, new non-Critical findings not introduced by the fix go to final review. Reopen only for a demonstrated Critical regression, false evidence behind a disposition, or explicit route escalation. Task review never replaces the final whole-branch review.

## Implementer Dispatch

Pass artifact paths, not full authority or session history. A task card names the frozen base, owned paths, exact `mutableResources` identities, controller-passed L0 evidence and frontier identity, exact declared L1, consumed/produced interfaces, and report path. The implementer must not run L2, package-wide, repository-wide, migration, deployment, settings, or other live effects. It reports only task-local evidence and concerns.

Treat statuses explicitly: `SOURCE_READY`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`. Only `SOURCE_READY` with a complete report and patch may enter complete-set preflight. Never turn a failed dispatch into implied approval.

## Dynamic Recovery and Evidence

A hidden dependency supersedes the current frontier, integrates zero patches, and rederives from canonical state. A local defect with a valid boundary creates a small correction frontier, optionally referencing the failed diff. An invalid foundational boundary preserves the patch as forensic history and rederives from a clean base. Two rejected candidates for one frontier due core-contract failure force re-decomposition, a smaller acceptance boundary, or a prior contract/probe frontier before another attempt.

Use one structured record per gate by default:

```text
evidence/l0/record.json
evidence/l1/<task-id>.json
evidence/l2/record.json
finalization/evidence/l3.json
```

Each record binds command/result, scope-qualified claim, `HEAD`/tree/status, authority identity, relevant non-secret fingerprints, attempts, and optional raw-output hash/path. Save raw output only for diagnosis, contractual inspection, or cross-session independent evidence. Do not create duplicate log, JSON, status, or manifest files for one command.

## Finalization and L3

Enter finalization only after all current frontiers, frontier L2 checks, cleanup, and evidence records pass with no unresolved findings. Repository-wide L3 remains finalization-only.

Run the exact declared L3 commands fail-first. On success, write a reusable evidence record bound to clean HEAD, tree, and status before and after every command; exact commands and passing results; relevant tool/runtime versions; and relevant non-secret external hashes or identities, never secret values.

Then dispatch one mandatory final whole-branch review from the recorded branch start through `HEAD`, including authority, manifest/frontiers, commits, full diff, L1/L2/L3 evidence, known risk, and deferred live effects. The final gate has one initial pass, at most one consolidated fix wave, and one closure re-review. The closure scope is accepted findings, fix diff, and regression evidence; unrelated non-Critical findings become deferred final-review risks. A confirmed Critical regression or false evidence may reopen the gate.

Run focused L1/L2 for accepted fixes. A source, test, build, dependency, command, base, or relevant environment change is **material invalidation**: rerun L3 once at the new clean state, then perform bounded closure review with the new diff, remaining risk, and new evidence. Read-only review alone does not invalidate L3.

Live effects occur only after passing L3 and final approval. Run post-effect smoke evidence, then invoke `finishing-a-development-branch`, which may reuse the exact matching L3 record.

## Red Flags

Never run parallel writers on overlapping paths, admit only part of a failed frontier, merge a native temporary branch, call L1/L2 repository-wide completion, run early L3, skip required review, use `HEAD~1` as the whole-branch base, store secrets in evidence, or execute live effects before the final gates.
