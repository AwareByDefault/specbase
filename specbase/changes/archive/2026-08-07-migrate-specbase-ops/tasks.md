# Tasks: migrate-specbase-ops

Ops tranche of the specbase migration. Authors the three remaining `ops/`
pairs — `nix-ci`, `tool-paths`, `stack` — from the migration manifest.
`ops/planning-layout` landed with the foundation tranche and is untouched here.
No source, test, or workflow files change: every binding audits an artifact
that already exists.

## 1. Verify the sources against reality before writing

- [x] 1.1 Read `flake.nix` and `.github/workflows/ci.yml` and check every
      `ci-nix-validation` claim against them.
      *Verified: flake declares 4 systems, dynamic version, `mainProgram =
      "openspec"`, pinned pnpm hash; workflow carries `nix-flake-validate` with
      the installer action, magic cache, `nix build`, `result/bin/openspec`
      verification, the update-script run, and the restore step.*
- [x] 1.2 Record the claims that no longer match reality.
      *Three recorded in `proposal.md` → Reality Corrections: the unconditional
      "required for merge" clause (the job is path-filtered and a skip counts
      as passing), the standalone "experimental features SHALL be enabled"
      claim (no such step; flakes come from the installer default), and the
      already-demoted performance-tuning requirement. A fourth records the
      never-shipped `.openspec` skillsDir example from the install-scope delta.*
- [x] 1.3 Confirm the Oh My Pi keep verdict against `src/core/config.ts`.
      *Verified: `AI_TOOLS` registers `{ name: 'Oh My Pi', value: 'oh-my-pi',
      available: true, skillsDir: '.omp' }`; the adapter writes
      `.omp/commands/opsx-<id>.md`. The `.omp` container dir is carried into
      `ops/tool-paths`.*
- [x] 1.4 Confirm `nix` availability before choosing the flake mechanism.
      *Verified: `nix` is on PATH; `nix flake check --no-build --all-systems`
      exits 0. The binding is a real automated check, not a file stand-in.*

## 2. Truth: author the three ops spec pairs

- [x] 2.1 Author `ops/nix-ci/spec.md` — 5 requirements, 12 scenarios: flake
      build, update script, CI job integration (restated to the shipped
      path-filtered gate), Nix installation and caching, local `act` support.
- [x] 2.2 Author `ops/tool-paths/spec.md` — 5 requirements, 12 scenarios:
      registry shape, the supported roster and container dirs (`.omp` included),
      the `<root>/<skillsDir>/skills/` layout and detection, global tool-home
      resolution with env override, cross-platform path construction.
- [x] 2.3 Author `ops/stack/spec.md` — 5 requirements, 11 scenarios: the Node
      `>=20.19.0` floor plus ESM, pnpm as the only package manager, Commander
      as the CLI framework, PostHog as the telemetry backend, `gh` as an
      external tool.
- [x] 2.4 Check the vendor names land only here.
      *Verified: `ops/stack` names Commander, PostHog, pnpm, and the GitHub CLI,
      and references `behavior/telemetry`, `behavior/cli`, and
      `behavior/cli/feedback` by locator instead of restating their contracts —
      the swap test of `docs/clean-specbase.md` §2.*

## 3. Evidence: author and run the enforcement bindings

- [x] 3.1 Author `ops/nix-ci/enforcement.md` — 5 command bindings:
      `flake-evaluates`, `flake-manifest-conformance`,
      `nix-ci-job-conformance`, `update-script-conformance`,
      `act-local-run-conformance`.
- [x] 3.2 Author `ops/tool-paths/enforcement.md` — 3 command bindings:
      `ai-tools-registry-conformance`, `skills-path-conformance`,
      `path-construction-conformance`.
- [x] 3.3 Author `ops/stack/enforcement.md` — 3 command bindings:
      `stack-manifest-audit`, `toolchain-pin-agreement`,
      `gh-external-tool-conformance`.
