## 1. Schema & parsing

- [ ] 1.1 Add optional `id` to `RequirementSchema` (`base.schema.ts`)
- [ ] 1.2 Extend `SpecSchema.metadata` with `type` (default `feature`) and `labels` (default `[]`)
- [ ] 1.3 Parse YAML frontmatter in `markdown-parser.ts`; tolerate its absence
- [ ] 1.4 Implement chosen id location (see design.md — inline marker) and round-trip preservation in `requirement-blocks.ts`
- [ ] 1.5 Derive + persist ids for requirements that lack them; preserve ids across `RENAMED` operations

## 2. Validation

- [ ] 2.1 Validate `type` against the `{feature, invariant}` root taxonomy incl. dotted sub-labels
- [ ] 2.2 Validate requirement id uniqueness within a spec, naming both offenders
- [ ] 2.3 Surface `id`, `type`, `labels` in `openspec show --json`

## 3. Tests

- [ ] 3.1 Frontmatter present/absent parsing
- [ ] 3.2 Id survives a `RENAMED` operation
- [ ] 3.3 Duplicate-id and unknown-type validation failures
- [ ] 3.4 Cross-platform: any path assertions use `path.join()`

## 4. Release

- [ ] 4.1 Add changeset
