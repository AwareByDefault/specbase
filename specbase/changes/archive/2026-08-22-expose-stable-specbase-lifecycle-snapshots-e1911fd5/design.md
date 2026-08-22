## Context

Lifecycle state already derives from artifacts, tracked tasks, review footprint, and archive location, while `status --json` adds resolution and diagnostics around that state. The board has a second collection path. External clients need the underlying truth as an installed-package contract before aggregate board and action APIs can safely depend on it.

The contract must remain deterministic, serializable, cross-platform, and usable without command registration or the interactive runtime. Immutable metadata ID is the lookup key; directory names and archive date prefixes are presentation and storage details.

## Goals / Non-Goals

**Goals:**
- Publish one versioned lifecycle snapshot API from the package's supported entrypoint.
- Resolve immutable IDs across active and archived change positions.
- Return lifecycle, position, artifact/task progress, and stable actionable diagnostics.
- Make `status --json` an adapter over the same resolved facts.

**Non-Goals:**
- Aggregate board derivation or rendering.
- Action discovery, action validation, activity, or mutation.
- Pi skills, RPIV workflow execution, Git delivery, or queue ownership.
- Replacing the artifact graph or changing lifecycle-state semantics.

## Decisions

### D1. Publish a versioned result envelope from a headless root

Expose a root-package function shaped conceptually as `getLifecycleSnapshot({ root, id })`. First move Commander program construction behind an explicit CLI-only entrypoint and remove the current `./cli/index.js` re-export from `src/index.ts`, so importing the package root cannot register commands or pull CLI-only dependencies into a consumer. The function returns a serializable result envelope containing a version, either one snapshot or `null`, and ordered diagnostics. The snapshot carries immutable ID, repository position, derived lifecycle, artifact and task progress, and no wall-clock generation field, so unchanged input produces identical output.

The exported version constant gives consumers an explicit compatibility check. Additive fields may remain within the version; incompatible field or semantic changes require a new version.

### D2. Resolve by metadata identity, not directory spelling

Search the selected planning store's active and dated archive positions and match `.openspec.yaml` identity. A directory name may be used only as legacy fallback where current Specbase resolution already permits it. Zero or multiple matches return stable diagnostics rather than selecting arbitrarily.

The result uses logical positions instead of exposing absolute internal paths. Diagnostics may identify project-relative sources so callers can remediate without coupling to one operating system's separators.

### D3. Centralize snapshot derivation below adapters

Create a headless core boundary that composes existing metadata, artifact graph, tracked-task, and lifecycle derivation services. It owns normalization and diagnostic ordering. The package function calls this boundary directly; `status --json` maps its existing status envelope around the same snapshot. Renderer and Commander modules remain downstream adapters.

This avoids making CLI JSON the library API and avoids subprocess overhead, stdout parsing, and command-only failure semantics.

### D4. Keep errors in the data contract when resolution is expected

Missing, unresolved, and ambiguous identities return `snapshot: null` plus ordered diagnostics with stable codes, the requested ID, a concise message, and remediation. Unexpected I/O or programmer failures may still reject the operation. This distinction lets external clients present normal repository problems without parsing exception prose.

## Enforcement design

### `test/commands/work-item-lifecycle.test.ts`

- **Contract:** Construct representative active and archived stores and assert the resolver normalizes immutable identity, logical position, lifecycle, artifact progress, task progress, and ordered diagnostics once for all adapters. Spy or injected-port assertions must show the package and status projections delegate to this resolver instead of independently recomputing fields.
- **Fixtures and harness:** Vitest with temporary planning homes assembled through `path.join()` and existing artifact-graph fixture helpers; no renderer or subprocess is required.
- **Failure signal:** A mismatched normalized DTO, unstable diagnostic order, or adapter bypass fails the focused Vitest file.
- **Known boundary:** This source proves shared derivation and DTO normalization, not installed-package exports or CLI serialization.

### `test/core/view/architecture.test.ts`

- **Contract:** Deterministically walk static imports from the lifecycle snapshot public/core modules and reject reachability to Commander registration, terminal renderer, OpenTUI, or interactive-input modules.
- **Fixtures and harness:** A Vitest static-analysis test over the repository source graph, with path comparisons built from `path.resolve()`/`path.join()` and an explicit forbidden-module roster.
- **Failure signal:** Any newly reachable forbidden module or missing expected public/core entry causes a focused test failure naming the import chain.
- **Known boundary:** Static reachability does not prove runtime behavior; the package journey supplies that proof.

### `test/cli-e2e/store-lifecycle.test.ts`

- **Contract:** Extend the existing cross-machine store journey to build and pack the package, install it into a clean temporary consumer, import only the root export, and resolve active, archived, missing, and ambiguous immutable IDs. Assert the exported version, serializability, complete snapshot fields, null failure shape, stable diagnostic codes, affected ID, remediation, and deterministic ordering. For the same unchanged fixtures, compare the installed package result with parsed `specbase status --json` output and require exact equality of lifecycle, logical position, artifact/task progress, and ordered diagnostics.
- **Fixtures and harness:** Existing Vitest CLI-E2E store lifecycle fixtures, `pnpm run build`, a locally packed tarball, isolated machine homes and temporary stores, and cross-platform paths constructed with Node `path` utilities.
- **Failure signal:** Build/install/import failure, any contract or diagnostic mismatch, or any package/status parity difference fails the E2E journey with the fixture case.
- **Known boundary:** Existing status-only wrapper metadata remains outside the equality set; this source does not assess aggregate boards, mutation, actions, or renderer behavior.

## Risks / Trade-offs

- [The package API accidentally exposes unstable internal status fields] -> Define a narrow snapshot DTO and map internal structures into it.
- [Status and package output drift] -> Make both adapters consume one normalized resolver result rather than comparing two implementations after the fact.
- [ID lookup cost grows with the store] -> Keep the first contract correct and deterministic; an index can be introduced later without changing the API.
- [Legacy directories lack immutable metadata] -> Preserve only existing fallback behavior and report ambiguity explicitly.

## Migration Plan

1. Introduce the versioned snapshot types and headless resolver behind the package entrypoint.
2. Adapt `status --json` lifecycle facts to the resolver while preserving its existing outer status fields.
3. Verify clean-package imports and representative active, archived, missing, and ambiguous fixtures.
4. Leave aggregate board and action consumers for their later stack members.

Rollback removes the new export and restores the prior status adapter; no planning-store migration or persisted data change is required.

## Open Questions

- Whether a later major contract should extend this resolver to open ideas or keep ideas as an aggregate-board-only card type. This change resolves change lifecycle snapshots and does not pre-commit that extension.
