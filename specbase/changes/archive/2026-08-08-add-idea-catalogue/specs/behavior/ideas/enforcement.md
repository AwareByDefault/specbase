# Enforcement: Idea catalogue CLI

Paired with `spec.md` (`behavior.ideas`). The CLI contract is behavioral and
asserted by example tests over the command outputs and the not-governed
exclusion. The ungoverned-exclusion claim is structural and binds a
conformance check that no idea path appears in the governed surfaces.

```yaml
version: 1
spec: behavior.ideas
bindings:
  - id: ideas-cli-contract
    covers:
      - ideas-add
      - add-with-title-and-note
      - slug-derived-from-title
      - uniqueness-without-counter
      - ideas-list
      - list-oldest-first
      - list-json
      - ideas-show
      - show-metadata-and-notes
      - ideas-delete
      - delete-junk-idea
      - delete-graduated-rejected
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/ideas.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/ideas.test.ts]
      cwd: .
    limitations: Asserts add/list/show/delete outputs and error paths against a fixture store. Does not exercise the propose-move seam (covered by behavior.workflow.idea-graduation).

  - id: ideas-not-governed-exclusion
    covers:
      - ideas-not-governed
      - idea-has-no-enforcement-pair
      - governance-excludes-ideas
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/ideas/not-governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/ideas/not-governed.test.ts]
      cwd: .
    limitations: Asserts validate/coverage/list --specs emit no path under specbase/ideas/ against a fixture store containing an idea. Does not prove the exclusion holds for every future governed command; that is a conformance invariant bound to the architecture.ideas resolver behavior.
