## Context

`generalize-spec-planes` turned planes from a frozen enum into schema-declared data (`{id, purpose, enforcementFlavor, reviewLens?}`), split into a resolved-default `planes:` list and an offered `optionalPlanes:` list. `add-agents-plane` established the DESCRIBE pattern — a plane spec can govern an *operational artifact* (config, lens set, hook) through a conformance binding, leaving the artifact as the runtime source of truth — and the pattern of offering a plane at init and appending it to config on opt-in.

Two forces meet here. First, there is no home for a product's *expressed identity* (visual tokens, design principles, copy voice/tone), even though that identity drifts silently and is exactly what paired enforcement is for. Second, init still gates governance behind a binary "governed?" prompt plus bolted-on opt-ins, which is the wrong seam once planes are the real unit of opt-in.

## Goals / Non-Goals

**Goals**
- Add a `design-system` plane with the same two-strength shape as `code-quality` (automated where verifiable, review for the residue).
- Make governance emergent: a project is governed iff it resolves ≥1 plane; `kind` is derived.
- Collapse the `planes:`/`optionalPlanes:` schema split into one list with a `defaultSelected` flag.
- Keep legacy flat output byte-identical and existing governed projects working.

**Non-Goals**
- No CLI execution of enforcement commands (token linters, contrast checkers) — bindings declare them; running stays out of scope, as with every other plane.
- No token-file generation or export (no Tailwind/W3C emitters). The plane DESCRIBES tokens; it does not produce them.
- No cross-spec relationship graph or structured `instrument:` binding field (still deferred from add-agents-plane).

## Decisions

### 1. `design-system`, not `design`
The plane id is `design-system` to avoid overloading the existing change-level `design.md` artifact (the transition-rationale doc inside every change). Paths never collide — `specs/design-system/…` vs `changes/<c>/design.md` — and the longer id keeps prose unambiguous. `design-system` also matches the google-labs DESIGN.md framing (a design *system*), while our plane is deliberately broader.

### 2. Two strata, two enforcement strengths
Design truth splits cleanly along what a tool can verify:
- **`design-system/tokens/*`** — invariants over the token artifact (all color derives from named tokens; text/bg pairs meet WCAG AA; type scale is closed). Enforcement: `lint` / `command` bindings (token lint, contrast/a11y checks) whose *target* is the artifact. **DESCRIBE direction**: the `tailwind.config`/`tokens.json` stays the runtime source of truth; the spec asserts a contract over it. This mirrors `ops` (mandate the shape, audit the artifact) and `agents` (describe the operational artifact, bind a conformance check).
- **`design-system/voice/*`** — principles and copy tone ("second-person, terse", "errors never blame the user", "no exclamation marks in error states"). Enforcement: `review` bindings judged by the new `design` lens, exactly as `code-quality`'s residue is judged by its lens. A lightweight banned-word/regex lint MAY supplement a voice truth, but the lens carries the judgment.

This is why the plane is broader than google's DESIGN.md, which is visual-token-only: the review lens lets us govern *copy voice* — the first thing asked for — which a token linter structurally cannot.

### 3. Governance derived from plane count
`specModel.kind` stops being a user-set gate and becomes `planes.length ? 'governed' : 'flat'`, computed during config resolution. Every existing `specModel.kind === 'governed'` check keeps working because the derived value is authoritative; no call site changes its predicate, only the source of the value moves. Zero planes reproduces today's legacy-flat behavior byte-for-byte.

*Why derive rather than keep the gate:* a binary gate plus per-plane opt-ins can disagree (governed=yes but zero planes, or governed=no but a plane appended). Deriving removes the contradiction by construction and makes "which planes" the single decision.

### 4. Collapse `planes:` + `optionalPlanes:` → one list with `defaultSelected`
The offered-vs-resolved distinction was doing the job `defaultSelected` now does per-record. One list is simpler to resolve and render, and it makes the init picker a direct projection of schema data: render every plane, pre-check by `defaultSelected`, resolve = the checked set. Core four = `true`; `design-system` and `agents` = `false`.

### 5. The `design` lens
Add to `DEFAULT_LENSES`: `{ id: 'design', question: 'Does the UI and copy honor the design tokens, principles, and voice?', scope: 'design-system', crossCutting: false }`. It slots into the existing most-specific-subtree router with no new mechanism, parallel to `ops`.

### 6. Agents becomes a plain checkbox
Per the decision to make all planes peers in the picker, the `agents` plane is a normal unchecked offer. Consequence: `agents/spec-driven` (the self-host record) plants only when `agents` is selected, rather than auto-planting for every governed project. The `config.yaml` plane roster remains the authoritative record that a project is governed, so nothing depends on the baseline spec's presence. This is a deliberate, accepted trade of one dogfood convenience for a uniform mental model (every plane is a peer choice).

## Risks / Trade-offs

- **[Losing the always-on self-host spec]** → The `config.yaml` roster is the real governance record; the `spec-driven` baseline was a dogfood nicety, not a dependency. Re-selectable at any time by ticking `agents`. Revisit only if a downstream check turns out to assume the spec is always present.
- **[Existing configs that set `kind` explicitly]** → Derivation must not break a project that wrote `kind: governed`. Mitigation: derive from planes but treat a non-empty resolved set as governed regardless; a legacy `kind: governed` with planes present resolves identically. Add a resolution test for the legacy-config path.
- **[Token enforcement looks runnable but isn't executed]** → Same limitation as every plane: bindings declare commands, core never runs them. Document it in the template so authors don't expect `openspec` to run the contrast checker.
- **[Design truth mis-filed as behavior]** → Conventions + the design-system template must make the identity-vs-outcome boundary crisp; the openspec-conventions delta covers this.

## Migration Plan

1. Schema: merge `planes`/`optionalPlanes` into one list, add `defaultSelected` to every record, add the `design-system` record.
2. Resolution + config loading: expose the unified list; derive `kind` from resolved plane count; keep append/replace semantics.
3. Init: replace the governed prompt + agentic opt-in with the plane picker (select-all + `defaultSelected` pre-check); plant baselines only for selected planes.
4. Lenses: add the `design` lens.
5. Template: add `design-system-spec.md`.
6. Guidance: no code change expected — `governed-guidance.ts` already interpolates resolved planes; verify `design-system` flows through.
7. Tests: resolution (unified list, derived kind, legacy-config parity), init picker, lens routing for `design-system`, flat-output byte-parity.

## Open Questions

- Should a supplementary automated `lint` for voice truths (banned words / punctuation in error copy) ship as a worked example in the template, or stay illustrative prose? Leaning illustrative for this change.
- Do we want `design-system` split into finer default sub-lenses (visual vs copy) later, or is one `design` lens enough? One lens now; split by proposal if pressure appears (same rule as every lens).
