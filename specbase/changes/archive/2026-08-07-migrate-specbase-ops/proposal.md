## Why

The ops tranche of the specbase migration (design D3 / Migration Plan step 4).
The legacy store holds the repository's toolchain truth in three places that no
governed pair guards today: `openspec-old/specs/ci-nix-validation`,
`openspec-old/specs/ai-tool-paths` (plus its `add-global-install-scope`
revisions and the shipped `feat-add-omp-tool-support` residue), and a set of
vendor facts that leaked into behavior specs — PostHog in `telemetry`, the
GitHub CLI in `cli-feedback`. Ops is the plane where vendor names, runtime
pins, and CI vocabulary belong (`docs/clean-specbase.md` §1–2), so the swap
test holds: a runtime, a CI system, or a telemetry vendor can change by editing
ops only.

## What Changes

- **Add `ops/nix-ci`** — the Nix flake, the pnpm-hash update script, the
  `nix-flake-validate` CI job, and local `act` runnability. Every claim was
  re-checked against the real `flake.nix` and `.github/workflows/ci.yml`;
  claims that no longer match reality are restated or dropped (see Reality
  Corrections).
- **Add `ops/tool-paths`** — the `AI_TOOLS` registry shape, the supported tool
  roster and their container directories (including `.omp/` for Oh My Pi,
  shipped per the manifest's verified keep verdict), the
  `<root>/<skillsDir>/skills/` layout, global tool-home resolution, and
  cross-platform path construction.
- **Add `ops/stack`** — the runtime and toolchain the repo mandates: the Node
  `>=20.19.0` floor, pnpm as the only package manager, Commander as the CLI
  framework, PostHog as the telemetry backend, and the GitHub CLI as an
  external tool. These are the vendor facts that `behavior/telemetry`,
  `behavior/cli`, and `behavior/cli/feedback` name abstractly.
- **Enforcement is `command` bindings throughout**, per design D4's ops row:
  `nix flake check` for flake evaluation, and node conformance one-liners
  auditing `flake.nix`, `.github/workflows/ci.yml`, `scripts/update-flake.sh`,
  `.actrc`, `src/core/config.ts`, the command adapters, and `package.json`.
  No `review` bindings — every ops claim in this tranche is mechanically
  checkable against an artifact in the tree.

## Planes

All three pairs are **ops** (`specs/ops/<locator>/`). The actor is the
infra/toolchain owner: these requirements get re-specified when the runtime
world changes — a Node bump, a CI provider swap, a telemetry vendor change, a
new AI tool. No behavior, architecture, or agents deltas: the user-visible
contracts these facts serve already live (or will land) on `behavior/*`, and
this tranche only gives their vendor and toolchain facts a single home.

`ops/planning-layout` already landed in the foundation tranche and is not
restated here.

## Reality Corrections

Recorded so the drops are never implied (design D7):

- **"The PR SHALL NOT be mergeable until Nix validation passes"** — dropped as
  written. The `nix-flake-validate` job is path-filtered
  (`if: needs.changes.outputs.nix == 'true'`) and the aggregate
  `All checks passed` gate explicitly treats a `skipped` result as success.
  Restated as: the aggregate gate depends on the job and fails on any
  non-success result other than a path-filtered skip.
- **"Experimental features (flakes, nix-command) SHALL be enabled"** — dropped
  as a standalone claim. No workflow step configures `experimental-features`;
  flake support comes from the `DeterminateSystems/nix-installer-action`
  default and is evidenced by `nix build` succeeding on the flake. Folded into
  the installer requirement rather than asserted as its own configuration step.
- **"CI Performance Optimization"** (under 5 minutes clean, under 3 cached) —
  already demoted by the manifest (destination `—`) as unfalsifiable tuning
  guidance; not carried. The job's real guard is `timeout-minutes: 10`, which
  is a workflow detail, not a contract worth a requirement.
- **`skillsDir: '.openspec'`** from the `add-global-install-scope` delta's
  example — never shipped; no `.openspec` entry exists in `AI_TOOLS`. The
  requirement's general claim (project-scope skills land under the tool's
  container dir) is kept; the illustrative value is not.

## Impact

- New pairs: `specs/ops/nix-ci/`, `specs/ops/tool-paths/`, `specs/ops/stack/`.
- No source, test, or docs changes — every binding audits an artifact that
  already exists.
- Manifest coverage: all 5 `ops/nix-ci` rows and all 7 `ops/tool-paths` rows
  land here, plus the two clause-splits the manifest routes to `ops/stack`
  (the PostHog vendor fact from `telemetry` #9 and the `gh` toolchain fact from
  `cli-feedback` #2). See `tasks.md` §4 for the row-by-row check.
