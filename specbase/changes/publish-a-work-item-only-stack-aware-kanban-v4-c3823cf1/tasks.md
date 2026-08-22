## 1. Deliver Kanban v4 evidence

- [ ] 1.1 Implement the v4 model/stack source in `test/core/view/model.test.ts` through Vitest, execute it, and record the result.
- [ ] 1.2 Implement v4 shape validation in `test/commands/view.test.ts` through Vitest, execute it, and record the result.
- [ ] 1.3 Implement installed-package/CLI parity in `test/cli-e2e/store-lifecycle.test.ts` through Vitest, execute it, and record the result.

## 2. Publish the work-only board

- [ ] 2.1 Add current v4 board types with lightweight stack annotations and explicit legacy-version handling.
- [ ] 2.2 Derive stack context once per snapshot and preserve readable cards when stack diagnostics occur.
- [ ] 2.3 Remove accepted-specification cards/counts from current derivation, validation, CLI JSON, and standalone presentation.
- [ ] 2.4 Update public exports and packed-consumer compatibility.

## 3. Verify

- [ ] 3.1 Run focused model, view, CLI journey, TypeScript, build, and strict change validation.
- [ ] 3.2 Record structural linkage, native-harness execution, semantic correspondence, and known compatibility boundaries.
