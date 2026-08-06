## MODIFIED Requirements

### Requirement: Tool-Agnostic Updates
The update command SHALL refresh OpenSpec-managed files in a predictable manner while respecting each team's chosen tooling, and for governed projects SHALL regenerate skill and command files from the project's current resolved plane set.

#### Scenario: Updating files
- **WHEN** updating files
- **THEN** completely replace `openspec/AGENTS.md` with the latest template
- **AND** create or refresh the root-level `AGENTS.md` stub using the managed marker block, even if the file was previously absent
- **AND** update only the OpenSpec-managed sections inside existing AI tool files, leaving user-authored content untouched
- **AND** avoid creating new native-tool configuration files (slash commands, CLAUDE.md, etc.) unless they already exist

#### Scenario: Regenerating governed skills from current planes
- **WHEN** a governed project's `config.yaml` plane set differs from the planes baked into its generated skill files
- **AND** the user runs `openspec update`
- **THEN** the generated skill and command files are rewritten with awareness for the current resolved plane set
- **AND** the regenerated guidance reflects each plane's declared `purpose` and trigger guidance

#### Scenario: Legacy update remains unchanged
- **WHEN** a legacy (non-governed) project runs `openspec update`
- **THEN** the generated skill files are byte-identical to the legacy flat prompts
- **AND** no governed plane awareness is appended