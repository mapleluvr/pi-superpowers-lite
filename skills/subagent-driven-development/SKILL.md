---
name: subagent-driven-development
description: Use for Full-route work when executing an approved implementation plan with independent tasks in the current session
---

# Subagent-Driven Development

## Overview

Execute an approved Full-route plan with a fresh implementer for each task,
implementer tests and self-review, risk-gated task-level review, and one mandatory
final whole-branch review.

**Core principle:** Isolate implementation context, spend independent review where
risk warrants it, and preserve one complete final quality gate.

## Route Gate

Use this skill only for Full-route work with an approved spec and implementation
plan. Standard Inline work stays in the current agent without plan artifacts,
worktrees, or subagents. Micro work never uses this workflow.

Use SDD when tasks are sufficiently independent to hand to fresh implementers in
the current session. Use `executing-plans` when the plan will run in another
session. If task boundaries share mutable state or require continuous context,
execute manually under the Full contract instead of forcing delegation.

## Process

1. Read the plan once and create the task ledger.
2. Check `.superpowers/sdd/progress.md`; completed entries are authoritative.
3. Perform one pre-flight contradiction scan before the first unfinished task.
4. For each unfinished task, extract a task brief and dispatch one fresh
   implementer with an explicit model.
5. Require the implementer to run focused tests, self-review, commit, and write a
   report containing commands and results.
6. Evaluate task-level risk. Dispatch a task reviewer only when the task meets the
   high-risk predicate below.
7. Record the approved or routine verified task in the ledger before continuing.
8. After every task, run the complete verification required by the plan.
9. Generate a whole-branch review package and dispatch the mandatory final review.
10. If final review reports blocking findings, make one consolidated fix wave,
    rerun the complete verification, and request re-review with the new evidence.
11. Finish the branch only after the final verdict is clean.

Do not pause between tasks for routine confirmation. Stop only for an unresolved
blocker, a real plan contradiction, or a decision that cannot be delegated.

## Risk-Gated Task Review

Evaluate task-level risk from behavior and blast radius, not file count. Dispatch
an independent task reviewer when a task crosses any of these boundaries:

- public/shared contracts or cross-module interfaces;
- authentication, authorization, security, privacy, or sensitive data;
- schema changes, migrations, destructive persistence, or rollback-sensitive data;
- concurrency, ordering, retries, asynchronous lifecycle, or distributed state;
- irreversible actions or high blast radius;
- acceptance evidence that is ambiguous or cannot be checked by the implementer.

Routine tasks do not dispatch a task reviewer. They still require implementer
tests, self-review, a clean diff, and ledger evidence. If implementation reveals
new risk, reclassify the task and add review before moving on.

A task reviewer returns separate spec-compliance and code-quality verdicts.
Critical or Important findings block progression. Fix them, rerun the covering
tests, and provide the new diff, remaining risk, and new evidence for re-review.

Task-level review never replaces the final whole-branch review.

## Final Review

The final whole-branch review is mandatory for every SDD execution. It evaluates
the complete change against the approved spec, plan, global constraints, test
evidence, task interactions, and migration risk.

Build the review package from the branch starting point through `HEAD`, not
`HEAD~1`. Include the commit list, diff stat, full diff, verification report, and
known residual risks. Use the most capable available reviewer model.

If blocking findings remain, dispatch one fixer with the complete findings list
or fix them in the controlling session when delegation is unavailable. This is
one consolidated fix wave, not one context rebuild per finding. Then rerun the
full suite and request re-review.

## Pre-Flight Plan Review

Before execution, scan once for:

- tasks that contradict each other or global constraints;
- a plan-mandated action that the review rubric would reject;
- missing interfaces between dependent tasks;
- verification commands that cannot establish their claimed evidence;
- active settings or migration steps scheduled before the final review.

Batch all discovered contradictions into one decision request. When the human has
delegated approval authority, use that reviewer and record the verdict. Do not
silently choose between contradictory requirements.

