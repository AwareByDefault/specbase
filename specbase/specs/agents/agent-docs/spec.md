---
id: agents.agent-docs
---

### Requirement: Agent instructions open with a quick reference
**ID:** quick-reference-first
The root `AGENTS.md` SHALL open with a quick-reference section that surfaces the
required file structures, templates, and formatting rules before any narrative
guidance, and SHALL name the stores and surfaces an agent needs to act in this
repository.

#### Scenario: Structures come before narrative
**ID:** structures-before-narrative
- **WHEN** `AGENTS.md` is read from the top
- **THEN** the first substantive section after the title is a quick reference
  carrying copy-ready structures for `proposal.md`, `tasks.md`, spec deltas, and
  scenario formatting
- **AND** each structure links to the workflow step that explains it

#### Scenario: The current store and surface are named
**ID:** store-and-surface-named
- **WHEN** an agent reads the quick reference to orient itself
- **THEN** it finds that the planning store is `specbase/`, that the skill and
  slash-command surface is `spcb`, and a pointer to `docs/clean-specbase.md`
  for how the spec tree is organized

### Requirement: Templates and examples sit where the edits happen
**ID:** embedded-templates
`AGENTS.md` SHALL include complete copy/paste templates and inline examples at
the point where an agent makes the corresponding edit.

#### Scenario: Fenced templates match the required structure
**ID:** fenced-templates-match
- **WHEN** an agent reaches the guidance for drafting a proposal or a spec delta
- **THEN** `AGENTS.md` provides fenced Markdown templates matching the required
  structure — `## Why`, `## ADDED Requirements`, `### Requirement:`,
  `#### Scenario:`, and the paired `enforcement.md` binding block

#### Scenario: Each template carries a worked example
**ID:** template-has-example
- **WHEN** a template is presented
- **THEN** a brief example accompanies it showing correct header usage,
  requirement/scenario `**ID:**` placement, and scenario bullet form

### Requirement: A pre-validation checklist precedes validation
**ID:** pre-validation-checklist
`AGENTS.md` SHALL offer a concise pre-validation checklist that names the common
formatting mistakes to check before running `openspec validate`.

#### Scenario: Common validation failures are listed
**ID:** common-failures-listed
- **WHEN** a reader reaches the validation guidance
- **THEN** a checklist reminds them to verify requirement headers, `**ID:**`
  lines, `#### Scenario:` usage, delta section headers, and descriptive
  requirement text before the first scenario

#### Scenario: Pair and binding checks are included
**ID:** pair-checks-included
- **WHEN** the checklist is applied to a governed change
- **THEN** it also requires an `enforcement.md` beside every governed `spec.md`,
  a `spec:` matching the paired frontmatter `id`, and every `active` binding
  actually run

### Requirement: Workflow guidance is progressively disclosed
**ID:** progressive-disclosure
`AGENTS.md` SHALL separate beginner essentials from advanced topics so a
newcomer can complete the core steps without losing access to the deeper
material.

#### Scenario: Essentials are limited to the core steps
**ID:** essentials-are-minimal
- **WHEN** an agent reads the introductory guidance
- **THEN** it is limited to the minimum steps — scaffold, draft, validate,
  request review

#### Scenario: Advanced topics are labeled and linked
**ID:** advanced-labeled-and-linked
- **WHEN** an agent needs multi-capability changes, plane placement, enforcement
  depth, or archiving detail
- **THEN** those topics sit in clearly labeled later sections, reachable by
  anchor links from the quick reference

### Requirement: The docs teach behavior-first spec authoring
**ID:** behavior-first-guidance
`AGENTS.md` SHALL explicitly teach that a spec captures observable behavior
contracts while implementation detail belongs in `design.md` or `tasks.md`.

#### Scenario: Spec content is distinguished from implementation content
**ID:** spec-versus-implementation
- **WHEN** `AGENTS.md` explains how to write a `spec.md`
- **THEN** it instructs the agent to state externally verifiable behavior —
  inputs, outputs, errors, and constraints
- **AND** it instructs the agent to keep library, framework, and vendor choices
  and class- or function-level detail out of the requirements

#### Scenario: Detail is routed to the right artifact
**ID:** detail-routed
- **WHEN** implementation detail is necessary
- **THEN** the guidance directs the agent to place it in `design.md` or
  `tasks.md`, never in the requirements body of `spec.md`

### Requirement: The docs promote lightweight-by-default authoring
**ID:** lightweight-by-default-guidance
`AGENTS.md` SHALL promote minimal ceremony and rigor proportional to risk.

#### Scenario: Rigor scales with risk
**ID:** rigor-scales-with-risk
- **WHEN** an agent drafts specs for a routine change
- **THEN** the guidance favors concise requirements and scenarios
- **AND** it reserves fuller specification for higher-risk work such as API
  breaks, migrations, cross-team surfaces, and security or privacy changes

#### Scenario: Smallest reviewable spec wins
**ID:** smallest-reviewable-spec
- **WHEN** the guidance discusses the drafting workflow
- **THEN** it directs the agent to produce the smallest spec that is still
  testable and reviewable, and to prefer an honest review binding over a hollow
  automated check
