---
id: behavior.store.format
---

## Purpose
This spec governs the machine-readable shape of governed truth and enforcement so parsers, validators, synchronization, and authors share one concise stable contract.

## ADDED Requirements

### Requirement: Enforcement is a direct YAML binding map
**ID:** `enforcement-yaml-format`
A governed pair SHALL store enforcement in a sibling `enforcement.yaml` file whose top-level `bindings` map uses each pair-local binding ID as a key. Each binding value SHALL contain exactly `type`, `covers`, and `source`; `covers` SHALL accept one requirement ID or a list of requirement IDs and normalize both forms identically.

#### Scenario: Compact enforcement parses
**ID:** `compact-enforcement-parses`
- **WHEN** `enforcement.yaml` declares a binding with a configured type, an existing requirement ID, and a non-empty source
- **THEN** the parser returns the binding ID, normalized covered requirement IDs, type, and source

#### Scenario: Extra mechanism fields are rejected
**ID:** `legacy-binding-fields-rejected`
- **WHEN** a compact binding also declares an inline command, target, procedure, strength, status, or limitation
- **THEN** validation reports those fields as unsupported in the compact manifest

#### Scenario: Enforcement identity comes from the pair
**ID:** `enforcement-identity-from-pair`
- **WHEN** an enforcement manifest is resolved beside `spec.md`
- **THEN** the containing pair supplies its stable spec identity and document grammar
- **AND** the manifest does not repeat either value

### Requirement: Markdown enforcement remains readable during migration
**ID:** `legacy-enforcement-reader`
The system SHALL prefer `enforcement.yaml` for governed pairs and SHALL continue to read a lone legacy `enforcement.md` during migration. A pair containing both filenames SHALL be reported as ambiguous rather than silently choosing one.

#### Scenario: Legacy pair remains readable
**ID:** `legacy-markdown-fallback`
- **WHEN** a governed pair contains `enforcement.md` and no `enforcement.yaml`
- **THEN** the system parses the legacy fenced YAML document

#### Scenario: Both filenames conflict
**ID:** `dual-enforcement-conflict`
- **WHEN** a governed pair contains both enforcement filenames
- **THEN** validation reports the ambiguity and does not report the pair ready
