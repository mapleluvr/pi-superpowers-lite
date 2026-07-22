# Current Frontier Review Prompt

Routine frontiers use controller self-review. Use an independent reviewer only when a protected-boundary readiness decision already has review budget; the call counts as a review pass.

```text
Review [RUN_MANIFEST] and its current frontier read-only against [AUTHORITY_DIR]. Do not plan later work.

Block only when:
- the authority commit/hash is missing, stale, or unapproved;
- manifest does not identify exactly one current frontier;
- current ownership or mutable resources overlap;
- a mandatory acceptance/path lacks an owner, real entry point, or focused command;
- Parallel lacks demonstrated independence or net benefit;
- a static DAG predicts later tasks/waves/frontiers;
- derived state changes durable authority;
- L2 is fake affected closure or L3 appears before finalization;
- a hidden dependency, placeholder, or invalidation is ignored.

Output:
## Frontier Review
**Status:** Approved | Issues Found
**Issues:** [acceptance ID/task, defect, execution consequence]
**Recommendations:** [non-blocking only]
```
