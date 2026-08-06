## Context

`generalize-spec-planes` (near-complete) turned planes from a frozen `['behavior','architecture']` enum into schema-declared data that a project can append to in `config.yaml`. That unlocked adding planes without a code change — but every plane so far describes the *product*: what the system is or does, verified by tests/lint/audit against the code.

A real gap remains: the *instruments* that perform enforcement are ungoverned. This repo's review panel is the `DEFAULT_LENSES` const in `src/core/governed/lenses.ts` — a `code-quality` lens, a `behavioural` lens, an `ops` lens, an `architectural` lens, and a cross-cutting `enforcement` lens. It judges the "review" half of every plane, yet has no spec and can drift from intent silently. In application repos, the same is true of repo-specific skills, subagents, and hooks — they live as prose in `AGENTS.md`, tracked nowhere.

The `agents` plane closes this gap. Its members are a repo's own agentic instruments, and — critically — it is the first plane whose members are *pointed at by other planes' enforcement* (a `code-quality` spec is enforced "somewhat by lint, somewhat by the panel"), not only verified themselves. Giving those instruments a home makes the repo's methodology and tooling governed truth — including, reflexively, the fact that the repo runs OpenSpec at all.

## Goals / Non-Goals

**Goals:**
- Add an opt-in `agents` plane offered at `openspec init`, appended per-project via `specModel.planes+:`.
- Establish the spec↔operational-artifact conformance pattern using existing mechanisms only.
- Make OpenSpec self-hosting: init plants `specs/agents/spec-driven/` describing the repo's use of opsx, enforced by `openspec validate`.
- Ship `specs/agents/review-panel/` as a dogfooded worked example governing this repo's real `DEFAULT_LENSES`.
- Keep legacy flat and existing governed output untouched until a project opts in.

**Non-Goals:**
- A structured `instrument:` reference field on `review`/`manual` bindings (the linkage from `code-quality/naming` → `agents.review-panel`). Explicit follow-on; it touches `enforcement.md`'s schema.
- A general cross-spec relationship graph (already deferred by `generalize-spec-planes`).
- Adding `agents` to the shipped resolved default plane set.
- New enforcement mechanisms, or generating `AGENTS.md`/`config.yaml` from specs.
- Governing agent *behavior* rules (those ride on the other planes).

## Decisions

### 0. Init asks the governed question; the default constant stays flat

**Decision:** `openspec init` gains a **"use the governed model?"** prompt. Answering yes writes `schema: spec-driven-governed` into the project `config.yaml` and unlocks the agentic-tooling / agentic-review prompts; answering no leaves the flat `spec-driven` setup exactly as today. The global `DEFAULT_SCHEMA` constant is **unchanged** — `openspec new change` and every non-init default keep flat behavior, so the ~37 tests and this repo's own dev loop are untouched. The governed prompt is the sanctioned path to a governed project (replacing hand-editing config).

**Rationale:** User direction, refined once the blast radius was clear: "leave the default, ask the governed question on init." Flipping `DEFAULT_SCHEMA` globally would change `openspec new change` in every project (including this repo, which authors under flat) and churn ~37 tests — out of proportion to this change. An init prompt makes governed a first-class, discoverable choice without moving the global default. The agents-plane prompts are children of a yes answer, so no flat-vs-governed branching leaks into them.

### 1. Init plants baseline specs directly as bootstrap scaffolding

**Decision:** When the `agents` plane is enabled, `openspec init` writes the baseline specs (`spec-driven` always; `review-panel` on opt-in) and their enforcement directly under `specs/agents/`, with no `openspec/changes/` entry. This is the one documented exception to the proposal→spec→archive flow. Later edits go through changes.

**Rationale:** `openspec init` already scaffolds durable state (`config.yaml`, directory structure) without a change. A baseline that says "this repo does spec-driven development" cannot itself be born through the spec-driven flow without a chicken-and-egg. Treating it as scaffolding — the same category as the config it accompanies — is honest. `init` must not overwrite a baseline the user has since customized.

### 2. Direction of truth is DESCRIBE, not generate

**Decision:** An `agents`-plane spec that governs an artifact the runtime reads (`config.yaml`, `DEFAULT_LENSES`) *describes* it and asserts conformance; it does not generate it. `config.yaml` stays the runtime source of truth; the spec is a checked description; the binding is a drift/conformance check.

```
specs/agents/spec-driven/spec.md   "planes = {…}; we run opsx"
        │ describes
        ▼
openspec/config.yaml  ──(CLI reads at runtime)──►  planes · lenses · skills
        ▲
        │ conformance binding:  openspec validate ✔  +  resolved roster matches spec
```

**Rationale:** Generating `config.yaml` from the spec would make the spec master of a file the CLI already masters — circular, and it duplicates the source of truth. Describe-with-conformance mirrors `architecture-spec → code → lint` exactly: the spec is truth, the artifact is the thing checked, the binding closes the gap. It reuses `command`/`test`; no new mechanism.

### 3. Contain scope; the `instrument:` linkage ships separately

**Decision:** Ship the plane definition, the init prompt(s), and the two planted baseline specs as worked examples. Do **not** add the `instrument:` field on bindings in this change.

