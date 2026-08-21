## Context

V1 establishes a pure board model and read-only projections. Activity must enrich that model without becoming a second lifecycle system. The available honest V2 signal is local filesystem metadata; process identity, network presence, editor telemetry, and collaboration are out of scope. Current time and filesystem observations must be injected to avoid sleeps and unstable output tests.

## Goals / Non-Goals

**Goals:**

- Add deterministic `fresh`, `stale`, and `unknown` observations with source, timestamp, and age.
- Present the same observation in board cards, details, plain output, and JSON.
- Keep reads project-local, content-blind, and advisory.

**Non-Goals:**

- Claiming an agent or person is currently working.
- Remote presence, identity/auth, chat, collaboration, task claiming, or queue execution.
- Writing activity records into the repository or changing governed status/readiness.

## Decisions

### Versioned activity value

Each work card gains:

```ts
activity: {
  state: 'fresh' | 'stale' | 'unknown';
  source: 'project-files' | null;
  observedAt: string | null;
  ageMs: number | null;
}
```

The provider reports the most recent modification time among regular files inside the card's own idea, active-change, or archive directory. It reads metadata only, ignores symlinks that leave that directory, does not read file contents, and never calls a network or process-inspection API. Accepted specification summaries are reference truth rather than work cards and do not receive activity in V2.

The evaluator receives `now()` and a provider. An observation at or before 15 minutes old is `fresh`; an older observation is `stale`. A future timestamp clamps to age zero. No readable candidate or any provider failure yields all-null `unknown` rather than failing the board. JSON uses RFC 3339 UTC strings and integer milliseconds.

### Activity is a board decoration

Activity enrichment runs after lifecycle, artifact, task, and spec derivation. The board model's lifecycle column, ordering, progress, diagnostics, and readiness fields are computed without activity and are not recomputed from it. Activity failures add only an activity-local diagnostic/unknown value.

### Presentation

Cards show a compact non-color marker and age (`fresh 4m`, `stale 2d`, `activity unknown`). Details add source and exact observation time. Plain output carries the same labels. JSON carries the structured value. Lifecycle and progress remain visually primary; freshness never changes card order in V2.

## Enforcement design

- `test/core/activity-awareness.test.ts` uses an injected clock and fake metadata provider in Vitest. It checks the 15-minute boundary, stale values, future clamping, RFC 3339/age output, unknown on empty/failure, symlink/root bounds, metadata-only access, and no writes. Failure is an assertion diff. It does not prove visual hierarchy.
- `test/commands/view.activity.test.ts` runs view projections against temporary idea/change/archive fixtures with fixed provider time. It verifies card/detail-ready model data, deterministic plain labels, structured JSON, and unchanged lifecycle/order/progress. It does not initialize OpenTUI.
- `test/tui/view-activity.test.ts` runs under Bun with the V1 headless renderer. Captured frames prove card and detail markers, unknown/stale states, focus retention, and non-color labels at wide/narrow widths. It does not prove provider privacy.
- `test/core/activity-awareness.architecture.test.ts` checks enrichment depends on provider/clock interfaces, imports no network/process presence modules, writes no project files, and cannot feed lifecycle/progress reducers. It is structural evidence, not a claim that metadata means active work.
- The `design` lens reviews that activity remains subordinate to lifecycle and progress and that its states are distinguishable without color.

`evidence.md` in this change directory is the canonical execution record. Every native-harness command, runtime version, deterministic source result, structural-linkage check, and design review outcome is recorded there; a resolvable binding is not proof that its source ran.

## Risks / Trade-offs

- **Filesystem modification is only a proxy** -> Label source explicitly and never say a person or agent is present.
- **Large directories cost metadata reads** -> Reuse bounded traversal and allow provider batching; performance optimizations must preserve the value contract.
- **Clock skew creates future times** -> Clamp age to zero and keep the observed timestamp visible.
- **Provider errors could make the board brittle** -> Degrade each card independently to `unknown`.

## Migration Plan

1. Add the activity types, evaluator, and local metadata provider behind injected ports.
2. Enrich V1 work cards without changing model ordering or lifecycle derivation.
3. Add JSON/plain presentation, then card/detail OpenTUI presentation.
4. Run core, CLI, architecture, and Bun headless sources and record commands, runtime versions, and results in `evidence.md`.
5. Rollback removes enrichment/presentation; the V1 board remains fully useful.

## Open Questions

None. The 15-minute threshold and `project-files` source are V2's explicit initial contract and can be changed only through a later spec update.