## Implementer Dispatch

Use one writer for a shared worktree. Never run parallel implementers against the
same files.

Before dispatch:

1. Record the exact base commit.
2. Extract only the current task with `scripts/task-brief`.
3. Name a report file beside the brief.
4. Supply the package root, required interfaces, and any prior decision the brief
   cannot know.
5. Specify the model explicitly.

The implementer must:

- read the task brief first;
- use TDD for behavior changes;
- preserve unrelated user changes;
- run the focused and regression commands named by the task;
- inspect its own diff;
- commit only task-scoped files;
- write the report with commands, observed results, commit, and concerns.

Do not paste the full plan, session history, or prior task summaries into the
prompt. Pass paths to artifacts instead.

## Implementer Status

Handle status explicitly:

- **DONE:** verify the report and continue to the risk decision.
- **DONE_WITH_CONCERNS:** read concerns; resolve correctness or scope concerns
  before review or ledger completion.
- **NEEDS_CONTEXT:** supply the missing information and resume the same task.
- **BLOCKED:** determine whether the cause is missing context, model capability,
  task size, or a bad plan. Change the input before retrying.

Never turn a failed dispatch into an implied approval.

## Review Packages

For a high-risk task, generate `scripts/review-package BASE HEAD` using the base
recorded before its implementer started. Give the reviewer three paths: task
brief, implementer report, and review package.

The review prompt must state the task's binding constraints without pre-judging
findings. Do not tell a reviewer what not to flag or ask it to rerun evidence the
implementer already recorded unless that evidence is stale or suspect.

For final review, generate a package from the repository's branch starting point
(or Git empty tree for a root-history review) through `HEAD` so no initial commit
is omitted.

## Durable Progress

The ignored ledger at `.superpowers/sdd/progress.md` is the recovery map. Each
completed line records the task, commit range, review decision when required, and
verification status. Trust the ledger and Git history after compaction.

Example:

```text
Task 3: complete (commits abc1234..def5678, high-risk review clean)
Task 4: complete (commit fed4321, routine task verification clean)
```

Do not re-dispatch a completed task. Do not use destructive cleanup commands that
remove the ledger.

## Model Selection

Use the least expensive model that can reliably complete the role:

- mechanical task with complete instructions: fast implementation model;
- multi-file integration or debugging: standard model;
- architecture, security, migration, or final review: strongest model;
- reviewer: enough judgment for the task's actual risk.

Turn count matters more than nominal token price. Always specify the model.

## File Handoffs

- **Task brief:** exact task requirements and values.
- **Implementer report:** commit, commands, results, concerns, and self-review.
- **Task review package:** brief, report, commit list, and full task diff.
- **Final review package:** complete branch history, full diff, verification, and
  residual risks.

Keep large content in files and pass paths. The controlling session owns the
ledger and synthesis.

## Red Flags

Never:

- start SDD without an approved Full plan;
- run multiple writers in one worktree;
- omit implementer tests or self-review;
- skip a task reviewer when the high-risk predicate matches;
- dispatch task reviewers for every routine task by default;
- accept a review without separate spec and quality verdicts;
- continue with unresolved Critical or Important findings;
- build a review package from `HEAD~1` for a multi-commit task;
- let task review replace the final whole-branch review;
- split final findings into repeated independent fix waves;
- mark migration complete before post-migration smoke evidence exists.

## Integration

Required Full workflow skills:

- `using-git-worktrees` - create isolation when the environment is not already isolated;
- `writing-plans` - produce the approved intent-level plan;
- `test-driven-development` - establish RED/GREEN evidence for behavior changes;
- `requesting-code-review` - define task and final review requests;
- `verification-before-completion` - require fresh completion evidence;
- `finishing-a-development-branch` - close the branch after a clean final gate.

Templates and scripts in this skill directory remain the operational helpers for
task briefs, reports, workspaces, and review packages.