- [x] 3.4 Execute every binding exactly as declared and confirm exit 0.
      *All 11 bindings run from the repo root and exit 0. Each was also
      re-executed from the parsed YAML, not just from a scratch copy, so the
      declared `command` + `args` vector is what was proven.*
- [x] 3.5 Write an honest `limitations` on every binding.
      *Each binding states what its evidence does NOT prove — evaluation
      without build, declaration without execution, source sweep without a
      Windows run, `act` configured but not invoked (act is not installed).*
- [x] 3.6 Confirm every requirement and every scenario is covered.
      *50 local IDs across the three pairs (15 requirements, 35 scenarios) —
      17 in `nix-ci`, 17 in `tool-paths`, 16 in `stack`. Every one appears in
      at least one binding's `covers`, and no `covers` entry names an ID that
      is not in its own pair.*
- [x] 3.7 Prove the conformance checks are not vacuous.
      *Spot-checked by running two bindings against doctored copies: changing
      Oh My Pi's container dir to `.xxx` fails `ai-tools-registry-conformance`
      with a named mismatch, and lowering `engines.node` to `>=18.0.0` fails
      `stack-manifest-audit`. Both exit 1 with an actionable message.*

## 4. Manifest coverage check

- [x] 4.1 `ci-nix-validation` rows 1–5 → `ops/nix-ci`.
      *1 Nix Flake Build Validation → `flake-builds-the-cli`; 2 Update Script
      Validation → `update-script-keeps-the-hash-honest`; 3 CI Job Integration
      → `nix-job-runs-in-ci` (restated); 4 Local Testing Support →
      `workflow-runs-locally-with-act`; 5 Nix Installation in CI →
      `nix-installed-and-cached-in-ci`. Row 6 was demoted by the manifest
      (destination `—`) and is correctly absent.*
- [x] 4.2 `ai-tool-paths` rows 1–3 → `ops/tool-paths`.
      *1 AIToolOption skillsDir field → `tool-registry-is-the-single-roster`;
      2 Path configuration for supported tools → `supported-tool-container-dirs`
      + `skills-live-under-the-container-dir`; 3 Cross-platform path handling →
      `paths-are-built-cross-platform`.*
- [x] 4.3 `add-global-install-scope` rows 1, 2, 15 → `ops/tool-paths`.
      *Row 1 [M] skillsDir field and row 2 [M] path configuration supersede the
      flat rows and are merged into the same two requirements, with the global
      surface split out as `global-surfaces-resolve-to-tool-home-dirs` (the
      Codex `CODEX_HOME` scenarios). Row 15 Cross-platform path behavior merges
      into `paths-are-built-cross-platform`.*
- [x] 4.4 `feat-add-omp-tool-support` row 5 → `ops/tool-paths`.
      *Oh My Pi tool detection → `oh-my-pi-uses-omp` and
      `detection-tests-the-container-dir`. The picker behavior stays with
      `behavior/cli/init` per the manifest; only the `.omp` registry fact is
      here.*
- [x] 4.5 The two `ops/stack` clause-splits.
      *`telemetry` row 9's PostHog vendor fact →
      `posthog-is-the-telemetry-backend`; `cli-feedback` row 2's `gh` toolchain
      fact → `github-cli-is-an-external-tool`. Both are named in the manifest's
      Notes column as splits, not as separate rows.*
- [x] 4.6 Confirm the ops destination totals reconcile.
      *Manifest destination table: `ops/tool-paths` 7 rows (3 flat + 3 install-
      scope + 1 omp) and `ops/nix-ci` 5 rows — all 12 land here. `ops/stack`
      takes no numbered rows by design (it absorbs clause-splits only), and
      `ops/planning-layout` was authored fresh in the foundation tranche. No
      ops-destined row is unaccounted for.*

## 5. Validate

- [x] 5.1 `openspec validate --change migrate-specbase-ops --strict` passes.
- [x] 5.2 Confirm the change touches only its own directory.
      *No `src/`, `test/`, `docs/`, or current-store edits; no archive.*
