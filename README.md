# Pi Superpowers Lite

A Pi-native, risk-proportional fork of Superpowers. It keeps the 14 upstream
skill names and the complete Full workflow while making smaller work use Micro
or Standard Inline by default.

The package is pinned to `obra/superpowers` v6.1.1. See [UPSTREAM.md](UPSTREAM.md)
for provenance, file classifications, and synchronization rules.

## Installation

Install this package instead of both `obra/superpowers` and
`pi-superpowers-support`. Do not load the old packages beside Lite: both expose
Superpowers bootstrap or compatibility tools and can conflict before startup
finishes.

Install the Git package:

```bash
pi install git:github.com/mapleluvr/pi-superpowers-lite
```

Pin a release tag or commit by appending `@<ref>`. For local development, pass
an absolute or relative checkout path to `pi install` instead. Keep
`pi-subagents` installed when Full workflows need independent execution or
review; it is an optional companion, not a runtime dependency of this package.
Reload Pi after changing package settings.

## Routes

- **Micro** is only for explicit, local, reversible mechanical work with no new
  behavior. It uses inspect, change, and focused verification without a spec,
  plan, worktree, subagent, or independent review.
- **Standard** handles clear local behavior and bug fixes inline. It records
  Intent, Constraints, Acceptance, and Risk in the conversation, uses
  proportional tests or TDD, and always verifies completion.
- **Full** is triggered by unresolved design, shared contracts, persistence,
  security or privacy, concurrency or distributed state, destructive work,
  coordination, or an explicit user request. It preserves brainstorming,
  written specification, intent-level planning, isolated execution,
  proportional review, final whole-change review, and branch completion.

A user may request a route. New risk can escalate a task, but the workflow never
silently downgrades after implementation starts. Verification is mandatory on
all routes.

## Fail-First Full Execution

The [fail-first wave execution design](docs/superpowers/specs/2026-07-19-fail-first-wave-execution-design.md)
applies only when cohesive Full work has at least two independently mergeable
implementation units. A single dependency chain keeps the simpler inline path.

Full designs freeze component ownership and a contract spine before fan-out;
public, security, migration, and concurrency contracts receive independent
review at that boundary. Plans encode a dependency graph with disjoint write
sets, explicit inputs and outputs, and exact task-local and affected-closure
evidence. Every task also declares exact mutable resource identities for ports,
databases, caches, services, and temp roots; `none` is explicit.

Concurrent implementation uses isolated `worktree: true` workers and native
patch handoff. The controller preflights the complete patch wave before one
canonical integrator applies anything. A failed worker, ownership drift,
conflict, or failed check quarantines the whole wave with zero partial
integration. On a post-apply L1 failure, recovery reverse-applies the current
uncommitted patch and then reverts earlier wave commits. On a union-L2 failure,
all patches are already committed, so recovery reverts those commits without
reverse-applying a patch.

Verification climbs only as needed: L0 probes prerequisites, L1 proves one task,
L2 proves the integrated affected closure, and finalization-only L3 runs the
repository-wide suite. Use exact scope labels:

- L1: `task-local checks passed`
- L2: `affected closure passed`
- L3: `repository-wide suite passed`

A clean state-bound L3 record may be reused until code, commands, dependencies,
or the recorded environment changes.

## Pi Runtime

The package registers one Pi extension and one skill tree. The extension:

- injects one compact compatible bootstrap per active context;
- re-enables injection after compaction without duplicating an existing marker;
- exposes `Skill({ skill })` using only Pi's resolved native skill list;
- exposes in-session `TodoWrite`, `/todos`, and `/todo-clear`;
- warns once when Pi resolves `using-superpowers` from another package root.

The package does not scan Git checkouts, npm packages, settings, or project
folders independently.

## Review Convergence

Reviews are bounded risk gates, not open-ended improvement loops. A non-final review unit gets one initial pass and one closure pass, with one review packet per pass. A blocking finding must name an acceptance or protected boundary, show a reproducible failure, identify material behavior/data/security/public-contract impact, and explain why it cannot wait for L2, L3, or final review. Test completeness, speculative vectors, wording, metadata, and style suggestions are deferred unless that impact is demonstrated.

Closure review is limited to the original findings, the fix diff, and adjacent regression evidence. After closure, new non-Critical findings that were not caused by the fix enter the final-review ledger instead of reopening the task. Full work retains one final whole-change review, one consolidated fix wave, and one closure re-review. The design contract is [review convergence](docs/superpowers/specs/2026-07-22-review-convergence-design.md).

## Verification

```bash
npm test
npm run typecheck
npm run upstream:check -- --source <upstream-checkout>
```

`npm test` covers structure and references, the pinned sync tool, extension
lifecycle and failure paths, route and skill contracts, Pi tool references, and
the behavioral report validator. Generated evaluation reports under
`evals/results/` are local evidence and are not committed.

## Upstream Synchronization

Synchronization is offline and requires an explicit checkout of the exact
pinned commit:

```bash
npm run upstream:check -- --source <upstream-checkout>
npm run upstream:sync -- --source <upstream-checkout>
```

`sync` updates only files classified `unchanged`. Changes to `lite-modified` or
`pi-adapted` files require manual reconciliation and manifest regeneration.

## Rollback

Remove Lite and, when needed, restore the official upstream package while
leaving unrelated packages and `pi-subagents` unchanged:

```bash
pi remove git:github.com/mapleluvr/pi-superpowers-lite
pi install https://github.com/obra/superpowers
```

Reload Pi and use `pi list` to confirm that only the intended Superpowers
package is active.

## License

MIT. See [LICENSE](LICENSE). Upstream attribution and the pinned source identity
are recorded in [UPSTREAM.md](UPSTREAM.md).
