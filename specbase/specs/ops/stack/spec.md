---
id: ops.stack
---

### Requirement: The product runs on Node 20.19 or newer, as ESM
**ID:** node-runtime-floor
`package.json` SHALL declare a Node engine floor of `>=20.19.0`, and the
package SHALL ship as native ESM (`"type": "module"`) so it runs on that floor
with no transpile step at install time. Every toolchain surface that provides a
Node — the CI setup step and the Nix build inputs — SHALL supply a Node at or
above the declared floor. Raising the floor is a change to this requirement,
and the surfaces follow it.

#### Scenario: The manifest declares the floor
**ID:** engines-declares-the-floor
- **WHEN** the package manifest is read
- **THEN** `engines.node` declares `>=20.19.0`

#### Scenario: The package is ESM
**ID:** package-is-esm
- **WHEN** the package is loaded by a consumer
- **THEN** it resolves as an ES module, declared by `"type": "module"`

#### Scenario: CI and Nix honour the floor
**ID:** ci-and-nix-honour-the-floor
- **WHEN** CI sets up Node, or the Nix build selects its Node input
- **THEN** the selected version is at or above the engine floor

### Requirement: pnpm is the only package manager
**ID:** pnpm-is-the-package-manager
pnpm SHALL be the sole package manager for this repository. `package.json`
SHALL pin a pnpm version in `packageManager`, `pnpm-lock.yaml` SHALL be the only
lockfile committed, and automated installs SHALL use a frozen lockfile so a
resolution drift fails the run instead of being silently accepted.

#### Scenario: The pnpm version is pinned and locked
**ID:** pnpm-pinned-and-locked
- **WHEN** the repository is set up
- **THEN** `packageManager` pins a `pnpm@<version>` and `pnpm-lock.yaml` is present

#### Scenario: No competing lockfile exists
**ID:** no-competing-lockfile
- **WHEN** the repository root is inspected
- **THEN** no `package-lock.json` or `yarn.lock` is present

#### Scenario: CI installs from the frozen lockfile
**ID:** ci-installs-frozen
- **WHEN** a CI job installs dependencies
- **THEN** it installs with pnpm and a frozen lockfile

### Requirement: Commander is the CLI framework
**ID:** commander-is-the-cli-framework
The command surface that `behavior/cli` specifies SHALL be built on Commander,
carried as the runtime dependency `commander`, and the package SHALL expose the
`openspec` executable through its `bin` entry. Replacing the framework is a
change to this requirement alone; the behavior specs name no framework.

#### Scenario: Commander is a runtime dependency
**ID:** commander-is-a-runtime-dependency
- **WHEN** the dependency manifest is read
- **THEN** `commander` is present under runtime `dependencies`, not `devDependencies`

#### Scenario: The executable is published
**ID:** openspec-bin-entry-published
- **WHEN** the package is installed
- **THEN** it exposes an `openspec` executable through its `bin` entry

### Requirement: PostHog is the telemetry backend
**ID:** posthog-is-the-telemetry-backend
The telemetry backend that `behavior/telemetry` names abstractly SHALL be
PostHog, reached through the runtime dependency `posthog-node`. Swapping the
telemetry vendor SHALL change this requirement and its dependency only, and no
behavior requirement.

#### Scenario: The PostHog client is a runtime dependency
**ID:** posthog-node-is-a-runtime-dependency
- **WHEN** the dependency manifest is read
- **THEN** `posthog-node` is present under runtime `dependencies`

### Requirement: The GitHub CLI is an external tool, not a dependency
**ID:** github-cli-is-an-external-tool
The GitHub CLI (`gh`) that `behavior/cli/feedback` degrades away from when it
is missing SHALL stay a user-installed external tool, invoked as a subprocess.
It SHALL NOT be bundled as a package dependency, so the product carries no
GitHub client in its install footprint.

#### Scenario: gh is invoked as a subprocess
**ID:** gh-invoked-as-a-subprocess
- **WHEN** the feedback command files an issue
- **THEN** it spawns the `gh` executable from the user's environment

#### Scenario: gh is not a package dependency
**ID:** gh-not-a-package-dependency
- **WHEN** the dependency manifest is read
- **THEN** no GitHub CLI package appears in `dependencies` or `devDependencies`
