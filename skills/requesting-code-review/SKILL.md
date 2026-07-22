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

Routine Full tasks use implementation tests, self-review, L1/L2 evidence, and the final review rather than per-task reviewers.

## Review Budget

A non-final review unit has at most two review passes:

1. **One initial review** against the declared acceptance and protected boundary.
2. **One closure review** of the initial findings, exact fix diff, and adjacent regression evidence.

Send one review packet per pass. Do not serially dispatch separate spec, privacy, test-quality, or style reviewers over the same unit. If multiple perspectives are explicitly required, collect them in one bounded pass and synthesize one finding list.

After closure, new non-Critical findings not introduced by the fix are deferred to the final review ledger. Reopen the unit only for a demonstrated Critical regression, false evidence behind a disposition, or an explicit route escalation.

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

- review-unit type: task boundary, contract spine, or final whole change;
- approved requirement/spec and acceptance IDs;
- protected boundaries and known risk;
- diff and L1/L2/L3 evidence appropriate to the gate;
- pass number: `initial` or `closure`;
- for closure, the frozen scope above.

Use [code-reviewer.md](code-reviewer.md) as the reviewer template.

## Acting on Feedback

1. Reproduce or inspect each proposed blocker.
2. Map it to the blocking-finding contract.
3. Record `fix`, `defer`, or `reject` before editing.
4. Make one consolidated fix wave for accepted blockers.
5. Run focused evidence, then the single closure review.

Critical findings block when confirmed. Only an impact-qualified Important finding may block; severity text alone never does.

## Workflow Integration

- **Subagent-Driven Development:** bounded review only at declared risk boundaries; one mandatory final whole-branch review.
- **Executing Plans:** same budget and frozen closure scope.
- **Standard:** request review only when its risk gate is actually met.

Never skip a required final review, ignore a confirmed Critical issue, let a reviewer silently expand acceptance, or start a third non-final review pass to chase non-Critical improvements.
