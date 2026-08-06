---
id: <plane>.<locator-slug>
---

<!--
  Governed spec delta. The plane (behavior | architecture) comes from the
  containing directory, never from metadata:
    specs/behavior/<locator>/spec.md      -> behavioral truth
    specs/architecture/<locator>/spec.md  -> architectural truth

  Frontmatter `id` is the project-unique stable spec ID (dot-separated kebab,
  e.g. behavior.session-loop, architecture.domain). It stays unchanged when the
  title or locator moves.

  Every requirement and scenario declares a pair-local `**ID:**` slug (kebab,
  unique only within this pair) on the line directly below its heading. IDs are
  immutable; titles are mutable presentation.

  See behavioral-spec.md and architectural-spec.md for filled per-plane examples.
-->

## ADDED Requirements

### Requirement: <!-- requirement name -->
**ID:** `<!-- requirement-slug -->`
<!-- requirement text; use SHALL/MUST for normative claims -->

#### Scenario: <!-- scenario name -->
**ID:** `<!-- scenario-slug -->`
- **WHEN** <!-- condition -->
- **THEN** <!-- expected outcome -->
