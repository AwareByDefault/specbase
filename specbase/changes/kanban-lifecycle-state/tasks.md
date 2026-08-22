# Tasks: lifecycle-state board

- [x] 1.1 Replace destination-column model with idea-backlog lane + six lifecycle lanes
- [x] 1.2 Consume the resolved `lifecycle` per change; place each card in its derived lane
- [x] 1.3 Add per-lane counts to the board summary
- [x] 1.4 Order cards within each lane (progress then immutable ID); idea backlog by created then ID; archived by archive date descending then ID
- [x] 1.5 Keep one shared derived model across interactive / plain / JSON projections

## 2. Renderer and CLI
- [x] 2.1 Render lane headers with label + count; lanes in lifecycle order after the idea backlog
- [x] 2.2 Change cards show artifact/task progress inside their lane; empty lanes render with a count
- [x] 2.3 Narrow mode: one lifecycle lane or idea backlog at a time, position indicator, selected card and switch/detail/quit controls
- [x] 2.4 Update `--plain` and `--json` surfaces to the lane board

## 3. Enforcement (feature-only)
- [x] 3.1 Add `enforcement.yaml` binding sources (test) for lane placement, summary lane counts, and ordering
- [x] 3.2 Add `design` lens binding for lane visibility without color

## 4. Validation
- [x] 4.1 `specbase validate <change> --strict` green
- [x] 4.2 `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm run test:tui` green
- [x] 4.3 Record evidence that each derived state lands in the correct lane in plain and JSON projections

### Evidence (4.3)

`specbase view --plain` / `--json` show derived state -> lane placement (shared model recomputes from on-disk state, so lane membership updates as tasks complete):
- **Ready to Apply (2)**: `kanban-v2-activity-awareness-…`, `kanban-v3-agentic-delivery-queue-…` (artifacts 5/5, tasks not started) — matches derived `ready-to-apply`.
- **Implementing (2)**: `add-ste-instrument` (artifacts 4/5, tasks 17/17) and `kanban-lifecycle-state` (artifacts 5/5, tasks 14/14) — matches derived `implementing` once tasks are started/completed.
- **Archived (15)**: including `kanban-v1…`, `work-item-lifecycle`, `split-enforcement-workflow` — matches derived `archived`.
- Summary lane counts agree with the lane contents (`Proposed 0 | Enforcement 0 | Ready 2 | Implementing 2 | Review 0 | Archived 15`), identical between `--plain` and `--json`.
- `test/tui/view-board.test.ts` (9 cases) proves the interactive wide board (lane-nav strip + focused lane), narrow single-lane mode, mouse/keyboard/wheel parity, and non-color cues for every lane.