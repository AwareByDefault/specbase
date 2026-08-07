## Context

The governed spec model (change `introduce-enforced-spec-planes`, ~built on `architecture-and-enforcement` branch) hardcodes a two-plane taxonomy in three places: the `SPEC_PLANES` const in `src/core/artifact-graph/types.ts`, the `z.enum(SPEC_PLANES)` Zod schema, and the prose of `GOVERNED_*_GUIDANCE` const strings in `governed-guidance.ts`. Separately, the review-panel work (`add-review-panel-enforcement`, complete) already ships an *extensible* category system — `DEFAULT_LENSES` is a plain array grown by proposal, and `code-quality`/`enforcement` are already cross-cutting lenses with no plane.

A real-project pilot confirmed two planes are too few: repositories also need durable truth about ops (packages, dev env, IaC) and code-quality (smells, clean-code rules), and these concerns have distinct, honest enforcement mechanisms (lockfile audit / `terraform plan` for ops; smell-lint + review for code-quality). The frozen enum prevents adding these without a code change, and the static prompt prose can't grow with a project's taxonomy.

The mechanism to fix this already exists: `getSkillTemplates(workflows, specModel)` parameterizes skill generation, `withGovernedGuidance(base, specModel, guidance)` is the seam that appends governed content at write time, and `openspec update` already regenerates skill/command files. The fix is to source the plane roster and its awareness from schema/config data and interpolate it at generation time rather than baking a static const.

## Goals / Non-Goals

**Goals:**
- Replace the frozen `SPEC_PLANES` enum with schema-declared plane records resolved at runtime.
- Ship four default planes (`behavior`, `architecture`, `ops`, `code-quality`) in the default governed schema; let projects remove defaults and add planes in `config.yaml`.
- Generate the governed prompt appendix (explore/propose/apply/verify/archive/onboard) from the resolved plane set at `openspec init`/`openspec update` time, preserving the curated trigger-list quality for defaults.
- Keep the legacy flat workflow byte-identical and the review-panel lens machinery intact.
- Generalize the spec-ID convention, coverage rollups, and locator parsing to accept arbitrary declared plane ids.

**Non-Goals:**
- CLI execution of enforcement commands (`openspec verify --run`) — separate future change.
- Cross-spec relationship graphs or generated context closure.
- Automatic migration of legacy flat projects to governed.
- Reversing the "core parses, workflows execute" enforcement decision.
- Re-architecting the review panel; lenses stay an independent extensibility axis coupled to planes by convention only.

## Decisions

### 1. Planes are schema data, not a const enum

**Decision:** Replace `SPEC_PLANES = ['behavior','architecture'] as const` and `z.enum(SPEC_PLANES)` with a `PlaneSchema` record (`{id, purpose, enforcementFlavor?, reviewLens?, crossCutting?}`) and an open `z.array(PlaneSchema)`. The resolved schema's `specModel.planes` is the source of truth; `SpecPlane` widens from a closed union to `string`. Coverage rollups move from `Record<SpecPlane, …>` to `Map<string, …>` keyed by declared id.

```yaml
specModel:
  kind: governed
  version: 1
  planes:
    - id: behavior
      purpose: "User/client-visible outcomes that must remain true"
      enforcementFlavor: "tests / property tests"
      reviewLens: behavioural
    - id: architecture
      purpose: "Package responsibilities, boundaries, and structural invariants"
      enforcementFlavor: "lint / static-analysis / conformance"
      reviewLens: architectural
    - id: ops
      purpose: "What we use and how it runs: packages, dev env, IaC, deployment"
      enforcementFlavor: "lockfile audit / plan validate / drift detect"
      reviewLens: ops
    - id: code-quality
      purpose: "What good code looks like: smells, qualities, and rules"
      enforcementFlavor: "smell-lint + review"
      reviewLens: code-quality
  pairedEnforcement: true
```

**Rationale:** The const enum was the single blocker. The review-panel lenses already proved an array-grown-by-proposal category system works in this codebase; planes follow the same pattern.

### 2. Projects extend or replace planes in `config.yaml`

**Decision:** Project `config.yaml` may declare `specModel.planes+:` to append to the schema's defaults or `specModel.planes:` to replace them entirely. Append is the friendly default (keep the four, add `security`); replace is for teams that want a fully bespoke taxonomy. The CLI resolves one final list.

```yaml
# append
specModel:
  planes+:
    - id: security
      purpose: "Authn/authz, secret handling, attack surface"
      enforcementFlavor: "static-analysis + review"

# replace
specModel:
  planes: [behavior, ops]   # minimal bespoke taxonomy
```

**Rationale:** Append-by-default keeps the curated defaults while enabling extension; replace permits a fully bespoke repo. Resolving one list keeps all downstream code single-source.

### 3. Governed awareness is interpolated at generation time, not runtime

**Decision:** The `GOVERNED_*_GUIDANCE` const strings in `governed-guidance.ts` become functions of the resolved plane set (`buildGovernedGuidance(specModel)`). At `openspec init`/`openspec update`, `getSkillTemplates(workflows, specModel)` interpolates the project's planes — including their curated trigger lists — into the skill/command files. `openspec update` (and a `--regenerate` flag) rewrites files to reflect the current config. No runtime CLI fetch in the prompt.

```
config.yaml planes  →  resolveSpecModel  →  buildGovernedGuidance(specModel)
        →  getSkillTemplates interpolates  →  writeFile(skill, ...)
        →  agent runs opsx:explore with planes baked in
```

