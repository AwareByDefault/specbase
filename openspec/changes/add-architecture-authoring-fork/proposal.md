## Why

Code architecture should be a first-class citizen of authoring, not an afterthought. When a feature introduces durable architecture — adding a database, a new boundary, a cross-cutting pattern — the agent drafting it should recognize that and **fork the work into two specs**: the feature (behavior, tested) and the invariant (architecture, linted + injected). "Add a database for sessions" is both a feature *and* an architectural decision about how persistence fits.

This turns one proposal into two outputs with different lifecycles, and requires a **provenance edge** that does not exist today: the artifact graph models dependencies between artifact *types* (proposal → design → tasks) but has no concept of one spec being *born from* a change or one spec *relying on* another.

Depends on `add-invariant-spec-type`.

## What Changes

- Teach the `explore` and `propose` skills to detect architecture-bearing work and **fork** it into a feature spec plus one or more invariant specs, with a `design.md` explaining how they fit.
- Encode the detection heuristic (soft + structural): triggers include a new external dependency, a new seam/boundary, a technology choice, or a cross-cutting concern. Structurally, `propose`/`validate` SHALL warn when a change adds such a signal but declares no invariant ("intentional?").
- Add **provenance edges** to the spec model: an invariant records the change it was `bornFrom`; a feature may record invariants it `reliesOn`. Surface these in `openspec show`/`doctor`.
- Guard against **invariant bloat** (the test-bloat disease one level up): apply "minimum sufficient invariant" — don't mint architectural law for one-off choices — and reuse the coverage reverse-map to flag invariants doing no work (no lint, no injection).
- Lifecycle: on archive, the feature delta merges into feature specs and folds away, while the invariant becomes a standing durable spec and registers into injected context — one change, two exit doors.

## Capabilities

### New Capabilities

- `architecture-authoring`: Detection + forking of architecture-bearing features into feature + invariant specs during explore/propose, including the structural "missing invariant" warning.
- `spec-provenance`: Provenance edges (`bornFrom`, `reliesOn`) between changes and specs, surfaced in show/doctor.

### Modified Capabilities

- `change-creation`: Support a change emitting both a feature delta and a new durable invariant spec.
- `artifact-graph`: Extend the relationship model to cross-spec provenance edges.
- `cli-archive`: Two-exit-door archival — merge feature deltas, promote invariants to standing specs, register injection.

## Impact

- `.claude/skills/openspec-explore` and `openspec-propose` (and equivalent generated skills) — fork heuristic + guidance.
- `src/core/change-metadata/` / change-creation — emit feature + invariant from one change.
- `src/core/artifact-graph/` — provenance edges + cycle/validity checks.
- `src/commands/archive` — divergent lifecycle handling.
- Open design decisions (see design.md): where provenance is stored, and how strict the "missing invariant" gate should be.
