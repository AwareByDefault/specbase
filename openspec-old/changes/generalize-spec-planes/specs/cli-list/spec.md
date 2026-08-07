## MODIFIED Requirements

### Requirement: Command Execution
The list command SHALL scan for changes and specs and, under the governed model, recursively discover pairs beneath every declared plane root.

#### Scenario: Scanning for specs
- **WHEN** user executes `openspec list --specs`
- **AND** the project uses the governed model
- **THEN** the system recursively discovers governed pairs under each declared plane root
- **AND** each discovered pair is shown with its plane-qualified locator using the declared plane id as the first segment

#### Scenario: Scanning for specs with a non-default plane
- **WHEN** a governed project declares a `security` plane and a pair exists under `specs/security/secret-handling/`
- **THEN** `openspec list --specs` includes the pair with locator `security/secret-handling`