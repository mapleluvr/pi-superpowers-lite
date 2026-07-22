---
name: writing-plans
description: Use for Full-route work after durable authority is approved and before implementation begins
---

# Initializing a Progressive Execution Workspace

## Overview

Turn approved durable authority into the highest-value earliest verifiable frontier. Inspect current code first; write derived runtime state, not a second durable specification.

**Announce at start:** "I'm using writing-plans to initialize the current execution frontier."

Create a Git-ignored workspace at `.superpowers/work/<run-id>/`. Do not write or commit a static implementation plan, promise a task count, or precompute later tasks, waves, or frontiers.

## Inputs and L0

Read the authority index, `intent.md`, and only relevant protected contracts. Bind their approved commit and hashes. Inspect current code and tests, confirm the clean base, and record available CI status plus exact focused results as a **selective baseline**. `unknown` is an honest CI value.

If authority is unapproved, inconsistent, or changed from the bound hash, stop. Derived execution state must not override or change durable authority. A product or protected-contract change returns for amendment; task decomposition does not amend authority.

## Workspace

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
      evidence/
        l0/
        l1/
        l2/
  finalization/
    evidence/
    reviews/
```

`manifest.json` is the sole runtime entry point. Record run/authority/base identity, exactly one current frontier, historical completed/blocked/superseded frontiers, canonical state, protected risks, and finalization status. Do not create a duplicate progress file.

## Select the Current Frontier

Choose the smallest boundary that is both high value and independently verifiable now. `frontier.md` answers:

1. Why now?
2. What observable boundary closes?
3. What assumptions must L0 disprove?
4. Inline or Parallel, and why?
5. What ends or invalidates this frontier?

`frontier.json` records base/authority identity, mode, task cards, ownership and mutable resources, exact L0/L1/L2, acceptance mappings, status, and invalidation reason. It contains no later frontier.

## Decide Inline or Parallel

Parallel requires current evidence of:

- two or more independently useful outcomes;
- disjoint writes and mutable resources;
- stable interfaces or a completed contract spine;
- independent focused L1 checks;
- material critical path reduction;
- coordination cost, worktree cost, patch-admission cost, and union-L2 cost below expected savings.

Record a qualitative decision and rationale, never a numeric score. When independence or benefit is unclear, choose Inline. Do not split one transactional invariant or manufacture a DAG.

## Task Card

The task card is the sole task-specific worker instruction. It records:

```text
Observable outcome
Frozen base
Authority and contract hashes
Owned paths
Actual mutable resources
Consumes and produces
Controller-passed L0
Exact L1
Stop conditions
Handoff path
```

Do not copy the full authority or historical corrections. A hidden dependency returns `NEEDS_CONTEXT`; it does not widen ownership.

Before dispatch, verify references/hashes, one owner per mandatory path, no parallel path/resource overlap, focused L1 for each task, and a real entry point or controller-owned probe for each protected acceptance. Worker self-report is not this proof.

## Evidence and Finalization Boundary

Default to one structured record for each L0, task L1, frontier L2, and final L3 gate. Raw output is optional unless diagnostic or contractually required. No task or frontier runs repository-wide L3; L3 remains finalization-only.

## Self-Review

Check authority identity, exactly one current frontier, no predicted static graph, complete current ownership/resource mapping, honest parallel independence and net benefit, exact focused commands, no placeholders, and finalization-only L3. Fix derived-state defects inline; return authority defects to the user.

## Handoff

Offer SDD for a genuinely profitable independent Parallel frontier or `executing-plans` for Inline. Both consume the same manifest, frontier, task card, and evidence scopes. After completion the controller inspects the new canonical state and derives the next frontier.
