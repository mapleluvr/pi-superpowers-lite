---
name: requesting-code-review
description: Use when completing risk-gated work, closing reviewer findings, or entering a mandatory final Full review
---

# Requesting Code Review

Use independent review as a bounded risk gate, not an open-ended search for possible improvements.

**Core principle:** one declared review unit, one impact-qualified finding list, one bounded closure.

## Route-Aware Review

- **Micro:** no independent review. Focused verification is still mandatory.
- **Standard:** use risk-gated review only when shared behavior, broad blast radius, ambiguous acceptance, or sensitive evidence makes independent judgment material.
- **Full:** keep the mandatory final whole-change review. Add task-level review only for a contract spine or another boundary whose unresolved failure would make dependent work unsafe.

Routine frontiers have no independent task Review; use self-review, L1/L2, and final Review.

## Review Budget

Any independent agent asked to decide readiness, admission, acceptance, mandatory-rework, or integration belongs to the same bounded Review budget, whether named Reviewer, Oracle, analyst, or adjudicator. Calls from one declared packet collectively form one pass; an extra adjudication outside that packet consumes the next available pass, so renaming the role cannot create another gate.

Protected-contract and final whole-change Review permit:

1. **One initial review** against declared acceptance and protected boundaries.
2. **One consolidated correction frontier** when blockers are accepted.
3. **One closure review** of initial findings, exact fix diff, and adjacent regressions.

Send one packet per pass. When multiple perspectives are explicitly required, collect them in that packet and synthesize one finding list; do not serialize separate spec, privacy, test-quality, or style gates.

After closure, record new non-Critical findings not caused by the fix as deferred manifest risk for final Review. Reopen only for a demonstrated Critical regression, false disposition evidence, or explicit route escalation.

## Blocking-Finding Contract

A finding blocks only when it includes:

- `Critical` or `Important` severity;
- an `acceptanceId` or named protected boundary;
- a concrete failure scenario or reproducible evidence;
- affected observable behavior, data integrity, security/privacy property, public/shared contract, or irreversible effect;
- why it cannot be deferred to declared L2, L3, or final review;
- a bounded remediation target inside current ownership.

`Critical` means an exploitable security/privacy failure, data loss or corruption, duplicate irreversible effect, unrecoverable lifecycle state, or release-blocking public-contract failure.

`Important` means a material supported-scenario failure, explicit acceptance failure, or recovery/integrity defect that affects users or invalidates a required gate. Test completeness, speculative vectors, preferred refactors, wording, metadata polish, and documentation suggestions are non-blocking unless the reviewer proves that impact contract.

Reviewer labels are advisory. The controller owns disposition against the approved spec and records each finding as `fix`, `defer`, or `reject` with technical evidence. Deferring or rejecting an unsupported finding is not skipping verification.

## Re-Review Scope

A closure request supplies:

- initial finding IDs and controller dispositions;
- exact new diff or changed paths;
- focused evidence for every accepted fix;
- adjacent regression evidence, new evidence, and remaining risk.

The closure reviewer checks that scope only. It must not rediscover the whole task or add unrelated acceptance requirements. A new finding is admissible only when caused by the fix, Critical, or proof that an earlier disposition relied on false evidence.

## Review Packet

Record exact `BASE_SHA` and `HEAD_SHA`; final review uses the branch start, not a relative one-commit shortcut. Include:

- review-unit type: protected contract, frontier boundary, or final whole change;
- current task card when a task/frontier boundary is reviewed;
- approved authority and authority acceptance IDs;
- protected boundaries and known risk;
- exact diff and evidence paths appropriate to the gate;
- pass number: `initial` or `closure`;
- controller disposition for closure findings;
- for closure, the frozen scope above.

Use [code-reviewer.md](code-reviewer.md) as the reviewer template.

## Acting on Feedback

1. Reproduce or inspect each proposed blocker.
2. Map it to the blocking-finding contract.
3. Record controller disposition as `fix`, `defer`, or `reject` before editing.
4. Make one consolidated correction frontier for accepted blockers.
5. Run focused evidence, then the single closure review.

Critical findings block when confirmed. Only an impact-qualified Important finding may block; severity text alone never does.

## Workflow Integration

- **Subagent-Driven Development:** bounded review only at declared risk boundaries; one mandatory final whole-branch review.
- **Executing Plans:** same budget and frozen closure scope.
- **Standard:** request review only when its risk gate is actually met.

Never skip a required final review, ignore a confirmed Critical issue, let a reviewer silently expand acceptance, or start a third non-final review pass to chase non-Critical improvements.
