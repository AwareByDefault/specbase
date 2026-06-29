## 1. Schema

- [ ] 1.1 Add `enforcement.schema.ts` — tagged union over `kind ∈ {test, lint, type, ci, manual}` with kind-specific fields
- [ ] 1.2 Add `enforces: string[]` (requirement ids) with many-to-many semantics
- [ ] 1.3 Reference enforcement from the spec metadata schema (`enforcement:` frontmatter key)

## 2. Parsing & validation

- [ ] 2.1 Parse the `enforcement:` frontmatter block
- [ ] 2.2 Validate every `enforces` id resolves to a requirement in the same spec
- [ ] 2.3 Validate kind-specific required fields (test locator; lint rule id; manual owner+rationale)
- [ ] 2.4 Emit over-enforcement warning past the configured threshold

## 3. Tests

- [ ] 3.1 Many-to-many: one record enforcing several requirements
- [ ] 3.2 Unresolved id → validation error
- [ ] 3.3 Manual record excluded from verified coverage classification
- [ ] 3.4 Over-enforcement warning fires past threshold

## 4. Release

- [ ] 4.1 Add changeset
