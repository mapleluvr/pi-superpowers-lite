---
name: writing-plans
description: Use for Full-route work after an approved spec, before implementation begins
---

# Writing Plans

## Overview

Write a durable plan for Full-route work after the design is approved. Give a capable engineer enough context to preserve intent, interfaces, invariants, and evidence without repeating the spec or pre-writing ordinary implementation code.

Assume the executor is a skilled developer with no session history. The plan must stand alone by referencing the approved spec, naming exact ownership boundaries, and making risky decisions explicit. DRY. YAGNI. TDD. Reviewable commits.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `superpowers:using-git-worktrees` skill at execution time.

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

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

Reference the approved spec for WHAT and WHY instead of restating it. Ordinary
steps do not copy full function bodies, complete test files, or repeated TDD
narration. Use exact snippets only for migrations, destructive operations,
protocol boundaries, fragile configuration, or genuinely non-obvious algorithms.

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. When drawing task boundaries: fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them; split only where a reviewer could meaningfully
reject one task while approving its neighbor. Each task ends with an
independently testable deliverable.

## Step Granularity

Each task must be independently testable and reviewable. Within it, describe the
RED, implementation, verification, and commit sequence once with exact commands
and expected evidence. Do not expand routine work into repeated two-minute
narration; split only when a step changes ownership, risk, or acceptance evidence.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## Task Structure

````markdown
### Task N: [Observable outcome]

**Purpose:** [user-visible or system-visible result]

**Files/modules:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py`
- Test: `tests/exact/path/to/test.py`

**Interfaces and dependencies:**
- Consumes: [existing contract, exact name/signature where stable]
- Produces: [contract later tasks rely on]

**Constraints and invariants:**
- [binding requirement copied exactly from the spec]

**Acceptance evidence:**
- RED: `exact focused command` -> expected failure reason
- GREEN: `exact focused command` -> expected pass evidence
- Regression: `exact broader command` -> expected pass evidence

**Risk and rollback:**
- [risk boundary and practical reversal]

**Implementation intent:**
- [ordered changes at the ownership level]
- [pseudocode or precise snippet only when logic is fragile or non-obvious]

**Commit:**
```bash
git add exact/path/to/file.py tests/exact/path/to/test.py
git commit -m "feat: add observable outcome"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" without naming observable behavior, command, and expected evidence
- "Similar to Task N" without restating the relevant intent and interface
- Fragile logic described vaguely instead of with pseudocode or a precise snippet
- References to types, functions, or methods not defined in the spec, codebase, or plan

## Remember
- Exact file paths and ownership boundaries
- Precise interfaces, invariants, acceptance evidence, risk, and rollback
- Pseudocode only where implementation intent would otherwise be ambiguous
- Exact commands with expected output
- DRY, YAGNI, TDD, reviewable commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Batch execution with checkpoints for review
