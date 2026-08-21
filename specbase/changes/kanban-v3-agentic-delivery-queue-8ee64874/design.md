## Context

V1 provides a read-only shared board; V2 adds advisory activity. Existing Specbase workflows expose idea/change identity, artifact states, apply gates, task progress, next steps, resolved roots, and governed validation data. Queue readiness consumes those APIs rather than parsing prose. Local durable-state patterns already exist in worksets: strict schemas, a global data directory, locks, atomic writes, and deterministic serialization.

The stack's original scratchpad discussed a web editor, chat, Elysia/Bun web services, a monorepo, saved workflows, and automated Git delivery. That text is historical ideation, not V3 scope. Commit, push, merge, deploy, branch/remote behavior, browser editing, chat, remote scheduling, and saved workflows require separate future ideas and changes.

## Goals / Non-Goals

**Goals:**

- Persist explicit one-action queue items with immutable work identity and stable JSON.
- Queue fixed Specbase-owned `explore`, `propose`, `apply`, `verify`, and `archive` actions.
- Let one agent runner claim work with a renewable lease and durable attempt/result records.
- Recover safely after restart, suppress duplicate adds/execution, and cancel cooperatively.
- Record exact local operator intent separately from runner execution capability.
- Surface queue state in the board without turning the viewer into an executor.

**Non-Goals:**

- Authentication, authorization, identity, credential isolation, privilege separation, or protection from another local process/user with CLI and filesystem access.
- Commit, push, merge, deploy, branches, remotes, worktrees, or any Git-delivery orchestration.
- Browser editor, chat, Elysia/web services, monorepo migration, remote scheduler, multi-user coordination, or saved workflow definitions.
- Arbitrary workflow graphs/DSLs, action chaining, or automatic creation of successor items.

## Decisions

### Fixed Specbase action and stage vocabulary

A queue item names one immutable work ID and one action:

| Stage | Actions | Work position |
|---|---|---|
| `planning` | `explore`, `propose` | open idea for `explore`; open idea or active change context accepted by the existing workflow API for `propose` |
| `implementation` | `apply` | active change |
| `verification` | `verify` | active change |
| `completion` | `archive` | active change |

The initial vocabulary contains only these five Specbase-owned actions. Adding another Specbase-owned action requires a later governed modification; arbitrary commands and Git delivery are invalid. Stage is stored and validated against the fixed mapping. Work IDs resolve from `.openspec.yaml` through existing immutable-ID resolvers across idea, active-change, and archived positions as allowed by each action. Directory names are never persisted as identity.

### CLI, JSON envelope, and capabilities

Register `specbase queue add|list|show|approve|cancel|claim|heartbeat|finish` and matching completion definitions. Mutating commands support `--json`; machine output uses `{ queueItem|queueItems, root, status }`, with `status` entries carrying stable `severity`, `code`, `message`, `target`, and `fix`. Human output is a projection of the same result.

`add` requires `--work`, `--action`, and `--idempotency-key`. `approve` names one item and exact action. Protocol commands require item/runner/lease identifiers and structured result input. stdout remains JSON-only in JSON mode and failures use nonzero exit status.

The domain API exposes separate capabilities. The **control capability** may add, approve, revoke approval, and cancel. The **runner capability** may inspect/claim, heartbeat, observe cancellation/approval, and finish. Runner command handlers and the delivery-runner skill receive no approval-mutation capability and cannot invoke `approve` or revoke. Tests instantiate the capabilities separately rather than using one unrestricted service. This is an accidental-mutation boundary, not a security sandbox: any local operator/process with CLI and queue-file access is inside the trust boundary.

### Durable local state

Store versioned state under `<globalDataDir>/delivery-queue/`, never in the project. The index is strict, deterministically serialized YAML. Attempts and result records are append-only entries associated with the item. All updates use one lock and atomic replacement. Item lifecycle is `queued`, `running`, `blocked`, `succeeded`, `failed`, or `cancelled`; readiness is separately `ready` or `blocked` with blocker codes/fixes.

An item records ID, repository identity/root, work ID, action, stage, state, readiness, timestamps, idempotency key, local-intent approval, cancellation request, current lease, attempts, and latest result. Results contain outcome, summary, structured evidence references, start/end time, and recovery disposition; they never store credentials or project file contents.

### API-derived readiness

A readiness adapter invokes core idea/change status, artifact, task, validation, coverage, root, and immutable-ID APIs directly. Fixed action policies are:

- `explore`: the immutable open idea exists and no equivalent successful result already makes the item terminal.
- `propose`: the source idea/change context resolves and the existing propose workflow reports its required input ready.
- `apply`: status says apply requirements are complete and tracked implementation tasks remain.
- `verify`: tracked implementation tasks are complete and the existing verification inputs resolve.
- `archive`: tasks are complete and strict validation/coverage gates report ready.

Missing/moved work outside the action's allowed position, unmet governed policy, cancellation, absent local intent, or an interrupted attempt requiring reconciliation produces stable blockers with a fix. Readiness never parses human command output, uses V2 activity, or inspects Git state.

### Leases, cancellation, recovery, and idempotency

`claim` atomically selects a ready and approved queued item (or explicit ID), records runner ID, random lease token, expiry, attempt, and operation key, then marks it running. Heartbeat requires the token and extends the lease. Only the lease holder may finish. A cancellation of queued/blocked work is immediately durable; a running item gets `cancelRequested`, and the runner stops at its next safe boundary and finishes cancelled.

The add idempotency scope is repository + work ID + action + caller key; a duplicate returns the original item. The operation key is stable for one item/action and accompanies runner execution. A succeeded item cannot be reclaimed. On startup or mutation, expired leases are reconciled. If the action did not report a durable result, the interrupted attempt is appended and the item becomes blocked with action-specific inspection/recovery guidance; a control-capability reconciliation records whether it is safe to queue a new attempt. V3 does not claim transactionally exactly-once execution of agents or filesystem effects.

