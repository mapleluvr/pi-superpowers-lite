---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## The Iron Law

```text
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

Evidence before claims, always. "Full command" means the complete command that proves the stated scope, not automatically the repository-wide suite.

## Name the Scope First

Identify the claim's scope and tier before choosing a command:

| Tier | Evidence scope | Permitted success language |
|---|---|---|
| L0 | cheapest prerequisite or structural probe | name that probe only |
| L1 | one task's owned behavior | `task-local checks passed` |
| L2 | integrated affected dependency closure | `affected closure passed` |
| L3 | complete finalization suite | `repository-wide suite passed` |

L1 or L2 evidence must not support "all checks passed," whole-change completion, or a repository-wide claim. Conversely, do not run L3 merely to prove an L1 or L2 claim. The plan's finalization gate owns L3.

## Verification Gate

Before any positive status claim:

1. **IDENTIFY:** State the exact claim, scope, tier, and command that proves it.
2. **RUN:** Execute that exact command fresh and to completion. Stop on the first failed tier; do not climb to a more expensive tier.
3. **READ:** Inspect complete output, exit code, failure count, warnings relevant to the claim, and generated artifacts.
4. **BIND:** Record the exact command, exit code/result, timestamp, `HEAD` or tree identity, dirty state, and material tool/runtime versions.
5. **COMPARE:** Confirm current state still matches the record. If source, dependencies, command, environment fingerprint, or dirty state changes, the evidence is invalid for the changed scope.
6. **CLAIM:** Use only the tier's permitted language and name remaining unverified scope.

A passing command with stale state, a partial invocation, or a broader claim is not verification.

## Evidence Examples

| Claim | Required fresh evidence | Not sufficient |
|---|---|---|
| Bug fixed locally | original symptom plus focused regression at L1 | code inspection |
| Task ready to integrate | declared L1 on owned state | unrelated tests |
| Wave integrated | union L2 on integrated tree | individual task runs |
| Whole change complete | final L3 record plus required review | L1/L2 extrapolation |
| Build succeeds | actual build command | lint or typecheck alone |

For TDD, preserve a genuine RED caused by missing behavior, then GREEN on the same focused test. A test that only ever passed is not regression proof.

## Agents and External Reports

An agent report is a lead, not evidence. Inspect the VCS diff and rerun the command at the tier you intend to claim. If an external report references file-backed artifacts, verify they exist and match their recorded hashes.

## Red Flags

Stop before claiming success when:

- output is missing, truncated, stale, or from a different state;
- wording includes "should," "probably," or "seems";
- only part of the named command ran;
- a lower tier is being generalized upward;
- an agent said DONE but the diff or evidence was not checked;
- final review or live-effect smoke remains outstanding.

State the actual failure or unverified boundary plainly. Run the evidence first, then make the scope-qualified claim.
