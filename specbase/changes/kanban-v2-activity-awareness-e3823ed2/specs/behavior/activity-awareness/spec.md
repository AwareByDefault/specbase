---
id: behavior.activity-awareness
---

## Purpose

Define a privacy-bounded local activity signal that helps users prioritize inspection without claiming presence or changing governed status.

## ADDED Requirements

### Requirement: Work cards expose a structured local activity observation
**ID:** activity-observation
Every open idea, active change, and archived change card SHALL carry an `activity` value with `state`, `source`, `observedAt`, and `ageMs`. The state SHALL be `fresh` when the latest observed local project-file change is no more than 15 minutes old, `stale` when older, and `unknown` when no trustworthy observation is available.

#### Scenario: A recent local change is fresh
**ID:** recent-change-is-fresh
- **WHEN** the latest observed project-file modification for a work card is 15 minutes old or newer
- **THEN** its activity state is `fresh`, source is `project-files`, and timestamp and non-negative age are present

#### Scenario: An older local change is stale
**ID:** older-change-is-stale
- **WHEN** the latest observed project-file modification is older than 15 minutes
- **THEN** its activity state is `stale` with source, timestamp, and age present

#### Scenario: No trustworthy observation is unknown
**ID:** no-observation-is-unknown
- **WHEN** no bounded local observation can be obtained
- **THEN** activity state is `unknown` and source, timestamp, and age are null

### Requirement: Activity remains advisory
**ID:** activity-is-advisory
An activity observation SHALL NOT change a card's lifecycle column, artifact status, task progress, validation state, specification truth, readiness, or ordering. User-facing labels SHALL identify the signal as local file activity rather than asserting that a person or agent is present.

#### Scenario: Freshness does not change governed state
**ID:** freshness-does-not-change-truth
- **WHEN** the same work card changes between fresh, stale, and unknown
- **THEN** its lifecycle, progress, governed status, and relative order remain unchanged

#### Scenario: Copy does not claim presence
**ID:** activity-does-not-claim-presence
- **WHEN** activity is shown in a card or detail
- **THEN** it names local file activity or its source
- **AND** it does not identify or claim an active person or agent

### Requirement: Activity reads stay local and privacy-bounded
**ID:** activity-privacy-boundary
Activity derivation SHALL inspect only regular-file metadata inside each card's own local project directory. It SHALL NOT read file contents, follow a path outside that directory, inspect processes or identities, contact a network service, or write activity data into the project.

#### Scenario: A card is confined to its directory
**ID:** activity-confined-to-card-root
- **WHEN** activity is derived for a work card
- **THEN** only metadata for regular files confined to that card directory contributes
- **AND** an escaping symlink or neighboring work directory is ignored

#### Scenario: Derivation leaves no project trace
**ID:** activity-leaves-no-project-write
- **WHEN** activity is derived and presented
- **THEN** no project file is created or modified and no file content is read

### Requirement: Activity failure degrades per card
**ID:** activity-failure-is-unknown
A missing file, invalid timestamp, provider error, or future timestamp SHALL NOT fail the board. Missing, invalid, or failed observations SHALL produce `unknown`; a valid future timestamp SHALL produce `fresh` with age clamped to zero while retaining the observed timestamp.

#### Scenario: Provider failure does not fail the board
**ID:** provider-failure-degrades
- **WHEN** one card's activity provider fails
- **THEN** that card reports `unknown`
- **AND** other cards and board outputs remain available

#### Scenario: Future time is clamped
**ID:** future-observation-clamped
- **WHEN** a valid observed timestamp is later than the injected current time
- **THEN** the observation remains visible as `fresh` with `ageMs` equal to zero
