---
name: dispatching-parallel-agents
description: Use when facing 2+ independent domains that can proceed without shared state or sequential dependencies
---

# Dispatching Parallel Agents

## Overview

Dispatch one agent per independent problem domain with focused, self-contained context. This applies to **investigation and implementation** units, but their isolation and handoff rules differ.

**Core principle:** concurrency is earned by proved independence and net benefit, not by task count. If benefit or independence is unclear, choose Inline; Inline fallback is the default.

## Independence Predicate

Implementation dispatch starts from `.superpowers/work/<run-id>/manifest.json`, its exactly one current frontier, and that frontier's task cards. Units may share a frontier only when all are true:

- they consume the same immutable inputs or pinned contract versions;
- there is no same-frontier dependency path between them;
- they have disjoint writes or disjoint `owns` paths;
- mutable resources such as ports, databases, generated files, settings, and fixtures are isolated;
- at least two independently useful outcomes can complete without making another output necessary or unsafe;
- coordination, worktree, patch-admission, and frontier L2 cost is below expected critical-path savings.

If ownership overlaps, contracts are still changing, resources cannot be isolated, or net benefit is weak, keep work sequential or redesign the boundary. Do not ask agents to resolve collisions after dispatch.

## Mode 1: Read-Only Investigation

Use for independent failures, research questions, or code areas whose conclusions do not require writes. Each investigation stays read-only, may omit a worktree, and returns evidence plus a bounded conclusion. Related symptoms with a likely common cause remain one domain.

The controller compares results, resolves contradictions, and decides what work follows. Investigation findings are not implementation patches or approval.

## Mode 2: Full Implementation Frontier

Use only when the current frontier establishes the predicate above. Each implementation task receives:

- frozen base and pinned contract identities;
- `owns`, dependencies, and isolated mutable resources;
- task card path, task-local L1 command, and expected evidence;
- report path and status vocabulary.

Dispatch native implementation workers with `worktree: true`. They return a patch handoff and report; they do not merge temporary branches or write canonical state.

Delegate complete-set preflight, review, admission, quarantine, and canonical integration to `subagent-driven-development`. Do not duplicate that algorithm here. A failed implementation frontier integrates zero patches. After successful atomic integration, the controller runs the declared frontier L2 affected closure. L3 remains finalization-only.

## Focused Prompts

Give each agent one domain, the minimum artifact paths needed, explicit constraints, exact output, and a stop condition. Do not paste unrelated session history. State whether the role is read-only investigation or isolated implementation.

A good prompt answers:

1. What exact question or deliverable belongs to this agent?
2. Which files, contracts, and resources may it read or own?
3. Which evidence must it produce?
4. What conflict, ambiguity, or scope expansion must make it stop?

## Dispatch and Collection

Issue independent calls in one parallel group and set concurrency appropriate to the host. `failFast` can reduce wasted work but never authorizes partial integration.

When results return:

- require every expected result and evidence artifact;
- keep failed or unresolved frontiers quarantined;
- synthesize read-only findings in the controller;
- route implementation patches through SDD admission;
- report only the verification scope actually established.

## Red Flags

Do not parallelize overlapping writes, hidden producer/consumer relationships, a transactional invariant, a shared unisolated resource, exploratory implementation with unknown boundaries, or tasks that need continuous shared context. Never treat agent summaries as conflict checks or passing evidence.
