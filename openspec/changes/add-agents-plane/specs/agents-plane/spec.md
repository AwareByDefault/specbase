## ADDED Requirements

### Requirement: Agents plane membership

The `agents` plane SHALL govern a repository's own agentic *instruments* — the review panel, repo-specific skills, custom subagents, and hooks the repository builds — and SHALL NOT be used for behavioral guardrails on agents (those are enforced through the other planes' `enforcement.md`). Membership is limited to instruments the repository owns; imported or third-party skills, plugins, and agents are out of scope.

#### Scenario: Repo-owned instrument qualifies

- **WHEN** an author classifies a repository's own review panel, repo-specific skill, subagent, or hook
- **THEN** it belongs in the `agents` plane at `specs/agents/<locator>/`

#### Scenario: Agent behavior rule does not qualify

- **WHEN** an author considers a rule about how an agent should behave (e.g. tool or language preference, a safety guardrail on generated code)
- **THEN** it is classified under the plane whose subject it constrains (behavior, architecture, ops, or code-quality), NOT the `agents` plane

#### Scenario: Imported tooling does not qualify

- **WHEN** an author considers a third-party plugin, imported skill, or externally-owned agent
- **THEN** it is excluded from the `agents` plane, which admits only instruments the repository itself owns

### Requirement: Conformance-binding pattern

An `agents`-plane spec SHALL be paired with enforcement that binds the spec to the *operational artifact* it governs (for example `config.yaml`, `DEFAULT_LENSES`, a `SKILL.md`, or a hook configuration) through a conformance or drift check. The plane SHALL reuse existing enforcement mechanisms (`command`, `test`) and SHALL NOT introduce a new mechanism.

#### Scenario: Spec bound to its operational artifact

- **WHEN** an `agents`-plane spec declares durable truth about an instrument
- **THEN** its paired `enforcement.md` binds a normative claim to a check that the corresponding operational artifact conforms to the spec

#### Scenario: No new mechanism required

- **WHEN** enforcement is authored for an `agents`-plane spec
- **THEN** its bindings use only the existing mechanisms (`test | lint | static-analysis | command | review | manual`)

### Requirement: Describe direction of truth

An `agents`-plane spec that governs an artifact the runtime already reads (such as `config.yaml`) SHALL *describe* that artifact and assert conformance to it; it SHALL NOT be treated as the source that generates the artifact. The operational artifact remains the runtime source of truth.

#### Scenario: Config remains runtime source

- **WHEN** `specs/agents/spec-driven/` governs `openspec/config.yaml`
- **THEN** the spec describes the config and its enforcement asserts the config conforms, while the CLI continues to read `config.yaml` as the source of truth

### Requirement: Init-planted baseline specs

`openspec init` SHALL plant baseline `agents`-plane specs directly as bootstrap scaffolding when the plane is enabled: `specs/agents/spec-driven/` is always planted, and `specs/agents/review-panel/` is planted when the user opts into agentic review. These planted specs are the only `agents` specs created outside the change flow; subsequent edits SHALL go through the normal proposal→spec flow.

#### Scenario: Spec-driven baseline is planted on enable

- **WHEN** a user enables the `agents` plane at `openspec init`
- **THEN** `specs/agents/spec-driven/spec.md` and its paired enforcement are written, declaring that the repository practices spec-driven development via opsx

#### Scenario: Review-panel baseline is planted on opt-in

- **WHEN** a user answers yes to enabling agentic review at `openspec init`
- **THEN** `specs/agents/review-panel/spec.md` and its paired enforcement are written as a worked example governing the resolved review-panel lens set

#### Scenario: Later edits use the change flow

- **WHEN** a planted baseline `agents` spec is subsequently modified
- **THEN** the modification is authored through a change (proposal→spec), not by re-running init

### Requirement: Spec-driven self-hosting spec

The planted `specs/agents/spec-driven/` spec SHALL declare that the repository practices spec-driven development via opsx and that `config.yaml` declares the resolved plane roster, and its paired enforcement SHALL bind those claims to a check that `openspec validate` passes and that the resolved planes match the spec.

#### Scenario: Validate is the enforcement

- **WHEN** the `spec-driven` baseline spec is verified
- **THEN** a `command` binding asserts `openspec validate` passes and the resolved plane roster in `config.yaml` matches the roster the spec declares

### Requirement: Review-panel worked example

The planted `specs/agents/review-panel/` spec SHALL describe the review panel as the lens set that judges the governed planes, authored against the project's resolved lenses, and its paired enforcement SHALL bind it to a lens-conformance test asserting the resolved lens set matches the spec's declared lenses.

#### Scenario: Lens set is governed

- **WHEN** the `review-panel` baseline spec is verified
- **THEN** a `test` binding asserts the resolved review-panel lens set conforms to the lenses the spec declares
