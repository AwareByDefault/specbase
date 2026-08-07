## 0. Status

- [ ] 0.1 DEFERRED — do not start until the lighter "attached + runs in hook" bar proves insufficient

## 1. Expose examples

- [ ] 1.1 Add `--examples` JSON projection to `openspec spec show <invariant>` (disposition, path, lang, code)
- [ ] 1.2 Guarantee OpenSpec invokes no linter/compiler/test runner for this capability

## 2. Harness contract (documentation, not code)

- [ ] 2.1 Document the input shape (examples JSON) and the expected assertion (compliant clean / violating flagged by the project's own tool)
- [ ] 2.2 Document minimal-pair authoring as the soundness requirement

## 3. Optional faithful rung

- [ ] 3.1 Allow coverage to surface a `faithful` rung from harness results; default behavior unchanged when no harness

## 4. Tests

- [ ] 4.1 `--examples --json` shape
- [ ] 4.2 Coverage unchanged when no harness; `faithful` shown when harness reports pass

## 5. Release

- [ ] 5.1 Add changeset
