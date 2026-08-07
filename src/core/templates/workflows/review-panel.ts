/**
 * Review-panel orchestration workflow (add-review-panel-enforcement,
 * refactor-review-panel-lens-projection).
 *
 * The panel is the review-panel generalized onto the review model. It
 * ORCHESTRATES blind per-lens reviewers; it never reviews the change itself and
 * it never gates. Its findings are `review`-strength evidence, weaker than
 * automated proof by construction. Policy is sliced fresh from the specs each
 * lens's scope covers at review time — never copied into a lens method — so a
 * spec edit changes the review with no lens edit.
 *
 * The skill is a PROJECTION of the resolved review model, not a build-time
 * snapshot:
 *   - governed model -> the projected per-plane lens set (one lens per resolved
 *     plane that declares a `reviewLens`, plus the cross-cutting `enforcement`
 *     lens, plus any declared augmentation), each a blind focused reviewer.
 *   - flat/legacy, or a governed model that resolves no plane lenses -> a single
 *     general spec-conformance reviewer over the flat spec set.
 * It holds no hardcoded lens list; the lens table and methods are rendered from
 * `lensesFromPlanes`. The deterministic-gate and `coverage --json` steps are
 * emitted only when the projection produced plane lenses (a flat project has no
 * `enforcement.md` bindings or lens rollup to read, so those steps are no-ops).
 *
 * Skill and command projections share one body builder (parity requirement):
 * `getReviewPanelSkillTemplate` and `getReviewPanelCommandTemplate` emit the
 * same pipeline, so the two surfaces cannot disagree.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';
import type { SpecModel } from '../../artifact-graph/types.js';
import { isGovernedModel } from './governed-guidance.js';
import { lensesFromPlanes, type LensDefinition } from '../../governed/lenses.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';

const REVIEW_PANEL_DESCRIPTION =
  'Run the review panel — router, deterministic gate, blind per-lens reviewers over the residue, refute-verify, completeness critic, read-only severity/lens report. The lens set projects the resolved review model; findings are review-strength and never gate.';

/** The header + prose of one lens's method, rendered from its definition. */
function lensMethodBody(lens: LensDefinition): string {
  // The enforcement lens judges every pair's bindings, not a plane subtree; its
  // method is the keystone audit. code-quality's cleanliness judgment is still a
  // whole-tree concern even though its storage plane is its own subtree.
  if (lens.id === 'enforcement') {
    return "Judge whether each binding's declared check actually **exercises** the covered\nclaim rather than merely running (a test that imports but asserts nothing, a lint\nthat never fires). Audit **automated** bindings too, not just review ones — but\njudge evidence adequacy only, and **do not review your own verdicts** (no\nrecursion into the enforcement lens itself).";
  }
  const scopePhrase = lens.id === 'code-quality' ? 'the whole tree' : `\`${lens.scope}/**\``;
  return `Read the affected \`specs/${lens.scope}/...\` pairs and the code they describe.\nJudge only whether the implementation honors ${lens.question} Nothing outside its\nplane (structure, style, correctness elsewhere) is yours — drop it.`;
}

/** One lens rendered for the method section. */
interface RenderedMethod {
  header: string;
  body: string;
}

/**
 * The shared review-panel body, projected from the resolved review model. Both
 * projections interpolate this verbatim so skill == command. It encodes the
 * full pipeline; the lens table/methods and the gate/coverage steps are derived
 * from the projection rather than hardcoded.
 */
