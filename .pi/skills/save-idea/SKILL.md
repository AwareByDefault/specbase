---
name: save-idea
description: Save an explore session's thinking to an idea's scratchpad. Use during or at the close of an explore session on an idea, when the session produced durable insights the user wants kept.
allowed-tools: Bash(specbase:*)
license: MIT
compatibility: Requires specbase CLI.
metadata:
  author: specbase
  version: "1.0"
  generatedBy: "1.6.0"
---

Save the current explore session's accumulated thinking to the idea's
scratchpad so a later session can resume from it.

Run `specbase ideas show <id> --json` first to confirm the idea is still open
(under `specbase/ideas/`) and to read the existing `notes.md`. An idea already
moved into `specbase/changes/` is a proposed change, not an idea — do not save
into it.

## Append to notes.md — never overwrite

Append the session's thinking to `specbase/ideas/<id>/notes.md` under a dated
heading:

```
## Session 2026-08-08

- what we explored
- decisions that emerged
- open questions
- threads for next time
```

- **Append, never overwrite.** Read the existing file and add the new
  `## Session <date>` section at the end. Prior `## Session` sections are
  resumption context and MUST stay unchanged. The rule is: always append,
  never overwrite.
- One section per session. If a `## Session <date>` heading for today already
  exists, extend that section instead of creating a duplicate.

## May refine summary

If the session sharpened the one-line intent, update `summary` in
`specbase/ideas/<id>/.openspec.yaml`. Never change the idea's `id` or
`created`.

## Never write governed artifacts

The idea is a scratchpad, not spec truth. Do NOT create or edit
`spec.md`, `enforcement.md`, or any spec-delta content under
`specbase/ideas/` or anywhere else. If the session is proposal-ready, hand
off to the propose workflow instead — proposing moves the idea into
`specbase/changes/<id>/`.
