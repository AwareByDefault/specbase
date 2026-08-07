---
id: behavior.cli.review-panel-availability
---

<!--
  Leaf under the existing behavior/cli parent pair, which hoists the cross-command
  CLI invariants (verb–noun, --json, actionable errors, exit codes). This leaf
  states only the review-panel-specific availability surface and does not restate
  those inherited invariants.
-->

## ADDED Requirements

### Requirement: The review-panel skill is available in every project
**ID:** panel-available-every-project
`specbase init` and `specbase update` SHALL install the review-panel skill in
every project the user runs them in, whether the project's spec model is flat or
governed. A flat/legacy project SHALL receive the skill for the first time; it is
no longer conditioned on the governed model.

#### Scenario: A flat project gains the skill
**ID:** flat-gains-skill
- **WHEN** the user runs `specbase init` or `specbase update` in a project with
  no governed planes
- **THEN** the review-panel skill is present in the project's skill directory

#### Scenario: A governed project retains the skill
**ID:** governed-retains-skill
- **WHEN** the user runs `specbase init` or `specbase update` in a governed
  project
- **THEN** the review-panel skill is present

### Requirement: The installed skill names the project's own lenses
**ID:** skill-names-own-lenses
The review-panel skill a project receives SHALL name exactly the lenses its
resolved review model implies, so a consumer who selected a given set of planes
sees those lenses and no others.

#### Scenario: A governed project sees its declared plane lenses
**ID:** governed-sees-declared-lenses
- **WHEN** a governed project that declares the `ops` and `design` review lenses
  installs the skill
- **THEN** the installed skill names the `ops` and `design` lenses, not a fixed
  subset that omits them

#### Scenario: A flat project sees the general reviewer
**ID:** flat-sees-general-reviewer
- **WHEN** a flat project installs the skill
- **THEN** the installed skill names the single general spec-conformance reviewer
  and no plane lenses
