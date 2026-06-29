# Design — Enforcement model

## Storage: frontmatter vs paired file
Two candidate homes for enforcement records, evaluated against the project's own `RENAMED Requirements` operation:

| | Frontmatter `enforcement:` (chosen) | Paired `enforcement.yml` |
|---|---|---|
| Binding anchor | requirement id | requirement id |
| Locality | lives with the spec | separate file |
| Rename safety | id-based, safe either way | id-based, safe either way |
| Authoring/AI cost | one file to edit | two files to keep in sync |
| Coverage computation | parse spec once | cross-reference two files |

Because ids (from `add-spec-metadata-frontmatter`) already neutralize the rename risk, the deciding factor is **single source of truth**: keep enforcement in the spec frontmatter so authors and agents edit one file. The paired-file option remains viable if enforcement maps grow large enough to dominate the spec; revisit then.

## The tagged union
```yaml
enforcement:
  - kind: test    # locator: file + name|pattern; runnable + resolvable
    enforces: [persistence-port]
  - kind: lint    # rule id; resolvable
  - kind: type    # symbol/contract; resolvable
  - kind: ci      # workflow + job
  - kind: manual  # owner + rationale; attestable only
```

## Resolution depth (declared → resolvable → run)
Depth is a property the *coverage command* acts on, defined here so the schema can express it:
- **declared** — the record exists. Cheapest; what v1 validation guarantees.
- **resolvable** — the referenced artifact can be located (test name exists, lint rule is registered). Catches stale mappings without executing anything.
- **run** — runnable kinds (`test`, `lint`, `ci`) may be executed to read pass/fail. Scoped to the coverage change, not here.

## Anti-bloat stance (structural + soft)
- **Structural:** many-to-many `enforces`; over-enforcement warning; the reverse map (orphan tests) lands in the coverage change.
- **Soft:** the implementer skill teaches "minimum sufficient enforcement" — prefer type → lint → extend-existing-test → one shared test → dedicated test → manual, in that order.

## Open questions
- Test locator shape: `{file, testName}` vs `{file, pattern}` vs framework-native id. Lean: accept either a `name` or a `pattern`, resolved by the runner adapter in the coverage change.
- Threshold for the over-enforcement warning: fixed default (e.g. 3) vs configurable in `config.yaml`. Lean: configurable, default 3.
