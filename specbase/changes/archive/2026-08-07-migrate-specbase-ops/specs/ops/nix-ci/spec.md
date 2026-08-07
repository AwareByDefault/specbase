---
id: ops.nix-ci
---

## ADDED Requirements

### Requirement: The repository ships a Nix flake that builds the CLI
**ID:** flake-builds-the-cli
The repository SHALL keep a `flake.nix` at its root whose default package
builds this CLI. The package SHALL read its `version` from `package.json`
rather than a hardcoded literal, SHALL declare `openspec` as its main program,
and SHALL declare support for `x86_64-linux`, `aarch64-linux`, `x86_64-darwin`,
and `aarch64-darwin`. The pinned pnpm dependency hash and `flake.lock` SHALL
stay committed so the build is reproducible.

#### Scenario: The flake evaluates for every declared system
**ID:** flake-evaluates-for-declared-systems
- **WHEN** the flake is checked against all of its declared systems
- **THEN** every package, app, and devShell output evaluates without error
- **AND** the declared system list includes at least `x86_64-linux`

#### Scenario: Version comes from the package manifest
**ID:** version-read-from-package-json
- **WHEN** the package version is released or bumped in `package.json`
- **THEN** the flake picks it up with no edit to `flake.nix`

#### Scenario: The build output carries the binary
**ID:** build-output-contains-the-binary
- **WHEN** CI runs `nix build`
- **THEN** the `result` symlink exists and `result/bin/openspec` is present
- **AND** running the built binary reports a non-empty version

### Requirement: The update script keeps the pnpm hash honest
**ID:** update-script-keeps-the-hash-honest
`scripts/update-flake.sh` SHALL recompute the flake's pnpm dependency hash from
the current `pnpm-lock.yaml`: it SHALL read the version from `package.json`,
warn when `flake.nix` stops using the dynamic version expression, substitute a
placeholder hash to obtain the correct one from a build attempt, write the
result back, and verify the build with the new hash. It SHALL work with both
BSD and GNU `sed`. CI SHALL run the script on every Nix validation run and
restore `flake.nix` afterwards.

#### Scenario: The script recomputes the dependency hash
**ID:** script-recomputes-the-pnpm-hash
- **WHEN** `pnpm-lock.yaml` changes and the script is run
- **THEN** it derives the correct `sha256-` pnpm hash and writes it into `flake.nix`
- **AND** it fails with a non-zero exit code when the hash cannot be determined

#### Scenario: CI runs the script and leaves the tree clean
**ID:** ci-runs-and-restores-the-script
- **WHEN** the Nix validation job runs
- **THEN** it executes `scripts/update-flake.sh`
- **AND** it restores `flake.nix` afterwards, whether the job passed or failed

### Requirement: A Nix validation job runs in CI
**ID:** nix-job-runs-in-ci
The CI workflow SHALL carry a `nix-flake-validate` job on a Linux runner,
triggered by pull request, merge group, push to the default branch, and manual
dispatch. The job SHALL be gated by a path filter over the inputs that can
break the flake — `flake.nix`, `flake.lock`, `package.json`, `pnpm-lock.yaml`,
`scripts/update-flake.sh`, and the workflow file itself. The aggregate required
check SHALL depend on the job and SHALL fail on any non-success result other
than a path-filtered skip.

#### Scenario: The job is declared
**ID:** nix-job-declared
- **WHEN** the CI workflow is inspected
- **THEN** a `nix-flake-validate` job exists that builds the flake and verifies its output

#### Scenario: The job is path-filtered, not unconditional
**ID:** job-is-path-filtered
- **WHEN** a pull request touches none of the Nix-relevant inputs
- **THEN** the Nix validation job is skipped rather than run

#### Scenario: The aggregate gate depends on the job
**ID:** aggregate-gate-depends-on-nix-job
- **WHEN** the Nix validation job fails
- **THEN** the aggregate required check fails
- **AND** a path-filtered skip is accepted as passing

### Requirement: CI installs Nix with a build cache
**ID:** nix-installed-and-cached-in-ci
The Nix validation job SHALL install Nix through the
`DeterminateSystems/nix-installer-action` — which enables flake support by
default — and SHALL enable a Nix build cache action before building, so
repeated runs reuse store paths instead of rebuilding from source.

#### Scenario: Nix is installed by the standard action
**ID:** installer-action-used
- **WHEN** the Nix validation job starts
- **THEN** it installs Nix with `DeterminateSystems/nix-installer-action` before any `nix` command
- **AND** `nix build` succeeds against a flake, so flake support is active

#### Scenario: A build cache is enabled
**ID:** build-cache-enabled
- **WHEN** the Nix validation job runs a second time
- **THEN** a Nix build cache action is in effect for the job

### Requirement: The workflow runs locally with act
**ID:** workflow-runs-locally-with-act
The CI workflow SHALL stay runnable on a developer machine with `act`: it SHALL
use standard GitHub Actions syntax with Linux runners, and the repository SHALL
keep an `.actrc` that maps `ubuntu-latest` to a runner container image.

#### Scenario: The repo ships an act runner mapping
**ID:** actrc-maps-ubuntu-latest
- **WHEN** a developer runs `act` in a fresh clone
- **THEN** `.actrc` supplies the `ubuntu-latest` container image with no extra flags

#### Scenario: The workflow avoids non-portable syntax
**ID:** standard-actions-syntax
- **WHEN** the workflow is read by a local runner
- **THEN** it uses standard `runs-on: ubuntu-latest` jobs and published `uses:` actions
