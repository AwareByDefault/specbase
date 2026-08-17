---
id: agents.review-panel
---


<!--
  Agents truth: durable truth about one of the repo's OWN agentic instruments -
  the review panel, a repo-specific skill, a subagent, or a hook the repo
  builds. Lives at specs/agents/<locator>/spec.md and is paired with an
  enforcement.yaml in the same directory. This is NOT for behavioral guardrails
  ON agents (those ride on the plane whose subject they constrain); it is for
  the machinery the repo owns, and the plane is opt-in per project.

  The governing pattern: an agents spec DESCRIBES an agent-operational artifact
  (config.yaml, DEFAULT_LENSES, a SKILL.md, a hook) and its enforcement binds a
  conformance/drift check to that artifact - the artifact stays the runtime
  source of truth, the spec is the checked description. No new mechanism: use
  command / test. State only what must be true now; the rationale for building
  the instrument belongs in design/proposal and the dated archive.
-->

## ADDED Requirements

### Requirement: Review panel judges every governed plane
**ID:** panel-covers-planes
The review panel SHALL run one non-cross-cutting lens per governed plane plus
the cross-cutting enforcement lens, and each lens SHALL state the question it
asks of the code. The resolved lens set is the operational artifact this spec
describes; it MUST conform to the lenses declared here.

#### Scenario: Resolved lenses conform to the spec
**ID:** lenses-conform
- **WHEN** the review panel's resolved lens set is checked against this spec
- **THEN** a test binding reports any lens present in one and absent in the other
