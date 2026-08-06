---
id: behavior.temp-conversion
---

# Temperature Conversion CLI

<!-- Behavioral truth: observable capabilities of the temp-convert CLI. -->

## Requirements

### Requirement: Converts between temperature units
**ID:** `converts-between-units`
The CLI SHALL convert a numeric temperature value between Celsius, Fahrenheit,
and Kelvin and print the rounded result with its target unit.

#### Scenario: Celsius to Fahrenheit
**ID:** `celsius-to-fahrenheit`
- **WHEN** the user runs `temp-convert 100 C F`
- **THEN** the CLI prints `212 F`

#### Scenario: Celsius to Kelvin
**ID:** `celsius-to-kelvin`
- **WHEN** the user runs `temp-convert 0 C K`
- **THEN** the CLI prints `273.15 K`

### Requirement: Rejects invalid input
**ID:** `rejects-invalid-input`
The CLI MUST reject unsupported units and non-numeric values with a non-zero
exit code and MUST NOT print a converted result.

#### Scenario: Unsupported unit is rejected
**ID:** `invalid-unit-rejected`
- **WHEN** the user runs `temp-convert 100 C X`
- **THEN** the CLI exits non-zero
- **AND** reports that the unit must be one of C, F, K

#### Scenario: Non-numeric value is rejected
**ID:** `non-numeric-rejected`
- **WHEN** the user runs `temp-convert abc C F`
- **THEN** the CLI exits non-zero
- **AND** reports that the value is not a number

### Requirement: Lists supported units
**ID:** `lists-supported-units`
The CLI SHALL print the list of supported temperature units and exit
successfully when invoked with `--units`.

#### Scenario: Units are listed
**ID:** `units-listed`
- **WHEN** the user runs `temp-convert --units`
- **THEN** the CLI prints `C, F, K`
- **AND** exits zero
