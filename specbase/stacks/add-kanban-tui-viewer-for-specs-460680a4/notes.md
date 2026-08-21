## Historical context

The original idea explored a much larger product: a web editor driving a headless agent harness, chat, queued/saved workflows, automated delivery, an Elysia/Bun web application, and a monorepo. That exploration motivated asking how a project could move from ideas through proposals and archives, but it is not normative scope for this stack.

## Scope of this stack

This stack contains three terminal-first, local Specbase slices only:

1. a viewer-only OpenTUI lifecycle board;
2. advisory local file-activity awareness; and
3. a durable queue for fixed Specbase-owned `explore`, `propose`, `apply`, `verify`, and `archive` actions.

## Explicit exclusions

A web editor, browser UI, chat, Elysia/web services, monorepo migration, saved or user-defined workflows, remote/multi-user scheduling, and Git delivery (`commit`, `push`, `merge`, or `deploy`) are excluded. None is implied by V1-V3 and none may be added while implementing this stack.

Any excluded outcome requires a separate future idea, proposal, design, governed deltas, evidence plan, and review. In particular, Git delivery must be handled by a later Git-delivery change rather than extending V3's Specbase-owned action vocabulary.
