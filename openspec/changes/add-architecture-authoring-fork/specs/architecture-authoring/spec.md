## ADDED Requirements

### Requirement: Authoring SHALL detect architecture-bearing work and fork it
When drafting a change via explore/propose, the agent SHALL recognize signals that the work establishes a durable constraint — a new external dependency, a new seam/boundary, a technology choice, or a cross-cutting concern — and SHALL draft it as a feature spec plus one or more invariant specs.

#### Scenario: Adding a database forks an invariant
- **WHEN** a proposal introduces a database for a feature
- **THEN** the agent drafts both a feature spec for the behavior and an invariant spec for how persistence fits the architecture

#### Scenario: Pure behavior does not fork
- **WHEN** a proposal adds a feature with no new dependency, boundary, or cross-cutting pattern
- **THEN** no invariant spec is created

### Requirement: Proposal validation SHALL warn on a missing invariant
When a change exhibits an architecture signal but declares no invariant spec, `propose`/`validate` SHALL emit a warning prompting the author to confirm the omission is intentional.

#### Scenario: Dependency added without invariant
- **WHEN** a change adds a new external dependency but contains no `type: invariant` spec
- **THEN** validation warns that an architectural invariant may be missing and asks for confirmation

### Requirement: Authoring SHALL resist invariant bloat
The agent SHALL apply minimum-sufficient-invariant judgment, declining to mint architectural law for one-off choices. Coverage SHALL flag any invariant with no lint binding and no injection as doing no work.

#### Scenario: One-off choice not promoted
- **WHEN** a decision affects only the current feature and constrains no future code
- **THEN** it remains a feature requirement and is not promoted to an invariant
