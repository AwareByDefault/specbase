# Design: list supported units

## Context
The CLI adapter already knows the supported units via the domain's `UNITS`
constant. Exposing them is a thin presentation concern.

## Decisions
- Handle `--units` in the CLI adapter before argument parsing; read the unit
  list from the domain rather than hardcoding it, so the two never diverge.
- Enforcement mechanism: an automated `bun test` binding, consistent with the
  existing behavior pair.

## Risks / Trade-offs
- [Risk] `--units` collides with a value argument -> Mitigation: it is a flag,
  checked before positional parsing.
