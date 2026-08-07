# Enforcement: STE adoption for project docs

Paired with `spec.md` (`ops.ste`). The adopted tool is the honest gate: a
`command` binding runs `specbase ste-lint --json --max <n>` over the declared
doc glob and gates on the threshold. Above that automated floor sits the residue
a linter cannot judge — clarity and one-topic-per-sentence intent — bound as an
`ops`-lens `review` whose `covered_by` names the command binding, so the lens
reviews only what the gate cannot reach.

The `ste-doc-gate` binding starts `planned`: the adopter declares their own doc
glob and a non-zero `--max` threshold (measured from their real backlog, not a
zero-violation bar) before flipping it to `active`.

```yaml
version: 1
spec: ops.ste
bindings:
  - id: ste-doc-gate
    covers: [ste-is-the-writing-standard, governed-docs-in-ste, ste-lint-is-the-adopted-tool, adopted-tool-gates-docs, scoped-not-boil-the-ocean]
    mechanism: command
    strength: automated
    status: planned
    targets:
      - README.md
    run:
      command: specbase
      args: [ste-lint, --json, --max, "8", "README.md", "docs/**/*.md"]
      cwd: .
    limitations: Runs the adopted STE tool over the declared doc glob at the declared `--max` threshold and fails when a document exceeds it. The glob and threshold are the scoped truth of what this repo gates today, not every file at zero; the threshold is a recorded ops decision. It proves the counted violations stay under the bar, not that the prose reads well. The adopter sets the glob and threshold from their own backlog before activating.

  - id: ste-clarity-review
    covers: [ste-is-the-writing-standard, governed-docs-in-ste]
    mechanism: review
    strength: review
    status: active
    targets:
      - README.md
      - docs
    review:
      lens: ops
      procedure: >-
        Over the same doc set the gate covers, read for the STE qualities the
        linter cannot count: does each sentence carry one topic, is the intent
        unambiguous, and does the prose stay concrete rather than merely staying
        under the violation threshold. Record any doc that passes the count gate
        but still reads as unclear or multi-topic as a finding. Review only the
        residue above the automated gate; the counted categories are the command
        binding's job.
      inputs:
        - README.md
        - docs
    limitations: Review-strength residue above the automated gate. It is judgment about clarity and one-topic-per-sentence intent, not a pass/fail count, and it never gates.
    covered_by: [ste-doc-gate]
```