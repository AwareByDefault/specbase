## Context

Specbase's own prose drifts toward marketing language and needless complexity.
Simplified Technical English (ASD-STE100) is a controlled-language standard that
keeps technical writing short, active, and unambiguous. A reference linter that
scores prose against a concrete rule set already exists in this change at
`reference/ste-lint.py`; it reports counts for marketing adjectives, banned
words, phrasal verbs, passive voice, nominalizations, long sentences, em-dash
slop markers, and more.

This change turns that reference into a shipped, governed capability with four
moving parts across four planes:

- a `specbase ste-lint` CLI command (behavioral truth — a user-visible contract);
- `ops.ste`, which adopts STE as Specbase's own writing standard and names the
  linter as the adopted tool (planted opt-in for other users);
- a plane-parametric init baseline planter (architectural truth) that can plant
  baseline pairs across more than one plane; and
- an `agents.ste-writing` SKILL.md instrument that helps agents produce
  STE-compliant prose (planted opt-in).

The capability ships in the npm package for every consumer. Only the two
baseline spec pairs (`ops/ste` and `agents/ste-writing`) are opt-in at `init`,
gated exactly like the existing agentic-review baseline.

Current state that constrains the work:

- The `behavior/cli` parent pair already exists in the store and hoists the
  cross-command CLI invariants (verb–noun structure, `--json` output, actionable
  errors, exit codes). `behavior.cli.ste-lint` lands as a leaf under it and
  inherits those invariants rather than restating them.
- The init planter today is `plantAgentsBaseline` in `src/core/init.ts`: it is
  hardcoded to the `agents` plane and copies pairs from
  `templates/baseline/agents/<locator>` keyed to an `agenticReview` boolean.
- Commands register through `register*Command` modules wired in
  `src/cli/index.ts`, and every command must also appear in the completion
  registry at `src/core/completions/command-registry.ts` to satisfy the parent
  `completion-registration` invariant.
- `coverage` is the closest existing model for `ste-lint`: a reporting command
  that gates its exit code on a flag (`--strict`) and supports `--json`.

## Goals / Non-Goals

**Goals:**

- Ship `specbase ste-lint` as a first-class command: lint files/globs or stdin,
  emit an aggregate `--json` document, gate on a `--max <n>` threshold with a
  non-zero exit, and separate error categories from warning categories.
- Reproduce the reference linter's rule set and metric (`total_per100w`) exactly,
  using `reference/ste-lint.py`'s output as a golden fixture the TS port matches.
- Adopt STE for Specbase's own docs (`ops.ste`) with `ste-lint` as the automated
  enforcement tool, plus a review binding for the judgment the linter cannot make.
- Generalize baseline planting so an opt-in STE selection plants both the
  `agents/ste-writing` and `ops/ste` baseline pairs, idempotently, without
  overwriting a customized baseline.
- Ship the STE writing SKILL.md instrument and register it.

**Non-Goals:**

- Adding a Python runtime dependency. The reference `.py` is an executable
  specification and a golden-output fixture, not a shipped artifact.
- Remediating Specbase's existing doc backlog in this change. Enforcing STE over
  current docs will surface many violations (the governed guidance leans on
  em-dashes and banned words); `ops.ste` states the scoped glob it gates today,
  and the backlog is tracked separately.
- Imposing STE on other users. Consumers get the command always; the baseline
  specs are opt-in only.
- Extending STE to non-prose surfaces (code comments, generated JSON).

## Decisions

**D1 — Port the linter to TypeScript (reject bundling the `.py`).** Specbase
ships via npm as a Node CLI. A planted, npm-distributed capability must not carry
a Python runtime dependency, and shelling out to `python3` breaks on consumers
without Python and would add Python to `ops/stack`. The rule engine is therefore
ported to TypeScript. `reference/ste-lint.py` becomes the executable
specification of the rules; its JSON output over a fixed corpus is the golden
fixture the port must match byte-for-byte on the metric fields.
- *Enforcement of the resulting behavior:* `behavior.cli.ste-lint` binds
  **vitest** (automated) — property/example tests over a known-violation corpus
  and a clean corpus, with the reference output as the golden fixture. A test
  fits because the claim is an observable input→output contract.

**D2 — Gate, don't just report (reject the reference's always-exit-0).** The
reference linter always exits 0: it reports counts, it never fails. An honest
automated binding needs a pass/fail threshold. The shipped command therefore adds
`--max <n>` and a non-zero exit when the total-per-100-words metric (or a category
count) exceeds the threshold, and assigns severity per category: `banned_word`
and `marketing_adjective` are **errors** by default; stylistic counts (long
sentences, passives, em-dashes) are **warnings** unless a threshold promotes them.
This mirrors `coverage --strict`, the existing gate-on-a-flag reporting command.

