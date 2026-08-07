## Why

Specbase's prose — READMEs, skill docs, generated agent docs, CLI copy — drifts
toward marketing slop and needlessly complex language. Simplified Technical
English (ASD-STE100) is a controlled-language standard that keeps technical
writing short, active, and unambiguous. This change makes STE a first-class,
enforceable standard for Specbase itself, and ships the capability — a writing
skill plus a linter — as an **opt-in baseline** other Specbase users can adopt
at `init`, gated exactly like the agentic-review baseline.

The concrete rule set already exists: a Python reference linter (captured in this
change at `reference/ste-lint.py`) that scores prose for marketing adjectives,
banned words, phrasal verbs, passive voice, nominalizations, long sentences,
em-dash slop markers, and more. This change turns that reference into a shipped,
paired, governed capability.

## Decisions taken (from exploration)

- **Plane split.** STE is three subjects in three planes: the *skill* that helps
  agents produce STE (agents plane), the *standard + tool* the repo adopts (ops
  plane), and the *linter command's contract* (behavior plane). Extending the
  planter to reach two planes is itself an init-seam change (architecture plane).
- **Opt-in for other users.** Specbase adopts STE for itself; other users get it
  as an opt-in `init` baseline (never imposed).
- **DECISION (port to TS).** The reference linter is Python, but Specbase ships
  via npm as a Node CLI. A planted, npm-distributed capability must not carry a
  Python runtime dependency, so the linter is **ported to TypeScript**;
  `reference/ste-lint.py` becomes the executable specification of the rules and a
  golden-output fixture the port must match. *(Alternative rejected: bundle the
  `.py` and shell to `python3` — adds Python to `ops/stack` and breaks on
  consumers without Python.)*
- **DECISION (gate, don't just report).** The reference linter always exits 0 —
  it reports counts, it does not fail. An honest automated binding needs a
  pass/fail threshold, so the shipped command adds `--max` / severity and a
  non-zero exit. `banned_word` and `marketing_adjective` are errors by default;
  stylistic counts (long sentences, passives, em-dashes) are warnings unless a
  threshold is set.

## What Changes

- **Ship `specbase ste-lint`** — a new CLI command (TS port of the reference
  linter): lint files/globs or stdin, aggregate `--json`, a `--max <n>` threshold
  with non-zero exit, and error-vs-warning severity per category. This is a
  user-visible contract → **behavioral truth**.
- **Add the STE writing SKILL.md** — a repo-owned instrument that instructs
  agents to produce STE-compliant prose. Planted opt-in.
- **Adopt STE for Specbase's own docs** — `ops/ste` declares STE the writing
  standard for READMEs, skill docs, and internal docs, with `ste-lint` as the
  adopted tool. Planted opt-in into consumers too.
- **Generalize baseline planting** — `plantAgentsBaseline` becomes
  plane-parametric so an opt-in STE selection plants both the `agents/ste-writing`
  and `ops/ste` baseline pairs. New init prompt gates the whole bundle.
- **New baseline template dirs** —
  `schemas/spec-driven-governed/templates/baseline/agents/ste-writing/` and
  `.../baseline/ops/ste/`.

## Planes

### Behavioral truth
- `behavior.cli.ste-lint` (new leaf under the `behavior/cli` parent pair from
  `migrate-specbase-specs`): the `ste-lint` command surface — input modes
  (files/globs/stdin), the violation categories and `total_per100w` metric,
  `--json` aggregate output, `--max`/severity, and exit codes. Inherits the
  hoisted CLI invariants (verb–noun, `--json`, actionable errors) from the parent.

### Ops
- `ops.ste` (new, **planted opt-in**): Specbase writes its READMEs, skill docs,
  and internal docs in Simplified Technical English; `specbase ste-lint` is the
  adopted enforcement tool.

### Architecture
- `architecture.baseline-planting` (new): the init baseline planter is
  plane-parametric — it plants a declared set of baseline pairs across the
  selected planes, idempotently, and never overwrites a customized baseline. (If
  an `init`/scaffolding architecture pair already lands in `migrate`, this folds
  into it rather than standing alone.)

### Agents
- `agents.ste-writing` (new, **planted opt-in**): the STE writing SKILL.md
  instrument. Describes the skill; the skill helps satisfy `ops.ste` but is not
  its enforcement.

## Spec pairs (enforcement)

- `behavior.cli.ste-lint` → **vitest** (automated): property/example tests over a
  known-violation corpus and a clean corpus; the `reference/ste-lint.py` output is
  the golden fixture the TS port must match.
- `ops.ste` → **`command`** binding running `specbase ste-lint --json --max <n>`
  over the doc glob (automated, gates on the threshold) **+** an `ops`-lens
  **`review`** binding for the STE judgment the linter cannot make (clarity,
  one-topic-per-sentence intent), with `covered_by` naming the lint binding so the
  lens reviews only the residue above the automated gate.
- `agents.ste-writing` → **skill-conformance** (automated): the SKILL.md exists,
  is registered, and its frontmatter declares the STE mandate.
- `architecture.baseline-planting` → **conformance test** (automated) over the
  planter + an init integration test asserting an opt-in run plants both pairs and
  a customized baseline is left untouched.

## Impact

- **Affected code**: new `src/commands/ste-lint.ts` (+ registration); the TS STE
  rule engine; `src/core/init.ts` (new opt-in prompt, plane-parametric planter);
  four new baseline template files; the shipped `SKILL.md`.
- **Stacking**: depends on `migrate-specbase-specs` for the `behavior/cli` parent
  pair and the governed store layout. Sequence after it.
- **Adoption cost (honest)**: enforcing STE over Specbase's *existing* docs will
  surface a large backlog — the governed guidance and specs lean heavily on
  em-dashes and words on the banned list. The rollout needs either a scoped
  initial glob, a baseline-allow, or a remediation pass; `ops.ste` should state
  which. This is real work, not a flip of a switch.
- **Dependencies**: none added (TS port avoids a Python runtime dep).
- **Distribution**: the capability ships in the npm package and is available to
  every consumer; only the *baseline specs* are opt-in at `init`.
