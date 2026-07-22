# Review Convergence and Blocking Budget

## Status

Approved incremental design for `pi-superpowers-lite` Full and Standard review routing.

## Problem

Risk-gated review currently has no bounded convergence rule. A reviewer may expand a re-review into a fresh whole-task audit, classify evidence-quality or completeness suggestions as blocking, and keep the main agent inside one task for many cycles. The observed result is review churn without a corresponding increase in functional, safety, or contract confidence.

## Goals

- Preserve independent review for genuinely high-risk boundaries and the mandatory Full final review.
- Make every blocking finding prove a concrete impact on an active acceptance item or protected boundary.
- Bound task-review work to one initial review and one closure review.
- Freeze re-review scope to the previous findings, the fix diff, and regressions plausibly caused by that fix.
- Route non-blocking completeness, maintainability, and speculative coverage suggestions to the final review ledger instead of stopping implementation.
- Permit the main agent to reject or defer an unsupported finding with recorded reasoning.

## Non-goals

- Removing the mandatory Full whole-change review.
- Weakening Critical security, privacy, data-loss, public-contract, or irreversible-operation gates.
- Using elapsed time as a hidden route classifier.
- Automatically accepting an unverified implementation.
- Creating a new reviewer orchestration service.

## Review Unit and Budget

A review unit is one task boundary, contract-spine gate, or final whole-change gate. Each non-final review unit has at most two review passes:

1. **Initial review:** inspect the declared acceptance and risk boundary.
2. **Closure review:** inspect only the accepted fix diff, the initial findings, and regression evidence.

The controller sends one review packet per pass. Sequential specialty reviews (for example, separate spec-compliance, privacy, and test-quality reviews) are not permitted for the same unit. If multiple perspectives are explicitly required, they are collected in one bounded pass and synthesized into one finding list.

After the closure pass, new non-Critical findings that were not introduced by the fix are recorded as deferred final-review risks and do not reopen the task. A new review cycle requires an explicit route escalation or a demonstrated Critical regression.

Routine Full tasks still use implementer tests, self-review, clean patch admission, and L1/L2 evidence without task-level independent review. Contract spines and other risk boundaries retain one bounded task review. The final Full review remains one initial pass plus one consolidated fix wave and one closure re-review.

## Blocking-Finding Contract

A finding may block only when its report includes all of:

- `severity`: `Critical` or `Important`;
- `acceptanceId` or named protected boundary;
- concrete failure scenario or reproducible evidence;
- affected observable behavior, data integrity, security/privacy property, public/shared contract, or irreversible effect;
- explanation of why the issue cannot be deferred to the declared L2, L3, or final review;
- a bounded remediation target within the current ownership scope.

`Critical` is reserved for exploitable security/privacy failure, data loss or corruption, duplicate irreversible side effect, unrecoverable lifecycle state, or a release-blocking public-contract violation.

`Important` is a material supported-scenario failure, an explicit acceptance failure, or a recovery/integrity defect that can affect users or invalidate a required gate. It is not a synonym for incomplete tests, a preferred refactor, extra theoretical vectors, wording, or metadata polish.

A finding without this evidence is `Non-blocking` and must not stop the task. The controller may mark a finding `deferred` or `rejected` with one sentence of technical reasoning. Reviewer labels are advisory; the controller owns disposition against the approved spec and acceptance contract.

## Re-review Scope

The closure packet must contain:

- the initial finding IDs and dispositions;
- the exact fix diff or changed paths;
- focused evidence for each fixed finding;
- regression evidence for adjacent behavior.

The closure reviewer must not rediscover the entire task or add unrelated acceptance requirements. New findings are admissible only when they are caused by the fix, expose a Critical issue, or prove that an initial disposition was based on false evidence.

## Evidence and Completion

Non-blocking findings remain visible in the task ledger and final review packet. Completion language remains tier-scoped: L1 proves task-local behavior, L2 proves affected closure, and L3 proves the repository-wide finalization suite. Review convergence does not replace verification.

## Acceptance Tests

The implementation must add static contracts proving that:

- the old unbounded review loop and unconditional `Review early, review often` rule are absent;
- initial/closure review budgets and frozen scope are explicit;
- blocking findings require impact and acceptance evidence;
- unsupported completeness or style findings are non-blocking/deferred;
- routine tasks do not dispatch task-level reviewers;
- final Full review and Critical regression escalation remain mandatory;
- the controller can defer or reject a reviewer finding without treating that as a skipped verification gate.

The change is complete only after focused contract tests, cross-skill registration, typecheck, and diff checks pass. Repository-wide behavioral evaluation and final L3 are outside this incremental contract change unless explicitly requested.
