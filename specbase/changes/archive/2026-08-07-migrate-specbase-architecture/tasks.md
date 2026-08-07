# Tasks: migrate-specbase-architecture

Architecture tranche of the specbase migration. Every task is store work: the
three pairs bind suites that already exist, so no `src/` or `test/` file is
created, moved, or edited by this change.

## 1. Verify the sources before rewriting

- [x] 1.1 Read the manifest rows destined for `architecture/*` — 14
      `command-generation`, 1 `completion`, 1 `artifact-graph` — and the
      foundation design's D2 (verdicts) and D3 (target tree).
- [x] 1.2 Confirm the shipped shape of `src/core/command-generation/`: content
      and adapter types, `generateCommand`/`generateCommands`, and the
      registry with 28 registered adapters.
      *Verified: `types.ts`, `generator.ts`, `registry.ts`.*
- [x] 1.3 Confirm the `template-artifact-pipeline` residue against `src/`.
      *Verified: no `WorkflowManifest`, `ToolProfileRegistry`,
      `ArtifactSyncEngine`, `preAdapter`, or `postAdapter` symbol exists in
      `src/` or `test/`, and the source change's `tasks.md` is entirely
      unchecked. Three of its five requirements never shipped; two survive
      narrowed (see 1.4).*
- [x] 1.4a Check the three MODIFIED `command-generation` rows clause by clause.
      *Verified: `getFilePath(commandId)` takes no install context and the
      generator passes none, so that clause of `add-global-install-scope` never
      shipped; the Codex `CODEX_HOME`/`~/.codex/prompts` clause did. Verified
      the flat spec's "only frontmatter and path differ" is now false — the
      OpenCode, Pi, Oh My Pi, and Bob adapters rewrite the body's command
      references and argument placeholders — so the requirement states the
      invariant that holds: one authored body, rewrites confined to adapters.*
- [x] 1.4 Identify the shipped remainder of the pipeline residue:
      `getSkillTemplates`/`getCommandTemplates`/`getCommandContents` in
      `src/core/shared/skill-generation.ts` as the single workflow source, and
      `test/core/templates/skill-templates-parity.test.ts` as the shipped
      fidelity guardrail.
- [x] 1.5 Confirm the completion boundary: a common generator interface in
      `src/core/completions/types.ts`, a common installer interface in
      `factory.ts`, and `COMMAND_REGISTRY` as the single command source read by
      `src/commands/completion.ts`.
- [x] 1.6 Confirm the artifact-graph invariants live in `parseSchema`
      (`src/core/artifact-graph/schema.ts`): duplicate ids, dangling
      `requires`, and DFS cycle detection, in that order.

## 2. Truth: author the three spec deltas

- [x] 2.1 `specs/architecture/command-generation/spec.md` — 7 requirements:
      tool-agnostic content, the adapter boundary, generator composition, the
      single adapter registry, one shared command body, one workflow source
      projecting skills and commands, and one generation path for every writer.
      Class and function names appear nowhere in the spec text.
- [x] 2.2 `specs/architecture/completion/spec.md` — narrowed hard to 3
      requirements: a common generator interface per shell, a common installer
      interface per shell, and one command registry every shell consumes. The
      factory switch statement, the provider's 2-second cache, and every
      class-name scenario are left demoted.
- [x] 2.3 `specs/architecture/artifact-graph/spec.md` — narrowed to 4
      requirements: cycles rejected, dangling references rejected, duplicate
      ids rejected, and validation at a single parse boundary. Build order and
      the ready/complete/blocked queries stay demoted; state detection and
      schema-directory structure belong to the behavior tranche.

## 3. Evidence: author the paired enforcement contracts

- [x] 3.1 `command-generation/enforcement.md` — 7 bindings: content shape,
      adapter conformance, generator, registry (plus the legacy-cleanup
      registry-iteration check), adapterless-tool handling, workflow projection
      parity, and one architectural-lens review for the no-bypass residue.
- [x] 3.2 `completion/enforcement.md` — 5 bindings: per-shell generator
      interface, per-shell installer interface, registry-versus-CLI parity, the
      completion command's per-shell routing, and one architectural-lens review
      for the single-registry residue.
- [x] 3.3 `artifact-graph/enforcement.md` — 3 bindings: the DAG invariant
      suite, the two further load paths (resolver and `schema validate`), and
      one architectural-lens review for the parse-boundary residue.
- [x] 3.4 Write honest `limitations` on every binding, naming what the suite
      does not prove, and give each review binding a `covered_by` list naming
      its deterministic residue.

## 4. Verify

- [x] 4.1 Run every bound suite and confirm green.
- [x] 4.2 `openspec validate migrate-specbase-architecture --strict` passes.
- [x] 4.3 Cross-check the diff against the manifest's architecture-destined
      rows: all 16 represented or flagged, with the three unshipped
      `template-artifact-pipeline` rows recorded in the proposal and design.
