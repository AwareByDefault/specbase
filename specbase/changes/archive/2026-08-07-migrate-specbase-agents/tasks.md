# Tasks: migrate-specbase-agents

Agents tranche of the specbase migration (design D5, migration-plan step 5).
Scope is the `agents/agent-docs` pair plus the operational artifact it
describes — the root `AGENTS.md`. The `opsx-*-skill` specs are dropped per D8
and are not migrated.

## 1. Artifact: seed the root AGENTS.md (design D6)

- [x] 1.1 Seed the empty root `AGENTS.md` from `openspec-old/work/AGENTS.md`
      (product-lens guidance) plus the quick-reference content
      `docs-agent-instructions` requires.
      *Done: 294 lines. Quick reference first (copy-ready `proposal.md`,
      `tasks.md`, spec-delta and `enforcement.md` templates + one worked
      example), then the four essentials, product lens, behavior-first
      authoring, lightweight-by-default, a 12-item pre-validation checklist,
      then a labeled `# Advanced` half (planes and placement, pairs and
      enforcement, multi-capability changes, archiving, repo conventions).*
- [x] 1.2 Write it for this repo as it is today: store is `specbase/`, skill
      surface is `spcb`, CLI is the installed `openspec` binary (not
      `node bin/openspec.js`), organizing rules are `docs/clean-specbase.md`.
      *Done and asserted by the `quick-reference-conformance` binding; no
      `openspec/` store or `opsx` surface references remain except the explicit
      "superseded" notes.*
- [x] 1.3 Keep it a working quick reference, not a manual — progressive
      disclosure with anchor links from the quick reference into the advanced
      sections.
      *Done: template headings link to `#2-draft`, `#behavior-first-authoring`,
      `#planes-and-placement`, `#pairs-and-enforcement`; the checklist links
      from the Validate step.*

## 2. Truth: author the agents/agent-docs pair

- [x] 2.1 Author `specs/agents/agent-docs/spec.md` — six ADDED requirements
      rewritten one-for-one from the six kept `docs-agent-instructions` rows
      (mapping.md Part A), describing the `AGENTS.md` artifact rather than
      generating it.
      *Done: `quick-reference-first`, `embedded-templates`,
      `pre-validation-checklist`, `progressive-disclosure`,
      `behavior-first-guidance`, `lightweight-by-default-guidance` — 6
      requirements / 12 scenarios.*
- [x] 2.2 Keep the craft rules themselves out of this pair — the pair requires
      only that the docs *teach* the behavior-first boundary and progressive
      rigor; the rules land in `code-quality/spec-authoring` in the
      quality/design tranche (manifest rows 5 and 6 note the split).
      *Done: both requirements are phrased as "the docs SHALL teach…".*

## 3. Evidence: paired enforcement

- [x] 3.1 Author `specs/agents/agent-docs/enforcement.md` per the agents-plane
      pattern (`agents/spec-driven`, `agents/review-panel`): conformance
      bindings against the artifact the spec describes.
      *Done: three `command` bindings —`quick-reference-conformance`,
      `checklist-conformance`, `guidance-sections-conformance` — each a node
      one-liner asserting `AGENTS.md` is non-empty and carries the required
      sections, template headings, checklist items, and essentials-before-
      advanced ordering.*
- [x] 3.2 Add a `review` binding for the judgment-level claims (progressive
      disclosure, lightweight guidance) naming a lens from the store's roster.
      *Done: `guidance-quality-review`, `lens: enforcement` (cross-cutting).
      The `agents` plane declares no `reviewLens` in `specbase/config.yaml`, so
      the lens is named explicitly rather than inherited. `covered_by` lists
      `quick-reference-conformance` and `guidance-sections-conformance` so the
      reviewer judges only the residue above the presence checks.*
- [x] 3.3 Run every command binding and confirm exit 0.
      *Done: parsed the authoritative YAML block and spawned each `run` block
      verbatim — `quick-reference-conformance` exit 0,
      `checklist-conformance` exit 0, `guidance-sections-conformance` exit 0.*

## 4. Verify

- [x] 4.1 `openspec validate migrate-specbase-agents --strict`.
      *Done: `Change 'migrate-specbase-agents' is valid`, exit 0. Note the
      installed `openspec` 1.6.0 on PATH takes the change positionally
      (`--change` is not an option; `--changes` validates all). The repo-local
      `node bin/openspec.js` is not usable — this branch's `src/` still
      hardcodes `openspec` as the planning dir name.*
- [x] 4.2 Confirm the change's pair resolves via
      `openspec status --change migrate-specbase-agents --json`.
      *Done: `specs` and `enforcement` both resolve to
      `specs/agents/agent-docs/`, and `isComplete: true` ("All planning
      artifacts are complete"). A brief `design.md` was added — the governed
      schema counts it toward completeness, so without it the change reads
      incomplete and is not archive-ready.*
- [x] 4.3 Cross-check the manifest: every `agents/agent-docs` row is
      represented, and the `opsx-*-skill` rows are confirmed dropped.
      *Done: mapping.md destination table shows `agents/agent-docs` = 6 rows,
      all from `docs-agent-instructions` (Part A). All six are ADDED
      requirements in this change's delta. No other row in the manifest targets
      the `agents` plane. The 30 `opsx-*-skill` drop-register rows are recorded
      drops (D8) and are correctly not migrated here.*
