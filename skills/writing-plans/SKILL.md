---
name: writing-plans
description: Use for Full-route work after an approved spec, before implementation begins
---

# Writing Plans

## Overview

Write a durable plan for Full-route work after the design is approved. Give a capable engineer enough context to preserve intent, interfaces, invariants, and evidence without repeating the spec or pre-writing routine implementation.

Assume the executor has no session history. Reference the approved spec for WHAT and WHY, name exact ownership boundaries, and make risky decisions explicit. DRY. YAGNI. TDD. Reviewable commits.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md` unless the user chooses another path.

## Intent-Level Content

Every task states:

```text
Purpose and observable outcome
Files/modules and ownership boundary
Interfaces and cross-task dependencies
Constraints and invariants
Acceptance evidence
Risk and rollback
Pseudocode only for fragile or non-obvious logic
```

Ordinary steps do not copy full function bodies, complete test files, or repeated TDD narration. Use exact snippets only for migrations, destructive operations, protocol boundaries, fragile configuration, or genuinely non-obvious algorithms.

## Choose the Plan Shape

Use an execution graph only when a cohesive Full objective contains **two or more independently mergeable implementation units**. A single dependency chain stays serial and needs no DAG ceremony. Keep one transactional invariant under one owner rather than splitting it artificially.

Before tasks, record:

- approved spec path and immutable version or hash;
- file/contract ownership map;
- base SHA, available CI status (`unknown` is valid), and exact L0-L2 results labeled **selective baseline**;
- a named **fail-first frontier** that must pass before broad implementation;
- finalization preconditions and rollback boundary.

## Execution Graph

For qualifying work, include one table with every field:

```text
task | wave | dependsOn | owns | produces | consumes | risk | L1 | L2
```

Same-wave tasks must have no dependency path between them, disjoint `owns` paths, and isolated mutable resources. Put a shared contract-spine task in an earlier wave and pin its reviewed contract before consumers fan out. Assign one canonical integrator; isolated writers return patches, and the plan names patch ownership.

For each wave, derive L2 from the affected closure. Name reverse consumers, shared build/configuration surfaces, exact commands and filters, and an exclusion rationale for omitted surfaces. If no trustworthy focused command exists, redesign the unit or boundary, add a focused harness, or defer that unit to final integration. Never relabel a repository-wide suite as L2.

## Plan Header

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans. Track steps with checkboxes.

**Goal:** [observable result]
**Architecture:** [approach and boundaries]
**Tech Stack:** [technologies]
**Approved spec:** [path and immutable identity]

## Global Constraints
[exact shared requirements]
```

## Task Structure

````markdown
### Task N: [Observable outcome]

**Purpose:** [result]

**Files/modules and ownership boundary:**
- Create/Modify/Test: `exact/path`

**Interfaces and cross-task dependencies:**
- Consumes: [stable contract]
- Produces: [stable contract]

**Constraints and invariants:**
- [binding requirement]

**Acceptance evidence:**
- L0: `cheapest structural command` -> [expected evidence]
- L1 RED: `exact focused command` -> [intended failure]
- L1 GREEN: `same exact command` -> [pass]
- L2 after integration: [wave-owned affected-closure command]

**Risk and rollback:** [boundary and reversal]

**Implementation intent:**
- [ordered ownership-level changes]
- [pseudocode only where needed]

**Commit:**
```bash
git add exact/owned/paths
git commit -m "feat: add observable outcome"
```
````

No implementation task may contain an L3 command. Stop on graph, ownership, or closure contradictions and return to plan review instead of guessing.

## Finalization

Create one finalization section after all implementation waves. It owns the first repository-wide L3 and lists:

- required clean integrated state and completed L1/L2 evidence;
- exact complete L3 commands;
- evidence-record fields binding results to clean HEAD, commands, tool/runtime versions, and relevant non-secret external-input hashes;
- mandatory final whole-change review;
- material invalidation and L3/re-review rules;
- live-effect or destructive cutover only after passing L3 and final approval.

## No Placeholders

Reject TODO/TBD text, vague validation, unnamed edge cases, undefined interfaces, "similar to Task N," or fragile logic without pseudocode. Every command names expected evidence.

## Self-Review

Check spec coverage, placeholder absence, field/type consistency, graph legality, complete ownership, honest L2 derivation, and finalization-only L3. Fix defects inline before handoff.

## Execution Handoff

Offer either **Subagent-Driven** execution with subagent-driven-development or **Inline Execution** with executing-plans. Follow the user's choice; both consume the same graph, evidence tiers, and finalization gate.
