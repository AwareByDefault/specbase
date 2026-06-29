## Why

With enforcement records in place, we can compute **coverage of intent**: how much of what our specs require is actually enforced. Unlike line coverage, the unit covered is the *requirement*, so coverage maps directly to product/architectural intent.

Crucially, coverage must be **bidirectional**. The forward direction finds *gaps* (requirements with no enforcement). The reverse direction finds *bloat* (tests that enforce no stated requirement — orphan tests). The reverse map is the single most valuable anti-bloat feature: "too many tests" is literally the set of tests with no intent behind them, and this command makes that set visible.

Depends on `add-requirement-enforcement`.

## What Changes

- Add `openspec coverage` — reports, per spec and in aggregate:
  - **Forward:** % of requirements with ≥1 enforcement; lists uncovered requirements (gaps).
  - **Reverse:** tests/enforcers discovered in the codebase that bind to no requirement (orphan tests).
  - **Efficiency:** an enforcements-per-requirement ratio per spec (a bloat indicator).
  - **Verified vs attested:** verified coverage (machine-checkable kinds) reported separately from manual attestations.
- Support depth flags: `--declared` (default; mapping exists), `--resolve` (referenced test/rule must be locatable), `--run` (execute runnable enforcements and read pass/fail).
- `--json` output for CI gating; a non-zero exit when coverage is below a configurable threshold.
- The reverse map requires a way to enumerate the codebase's tests; v1 ships a pluggable discovery adapter (start with the project's own test runner) and documents the contract.

## Capabilities

### New Capabilities

- `cli-coverage`: The `openspec coverage` command computing forward (gaps), reverse (orphan tests), and efficiency metrics over enforcement records, with declared/resolve/run depths and JSON/threshold gating.

## Impact

- `src/commands/` — new `coverage` command wired into the CLI.
- `src/core/` — coverage computation over the enforcement model; a discovery adapter interface for enumerating codebase enforcers (reverse map).
- `src/core/validation/` — reuse resolution logic from the enforcement change for `--resolve`.
- Open design decision (see design.md): how `--run` shells out to test/lint runners without coupling OpenSpec to a single toolchain.
