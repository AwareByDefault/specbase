## Why

> **Status: DEFERRED.** This change is intentionally *not* part of the initial implementation wave. It is captured so the design and its boundary are recorded; nothing in changes 1–6 depends on it. Build it only if/when the lighter bar (a lint rule that exists and runs in the commit hook) proves insufficient.

Coverage in the base design reports an invariant as covered when its enforcement is **attached and runs** (declared/resolve depth). That verifies enforcement *exists*, not that it is *faithful* — i.e. that the lint rule actually discriminates the behavior the ADR describes. A rule can be attached, run on every commit, and still enforce something narrower or different than the invariant claims. This change adds an optional, opt-in way to verify fidelity.

The trap we are explicitly avoiding: hand-copying the invariant's compliant/violating examples into a separate rule-test creates a *second copy* of the examples that silently drifts from the spec — relocating the exact drift problem by one file. The whole design below exists to prevent that.

## What Changes

- **OpenSpec exposes invariant examples as structured data.** Add `--examples` to `openspec spec show <invariant> --json`, returning each example's `disposition` (compliant | violating), declared `path`, `lang`, and `code`. This is OpenSpec's *only* responsibility here — serving the example data.
- **Fidelity is verified by a project-owned, data-driven harness.** The project writes one small harness that loads examples via the JSON above and feeds them to *its own* linter/checker. OpenSpec never runs a linter, never spawns a worktree, and never knows the project's language or framework.
- **Single source of truth.** Because the harness *reads* examples from the spec at runtime rather than copying them, editing the examples automatically changes what the harness checks. There is no sync step because there is no duplicate.
- **Optional "faithful" coverage rung.** When such a harness is present and passing (it runs as a normal test in the existing commit hook / CI), coverage MAY report invariants at a `faithful` rung above `attached`. Absent the harness, coverage behavior is unchanged — fidelity is purely additive and opt-in.

## Capabilities

### New Capabilities

- `enforcement-fidelity`: An opt-in, language-agnostic contract for verifying that an enforcement faithfully discriminates its invariant's compliant/violating examples — by exposing examples as structured data consumed by a project-owned harness, keeping the spec the single source of truth.

### Modified Capabilities

- `cli-spec`: Add `--examples` structured output to `spec show`.
- `cli-coverage`: Optionally surface a `faithful` rung when a fidelity harness reports results; default coverage unaffected.

## Impact

- `src/commands/spec` — `--examples` JSON projection of invariant examples.
- `src/core/parsers` — surface parsed compliant/violating examples in the model (already parsed for the invariant body in change 4; this exposes them).
- Documentation — the harness contract: input shape (examples JSON), expected assertion (compliant clean / violating flagged by the project's own tool), and that minimal-pair authoring is what makes black-box discrimination sound.
- Explicitly out of scope: OpenSpec executing linters, worktree materialization, per-language adapters. Those stay in project-land.
