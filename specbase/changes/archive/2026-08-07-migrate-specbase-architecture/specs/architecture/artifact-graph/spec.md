---
id: architecture.artifact-graph
---

## ADDED Requirements

### Requirement: Artifact dependency graphs are acyclic
**ID:** acyclic-graph
A schema's artifact dependencies SHALL form a directed acyclic graph. Loading
a schema whose dependencies contain a cycle SHALL fail with an error naming
the artifact ids on the cycle. A cyclic schema SHALL NOT produce a usable
graph.

#### Scenario: Artifact requiring itself
**ID:** self-cycle-rejected
- **WHEN** an artifact lists its own id among its dependencies
- **THEN** loading fails and names the artifact

#### Scenario: Cycle between artifacts
**ID:** cycle-rejected
- **WHEN** two or more artifacts depend on each other in a closed chain
- **THEN** loading fails
- **AND** the error names every artifact id on the cycle, in cycle order

### Requirement: Every dependency reference resolves
**ID:** resolvable-requires
Every dependency an artifact declares SHALL name an artifact the same schema
defines. Loading a schema with a dangling dependency reference SHALL fail with
an error identifying the unresolved reference.

#### Scenario: Dependency on an undefined artifact
**ID:** dangling-requires-rejected
- **WHEN** an artifact declares a dependency on an id the schema does not define
- **THEN** loading fails and identifies the unresolved reference

### Requirement: Artifact ids are unique within a schema
**ID:** unique-artifact-ids
An artifact id SHALL identify exactly one artifact within its schema. Loading
a schema that defines the same artifact id more than once SHALL fail with an
error identifying the duplicate.

#### Scenario: Two artifacts share an id
**ID:** duplicate-id-rejected
- **WHEN** a schema defines two artifacts with the same id
- **THEN** loading fails and identifies the duplicated id

### Requirement: Structural validation happens at one parse boundary
**ID:** validated-at-parse-boundary
Schema content SHALL be validated for structure when it is parsed, at a single
parse entry point that every consumer uses. No consumer SHALL construct an
artifact graph from unparsed or unvalidated schema content, so an invalid
schema cannot reach the workflow, instruction, or validation surfaces.

#### Scenario: Every load path validates
**ID:** every-load-path-validates
- **WHEN** a schema is loaded from a file, from schema resolution, or from raw
  content
- **THEN** the same parse entry point validates it before a graph exists

#### Scenario: Dependency-graph checks are not repeated per caller
**ID:** no-duplicate-validators
- **WHEN** a caller needs to know a schema's dependency graph is sound
- **THEN** it relies on the parse boundary's result
- **AND** it does not re-implement cycle, reference, or uniqueness checks
