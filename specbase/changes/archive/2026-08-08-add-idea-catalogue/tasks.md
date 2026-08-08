## 1. Architecture: the `ideas/` store and the stable id (architecture.ideas)

- [x] 1.1 Add `src/core/ideas/` with: id generation (`<slug>-<short-uuid>` from a title via slugify + `crypto.randomUUID().slice(0,8)`), `createIdea(root, {title, note})` (writes `ideas/<id>/.openspec.yaml` `{id, summary, created}` + seeds `notes.md`, creating `ideas/` lazily), `listIdeas(root, {all})` (scan `ideas/`, read yaml, derive age from `created`), `showIdea(root, id)`, `deleteIdea(root, id)`. All paths via `path.join`.
- [x] 1.2 Extend the change `.openspec.yaml` schema to carry an optional `id` field; `new change` generates `<slug>-<short-uuid>` when no idea context is supplied.
- [x] 1.3 Backfill: add a migration helper that, for archived changes lacking `id`, derives it as the archive dir name with a leading `YYYY-MM-DD-` prefix stripped and writes it into `.openspec.yaml` (best-effort, idempotent).
- [x] 1.4 Ensure the store resolver excludes `ideas/` from `validate`, `coverage`, `list --specs`, and the artifact graph (add `ideas/` to the ignored set alongside `archive/`).
- [x] 1.5 Tests: `test/ideas/stable-id.test.ts` (id unchanged across a simulated propose-move and archive date-prefix rename); `test/ideas/enumeration-exclusion.test.ts` (no idea path in validate/coverage/list --specs against a fixture store with an idea).

## 2. Behavior: the `ideas` CLI command group (behavior.ideas)

- [x] 2.1 Add `src/commands/ideas.ts` exporting `registerIdeasCommand(program)` with the noun-verb group: `ideas add --title <t> [--note <n>] [--json]`, `ideas list [--all] [--json]`, `ideas show <id> [--json]`, `ideas delete <id> [--json]`. Follow `store`/`workset` patterns; gate interactive prompts on `isInteractive()`.
- [x] 2.2 `add`: slugify title, append `-<short-uuid>`, create dir + `.openspec.yaml` + `notes.md` (seed body from `--note` if given). Print the created id and path; `--json` emits `{id, path, summary, created}`.
- [x] 2.3 `list`: default open-only (`ideas/`), oldest-first by `created`; `--all` reserved (currently same set, since graduated ideas leave `ideas/`). Print a table (id, age, summary); `--json` emits an array with `id, summary, created, age`.
- [x] 2.4 `show <id>`: resolve and match by id field, not just dirname — tolerate slug-only prefixes, print metadata + `notes.md` + member-file list; `--json`.
- [x] 2.5 `delete <id>`: remove the dir; if no open idea exists, report "not open / not found" with guidance (it may have been proposed into a change) and do not delete anything.
- [x] 2.6 Register `registerIdeasCommand` in `src/cli/index.ts`. Register `ideas` + options in the completion registry (`src/core/completions/command-registry.ts`) so the `behavior.cli` completion-registration invariant holds.
- [x] 2.7 Tests: `test/commands/ideas.test.ts` covering add (title+note, slug derivation, uniqueness across same-title adds), list (oldest-first, json shape), show (metadata+notes+members), delete (junk removed; graduated/nonexistent rejected).

## 3. Behavior: graduation by move (behavior.workflow.idea-graduation)

- [x] 3.1 Add a move seam: when `new change` (or the propose workflow) is invoked with an idea id (e.g. `--from-idea <id>` or a positional idea reference), move `specbase/ideas/<id>/` to `specbase/changes/<id>/` (preserving all scratchpad files), then scaffold `proposal.md`, `tasks.md`, `design.md`, and `specs/` inside, carrying the idea's `id` forward into the change `.openspec.yaml`.
- [x] 3.2 Ensure no `graduate` verb is registered; the `ideas` group exposes only add/list/show/delete.
- [x] 3.3 Tests: `test/workflow/idea-graduation.test.ts` (idea dir gone from `ideas/`, change dir present with scaffolded artifacts + preserved `notes.md` + scratchpad files, id carried forward, command surface has no graduate verb).

## 4. Ops: the planning root includes `ideas/` (ops.planning-layout)

- [x] 4.1 Extend `src/core/init.ts` to create an empty `specbase/ideas/` alongside `specs/` and `changes/` (idempotent).
- [x] 4.2 Update the `layout-conformance` binding's `run` node `-e` script in `specbase/specs/ops/planning-layout/enforcement.md` (this change's delta already ships the updated script).
- [x] 4.3 Tests: extend the existing layout test (or add `test/ops/planning-layout.test.ts`) to assert `specbase/ideas/` exists after `init`.

## 5. Agents: the save-idea and explore-idea instruments (agents.idea-lifecycle)

- [x] 5.1 Author `.pi/skills/save-idea/SKILL.md`: frontmatter declaring the trigger (invoked at the close of, or during, an explore session on an idea); body directs appending the session's thinking to `specbase/ideas/<id>/notes.md` under a `## Session <date>` heading (append, never overwrite), and optionally refining `summary` in `.openspec.yaml`; forbids writing `spec.md`/`enforcement.md`.
- [x] 5.2 Update `.pi/skills/specbase-explore/SKILL.md` to name the idea-as-input-unit contract: an explore session given an idea id reads `ideas/<id>/notes.md` (including prior `## Session` sections) as resumption context, and may hand off to propose when ready (which performs the idea→change move).
- [x] 5.3 Conformance: the bindings in this change's `agents/idea-lifecycle/enforcement.md` run node `-e` checks asserting each SKILL.md carries the required tokens (trigger name, notes.md append target, session heading, summary refinement / resume-from-notes).

## 6. Evidence: run the bindings and validate

- [x] 6.1 Run `pnpm test` for every new test file listed above; fix until green.
- [x] 6.2 Run `specbase validate --change add-idea-catalogue --strict`; fix until green.
- [x] 6.3 Run `specbase coverage --json`; confirm the new pairs are `complete` and no idea path appears in coverage.
- [x] 6.4 Run the `layout-conformance` binding and the `agents.idea-lifecycle` conformance bindings; confirm they exit zero.
