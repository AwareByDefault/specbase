# Enforcement: CLI voice

Paired with `spec.md` (`design-system.cli-voice`). The plane splits cleanly here:
the deterministic sub-rules — which stream a message goes to, the exact wording
of three error paths, the status symbols, the `Next steps:` footer — are already
asserted by existing vitest suites and bind as `test`. The judgments — terse,
calm, non-blaming, one consistent vocabulary — bind the `design` lens.

Nothing is bound that a suite does not genuinely assert. In particular there is
**no test for `init`'s success output** (`test/core/init.test.ts` contains no
assertion on the summary, the next-steps list, or the restart hint), and **no
test for color meaning** (`test/core/view.test.ts` strips ANSI before asserting),
so both are carried by review only.

Known residue for the design lens: the update command currently prints both
`✔ Updated <tool>` (progress) and `✓ Updated: <tool> (vX)` (summary) — two
checkmark glyphs for one meaning. No test asserts either glyph, which is exactly
the kind of divergence `no-competing-symbols` exists to catch.

```yaml
version: 1
spec: design-system.cli-voice
bindings:
  - id: error-copy-tests
    covers: [non-blaming-errors, unsupported-input-lists-supported-set, undetected-state-offers-explicit-path, invalid-value-names-alternatives]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/completion.test.ts
      - test/cli-e2e/basic.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/completion.test.ts, test/cli-e2e/basic.test.ts]
      cwd: .
    limitations: >-
      Asserts the exact wording of three error paths — unsupported shell,
      undetected shell, invalid `--tools` value — each of which names the
      supported or available set. It proves those three messages carry a way
      forward; it says nothing about the tone of the rest of the error surface.

  - id: stream-routing-tests
    covers: [stream-routing, errors-on-stderr, json-only-on-stdout, failure-footer-on-stderr]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/cli-e2e/basic.test.ts
      - test/commands/validate.enriched-output.test.ts
    run:
      command: pnpm
      args: [test, --, test/cli-e2e/basic.test.ts, test/commands/validate.enriched-output.test.ts]
      cwd: .
    limitations: >-
      The e2e suite spawns the real CLI: it asserts errors land on stderr with a
      non-zero exit, and that every `--json` invocation it covers leaves stderr
      empty with parseable JSON on stdout. The footer test asserts the invalid
      summary and `Next steps:` reach stderr. Coverage is per-command, not a
      sweep over every command that accepts `--json`.

  - id: status-symbol-tests
    covers: [status-vocabulary, change-state-symbols, delta-operation-symbols]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/view.test.ts
      - test/core/archive.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/view.test.ts, test/core/archive.test.ts]
      cwd: .
    limitations: >-
      Asserts `✓` for completed and `○` for draft changes in the dashboard, and
      the `+ ~ - →` delta totals line in archive output. It pins the glyphs where
      they are asserted; it cannot prove no other command uses a different glyph
      for the same state.

  - id: next-steps-tests
    covers: [actionable-next-steps, update-names-what-changed, invalid-result-next-steps-footer]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/update.test.ts
      - test/commands/validate.enriched-output.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/update.test.ts, test/commands/validate.enriched-output.test.ts]
      cwd: .
    limitations: >-
      Asserts the update success message names the tool and the installed
      version, and that an invalid validation ends with `Next steps:` plus a
      suggested command. The `init` success summary — categorized tools, next
      steps, restart hint — has no test and is reviewed instead.

  - id: copy-voice-review
    covers: [terse-calm-copy, outcome-then-action, no-filler, no-internal-narration, ascii-safe-success-copy, never-blames, actionable-next-steps, success-summary-and-next-steps]
    mechanism: review
    strength: review
    status: active
    lens: design
    targets:
      - src/core/init.ts
      - src/core/update.ts
      - src/core/view.ts
      - src/commands/validate.ts
    review:
      procedure: >-
        Collect every user-facing string the change adds or edits (console
        output, error messages, prompts). For each string apply four checks.
        (1) Terseness — could a word be removed without losing meaning? Flag
        filler, exclamation marks, self-congratulation, and apologies for the
        tool's own behavior. (2) Blame — rewrite any message that names what the
        user did wrong into one that names the condition and the way forward;
        confirm no error ends without a next action. (3) Narration — flag any
        message naming an internal module, function, or data structure rather
        than the user-meaningful step. (4) Rendering — confirm success messages
        use ASCII apart from the shared status symbols, so they survive a
        terminal without extended font support. Then run `openspec init` and
        `openspec update` in a scratch directory and confirm the success output
        gives a categorized created/refreshed/skipped summary, the next steps,
        and the restart hint.
      inputs:
        - src/core/init.ts
        - src/core/update.ts
        - src/core/view.ts
        - src/commands/validate.ts
    limitations: >-
      Judgment-only, and the `init` success-output claim has no automated backing
      at all — a regression there is caught only by this review or by a user.
    covered_by: [error-copy-tests, next-steps-tests]

  - id: visual-vocabulary-review
    covers: [status-vocabulary, status-colors, progress-bar-glyphs, no-competing-symbols]
    mechanism: review
    strength: review
    status: active
    lens: design
    targets:
      - src/core/view.ts
      - src/core/init.ts
      - src/core/update.ts
    review:
      procedure: >-
        Grep the source for status glyphs (`✓`, `✔`, `○`, `●`, `×`, `✗`, `+`,
        `~`, `-`, `→`, `█`, `░`) and for chalk color calls. Build the observed
        state-to-glyph and state-to-color mapping. Flag any state carrying two
        glyphs or two colors, and any new glyph or color introduced for a state
        that already has one. Confirm the color meanings hold: green complete,
        yellow active/ready, red blocked/failed, cyan specifications, dim
        supplementary. Confirm every progress bar uses the same filled/light
        block pair.
      inputs:
        - src/core/view.ts
        - src/core/init.ts
        - src/core/update.ts
    limitations: >-
      Color meaning has no test — `test/core/view.test.ts` strips ANSI before
      asserting — so the whole colour mapping rests on this review. The glyph
      sweep is a grep, not an exhaustive index of output sites.
    covered_by: [status-symbol-tests]
```
