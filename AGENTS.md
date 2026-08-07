# AGENTS.md

Working reference for agents in this repository. This repo **is** the Specbase
product and it self-hosts the governed spec model it ships.

- Planning store: **`specbase/`** (`config.yaml`, `specs/`, `changes/`).
  `openspec-old/` is retired history — read it for rationale, never for
  current truth.
- Skill / slash-command surface: **`spcb`** — `/spcb:explore`,
  `/spcb:propose`, `/spcb:apply`, `/spcb:archive`, `/spcb:review-panel`.
  (`opsx` is the superseded name.)
- CLI: **`specbase`** (`node bin/specbase.js` from a local build). It prefers
  the `specbase/` store and falls back to a legacy `openspec/` one. `openspec`
  remains a backward-compatible bin alias for the same CLI, so the enforcement
  bindings that invoke `openspec validate` keep working.
- Organizing rules for the spec tree: [`docs/clean-specbase.md`](docs/clean-specbase.md).
  Writing rules for one pair: [`docs/clean-spec.md`](docs/clean-spec.md).

---

## Quick reference

Copy-ready structures first. Read the linked section when you need the why.

### `proposal.md` — see [Draft](#2-draft)

```markdown
## Why
<!-- the problem, in user terms -->

## What Changes
- <!-- bulleted, user-visible -->
- **BREAKING:** <!-- if any -->

## Impact
- Affected specs: <!-- locators -->
- Affected code: <!-- paths -->
```

### `tasks.md` — see [Draft](#2-draft)

```markdown
## 1. <group>
- [ ] 1.1 <task>
- [ ] 1.2 <task>
```

### Spec delta — `specbase/changes/<change>/specs/<plane>/<locator>/spec.md`

