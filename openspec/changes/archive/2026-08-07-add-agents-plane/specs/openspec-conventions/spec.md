## ADDED Requirements

### Requirement: Agents plane conventions

The governed conventions SHALL document the `agents` plane as an opt-in plane whose members are a repository's own agentic instruments, distinct from the product-describing planes (behavior, architecture, ops, code-quality). The conventions SHALL state that the `agents` plane is offered at `init` and appended per-project, not shipped in the resolved default plane set.

#### Scenario: Conventions describe the plane

- **WHEN** an author reads the governed conventions to classify a spec
- **THEN** the conventions describe the `agents` plane, its instruments-not-behavior membership, and its opt-in, per-project nature

### Requirement: Spec-versus-operational-artifact rule

The conventions SHALL state that an `agents`-plane spec is durable truth *about* an agent-operational artifact (`config.yaml`, `DEFAULT_LENSES`, a `SKILL.md`, a hook) and is paired with a conformance/drift binding to that artifact, and that the plane introduces no new enforcement mechanism.

#### Scenario: Author learns the conformance pattern

- **WHEN** an author authors an `agents`-plane spec and its enforcement
- **THEN** the conventions direct them to bind the spec to its operational artifact via an existing `command` or `test` mechanism asserting conformance

### Requirement: Describe-not-generate and init-scaffold exception

The conventions SHALL state that an `agents`-plane spec describes the artifact the runtime reads and asserts conformance rather than generating it, and that `init` may plant baseline `agents` specs directly as scaffolding — the one documented exception to the proposal→spec→archive flow — while all later edits go through the change flow.

#### Scenario: Author learns direction and exception

- **WHEN** an author reads the conventions for the `agents` plane
- **THEN** the conventions state the DESCRIBE direction of truth and the init-scaffold exception, and that subsequent edits use the normal change flow
