# Clean Specbase

How to organize governed spec pairs so truth stays findable, planes stay
independent, and change ripples only where intended.
For how to write one pair, read [Clean Spec](clean-spec.md).

Style: one rule per sentence, imperative mood, active voice (ASD-STE100).
Status: living document. Rules graduate into governed pairs as they prove out.

---

## 1. Planes are peers, not layers

Clean Architecture nests rings under a dependency rule. Planes do not nest.
Each plane answers to a different actor, on its own clock.

**The Actor Test** (SRP, restated for specs):

> Put two requirements in the same plane only if the same actor would demand
> their revision.

| Plane | Actor | Re-specified when… |
|---|---|---|
| behavior | users & integrators | the product's promises change |
| architecture | maintainers | structural invariants change |
| ops | infra / toolchain owners | the runtime world changes |
| design-system | design & brand owners | expression standards change |
| code-quality | reviewers / authors | craft standards change |
| agents | agents working the repo | the instruments change |

When a plane is ambiguous, ask who shows up angry when the requirement
breaks. That actor's plane is its home.

## 2. One truth, one plane

- Give every fact exactly one home locator. Let other planes reference it by
  locator. Never let them restate it.
- Expect co-change: one feature legitimately lands behavior, architecture,
  and agents deltas together. That is common cause, and it is healthy.
- Forbid coupled change: editing one plane's text must never force an edit
  to another's.
- **The swap test:** you must be able to swap a vendor, a CI system, or a
  runtime pin by editing only ops specs. If a behavior spec must change, an
  ops fact has leaked.

Worked example: `behavior/telemetry` says "the telemetry backend"; that the
backend is PostHog lives in `ops/stack`. Swapping vendors touches one plane.

## 3. Depth is volatility

The stability gradient Clean Architecture puts between layers lives *inside*
each plane, as nested locators.

```
  behavior/
    cli/               ← parent pair: invariants every command obeys
      init/            ← leaf pair: one command's specifics (churns freely)
      change/
      coverage/
```

- **Rootward dependency.** A leaf refines its ancestors. Never let a parent
  depend on a leaf.
- **Leafward ripple.** A parent edit may ripple to its leaves — that is the
  gradient working. A leaf edit must never force an ancestor edit.
- **Open-closed at every node.** Adding a leaf must touch nothing above it.
  A parent that lists its children has a reverse dependency.
- **No inheritance.** Ancestry provides navigation only. A parent is not a
  base class; leaves do not override it. Parent and leaf bind independently.
  A conflict between them is a defect, not a precedence question.

Place each requirement at the depth that matches how far you intend its
changes to ripple.

## 4. Place each requirement

- **Hoist on duplication** (DRY within a plane). Hoist a requirement to the
  parent only when two or more siblings would otherwise duplicate it. Leave
  specifics at the leaf.
- **Quantify to place.** "*Every* command SHALL…" is a parent claim.
  A command-specific claim is a leaf claim. Enforce universal claims by
  iteration: one conformance test over the registry beats thirteen
  per-command assertions.
- **No leaf exemptions** (LSP). If one leaf cannot satisfy a parent
  invariant, the parent invariant is wrong. Narrow the parent ("every *read*
  command…"). Never special-case the leaf.
- **Earn parents** (rule of three). Default an intermediate directory to a
  pure namespace — no `spec.md`. Create the pair when siblings actually
  share invariants. A parent pair guarding one child is noise.
- **Earn depth.** Flatten an intermediate node with no pair and no plausible
  one. Working ceiling for this repo: two levels below the plane.

## 5. Measure cleanliness

The archive records which locators every change touched, so these audits are
scriptable — review-strength today, command bindings as history accrues:

- **Churn-by-depth.** Healthy planes churn at the leaves. A parent edited
  every time a leaf changes is too concrete, or a false abstraction.
- **Ripple audit.** When one change touches parent and leaf in a plane, the
  ripple must flow leafward. Flag rootward ripples.
- **Leak lint.** Foreign facts in behavior specs (vendor names, runtime
  pins, CI vocabulary) are string-matchable.
- **Restatement check.** Near-duplicate requirement text across planes is a
  DRY violation.

## 6. Smells

Each smell names a rule above; the fix lives at that rule.
(Writing-level smells live in [Clean Spec §6](clean-spec.md#6-smells).)

- **Leaked fact** — a fact edited in one plane forces an edit in another (§2).
- **Restated truth across planes** — one claim living in two planes (§2).
- **Churny parent** — a parent edited in lockstep with its leaves (§3).
- **Enumerating parent** — a parent that lists its children (§3).
- **Speculative parent** — a parent pair nobody hoisted into (§4).
- **Leaf exemption** — a leaf quietly violating an ancestor invariant (§4).

## 7. Rules

The distilled imperative form of §1–§6. This block is the single authored home
of the placement rules injected into the generated spec-driven skills:
`node scripts/generate-clean-rules.mjs` lifts it verbatim during the build.
Edit the rules here — never in the generator, and never in a skill file.

<!-- BEGIN RULES -->
Placing a governed pair in the spec tree:

- Treat planes as peers, never as layers. Each plane answers to a different
  actor, on its own clock.
- Apply the actor test: put two requirements in the same plane only if the same
  actor would demand their revision. When the plane is ambiguous, ask who shows
  up angry when the requirement breaks.
- Give every fact exactly one home locator. Let other planes reference it by
  locator; never let them restate it.
- Expect co-change: one feature may legitimately land deltas in several planes.
- Forbid coupled change: editing one plane's text must never force an edit to
  another's.
- Apply the swap test: swapping a vendor, a CI system, or a runtime pin must
  touch ops specs only.
- Treat depth as volatility. A leaf refines its ancestors; a parent never
  depends on a leaf.
- Let ripple flow leafward. A parent edit may ripple to its leaves; a leaf edit
  must never force an ancestor edit.
- Keep every node open-closed. Adding a leaf must touch nothing above it. A
  parent that lists its children has a reverse dependency.
- Inherit nothing. Ancestry provides navigation only; parent and leaf bind
  independently, and a conflict between them is a defect, not a precedence
  question.
- Place each requirement at the depth that matches how far you intend its
  changes to ripple.
- Hoist on duplication. Promote a requirement to the parent only when two or
  more siblings would otherwise duplicate it. Leave specifics at the leaf.
- Quantify to place. "Every X SHALL…" is a parent claim; enforce it by one
  conformance test over the registry, not by per-child assertions.
- Grant no leaf exemptions. If one leaf cannot satisfy a parent invariant,
  narrow the parent; never special-case the leaf.
- Earn parents. Default an intermediate directory to a pure namespace with no
  `spec.md`, and create the pair only when siblings actually share invariants.
- Earn depth. Flatten an intermediate node that has no pair and no plausible
  one.

Reject these placement smells: leaked fact, restated truth across planes, churny
parent, enumerating parent, speculative parent, leaf exemption.
<!-- END RULES -->

## Open questions

- Which namespaces have *earned* parent pairs today? (`behavior/cli` almost
  certainly; `behavior/schemas` maybe; `behavior/workflow` probably not yet.)
- Where does the design-system plane's constraint on *expression* of
  behavior specs sit relative to the one-truth rule?
- When do the §5 audits graduate from review bindings to command bindings —
  how much archive history is enough?
- Should these two documents become governed pairs (`code-quality/clean-spec`,
  `code-quality/clean-specbase`), distilled into testable SHALLs?

---

*Adapted from Robert C. Martin's Clean Architecture, applied to governed
specs: planes as peers under the actor test, the stability gradient inside
each plane, truth stated once.*
