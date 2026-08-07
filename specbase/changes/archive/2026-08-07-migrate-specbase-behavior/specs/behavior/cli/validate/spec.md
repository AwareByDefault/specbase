---
id: behavior.cli.validate
---

## ADDED Requirements

### Requirement: Validation targets one item, a filtered set, or everything
**ID:** validation-scope
The validate command SHALL accept a single item name, `--all`, `--changes`, or
`--specs`. Bulk scopes SHALL cover every active change and every capability that
has a spec, and SHALL exclude the archive directory.

#### Scenario: A named item is validated on its own
**ID:** targeted-validation
- **WHEN** a user validates a single named item
- **THEN** only that item is validated and its result is reported

#### Scenario: Bulk scopes cover changes and specs
**ID:** bulk-scope
- **WHEN** a user validates with `--all`
- **THEN** every active change and every spec is validated
- **AND** `--changes` and `--specs` restrict the run to that one kind

#### Scenario: Archived changes are never validated
**ID:** archive-excluded
- **WHEN** a bulk scope that includes changes is validated
- **THEN** changes under the archive directory are not included

### Requirement: Validation resolves items exactly as the rest of the CLI does
**ID:** item-resolution
The validate command SHALL treat a name as a change when a change directory of
that name exists, independent of whether the change has authored any document
yet, and SHALL treat a name as a spec when its spec file exists. Resolution
SHALL be identical for targeted runs, bulk runs, and the selection prompt, and
SHALL discover delta specs at any nesting depth beneath the change.

#### Scenario: A scaffolded change with no authored proposal still resolves
**ID:** proposal-less-change-resolves
- **WHEN** a user validates a change directory that has no proposal document yet
- **THEN** the change is resolved and validated
- **AND** it is not reported as an unknown item

#### Scenario: Bulk runs and the picker see the same changes
**ID:** resolution-parity
- **GIVEN** a change that the status command lists
- **WHEN** the user runs a bulk validation, or is offered the selection prompt
- **THEN** that change is included in both

#### Scenario: Nested delta specs are discovered
**ID:** nested-delta-discovery
- **WHEN** a change's delta specs live more than one directory below the
  change's spec folder
- **THEN** those delta specs are discovered and validated
- **AND** the change is not reported as having no deltas

#### Scenario: A resolved but invalid item still fails
**ID:** resolved-invalid-fails
- **WHEN** an item resolves but does not satisfy validation
- **THEN** the run reports its issues and does not report success

#### Scenario: An ambiguous name is rejected before any work
**ID:** ambiguity-aborts
- **WHEN** the named item matches both a change and a spec
- **THEN** nothing is validated and the ambiguity is reported

### Requirement: A bulk run reports every item and an aggregate verdict
**ID:** bulk-reporting
A bulk run SHALL report a per-item result carrying the item's name, kind, and
issues, and SHALL report totals of passed and failed items broken down by kind.
The run SHALL fail when any item failed. Items SHALL be validated with a bounded
number in flight so reporting stays responsive.

#### Scenario: Per-item results and totals are reported
**ID:** per-item-and-totals
- **WHEN** a bulk validation completes
- **THEN** each item's name, kind, and validity are reported
- **AND** a summary reports how many items passed and failed, by kind

#### Scenario: One failed item fails the run
**ID:** any-failure-fails-run
- **WHEN** at least one item in a bulk run is invalid
- **THEN** the run reports failure rather than success

#### Scenario: Work in flight is bounded
**ID:** bounded-concurrency
- **WHEN** many items are validated and a concurrency limit is supplied
- **THEN** no more than that many validations run at once
- **AND** the reported results are unchanged by the limit

### Requirement: Strict validation promotes warnings to failures
**ID:** strict-mode
The validate command SHALL accept a strict option that treats every warning as
an error, so an item with warnings and no errors fails under strict validation
and passes without it.

#### Scenario: A warning fails only under strict
**ID:** warning-fails-strict
- **GIVEN** an item whose only issues are warnings
- **WHEN** it is validated with the strict option
- **THEN** the item is reported invalid
- **AND** the same item is reported valid without the strict option

### Requirement: Each validation issue tells the author how to fix it
**ID:** actionable-diagnostics
Every validation issue SHALL name the expected structure, show a copyable
example of the correct form, and — where one exists — name the command that
reveals more detail. Under the governed model this SHALL extend to declared
planes: an unknown plane root, a spec identity whose plane prefix is not
declared, and an invalid plane declaration SHALL each be reported with the
offending source location.

