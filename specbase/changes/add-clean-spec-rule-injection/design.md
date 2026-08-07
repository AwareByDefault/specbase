## Context

Specbase distributes its authoring guidance by *generating* skills, not by
shipping files. `src/core/templates/workflows/governed-guidance.ts` holds the
guidance as TypeScript template strings; `openspec init` and `openspec update`
emit `SKILL.md` files into each tool's directory (`.pi/skills/…` here,
`.claude/skills/…` elsewhere). The npm package ships `dist`, `bin`, `schemas`,
and a postinstall script — **not** `docs/`. So installed repos never see
`docs/clean-spec.md`; whatever an agent needs at authoring time must be baked
into the generated skill.

The two manifestos are new and human-authored. Their own first principle is
"one truth, one home; a restated truth is a future lie." Wiring them into the
skills must honor that: the rules the skills inject and the rules the manifesto
states must be the same text with one source.

## Goals / Non-Goals

**Goals:**
- Editing a manifesto is the single act that changes what skills inject.
- Generated skills are self-contained — no reference to `docs/` that would
  dangle in an installed repo.
- Drift between manifesto and injected rules is caught by a check, not by
  discipline.
- `propose` surfaces the structure it chose (with the rule it applied) and
  offers discussion, instead of front-loading the governed apparatus.

**Non-Goals:**
- Shipping or planting the full manifesto into installed repos (possible later,
  additive; the *rules* already travel inside skills).
- Changing any user-facing CLI contract or the `openspec update` mechanism.
- Deriving the distilled rules automatically from the manifesto prose.

## Decisions

**D1 — Manifestos are canonical; a marked Rules section is the extraction unit.**
Each doc carries a hand-authored, delimited Rules block (e.g. between
`<!-- BEGIN RULES -->` / `<!-- END RULES -->`) holding the distilled imperative
SHALLs. The author controls exactly what an agent sees; extraction stays a dumb,
reliable copy. Rejected: deriving rules from full prose (fragile, needs the
manifesto to be machine-structured) and authoring rules inside `.ts` strings
(prose belongs in markdown; editing aphorisms in TS is hostile).

**D2 — Extract at build time into a generated module, not at runtime.**
A codegen step reads the marked sections and writes
`src/core/templates/workflows/clean-rules.generated.ts`; `build.js` runs it
before `tsc` so the constant compiles into `dist`. Runtime reading is impossible
in installed repos (no `docs/`), so build-time baking is what lets the rules
travel. `governed-guidance.ts` imports the generated constant — the single
in-code home — instead of restating rules.
*Enforcement:* a `command` drift check re-runs the extraction and asserts the
result equals the committed generated module. It fails CI when a manifesto is
edited without rebuilding. This mechanism fits because the claim ("injected
rules == manifesto rules") is a deterministic string identity.

**D3 — Two-hop propagation, only one hop is new.**
Hop 1 (manifesto → generated constant) is the new build codegen. Hop 2
(generated constant → skills in any repo) is the existing `openspec init` /
`openspec update` path — unchanged. The end-to-end chain becomes: edit manifesto
→ `npm run build` → publish → consumer runs `openspec update`.

**D4 — The propose structure-surface is guidance text, enforced by conformance.**
The generated propose skill gains a step: after placing specs, show the chosen
locators + the clean-specbase rule applied, then offer to discuss. clean-spec
(writing quality) is applied during authoring, never prompted.
*Enforcement:* a `command` check that the generated propose `SKILL.md` contains
the structure-surface marker and the injected rules; the residue — whether the
surface reads as a genuine, discussable offer rather than a rubber stamp — is an
honest `review` binding on the agents lens. Automated presence + review judgment
is the honest split; a linter cannot judge tone.

**D5 — Single plane (agents).** The codegen and drift check have no independent
ops life; they exist only to produce and protect the agent instrument. Framing
them as agents keeps the truth cohesive and avoids a speculative ops spec whose
only content would be "the build has a codegen step."

## Risks / Trade-offs

- **Committed generated file drifts from source** -> the D2 drift check gates
  it; the generated module is treated as build output that must be regenerated,
  like a lockfile.
- **Full manifesto too heavy to inject** -> only the distilled Rules section is
  extracted, not the reasoning; the manifesto keeps analogies and worked
  examples out of the skill.
- **Regenerating skills is a visible diff churn** on every tool's `SKILL.md` ->
  expected and acceptable; the diff is the propagation working.
- **Up-front structure prompt trains reflex "no"** -> mitigated by surfacing
  *after* placement with reasoning (opt-out), and only stopping to ask when
  structure is genuinely ambiguous.

## Migration Plan

1. Add marked Rules sections to both manifestos (content already largely exists
   as their §-level imperatives).
2. Add the extraction script + generated module; wire into `build.js`.
3. Point `governed-guidance.ts` at the generated constant; add the propose
   structure-surface step; delete the stale inline primer.
4. Rebuild; regenerate this repo's skills; commit the regenerated outputs.
5. Add the drift + conformance checks.

Rollback: revert the generator import to the inline strings and drop the codegen
step; skills regenerate to their prior content on next build.

## Open Questions

- Do we later also *plant* the full manifesto into installed repos (additive)?
- When enough archive history accrues, do the clean-specbase measurable audits
  (§5) graduate from review bindings to command bindings?
