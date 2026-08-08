## Why

Specbase captures durable, enforced truth (specs) and the path to mutate it
(changes), but it has no home for the upstream stage: a raw idea that has not
earned the ceremony of a change. Today an idea either lives in your head or
gets forced into a full change proposal before it is ready. This change adds a
lightweight, **ungoverned** idea catalogue — a bucket of scratchpad
directories — that becomes the entry point of an agentic pipeline: an agent
can explore ideas from the catalogue and draft proposals from them without
human attendance, and the human approves at the archive gate as usual.

The catalogue is deliberately not part of the governed truth model. Ideas
carry no enforcement pair, no spec deltas, and no validation. The only
governed contact is the seam where an idea *becomes* a change: graduation is a
directory move, reusing the same positional-state convention changes already
use (`changes/` open vs `changes/archive/` done), extended one position left
to `ideas/` open.

## What Changes

- Add an `ideas/` directory to the planning store as the home for idea
  scratchpads, created at `init` alongside the existing `specs/` and
  `changes/`.
- Add an `ideas` CLI command group: `add`, `list`, `show`, `delete`. No
  `graduate` command — graduation is the move that `propose` performs.
- An idea is a directory `specbase/ideas/<id>/` containing a `.openspec.yaml`
  with four fields (`id`, `summary`, `created`, and a freeform scratchpad of
  files led by `notes.md`). The directory is a scratchpad: images, refs, and
  any supporting material may live alongside `notes.md`.
- Idea ids are `<slug>-<short-uuid>`: a human-readable slug plus a short
  unique suffix, so `ls` is readable and no central counter is needed.
- Idea state is **positional and unary**: an idea in `ideas/` is open. When
  `propose` runs with an idea in context it moves the idea directory into
  `changes/` and scaffolds the change artifacts inside it — the move IS the
  graduation, and the scratchpad (`notes.md`) travels with it as reference
  material. No `state:` field, no `graduates_to` link: the move is the link.
- Add an agents-plane instrument: a **save-idea** skill (and explore-from-idea
  awareness) so an explore session on an idea can persist its thinking to
  `notes.md` and close, to be resumed by a later explore session that
  hopefully ends in propose.
- **BREAKING (to the change metadata format):** the change `.openspec.yaml`
  gains a stable `id` field so an idea carries its identity forward when it
  is moved to `changes/`, and so a change's id survives the archive move's
  date-prefix rename. Existing archived changes have no `id`; this change
  documents the invariant for new and moving objects, and a migration may
  backfill ids for existing archives (see tasks).

## Planes

### Behavioral truth

- `behavior.ideas`: the idea catalogue CLI contract — `add` (title→slug-uuid
  id, seeds `notes.md`), `list` (default open oldest-first; `--all`),
  `show`, `delete` (refuses a graduated idea without `--force`). Includes the
  honesty clause: ideas are not governed truth, carry no enforcement, and are
  excluded from `validate`/`coverage`. (new)
- `behavior.workflow.idea-graduation`: `propose`, run with an idea in
  context, moves the idea directory into `changes/` and scaffolds the change
  inside it; the idea's `notes.md` is preserved as reference material. (new)

### Architectural truth

- `architecture.ideas`: the `ideas/` store location; the stable-id invariant
  (an object's `id` field is immutable across the `ideas/`→`changes/`→
  `archive/` moves); ideas are excluded from the governed enumeration and
  validation surfaces. (new)

### Ops

- `ops.planning-layout`: the planning root now includes `ideas/` alongside
  `specs/` and `changes/`. Swap-test trigger: where the store lives is an ops
  concern. (modified)

### Agents

- `agents.idea-lifecycle`: the repo's idea-capture instruments — the
  save-idea skill (persist an explore session to `notes.md` and close) and
  the explore skill's awareness of an idea as its input unit (read `notes.md`
  to resume). Describes the SKILL.md artifacts; enforcement binds a
  conformance check against them. (new)

## Spec pairs

- `behavior.ideas` -> paired enforcement via tests (CLI contract: add/list/
  show/delete outputs and the not-governed exclusion)
- `behavior.workflow.idea-graduation` -> paired enforcement via tests
  (propose-with-idea moves the directory and preserves the scratchpad)
- `architecture.ideas` -> paired enforcement via a conformance test (stable
  id across moves; ideas excluded from validate/coverage enumeration)
- `ops.planning-layout` -> paired enforcement via tests (planning root
  includes `ideas/`; swap test holds)
- `agents.idea-lifecycle` -> paired enforcement via a conformance check
  against the SKILL.md frontmatter/body (instrument conforms to its spec)

## Impact

- Affected code: new `src/commands/ideas.ts` (command group); new
  `src/core/ideas/` (create/list/show/delete, id generation, the move-on-
  propose seam); `src/core/init.ts` (plant `ideas/`); `src/cli/index.ts`
  (register the command); completion registry (register `ideas` and
  options); `src/core/workflow` propose path (perform the idea→change move
  when an idea is in context); change `.openspec.yaml` schema (add `id`).
- Affected specs: `ops.planning-layout` (amended). No spec-format changes
  to governed specs themselves — `spec.md`/`enforcement.md` pairs are
  untouched.
- Affected tools/skills: new `save-idea` SKILL.md; explore skill gains idea
  input awareness (documented, conformance-checked).
- Dependencies: none new. UUID generation uses Node's `crypto.randomUUID`
  (already available, Node ≥20.19).
- Recursion note: this idea catalogue is itself the kind of idea the
  catalogue captures. The proposal's *Why* records that the idea "add an
  idea catalogue" could have been an entry in the catalogue it introduces.
