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

# Fail-First Execution Evaluation

`execution-cases.json` evaluates the Full execution workflow at eight skill
profiles. Epoch 3 is the only admissible evaluation epoch. Epochs 1 and 2 and all
availability-smoke output are quarantined transport history and must not be read
into normalization or referenced by an accepted report.

Run every tuple in a fresh Pi process with this exact ordered isolation argument
list and fixed model identity:

```text
pi --no-extensions --no-skills --no-tools --no-context-files --no-session --mode json \
  --provider Mapleluv --model claude-sonnet-4-6 --thinking high \
  --system-prompt "$SYSTEM_PROMPT_FILE" -p "$FIXTURE_PROMPT"
```

Evaluation concurrency is globally 1 across baseline, candidate, and integrated
runs. Each tuple has a 600000 ms silence-liveness threshold. A transport or
process failure may be retried sequentially at most three times, but the fixture,
evaluator prompt, generated system prompt, provider, model, thinking level, and
isolation flags must remain byte-for-byte identical. On Windows, terminate the
complete evaluator process tree before retry, evidence acceptance, or cleanup.
Preserve metadata for every attempt and record the accepted attempt number.

## Evidence Identity

A report is an object with `evidence`, `targetIdentities`, `evidenceIndex`, and
`results`. The report evidence fixes epoch `3`, provider `Mapleluv`, model
`claude-sonnet-4-6`, thinking `high`, the ordered isolation flags, the committed
fixture path/hash, and the common evaluator-prompt path/hash.

Each `(target,profile)` has exactly one target identity containing the frozen
source base SHA/tree, wave-attempt ID, admitted patch SHA-256, candidate input
SHA/tree, and the same prompt/model/settings hashes. Baseline uses the SHA-256 of
an empty file as its patch identity and uses the Task 1 source commit/tree as both
its source base and candidate input identity. Candidate identities also supply a
patch path so the validator can hash the admitted bytes.

Every `(caseId,target,repetition)` observation repeats the fixed evidence binding,
references the applicable target-profile identity IDs, and records:

- SHA-256 of the exact selected fixture prompt bytes;
- generated-system-prompt path and SHA-256;
- raw-response path and SHA-256;
- accepted attempt number from 1 through 3;
- shared observations and all fixture-declared `profileResults`.

`evidenceIndex.systemPrompts` and `evidenceIndex.rawResponses` contain one unique
entry per observation. The validator reads every supplied fixture, evaluator,
system-prompt, patch, and raw-response path and recomputes its SHA-256. Missing or
mixed epochs, targets, bases, patches, prompts, settings, raw hashes, attempts, or
identity fields fail validation.

Profile observations may record waves and task ownership/dependencies, completed
task IDs, shared-contract review and pin state, native handoff kind, intermediate
claims, missing-focused-command action, finalization state, L3 and material-cause
events, live-effect ordering, and evidence reuse. Normalize only behavior present
in the raw response. Preserve generated prompts and raw Pi JSON separately under
the ignored controller evidence root. Never manufacture an absent observation.

## Cardinality and Modes

Run ten fixtures, two targets, and repetitions 1 through 5 for a complete
100-record report. A complete baseline has exactly 50 records. Baseline profile
results may and usually should fail Lite assertions, but every mapped baseline
profile must contain at least one genuine RED observation. Every requested Lite
profile result must pass its fixture assertion conjunction.

The validator accepts exactly three selection modes:

```bash
# Complete 100-record baseline + Lite report
node scripts/validate-execution-eval-report.mjs .superpowers/evals/epoch-3/final/report.json

# Complete 50-record baseline
node scripts/validate-execution-eval-report.mjs \
  .superpowers/evals/epoch-3/task-1-baseline/report.json --target baseline

# One target, one profile, and one or more cases (five records per case)
node scripts/validate-execution-eval-report.mjs "$REPORT_FILE" --target lite \
  --profile executing-plans --case successful-intermediate-wave --case finalization
```

Target-only Lite, case-without-profile, profile-without-case, multiple targets in
a narrow selection, or multiple profiles in a narrow selection are invalid.
Manually inspect every accepted raw response after collection. Validator success
does not replace checking that normalized observations reflect the actual answer.
