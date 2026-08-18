---
id: behavior.change-stacks
---

### Requirement: Users can create one linear stack from ordinary work items
**ID:** stack-create
The system SHALL let a user create a repo-local stack from a summary and an ordered list of at least two existing work-item IDs, and SHALL preserve that order as the stack's review and delivery sequence.

#### Scenario: A three-slice stack is created
**ID:** three-slice-stack-created
- **WHEN** a user creates a stack from three distinct work-item IDs in a stated order
- **THEN** the stack is created with those three members in that order
- **AND** each member retains its own identity and lifecycle

#### Scenario: Invalid membership is rejected
**ID:** invalid-membership-rejected
- **WHEN** the member list is too short, repeats an ID, names an unresolved item, or includes an item owned by another stack
- **THEN** creation fails with the invalid member named
- **AND** no partial stack is created

### Requirement: An idea can become shared stack context
**ID:** idea-to-stack
The system SHALL let a user decompose an open idea into a stack by moving the idea scratchpad into the stack region, preserving its stable identity, summary, creation date, notes, and supporting files.

#### Scenario: Umbrella idea becomes a stack
**ID:** umbrella-idea-becomes-stack
- **WHEN** a user creates a stack from an open idea and an ordered member list
- **THEN** the idea no longer appears among open ideas
- **AND** its scratchpad appears under the stack identity with every prior file preserved

#### Scenario: Ordinary idea graduation remains available
**ID:** ordinary-graduation-unchanged
- **WHEN** an idea is proposed as one ordinary change rather than decomposed
- **THEN** it follows the existing idea-to-change graduation behavior

### Requirement: Stack inspection reports ordered member progress from repository state
**ID:** stack-inspection
The system SHALL show each stack member in manifest order with its resolved idea, active-change, or archived position, its available artifact and task progress, and the first member that can advance next. It SHALL accept machine-readable output.

#### Scenario: Mixed lifecycle positions are shown
**ID:** mixed-positions-shown
- **WHEN** a stack contains an archived predecessor, an active change, and a planned idea
- **THEN** inspection shows all three in order with their distinct positions
- **AND** identifies the active change as the next unfinished slice

#### Scenario: A broken member is actionable
**ID:** broken-member-actionable
- **WHEN** a member cannot be resolved unambiguously
- **THEN** inspection names the member and reports how to repair the manifest or work item

### Requirement: Stack validation evaluates predecessor-projected truth
**ID:** stack-aware-validation
The system SHALL validate each active stack member against current accepted truth projected through its active predecessors in stack order, and SHALL report the first invalid prefix and every downstream member blocked by it.

#### Scenario: Downstream modification validates against an active predecessor
**ID:** downstream-modifies-predecessor-truth
- **WHEN** a downstream member modifies a requirement introduced by an unarchived predecessor
- **THEN** stack validation evaluates the downstream delta against the predecessor-projected requirement
- **AND** accepts the chain when every projected prefix is valid

#### Scenario: Invalid predecessor blocks downstream results
**ID:** invalid-predecessor-blocks-downstream
- **WHEN** a predecessor delta conflicts with its projected base
- **THEN** validation names that predecessor as the first invalid prefix
- **AND** does not present downstream members as valid

### Requirement: Stack members archive in delivery order
**ID:** ordered-archive
The system SHALL archive a stack member only after every predecessor is archived, and a member with spec deltas SHALL advance only when those deltas are applied to current truth.

#### Scenario: Out-of-order archive is blocked
**ID:** out-of-order-archive-blocked
- **WHEN** a user attempts to archive a member whose predecessor remains unarchived
- **THEN** archive fails with the required predecessor named
- **AND** leaves current specs, the stack, and the change untouched

#### Scenario: The next eligible member archives
**ID:** eligible-member-archives
- **WHEN** every predecessor is archived and the member satisfies ordinary archive readiness
- **THEN** the member archives through the normal validated path
- **AND** stack inspection advances to the next unfinished member

#### Scenario: Required projected truth cannot be skipped
**ID:** stacked-delta-skip-rejected
- **WHEN** a stacked member has spec deltas and its archive would skip or decline applying them
- **THEN** the member remains active
- **AND** the system explains that downstream slices depend on that truth

### Requirement: Unstacked work keeps its existing lifecycle
**ID:** unstacked-compatibility
The system SHALL keep existing idea, change, validation, apply, and archive behavior unchanged for work items that belong to no stack.

#### Scenario: Ordinary change remains ordinary
**ID:** ordinary-change-unchanged
- **WHEN** a user operates on a change that belongs to no stack
- **THEN** no stack gate or stack context is introduced
- **AND** its existing workflow outputs and options remain available
