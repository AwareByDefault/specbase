---
id: agents.change-stacks
---

## Purpose
The repository's stack workflow helps agents turn large ideas into small delivery increments while keeping every member grounded in CLI-resolved predecessor context.

## ADDED Requirements

### Requirement: The stack workflow decomposes ideas into vertical slices
**ID:** stack-slicing-workflow
The repo SHALL ship a stack-decomposition skill and command projection that reads an idea's scratchpad, proposes a finite linear sequence of ordinary work items, and evaluates each member as an independently observable and reviewable vertical slice before creating the stack through the CLI.

#### Scenario: Candidate slices cross a real entry point
**ID:** candidates-are-vertical
- **WHEN** the workflow proposes stack members
- **THEN** each member names a demonstrable entry point, the outcome that becomes newly true, and the work explicitly deferred to later members

#### Scenario: Horizontal phases are challenged
**ID:** horizontal-phases-challenged
- **WHEN** a candidate list separates setup, internal layers, and user interaction without an observable increment at each boundary
- **THEN** the workflow reshapes or challenges the list before creating the stack

#### Scenario: Member artifacts remain independent
**ID:** members-remain-independent
- **WHEN** the user accepts the decomposition
- **THEN** the workflow creates ordinary child work items with separate identities
- **AND** does not create one giant final spec with implementation-only batches

### Requirement: Affected workflows consume CLI-resolved stack context
**ID:** workflows-read-stack-context
The repo's propose, apply, and archive workflow instruments SHALL use stack context, predecessor status, and resolved paths reported by the CLI rather than parsing stack manifests or guessing member locations themselves.

#### Scenario: Downstream proposal sees predecessor context
**ID:** proposal-sees-predecessors
- **WHEN** an agent proposes a downstream stack member
- **THEN** its workflow reads the CLI-reported predecessor artifacts and projected base before authoring the member

#### Scenario: Apply reports but does not invent Git state
**ID:** apply-reports-stack-state
- **WHEN** an agent applies a member with unarchived predecessors
- **THEN** its workflow reports that predecessor state
- **AND** does not claim branch or merge safety that the CLI cannot establish

#### Scenario: Archive follows the stack gate
**ID:** archive-follows-stack-gate
- **WHEN** an agent attempts to archive a stacked member
- **THEN** its workflow follows the CLI's eligibility result and names any predecessor that must archive first
