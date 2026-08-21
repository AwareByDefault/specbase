## Draft-result API follow-up — 2026-08-21

- Added `recordDirectActionResult()` as the canonical no-remote mutation boundary for an exact `open-draft-pr` intent and typed confirmed GitHub draft descriptor.
- Extended change metadata and lifecycle/board snapshots with the confirmed draft identity; Reviewing remains derived from `lastReviewedAt` plus completed tasks.
- `pnpm run build` passed and `pnpm exec vitest run test/commands/work-item-lifecycle.test.ts` passed 20 tests, including valid recording and malformed-result rejection.

## Outcome

A consumer can request the valid direct actions for an immutable work item and validate one exact action intent using stable availability, blocker, remediation, and dispatch-context values.

## Demonstration

Lifecycle fixtures deterministically change action availability, and invalid targets or actions return stable machine diagnostics.

## Explicit deferrals

Specbase does not execute Pi skills or RPIV workflows, persist a delivery queue, own approval leases, or expose arbitrary Git and shell actions.

## Implementation evidence — 2026-08-21

- `pnpm run build` passed. The root package exports the versioned direct-action
  catalogue and exact-intent validator; the packed consumer imports those root
  exports without the CLI or renderer.
- `pnpm exec vitest run test/commands/work-item-lifecycle.test.ts` passed
  (15 tests). It verifies the closed seven-action ordering, canonical skill
  routes and typed arguments, stable target diagnostics, blocked remediation,
  exact intent acceptance, and rejection of executable fields and unknown IDs.
- `pnpm exec vitest run test/cli-e2e/store-lifecycle.test.ts` passed
  (11 tests). A clean temporary consumer installs the packed tarball, imports
  the root API, lists the idea actions, validates the canonical intent, rejects
  a tampered workflow field, and proves the store snapshot did not change.
- `pnpm run lint` completed with no errors and one existing warning in
  `src/core/references.ts` for an unused eslint-disable directive.
- `node bin/specbase.js validate expose-a-direct-specbase-action-catalog-79422a3e --type change --strict --no-interactive` passed.

### Functionality review and follow-up

The targeted evidence is green. The full `pnpm test` run remains red on this branch in pre-existing template parity/guidance assertions and a concurrent CLI-build race (`dist/cli/index.js` missing); these failures do not involve the direct-action files.

Independent review found enforcement actions were available to legacy or feature-incomplete changes, completed implementation still advertised Apply, mixed-time reads could produce incoherent policy, executable-field rejection lost target identity, and the policy matrix was too small. The implementation now gates enforcement on a governed completed feature phase, blocks completed Apply, retries once behind a planning-tree revision guard, preserves diagnostic identity, and covers idea/active/archive, governed/legacy, stack predecessor, strict-validation, stale state, ambiguous/missing target, unsupported version, and store/work-item/action/kind tampering across focused and packed tests.

## Human-operator UX spike — 2026-08-21

**Journey:** Built the package, copied the proposed change into a disposable governed store, listed its canonical actions, inspected blocked enforcement remediation, selected and validated the available Apply intent, checked the remaining tasks in the store, refreshed the catalog, and validated the now-stale Apply intent again.

- **Simplicity:** One catalog call plus one exact-intent validation call forms a clear two-step display/execute boundary.
- **User-centered design:** Known actions remain visible when blocked and explain the concrete next step, so an operator is not left guessing why a transition is absent.
- **Visibility:** `available`, `blocked`, blocker code, message, remediation, canonical skill/capability, and arguments are explicit. Nine actions at once may be noisy for a compact board menu.
- **Consistency:** Conversational routes use exact installed Specbase skill identities; autonomous routes use the closed `specbase.local-delivery` and `specbase.draft-pr-delivery` capability identities with the same immutable change ID. The stale validator returned the same `direct_action_apply_complete` reason as the refreshed catalog.
- **Feedback:** Fresh-state rejection is immediate and preserves target/action identity, making it suitable for a board toast and refresh.
- **Clarity:** The read-only boundary is strong: intents carry no command text and accepted results return the current canonical descriptor. `storeId: null` means nearest-root mode but may need friendlier presentation in adapters.
- **Accessibility/keyboard:** The API is headless; keyboard and assistive behavior belong to the consuming UI. Stable labels, codes, and remediation provide accessible text inputs.
- **Usability:** Blocking completed Apply prevents a dead-end action. Blocked enforcement entries correctly direct the user toward implementation instead of reopening a finished phase.
- **Efficiency:** The planning revision guard protects coherence but fingerprints the whole planning tree and may be expensive when a board requests actions card-by-card.
- **Delight:** The stale action fails safely with a useful next action rather than executing the wrong workflow, while an implementation-complete change exposes a validated draft-PR capability without Specbase knowing its RPIV workflow name.
- **Observed defects fixed:** Phase leakage, completed Apply, lost diagnostic identity, and mixed-read acceptance were corrected before this journal.
- **Optional unfixed improvements:** Add a batched catalog operation sharing one store revision across many cards, let clients request available-only versus all-known actions, and give nearest-root mode an explicit display identity. These remain spike follow-ups.
