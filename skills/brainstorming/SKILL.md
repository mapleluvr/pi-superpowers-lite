---
name: brainstorming
description: "Use this skill for Full-route work, substantive design decisions, or explicit brainstorming requests. Explores user intent, requirements, and design before implementation."
---

# Brainstorming Ideas Into Durable Authority

Use this skill for Full-route work, unresolved product or architecture choices, or an explicit brainstorming request. When invoked, its Full design and approval gates remain mandatory.

Understand the current project, clarify one question at a time, compare viable approaches, and obtain section-by-section user approval. The output is minimal durable authority: what must be true and what must not change. Runtime task decomposition belongs to writing-plans and SDD.

<HARD-GATE>
Do NOT invoke an implementation skill, write code, scaffold, or take implementation action until the design is presented and approved. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>

## Checklist

1. **Explore project context** - inspect files, docs, and recent commits.
2. **Ask clarifying questions** - one at a time; establish purpose, constraints, and observable success.
3. **Compare 2-3 approaches** - explain trade-offs and recommend one.
4. **Present design sections** - scale detail to risk and obtain approval after each section.
5. **Write durable authority** - use `docs/superpowers/work/<feature>/`.
6. **Self-review** - remove placeholders, ambiguity, contradictions, and implementation leakage.
7. **Commit authority** - commit only the approved durable documents.
8. **User reviews written authority** - apply requested corrections and reconfirm.
9. **Transition** - invoke writing-plans to initialize the current ignored workspace/frontier.

**The terminal state is invoking writing-plans.** Do not invoke another implementation skill first.

## Collaborative Design

- Start from current code and existing conventions.
- Decompose a request into separate durable objectives only when the outcomes can stand independently. Do not predict implementation tasks.
- Prefer one multiple-choice question when it makes the decision easier; otherwise ask one open question.
- Cover architecture, data flow, error behavior, and verification only to the depth needed to make product or protected-boundary decisions.
- Keep one transactional invariant together.
- Improve existing structure only where it serves the requested outcome.

## Durable Authority Shape

```text
docs/superpowers/work/<feature>/
  README.md
  intent.md
  contracts/       # only when needed
  decisions/       # only when needed
```

`README.md` indexes authority status, intent, contracts, decisions, and any superseding authority. It does not track execution progress.

`intent.md` contains:

- intent and user-observable outcome;
- acceptance entries with a stable ID or stable identifier;
- hard constraints;
- non-goals;
- protected invariants;
- authorization boundaries for live or destructive effects.

Durable intent must exclude task lists, DAGs, waves, speculative implementation paths, model/reviewer allocation, evidence filenames, and predicted parallel boundaries. Exact paths belong only when the path itself is a user-granted closed scope or protected boundary.

Create a contract only when a public/shared API, security boundary, migration, data format, or concurrency/ordering invariant must remain stable for consumers. State observable semantics, compatibility, and invalidation; do not prescribe ordinary implementation.

Create a decision record only when multiple reasonable choices exist, the choice constrains future work, and final code will not preserve the reason.

## Contract and Effect Safety

A protected contract may receive one risk-triggered independent review before consumers begin. Routine durable authority uses self-review plus user approval, not automatic reviewer fan-out.

Use additive or versioned compatibility when old consumers remain active. Live cutover, destructive removal, migration execution, or deployment waits for finalization evidence and approval.

## Self-Review

Check:

1. every acceptance entry is observable and has a stable identifier;
2. constraints, non-goals, protected invariants, and effect authorization are consistent;
3. a separate contract exists only where consumer stability requires it;
4. no implementation task, path guess, DAG, wave, model allocation, or evidence layout leaked into authority;
5. no TODO, TBD, contradiction, or ambiguous requirement remains.

Fix document defects inline. If the product decision is unresolved, return to the user rather than filling the gap with implementation detail.

After commit, ask the user to review the written authority. On approval invoke writing-plans, which initializes `.superpowers/work/<run-id>/` and only its current frontier.

## Visual Companion

Offer the visual companion only when the next decision is genuinely clearer as a mockup, layout, comparison, or architecture diagram. Make the offer in its own message and wait. After acceptance, still use it only for visual questions; use text for requirements and conceptual trade-offs. For detailed operation read `skills/brainstorming/visual-companion.md`.
