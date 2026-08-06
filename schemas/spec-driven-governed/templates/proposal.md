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

## Spec pairs

<!-- Each governed spec is paired with an enforcement.md. For each plane target
     above, name the stable project-wide spec id and the mechanism you expect to
     protect it (test, lint, static-analysis, command, review, manual). -->
- `<spec-id>` -> paired enforcement via <mechanism>

## Impact

<!-- Affected code, APIs, dependencies, systems -->
