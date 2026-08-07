---
id: code-quality.domain-purity
---

### Requirement: Domain stays free of presentation and I/O
**ID:** no-console-in-domain
The pure domain layer under `src/domain/**` SHALL NOT perform presentation or
ambient I/O directly; in particular it MUST NOT call `console.*`. Output belongs
to the CLI adapter, not the domain. This is a code-quality smell distinct from
the import-boundary rule, which catches imported I/O modules but not calls to the
`console` global.

#### Scenario: A console call appears in the domain
**ID:** console-in-domain
- **WHEN** a module under `src/domain/` calls `console.log`, `console.error`, or
  any other `console.*` method
- **THEN** code-quality enforcement reports the smell before merge
