# `openspec-old/` — Retired historical archive

**Status: RETIRED. Read for history. Never a source of current requirements.**

This directory is the repository's *previous* planning store, from before the
migration to the governed Specbase model. It was renamed from the root-level
`openspec/` directory and is preserved verbatim as dated history.

## The current planning root is `specbase/`

All current spec truth, enforcement pairs, and in-flight changes live under
[`specbase/`](../specbase/). The CLI resolves `specbase/` as the planning root;
nothing under `openspec-old/` is discovered by `openspec list`, `status`,
`validate`, or `coverage`.

See the governed pair `ops/planning-layout` in `specbase/specs/` for the
normative statement of this layout.

## What is in here

| Path | Contents |
|---|---|
| `specs/` | 36 flat, pre-governed capability specs (~246 requirements) |
| `changes/` | 21 unarchived change deltas (~205 requirement entries) |
| `changes/archive/` | 82 archived changes — the dated project history |
| `explorations/`, `initiatives/`, `work/` | process history, not spec truth |
| `config.yaml` | the legacy (`spec-driven`, ungoverned) store config |

## Rules for this directory

1. **Do not add to it.** New requirements, changes, and explorations go in
   `specbase/`.
2. **Do not update it.** When a requirement changes or is removed, the change is
   recorded in `specbase/`; the copy here stays as the historical record.
3. **Do not cite it as current truth.** If a claim here matters today, it has
   been migrated into `specbase/` — cite that locator instead. If it has *not*
   been migrated, the migration manifest records why (see below).
4. **Reading is fine and encouraged.** Rationale, prior art, and the archived
   change history are legitimately useful context.

## Where the truth went

The requirement-level migration manifest —
`specbase/changes/migrate-specbase-specs/mapping.md` — accounts for every
requirement in `specs/` and in the unarchived `changes/*/specs/` deltas with a
`keep` / `promote` / `demote` / `drop` verdict and a destination locator in the
`specbase/` tree. Drops carry a recorded reason. Nothing was dropped silently.

The organizing rules behind the rewrite are in
[`docs/clean-specbase.md`](../docs/clean-specbase.md).
