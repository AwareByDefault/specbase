# design-system-plane Specification

## Purpose
TBD - created by archiving change add-design-system-plane. Update Purpose after archive.
## Requirements
### Requirement: Design-system plane governs the product's expressed identity

The `design-system` plane SHALL hold durable truths about a product's expressed identity — visual design tokens (color, type, spacing, radius, motion), design principles, and the voice/tone of user-facing copy. These truths govern HOW outcomes are presented and are orthogonal to the `behavior` plane, which governs WHAT the product does. The plane SHALL be offered at init and unselected by default.

#### Scenario: Presentation truth is placed on the design-system plane

- **WHEN** a change introduces a durable truth about visual tokens, design principles, or copy voice
- **THEN** it is authored under `specs/design-system/<locator>/spec.md`, not under `behavior`

#### Scenario: Design-system is offered but off by default

- **WHEN** a project resolves its offered planes at init
- **THEN** `design-system` appears in the picker unchecked (`defaultSelected: false`)
- **AND** a project with no user-facing surface can complete init without selecting it

### Requirement: Design-system separates token truth from voice truth in two strata

The plane SHALL organize its truths into two strata. Token truths live under `design-system/tokens/…` and DESCRIBE a token artifact (for example `tailwind.config` or `tokens.json`) that remains the runtime source of truth; their enforcement SHALL bind automated checks (token lint, contrast, accessibility) that audit the artifact against the described invariants. Principle and voice truths live under `design-system/voice/…`; their enforcement SHALL bind the `design` review lens for the judgment automated checks cannot make. A design-system spec SHALL assert invariants about the tokens and MUST NOT redefine the token artifact as spec-mastered data.

#### Scenario: Token truth binds an automated check against the artifact

- **WHEN** a `design-system/tokens/*` spec states an invariant such as "all UI color derives from named semantic tokens" or "text/background pairs meet WCAG AA"
- **THEN** its paired enforcement binds a lint or contrast/a11y check whose target is the token artifact
- **AND** the spec describes the contract without becoming the source the runtime consumes

#### Scenario: Voice truth binds the design review lens

- **WHEN** a `design-system/voice/*` spec states a principle such as "copy is second-person and terse" or "error copy never blames the user"
- **THEN** its paired enforcement is a review binding judged by the `design` lens

### Requirement: Design review lens judges the design-system plane

The default review-panel lens set SHALL include a `design` lens scoped to the `design-system` plane, asking "Does the UI and copy honor the design tokens, principles, and voice?" The router SHALL route a design-system pair with no explicitly declared lens to the `design` lens by the same most-specific-subtree rule used for other planes.

#### Scenario: A design-system pair routes to the design lens by default

- **WHEN** a governed pair under `design-system/` declares no explicit lens
- **THEN** the router resolves it to the `design` lens

### Requirement: Design-system ships a per-plane authoring template

The schema SHALL ship a `design-system-spec.md` template alongside the other per-plane templates. The template SHALL show the DESCRIBE direction, both strata (tokens and voice), stable-identity frontmatter, and at least one `ADDED Requirement` with a scenario for each stratum.

#### Scenario: Authoring a design-system spec has a worked template

- **WHEN** a user authors a `design-system` spec
- **THEN** the schema template demonstrates the token stratum, the voice stratum, and the DESCRIBE pattern

