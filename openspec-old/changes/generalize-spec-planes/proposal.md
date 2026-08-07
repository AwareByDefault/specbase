## Why

The governed spec model bakes a frozen two-plane taxonomy (`behavior`, `architecture`) into a `const` enum, prompt prose, and per-plane templates, while the review-panel work already proved an extensible category system works as *data* (`DEFAULT_LENSES`). A real-project pilot confirmed two planes are too few — repositories also need durable truth about ops (packages, dev env, IaC) and code-quality (smells, clean-code rules) — and users need to add or remove planes without a code change. Generalizing planes from a frozen enum to schema-declared data lets the existing recursive discovery and paired-enforcement engine carry an arbitrary, project-owned taxonomy.

## What Changes

- **Un-freeze `SPEC_PLANES`**: replace the `['behavior','architecture'] as const` enum with schema-declared plane records resolved at runtime; a plane is an arbitrary kebab id, not a closed set.
- **Add per-plane metadata to the schema**: each plane declares `{id, purpose, enforcementFlavor, reviewLens?}` so classification, authoring, and review can read its meaning from data rather than prompt prose.
- **Ship four default planes** (`behavior`, `architecture`, `ops`, `code-quality`) in the default governed schema/config; users may remove defaults or add planes in their project `config.yaml`.
- **Generate governed prompt awareness from config at write time**: the governed guidance appendix (explore, propose, apply, verify, archive, onboard) is interpolated from the project's resolved planes during `openspec init`/`openspec update`, not baked as a static const string. `openspec update` (regenerate) rewrites skill/command files to reflect the current plane roster.
- **Write curated trigger lists for the two new default planes** (`ops`, `code-quality`) to the same standard as the existing architectural structural-trigger list, so explore on four planes is as crisp as explore on two.
- **Add an `ops` default review lens** parallel to the existing `behavioural`/`architectural` lenses; `code-quality` already exists as a lens and gains a `storageHome`.
- **Generalize spec-ID convention**: `<plane>.<locator>` accepts any declared plane id (free kebab), not `behavior|architecture`.
- **KEEP legacy flat workflow byte-identical**: governed additions stay gated on `specModel.kind === 'governed'`; legacy projects are untouched.

This change deliberately excludes CLI execution of enforcement commands (`openspec verify --run`), cross-spec relationship graphs, generated context closure, and automatic legacy migration.

## Capabilities

### New Capabilities

- `spec-planes`: Opt-in governed spec planes declared as schema data with per-plane metadata, recursive pair discovery, stable scoped identities, nested locators, and current-truth/history boundaries — generalized from a frozen two-plane enum to an arbitrary project-owned taxonomy.

### Modified Capabilities

- `spec-enforcement`: Paired enforcement contracts resolve against the project's declared planes rather than a frozen set; coverage rollups key on declared plane ids.
- `openspec-conventions`: Define governed project structure and authoring rules for an arbitrary plane set; default planes are `behavior`, `architecture`, `ops`, `code-quality`.
- `cli-artifact-workflow`: Schema-aware status/instructions emit resolved plane metadata for generation-time prompt interpolation.
- `cli-init`: Write the default plane set into the project config; generate governed skills from resolved planes.
- `cli-update`: Regenerate skill/command files to reflect the project's current plane roster; `--regenerate` rebuilds prompts from config.
- `cli-list`: Recursively discover and display plane-qualified governed specs for arbitrary planes.
- `cli-show`: Resolve governed spec locators or stable spec IDs with arbitrary plane prefixes.
- `cli-validate`: Validate governed pairs, scoped identities, and plane declarations against the resolved (open) plane set.
- `cli-spec`: Support governed pair listing, showing, and validation through the existing spec command surface with open planes.
- `cli-config`: Surface and validate the `specModel.planes` declaration.
- `config-loading`: Load and resolve the `specModel.planes` records from project config with append-vs-replace semantics.
- `schema-resolution`: Resolve a schema's declared plane records as structured data.

## Impact

- **Core types**: `SPEC_PLANES` const and `z.enum(SPEC_PLANES)` become an open `z.array(PlaneSchema)`; `SpecPlane` widens from a closed union to `string`. Coverage rollups move from `Record<SpecPlane, …>` to a map keyed by declared id.
- **Schema data**: `schemas/spec-driven-governed/schema.yaml` declares four default plane records with `purpose`, `enforcementFlavor`, and `reviewLens`.
- **Project config**: `openspec/config.yaml` may declare `specModel.planes` (append via `planes+:` or replace via `planes:`); `openspec init` writes the defaults.
- **Prompt generation**: `governed-guidance.ts` const strings become functions of the resolved plane set; `getSkillTemplates`/`getCommandTemplates` interpolate plane awareness at write time; `withGovernedGuidance` receives resolved planes.
- **Templates**: per-plane templates (`behavioral-spec.md`, `architectural-spec.md`) are joined by `ops-spec.md` and `code-quality-spec.md` examples, or replaced by one generic `plane-spec.md` plus worked examples.
- **Lenses**: `DEFAULT_LENSES` gains an `ops` lens; `code-quality` lens keeps its id; lens ids couple to plane ids by convention.
- **Validation**: CLI rejects non-kebab plane ids, collisions with default ids, planes missing a `purpose`, and duplicate ids in the resolved set.
- **Compatibility**: legacy flat projects remain on the existing workflow and byte-identical output; governed mode becomes plane-extensible without a breaking migration.