function reviewPanelBody(specModel?: SpecModel): string {
  const governed = isGovernedModel(specModel);
  const lenses = lensesFromPlanes({ planes: specModel?.planes ?? [] });
  const planeLenses = lenses.filter((l) => !l.crossCutting);
  const flat = planeLenses.length === 0;

  // ── lens table ──────────────────────────────────────────────────────────
  const lensRows = flat
    ? '| `spec-conformance` | Does the implementation produce the specs that were implemented? | every spec |'
    : [
        ...planeLenses.map(
          (l) => `| \`${l.id}\` | ${l.question} | \`${l.scope}/**\` |`
        ),
        "| `enforcement` | Do the bound checks actually exercise the claim, not merely run? | every pair's bindings |",
      ].join('\n');

  // ── method section ───────────────────────────────────────────────────────
  const methods: RenderedMethod[] = flat
    ? [
        {
          header: '`spec-conformance` — scope: every spec',
          body: `Read the specs that exist for this implementation and judge ONLY whether\nthe code produces the observable outcomes they promise — inputs, outputs,\nerrors, exit codes, and other declared side effects. This is the panel's one\njob, unedited; planes only partition it into blind lenses in a governed\nproject, and a flat project needs no finer partition.`,
        },
      ]
    : [
        ...planeLenses.map((l) => ({
          header: (() => {
            const scopePhrase = l.id === 'code-quality' ? 'the whole tree' : `\`${l.scope}/**\``;
            return `\`${l.id}\` — scope: ${scopePhrase}`;
          })(),
          body: lensMethodBody(l),
        })),
        ...lenses.filter((l) => l.crossCutting).map((l) => ({
          header: `\`${l.id}\` — scope: every affected pair's bindings`,
          body: lensMethodBody(l),
        })),
      ];
  const methodSection = methods
    .map((m) => `### ${m.header}\n${m.body}`)
    .join('\n\n');

  // ── Step 0 ───────────────────────────────────────────────────────────────
  const stepZero = flat
    ? `This project resolves to the **flat/legacy spec model** (or a governed model\nwith no plane lenses): there is no per-plane lens partitioning and no\n\`enforcement.md\` bindings, so the deterministic gate and the \`coverage --json\`\nlens rollup are **no-ops**. The panel reviews the flat spec set through the single\n\`spec-conformance\` reviewer.\n\n\`\`\`bash\nspecbase status --change "<name>" --json   # resolve the review model and affected pairs\n\`\`\`\nRead the specs the change touches from the status output. If the change touches\nno spec, say so and stop.`
    : `Confirm the review model and load the affected pairs:\n\`\`\`bash\nspecbase status --change "<name>" --json   # resolve the model and touched pairs\nspecbase coverage --json                    # lens rollup, un-lensed gaps, split candidates\n\`\`\`\nRead every affected \`spec.md\` / \`enforcement.md\` pair the status reports; the set\nof touched pairs (their locators) is the router's input. If the change touches\nno spec pair, say so and stop.`;

  // ── Step 2 gate ───────────────────────────────────────────────────────────
  const gateStep = flat
    ? `The deterministic gate is a **no-op** in this project: there are no automated\nbindings or \`enforcement.md\` targets to run (flat/legacy has none). Skip to the\nreviewer directly — the residue is the whole review surface.`
    : `Run the project's declared automated bindings (their \`run: {command, args,\ncwd}\` vectors) BEFORE any reviewer, so each lens reviews only the residue above\nthe gate. For each lens, prepare two inputs:
1. **already-covered findings** — the concrete gate output, so no reviewer\n   re-reports a line a deterministic check already flagged.
2. **blind list** — the deterministic binding IDs named in each review binding's\n   \`covered_by\`. As deterministic bindings are added to \`covered_by\`, the\n   residue shrinks with NO edit to any lens method.

If the gate is red, note it prominently at the top of the report — the panel\nreviews the residue above a passing gate, it does not excuse a failing one.`;

  const policySource = flat ? 'the flat specs the change touches' : 'the specs AND their enforcement bindings';

  return `${STORE_SELECTION_GUIDANCE}

Run the specbase review panel over a change: a panel of narrow, blind, per-lens
reviewers judges the non-deterministic truth that no automated proof proves. You
are the **orchestrator** — you pick the lenses this project's review model
projects, run the deterministic gate first (when bindings exist), fan the
reviewers out in parallel over the residue, dedup, refute-verify, critique
incompleteness, and report. You do **not** review the change yourself.

**The panel is READ-ONLY and NON-GATING.** Its findings are recorded as
\`review\`-strength evidence — weaker than automated proof by construction. A
panel finding NEVER blocks archive, flips verification readiness, or fails
\`specbase coverage --strict\`; those continue to gate on structural rot only.

**Input**: optionally a change name after the command. If omitted, infer it from
context or prompt for selection with \`specbase list --json\`.

---

## Step 0 — Resolve the review model

${stepZero}

## Step 1 — Router: touched subtrees → the projected lenses

Map each touched pair to the **most-specific** lens whose scope covers it,
falling back up the tree to the plane-wide default — the same resolution rule as
\`specbase show\`/locator lookup. Scale the lens set to the changed surface: a
lens fires only when its subtree is touched, and a trivial diff spawns nobody.

**Lens scope = the projected lens set for this project:**

| Lens | Question | Scope |
|---|---|---|
${lensRows}

A pair under a scoped lens (e.g. \`architecture/rings/boundaries\`) routes to that
scoped lens rather than the plane-wide one (most-specific wins). A lens the model
does not project simply does not exist here.

Then explicitly **\`log\`** the selected lens set and, for EVERY lens **skipped**,
why (e.g. "\`architectural\` skipped — no \`architecture/\` pair touched").
Silence is never coverage: the skipped list is part of the report and the
completeness critic (step 5) audits it. **Every finding is tagged with its lens.**

## Step 2 — Deterministic gate FIRST (when bindings exist), then compute the residue

${gateStep}

## Step 3 — Fan-out: parallel, blind, one slice each

Spawn each selected lens as an independent reviewer **in parallel** (they are
blind to each other; that independence is the design). Hand each reviewer, at run
time, the spec + evidence **sliced fresh from ${policySource}** — the specs are
the living policy; never copy charter/rule text into a lens method, and do not
copy a fix literally from the diff. Each reviewer returns findings as
\`path:line — defect [high|medium|low]\`, a why-sentence citing the slice, and a
fix, or states plainly that its lens is clean. Keep each reviewer inside its lens.

## Step 4 — Dedup / synthesize by file:line

Merge every reviewer's findings keyed by \`file:line\`: same line + same defect →
one entry tagged with **both** lenses; same line + different defects → keep both.
Preserve each finding's lens attribution and severity. Discard anything already
in the already-covered set that slipped through.

## Step 5 — Refute-verify (high severity) + completeness critic

**Refute by default.** For **every high-severity** finding, run an independent
second opinion whose job is to **refute** it: construct the concrete input that
truthfully triggers it, or explain why it cannot fire. Only findings that survive
refute stay at high severity; a refuted one is downgraded or dropped, with a
note. Medium/low are reported as-is.

**Completeness critic.** Run one final reviewer asking: given the touched pairs,
which lens **should have run and did not**? Cross-check the skipped-lens log
against the actual change surface. A lens that never ran is not a clean bill.

## Step 6 — Report: read-only, severity-grouped, lens-attributed

Emit ONE report: the lenses run and skipped (with why), the deterministic gate
status (or a "no gate — flat project" note), then findings grouped
**High / Medium / Low**, each tagged by lens(es) and marked verified/downgraded,
plus a Coverage section (completeness-critic gaps and un-lensed review claims).
Record every finding as **\`review\`-strength**.

State explicitly that the panel is read-only: **it changes no code, and its
verdicts do not gate archive, verification readiness, or \`--strict\`.**

---

## Lens methods (method only — the policy comes from the spec at review)

Each lens judges EXACTLY ONE concern and is blind to the others. It reads its
policy fresh from the specs it covers; it holds no copied rules.

${methodSection}

---

## Growth by proposal, never automatic

When a non-deterministic claim has no home, POINT it at an existing lens or
PROPOSE a new/scoped lens through the normal change workflow — a lens is added
(or a broad lens split into a scoped one) as a change, never created or split
automatically. \`specbase coverage\` surfaces the pressure (un-lensed gaps, split
candidates); the human makes the call. This mirrors hardening (review →
automated): the tool shows the case, the person decides.

---

**Panel scope (read-only).** The panel cannot be asked to change code; it can
only apply these lens review runs in parallel and report. It never makes a
code edit, never touches archive readiness, and its verdicts do not enter the
diff.`;
}

/**
 * The review-panel SKILL projection. Body is a projection of the resolved
 * review model (see `reviewPanelBody`); identical to the command projection
 * (parity). Registered for EVERY model — flat projects get the general
 * spec-conformance reviewer, governed projects the projected lens set.
 */
export function getReviewPanelSkillTemplate(specModel?: SpecModel): SkillTemplate {
  return {
    name: 'specbase-review-panel',
    description: REVIEW_PANEL_DESCRIPTION,
    instructions: reviewPanelBody(specModel),
    license: 'MIT',
    compatibility: 'Requires specbase CLI.',
    metadata: { author: 'specbase', version: '1.0' },
  };
}

/** The review-panel COMMAND projection. Identical body to the skill (parity). */
export function getReviewPanelCommandTemplate(specModel?: SpecModel): CommandTemplate {
  return {
    name: 'SPCB: Review Panel',
    description: 'Run the review panel (read-only, review-strength, non-gating)',
    category: 'Workflow',
    tags: ['workflow', 'review'],
    content: reviewPanelBody(specModel),
  };
}