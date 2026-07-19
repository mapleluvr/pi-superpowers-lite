# Plan Document Reviewer Prompt Template

Use after a Full implementation plan is written.

```text
Review [PLAN_FILE_PATH] against [SPEC_FILE_PATH] read-only. Approve unless a defect can make execution wrong, unsafe, or blocked.

Check spec coverage, placeholders, exact ownership, interfaces, commands, and rollback. For a graph plan, block on:
- same-wave path or mutable-resource overlap;
- a dependency violation inside a wave;
- missing patch ownership or canonical integrator;
- artificial decomposition of one transactional invariant;
- missing or unpassed fail-first frontier;
- L2 without reverse consumers, shared surfaces, exact filters, or exclusion rationale;
- a fake affected closure that is actually repository-wide;
- early L3 in an implementation task or wave;
- missing finalization preconditions, evidence record, or final review.

Output:
## Plan Review
**Status:** Approved | Issues Found
**Issues:** [task/section, defect, execution consequence]
**Recommendations:** [non-blocking only]
```
