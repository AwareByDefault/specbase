## Why

The governed model can now enforce every plane's specs — but the *instruments* that do the enforcing are themselves ungoverned. This repo's review panel is a bare `DEFAULT_LENSES` const in `src/core/governed/lenses.ts`; a project's repo-specific skills, subagents, and hooks live only as prose in `AGENTS.md`. A `code-quality` spec is enforced "somewhat by lint, somewhat by the panel," yet the panel it points at has no spec of its own and can drift from intent with nothing to catch it. There is no home for durable truth about a repo's own agentic tooling — including the fact that the repo practices spec-driven development at all.

## What Changes

- **Add an opt-in `agents` plane** whose members are a repo's own agentic *instruments*: the review panel, repo-specific skills, custom subagents, and hooks. It is offered (not shipped as a resolved default) — `openspec init` appends it to `specM​odel.planes` in `config.yaml` only when the user opts in.
- **Establish the governing pattern**: an agents-plane spec governs an *agent-operational artifact* (`config.yaml`, `DEFAULT_LENSES`, a `SKILL.md`, a hook config) through a **conformance/drift binding**. The operational artifact stays the runtime source of truth; the spec is the checked description of it. No new enforcement mechanism — existing `command` / `test` bindings cover it.
- **Make OpenSpec self-hosting at init**: `openspec init` always plants `specs/agents/spec-driven/` — the spec that declares "this repo practices spec-driven development via opsx" — with a binding that `openspec validate` passes and `config.yaml` declares the resolved plane roster. Adopting OpenSpec becomes governed truth, and later customization of the workflow (adding a plane, editing a lens) becomes a governed change rather than an untracked config edit.
- **Ship one opt-in worked example**: when the user answers yes to "enable agentic review," `openspec init` also plants `specs/agents/review-panel/`, authored against this repo's real `DEFAULT_LENSES`, whose paired enforcement is a lens-conformance test (the resolved lens set matches the spec).
- **Bootstrap exception (BREAKING to the usual flow, intentional)**: init writes these baseline `agents` specs directly, as scaffolding, without going through proposal→spec→archive. Subsequent edits to them go through the normal change flow.
- **Direction of truth is DESCRIBE, not generate**: the `spec-driven` spec describes `config.yaml` and asserts conformance; it does not generate the config the CLI already treats as its source. This avoids making the spec the master of a file the runtime masters.
- **Out of scope (explicit follow-on)**: a structured `instrument:` reference field on `review`/`manual` bindings (pointing a plane's enforcement at an agents-plane spec id, e.g. `code-quality/naming` → `agents.review-panel`). The plane is valuable with prose-only bindings first; the linkage field touches `enforcement.md`'s schema and ships separately.

This change builds on `generalize-spec-planes` (near-complete), which turned planes from a frozen enum into schema-declared data appendable in `config.yaml`. It adds no default plane to the shipped resolved set; legacy flat and existing governed projects are untouched until they opt in.

## Capabilities

### New Capabilities

- `agents-plane`: An opt-in governed plane whose members are a repo's own agentic instruments (review panel, repo-specific skills, subagents, hooks). Defines plane membership, the spec↔operational-artifact conformance pattern, the DESCRIBE direction of truth, and the two init-planted baseline specs (`spec-driven`, `review-panel`) as governed, dogfooded examples.

### Modified Capabilities

- `cli-init`: Prompt for agentic tooling during `init`; when opted in, append the `agents` plane to the project `config.yaml` and plant the baseline `agents` specs (`spec-driven` always; `review-panel` on the agentic-review opt-in) directly as bootstrap scaffolding.
- `openspec-conventions`: Define the `agents` plane's meaning and authoring rules — instruments-not-behavior membership, the conformance-binding pattern against operational artifacts, the DESCRIBE-not-generate direction, and the init-scaffold exception to the change flow.

## Impact

- **New specs**: `openspec/specs/agents-plane/spec.md` (this repo's capability spec). Init-planted baseline specs land in a target project's `specs/agents/spec-driven/` and `specs/agents/review-panel/`.
- **CLI**: `cli-init` gains an agentic-tooling prompt and the plant-baseline-specs step; writes `specM​odel.planes+: [agents]` into `config.yaml` on opt-in.
- **Schema data**: the `agents` plane record (`id`, `purpose`, `enforcementFlavor`; no dedicated review lens) is defined as an offer-able plane, appended to config on opt-in rather than added to the shipped resolved default set.
- **Dogfood**: openspec-extended itself turns the plane on — `specs/agents/review-panel/` finally governs its own `DEFAULT_LENSES`, and `specs/agents/spec-driven/` records its deliberate plane roster with a `config.yaml`-conformance binding.
- **No change** to enforcement mechanisms, the review-panel lens machinery, or legacy flat output. The `instrument:` binding field and any cross-spec relationship graph remain deferred.
