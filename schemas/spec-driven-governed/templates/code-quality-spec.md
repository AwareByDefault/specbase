---
id: code-quality.no-ambient-time
---

<!--
  Code-quality truth: a smell, quality, or rule about what good code looks
  like. Lives at specs/code-quality/<locator>/spec.md and is paired with an
  enforcement.md in the same directory. Softer than behavior (WHEN/THEN over
  outcomes), but still normative - a prohibition or quality the code MUST hold.
  Enforcement mixes deterministic smell-lint with review for the residue the
  lint cannot catch; the code-quality lens judges that residue.

  State only what must be true now; the rationale for adopting a rule belongs
  in design/proposal and the dated archive.
-->

## ADDED Requirements

### Requirement: No hidden temporal coupling
**ID:** no-ambient-time
Domain modules SHALL obtain time and randomness through injected ports and MUST
NOT read ambient time or global randomness directly.

#### Scenario: Ambient time detected in domain
**ID:** ambient-time-in-domain
- **WHEN** a module under src/domain calls Date.now() or constructs a Date
- **THEN** enforcement reports a temporal-coupling smell