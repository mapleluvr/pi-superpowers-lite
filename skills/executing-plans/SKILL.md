---
name: executing-plans
description: Use when approved Full work must execute the current dynamic frontier inline in this session
---

# Executing Plans

Execute a Full run inline when delegation is unavailable. Use `subagent-driven-development` for profitable isolated parallel work.

## Load Manifest

Read `.superpowers/work/<run-id>/manifest.json` and verify its authority hashes, canonical `HEAD`/tree/status, history, protected risks, and finalization state.

For frontier execution, a non-null `currentFrontier` requires exactly one current frontier. Load its `frontier.md`, `frontier.json`, task cards, selective baseline, ownership, resources, contract pins, L0/L1/L2, and deferred effects.

When `currentFrontier` is null, require `finalization.status` to be `ready`, all history completed or superseded, no blocked frontier or protected risk, and the latest L2 bound to the clean canonical state. If all pass, enter finalization. A null current frontier is invalid: stop unless that finalization-ready state is proven. Never fabricate or reopen a frontier.

## Execute Inline

Run current tasks from `frontier.json` in order, sequentially in one writer:

1. Obey each task card's ownership and mutable resources.
2. Run frontier L0 before any L1; failed or unavailable L0 stops for rederivation.
3. Preserve TDD RED, implement, run exact declared L1, inspect, and commit atomically.
4. Record only `task-local checks passed`; stop on drift, hidden dependency, or invalid contract.

After all current tasks finish, run the terminal frontier L2 exactly once after all current tasks, never between tasks. Report only `affected closure passed` from clean state.

A missing focused command requires boundary redesign, a focused harness, or final-integration deferral, never an early repository-wide suite. No task or intermediate frontier runs L3.

## Recovery

A hidden dependency supersedes the current frontier. A local defect with a valid boundary creates a correction frontier. Two rejected candidates for one frontier due core-contract failure force re-decomposition, a smaller acceptance boundary, or a prior contract/probe frontier.

## Finalization

From a proven finalization-ready manifest, run or reuse a valid L3 evidence record, mandatory final review, and material-invalidation handling before live effects. Then invoke `finishing-a-development-branch`.

Stop for stale identity, blockers, unavailable evidence, ownership collision, or decisions requiring approval. Never widen scope to continue.
