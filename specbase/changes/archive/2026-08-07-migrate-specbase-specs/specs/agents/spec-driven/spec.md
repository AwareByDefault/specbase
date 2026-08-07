## MODIFIED Requirements

### Requirement: Repository practices spec-driven development via opsx
**ID:** practices-sdd
This repository SHALL practice spec-driven development using the opsx workflow,
and `specbase/config.yaml` SHALL declare the governed schema and the resolved
plane roster the repository works to. The config is the runtime source of truth;
this spec describes it and asserts conformance.

#### Scenario: Governed schema is declared
**ID:** governed-schema-declared
- **WHEN** enforcement inspects `specbase/config.yaml`
- **THEN** it finds `schema: spec-driven-governed` and a resolved plane roster

#### Scenario: The project validates
**ID:** project-validates
- **WHEN** `openspec validate` runs against this repository
- **THEN** it exits successfully, confirming the governed workflow is well-formed
