## Context

The preceding slices publish immutable lifecycle snapshots and a versioned aggregate board. An external client can therefore identify a card and show current state, but it must not derive executable affordances from lane names or construct command strings from labels. The final Specbase slice publishes the policy and validation boundary; the companion Pi integration owns rendering and dispatch.

Current Specbase workflow actions already have lifecycle prerequisites across ideas, feature proposal, enforcement proposal, implementation, review, and archive. The catalog makes those prerequisites and their remediation machine-readable without introducing a queue or executor.

## Goals / Non-Goals

**Goals:**
- Return available and blocked direct actions for one immutable target.
- Give action, blocker, remediation, and dispatch context stable typed identities.
- Revalidate one exact intent against fresh store state immediately before an external dispatch.
- Reject stale, malformed, unknown, ambiguous, or tampered intent predictably.
- Keep policy in Specbase and execution outside it.

**Non-Goals:**
- Execute a Pi skill, RPIV workflow, command, Git operation, or store mutation.
- Persist delivery items, attempts, leases, approvals, or results.
- Accept arbitrary shell text, plugin executors, user-defined workflows, or action chains.
- Add actions to the standalone read-only viewer in this slice.
- Project external workflow activity.

## Decisions

### D1. Publish a versioned catalogue result

Expose a root-package function shaped conceptually as `getDirectActions({ root, workItemId })`. It returns a catalogue version, a stable identity for the selected store and work item, deterministically ordered action descriptors, and ordered diagnostics.

Each descriptor contains:
- stable `actionId` and user-facing label;
- `availability` as `available` or `blocked`;
- either no blocker or one canonical blocker with code, message, and remediation;
- a typed dispatch context with `kind`, canonical target identity, and structured arguments;
- the catalogue version/revision needed to create an exact intent.

The contract contains no timestamps or transient UI state. Absolute filesystem paths and display labels are not dispatch authority.

### D2. Start with the closed Specbase lifecycle action vocabulary

The initial registry uses stable action IDs for the existing direct workflow stages:

| Action ID | Canonical skill identity | Structured arguments | Primary availability |
|---|---|---|---|
| `explore` | `specbase-explore` | `{ workItemId, storeId? }` | resolvable open idea or active change |
| `propose-feature` | `specbase-propose` | `{ workItemId, fromIdea: true, storeId? }` | open idea |
| `explore-enforcement` | `specbase-explore-enforce` | `{ changeId, storeId? }` | feature artifacts complete, enforcement pending |
| `propose-enforcement` | `specbase-propose-enforce` | `{ changeId, storeId? }` | feature artifacts complete and apply gate incomplete |
| `apply` | `specbase-apply-change` | `{ changeId, storeId? }` | apply requirements complete, or implementation remains in progress |
| `review` | `specbase-review-panel` | `{ changeId, storeId? }` | implementation tasks complete and deterministic gates ready |
| `archive` | `specbase-archive-change` | `{ changeId, storeId? }` | ordinary archive prerequisites and stack predecessor order satisfied |

Canonical routes use the exact installed skill identity plus typed argument fields, never shell syntax or a pre-rendered `/skill:` message. The dispatch context carries `kind: "skill"`, the canonical skill identity, immutable target fields, and optional resolved store identity; the external Pi adapter alone renders those fields into its host invocation format. A future governed catalogue version may add `kind: "workflow"` for a separately owned autonomous route without weakening intent validation. This slice does not invent such a workflow or expose arbitrary workflow names.

Blocked known actions remain in the catalogue with one highest-priority blocker. Deterministic policy order chooses identity/store failures, stack predecessor gates, artifact/task gates, validation gates, and terminal-state blockers before lower-priority guidance.

### D3. Resolve facts through headless Specbase APIs

Use immutable identity resolution for ideas, active changes, and archives. For active and archived changes, consume the lifecycle snapshot boundary. Reuse artifact status, tracked-task, strict gate, and stack projection APIs when an action policy needs more than lifecycle position. Do not inspect board cards, render state, human-formatted CLI output, external activity, or Git state.

Policy functions are pure over a normalized target fact record. Repository reads occur once per catalogue/validation request so entries in one result cannot disagree because of repeated ambient reads.

### D4. Validate a minimal exact intent against fresh state

A selected intent carries only catalogue version/revision, store identity, immutable work-item identity, action ID, and expected dispatch kind. It does not carry executable text as authority. Expose a validator shaped conceptually as `validateDirectActionIntent(intent, { root })`.

Validation resolves the selected store and work item again, rebuilds the canonical catalogue from fresh facts, and requires exact identity/version/action/kind equality plus current availability. Success returns the current canonical dispatch descriptor. Failure returns no descriptor and stable diagnostics for target resolution, unsupported version, unknown action, mismatch, stale availability, or blocked state.