### Approval records local operator intent, not security

Every execution requires a current approval exactly matching repository identity, immutable work ID, item ID, and action. `queue approve` writes a per-item local operator-intent event; revocation is another control-lane event. Wildcards are invalid. Approval is checked at claim and observed again by the runner immediately before starting the named action.

Approval means only: a local operator explicitly asked this queue item to run. It does not authenticate who the operator is, authorize operating-system access, protect credentials, elevate privilege, or defend against a local user/process that can invoke the CLI or edit local queue data. Local CLI possession and filesystem access are the V3 trust boundary. Activity, queue order, agent/session identity, environment credentials, and prior item results never imply approval. The runner execution lane can read the decision but cannot create or mutate it.

### Delivery-runner instrument

The repo owns `.pi/skills/specbase-delivery-runner/SKILL.md`, maintained with its template surface. It tells an agent to claim exactly one item, inspect machine context, refuse mismatched/unsupported work, observe current local intent, heartbeat during work, execute only the named Specbase action through existing governed workflows/CLI, observe cancellation at safe boundaries, and finish with structured evidence. It never approves, revokes, queues the next action, invokes Git delivery, or marks success without evidence.

### View integration

The board model gains a `queue` secondary section containing summary counts and deterministically ordered item summaries. Interactive, plain, and JSON view it read-only. Selecting a queue item shows action, stage, work ID, lifecycle, readiness/blockers, local-intent state, lease/attempt summary, and latest result; no view command adds, approves, revokes, cancels, claims, or runs it.

The OpenTUI queue surface remains secondary to project lifecycle. Keyboard and mouse can reach the queue summary, items, detail, blockers, and return path through the shared command vocabulary. Focus has non-color cues and survives detail open/close. Narrow layouts show one primary surface at a time with a labelled queue switch and preserve selected queue identity and essential back/quit controls.

## Enforcement design

- `test/commands/delivery-queue.test.ts` runs Commander against temporary project/global-data fixtures. It checks every command JSON envelope, human projection, completion registration, immutable work resolution, separate control/runner command routes, errors/fixes, and exit codes. It does not prove lock atomicity.
- `test/core/delivery-queue/state.test.ts` runs with injected clock/store/status adapters. It covers every legal/illegal transition, the five action readiness policies, restart loading, expired-lease recovery, cooperative cancellation, append-only attempts/results, corruption, and deterministic serialization.
- `test/core/delivery-queue/concurrency.test.ts` uses competing updates against the lock/atomic store. It proves one claimant, lease-token ownership, heartbeat expiry, duplicate idempotency returns, and no reclaim after success. It does not claim distributed scheduling.
- `test/core/delivery-queue/approval.test.ts` constructs separate control and runner capabilities. It proves exact local-intent matching/revocation, wildcard/mismatch rejection, claim/pre-action observation, runner inability to invoke approval mutation, and recovery blocking. It explicitly does not test authentication or real credentials.
- `test/commands/view.queue.test.ts` checks queue summary/detail/plain/JSON order and verifies no queue or project file changes after viewer commands.
- `test/tui/view-queue.test.ts` runs under Bun with the V1 headless OpenTUI harness. Parsed keyboard/mouse input and captured wide/narrow frames prove queue reachability, detail/back parity, visible focus, scrolling, blockers/results, and retained queue selection. It does not prove visual hierarchy by itself.
- The `design` lens reviews queue subordination, hierarchy, keyboard/mouse discoverability, non-color focus, and narrow-layout coherence.
- `.pi/skills/specbase-delivery-runner/SKILL.md` is the concrete command-backed artifact. `test/core/delivery-runner-skill.test.ts` audits artifact/template parity and fixture transcripts for claim, heartbeat, local intent, cancellation, finish, capability separation, no chaining, and no Git actions.

`evidence.md` in this change directory is the canonical execution record. It records native-harness commands/results, runtime versions, structural linkage, and review separately; no source is treated as executed merely because its binding resolves.

## Risks / Trade-offs

- **Local intent could be mistaken for security approval** -> Name the trust boundary and exclusions in CLI/spec/skill copy and test that no identity/auth claim is emitted.
- **Runner could mutate approval** -> Give runner handlers/skill only runner capability and test that approval mutation is unavailable.
- **Interrupted agent action can be ambiguous** -> Block with action-specific inspection/reconciliation rather than promise exactly-once or silently retry.
- **Local queue is not collaborative** -> Use local locks and explicitly defer remote scheduling/identity.
- **Status APIs evolve** -> Keep readiness behind adapters and contract-test typed inputs, not human output.
- **Queue UI could outrank governed lifecycle** -> Keep it secondary and require headless plus design review evidence.

## Migration Plan

1. Implement strict schemas, local paths, locking, atomic state updates, and pure transition/readiness policies for the five Specbase actions.
2. Add separate control/runner capabilities, human/JSON CLI commands, and completion registry entries with fake status/validation adapters.
3. Add the runner protocol and repo-owned skill, then local-intent observation, cancellation, and recovery checks.
4. Add read-only queue data and headless queue interaction to the shared board projections.
5. Run focused state, concurrency, approval, CLI, view, headless OpenTUI, design, and skill conformance sources; record each in `evidence.md` before stack validation.
6. Rollback disables claims first; durable files remain inspectable/exportable and V2 view remains useful without queue enrichment.

## Open Questions

None. Git delivery and the historical web/editor/chat/monorepo/saved-workflow concept are excluded and require separate future ideas before design or implementation.