#### Scenario: A change with no deltas explains the delta sections
**ID:** no-deltas-guidance
- **WHEN** a change is validated and no deltas were parsed
- **THEN** the issue names the operation section headers a delta file must use
- **AND** names where delta files must live
- **AND** names the command that dumps the parsed deltas for debugging

#### Scenario: A missing section comes with a skeleton
**ID:** missing-section-guidance
- **WHEN** a required document section is missing
- **THEN** the issue names the expected header
- **AND** includes a minimal example of that section ready to copy

#### Scenario: A requirement without descriptive text is explained
**ID:** missing-body-guidance
- **WHEN** a requirement header is followed directly by a scenario with no
  descriptive text between them
- **THEN** the issue explains that a requirement header must be followed by
  narrative text
- **AND** shows a compliant example

#### Scenario: A pair under an undeclared plane is reported
**ID:** unknown-plane-root
- **WHEN** a governed pair sits under a directory that is not a declared plane
- **THEN** the issue names the unknown plane, its source path, and the declared
  planes

#### Scenario: A spec identity with an undeclared plane prefix is reported
**ID:** unknown-plane-prefix
- **WHEN** a governed spec declares an identity whose leading segment is not a
  declared plane
- **THEN** the issue names the unknown prefix and the source path

#### Scenario: An invalid plane declaration is reported per violation
**ID:** invalid-plane-declaration
- **WHEN** the resolved plane set contains a malformed identifier, a duplicate,
  a reserved word, or a plane with no stated purpose
- **THEN** each violation is reported with its source location and offending
  field

### Requirement: Bulleted scenario prose is recognized and corrected
**ID:** scenario-format-warning
When a requirement has bullets that read like scenario steps but no scenario
headers, validation SHALL warn that scenarios need their own header and SHALL
show the converted form.

#### Scenario: Step bullets without a scenario header warn
**ID:** bulleted-steps-warn
- **WHEN** a requirement contains step bullets and no scenario header
- **THEN** a warning says scenarios must use a scenario header
- **AND** the warning includes a converted example of those bullets

### Requirement: Every issue names where it is
**ID:** issue-location
Every error, warning, and note SHALL carry the path of the file it came from and
a structured location within that file's parsed shape.

#### Scenario: A schema failure carries file and path
**ID:** issue-file-and-path
- **WHEN** an item fails structural validation
- **THEN** the issue names the source file and the structured location inside it
- **AND** carries a remediation hint where one applies

### Requirement: A failed human-readable run ends with a next-steps footer
**ID:** next-steps-footer
When an item is invalid and output is human-readable, the command SHALL close
with a next-steps footer that summarizes the issue counts, gives a short list of
guidance targeted at the most blocking issues, and names the machine-readable
and debugging commands to run next.

#### Scenario: An invalid item gets the footer
**ID:** footer-on-invalid
- **WHEN** validation of an item fails in human-readable mode
- **THEN** a next-steps footer is printed with issue counts and targeted
  guidance

### Requirement: Unrecognized headers inside delta sections are surfaced, not swallowed
**ID:** delta-header-notes
When a change's delta section contains a section header the delta reader skips,
validation SHALL emit a note naming that header, derived from the headers the
reader actually skipped. The note SHALL NOT change which headers count as
requirements and SHALL NOT change the pass/fail verdict, including under strict
validation. Main specs SHALL NOT receive such notes.

#### Scenario: A stray header is named
**ID:** stray-header-noted
- **WHEN** a delta section contains a section header that is not a requirement
  header
- **THEN** a note names that header
- **AND** the pass/fail verdict is unchanged, including under strict validation

#### Scenario: An unnamed requirement header gets its own note
**ID:** nameless-header-note
- **WHEN** a delta section contains a requirement header with no name after it
- **THEN** the note says the header is missing a requirement name

#### Scenario: Main specs are unaffected
**ID:** main-spec-headers-unaffected
- **WHEN** a main spec uses bare statement headers for its requirements
- **THEN** those headers are still recognized as requirements
- **AND** no skipped-header note is emitted

