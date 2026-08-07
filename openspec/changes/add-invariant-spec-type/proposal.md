## Why

OpenSpec specs today are implicitly *features* — ephemeral intent you build once and finish. But a codebase also has **durable decisions**: architecture, code-quality, and design-language constraints that must hold for *all* future code. These are different in kind: their lifecycle is "never done," their enforcement is typically a lint rule or type rather than a test, and — critically — they should be handed to the AI as ambient context so the agent *complies by default* instead of being corrected after the fact.

This change makes that distinction first-class. An **invariant** is an enforced, injected Architecture Decision Record: a durable constraint with a lint binding (so code can't drift) and a generated context injection (so the AI never drafts the drift). This is the core of "spec-driven development *with AI guardrails*."

Depends on `add-spec-metadata-frontmatter` (the `type` field) and composes with `add-requirement-enforcement` (lint as the default kind). Builds on the existing `rules-injection` rail.

## What Changes

- Give `type: invariant` real semantics (the field was reserved earlier). Invariants default their enforcement `kind` to `lint`.
- Introduce a **hybrid invariant body shape**: an ADR header up front (Decision: statement + rationale) followed by **compliant** and **violating** examples that double as lint fixtures — mirroring how feature scenarios double as test cases.
- **Generated context injection:** invariant content is composed into the agent's working context at load time via the existing `rules-injection`/`config-loading` rail. The config loader merges hand-written `context`/`rules` with invariant-derived guardrails — **without mutating the hand-authored `config.yaml`** (single source of truth stays in the invariant specs).
- Coverage semantics for invariants differ: an invariant is "covered" when it has an active lint binding **and** is present in injected context; a stated invariant with neither is reported as aspirational (same treatment as an orphan/unenforced note).
- Sub-labels are free-form (`invariant.security`, `invariant.architecture`) for the author's own taxonomy.

## Capabilities

### New Capabilities

- `invariant-specs`: Semantics, hybrid ADR body shape, and lifecycle of `type: invariant` specs, including how they are enforced (lint) and reported in coverage.
- `invariant-context-injection`: Composing invariant-derived guardrails into agent working context at load time without mutating hand-authored config.

### Modified Capabilities

- `config-loading`: Merge invariant-derived context/rules with hand-authored config at load time.
- `rules-injection`: Accept an injection surface aimed at the implementer, not only artifact authors.

## Impact

- `src/core/parsers/` — parse the hybrid invariant body (Decision + compliant/violating examples).
- `src/core/config/` (config-loading) — compose invariant-derived context; never write to `config.yaml`.
- `src/core/` rules/context injection — new injection target for implementation-time guardrails.
- Coverage (from `cli-coverage`) — invariant-specific "covered" definition.
- Open design decisions (see design.md): injection surface naming, and how invariants are discovered for injection (all `type: invariant` specs vs an opt-in list).
