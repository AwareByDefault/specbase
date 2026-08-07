## ADDED Requirements

### Requirement: Design-system plane authoring conventions

The conventions SHALL define the `design-system` plane: its membership is durable truth about a product's expressed identity (visual tokens, design principles, copy voice/tone), not product behavior. Authors SHALL place token truths under `design-system/tokens/…` using the DESCRIBE direction (the token artifact remains the runtime source of truth; the spec describes its contract and binds automated checks) and voice/principle truths under `design-system/voice/…` bound to the `design` review lens.

#### Scenario: Identity truth is distinguished from behavior

- **WHEN** an author must decide between `behavior` and `design-system` for a copy-tone or visual-token truth
- **THEN** the conventions direct presentation/identity truths to `design-system` and functional-outcome truths to `behavior`

#### Scenario: DESCRIBE direction is documented for tokens

- **WHEN** an author writes a `design-system/tokens/*` spec
- **THEN** the conventions state that the spec describes the token artifact's contract rather than mastering the token values

### Requirement: Governance is emergent from plane selection

The conventions SHALL document that a project is governed when it resolves one or more planes and flat when it resolves none, and that `specModel.kind` is derived from the resolved plane set rather than chosen independently.

#### Scenario: Conventions describe emergent governance

- **WHEN** a reader consults the conventions for how a project becomes governed
- **THEN** the conventions state that selecting one or more planes at init makes the project governed, and selecting none leaves it flat
