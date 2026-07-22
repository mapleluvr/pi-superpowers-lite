---
name: executing-plans
description: Use when approved Full work must execute the current dynamic frontier inline in this session
---

# Executing Plans

Execute the current Full frontier inline when delegation is unavailable. Use `subagent-driven-development` for isolated parallel implementation.

**Announce:** "I'm using the executing-plans skill to implement the current frontier."

## Load Current Frontier

Read `.superpowers/work/<run-id>/manifest.json`; it must name exactly one current frontier. Load that frontier's `frontier.md`, `frontier.json`, task cards, selective baseline, and finalization state. Confirm authority hashes, clean base, `HEAD`, tree, status, ownership, contract pins, L0/L1/L2 commands, and deferred live effects. Never guess missing interfaces or evidence.

## Execute Inline

Run current tasks from `frontier.json` in order, sequentially in one writer:

1. Obey each task card's ownership and mutable resources.
2. Run L0 for the current frontier before any task L1. If L0 fails or is unavailable, stop and block for rederivation.
3. Preserve TDD RED, implement the task, run exact declared L1, inspect the diff, and commit atomically.
4. Record only `task-local checks passed`; stop on failure, scope drift, hidden dependency, or contract invalidation.

After all current tasks finish, run the terminal frontier L2 exactly once after all current tasks, never between tasks. Report only `affected closure passed`; continue from clean state.

For a missing focused command, redesign the unit or boundary, add a focused harness, or defer to final integration. Never substitute a repository-wide suite. No task or intermediate frontier runs L3.

## Dynamic Recovery

A hidden dependency supersedes the current frontier. A local defect with a valid boundary creates a correction frontier. Two rejected candidates for one frontier due core-contract failure force re-decomposition, a smaller acceptance boundary, or a prior contract/probe frontier before another attempt.

## Finalization

After all frontiers and L2 pass, finalization requires a valid L3 evidence record, mandatory final review, and material-invalidation handling before live effects. Only then invoke `finishing-a-development-branch`.

## Stop Conditions

Stop for blockers, repeated scoped failure, ownership collision, stale frontier identity, unstable contracts, unavailable verification, or decisions requiring approval. Return to frontier derivation or the user instead of widening scope.
