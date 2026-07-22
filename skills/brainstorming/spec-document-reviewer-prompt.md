# Durable Authority Review Prompt

Use only when a protected authority or contract has a risk-triggered independent review budget. Routine authority receives inline self-review and user approval.

```text
Review [AUTHORITY_DIR] read-only against the user's approved decisions. Do not design implementation tasks.

Block only when:
- intent lacks a user-observable outcome;
- acceptance lacks a stable ID or is not observable;
- hard constraints, non-goals, or protected invariants conflict or remain ambiguous;
- implementation task/DAG/wave/path details leak into durable authority;
- a contract is unnecessary, or a necessary public/shared, security, migration, data, or concurrency contract is absent or ambiguous;
- live/destructive authorization or compatibility is unsafe;
- placeholders or unrequested scope can make implementation wrong.

Do not require derived path ownership, task boundaries, parallelism, or verification commands.

Output:
## Authority Review
**Status:** Approved | Issues Found
**Issues:** [acceptance ID or protected boundary, defect, observable consequence]
**Recommendations:** [non-blocking only]
```
