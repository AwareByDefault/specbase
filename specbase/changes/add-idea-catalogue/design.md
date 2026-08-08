## Context

The Specbase planning store has two homes: `specs/` (durable enforced truth)
and `changes/` (the path to mutate truth, with `changes/archive/` as the
done state). There is no home for a raw idea — something worth capturing
before it has earned a change's ceremony. Today such ideas are lost or
forced into a full proposal prematurely.

A change's lifecycle state is already **positional**: a change in
`changes/<id>/` is open; the same directory in `changes/archive/<date>-<id>/`
is done. The archive move IS the state transition. This change extends that
one position left: a directory in `ideas/<id>/` is an open idea, and
graduation to a change is a move from `ideas/` to `changes/`.

Constraints:
- Ideas must NOT become governed truth. The governed model's value is its
  honesty about what is enforced. Ideas are speculative and unverifiable by
  nature; admitting them as specs would corrupt that honesty.
- The existing change format is in production. Changes to it must be
  additive and backward-compatible where possible.
- Cross-platform (macOS/Linux/Windows): all paths via `path.join`.
- UUIDs available from `node:crypto` (Node ≥20.19).

## Goals / Non-Goals

**Goals:**
- A lightweight, ungoverned idea catalogue: a directory of scratchpads.
- An `ideas` CLI command group (add/list/show/delete) matching the existing
  noun-verb pattern (`store`, `workset`, `change`).
- Graduation by directory move: `propose` with an idea in context moves the
  idea into `changes/` and scaffolds the change inside it. No `graduate`
  command, no `state:` field, no link field. The move is the state and the
  link.
- A stable `id` field on ideas and changes that survives the
  `ideas/`→`changes/`→`archive/` moves (the archive move prepends a date;
  the id must not depend on the directory name).
- An agents-plane save-idea skill so an explore session on an idea can
  persist thinking to `notes.md` and close, resumable by a later explore.

**Non-Goals:**
- A TUI kanban board. The positional state model makes a future board a
  cheap render over `ideas/` + `changes/` + `archive/`, but the board itself
  is a separate later change. This change ships only the data model and
  the seam that makes a board possible.
- Change-side lifecycle sub-states (doing/review). Changes stay binary
  (open/archived). A future board may derive a "stale" flag from `created`
  without introducing new state.
- Agentic fan-out orchestration ("explore N ideas at once"). The catalogue
  enables it; this change does not ship the orchestrator.
- Tags, priority, assignee, effort on ideas. The yaml stays at four fields;
  interesting content lives in freeform `notes.md`.
- Spec-side changes. Governed specs are the destination an archived change
  mutates; they are not a position in this flow and are untouched.

## Decisions

### D1: State is positional, not a field. Three positions, three columns.

An idea in `ideas/` is open; a change in `changes/` is proposed; a change in
`changes/archive/` is done. No `state:` field anywhere. The directory IS the
state. This reuses the change's existing positional convention (open vs
archive) and extends it one position left. A future board reads three
directories; no unified index is required.

**Rejected:** a declarative `state:` field on ideas/changes. It would
introduce a dual-source invariant (field vs position must agree) for no
gain, since position already encodes the only states that matter.

**Rejected:** an `exploring` state distinct from `open`. Exploring is an
activity (an agent session working on an idea), not a lifecycle state. The
idea does not graduate *to* exploring; it just sits in `ideas/` until it
moves. A future board's "exploring" column would be an ephemeral signal
(session in progress), not stored state.

### D2: Graduation is a move performed by `propose`, not a command.

When `spcb:propose` (or `new change`) runs with an idea in context, it
moves `ideas/<id>/` to `changes/<id>/`, then scaffolds `proposal.md`,
`tasks.md`, `design.md`, and `specs/` inside it. The idea's `notes.md` and
scratchpad files are preserved as reference material within the change.
No `graduate` command exists; no `graduates_to`/`from-idea` link field.
The move is the link: "was this change once an idea?" → the change
directory contains a `notes.md` scratchpad.

**Rejected:** a `graduates_to` forward link on the idea and a `from-idea`
backward link on the change. The move makes both redundant — the
scratchpad files travel with the directory, so the archaeology is the
files, not a field.

**Rejected:** consuming/deleting the idea on graduation. The scratchpad
IS the "how did this start" archaeology; preserving it costs only disk.

### D3: Id is `<slug>-<short-uuid>`, stable across moves.

`specbase ideas add --title "dark mode"` produces id `dark-mode-x7k29f3a`
(slug from the title, plus 8 hex chars from `crypto.randomUUID()`). The id
is stored in `.openspec.yaml` and is the **only** field that must survive a
move. The directory is renamed to `changes/<id>/` on propose (no date
prefix yet) and to `changes/archive/<date>-<id>/` on archive (date prefix
added); the `id:` field inside is unchanged in both cases.

**Invariant:** the `id` field is immutable across moves; the directory name
is mutable presentation. A conformance test asserts that an object's `id`
field does not depend on its directory name (specifically: stripping a
leading `YYYY-MM-DD-` from an archive directory yields the id, and the id
in `.openspec.yaml` matches).

