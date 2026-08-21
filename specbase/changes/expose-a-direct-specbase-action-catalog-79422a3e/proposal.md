## Why

External boards can show lifecycle truth but still have to guess which Specbase action is valid and how to identify it at dispatch time. A canonical, freshly validated action contract lets clients offer safe direct actions while keeping Pi skills, RPIV workflows, and every side effect outside Specbase.

## What Changes

- Expose a versioned package API that returns canonical available and blocked direct actions for one immutable work-item ID.
- Give every action stable identity, availability, blocker, remediation, and typed dispatch-context values.
- Expose an intent validator that re-resolves current store state and accepts or rejects one exact target/action intent with stable machine diagnostics.
- Restrict dispatch context to the closed Specbase action vocabulary; never expose arbitrary shell, Git, skill, or workflow text.
- Stop at a validated dispatch descriptor: Specbase does not execute Pi skills or RPIV workflows, persist a delivery queue, or own approval leases.

## Planes

### Behavioral truth
- `behavior.api.action-catalog`: installed consumers can list direct actions and validate one exact intent with stable results (new).

### Architectural truth
- `architecture.action-boundary`: lifecycle policy and intent validation remain Specbase-owned while execution stays behind external adapters (new).

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| Action policy uses freshly resolved lifecycle, artifact/task, strict-gate, and stack truth | `test` | `test/commands/work-item-lifecycle.test.ts` | Table-driven policy fixtures and injected-port spies prove stale board lanes, labels, or client availability never override one normalized fresh fact record. |
| Validation ends at a closed canonical dispatch descriptor with no side effect | `test` | `test/commands/work-item-lifecycle.test.ts` | Unit cases accept exact intents, reject arbitrary executable fields and kind mismatches, and assert no command, Git, skill, workflow, or mutation adapter is invoked. |
| Installed consumers list deterministic available/blocked actions and validate exact intents | `test` | `test/commands/work-item-lifecycle.test.ts` and `test/cli-e2e/store-lifecycle.test.ts` | Unit policy matrices cover each lifecycle/gate transition; a packed-package journey proves root exports, versioned types, fresh-state acceptance/rejection, and canonical descriptor shape. |
| Invalid targets, versions, actions, and identities fail predictably | `test` | `test/cli-e2e/store-lifecycle.test.ts` | Clean-package fixtures assert stable ordered diagnostic codes, affected target/action, remediation, and no dispatch descriptor for missing, ambiguous, unknown, stale, and tampered intents. |

## Impact

- Affected public surface: package exports and declarations for action catalogue, intent, result, diagnostic, and dispatch-context types.
- Affected systems: immutable work-item resolution, lifecycle/status gates, and stack-aware availability policy.
- No command execution, Git integration, queue persistence, approval state, board mutation, or Pi/RPIV dependency.
