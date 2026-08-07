## Why

The agents tranche of the specbase migration (design D5/step 5 of
`migrate-specbase-specs`). The legacy `docs-agent-instructions` capability holds
six kept requirements about what agent instruction docs must contain, but they
describe a file that no longer exists in that form: the root `AGENTS.md` in this
repository is **0 bytes**. Agents working here get no quick reference, no
templates, no pre-validation checklist, and no pointer to the current store
(`specbase/`), skill surface (`spcb`), or organizing rules
(`docs/clean-specbase.md`).

The manifest's remaining agents-plane rows — the `opsx-*-skill` specs — are
**dropped** per design D8 (superseded by the spcb skill surface), so
`agents/agent-docs` is the whole of this tranche.

## What Changes

- **Seed the root `AGENTS.md`.** Distilled from `openspec-old/work/AGENTS.md`
  (the product-lens guidance: two users, human UX is agent UX, the reframing
  questions) plus the quick-reference content `docs-agent-instructions` requires
  — copy-ready templates, a worked example, the essentials/advanced split, the
  behavior-first boundary, lightweight-by-default rigor, and a pre-validation
  checklist. Written for this repository as it is today.
- **Author `agents/agent-docs`** — a governed pair replacing
  `docs-agent-instructions` (mapping.md Part A, 6 kept rows). Per the
  agents-plane pattern, the spec **describes** `AGENTS.md`; the file stays the
  runtime source of truth and is never generated from the spec.
- **Retire `docs-agent-instructions`** as a source of current truth. It stays in
  `openspec-old/` as history.

## Planes

### Agents
- `agents.agent-docs` (new): six requirements — quick-reference placement,
  embedded templates and examples, pre-validation checklist, progressive
  disclosure, behavior-first authoring guidance, and lightweight-by-default
  guidance. One-for-one with the six kept `docs-agent-instructions` rows.

### Not in this tranche
- `opsx-onboard/verify/archive/sync/explore/update-skill` — dropped in the
  manifest (D8); the spcb skills are the current surface.
- The craft rules the docs must *teach* (behavior-first boundary, progressive
  rigor) are `code-quality/spec-authoring`, authored in the quality/design
  tranche. This pair only requires that `AGENTS.md` teaches them.

## Spec pairs

- `agents.agent-docs` → three `command` conformance bindings against
  `AGENTS.md` (quick-reference structure and order, checklist contents,
  essentials/advanced guidance sections) plus one `review` binding on the
  cross-cutting `enforcement` lens for the judgment above the gate — whether
  the disclosure is genuinely progressive and the guidance genuinely
  lightweight rather than merely containing the words. The `agents` plane
  declares no `reviewLens` in `specbase/config.yaml`, so the lens is named
  explicitly.

## Impact

- **Affected files**: the root `AGENTS.md` (seeded from empty) and this change
  directory. No `src/`, `test/`, or `docs/` changes.
- **Stores**: `specbase/specs/agents/agent-docs/` gains a pair at archive.
  `openspec-old/specs/docs-agent-instructions/` becomes history.
- **Dependencies**: none.