**Rejected:** sequential numeric ids (`0007`). They give an issue-number
feel but require a central counter and add nothing the uuid does not
provide. The slug prefix already gives readability; the uuid gives
uniqueness without a counter.

**Rejected:** full 36-char uuids. Per-repo idea buckets do not need global
uniqueness; 8 hex chars (≈4 billion) is ample and keeps paths manageable.

### D4: The idea data model is four yaml fields plus a freeform directory.

```
specbase/ideas/<id>/
  .openspec.yaml    { id, summary, created }
  notes.md          ← primary prose (convention, not parsed)
  <anything else>   ← images, refs, scratch files
```

`summary` is the one-line card text (from `--title`). `created` is an
ISO date for age (derived, never stored as "age"). No `state`, no
`graduates_to`, no tags. `notes.md` is the entry point by convention so an
agent (or human, or Obsidian pointed at the directory) knows where to
start; nothing parses or enforces the convention — the explore/save-idea
skills simply read and write `notes.md` first.

**Rejected:** a richer schema (priority, tags, assignee). Each field is a
schema to maintain and a field an agent must populate to graduate. Start
with four; add only what hurts.

### D5: Ideas are excluded from governed enumeration and validation.

`specbase validate`, `specbase coverage`, `specbase list --specs`, and the
artifact graph operate on `specs/` and `changes/` only. `ideas/` is not
scanned by these surfaces. This is the load-bearing honesty clause: the
governed store admits an ungoverned region without pretending it is truth.
Enforced by a conformance test asserting that no idea path appears in
`validate`/`coverage`/`list --specs` output.

### D6: `init` plants an empty `ideas/` directory.

Parallel to how `init` already plants `specs/` and `changes/`. Zero-cost,
default-on (not an opt-in prompt like the STE baseline — an empty
directory imposes nothing).

### D7: The save-idea skill is an agents-plane instrument.

A `SKILL.md` the repo owns, conformance-checked like the existing agents
instruments. It describes: invoked during (or at the close of) an explore
session on an idea, it appends the session's thinking to
`ideas/<id>/notes.md` under a `## Session <date>` heading (append, never
overwrite — prior sessions are prior context), optionally refines
`summary`, and signals the session closed. The explore skill's awareness
of an idea as its input unit (read `notes.md` to resume prior sessions)
is described in the same agents pair. Enforcement binds a conformance
check: the SKILL.md exists, declares the right trigger/frontmatter, and
its body directs the append-to-notes.md behavior.

### Enforcement mechanism per claim

| Claim | Mechanism | Why |
|---|---|---|
| `behavior.ideas` CLI contract | tests | behavioral; assert outputs/errors |
| `behavior.workflow.idea-graduation` move | tests | behavioral; assert dir moved + scratchpad preserved |
| `architecture.ideas` stable id across moves | conformance test | structural invariant; one test over the move paths |
| `architecture.ideas` exclusion from validate/coverage | conformance test | structural; assert no idea path in those outputs |
| `ops.planning-layout` includes `ideas/` | tests | ops; swap test holds |
| `agents.idea-lifecycle` skill conforms | conformance (command/test) | instrument conforms to its spec |

## Ris / Trade-offs

- **[Risk] The archive move's date prefix breaks naive id derivation.**
  Mitigation: the id lives in `.openspec.yaml`, not the directory name. A
  conformance test asserts id survives the prefix.
- **[Risk] A human manually moves an idea dir without updating `.openspec.yaml`.**
  Mitigation: the id field is the source of truth; a `doctor`/conformance
  check can flag id/dirname drift. Not gating for v1.
- **[Risk] Ideas accumulate forever in `ideas/`.**
  Mitigation: `delete` removes junk. Graduated ideas leave `ideas/`
  (they move to `changes/`), so `ideas/` holds only open ideas. Rot is
  bounded to genuinely open ideas; oldest-first `list` surfaces it.
- **[Risk] Backfilling `id` on existing archived changes is a migration.**
  Mitigation: derive id as the archive dir name with the leading date
  stripped; write it into `.openspec.yaml`. One-time script in tasks. The
  invariant applies going forward; backfill is best-effort.
- **[Trade-off] No `exploring` state means the board cannot show "in
  progress" without an ephemeral signal.** Accepted. The board is a later
  change; if it needs the signal, it can derive it (e.g. a lock file or a
  notes.md mtime) without a stored state field.

## Migration Plan

1. Add the `id` field to the change `.openspec.yaml` schema. New changes
   get an id at creation (`new change` generates `<slug>-<short-uuid>` if
   no idea context, or carries the idea's id).
2. Backfill existing archived changes: derive `id` as the archive dir name
   with leading `YYYY-MM-DD-` stripped; write into each `.openspec.yaml`
   if absent. Best-effort; the invariant is enforced going forward.
3. `init` gains `ideas/` planting. Existing repos get `ideas/` on next
   `init` (idempotent) or by running `specbase ideas add` (which creates
   `ideas/` lazily if absent).
4. No spec-format changes; existing governed specs are untouched.

**Rollback:** remove `src/commands/ideas.ts`, revert `init`/propose
changes, leave `ideas/` directories on disk (harmless). The `id` field on
changes is additive and ignorable by older tooling.
