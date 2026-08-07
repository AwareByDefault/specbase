## Context

The habit-tracker already has governed `behavior` and `architecture` planes and
an import-boundary fitness function. Three more invariants are true today but
ungoverned: the ops stack, domain purity, and CLI voice. This change adds a
governed pair per plane, each with an automated fitness function (and, for
voice, a review lens for the residue a linter cannot judge).

## Goals / Non-Goals

**Goals**
- Govern the ops, code-quality, and design-system planes with real, runnable
  enforcement grounded in this repo.
- Keep enforcement in the same style as the existing `tools/lint/boundaries.test.ts`
  fitness function (static scan via `bun test`, no execution of app code).

**Non-Goals**
- No change to app behavior, runtime, or CLI output.
- No design *tokens* stratum — this is a CLI with no visual token artifact, so
  design-system is exercised through its voice stratum only.

## Decisions

- **ops.runtime → automated audit.** A `bun test` fitness function reads
  `package.json` and `tsconfig.json` and asserts no `dependencies` key and
  `strict: true`. Static file reads, deterministic, fast.
- **code-quality.domain-purity → lint scan.** A `bun test` scan of
  `src/domain/**` fails on any `console.` token. Chosen over the import-boundary
  check because `console` is a global (no import), so the existing boundary
  fitness function structurally cannot catch it — a genuinely separate smell.
- **design-system.cli-voice → lint + review.** The no-exclamation rule is a
  deterministic scan of user-facing error strings (`bun test`); the "terse,
  never blames the user" tone is bound to the `design` review lens, matching the
  two-strength shape of the design-system plane (automated where verifiable,
  review for the judgment).

## Risks / Trade-offs

- **[Voice lint over-reaches]** A naive `!` scan could flag legitimate `!==` or
  logical-not. Mitigation: the scan targets string literals passed to
  `console.error`/`console.log`, not arbitrary source.
- **[Domain-purity false positives]** Comments mentioning `console.` could trip a
  raw scan. Mitigation: strip line/block comments before scanning, mirroring the
  boundaries fitness function's approach.

## Migration Plan

1. Author the three spec + enforcement pairs.
2. Implement the three fitness functions under `tools/`.
3. Move each binding from `planned` to `active` once its target exists and passes.
4. `openspec validate --strict` the change.

## Open Questions

- Should the voice lint eventually cover a banned-word list (blame words), or is
  the `design` review lens sufficient for that residue? Lens-only for now.
