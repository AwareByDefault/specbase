---
id: ops.packages
---

<!--
  Ops truth: what the project uses and how it runs - the mandated package set,
  developer environment, infrastructure (IaC), and deployment. Lives at
  specs/ops/<locator>/spec.md and is paired with an enforcement.md in the same
  directory. State only what must remain true now; the rationale for adopting
  (or replacing) a tool belongs in design/proposal and the dated archive.

  The constructive artifacts (package.json, docker-compose.yml, terraform)
  are enforcement targets - the spec mandates the selection/shape, and
  enforcement audits the artifact against it.
-->

## ADDED Requirements

### Requirement: Mandated runtime stack
**ID:** mandated-stack
The project SHALL run on Node 20+, pnpm, and ESM. Runtime dependencies SHALL be
drawn from the approved list; adding one is a change to this spec.

#### Scenario: Unapproved dependency
**ID:** unapproved-dependency
- **WHEN** package.json lists a runtime dependency not in the approved set
- **THEN** enforcement reports it before merge