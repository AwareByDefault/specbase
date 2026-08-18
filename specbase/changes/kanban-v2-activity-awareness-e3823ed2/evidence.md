## Status

Planning review only. Application sources and tests are not implemented. Every planned enforcement source below is **not executed**. Binding resolution, when checked, is structural linkage only.

## Planned deterministic and runtime evidence

| Source | Native harness | Status |
|---|---|---|
| `test/core/activity-awareness.test.ts` | `pnpm exec vitest run test/core/activity-awareness.test.ts` | planned / not executed / source missing |
| `test/core/activity-awareness.architecture.test.ts` | `pnpm exec vitest run test/core/activity-awareness.architecture.test.ts` | planned / not executed / source missing |
| `test/commands/view.activity.test.ts` | `pnpm exec vitest run test/commands/view.activity.test.ts` | planned / not executed / source missing |
| `test/tui/view-activity.test.ts` | `pnpm run test:tui -- test/tui/view-activity.test.ts` with Bun >=1.3 | planned / not executed / source missing |

## Planned review evidence

| Source | Status |
|---|---|
| `design` lens for subordinate, non-color activity presentation | planned / not executed |

## Planning validation log

- `node bin/specbase.js status --change kanban-v2-activity-awareness-e3823ed2 --json` — passed; all planning artifacts report `done`; stack projection is blocked only by V1's missing planned sources.
- `node bin/openspec.js validate kanban-v2-activity-awareness-e3823ed2 --strict --json` — failed as expected when evaluated directly against accepted truth: projected V1 requirements are absent and planned V2 sources are missing. Downstream validity is determined by stack projection, not this standalone base.
- Temporary empty files were created at every V1-V3 planned file-backed source path solely to run `node bin/openspec.js stack validate add-kanban-tui-viewer-for-specs-460680a4 --json`; the projected V2 prefix parsed/applied with zero diagnostics. The fixtures were removed immediately. This is structural linkage only; no source was executed or semantically verified.
- The final stack run without fixtures is expected red at V1's missing planned sources, leaving V2 blocked.
