## Outcome

An installed Node consumer can resolve a work item by immutable identity and receive the same authoritative lifecycle, progress, position, and diagnostics used by Specbase status.

## Demonstration

A clean-package consumer imports the supported lifecycle API and matches `specbase status --json` for representative fixtures.

## Explicit deferrals

Aggregate board snapshots, rendering, actions, activity, and Pi integration remain deferred.

## Technical evidence

- Environment: macOS (darwin), Node `v26.0.0`, pnpm `9.15.9`.
- `pnpm exec vitest run test/commands/work-item-lifecycle.test.ts test/core/view/architecture.test.ts` — passed (17 tests); lifecycle resolver contract and headless import-boundary analysis passed.
- `pnpm run build` — passed; generated root declarations export `getLifecycleSnapshot` and `LIFECYCLE_SNAPSHOT_VERSION`, while `bin/specbase.js` still imports the explicit CLI entrypoint.
- `pnpm exec vitest run test/cli-e2e/store-lifecycle.test.ts` — passed (9 tests); packed/installable consumer resolved active, archived, missing, and ambiguous fixtures and matched `status --json` lifecycle snapshots.
- `pnpm run lint` — passed with one pre-existing warning in `src/core/references.ts` for an unused eslint-disable directive; no lifecycle-snapshot lint errors.
- `pnpm test` — failed: 6 files / 138 assertions fail in existing template-guidance and template-parity tests (`coverage-guidance.test.ts`, `review-panel.test.ts`, and `skill-templates-parity.test.ts`); they concern checked-in skill/template drift outside this lifecycle change. The focused lifecycle and package tests passed.
- `node bin/specbase.js validate expose-stable-specbase-lifecycle-snapshots-e1911fd5 --type change --strict --no-interactive` — passed.
- Independent functionality review found unrelated malformed metadata could abort a healthy lookup, archived status parity was not exercised, and the headless root is a breaking API change. The malformed-sibling isolation and archived parity cases were added; `.changeset/headless-root-lifecycle-api.md` records the major migration to `@awarebydefault/specbase/cli`.

## Human-operator UX spike — 2026-08-21

**Journey:** Built the package, imported the root API directly, resolved this active change and the archived Kanban V1 change, confirmed the root no longer exposes Commander, then ran the equivalent `status --json` command and compared its embedded lifecycle snapshot.

- **Simplicity:** One root import and one `getLifecycleSnapshot({ root, id })` call made the primary journey short and unsurprising.
- **User-centered design:** Immutable IDs work across active and archived positions, so the operator does not need to know dated archive directory names.
- **Visibility and feedback:** The versioned `{ snapshot, diagnostics }` envelope is explicit and inspectable. Normal success is clear; unresolved/ambiguous remediation is structured for downstream UI.
- **Consistency:** The package result and `status --json.lifecycleSnapshot` matched exactly for the exercised active journey; focused tests cover archived parity.
- **Clarity:** `position`, `lifecycle`, artifact progress, and task progress are named plainly. The distinction between package diagnostics and CLI error presentation remains understandable but is not yet polished for end users.
- **Accessibility/keyboard:** Not applicable to the headless call. The equivalent CLI journey remains keyboard-only and machine-readable.
- **Usability and efficiency:** The synchronous API is fast and convenient for local stores. It currently scans active and archived directories for each lookup, which may become noticeable in very large stores.
- **Delight:** Importing the package no longer constructs Commander, and the same ID survives archive movement; both reduce incidental operator knowledge.
- **Observed defects fixed:** Unrelated malformed metadata no longer blocks a healthy immutable-ID lookup; explicit malformed directory fallback still surfaces its own error.
- **Optional unfixed improvements:** Consider an indexed/async resolver for very large stores and a dedicated CLI projection of structured lifecycle diagnostics instead of concatenated error prose. These are follow-ups, not blockers for the spike.
