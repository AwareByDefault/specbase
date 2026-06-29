## ADDED Requirements

### Requirement: Invariant guardrails SHALL be injected into agent context at load time
The system SHALL compose invariant-derived guardrails into the agent's working context at load time, reusing the existing rules-injection rail. Each injected guardrail SHALL carry the invariant's normative statement so the agent can comply proactively.

#### Scenario: Invariant appears in working context
- **WHEN** the project contains an invariant "all erring code returns the Result class" and the agent loads working context
- **THEN** that constraint appears in the injected guardrails

### Requirement: Injection SHALL NOT mutate hand-authored config
Composing invariant guardrails SHALL be performed at load time. The system SHALL NOT write generated content into the hand-authored `config.yaml`. The invariant specs SHALL remain the single source of truth.

#### Scenario: config.yaml left untouched
- **WHEN** invariants are composed into working context
- **THEN** the on-disk `config.yaml` is byte-for-byte unchanged

#### Scenario: Hand-written and generated context coexist
- **WHEN** `config.yaml` has hand-written `context` and the project has invariants
- **THEN** the working context contains both, with no duplication of an invariant already stated by hand
