## Why

Large features are too easily captured as one oversized change, obscuring the observable increments between implementation steps and making review, validation, and rollback harder. Specbase needs a narrow delivery-decomposition primitive that preserves ordinary changes as independent review units while ordering them against the truth projected by their predecessors.

## What Changes

- Add repo-local change stacks: finite, linear, ordered collections of ordinary work-item IDs.
- Let an idea graduate into a stack whose scratchpad becomes shared decomposition context and whose members proceed independently through idea, change, and archive positions.
- Add stack creation, inspection, and validation surfaces that report member order, lifecycle status, and the next observable slice.
- Validate each active member against the accepted specs projected through its active predecessors, applying every predecessor delta exactly once.
- Require every stack prefix to leave the repository coherent and require members to archive in order.
- Add a stack-decomposition workflow that helps an agent cut a large idea into independently observable and reviewable vertical slices, rejecting horizontal implementation phases.
- Keep stacks repo-local and Git-agnostic: no cross-store membership, nested stacks, branch metadata, PR state, assignees, or initiative/workspace semantics.

## Planes

### Behavioral truth

- `behavior.change-stacks`: stack creation and idea graduation, ordered inspection, stack-aware validation, and ordered archive outcomes. (new)

### Architectural truth

- `architecture.change-stacks`: central linear membership, stable work-item resolution, sequential spec projection, and the valid-prefix invariant. (new)

### Ops

- `ops.planning-layout`: the repository planning root includes the repo-local `stacks/` region beside ideas, changes, and specs. (modified)

### Agents

- `agents.change-stacks`: the repo-owned slicing workflow decomposes large ideas into independently observable vertical members and supplies predecessor context to affected workflows. (new)

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| `stack-lifecycle` | `test` | `test/commands/change-stacks.test.ts` | Users can create, inspect, and resolve a stack across idea, active-change, and archived positions. |
| `stack-aware-validation` | `test` | `test/workflow/change-stack-projection.test.ts` | Downstream deltas validate against predecessor-projected truth and invalid predecessors block the chain. |
| `ordered-archive` | `test` | `test/core/archive.change-stacks.test.ts` | A member cannot archive before its predecessors and an eligible prefix archives normally. |
| `linear-manifest` | `test` | `test/core/change-stacks/manifest.test.ts` | Manifests resolve one finite ordered member list with no duplicates, nesting, cross-root members, or multiple-stack membership. |
| `projection-once-in-order` | `test` | `test/core/change-stacks/projection.test.ts` | Active predecessor deltas are folded in order exactly once while archived predecessors are not replayed. |
| `valid-prefix` | `test` | `test/core/change-stacks/projection.test.ts` | Every projected prefix is validated before downstream truth is accepted. |
| `specbase-is-planning-root` | `command` | `specbase/config.yaml` | The declared planning layout includes the repo-local stacks region without reviving the retired store. |
| `stack-slicing-workflow` | `command` | `.pi/skills/specbase-stack/SKILL.md` | The shipped instrument applies the vertical-slice test, preserves explicit deferrals, and uses stack-aware CLI context. |

## Impact

- Affected code: new stack model/projector modules; CLI command registration and completion; root initialization and discovery; status/instructions/validation/archive integration; idea graduation; workflow template generation.
- Affected store: new `specbase/stacks/` repo-local planning region and strict stack manifest format.
- Affected workflows: new stack-decomposition skill/command plus stack context in propose, apply, and archive guidance.
- Affected specs: new behavior, architecture, and agents pairs; modified ops planning-layout pair.
- Dependencies: none planned; the feature remains on the existing TypeScript/Node stack.
- Compatibility: ordinary unstacked ideas and changes retain their current behavior and metadata.
