---
id: design-system.color
---

<!--
  Design-system truth: durable truth about the product's expressed identity -
  visual design tokens (color, type, spacing, radius, motion), design
  principles, and the voice/tone of user-facing copy. Governs HOW outcomes are
  presented, orthogonal to behavior (WHAT they do). Lives at
  specs/design-system/<locator>/spec.md and is paired with an enforcement.md in
  the same directory. State only what must be true now; the rationale for
  adopting a token scale or a voice rule belongs in design/proposal and the
  dated archive.

  Two strata, two enforcement strengths (same split as code-quality):
  - design-system/tokens/*  DESCRIBE the token artifact (tailwind.config /
    tokens.json), which stays the runtime source of truth. The spec asserts
    invariants OVER the tokens (a closed palette, AA contrast, a fixed scale);
    it does NOT redefine the token values as spec-mastered data. Enforcement
    binds automated checks (token lint, contrast/a11y) whose target is the
    artifact.
  - design-system/voice/*  principles and copy tone. Enforcement binds the
    `design` review lens for the judgment a linter cannot make (a banned-word
    lint MAY supplement it, but the lens carries the call).
-->

## ADDED Requirements

### Requirement: Color derives from a closed, accessible token set
**ID:** color-tokens
All user-facing color SHALL derive from the named semantic tokens defined in the
token artifact; components MUST NOT introduce raw color literals. Every
text/background token pair used together SHALL meet WCAG AA contrast.

#### Scenario: Raw color literal outside the token artifact
**ID:** raw-color-rejected
- **WHEN** a component sets a color with a raw hex/rgb literal instead of a token
- **THEN** token-lint enforcement reports it against the token artifact

#### Scenario: Token pair fails AA contrast
**ID:** contrast-below-aa
- **WHEN** a text token is placed on a background token below the AA ratio
- **THEN** the contrast check reports the failing pair

### Requirement: Error copy is calm and never blames the user
**ID:** error-voice
User-facing error copy SHALL be written in the second person, stay terse, and
MUST NOT blame the user or use exclamation marks. This is a voice principle the
`design` review lens judges.

#### Scenario: Blaming or shouting error copy
**ID:** blaming-copy-flagged
- **WHEN** an error message blames the user or ends with an exclamation mark
- **THEN** the design review lens flags it against this voice rule
