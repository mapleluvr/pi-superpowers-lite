# Spec Document Reviewer Prompt Template

Use after a Full spec is written and before planning.

```text
Review [SPEC_FILE_PATH] read-only. Approve unless a defect can cause the plan or implementation to be wrong.

Block on:
- TODOs, contradictions, ambiguous requirements, or unrequested scope;
- artificial decomposition or a split transactional invariant;
- unstable fan-out contracts, missing producer/consumer or ownership boundaries;
- a missing fail-first frontier before broad implementation;
- public/shared, security, migration, or concurrency contracts not reviewed and pinned;
- destructive intermediate states without an additive or compatibility phase;
- missing selective verification surfaces or reversibility.

Output:
## Spec Review
**Status:** Approved | Issues Found
**Issues:** [section, defect, implementation consequence]
**Recommendations:** [non-blocking only]
```
