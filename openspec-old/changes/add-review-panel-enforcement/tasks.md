## 1. Enforcement binding vocabulary

- [x] 1.1 Add optional `lens` (string) and `covered_by` (string[]) to the enforcement binding Zod schema; additive, backward-compatible; parse and surface them without changing drift/coverage for bindings that omit them
- [x] 1.2 Tests: bindings with/without the fields parse; drift and coverage unchanged when absent; the fields round-trip through parse

## 2. Review-panel skill and default lenses

- [x] 2.1 Add a generated `review-panel` orchestration skill+command template (governed-only): router (touched subtrees → lenses, scaled, skips logged) → deterministic gate first → blind parallel per-lens fan-out over the residue → dedup by file:line → refute-by-default verify on high severity → completeness critic → read-only severity-grouped, lens-attributed report
- [x] 2.2 Add the four default lens methods (architectural, behavioural, enforcement, code-quality) as templates: method only, policy sliced from the governed specs in scope at review time; enforcement lens judges evidence adequacy and does not recurse
- [x] 2.3 Encode lens scope = spec-tree subtree and most-specific-wins routing (defaults scope to plane/tree); thread through skill generation and spec-model gating
- [x] 2.4 Tests: panel + lens guidance present under governed, absent under legacy, skill/command parity; hash-locked parity test passes unchanged

## 3. Coverage lens views

- [x] 3.1 Extend the coverage aggregator: lens rollup (review claims per lens/scope), un-lensed-review gap class (review/manual binding whose lens does not resolve, or review claim with no lens), and split-candidate detection (subtree over a review-claim threshold under one broad lens)
- [x] 3.2 Surface these in `openspec coverage` text and `--json`; none affect `--strict` (gates on structural rot only); a `lens`/`covered_by` pointing at a missing target stays caught by existing orphan detection
- [x] 3.3 Tests: lens rollup, un-lensed gap, split candidate, and strict-unaffected; determinism preserved

## 4. Verify and explore integration

- [x] 4.1 Update `GOVERNED_VERIFY_GUIDANCE`: the review-procedure step runs the panel over affected review bindings' lenses (residue above `covered_by`), reports `review`-strength, never gates; un-lensed claims flagged
- [x] 4.2 Update `GOVERNED_EXPLORE_GUIDANCE`: when a claim is non-deterministic, point it at an existing lens or propose a new/scoped one (growth by proposal, not auto-created)
- [x] 4.3 Tests: verify/explore governed-present, legacy-absent, parity preserved

## 5. Verification

- [x] 5.1 `pnpm build`, `pnpm test`, `pnpm lint` green; legacy output byte-identical; hash-locked parity unchanged
- [x] 5.2 Exercise against `test-project/`: add a review binding with a `lens`, run `openspec coverage` and confirm the lens rollup + an un-lensed gap render sensibly
