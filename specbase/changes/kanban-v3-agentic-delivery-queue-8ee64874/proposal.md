## Why

V2 helps users see local activity but still leaves Specbase workflow work as transient instructions with no durable ownership, recovery, or result history. A local agentic queue gives humans and agents a reliable handoff surface while preserving explicit local operator intent for execution.

## What Changes

- Add a durable local queue whose items reference immutable work IDs and one fixed Specbase-owned action: `explore`, `propose`, `apply`, `verify`, or `archive`.
- Add human and JSON CLI contracts to add, list, show, approve, cancel, claim, heartbeat, and finish queue items.
- Derive readiness from existing idea/change/artifact/status/validation APIs and durable results, with actionable blockers.
- Record queue lifecycle, attempts, leases, cancellation, recovery, results, and idempotency keys across restarts.
- Treat approval as an exact record of local operator intent, not authentication, authorization, identity, credential protection, or a security boundary. Local CLI possession is the trust boundary.
- Separate control and runner capabilities: the control lane may add/approve/cancel, while the runner execution lane may claim/heartbeat/finish but cannot invoke approval mutation.
- Add a repo-owned delivery-runner skill that follows the queue protocol and executes only the claimed Specbase action.
- Show queue state as a secondary read-only surface in `specbase view`, plain, and JSON output.
- Add headless OpenTUI and design review evidence for queue hierarchy, mouse/keyboard reachability, focus, and narrow layouts.
- Defer commit, push, merge, deploy, Git branch/remote delivery, browser editor, chat, remote scheduling, arbitrary workflow DSLs, and saved workflow definitions to separate future changes.

## Planes

### Behavioral truth

- `behavior.delivery-queue`: queue CLI, readiness, lifecycle, local-intent approval, recovery, cancellation, and failures (new).
- `behavior.cli.view`: secondary queue visibility in the projected activity-aware board (modified).

### Architectural truth

- `architecture.delivery-queue`: durable state machine, immutable identity, API-derived readiness, separated control/runner capabilities, leases, idempotency, and recovery (new).

### Design-system truth

- `design-system.tui-board`: secondary queue hierarchy, mouse/keyboard reachability, focus, and narrow-layout behavior (modified).

### Agents truth

- `agents.delivery-runner`: concrete `.pi/skills/specbase-delivery-runner/SKILL.md` protocol instrument (new).

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| Queue CLI and JSON contracts | `test` | `test/commands/delivery-queue.test.ts` | End-to-end fixtures prove control/runner commands, envelopes, exit behavior, and actionable failures. |
| Durable state, readiness, recovery, leases, cancellation, results | `test` | `test/core/delivery-queue/state.test.ts` | Injected stores/clocks prove legal transitions and restart behavior for Specbase actions. |
| Concurrency and idempotency | `test` | `test/core/delivery-queue/concurrency.test.ts` | Competing claim/add attempts prove single ownership and duplicate suppression. |
| Local-intent approval and capability separation | `test` | `test/core/delivery-queue/approval.test.ts` | Separate control/runner fixtures prove exact local intent, no auth claim, and that runner capability cannot approve. |
| Secondary board visibility | `test` | `test/commands/view.queue.test.ts` | View fixtures prove queue summary/detail/plain/JSON without queue mutation. |
| Queue interaction and constrained presentation | `test` / `review` | `test/tui/view-queue.test.ts` / `design` | Headless OpenTUI frames/input prove reachability and state; design review judges hierarchy, focus, and narrow-layout coherence. |
| Delivery-runner instrument | `command` / `test` | `.pi/skills/specbase-delivery-runner/SKILL.md` / `test/core/delivery-runner-skill.test.ts` | Artifact audit and protocol tests prove claim/heartbeat/finish discipline, capability separation, and approval checks. |

## Impact

- Affected specs: `behavior.delivery-queue`, `architecture.delivery-queue`, `agents.delivery-runner`, `behavior.cli.view`, `design-system.tui-board`.
- Affected code: new delivery queue core/commands, Commander/completion registration, global local-state storage, idea/status/validation adapters, V2 view projections, and runner skill/template.
- No Git delivery action or new application runtime is introduced; the runner is a repo-owned agent instrument using existing Specbase CLI and skill surfaces.
- No application source, dependency, test, or lockfile change is part of this planning revision.
