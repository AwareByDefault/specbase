## 1. Authoring fork

- [ ] 1.1 Add fork heuristic + guidance to explore/propose skills (triggers + minimum-sufficient-invariant)
- [ ] 1.2 Support a change emitting a feature delta + one or more invariant specs (change-creation)
- [ ] 1.3 `validate` warns on architecture signal with no invariant declared

## 2. Provenance

- [ ] 2.1 Add `bornFrom` / `reliesOn` frontmatter edges to the spec model
- [ ] 2.2 Extend artifact-graph with cross-spec edge type + cycle/resolution validation
- [ ] 2.3 Surface edges in `openspec show` and `openspec doctor`

## 3. Lifecycle

- [ ] 3.1 Two-exit-door archive: merge feature deltas; promote invariants to standing specs; register injection
- [ ] 3.2 Stable archived-change reference for `bornFrom`

## 4. Tests

- [ ] 4.1 Fork on database/dependency; no fork on pure behavior
- [ ] 4.2 Missing-invariant warning
- [ ] 4.3 Provenance resolution + cycle validation
- [ ] 4.4 Archive promotes invariant and leaves config.yaml untouched

## 5. Release

- [ ] 5.1 Add changeset
