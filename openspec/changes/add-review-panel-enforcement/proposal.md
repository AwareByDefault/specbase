## Why

The governed model classifies enforcement evidence honestly — `automated`, `review`, `manual` — but `review` is a dead end: a static procedure that never runs and never grows. The whole class of non-deterministically-checkable truth (does the code actually produce the behavior? does it deviate from the architecture? does this test *exercise* the claim or just import it?) has no executor and no growth mechanism. Kairos already solved this with an agentic review-panel — blind per-lens reviewers, policy sliced fresh from living docs, reviewing only the residue above the deterministic gate, refute-verified, coverage-critiqued. This change makes that approach a first-class, growing, per-codebase enforcement layer in OpenSpec: the review analog of the lint config, wired into the two-plane model.

## What Changes

- Make a `review` binding *executable and routable*: add two optional fields — `lens` (which reviewer runs it) and `covered_by` (the sibling deterministic binding IDs it is blind to, so it reviews only the residue above the gate).
- Add a **review panel** the governed workflow runs at verify time: a router selects the lenses whose spec-tree subtree the change touches, the deterministic gate runs first, blind per-lens reviewers fan out over the residue, high-severity findings are refute-verified, and a completeness critic checks which lenses should have run. The panel is **read-only and non-gating** — its findings are `review`-strength, never automated proof.
- Ship **four default lenses** that fall out of the model's own structure: `architectural` (deviations from `architecture/` specs), `behavioural` (does the code produce the `behavior/` specs, unerringly), `enforcement` (do the bound checks actually verify the claim — the meta lens), and `code-quality` (clean, simple, no cruft).
- Support **scoped lenses via nesting**: a lens's scope is a subtree of the spec tree; the defaults scope to a whole plane, and a lens is split by descending the nesting (e.g. `architecture/rings/boundaries`) when a subtree earns dedicated attention. The router resolves most-specific-wins, exactly like locator resolution.
- Extend `openspec coverage` to count lenses, report a **review claim with no lens** as a gap, and surface **split candidates** (a subtree with many review claims under one broad lens). Hardening (review → automated) and splitting stay human judgment, made visible.
- Update explore so that when a claim is non-deterministic, the agent points it at an existing lens or proposes a new/scoped one — growing the panel through the normal governed loop.
- Legacy flat projects: unchanged. Governed additions gated on the spec model; hash-locked parity preserved.

## Capabilities

### New Capabilities

- `spec-review-panel`: The agentic review panel as governed enforcement — default and scoped lenses, blind fan-out over the gate residue, refute-verify and completeness-critic, read-only `review`-strength output, and growth by proposal.

### Modified Capabilities

- `spec-enforcement`: Add the `lens` and `covered_by` fields to review bindings so a review claim names its reviewer and its deterministic residue.
- `cli-coverage`: Count lenses, flag un-lensed review claims, and surface lens split candidates.
- `opsx-verify-skill`: Run the review panel over the affected review bindings as the review-procedure step.

## Impact

- **Schema**: extend the enforcement binding schema with optional `lens` (string) and `covered_by` (string[]); additive and backward-compatible.
- **Templates**: a generated review-panel orchestration skill/command + four default lens methods (project-personalized and grown); explore/verify governed guidance updated to run and grow the panel. Skill/command projections stay in parity; legacy output byte-identical.
- **Core**: coverage aggregation gains lens rollups, an `un-lensed review` gap class, and split-candidate detection over the existing pair engine — no drift-engine changes.
- **Non-goals**: the panel is not a merge gate, does not hard-fail archive/`--strict`, does not auto-harden review→automated, and ships no project-specific lenses beyond the four defaults (those grow per project).
