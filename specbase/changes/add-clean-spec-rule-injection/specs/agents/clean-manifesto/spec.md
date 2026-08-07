---
id: agents.clean-manifesto
---

<!--
  Agents-plane spec. It DESCRIBES the repo's own instruments — the clean-spec /
  clean-specbase manifestos, the build codegen that lifts their rules, the
  generator that injects them, and the generated propose skill — and asserts
  those artifacts conform. The artifacts stay the runtime source of truth; this
  spec never generates them.
-->

## ADDED Requirements

### Requirement: Manifestos are the single source of injected authoring rules
**ID:** `single-source`
The `docs/clean-spec.md` and `docs/clean-specbase.md` manifestos SHALL each
contain a delimited Rules section that is the ONLY authored home of the
distilled authoring rules injected into generated skills. The skill generator
SHALL obtain those rules from a build artifact derived from the marked sections,
and SHALL NOT restate the rules inline. No second, hand-maintained copy of the
rules SHALL exist in the generator source.

#### Scenario: Generator carries no inline rules copy
**ID:** `generator-has-no-inline-copy`
- **WHEN** enforcement inspects the skill generator source for the injected
  rules text
- **THEN** the rules appear only via import of the generated artifact, never as
  a restated literal in the generator

#### Scenario: Both manifestos expose a marked Rules section
**ID:** `manifestos-mark-rules`
- **WHEN** enforcement scans `docs/clean-spec.md` and `docs/clean-specbase.md`
- **THEN** each contains exactly one well-formed delimited Rules section

### Requirement: The build propagates manifesto rules without drift
**ID:** `build-propagates`
The build SHALL extract the marked Rules sections into a generated module before
compilation, and the committed generated module SHALL equal the result of
re-running that extraction against the current manifestos. Editing a manifesto's
Rules section without regenerating SHALL be a detectable failure.

#### Scenario: Committed generated rules match the manifestos
**ID:** `generated-matches-source`
- **WHEN** the extraction runs against the current manifestos
- **THEN** its output is byte-identical to the committed generated module

#### Scenario: Stale generated rules are rejected
**ID:** `stale-generated-rejected`
- **WHEN** a manifesto Rules section is edited but the generated module is not
  regenerated
- **THEN** the drift check fails

### Requirement: Generated skills carry the current injected rules
**ID:** `skills-carry-rules`
Skills emitted by `openspec init` and `openspec update` SHALL contain the rules
from the generated module, so an installed repo receives updated rules by
upgrading the package and regenerating — with no reference to `docs/` that would
dangle where the manifestos are absent.

#### Scenario: A generated skill contains the injected rules
**ID:** `emitted-skill-contains-rules`
- **WHEN** a spec-driven skill is generated in a repo without `docs/`
- **THEN** the skill text contains the injected rules and no path reference to a
  `docs/clean-*.md` file

### Requirement: Propose surfaces chosen structure before authoring
**ID:** `propose-surfaces-structure`
The generated `propose` skill SHALL, after placing specs and before authoring
them, present the chosen plane-qualified locators together with the
clean-specbase rule applied to each, and SHALL offer to discuss the structure
rather than requiring the user to opt in before any placement. Writing-quality
rules (clean-spec) SHALL be applied during authoring and SHALL NOT be gated
behind that offer.

#### Scenario: Placement is shown with its rationale
**ID:** `placement-shown-with-rationale`
- **WHEN** the propose skill has placed a change's specs
- **THEN** its guidance directs showing each chosen locator with the applied
  clean-specbase rule, then offering discussion

#### Scenario: Writing quality is not gated
**ID:** `writing-quality-ungated`
- **WHEN** the user declines to discuss structure
- **THEN** the propose skill still applies the clean-spec writing rules when
  authoring each spec and enforcement pair
