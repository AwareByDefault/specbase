## Why

Reviewing currently means the generated panel wrote a timestamp, and recording a draft pull request also moves the card there. Operators instead use Reviewing as the queue of pull requests ready for human review. Panel audit, draft recovery, human review, feedback fixes, and archive need distinct canonical meanings.

## What Changes

- Publish lifecycle semantics in which panel execution is non-transitional and only a confirmed ready-for-review pull request moves completed work to Reviewing.
- Replace the current autonomous delivery affordances with a canonical Ready-to-review capability while retaining explicit version compatibility.
- Add Reviewing actions for addressing pull-request feedback, exploring requested rework with PR context, and human-controlled archive.
- Record exact draft/ready pull-request observations without performing remote work inside Specbase.

## Impact

- Affected specs: `behavior/api/lifecycle-snapshots`, `behavior/api/action-catalog`, `architecture/action-boundary`
- Affected code: lifecycle derivation, change metadata, direct actions/results, board cards, public exports, and lifecycle/action journeys

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| Reviewing requires a confirmed ready PR | test | `test/commands/work-item-lifecycle.test.ts` | Panel-only and draft states remain Implementing; ready state becomes Reviewing |
| Canonical actions match lifecycle and preserve exact intent | test | `test/commands/work-item-lifecycle.test.ts` | Ready and Reviewing catalogs expose only valid typed capabilities and reject stale/tampered intents |
| Remote operations remain external | static-analysis | `test/commands/work-item-lifecycle.test.ts` | Result recording mutates only canonical metadata and never calls Git or GitHub |
| Installed lifecycle/board projections agree | test | `test/cli-e2e/store-lifecycle.test.ts` | Package, status, and board expose the same PR-ready state and link |
