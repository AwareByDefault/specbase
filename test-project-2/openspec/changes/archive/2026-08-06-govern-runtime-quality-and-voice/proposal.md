## Why

The habit-tracker's behavior and architecture are governed, but three planes that
are already true of this repo are undocumented and unenforced: its **ops** stack
(Bun + strict TypeScript, zero runtime dependencies), its **code-quality** rule
that the domain stays presentation-free, and its **design-system** voice for
user-facing CLI copy. Each is a real invariant a future change could quietly
break; this change makes them governed truth with paired enforcement.

## What Changes

- Add an **ops** spec mandating the runtime stack: Bun as the runtime, strict
  TypeScript, and **no runtime dependencies** (habit state stays local JSON, no
  network or database). Enforcement audits `package.json` and `tsconfig.json`.
- Add a **code-quality** spec: the pure domain layer MUST stay free of
  presentation and I/O calls — specifically no `console.*` in `src/domain/**`.
  This is a smell distinct from the existing import-boundary check (which catches
  imports, not global `console` calls). Enforcement is a lint scan.
- Add a **design-system** spec for CLI copy voice: user-facing messages are
  terse, error output is prefixed and never blames the user or shouts (no `!`).
  Enforcement pairs the `design` review lens with an automated no-exclamation
  lint.

## Planes

- **Ops** (`specs/ops/runtime/`): what the project uses and how it runs.
- **Code-quality** (`specs/code-quality/domain-purity/`): a cleanliness rule
  about what good code looks like here.
- **Design-system** (`specs/design-system/cli-voice/`): the voice/tone of
  user-facing copy — HOW outcomes are presented.

## Spec pairs

- `ops.runtime` — new governed pair (spec + enforcement).
- `code-quality.domain-purity` — new governed pair.
- `design-system.cli-voice` — new governed pair.

Each spec is paired with an `enforcement.md`. All three invariants already hold
in the current code, so this change is primarily documentation + fitness
functions that keep them holding.

## Impact

- **New specs**: `specs/ops/runtime/`, `specs/code-quality/domain-purity/`,
  `specs/design-system/cli-voice/` (each a spec + enforcement pair).
- **New tooling** (enforcement targets): `tools/ops/runtime.test.ts`,
  `tools/quality/no-console-in-domain.test.ts`, `tools/design/error-voice.test.ts`.
- **No behavior change**: the app's runtime, domain, and CLI copy are unchanged;
  this adds governance and its evidence.
- **Config**: the `design-system` plane is enabled in `openspec/config.yaml`
  (`specModel.planes+`).
