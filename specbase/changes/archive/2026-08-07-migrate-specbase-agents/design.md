## Context

The agents tranche of `migrate-specbase-specs` (its design D5, migration-plan
step 5). The parent change's manifest routes exactly six legacy requirements to
the `agents` plane — all six from `docs-agent-instructions` — and drops the
thirty `opsx-*-skill` rows under D8 because the spcb skill surface supersedes
them. So this tranche is one pair.

The artifact those six requirements govern, the root `AGENTS.md`, is currently
**0 bytes**. The two already-live agents pairs (`agents/spec-driven`,
`agents/review-panel`) set the pattern this tranche copies: the spec DESCRIBES
an operational artifact and enforcement binds a conformance/drift check against
it, with the artifact remaining the runtime source of truth.

## Goals

- Root `AGENTS.md` is a working quick reference an agent can act from today:
  the `specbase/` store, the `spcb` surface, `docs/clean-specbase.md`.
- `agents/agent-docs` states, checkably, what that file must contain.
- Every manifest row destined for `agents/agent-docs` is represented.

## Non-Goals

- **Not** migrating the `opsx-*-skill` specs (D8 drops).
- **Not** authoring the craft rules themselves — the behavior-first boundary and
  progressive rigor land in `code-quality/spec-authoring` in the quality/design
  tranche. This pair requires only that the docs *teach* them.
- **Not** turning `AGENTS.md` into a manual. Depth lives in `docs/`.
- **Not** touching `src/`, `test/`, `docs/`, or the live `specbase/specs/` tree.

## Decisions

### D1. `AGENTS.md` is described, never generated

Per the agents-plane pattern and the parent's D4, the file stays the runtime
source of truth. The spec asserts conformance; nothing in the change flow emits
`AGENTS.md` from the spec. This keeps the file editable by hand without the
spec going stale-by-construction.

### D2. Structure binds `command`, judgment binds `review`

Section order, template headings, checklist size, and the essentials-before-
advanced split are all directly assertable against the file, so they get node
one-liner `command` bindings — three of them, split by concern so a failure
names the section at fault. What those checks cannot see — whether the
disclosure is genuinely progressive, whether the lightweight guidance would
actually make an agent write a smaller spec — is honest review-strength residue
and binds `review` with `covered_by` naming the presence checks it sits above.

Rejected: one mega-binding over the whole file (a failure would not localize),
and a `test` binding (there is no vitest suite over `AGENTS.md`, and inventing
one to look automated is the hollow-enforcement risk the parent change names).

### D3. The review binding names the `enforcement` lens explicitly

`specbase/config.yaml` gives the `agents` plane no `reviewLens`, and the router
falls back only to non-cross-cutting plane defaults — so an agents-plane review
binding with no declared lens is an un-lensed gap. `enforcement` is
cross-cutting (scope `''`) and reachable by explicit naming, which is what this
binding does. `behavioural` was rejected: its scope is `behavior/**` and
borrowing it would misreport lens allocation in coverage.

### D4. Six requirements, one-for-one with the manifest

The pair takes exactly six ADDED requirements, one per kept
`docs-agent-instructions` row, rather than merging or expanding them. Merging
would break the manifest's row-level coverage check; expanding would put new
truth in a migration tranche. Repo-current facts (the `specbase/` store, the
`spcb` surface) ride as a second scenario under `quick-reference-first` rather
than as a seventh requirement, because "surface what an agent needs before
narrative" is exactly that requirement's claim.

## Risks / Trade-offs

- **[String-matching enforcement is brittle]** — a wording edit to `AGENTS.md`
  can red the bindings without any real regression. → The checks assert
  structural anchors (headings, fence markers, checklist item count, section
  order) rather than prose, and `limitations` says plainly that presence of the
  words is not proof of quality.
- **[Presence checks look stronger than they are]** — three automated bindings
  could read as full coverage. → The `review` binding is scoped to the residue
  and its `covered_by` makes the deterministic floor explicit.
- **[`AGENTS.md` rots as the repo rebrands]** — the `specbase-dir-rebrand`
  follow-on moves paths. → `quick-reference-conformance` fails the moment the
  store or surface names stop appearing, and the review procedure explicitly
  asks for stale `openspec/` / `opsx` references.

## Open Questions

- Should `docs/agent-contract.md` (11.9K) be folded into the advanced half of
  `AGENTS.md`, or stay a linked deep-dive? (Default: stay linked — this file is
  a quick reference.)
- Once `code-quality/spec-authoring` lands, should its craft rules be referenced
  by locator from `AGENTS.md` so the one-truth rule is visible in the docs?