See [Behavior-first authoring](#behavior-first-authoring) and
[Planes and placement](#planes-and-placement).

```markdown
---
id: <plane>.<locator-slug>
---

## ADDED Requirements

### Requirement: <name>
**ID:** <requirement-slug>
The system SHALL <observable outcome>.

#### Scenario: <name>
**ID:** <scenario-slug>
- **WHEN** <condition>
- **THEN** <expected outcome>
- **AND** <further expectation>
```

Delta section headers: `## ADDED Requirements`, `## MODIFIED Requirements`,
`## REMOVED Requirements`, `## RENAMED Requirements`. A `MODIFIED` block
restates the **whole** requirement, not a diff.

Worked example:

```markdown
### Requirement: Validation reports actionable remediation
**ID:** actionable-remediation
`openspec validate` SHALL report, for every issue, the file path and a
concrete next step the author can take.

#### Scenario: A malformed scenario is reported
**ID:** malformed-scenario-reported
- **WHEN** a requirement contains a bullet list instead of `#### Scenario:`
- **THEN** the output names the file and line and states the fix
```

### `enforcement.md` — paired with every governed `spec.md`

See [Pairs and enforcement](#pairs-and-enforcement).

````markdown
# Enforcement: <paired spec title>

```yaml
version: 1
spec: <plane>.<locator-slug>
bindings:
  - id: <binding-slug>
    covers: [<requirement-slug>, <scenario-slug>]
    mechanism: test        # test | lint | static-analysis | command | review | manual
    strength: automated    # automated | review | manual | unenforced
    status: active         # planned | active
    targets:
      - test/<path>.test.ts
    run:
      command: pnpm
      args: [test, --, test/<path>.test.ts]
      cwd: .
    limitations: <what this check does NOT prove>
```
````

---

## The essentials

Four steps. Everything else on this page is optional depth.

### 1. Scaffold

`/spcb:propose` (or `/spcb:explore` first when the shape is unclear). A change
lands at `specbase/changes/<change-id>/` with `proposal.md`, `tasks.md`, and
spec deltas under `specs/<plane>/<locator>/`.

### 2. Draft

Fill the templates above. Then work the tasks with `/spcb:apply`, ticking
`tasks.md` as you go and recording what you verified.

### 3. Validate

```
openspec validate --change <change-id> --strict
openspec coverage --json
```

Run the [pre-validation checklist](#pre-validation-checklist) first — it costs
less than a failed run.

### 4. Request review

`/spcb:review-panel` runs the blind per-lens panel over the residue above the
deterministic gate. Findings are review-strength and never gate. Then
`/spcb:archive`.

---

## Product lens first

Start from how the work is **experienced**, not from the command or file
structure. This product has two users:

- **Humans** — they mostly do the work by prompting agents. Shell commands are
  supporting mechanics, not the product story.
- **Agents** — they need clear intent, discoverable state, unambiguous next
  actions, and enough structured output to act safely.

Good human UX is usually good agent UX. When an answer gets confusing, reframe
it as:

```text
What does the human want?
What does the agent need to know?
Where does the work live?
What changes on disk?
How does the user know it worked?
```

## Behavior-first authoring

A spec states **externally verifiable behavior**: inputs, outputs, errors, and
constraints a reader can check from outside.

**Put in `spec.md`:**

- observable outcomes, in user-facing product language
- inputs, outputs, error conditions, exit codes
- the contract, phrased as a positive user outcome wherever possible

**Keep out of `spec.md`:**

- library, framework, and vendor choices
- class-, function-, and module-level implementation detail
- "how it works" narration with no contract to guard

Implementation detail is not lost — it goes in **`design.md`** (why and how)
or **`tasks.md`** (the steps), never in the requirements body.

> A foreign fact in a behavior spec is a leak. `behavior/telemetry` says "the
> telemetry backend"; that it is PostHog lives in `ops/stack`.

## Lightweight by default

Rigor is proportional to risk.

- Write the **smallest spec that is still testable and reviewable**.
- Routine change → concise requirements, one or two scenarios each.
- Reserve fuller specification for higher-risk work: API breaks, migrations,
  cross-team surfaces, security or privacy.
- Prefer an honest `review` binding over a fake automated check. `degraded` is
  an acceptable, visible state; hollow enforcement is not.
- Do not add ceremony a reviewer would not read.

## Pre-validation checklist

Before `openspec validate`:

- [ ] Frontmatter `id` present and matches `<plane>.<locator-slug>`.
- [ ] Delta file sits under `specs/<plane>/<locator>/` inside the change.
- [ ] A delta section header exists (`## ADDED Requirements`, etc.) — a spec
      delta with none parses as empty.
- [ ] Every requirement uses `### Requirement:` and carries `**ID:**` on the
      line directly below.
- [ ] Descriptive requirement text sits between the header and the first
      scenario. A requirement that jumps straight to a scenario is malformed.
- [ ] Every scenario uses `#### Scenario:` — four hashes, not three, and not a
      bare bullet list.
- [ ] Scenario bullets are `- **WHEN**` / `- **THEN**` / `- **AND**`.
- [ ] Requirement and scenario IDs are unique within the pair and unchanged
      from any earlier version (IDs are immutable; titles are not).
- [ ] `MODIFIED` requirements restate the full requirement.
- [ ] `enforcement.md` exists beside every governed `spec.md`, its `spec:`
      equals the paired frontmatter `id`, and every `covers` entry names a real
      ID in that pair.
- [ ] Every automated binding has `run:`; every review binding has `review:`;
      every `active` binding has an existing target on disk.
- [ ] Run the binding commands. A binding that exits non-zero is not evidence.

---

# Advanced

## Planes and placement

Six planes are resolved in `specbase/config.yaml`: `behavior`,
`architecture`, `ops`, `code-quality`, `design-system`, `agents`. Planes are
**peers**, not layers.

**The actor test** — put two requirements in the same plane only if the same
actor would demand their revision. When unsure, ask who shows up angry when the
requirement breaks.

Placement rules (full text in [`docs/clean-specbase.md`](docs/clean-specbase.md)):

- **One truth, one plane.** Reference other planes by locator; never restate.
- **Depth is volatility.** Leaves churn; parents hold what every child obeys.
- **Hoist on duplication.** Promote to a parent pair only when two or more
  siblings would otherwise duplicate the claim.
- **Quantify to place.** "*Every* command SHALL…" is a parent claim; enforce it
  by one iteration test over the registry, not thirteen assertions.
- **Earn parents.** An intermediate directory defaults to a pure namespace with
  no `spec.md`.

The `agents` plane is special: each spec **describes** an operational artifact
the repo owns (`specbase/config.yaml`, `DEFAULT_LENSES`, a `SKILL.md`, this
file) and its enforcement binds a conformance or drift check against that
artifact. The artifact stays the runtime source of truth — never generate the
artifact from the spec.

## Pairs and enforcement

Every governed `spec.md` has an `enforcement.md` beside it holding exactly one
authoritative fenced `yaml` document.

- Bind at the **requirement** level; name what the check misses in
  `limitations`.
- Use `review` with a real lens where no test honestly covers the claim, and
  point `covered_by` at the deterministic bindings the review sits above.
- Lens roster: `architectural`, `behavioural`, `ops`, `code-quality`, `design`,
  and the cross-cutting `enforcement`. The `agents` plane declares no default
  lens — name `enforcement` explicitly.

## Multi-capability changes

One change may legitimately touch several planes — that is common cause, and it
is healthy. Give each locator its own delta directory under the change. If the
diff grows past comfortable review size, split into tranches that each archive
independently and leave the store valid in between.

## Archiving

`/spcb:archive` applies the change's deltas into `specbase/specs/` and moves the
change to `specbase/changes/archive/<date>-<change-id>/`. Before archiving:
tasks complete, `openspec validate --strict` green, and every `active` binding
actually run.

## Repo conventions

- TypeScript, Node ≥20.19, ESM, pnpm, Commander.js.
- Cross-platform (macOS, Linux, Windows): always `path.join()` / `path.resolve()`,
  never hardcoded separators — in tests too.
- Attribution to upstream OpenSpec (`LICENSE`, `NOTICE.md`, the README credit)
  is never rebranded.
