## Context

`review`-strength enforcement is honest but inert. This change gives it an executor (a panel of blind per-lens reviewers) and a growth mechanism (lenses scoped to spec-tree subtrees, grown by proposal), reusing the machinery we already have: the two planes are the reviewer specialties, `covers` is the lens↔claim coupling (no separate manifest), and coverage's orphan/strength machinery is the anti-rot and the dashboard. The Kairos review-panel is the reference implementation; this generalizes it onto the governed model. It must not pretend AI review is deterministic: findings stay `review`-strength and never gate.

## Goals / Non-Goals

**Goals:**
- Make a `review` binding executable: name the lens that runs it and the deterministic residue it is blind to.
- Ship a cheap, principled default panel (four lenses) that grows by descending the nesting.
- Run the panel at verify over only the affected subtrees; keep it read-only and refute-calibrated.
- Make un-lensed review claims and lens-split pressure visible in coverage.

**Non-Goals:**
- No merge/archive/`--strict` gate on a lens verdict (review is weaker evidence by construction).
- No separate `manifest.yaml` — the enforcement pairs are the manifest.
- No auto-hardening (review→automated) and no auto-splitting — both stay human, made visible.
- No project-specific lenses shipped; only the four defaults + the growth mechanism.
- No changes to the drift engine or validate semantics.

## Decisions

### 1. Two new optional fields on a review binding

`enforcement.md` bindings gain `lens?: string` and `covered_by?: string[]`. `lens` names the reviewer that executes a `review`/`manual` binding; `covered_by` lists sibling binding IDs (usually `automated`) whose deterministic checks already own part of the territory, so the lens reviews only the residue above them. Both optional and additive — existing bindings and the drift engine are unaffected. Core parses and reports them; it never runs a reviewer (workflows do, per design decision 8 of the governed model).

### 2. Lens scope = a spec-tree subtree; the router is most-specific-wins

A lens has a scope expressed as a plane-qualified locator prefix. The four defaults scope to a whole plane or the whole tree:

```
architectural  → architecture/**     behavioural → behavior/**
enforcement    → **/enforcement.md    code-quality → **
```

A lens is *split* by descending the nesting (`architecture/rings`, then `architecture/rings/boundaries`) when a subtree earns dedicated attention. At verify, the router maps each affected pair to the **most-specific** lens whose subtree covers it — the same resolution rule as `openspec show`/locator lookup — falling back up the tree to the plane-wide default. Cost therefore scales with the change surface, not the repo: a scoped lens fires only when its subtree is touched, and a trivial diff spawns nobody.

### 3. The four default lenses are structural, not arbitrary

Because the model has explicit planes plus an enforcement layer, the default panel is the minimum that covers what/how/really-checked/clean:

| Lens | Question | Default scope |
|---|---|---|
| `architectural` | Does the code deviate from the architecture specs' invariants/boundaries? | `architecture/**` |
| `behavioural` | Does the code produce the behavioral specs, consistently and unerringly? | `behavior/**` |
| `enforcement` | Do the bound checks actually exercise the claim (test vs. `assert(true)`)? | every pair's bindings |
| `code-quality` | Is the code clean, simple, and free of cruft? | whole tree |

The `enforcement` lens is the keystone: it operationalizes "a passing check proves it ran, not that it verifies the claim," and it audits *automated* bindings too — but it judges evidence adequacy only; it does not review its own verdicts (no recursion into itself).

### 4. The panel is the Kairos pipeline, generalized

The generated `review-panel` skill orchestrates, it does not review: router (touched subtrees → lenses, scaled to surface, skips logged) → deterministic gate first (the project's declared binding commands, passed to reviewers as already-covered + `covered_by` blind list) → parallel **blind** per-lens reviewers over the residue → dedup by file:line → **refute-by-default verify** on high-severity findings → **completeness critic** (which lens should have run and didn't) → severity-grouped, lens-attributed report. Policy is sliced fresh from the affected specs at run time (the specs are the living docs); nothing is copied into a lens method. Output is a report — read-only, never a gate.

### 5. Verify runs the panel; it does not gate

`/opsx:verify`'s review-procedure step becomes: run the panel over the affected review bindings' lenses (residue above the automated bindings named in `covered_by`), and report findings as `review`-strength. A panel finding never blocks archive or flips `--strict`; those gate on structural rot only. This keeps the honest-evidence contract intact.

### 6. Coverage sees lenses, gaps, and split pressure

`openspec coverage` gains, over the existing aggregation: a lens rollup (how many review claims each lens covers, per scope); an **un-lensed review** gap class (a `review`/`manual` binding whose claim has no resolvable lens — the review analog of a hanging claim); and a **split candidate** signal (a subtree carrying more than a threshold of review claims under a single broad lens). None of these gate; they make the human decisions — grow a lens, split a lens, harden a claim — visible. A `lens` pointing at no defined lens, or a `covered_by` naming a missing binding, is already caught as a stale/broken binding by the existing orphan detection, so anti-rot comes free.

### 7. Growth and splitting are human, made visible

Explore proposes a lens when it meets a non-deterministic claim with no home; splitting a broad lens into a scoped one is a proposal like any other. The tool never adds or splits a lens on its own — it surfaces the pressure (un-lensed gaps, split candidates, `degraded` counts) and the human proposes the change. This mirrors hardening: coverage shows the case, the person makes the call.

### 8. Legacy isolation

All new behavior is gated on the resolved governed spec model. The `lens`/`covered_by` fields are optional and absent from legacy output; the review-panel skill and guidance additions appear only under the governed model; the hash-locked skill-template parity test passes unchanged and legacy CLI output is byte-identical.

## Risks / Trade-offs

- **AI review is the weakest evidence and can hallucinate a clean bill** → keep it `review`-strength, never gating; carry the refute-by-default verify and completeness critic verbatim from Kairos; the `enforcement` lens partially guards the others.
- **Lens sprawl re-creates the test flood** → a lens is expensive (tokens) and scoped to a subtree family, never per-requirement; the four defaults are the floor; splitting is deliberate and human.
- **Cost per verify** → the router scales lenses to the touched surface; scoped lenses fire only on their subtree; trivial diffs spawn no reviewer.
- **The ratchet can stall** (review surface only grows if nobody hardens) → coverage keeps `degraded`/un-lensed/split pressure visible, but hardening stays human by decision.
