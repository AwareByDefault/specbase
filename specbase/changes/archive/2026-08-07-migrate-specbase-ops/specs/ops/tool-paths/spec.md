---
id: ops.tool-paths
---

## ADDED Requirements

### Requirement: One registry names every supported AI tool
**ID:** tool-registry-is-the-single-roster
The `AI_TOOLS` array in `src/core/config.ts` SHALL be the single registry of
AI coding tools this product supports. Each entry SHALL carry a display `name`,
a stable `value` identifier, and an `available` flag. Every entry offered for
artifact generation (`available: true`) SHALL carry a `skillsDir` naming its
dot-prefixed project-local container directory. An entry MAY carry
`detectionPaths` to override the container directory for auto-detection. The
`AGENTS.md` fallback entry SHALL stay `available: false` with no `skillsDir`,
because nothing is generated for it.

#### Scenario: Every offered tool declares a container directory
**ID:** every-offered-tool-has-a-container-dir
- **WHEN** a tool entry is marked `available: true`
- **THEN** it declares a `skillsDir` beginning with `.`

#### Scenario: Detection paths override the container directory
**ID:** detection-paths-override-the-container-dir
- **WHEN** a tool entry declares `detectionPaths`
- **THEN** auto-detection tests those paths — files or directories — instead of the container directory
- **AND** any one of them existing marks the tool as detected

#### Scenario: The AGENTS.md fallback is not a generation target
**ID:** agents-fallback-is-not-generated-for
- **WHEN** the `agents` fallback entry is resolved
- **THEN** it is `available: false` and declares no `skillsDir`

### Requirement: Supported tools keep their container directories
**ID:** supported-tool-container-dirs
The registry SHALL keep these tools mapped to these project-local container
directories: `claude` → `.claude`, `cursor` → `.cursor`, `windsurf` →
`.windsurf`, `kimi` → `.kimi`, `gemini` → `.gemini`, `codex` → `.codex`,
`opencode` → `.opencode`, `pi` → `.pi`, `oh-my-pi` → `.omp`, and
`github-copilot` → `.github`. Supporting a new tool SHALL be one registry
entry, not a new path convention elsewhere.

#### Scenario: A named tool keeps its directory
**ID:** named-tools-keep-their-dirs
- **WHEN** any of the named tools is looked up in the registry
- **THEN** its `skillsDir` is the directory listed above

#### Scenario: Oh My Pi uses the .omp container
**ID:** oh-my-pi-uses-omp
- **WHEN** the `oh-my-pi` tool is looked up
- **THEN** its container directory is `.omp`

### Requirement: Generated artifacts live under the tool's container directory
**ID:** skills-live-under-the-container-dir
Skills for a tool with `skillsDir` `X` SHALL be written under `<root>/X/skills/`
— the `/skills` suffix comes from the Agent Skills specification and is
appended by the system, not stored in the registry. A tool with no `skillsDir`
SHALL NOT be a generation target. Detection of an installed tool SHALL test the
container directory at the project root, unless the entry overrides it with
`detectionPaths`.

#### Scenario: The skills suffix is appended to the container directory
**ID:** skills-path-appends-skills
- **WHEN** skills are generated for a tool whose container directory is `.claude`
- **THEN** they are written under `<projectRoot>/.claude/skills/`

#### Scenario: A tool without a container directory is skipped
**ID:** tool-without-container-dir-is-skipped
- **WHEN** a selected tool declares no `skillsDir`
- **THEN** it is excluded from skill generation rather than written to a guessed path

#### Scenario: Detection tests the container directory
**ID:** detection-tests-the-container-dir
- **WHEN** the project root contains a `.omp/` directory
- **THEN** Oh My Pi is reported as an available tool

### Requirement: Global surfaces resolve to the tool's own home directory
**ID:** global-surfaces-resolve-to-tool-home-dirs
Where a tool keeps a surface outside the project, the target SHALL resolve to
that tool's own home directory and SHALL honour the tool's environment
override. Codex command prompts SHALL resolve to `<CODEX_HOME>/prompts` when
`CODEX_HOME` is set, and to `<user home>/.codex/prompts` otherwise, on every
platform.

#### Scenario: The tool's home environment variable wins
**ID:** codex-home-override-honoured
- **WHEN** `CODEX_HOME` is set and a Codex command file is written
- **THEN** the path resolves under `<CODEX_HOME>/prompts`

#### Scenario: The default is the user's home directory
**ID:** codex-default-under-home
- **WHEN** `CODEX_HOME` is unset and a Codex command file is written
- **THEN** the path resolves under the user's home directory at `.codex/prompts`

### Requirement: Tool paths are built cross-platform
**ID:** paths-are-built-cross-platform
Every tool path SHALL be built with the Node `path` module — `path.join` for
relative segments, `path.resolve` for absolute ones — and SHALL NOT hardcode a
forward-slash separator, so Windows, macOS, and Linux each receive
platform-correct paths from the same code.

#### Scenario: Adapters join their path segments
**ID:** adapters-join-path-segments
- **WHEN** a command adapter computes its output file path
- **THEN** it composes the path from separate segments with `path.join`

#### Scenario: No separator is written by hand
**ID:** no-hardcoded-separators
- **WHEN** a tool path is constructed on Windows
- **THEN** the separators come from the platform, not from a literal `/` in the source
