---
name: using-superpowers
description: Classify substantive work as Micro, Standard, or Full before loading only the needed skills.
---

# Work Routing

For each message:

1. Decide whether it is informational or substantive work.
2. If substantive, classify Micro, Standard, or Full using risk conditions.
3. State the route and one reason.
4. Load only skills needed by that route.
5. Reclassify upward if new risk appears; never silently downgrade.
6. Run verification before claiming completion.

A route applies to one task, not the whole session or later tasks. A scoped subagent follows the parent-supplied route and contract.

## Route: Micro

Choose Micro only when every M1 condition holds:

- The outcome is explicit with no unresolved design choice.
- The change introduces no new behavior.
- It is local, reversible, and mechanically understood.
- It affects no public API, shared contract, security boundary, data model, persistence behavior, concurrency, or distributed state.
- Focused verification directly demonstrates the result.

Use inspect -> change -> focused verification. Do not create a spec, plan, worktree, subagent, or independent review. Any bug fix, condition, behavior, interface change, or uncertainty is at least Standard.

## Route: Standard

Use Standard for clear local behavior with bounded risk and direct verification. Before implementation, state this inline conversation contract:

- Intent: observable outcome.
- Constraints: boundaries to preserve.
- Acceptance: completion evidence.
- Risk: known risk and why Full is unnecessary.

Work in the current session and workspace. Do not create a persisted spec or plan, worktree, or subagent by default. Use TDD for behavior changes and bug fixes; otherwise choose artifact-appropriate validation. Self-review, then verify.

## Route: Full

Use Full when any condition applies:

- Product, architecture, or behavioral design is unresolved.
- A public API, shared interface, or cross-module contract changes.
- A data model, schema, migration, persistence format, or durable state changes.
- Authentication, authorization, security, privacy, or sensitive data is involved.
- concurrency, asynchronous lifecycle, distributed state, retries, or ordering guarantees are involved.
- Work is destructive, irreversible, or has high blast radius.
- Independent tasks, parallel work, or subagent collaboration are required.
- The user explicitly requests Full.

Load the Full workflow skills: brainstorming, written spec, intent-level plan, isolated execution, proportional review, final whole-change review, and branch finish. Use a worktree unless already isolated.

## Override And Escalation

Honor an explicit user route: Full always applies; Micro or Standard only while all safety conditions remain true. New security, data, contract, concurrency, destructive, or architecture risk must upgrade to Full and be announced before continuing. Never automatically downgrade after implementation starts.

Verification is required before completion on every route.
