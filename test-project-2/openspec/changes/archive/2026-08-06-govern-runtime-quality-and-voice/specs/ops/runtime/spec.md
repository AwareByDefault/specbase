---
id: ops.runtime
---

## ADDED Requirements

### Requirement: Mandated runtime stack with no runtime dependencies
**ID:** mandated-stack
The project SHALL run on Bun with TypeScript in `strict` mode, and SHALL carry
**no runtime dependencies** — habit state is local JSON with no network or
database. Adding a runtime dependency, or relaxing TypeScript strictness, is a
change to this spec.

#### Scenario: A runtime dependency is introduced
**ID:** runtime-dependency-added
- **WHEN** `package.json` declares any entry under `dependencies`
- **THEN** ops enforcement reports it before merge

#### Scenario: TypeScript strictness is relaxed
**ID:** strict-disabled
- **WHEN** `tsconfig.json` sets `compilerOptions.strict` to anything but `true`
- **THEN** ops enforcement reports it before merge