**D3 — Split STE across the plane each subject answers to.** STE is not one
truth; it is three subjects plus a seam:
- The *command contract* (input modes, categories, metric, `--json`, `--max`,
  exit codes) is user-visible → **behavior** plane (`behavior.cli.ste-lint`).
- The *standard the repo adopts and the tool it adopts* is an ops choice →
  **ops** plane (`ops.ste`). Swapping the adopted linter touches ops only.
- The *writing skill* is a repo-owned agentic instrument → **agents** plane
  (`agents.ste-writing`). It helps satisfy `ops.ste` but is NOT its enforcement.
- Making the planter reach two planes is an init-seam structural invariant →
  **architecture** plane (`architecture.baseline-planting`).

  This keeps each fact in one home. `ops.ste` names the linter by the role
  "the adopted STE tool"; it references `behavior.cli.ste-lint` by locator and
  does not restate the command's contract.

**D4 — Enforcement mechanism per governed claim:**

| Spec | Claim nature | Mechanism | Why |
|------|--------------|-----------|-----|
| `behavior.cli.ste-lint` | observable command I/O + exit code | **test** (vitest, automated) | input→output contract; golden fixture from the reference |
| `ops.ste` | docs stay under the STE threshold | **command** (automated) `ste-lint --json --max <n>` over the doc glob | the adopted tool is the honest gate |
| `ops.ste` (residue) | clarity / one-topic-per-sentence intent | **review** (ops lens, `covered_by` the command binding) | judgment a linter cannot make; reviews only the residue above the gate |
| `agents.ste-writing` | the SKILL.md exists, is registered, declares the STE mandate | **skill-conformance** (automated) | the instrument must conform to what the spec describes |
| `architecture.baseline-planting` | planter plants the declared set across selected planes, idempotently, never overwriting a customization | **conformance test** (automated) + init integration test | structural invariant over the seam; test drives the planter directly |

**D5 — Generalize the planter, don't fork it.** `plantAgentsBaseline` becomes
plane-parametric: it takes a declared set of `{plane, locator}` baseline pairs and
plants each from `templates/baseline/<plane>/<locator>` to
`specs/<plane>/<locator>`, keeping the existing idempotent "never overwrite"
guarantee. The agents-baseline call site becomes one caller of the general
routine. A new init prompt gates the STE bundle (`agents/ste-writing` + `ops/ste`)
as a single opt-in, the same shape as the agentic-review gate.

## Risks / Trade-offs

- **[TS port diverges from the reference regexes]** → Pin the reference output as
  a committed golden fixture and assert the port matches on a shared corpus;
  divergence fails the `behavior.cli.ste-lint` suite.
- **[Enforcing STE over existing docs surfaces a large backlog]** → `ops.ste`
  gates a scoped doc glob at a stated `--max` threshold, not the whole repo at
  zero. Widening the glob or lowering the threshold is a later change to `ops.ste`
  with its own remediation pass. The design does not pretend this is a switch flip.
- **[`--max` threshold is arbitrary]** → State the initial threshold and glob in
  `ops.ste` as the current, revisable truth; the number is enforced, the choice is
  a documented ops decision, not a behavior claim.
- **[Planter generalization regresses the agents baseline]** → The conformance +
  init integration test asserts the agents baseline still plants unchanged and
  that a customized baseline is left untouched, so the refactor cannot silently
  regress the existing path.
- **[Plane misclassification]** → The four-plane split follows the actor test
  (who demands the change): command users, the repo's ops owner, the skill author,
  and the init-seam maintainer are distinct actors, so the facts belong in
  distinct planes and none couples to another.

## Migration Plan

1. Land the TS rule engine and `specbase ste-lint`, with the reference output
   pinned as the golden fixture; register the command and its completion entry.
2. Generalize `plantAgentsBaseline` to the plane-parametric planter; keep the
   agents-baseline call site working through it.
3. Add the two baseline template pairs (`agents/ste-writing`, `ops/ste`) and the
   opt-in init prompt that plants the STE bundle.
4. Ship the STE writing SKILL.md and register it.
5. Adopt `ops.ste` for Specbase itself against a scoped doc glob and threshold;
   resolve the `ops.ste` command binding to `active` once the gate passes on that
   scope.

Rollback: the command is additive and the baselines are opt-in, so reverting is
removing the command registration, the baseline pairs, and the init prompt; no
consumer data migration is involved. This transitional rationale lives here and
in the dated archive, not in the permanent specs.

## Open Questions

- Exact initial `--max` threshold and doc glob for `ops.ste` — decided at
  implementation against the real backlog count, then recorded in `ops.ste`.
- Whether `em_dash` should be an error or a warning for Specbase's own gate given
  how heavily current governed guidance uses em-dashes — warning initially.
