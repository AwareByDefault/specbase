## ADDED Requirements

### Requirement: OpenSpec SHALL expose invariant examples as structured data
The system SHALL provide the compliant and violating examples of an invariant as structured output via `openspec spec show <invariant> --examples --json`. Each example SHALL include its disposition, declared path, language, and code. OpenSpec SHALL NOT execute any linter, type checker, or test runner as part of this capability.

#### Scenario: Examples returned as JSON
- **WHEN** a user runs `openspec spec show persistence-port --examples --json`
- **THEN** the output includes each example with `disposition` (`compliant` or `violating`), `path`, `lang`, and `code`

#### Scenario: OpenSpec runs no external tools
- **WHEN** examples are requested
- **THEN** OpenSpec only reads and projects spec data and invokes no linter, compiler, or test runner

### Requirement: The fidelity harness SHALL be project-owned and data-driven
Fidelity verification SHALL be performed by a harness owned by the consuming project, which loads examples from the structured output and runs the project's own tooling. The harness SHALL read examples at runtime rather than embedding copies, so the spec remains the single source of truth.

#### Scenario: Editing examples changes what is verified
- **WHEN** an author edits an invariant's violating example in the spec
- **THEN** the project harness, on its next run, verifies against the edited example with no separate test edit required

#### Scenario: No duplicated example copies
- **WHEN** the fidelity harness runs
- **THEN** it sources examples solely from the spec output and maintains no independent copy of the example code

### Requirement: The faithful coverage rung SHALL be optional and additive
Coverage SHALL report a `faithful` rung for an invariant only when a fidelity harness reports a passing result for it. When no harness is present, coverage SHALL behave exactly as in the base design (`attached`/`runs`) with no regression.

#### Scenario: Faithful rung shown when harness passes
- **WHEN** a fidelity harness reports that an invariant's enforcement discriminates its examples
- **THEN** coverage reports that invariant at the `faithful` rung

#### Scenario: No harness, unchanged coverage
- **WHEN** no fidelity harness is configured
- **THEN** coverage output is identical to the base design and never reports a `faithful` rung