**Rationale:** The seam already exists (`withGovernedGuidance`, `getSkillTemplates(specModel)`). Generation-time interpolation keeps the prompt self-contained (no CLI round-trip per skill invocation), matches the existing update mechanism, and preserves the flat explore base byte-identical.

### 4. Curated trigger lists stay in the prompt for defaults; procedure for the tail

**Decision:** The four default planes get hand-written trigger lists in the generated guidance (structural triggers for architecture, smell triggers for code-quality, selection triggers for ops, outcome triggers for behavior) to the same standard as the existing architectural triggers. For user-added planes beyond the defaults, the generated guidance includes a procedure: "fetch `specModel.planes` from `openspec status --json`, match the claim to the plane whose `purpose` best fits." Default planes may also declare optional `authoring` blocks (questions + shape) for the propose workflow.

**Rationale:** A pure purpose-matching procedure regresses explore's quality. Curated triggers are genuinely better pedagogy and deserve hand-writing for the 90% case. The procedure covers the N>4 tail where hand-curation doesn't scale.

### 5. Per-plane templates: one generic plus worked examples

**Decision:** Ship one generic `plane-spec.md` template plus four labelled worked examples (`behavioral-spec.md`, `architectural-spec.md`, `ops-spec.md`, `code-quality-spec.md`) clearly marked as examples of the defaults. The generic template says "substitute any declared plane."

**Rationale:** One generic template is less to maintain and signals extensibility; worked examples keep the pedagogy the per-plane templates provided.

### 6. Lens↔plane coupling by convention, not enforcement

**Decision:** A plane's `reviewLens` field names the lens that judges it, but the link is by id convention, not a hard reference. `code-quality` and `enforcement` remain valid lenses with `storageHome: null` (cross-cutting). `DEFAULT_LENSES` gains an `ops` lens. A plane may omit `reviewLens`; a lens may exist without a plane.

**Rationale:** Coupling by convention keeps the two systems independently extensible while making the common case (plane + its lens share an id) natural. Forcing a 1:1 link would re-introduce rigidity.

### 7. Spec-ID convention accepts any declared plane

**Decision:** Spec IDs keep the `<plane>.<locator>` form but the prefix is any declared plane id (free kebab), not `behavior|architecture`. The spec-ID parser validates the prefix against the resolved plane set rather than a closed enum.

**Rationale:** Spec IDs already parameterize on the first segment; only the enum validation blocked arbitrary planes.

### 8. Validation rules for arbitrary planes

**Decision:** CLI validates resolved planes: kebab-case ids, no collision with default ids (on replace), no duplicate ids within the resolved set, `purpose` required (the classifier needs it), `enforcementFlavor` required, `id` reserved words rejected (`spec`, `specs`, `enforcement`). On append, user ids may not duplicate defaults.

**Rationale:** Arbitrary labels need a safety net so classification and enforcement don't silently break on malformed declarations.

## Risks / Trade-offs

**Risk: Curated trigger lists for ops and code-quality may not match the architectural list's quality.**
→ Mitigation: author the two new trigger lists to the same standard before declaring the change complete; review against real specs (e.g. the dogfood repo's own ops/code-quality needs).

**Risk: Generalizing `Record<SpecPlane, …>` to a map touches several call sites.**
→ Mitigation: mechanical refactor; coverage rollups and locator parsing already key on the first segment. Test parity snapshots guard the legacy path.

**Risk: Generate-time interpolation could produce drift between config and skill files if `openspec update` isn't run.**
→ Mitigation: `openspec status` reports a drift flag when the resolved planes differ from a hash embedded in the generated skill file; `openspec update` resolves it.

**Risk: User-added planes get a weaker explore experience (procedure vs curated triggers).**
→ Mitigation: documented as an honest trade; users can supply an `authoring` block and trigger prose in `config.yaml` to get per-plane guidance interpolated.

**Risk: Breaking the frozen enum could regress the governed pilot on the `architecture-and-enforcement` branch.**
→ Mitigation: the four-default set is a superset of the two-plane set; existing governed specs continue to resolve. Legacy flat output stays byte-identical via the `specModel.kind` gate.

## Migration Plan

1. Un-freeze `SPEC_PLANES` and widen the Zod schema; keep the two-plane defaults so existing governed projects resolve identically.
2. Add `ops` and `code-quality` to the default schema's `specModel.planes`; add the `ops` default lens.
3. Convert `GOVERNED_*_GUIDANCE` consts to `buildGovernedGuidance(specModel)` functions; regenerate the dogfood project's skills.
4. Add per-plane template examples (`ops-spec.md`, `code-quality-spec.md`).
5. Add config `planes+`/`planes:` loading and validation.
6. Add `--regenerate` to `openspec update` (or accept that `update` always regenerates).
7. Run parity tests: legacy flat output byte-identical; governed two-plane output matches prior snapshots; governed four-plane output shows new awareness.

Rollback: revert to the const enum; generated skill files are per-project and regenerable.

## Open Questions

- Should `openspec update` always regenerate from config, or require `--regenerate` to avoid clobbering hand-edited skills? (Lean: always regenerate, since skills are managed artifacts.)
- Should the `authoring` block live in schema data, prompt prose for defaults, or both? (Lean: optional in schema; curated prose for the four defaults.)
- Should coverage rollups group by plane for *all* declared planes, or only planes with specs? (Lean: only planes with specs, to avoid empty noise.)