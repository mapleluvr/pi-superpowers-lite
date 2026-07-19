---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

Execute an approved Full plan inline in a separate session or when delegation is unavailable. Use `subagent-driven-development` instead when isolated parallel implementation is selected.

**Announce:** "I'm using the executing-plans skill to implement this plan."

## Load and Review Once

Read the spec, execution graph, fail-first frontier, selective baseline, finalization section, and progress ledger. Confirm the clean base and branch; never start on main/master without explicit user consent.

Review dependencies, ownership, contract pins, L1/L2 commands, and deferred live effects. If the graph and affected closure contradict each other, return to plan review. Do not guess through missing interfaces or evidence. Create todos for unfinished tasks only.

## Execute Topological Waves

Process each topological wave in order. Within a wave, execute eligible tasks **sequentially in one writer**:

1. Mark one task in progress and obey its ownership boundary.
2. Preserve TDD RED, implement, and run the exact declared L1.
3. Inspect the diff, commit atomically, and record only `task-local checks passed`.
4. Stop on failure, scope drift, or contract invalidation.

After all tasks integrate, run the wave's **union L2** once and report only `affected closure passed`. Start the next wave from clean state.

If a focused command is missing, redesign the unit or boundary, add a focused harness, or defer it to final integration. Never substitute a repository-wide suite.

No task or intermediate wave may run L3. Checkpoint only scoped commits, L1/L2 evidence, blockers, and remaining waves.

## Finalization

After every wave and L2 passes, enter finalization. Run its first repository-wide L3, bind the result to clean state in a valid L3 evidence record, complete mandatory final review, and handle material invalidation as planned.

Only then invoke `finishing-a-development-branch`; it may reuse the matching record.

## Stop Conditions

Stop for blockers, repeated scoped failure, plan contradiction, ownership collision, unstable contracts, unavailable verification boundaries, or decisions requiring approval. Return to plan review or the user instead of widening scope.
