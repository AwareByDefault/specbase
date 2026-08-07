---
id: behavior.cli.ste-lint
---

<!--
  Behavioral leaf under the `behavior/cli` parent pair. It inherits the hoisted
  cross-command invariants (verb–noun structure, clean `--json`, actionable
  errors, exit-code separation) from `behavior.cli` and does not restate them;
  this leaf owns only the `ste-lint` command's own contract.
-->

## ADDED Requirements

### Requirement: ste-lint scores prose from files, globs, or stdin
**ID:** ste-lint-input-modes
The `ste-lint` command SHALL score prose against the Simplified Technical English
rule set. It SHALL accept one or more file paths and glob patterns as positional
arguments, and SHALL read from standard input when no path is given. It SHALL
score prose only, ignoring fenced and inline code spans so that code is never
counted as a violation.

#### Scenario: Files and globs are scored
**ID:** input-files-and-globs
- **WHEN** a user runs `ste-lint` with file paths or glob patterns
- **THEN** every matched file is scored and reported by name

#### Scenario: Standard input is scored when no path is given
**ID:** input-stdin
- **WHEN** a user pipes text to `ste-lint` with no path argument
- **THEN** the piped text is scored as a single document

#### Scenario: Code spans are excluded from scoring
**ID:** code-spans-excluded
- **WHEN** the scored text contains fenced or inline code
- **THEN** the code content contributes no violations and no words to the metric

### Requirement: Each document reports violation counts and a normalized density
**ID:** ste-lint-violation-report
For each scored document, `ste-lint` SHALL report a count per violation category
and a `total_per100w` density — the total violation count normalized to per one
hundred prose words — so that documents of different lengths are comparable. The
reported categories SHALL cover the rule set the adopted standard names, at
minimum marketing adjectives, banned words, phrasal verbs, passive voice,
nominalizations, over-long sentences, and em-dash slop markers.

#### Scenario: Counts and density are reported per document
**ID:** per-document-metric
- **WHEN** a document is scored
- **THEN** the report gives a count for each violation category, a total, and the
  `total_per100w` density for that document

#### Scenario: Density normalizes for length
**ID:** density-normalizes-length
- **WHEN** two documents have the same violation count but different word counts
- **THEN** the shorter document reports the higher `total_per100w`

### Requirement: ste-lint emits a single machine-readable aggregate on --json
**ID:** ste-lint-json-aggregate
With `--json`, `ste-lint` SHALL write exactly one JSON document to stdout holding
the per-document reports and an aggregate across all scored documents, and SHALL
suppress all decorative output. This is the leaf realization of the parent
`behavior.cli` `--json` invariant; the parent owns the general contract.

#### Scenario: JSON aggregate is the only thing on stdout
**ID:** json-aggregate-clean
- **WHEN** `ste-lint --json` scores one or more documents
- **THEN** stdout parses as a single JSON document containing each document's
  report and an aggregate total

### Requirement: A threshold gates the exit code
**ID:** ste-lint-threshold-gate
`ste-lint` SHALL accept a `--max <n>` threshold and SHALL exit non-zero when the
scored result exceeds it, so the command is usable as an automated gate. Without
`--max`, `ste-lint` SHALL report and exit zero, staying a pure reporter.

#### Scenario: Exceeding the threshold fails
**ID:** over-threshold-fails
- **WHEN** `ste-lint --max <n>` scores prose whose gated result exceeds `<n>`
- **THEN** the command reports the offending documents and exits non-zero

#### Scenario: Within the threshold passes
**ID:** within-threshold-passes
- **WHEN** `ste-lint --max <n>` scores prose whose gated result is at or below `<n>`
- **THEN** the command exits zero

#### Scenario: No threshold never fails on content
**ID:** no-threshold-reports-only
- **WHEN** `ste-lint` runs without `--max`
- **THEN** it reports counts and exits zero regardless of the violation density

### Requirement: Severity separates blocking categories from stylistic ones
**ID:** ste-lint-severity
`ste-lint` SHALL classify each violation category as an error or a warning. Banned
words and marketing adjectives SHALL be errors by default; stylistic categories
such as over-long sentences, passive voice, and em-dashes SHALL be warnings unless
a threshold promotes them. The report SHALL distinguish the two severities.

#### Scenario: Default error categories are marked
**ID:** default-errors-marked
- **WHEN** a document contains a banned word or a marketing adjective
- **THEN** the report marks that category as an error

#### Scenario: Stylistic categories default to warnings
**ID:** default-warnings-marked
- **WHEN** a document contains over-long sentences, passive voice, or em-dashes
  and no threshold promotes them
- **THEN** the report marks those categories as warnings
