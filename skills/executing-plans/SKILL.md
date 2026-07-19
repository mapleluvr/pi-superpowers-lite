---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

Execute an approved Full plan inline when delegation is unavailable. Use `subagent-driven-development` for isolated parallel implementation.

**Announce:** "I'm using the executing-plans skill to implement this plan."

## Load Once

Read the spec, fail-first frontier, selective baseline, finalization, ledger, and execution graph **when present**. Confirm the clean base and branch; require user consent on main/master.

Independent units use a graph. A graphless Full single dependency chain runs in listed order under one writer; do not invent a synthetic DAG. Check ownership, contract pins, L0/L1/L2, and deferred live effects. If a present graph and affected closure contradict, return to plan review. Never guess missing interfaces or evidence.

## Execute Scoped Frontiers

For a graph plan, process each topological wave. For a graphless single chain, each listed task is the next sequential frontier. In either shape:

1. Mark one frontier active and obey its ownership.
2. Run exact declared L0 before edits or L1. Failed or unavailable L0 stops execution and returns to plan review.
3. Preserve TDD RED, implement sequentially in one writer, and run exact declared L1.
4. Inspect, commit atomically, and record only `task-local checks passed`.
5. Stop on failure, scope drift, or contract invalidation.

Graph: run **union L2** once after each wave. Graphless: run union L2 exactly once after all listed tasks, never between tasks. Report only `affected closure passed`; continue from clean state.

For a missing focused command, redesign the unit or boundary, add a focused harness, or defer to final integration. Never substitute a repository-wide suite. No task or intermediate wave may run L3.

## Finalization

After all frontiers and L2 pass, run finalization's first repository-wide L3, bind clean state in a valid L3 evidence record, complete mandatory final review, and handle material invalidation as planned. Only then invoke `finishing-a-development-branch`.

## Stop Conditions

Stop for blockers, repeated scoped failure, plan contradiction, ownership collision, unstable contracts, unavailable verification, or decisions requiring approval. Return to plan review or the user instead of widening scope.
