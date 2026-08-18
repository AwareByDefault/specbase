---
id: architecture.change-stacks
---

### Requirement: One central manifest owns a stack's linear membership
**ID:** linear-manifest
Each stack SHALL have one manifest containing one finite ordered list of at least two unique stable work-item IDs, and no member SHALL belong to another stack or identify a nested stack.

#### Scenario: One list defines the chain
**ID:** one-list-defines-chain
- **WHEN** stack membership is resolved
- **THEN** the manifest list alone defines every member and predecessor relationship

#### Scenario: Branching membership is rejected
**ID:** branching-membership-rejected
- **WHEN** a manifest repeats a member, claims a member already owned elsewhere, or names a stack as a member
- **THEN** structural validation rejects the manifest

### Requirement: Member resolution follows stable identity within one planning root
**ID:** stable-member-resolution
The stack resolver SHALL identify members by their immutable metadata ID across idea, active-change, and archived-change positions within the stack's planning root.

#### Scenario: Archive prefix does not change identity
**ID:** archive-prefix-ignored
- **WHEN** a member moves to a dated archive directory
- **THEN** the resolver continues to match its unchanged metadata ID

#### Scenario: Resolution never crosses roots
**ID:** resolution-stays-local
- **WHEN** another planning root contains the same ID or a manifest attempts to name an external path
- **THEN** the local resolver does not follow it

### Requirement: Projection folds active predecessor deltas once in order
**ID:** projection-once-in-order
The stack projector SHALL start from current accepted truth and apply each unarchived predecessor delta exactly once in manifest order using the same prospective-state semantics as archive. It SHALL NOT replay archived predecessors.

#### Scenario: Mixed archived and active predecessors
**ID:** mixed-predecessors-folded
- **WHEN** a target follows one archived predecessor and two active predecessors
- **THEN** projection starts from current truth, skips the archived delta, and folds the two active deltas once in order

#### Scenario: Projection and archive agree
**ID:** projection-archive-agreement
- **WHEN** a predecessor is projected successfully and then archived without intervening changes
- **THEN** the accepted result matches the state previously projected for its successor

### Requirement: Projection advances only through valid prefixes
**ID:** valid-prefix
The stack projector SHALL validate the complete prospective spec and enforcement state after each member and SHALL stop at the first invalid prefix without producing a downstream accepted state.

#### Scenario: Every prefix remains coherent
**ID:** coherent-prefixes-advance
- **WHEN** each sequential member produces a valid prospective repository state
- **THEN** projection advances through the complete chain

#### Scenario: Pair failure stops the chain
**ID:** pair-failure-stops-chain
- **WHEN** a member would produce an invalid or one-sided governed pair
- **THEN** projection stops at that member
- **AND** leaves later members unevaluated against a false base

### Requirement: Stack planning data remains outside governed enumeration
**ID:** stacks-outside-governed-enumeration
The `stacks/` region SHALL be excluded from current-spec and change-delta enumeration, validation, coverage, and artifact-graph discovery except when a stack-aware operation explicitly resolves it.

#### Scenario: Ordinary coverage ignores stacks
**ID:** coverage-ignores-stacks
- **WHEN** governed coverage runs in a repository containing stacks
- **THEN** no stack scratchpad or manifest is reported as normative spec truth

#### Scenario: Stack validation opts into stack data
**ID:** stack-validation-opts-in
- **WHEN** stack-aware validation is requested
- **THEN** it resolves the selected manifest and member changes without changing ordinary enumeration