**Rationale:** The plane delivers value with prose-only `review` bindings ("code-quality lens of the review panel") the day it lands — the panel is finally outlined and conformance-checked. The structured link that turns that prose into a traceable reference to `agents.review-panel` changes `enforcement.md`'s binding schema and deserves its own change with its own validation and coverage-view work. Sequencing keeps this change's blast radius to `cli-init` + conventions + new specs.

### 4. Offer-able plane record lives in `optionalPlanes:` in schema.yaml

**Decision:** The `agents` plane record (`id: agents`, `purpose`, `enforcementFlavor: "instrument conforms to its spec (config / lens / frontmatter / hook checks)"`, no dedicated `reviewLens`) is declared under a **new `optionalPlanes:` key** in `schemas/spec-driven-governed/schema.yaml` — planes offered-but-not-resolved-by-default. `init` reads `optionalPlanes` to present the prompt and, on accept, appends the chosen record to the project `config.yaml` under `specModel.planes+:`. The resolved default set (`planes:`) stays behavior/architecture/ops/code-quality. Schema resolution surfaces `optionalPlanes` as structured data alongside `planes`.

**Rationale:** Keeps the plane roster as schema *data* rather than a record hardcoded in `init.ts` (consistent with `generalize-spec-planes`, which made planes data). Many repos build zero agentic tooling — a shipped-default `agents` plane would sit empty; `optionalPlanes` models "available to opt into" cleanly and leaves room for future optional planes (e.g. `security`). No dedicated review lens: an `agents` spec is enforced by conformance (test/command), and a panel reviewing the panel is needless recursion.

### 5. Review-panel baseline: review binding by default, test binding for panel-owners (dogfood finding)

**Decision:** The planted `agents/review-panel` enforcement ships a **review** binding (`panel-review`, strength: review): "confirm the panel provides one lens per governed plane, matching the spec." A repository that OWNS the panel as code REPLACES it with an automated `test` binding — as OpenSpec itself does here, binding `lens-conformance` to a vitest over `src/core/governed/lenses.ts` (`test/core/governed/review-panel.conformance.test.ts`).

**Rationale:** Surfaced while dogfooding in the governed `test-project-2`: a `test` binding pointing at a project-owned conformance test fails `validate` in any project that does not own the panel (broken/missing target). In a consumer, agentic review genuinely IS review-strength — OpenSpec's panel reviews their code; they own no lens code to unit-test — so a review binding is the honest representation, consistent with this repo's enforcement philosophy ("use review/manual openly rather than faking automation"). Because the `agents` plane declares no `reviewLens` (decision 4), this binding shows as "no covering lens" and the spec as honestly `degraded`; `validate` passes. `agents/spec-driven`, whose binding is `openspec validate` itself, is `complete` and universal.

## Risks / Trade-offs

**Risk: the init-scaffold exception weakens the "specs are born through changes" invariant.**
→ Mitigation: it is the single, documented exception, scoped to `init`; the conventions state it explicitly and require later edits to use the change flow. `init` refuses to overwrite a customized baseline.

**Risk: DESCRIBE bindings can rot if `config.yaml` is edited without updating the spec.**
→ Mitigation: that is exactly what the conformance binding catches — `openspec validate` plus a resolved-roster match fail on drift, surfacing the divergence rather than hiding it.

**Risk: authors misuse the plane for agent behavior rules.**
→ Mitigation: the membership requirement and a "does-not-qualify" scenario draw the line; conventions route behavior rules to the plane whose subject they constrain.

**Risk: the review-panel worked example couples to `DEFAULT_LENSES`'s current shape.**
→ Mitigation: the spec declares the lens *set and questions* and binds a conformance test; if the lens set changes deliberately, the spec is updated through a change and the test re-passes — the intended workflow, not a hazard.

## Migration Plan

1. Define the offer-able `agents` plane record (purpose, enforcementFlavor; no reviewLens).
2. Add the `init` agentic-tooling prompt and the agentic-review sub-prompt; on enable, append `planes+: [agents]` to `config.yaml`.
3. Add the plant-baseline-specs step (idempotent; never overwrites a customized baseline).
4. Author the `spec-driven` baseline (spec + enforcement: `openspec validate` + roster conformance) and the `review-panel` baseline (spec + enforcement: lens-conformance test against resolved lenses).
5. Extend the governed conventions with the plane, the conformance pattern, the DESCRIBE direction, and the init-scaffold exception.
6. Dogfood in a **governed test project** (`test-project-2/` or the cohorts webapp), not this repo's own tree (openspec-extended authors its own changes under the flat schema): run `openspec init` there, enable the plane + agentic review, and confirm the planted `spec-driven` and `review-panel` specs plus the lens-conformance test verify against the resolved `DEFAULT_LENSES`.

Rollback: the plane is opt-in; removing the `init` prompt and the offer record leaves all non-opted-in projects byte-identical. Planted specs in an opted-in project are ordinary files, removable by hand.

## Open Questions

- Should `specs/agents/spec-driven/` decompose the custom plane roster into a nested locator (`specs/agents/spec-driven/planes/`) once a project customizes planes, or stay a single spec whose enforcement checks the whole roster? (Lean: single spec now; revisit if roster truth grows.)
- Should the agentic-tooling prompt default to on or off for a fresh governed `init`? (Lean: off — opt-in, least surprise.)
- When the `instrument:` follow-on lands, should existing prose `review` bindings be auto-migrated to reference `agents.review-panel`, or left as prose until hand-updated? (Defer to that change.)