### Requirement: The body-keyword hint reads the same on specs and on deltas
**ID:** body-keyword-hint
When a requirement carries its normative keyword only in its header and not in
its body, validation SHALL emit the targeted hint telling the author to move the
statement into the body, exactly once, with an actionable sentence identical to
the one emitted for change deltas. This SHALL hold on every main-spec validation
surface. A requirement with no normative keyword anywhere SHALL still fail with
the general message, and renamed requirements SHALL NOT receive the hint.

#### Scenario: A main spec with the keyword only in the header
**ID:** header-only-keyword-hint
- **WHEN** a main spec requirement carries its normative keyword only in the
  header
- **THEN** the targeted hint to move the statement into the body is emitted
- **AND** the general missing-keyword message is not emitted

#### Scenario: Exactly one issue is raised
**ID:** one-issue-per-requirement
- **WHEN** a requirement triggers the body-keyword hint
- **THEN** exactly one issue is emitted for it

#### Scenario: The wording matches the delta path
**ID:** hint-parity-with-deltas
- **GIVEN** the same mistake authored once in a main spec and once in a change
  delta
- **WHEN** each is validated
- **THEN** the actionable sentence is identical in both

#### Scenario: No keyword anywhere still fails
**ID:** no-keyword-still-fails
- **WHEN** a requirement carries no normative keyword in its header or body
- **THEN** validation reports that the requirement needs one

#### Scenario: Renamed requirements are exempt
**ID:** rename-exempt-from-hint
- **WHEN** a change delta renames a requirement whose new header carries the
  keyword
- **THEN** no body-keyword hint is emitted for the renamed pair

### Requirement: Governed pairs are validated for identity, coverage, and targets
**ID:** governed-pair-validation
The validate command SHALL inspect every governed pair beneath every declared
plane, complete or incomplete, and SHALL report duplicate spec identities,
identity conflicts inside a pair, claims without complete enforcement, bindings
covering identities absent from their pair, and enforcement targets that cannot
be resolved — each with the identities and source locations involved.

#### Scenario: A whole governed project is inspected
**ID:** governed-whole-project
- **WHEN** a user validates a governed project without naming an item
- **THEN** every pair beneath every declared plane is inspected
- **AND** duplicate identities, coverage states, and target results are reported
  in a stable order

#### Scenario: A binding covering a removed identity is reported
**ID:** stale-binding-reported
- **WHEN** a binding covers an identity that its paired spec no longer declares
- **THEN** the binding, the stale identity, and both pair paths are reported

#### Scenario: A claim with no complete enforcement is reported
**ID:** hanging-claim-reported
- **WHEN** a normative claim has no complete enforcement
- **THEN** its spec identity and its identity inside the pair are reported

#### Scenario: An unresolvable enforcement target is reported
**ID:** broken-target-reported
- **WHEN** an active binding names a file or working directory that cannot be
  resolved
- **THEN** the binding, the field, the missing target, and the covered
  identities are reported

#### Scenario: Nested locators read the same on every platform
**ID:** locator-platform-parity
- **WHEN** governed pairs use nested locators
- **THEN** files are reached through the platform's own path form
- **AND** every reported locator uses one normalized form

### Requirement: Governed deltas are validated against the pair they will produce
**ID:** governed-change-validation
The validate command SHALL validate a governed change's specification and
enforcement deltas against the current pairs they modify, before the change is
applied or archived, and SHALL report a delta pair that is missing one of its
two members.

#### Scenario: A delta that strands a binding blocks readiness
**ID:** delta-strands-binding
- **WHEN** a governed delta removes a claim but leaves a binding covering it
- **THEN** the stranded binding is reported and the change is not ready

#### Scenario: A claim and its binding removed together validate cleanly
**ID:** paired-removal-validates
- **WHEN** a delta removes a claim and its binding together
- **THEN** the prospective pair validates without those identities
- **AND** the binding's former targets are reported as cleanup candidates

#### Scenario: A planned binding is allowed while authoring
**ID:** planned-binding-allowed
- **WHEN** a change declares a binding whose target does not exist yet
- **THEN** its planned state is reported without treating the change as
  malformed
- **AND** the change may be applied but is not archive-ready

#### Scenario: A one-sided delta pair is reported
**ID:** incomplete-delta-pair
- **WHEN** a governed locator has only a specification delta or only an
  enforcement delta
- **THEN** the missing member is named and the change is not ready
