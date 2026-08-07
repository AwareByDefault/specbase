## 1. Opt-In Governed Schema

- [ ] 1.1 Extend resolved schema metadata with an explicit versioned governed spec-model declaration without branching on schema names
- [ ] 1.2 Add runtime schemas for governed specs, scoped normative IDs, enforcement documents, bindings, and coverage states
- [ ] 1.3 Add the bundled governed artifact graph with proposal, specs, design, enforcement, tasks, and apply dependencies
- [ ] 1.4 Add behavioral spec, architectural spec, and enforcement templates plus schema-specific artifact instructions

## 2. Governed Pair Repository

- [ ] 2.1 Implement safe recursive pair discovery beneath behavior and architecture roots using native path operations and normalized locators
- [ ] 2.2 Parse governed spec frontmatter plus pair-local requirement and scenario IDs without changing the legacy parser
- [ ] 2.3 Parse the authoritative enforcement YAML block, pair-local binding IDs, targets, lifecycle states, and commands
- [ ] 2.4 Build the project-unique stable spec-ID index and validate requirement, scenario, and binding identity within each pair
- [ ] 2.5 Resolve one normalized governed pair record by plane-qualified locator or stable spec ID for shared CLI consumers

## 3. Enforcement Coverage and Drift

- [ ] 3.1 Calculate covered, hanging, stale, broken, planned, and incomplete-pair states from one governed pair
- [ ] 3.2 Validate full requirement-level versus direct scenario coverage without requiring one binding per scenario
- [ ] 3.3 Validate active target paths and working directories remain inside the selected project root
- [ ] 3.4 Compare current and prepared pairs to report retired enforcement targets and whether surviving bindings still share them
- [ ] 3.5 Emit deterministic text and JSON diagnostics with stable spec, normative, binding, source-path, and target details

## 4. Pair-Aware Sync and Archive

- [ ] 4.1 Parse and reconcile governed normative and binding delta operations by stable scoped identity
- [ ] 4.2 Build and validate each prospective specification/enforcement pair before current-spec writes
- [ ] 4.3 Update both members of a validated pair through existing filesystem conventions and leave the pair unchanged on semantic validation failure
- [ ] 4.4 Route governed sync and archive through pair preparation, readiness checks, retired-target reporting, and explicit bypass reporting while preserving the legacy path

## 5. Governed CLI Surfaces

- [ ] 5.1 Update shared spec discovery and completion to consume schema-aware legacy or governed records without basename ambiguity
- [ ] 5.2 Extend list text and JSON output with governed locator, stable spec ID, pair paths, counts, and coverage state
- [ ] 5.3 Extend top-level show and noun-form spec commands to resolve, display, filter, and serialize governed pairs
- [ ] 5.4 Extend direct, interactive, all-spec, change, and archive validation with pair, scoped identity, coverage, lifecycle, and target diagnostics

## 6. Agent Workflow Awareness

- [ ] 6.1 Update explore guidance to distinguish behavioral truth, architectural truth, enforcement, change design, and historical rationale
- [ ] 6.2 Update new, propose, fast-forward, and continue guidance to classify planes and create specs then enforcement from schema instructions
- [ ] 6.3 Update change-update and apply guidance to preserve scoped IDs, resolve planned bindings, and assess retired-target cleanup safely
- [ ] 6.4 Update verify guidance to use binding coverage, run declared automated commands, perform review procedures, and report semantic correspondence honestly
- [ ] 6.5 Update sync, archive, and bulk-archive guidance to preserve complete pairs, require governed readiness, and report bypasses
- [ ] 6.6 Update onboarding guidance, apply changes at the canonical workflow source present after template-pipeline integration, regenerate projections, and enforce parity

## 7. Governed Pilot

- [ ] 7.1 Create a Kairos-style pilot fixture with one test-enforced behavioral pair, one lint-enforced architectural pair, and one review-only responsibility
- [ ] 7.2 Exercise schema selection, status, instructions, list, show, spec, validation, sync, verify, and archive through real CLI and workflow paths
- [ ] 7.3 Remove a scenario while retaining its binding and confirm stale enforcement blocks readiness and identifies cleanup candidates after reconciliation
- [ ] 7.4 Remove an enforcement target while retaining its normative claim and confirm broken enforcement leaves the claim hanging
- [ ] 7.5 Exercise nested locators, moves with stable spec identity, traversal rejection, normalized JSON, and pair-aware archive on Windows CI as well as macOS/Linux
