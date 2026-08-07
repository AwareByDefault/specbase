---
id: behavior.cli.show
---

## ADDED Requirements

### Requirement: Show identifies what an item is before displaying it
**ID:** show-resolution
The show command SHALL determine from the name alone whether an item is a change
or a spec and SHALL display it in the form that suits that kind. An explicit
type option SHALL skip detection and treat the name as that kind. Under the
governed model the command SHALL resolve a spec by its plane-qualified locator
under any declared plane, or by its stable spec identity, and SHALL still find a
pair whose locator has changed.

#### Scenario: A name resolves to its kind and is displayed
**ID:** auto-detect-and-display
- **WHEN** a user shows an item by name
- **THEN** the command determines whether it is a change or a spec
- **AND** displays it in the form used for that kind

#### Scenario: An explicit type skips detection
**ID:** type-option-skips-detection
- **WHEN** a user shows an item with an explicit type option
- **THEN** the name is treated as that kind without auto-detection

#### Scenario: A governed pair resolves by locator
**ID:** governed-locator-resolution
- **WHEN** a user shows a spec whose name is a plane-qualified locator under a
  declared plane
- **THEN** the pair at that normalized locator is resolved and shown

#### Scenario: A moved pair resolves by its stable identity
**ID:** governed-identity-resolution
- **WHEN** a user shows a spec by its stable identity after its locator has
  changed
- **THEN** the pair is resolved at its current locator, and the plane and
  locator are reported

#### Scenario: An unqualified name matching several pairs is refused
**ID:** ambiguous-basename-refused
- **WHEN** an unqualified name matches more than one governed locator
- **THEN** the candidates are listed and a plane-qualified locator or stable
  identity is required

### Requirement: Show asks which kind before it asks which item
**ID:** kind-prompt
When the user names no item and both changes and specs are available for
selection, the show command SHALL first ask which kind of item to show, then
offer the items of that kind.

#### Scenario: The kind question comes first
**ID:** kind-then-item
- **WHEN** a user runs show with no item named in an interactive session
- **THEN** the command asks whether to show a change or a spec
- **AND** then offers the items of the chosen kind

### Requirement: Kind-specific options reach the kind that was resolved
**ID:** flag-delegation
The show command SHALL pass options that belong to a kind through to the display
for that kind, and SHALL ignore an option that does not apply to the resolved
kind while warning that it was ignored.

#### Scenario: A kind-specific option is honored
**ID:** kind-option-honored
- **WHEN** a user shows an item with an option that belongs to that item's kind,
  such as restricting a change to its deltas or a spec to its requirements
- **THEN** the display is filtered as that option specifies

#### Scenario: An inapplicable option is ignored with a warning
**ID:** irrelevant-option-warns
- **WHEN** a user passes an option that belongs to the other kind
- **THEN** the option has no effect on the output
- **AND** a warning says it was ignored

### Requirement: A governed spec is shown with its enforcement
**ID:** governed-pair-display
When showing a governed spec, the command SHALL present the specification text
as authored and SHALL summarize its paired enforcement and coverage. In
machine-readable form the output SHALL carry the stable spec identity, the
plane, the normalized locator, the paths of both pair members, the requirement
and scenario identities, the bindings, and the coverage states. When only one
member of a pair exists, the command SHALL show the member it found and name the
one that is missing.

#### Scenario: Text output keeps the authored spec first
**ID:** raw-first-display
- **WHEN** a governed spec is shown in human-readable form
- **THEN** the specification text appears as authored
- **AND** the paired enforcement and coverage are summarized alongside it

#### Scenario: Machine-readable output carries the whole pair
**ID:** governed-json-fields
- **WHEN** a governed spec is shown in machine-readable form
- **THEN** the output carries the stable identity, plane, normalized locator,
  both pair paths, requirement and scenario identities, bindings, and coverage
  states

#### Scenario: A one-sided pair names the missing member
**ID:** incomplete-pair-reported
- **WHEN** a locator holds only one member of a governed pair
- **THEN** the existing member is shown and the missing member is named
