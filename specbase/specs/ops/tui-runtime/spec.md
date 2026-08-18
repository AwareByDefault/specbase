---
id: ops.tui-runtime
---

### Requirement: Interactive rendering uses a contained Bun lane
**ID:** contained-bun-lane
The interactive terminal renderer SHALL run with Bun 1.3 or newer as a child runtime of the Node/Commander CLI. The package-wide Node engine SHALL remain `>=20.19.0`, and plain and JSON view modes SHALL run without Bun or renderer initialization.

#### Scenario: The Node baseline is unchanged
**ID:** node-floor-remains
- **WHEN** the package manifest and view launcher are inspected
- **THEN** `engines.node` remains `>=20.19.0`
- **AND** only interactive view launch requires Bun 1.3 or newer

#### Scenario: Automation avoids the renderer runtime
**ID:** plain-json-need-no-bun
- **WHEN** plain or JSON view output runs in a Node 20.19 environment without Bun
- **THEN** no OpenTUI module or native renderer artifact is loaded

### Requirement: OpenTUI Core is exact, isolated, and runtime-resolved
**ID:** exact-opentui-core
The production manifest SHALL carry `@opentui/core` at exactly `0.5.4` with no range operator. Interactive rendering SHALL use its Core API directly, and renderer application imports SHALL be confined to the private renderer entrypoint rather than React, Solid, or the main CLI graph. The build SHALL keep `@opentui/core` and its platform native optional packages external to the application bundle so the consumer package manager installs them and Bun resolves them from the installed dependency tree at runtime; the package SHALL NOT vendor or inline those packages or binaries.

#### Scenario: Dependency and entrypoint are auditable
**ID:** exact-core-and-private-entry
- **WHEN** the production manifest, build configuration, and packed package are inspected
- **THEN** `@opentui/core` is declared exactly as `0.5.4`
- **AND** a private application entrypoint owns the Core imports while OpenTUI and native packages remain external
- **AND** no React or Solid renderer package is required

### Requirement: Packed installs initialize the native renderer on the supported CI matrix
**ID:** native-artifact-support
The existing Linux, macOS, and Windows CI matrix members SHALL set up Bun 1.3 or newer and run `pnpm run test:tui`. That script SHALL pack the package, install the tarball into a clean consumer, resolve OpenTUI and the platform native package from that consumer installation, and initialize and destroy the renderer under Bun. A missing or unloadable runtime dependency SHALL fail with package, platform, architecture, and remediation details. Support is claimed only for the platform/architecture combinations actually exercised by those matrix members, not every upstream artifact record.

#### Scenario: Packed consumer initializes on each CI OS
**ID:** native-artifacts-audited
- **WHEN** each existing Linux, macOS, and Windows matrix member runs the packed-runtime smoke with Bun 1.3 or newer
- **THEN** the clean consumer installs OpenTUI and its selected native package outside the application bundle
- **AND** Bun initializes and destroys the renderer from the packed installation
- **AND** the private renderer application entrypoint is present in the packed files
