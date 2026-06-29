## ADDED Requirements

### Requirement: Implementation SHALL proceed test-first from scenarios
For each requirement being implemented, the implementer SHALL drive each scenario as a failing test before writing production code, then make it pass, then refactor. Each enforcement SHALL be registered as an enforcement record bound to the requirement id.

#### Scenario: Scenario driven red then green
- **WHEN** implementing a requirement with a scenario "rejects empty input"
- **THEN** the implementer first writes a failing test asserting that behavior, then implements code to pass it, then records the enforcement

### Requirement: Scenarios SHALL bound the test set
The implementer SHALL NOT create tests for behavior not described by a scenario. When implementation reveals a behavior worth enforcing, the implementer SHALL add a scenario to the spec before adding the test.

#### Scenario: New behavior requires a new scenario first
- **WHEN** the implementer finds an untested edge case worth covering
- **THEN** it adds a scenario to the spec, then writes the test for it — rather than adding an unspecified test

#### Scenario: No speculative tests
- **WHEN** a requirement's scenarios are all covered
- **THEN** the implementer does not add further tests for that requirement absent a new scenario

### Requirement: Implementation SHALL prefer reuse over new tests
Before authoring a new test, the implementer SHALL apply minimum-sufficient-enforcement: prefer a type or lint rule, or extending an existing test, over a new dedicated test. Linking an existing enforcement SHALL satisfy a scenario without new code.

#### Scenario: Existing test already covers the scenario
- **WHEN** an existing test already exercises the scenario's behavior
- **THEN** the implementer links that test as the enforcement instead of writing a new one

#### Scenario: Invariant-style rule preferred over per-case test
- **WHEN** a scenario expresses a structural rule better caught by lint
- **THEN** the implementer enforces it via a lint rule rather than a per-case test

### Requirement: Consolidation SHALL be coverage-aware
After tests pass, the implementer MAY consolidate redundant tests. A test SHALL be considered redundant only when its removal leaves every requirement it enforced still covered by another enforcement. A sole-enforcer test SHALL never be culled. Any cull that would drop a requirement below coverage SHALL be blocked.

#### Scenario: Redundant test consolidated
- **WHEN** two tests both fully enforce the same requirement and no other requirement depends on one of them
- **THEN** the implementer may remove the redundant test, leaving the requirement still covered

#### Scenario: Sole enforcer protected
- **WHEN** a test is the only enforcement of its requirement
- **THEN** the implementer does not remove it, and a cull attempt is blocked with the requirement it would uncover
