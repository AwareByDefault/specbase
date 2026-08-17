## Why

<!-- Explain the motivation for this change. What problem does this solve? Why now? -->

## What Changes

<!-- Describe what will change. Be specific about new capabilities, modifications, or removals. Mark breaking changes with **BREAKING**. -->

## Planes

<!-- Classify every governed spec this change touches into a truth plane. A single
     initiative may touch BOTH planes - list each separately. -->

### Behavioral truth
<!-- User- or client-visible capabilities that must remain true now.
     Live at specs/behavior/<locator>/. -->
- `behavior.<locator>`: <what durable behavior this covers> (new | modified)

### Architectural truth
<!-- Package responsibilities, dependency invariants, cross-cutting structural
     policies that must remain true now. Live at specs/architecture/<locator>/. -->
- `architecture.<locator>`: <what durable structural truth this covers> (new | modified)

## Enforcement intent

<!-- For every durable truth, name the planned project-defined type and source,
     the requirement-level truth it covers, and the outcome the source must
     establish. This is the planning commitment; enforcement.yaml later keeps
     only the durable link. -->

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| `<requirement-id>` | `<resolved-type-id>` | `<project-relative-file-or-lens>` | `<observable outcome the source establishes>` |

## Impact

<!-- Affected code, APIs, dependencies, systems -->