This is a correctness and injection boundary, not authentication or approval. External systems remain responsible for any confirmation, authorization, idempotency, execution, and result handling they require.

### D5. Use opaque stable diagnostics and remediation

Diagnostic and blocker records use stable codes, target identity, concise messages, and direct remediation. Clients may render the text but should branch on codes. Catalogue-level resolution errors return no target/actions; action-level blockers return a resolved target and blocked descriptor.

Order diagnostics by severity, code, then target so package consumers and fixtures receive deterministic values.

### D6. Keep board enrichment optional and downstream

The action catalogue remains a separate request keyed by card ID rather than embedding actions into the versioned board snapshot. This avoids changing the predecessor board contract and lets clients refresh action policy immediately before selection. A later governed change may add a convenience composition if multiple consumers need it.

## Enforcement design

### `test/commands/work-item-lifecycle.test.ts`

- **Contract:** Extend the lifecycle suite with a canonical action-registry matrix for `explore`, `propose-feature`, `explore-enforcement`, `propose-enforcement`, `apply`, `review`, and `archive`. Feed pure policy functions normalized idea/change/archive facts across lifecycle, artifact/task, strict-validation, and stack-predecessor gates; assert deterministic descriptor order, available versus blocked shape, exactly one highest-priority blocker/remediation, stable structured dispatch contexts, and no executable text. Rebuild the catalog from changed fresh facts during intent validation and assert exact identity/version/action/kind matching, stale rejection, arbitrary-field rejection, and zero calls to injected side-effect sentinels.
- **Fixtures and harness:** Vitest table fixtures built on existing lifecycle inputs plus temporary cross-platform stores where resolution behavior matters; injected readers count one normalized repository read per catalogue/validation request and spies stand in for forbidden execution adapters.
- **Failure signal:** Wrong availability/order/blocker, client-state authority, repeated inconsistent reads, accepted mismatch/stale intent, free-form executable data, or any side-effect sentinel call fails the focused Vitest case.
- **Known boundary:** In-process tests prove policy and boundary semantics but not packed root exports or declaration usability.

### `test/cli-e2e/store-lifecycle.test.ts`

- **Contract:** Extend the existing cross-machine store lifecycle journey to build and pack Specbase, install it into a clean temporary consumer, import catalogue/version/types and exact-intent validation from the root, and exercise ideas plus active/archived changes across representative gates. Assert canonical available/blocked descriptors; then mutate store facts between selection and validation and verify current acceptance or stable missing, ambiguous, unsupported-version, unknown-action, identity/kind mismatch, stale, and blocked diagnostics with no descriptor. Snapshot store files around every request to prove read-only behavior.
- **Fixtures and harness:** Existing Vitest CLI-E2E machine/store fixture, local packed tarball after `pnpm run build`, isolated consumer, immutable metadata IDs, stack-aware changes, and paths constructed with Node `path` utilities.
- **Failure signal:** Build/install/import/declaration failure, nondeterministic catalogue, incorrect diagnostic fields/order/remediation, accepted tampering, emitted executable text, returned descriptor on rejection, or any store mutation fails the journey.
- **Known boundary:** The source verifies Specbase's validated descriptor boundary only; it deliberately does not invoke or judge external Pi/RPIV/Git/shell dispatch.

## Risks / Trade-offs

- [Lifecycle alone cannot decide every gate] -> Normalize lifecycle, artifact/task, validation, and stack facts through existing headless APIs.
- [Action labels become execution authority] -> Validate only stable IDs and return the canonical structured route on success.
- [State changes between display and dispatch] -> Re-resolve and rebuild the catalogue during exact-intent validation.
- [A fixed registry becomes stale] -> Version the catalogue and require governed additions or semantic changes.
- [Clients mistake validation for authorization] -> State that confirmation, approval, credentials, and execution remain external responsibilities.
- [Returning blocked actions creates clutter] -> Keep deterministic ordering and one highest-priority actionable blocker per action.

## Migration Plan

1. Add catalogue, action, blocker, diagnostic, dispatch-context, intent, and validation result types.
2. Implement immutable target normalization and pure action policies over existing lifecycle/gate APIs.
3. Export catalogue and validation operations from the package entrypoint.
4. Verify lifecycle, task, validation, stack, missing-target, ambiguous-target, unknown-action, stale-intent, and tampered-intent fixtures.
5. Let the companion Pi integration consume descriptors as opaque authority and provide its own conversation/workflow adapters.

Rollback removes the exports and policy registry. No planning-store or queue data is written, so no data migration is required.

## Open Questions

- Whether a later catalogue version should add named autonomous delivery actions after their owning Pi/RPIV workflows are governed and published. Such an addition must preserve this validation boundary and cannot introduce arbitrary execution text.
