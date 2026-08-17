---
id: behavior.config.project
---

## Purpose
Project configuration gives each repository one resilient place to select its workflow model, truth planes, and enforcement vocabulary without requiring a Specbase code change.

## ADDED Requirements

### Requirement: The config declares the project's resolved enforcement types
**ID:** `declared-enforcement-type-set`
The system SHALL resolve the project's enforcement type set from `specModel.enforcement` against the schema's offered types. A `types` declaration SHALL replace the default set, a `types+` declaration SHALL append to it, and no declaration SHALL resolve the schema defaults. Each resolved type SHALL carry a unique kebab-case ID, a purpose, an evidence strength, and a source kind.

#### Scenario: Project types replace the defaults
**ID:** `enforcement-types-replace`
- **WHEN** project config declares `specModel.enforcement.types`
- **THEN** the resolved enforcement type set contains exactly those valid records
- **AND** a schema-offered type omitted from the replacement stays out

#### Scenario: Project types extend the defaults
**ID:** `enforcement-types-append`
- **WHEN** project config declares `specModel.enforcement.types+`
- **THEN** the resolved type set contains the schema defaults followed by the valid additions

#### Scenario: Invalid type declarations degrade safely
**ID:** `invalid-enforcement-types-degrade`
- **WHEN** a type record is malformed, duplicated, or declares an unsupported strength or source kind
- **THEN** the system reports the invalid declaration
- **AND** continues with the schema default type set
