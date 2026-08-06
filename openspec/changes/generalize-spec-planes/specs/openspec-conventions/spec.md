## MODIFIED Requirements

### Requirement: Project Structure
An OpenSpec project SHALL maintain a consistent directory structure for specifications and changes. Under the governed model, current specs live under plane roots named by the resolved plane set rather than a fixed two-plane enum.

#### Scenario: Initializing project structure
- **WHEN** an OpenSpec project is initialized
- **THEN** it SHALL have this structure:
```
openspec/
├── project.md              # Project-specific context
├── AGENTS.md               # AI assistant instructions
├── specs/                  # Current deployed capabilities
│   └── [capability]/       # Single, focused capability
│       ├── spec.md         # WHAT and WHY
│       └── design.md       # HOW (optional, for established patterns)
└── changes/                # Proposed changes
    ├── [change-name]/      # Descriptive change identifier
    │   ├── proposal.md     # Why, what, and impact
    │   ├── tasks.md        # Implementation checklist
    │   ├── design.md       # Technical decisions (optional)
    │   └── specs/          # Complete future state
    │       └── [capability]/
    │           └── spec.md # Clean markdown (no diff syntax)
    └── archive/            # Completed changes
        └── YYYY-MM-DD-[name]/
```

#### Scenario: Governed plane roots
- **WHEN** a governed project is initialized with the default plane set
- **THEN** the governed spec tree has one root directory per declared plane under `openspec/specs/`
- **AND** the default roots are `behavior`, `architecture`, `ops`, and `code-quality`
- **AND** a project that removes or adds planes in `config.yaml` has exactly the roots for its resolved plane set

#### Scenario: Governed plane roots are not created eagerly
- **WHEN** a governed project declares a plane but has no specs under it
- **THEN** the plane root directory is optional on disk
- **AND** discovery treats the plane as declared even when its directory is absent