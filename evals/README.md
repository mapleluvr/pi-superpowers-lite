# Routing Evaluation

This evaluation compares the pinned upstream Superpowers v6.1.1 skillset with
Pi Superpowers Lite before active settings are migrated.

## Protocol

Run every fixture in `routing-cases.json` in a fresh context twice: first against
upstream v6.1.1, then against Lite. Use the same model, model version, sampling
settings, user prompt, and evaluator instructions for both targets. Do not reuse
conversation state between cases or targets.

Each report contains exactly one record for every `(caseId, target)` pair. The
only target values are `upstream` and `lite`:

```json
{
  "caseId": "authentication",
  "target": "lite",
  "expectedRoute": "Full",
  "observedRoute": "Full",
  "skillCalls": ["using-superpowers", "brainstorming"],
  "artifacts": ["spec", "plan"],
  "subagentCalls": 0,
  "reviewCalls": 1,
  "escalatedToFull": false,
  "pass": true
}
```

`upstream` records preserve what the baseline actually did. Their `pass` value
may be false when baseline behavior differs from the Lite contract. `lite`
records must pass the route contract. Do not fabricate model observations: if a
fresh run cannot be completed, leave the pair absent and let the validator fail.
Do not store prompts containing secrets, model credentials, or private source.

## Required Checks

The validator enforces pair cardinality, route names, safety-critical Full
routing, Micro artifact restrictions, Standard subagent restrictions, required
review evidence, and risk-discovered escalation. Run it from the package root:

```bash
node scripts/validate-eval-report.mjs evals/results/2026-07-12-initial.json
```

Generated JSON reports are ignored. Commit only this protocol, fixtures, the
validator, tests, and `evals/results/.gitkeep`.
