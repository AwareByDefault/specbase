## 1. Stack model and planning layout

- [x] 1.1 Add the strict repo-local stack manifest model under `src/core/change-stacks/`: stable stack metadata, an ordered list of at least two unique member IDs, and typed diagnostics for malformed manifests.
- [x] 1.2 Add stack storage and idea-to-stack graduation that preserve the umbrella idea's metadata, notes, and supporting files without changing ordinary idea-to-change graduation.
- [x] 1.3 Add stable member resolution across `ideas/`, active `changes/`, and dated archives within one planning root; reject missing, ambiguous, nested, cross-root, duplicate, and multiple-stack members.
- [x] 1.4 Extend initialization and root layout handling to plant `specbase/stacks/` while keeping existing roots without it readable until first use.
- [x] 1.5 Implement `test/core/change-stacks/manifest.test.ts` and `test/core/init.change-stacks.test.ts`; run both through Vitest and record the result.

## 2. Stack command behavior

- [x] 2.1 Add the `stack` command group with create, list, show, and validate surfaces, including one-document JSON success/failure shapes and actionable diagnostics.
- [x] 2.2 Make stack inspection report members in manifest order with resolved lifecycle position, artifact/task progress where available, and the first unfinished member.
- [x] 2.3 Register the command group, flags, dynamic stack/member completion, and command help in the single completion registry.
- [x] 2.4 Implement `test/commands/change-stacks.test.ts` for creation, idea movement, preserved scratchpads, mixed-position inspection, JSON contracts, failures, and unchanged unstacked behavior; execute it through Vitest and record the result.

## 3. Sequential truth projection

- [x] 3.1 Extract archive's prospective spec/enforcement delta transition into a reusable core boundary so archive and stack projection share rename → remove → modify → add and governed-pair semantics.
- [x] 3.2 Implement a pure stack projector that starts from current truth, skips archived predecessors, folds active predecessor deltas exactly once in order, validates every prefix, and stops at the first conflict.
- [x] 3.3 Add stack context to machine-readable status and instruction output: stack identity, member position, predecessor statuses, projected base paths/results, and downstream blockage without Git claims.
- [x] 3.4 Route stack validation through the projector while leaving ordinary validation enumeration and output unchanged.
- [x] 3.5 Implement `test/core/change-stacks/projection.test.ts` and `test/workflow/change-stack-projection.test.ts`; cover active/archived matrices, downstream modification of predecessor-added truth, pair atomicity, first-conflict stopping, and valid prefixes; execute both through Vitest and record the result.

## 4. Ordered archive integration

- [x] 4.1 Gate archive for stacked changes on all predecessors being archived and report the first required predecessor without mutating current specs, the stack, or the change.
- [x] 4.2 Require stacked members with deltas to apply their current-state updates; reject skip or declined-update paths that would advance the stack without predecessor truth, while preserving existing unstacked behavior.
- [x] 4.3 Refresh stack inspection naturally from the member's archived position after a successful ordinary archive.
- [x] 4.4 Implement `test/core/archive.change-stacks.test.ts` for out-of-order rejection, eligible archive, required-delta skip rejection, atomic failures, and unstacked compatibility; execute it through Vitest and record the result.

## 5. Agent-assisted vertical slicing

- [x] 5.1 Add the canonical stack-decomposition workflow template and `.pi/skills/specbase-stack/SKILL.md` projection: read an idea, apply the vertical-slice test, name each newly observable outcome and explicit deferrals, create child work items, then create the stack through the CLI.
- [x] 5.2 Add the matching `spcb` command projection and adapter registration so every supported tool receives the same stack semantics from the canonical source.
- [x] 5.3 Update propose, apply, and archive workflow templates to consume CLI-reported stack/predecessor context and avoid direct manifest parsing or invented Git safety.
- [x] 5.4 Extend `test/core/templates/skill-templates-parity.test.ts` and focused conformance tests for the stack skill; run them through Vitest and record the result.

## 6. Product guidance and evidence

- [x] 6.1 Document change stacks as vertical delivery decomposition in the CLI, workflow, and team/PR guides, explicitly distinguishing stack members from tasks and retired initiatives.
- [x] 6.2 Build the CLI and run the focused stack suites, related idea/status/instructions/archive suites, completion tests, and workflow-template parity tests.
- [x] 6.3 Run the full native test suite and lint; fix regressions without weakening the stack or existing unstacked contracts.
- [x] 6.4 Run `specbase validate add-change-stacks --strict` and `specbase coverage --json`; confirm every pair and planned source resolves with no new orphan, stale, hanging, or broken enforcement.
- [x] 6.5 Record the exact commands, results, semantic correspondence notes, and residual risks for every binding source before requesting review.
