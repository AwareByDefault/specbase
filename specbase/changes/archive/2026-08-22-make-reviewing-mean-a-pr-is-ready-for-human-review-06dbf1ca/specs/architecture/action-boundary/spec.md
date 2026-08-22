---
id: architecture.action-boundary
---

## Purpose

The action boundary owns canonical policy and durable observations while external adapters exclusively own conversations, execution, source control, and remote-review side effects.

## ADDED Requirements

### Requirement: Remote review observation crosses a typed result boundary
**ID:** `remote-review-result-boundary`
Specbase SHALL accept remote pull-request readiness only through a schema-validated canonical action-result contract, and the Specbase action boundary SHALL perform no network, Git, comment, approval, resolution, merge, or branch operation.

#### Scenario: External adapter confirms PR readiness
**ID:** `external-adapter-records-ready-pr`
- **WHEN** an authorized adapter confirms an exact pull request and verified head
- **THEN** Specbase compare-and-sets the typed observation into canonical metadata
- **AND** it performs no remote side effect

#### Scenario: Reviewing feedback action is requested
**ID:** `feedback-capability-remains-external`
- **WHEN** the canonical catalog authorizes pull-request feedback handling
- **THEN** the dispatch descriptor names a closed capability and immutable identities
- **AND** comment fetching, code mutation, replies, resolution, and pushing remain outside Specbase
