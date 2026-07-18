---
id: behavior.temp-conversion
---

## ADDED Requirements

### Requirement: Lists supported units
**ID:** `lists-supported-units`
The CLI SHALL print the list of supported temperature units and exit
successfully when invoked with `--units`.

#### Scenario: Units are listed
**ID:** `units-listed`
- **WHEN** the user runs `temp-convert --units`
- **THEN** the CLI prints `C, F, K`
- **AND** exits zero
