# Add: list supported units

## Why
Users need a way to discover which temperature units the CLI accepts without
reading the source or guessing.

## What Changes
- Add a `--units` flag that prints the supported units and exits successfully.

## Planes
- **Behavioral truth** (`specs/behavior/temp-conversion/`): a new user-visible
  capability of the CLI. No architectural invariants change.

## Spec pairs
- `behavior.temp-conversion` (existing governed pair, modified) — adds one
  requirement plus its paired enforcement binding.

## Impact
- `src/adapters/cli.ts`, `test/convert.test.ts`.
