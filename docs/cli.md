# CLI Reference

The Specbase CLI (`specbase`) provides terminal commands for project setup, validation, status inspection, and management. These commands complement the AI slash commands (like `/spcb:propose`) documented in [Commands](commands.md).

## Summary

| Category | Commands | Purpose |
|----------|----------|---------|
| **Setup** | `init`, `update` | Initialize and update Specbase in your project |
| **Stores (standalone Specbase repos)** | `store setup`, `store register`, `store unregister`, `store remove`, `store list`, `store doctor` | Manage stores — standalone Specbase repos you've registered |
| **Health** | `doctor` | Report relationship health for the resolved root |
| **Working context** | `context` | Assemble the working set (root + referenced stores) |
| **Personal worksets** | `workset create`, `workset list`, `workset open`, `workset remove` | Keep and open personal, local working views in your tool |
| **Browsing** | `list`, `view`, `show` | Explore changes and specs |
| **Validation** | `validate` | Check changes and specs for issues |
| **Lifecycle** | `archive` | Finalize completed changes |
| **Workflow** | `new change`, `status`, `instructions`, `templates`, `schemas` | Artifact-driven workflow support |
| **Schemas** | `schema init`, `schema fork`, `schema validate`, `schema which` | Create and manage custom workflows |
| **Config** | `config` | View and modify settings |
| **Utility** | `feedback`, `completion` | Feedback and shell integration |

---

## Human vs Agent Commands

Most CLI commands are designed for **human use** in a terminal. Some commands also support **agent/script use** via JSON output.

### Human-Only Commands

These commands are interactive and designed for terminal use:

| Command | Purpose |
|---------|---------|
| `specbase init` | Initialize project (interactive prompts) |
| `specbase view` | Interactive dashboard |
| `specbase workset open <name>` | Open a saved workset (editor window or terminal agent session) |
| `specbase config edit` | Open config in editor |
| `specbase feedback` | Submit feedback via GitHub |
| `specbase completion install` | Install shell completions |

### Agent-Compatible Commands

These commands support `--json` output for programmatic use by AI agents and scripts:

| Command | Human Use | Agent Use |
|---------|-----------|-----------|
| `specbase list` | Browse changes/specs | `--json` for structured data |
| `specbase show <item>` | Read content | `--json` for parsing |
| `specbase validate` | Check for issues | `--all --json` for bulk validation |
| `specbase status` | See artifact progress | `--json` for structured status |
| `specbase instructions` | Get next steps | `--json` for agent instructions |
| `specbase templates` | Find template paths | `--json` for path resolution |
| `specbase schemas` | List available schemas | `--json` for schema discovery |
| `specbase store setup <id>` | Create and register a local store | `--json` with explicit inputs for structured setup output |
| `specbase store register <path>` | Register an existing store | `--json` for structured registration output |
| `specbase store unregister <id>` | Forget a local store registration | `--json` for structured cleanup output |
| `specbase store remove <id>` | Delete a registered local store folder | `--yes --json` for non-interactive deletion |
| `specbase store list` | Browse registered stores | `--json` for structured registrations |
| `specbase store doctor` | Check local store setup | `--json` for structured diagnostics |
| `specbase new change <id>` | Create repo-local change scaffolding | `--json`, plus `--store <id>` to use a registered store as the Specbase root |
| `specbase workset create [name]` | Compose a personal working view | `--member <path> --json` for non-interactive composition |
| `specbase workset list` | Browse saved worksets | `--json` for structured views |
| `specbase workset remove <name>` | Delete a saved view | `--yes --json` for non-interactive removal |

---

## Global Options

These options work with all commands:

| Option | Description |
|--------|-------------|
| `--version`, `-V` | Show version number |
| `--no-color` | Disable color output |
| `--help`, `-h` | Display help for command |

---

## Setup Commands

### `specbase init`

Initialize Specbase in your project. Creates the folder structure and configures AI tool integrations.

Default behavior uses global config defaults: profile `core`, delivery `both`, workflows `propose, explore, apply, sync, archive`.

```
specbase init [path] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Target directory (default: current directory) |

**Options:**

| Option | Description |
|--------|-------------|
| `--tools <list>` | Configure AI tools non-interactively. Use `all`, `none`, or comma-separated list |
| `--force` | Auto-cleanup legacy files without prompting |
| `--profile <profile>` | Override global profile for this init run (`core` or `custom`) |

`--profile custom` uses whatever workflows are currently selected in global config (`specbase config profile`).

**Supported tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `vibe`, `oh-my-pi`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `windsurf`

> This list mirrors `AI_TOOLS` in `src/core/config.ts`. See [Supported Tools](supported-tools.md) for each tool's skill and command paths.

**Examples:**

```bash
# Interactive initialization
specbase init

# Initialize in a specific directory
specbase init ./my-project

# Non-interactive: configure for Claude and Cursor
specbase init --tools claude,cursor

# Configure for all supported tools
specbase init --tools all

# Override profile for this run
specbase init --profile core

# Skip prompts and auto-cleanup legacy files
specbase init --force
```

**What it creates:**

```
specbase/
├── specs/              # Your specifications (source of truth)
├── changes/            # Proposed changes
└── config.yaml         # Project configuration

.claude/skills/         # Claude Code skills (if claude selected)
.cursor/skills/         # Cursor skills (if cursor selected)
.cursor/commands/       # Cursor SPCB commands (if delivery includes commands)
... (other tool configs)
```

---

### `specbase update`

Update Specbase instruction files after upgrading the CLI. Re-generates AI tool configuration files using your current global profile, selected workflows, and delivery mode.

```
specbase update [path] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | No | Target directory (default: current directory) |

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Force update even when files are up to date |

**Example:**

```bash
# Update instruction files after npm upgrade
npm update @awarebydefault/specbase
specbase update
```

---

## Stores (standalone Specbase repos)

> **Beta.** Stores and the features built on them (references, working context, worksets) are new; command names, flags, file formats, and JSON output may change shape between releases. For the problem-first walkthrough, see the [stores guide](stores-beta/user-guide.md).

A store is a standalone Specbase repo you've registered on this machine — for example a planning repo or a contracts repo. Registering a store lets normal commands (`list`, `show`, `status`, `validate`, `new change`, `archive`, ...) act in it from anywhere by passing `--store <id>`.

### `specbase store setup`

Create and register a local store. With no arguments in a terminal,
Specbase guides the user through setup. Agents and scripts should pass explicit
inputs and use `--json`.

```bash
specbase store setup [id] [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--path <path>` | Folder where the store should live (for example `~/specbase/<id>`) |
| `--remote <url>` | Record the canonical remote in the new store's `store.yaml` |
| `--init-git` | Initialize a Git repository with an initial commit (default) |
| `--no-init-git` | Skip every Git action: no init, no initial commit |
| `--json` | Output JSON |

Non-interactive runs (`--json`, scripts, agents) must pass both the store id and `--path`. In an interactive terminal, setup prompts for the location with an editable suggestion in a visible, user-owned place (for example `~/specbase/<id>`); it never defaults to Specbase's managed data directory.

Examples:

```bash
specbase store setup
specbase store setup team-context
specbase store setup team-context --path ~/specbase/team-context --no-init-git
specbase store setup team-context --path ~/specbase/team-context --no-init-git --json
```

### `specbase store register`

Register an existing local store folder. During the stores beta, a root may be
registered before any changes exist, specs have been applied, or changes have
been archived; in that case `specbase/changes/`, `specbase/specs/`, and
`specbase/changes/archive/` may be absent until normal commands create them.
A config-only repo that declares `store: <id>` remains a pointer to another
store and is not registered as a store root unless that pointer is removed.

```bash
specbase store register [path] [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--id <id>` | Store id; defaults to store metadata or folder name |
| `--yes` | Confirm creating store identity metadata for a healthy Specbase root |
| `--json` | Output JSON |

### `specbase store unregister`

Forget a local store registration without deleting files.

```bash
specbase store unregister <id> [--json]
```

Use this when a store was moved, cloned somewhere else, or should no longer be
shown by Specbase on this machine.

### `specbase store remove`

Forget a local store registration and delete its local folder.

```bash
specbase store remove <id> [--yes] [--json]
```

`remove` shows the exact folder before deleting in an interactive terminal.
Agents, scripts, and JSON callers must pass `--yes` to confirm deletion.
Specbase refuses to delete a folder that does not contain matching
store metadata.

### `specbase store list`

List locally registered stores.

```bash
specbase store list [--json]
specbase store ls [--json]
```

### `specbase store doctor`

Check local store registration, metadata, and Git presence.

```bash
specbase store doctor [id] [--json]
```

Doctor is diagnostic-only; it reports missing roots, metadata mismatches, and invalid local registry state without modifying the store.

### Referencing stores from a project

A project repo can declare which stores its work draws on in `specbase/config.yaml`:

```yaml
schema: spec-driven
references:
  - team-context
```

From then on, `specbase instructions` output in that repo (both the per-artifact and `apply` surfaces, JSON and human modes) carries an index of each referenced store's specs — spec ids, a one-line summary from each spec's Purpose section, and the fetch command (`specbase show <spec-id> --type spec --store <id>`). The index is built live from the registered checkout on every run; spec content is never copied into the output.

References are read-only context. They never change where commands act: work stays in the repo's own root, and writing to a referenced store remains an explicit `--store` action. A reference that cannot be resolved (for example, a store not registered on this machine) degrades to a warning in the index with the exact fix, and instructions still generate. `specbase doctor` reports reference health in one place.

### Recording where a store is cloned from

A store can record its canonical clone source in its committed identity file, so onboarding never dead-ends at "register the store":

```bash
specbase store setup team-context --path ~/specbase/team-context \
  --remote git@github.com:acme/team-context.git
```

The remote lands in `.specbase-store/store.yaml` inside the initial commit, so every clone is born knowing it. For an existing store, edit `store.yaml` by hand and commit. `store doctor` shows the recorded remote (and the checkout's observed Git origin); setup/register sharing guidance names it; and register records the checkout's origin in the machine-local registry.

A reference declaration can carry the clone source too, so a teammate who doesn't have the store yet gets a complete, pasteable fix (`git clone <remote> <path> && specbase store register <path> --id <id>`):

```yaml
references:
  - { id: team-context, remote: "git@github.com:acme/team-context.git" }
```

Recording a remote is not sync: Specbase never clones, pulls, or pushes on its own.

### Declaring a default store

A repo whose planning is fully externalized — no local `specbase/specs/` or `specbase/changes/` — can declare its store once instead of passing `--store` on every command:

```yaml
# specbase/config.yaml (the only file under specbase/)
store: team-context
```

Normal commands then resolve to the declared store automatically; the root banner and JSON `root` block report `source: "declared"` with the store id, and printed hints still carry `--store <id>`. The declaration is a fallback, never an override: explicit `--store` always wins, and a directory with real planning folders ignores the pointer (with a warning). To convert a pointer repo into a local Specbase root, remove the `store:` line and run `specbase init` — init refuses to scaffold while the declaration is present.

## Doctor (relationship health)

One read-only question, one place: is the Specbase root healthy, and are the stores it references available on this machine?

```bash
specbase doctor [--store <id>] [--json]
```

The report separates root health, store metadata health (including a note when the recorded remote and the checkout's origin diverge), and reference health (the same diagnostics instructions show, with clone fixes for unresolved references). Health findings of any severity exit 0 — agents read the `status` arrays; only command failures (no root, unknown store) exit 1. Doctor never clones, syncs, or repairs. To get the assembled set itself rather than its health, use `specbase context`.

## Working context (the assembled set)

Everything this work relates to through Specbase declarations, in one working set: the Specbase root and the stores it references.

```bash
specbase context [--store <id>] [--json] [--code-workspace <path> [--force]]
```

The JSON brief is agent-consumable (each available referenced store carries its fetch recipe; unresolved members carry the same fixes instructions and doctor show). `--code-workspace` additionally writes a VS Code workspace file containing the root plus the available referenced stores (`ref:<id>` folders) — the one write this command performs, refused without `--force` if the file exists. Unavailable members are reported, never guessed at.

"Working context" is the assembled set; the `context:` field in `specbase/config.yaml` is project background injected into instructions — two different things. `specbase doctor` answers whether the set is healthy; `specbase context` answers what the set is.

## Personal worksets

> **Beta.** Worksets are part of the new beta surface; commands, flags, and file formats may change shape between releases. For the walkthrough, see the [stores guide](stores-beta/user-guide.md#worksets-reopen-the-folders-you-work-on-together).

A workset is a personal, named view of the folders you work on together — a planning root plus whatever else you choose — kept on your machine and reopened by name in your tool. It is purely local: never committed, never shared, never derived from declarations, and removing one never touches a member folder.

```bash
specbase workset create [name] [--member <path> | --member <name>=<path>]... [--tool <id>] [--json]
specbase workset list [--json]
specbase workset open <name> [--tool <id>]
specbase workset remove <name> [--yes] [--json]
```

`create` runs a short guided flow (or takes `--member` flags non-interactively; the first member is the primary — sessions start there). `open` launches the chosen tool: editors (VS Code, Cursor) open a window with every member and return; CLI agents (Claude Code, codex) take over this terminal as a session with every member attached and no prompt pre-filled, ending when you exit. A member folder missing at open time is skipped with a note; the rest opens. The saved tool preference is overridable per open with `--tool`.

Supporting a new tool is configuration, not code. Every tool is one of two launch styles — `workspace-file` (launched with the generated `.code-workspace`) or `attach-dirs` (one attach flag per member) — and the `openers` key in the global `config.json` (open it with `specbase config edit`) adds tools or adjusts built-ins per field:

```json
{
  "openers": {
    "zed": { "style": "workspace-file" },
    "claude": { "attach_flag": "--dir" }
  }
}
```

All workset state lives under the global data dir's `worksets/` folder (the saved views plus the generated `<name>.code-workspace` files, regenerated on every open); deleting that folder removes every trace.

---

## Browsing Commands

### `specbase list`

List changes or specs in your project.

```
specbase list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--specs` | List specs instead of changes |
| `--changes` | List changes (default) |
| `--sort <order>` | Sort by `recent` (default) or `name` |
| `--json` | Output as JSON |

**Examples:**

```bash
# List all active changes
specbase list

# List all specs
specbase list --specs

# JSON output for scripts
specbase list --json
```

**Output (text):**

```
Changes:
  add-dark-mode     No tasks      just now
```

---

### `specbase view`

Display an interactive dashboard for exploring specs and changes.

```
specbase view
```

Opens a terminal-based interface for navigating your project's specifications and changes.

---

### `specbase show`

Display details of a change or spec.

```
specbase show [item-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `item-name` | No | Name of change or spec (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--type <type>` | Specify type: `change` or `spec` (auto-detected if unambiguous) |
| `--json` | Output as JSON |
| `--no-interactive` | Disable prompts |

**Change-specific options:**

| Option | Description |
|--------|-------------|
| `--deltas-only` | Show only delta specs (JSON mode) |

**Spec-specific options:**

| Option | Description |
|--------|-------------|
| `--requirements` | Show only requirements, exclude scenarios (JSON mode) |
| `--no-scenarios` | Exclude scenario content (JSON mode) |
| `-r, --requirement <id>` | Show specific requirement by 1-based index (JSON mode) |

**Examples:**

```bash
# Interactive selection
specbase show

# Show a specific change
specbase show add-dark-mode

# Show a specific spec
specbase show auth --type spec

# JSON output for parsing
specbase show add-dark-mode --json
```

---

## Validation Commands

### `specbase validate`

Validate changes and specs for structural issues.

```
specbase validate [item-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `item-name` | No | Specific item to validate (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--all` | Validate all changes and specs |
| `--changes` | Validate all changes |
| `--specs` | Validate all specs |
| `--type <type>` | Specify type when name is ambiguous: `change` or `spec` |
| `--strict` | Enable strict validation mode |
| `--json` | Output as JSON |
| `--concurrency <n>` | Max parallel validations (default: 6, or `SPECBASE_CONCURRENCY` env) |
| `--no-interactive` | Disable prompts |

**Examples:**

```bash
# Interactive validation
specbase validate

# Validate a specific change
specbase validate add-dark-mode

# Validate all changes
specbase validate --changes

# Validate everything with JSON output (for CI/scripts)
specbase validate --all --json

# Strict validation with increased parallelism
specbase validate --all --strict --concurrency 12
```

**Output (text):**

```
Validating add-dark-mode...
  ✓ proposal.md valid
  ✓ specs/ui/spec.md valid
  ⚠ design.md: missing "Technical Approach" section

1 warning found
```

**Output (JSON):**

```json
{
  "version": "1.0.0",
  "results": {
    "changes": [
      {
        "name": "add-dark-mode",
        "valid": true,
        "warnings": ["design.md: missing 'Technical Approach' section"]
      }
    ]
  },
  "summary": {
    "total": 1,
    "valid": 1,
    "invalid": 0
  }
}
```

---

## Lifecycle Commands

### `specbase archive`

Archive a completed change and merge delta specs into main specs.

```
specbase archive [change-name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `change-name` | No | Change to archive (prompts if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `--skip-specs` | Skip spec updates (for infrastructure/tooling/doc-only changes) |
| `--no-validate` | Skip validation (requires confirmation) |

**Examples:**

```bash
# Interactive archive
specbase archive

# Archive specific change
specbase archive add-dark-mode

# Archive without prompts (CI/scripts)
specbase archive add-dark-mode --yes

# Archive a tooling change that doesn't affect specs
specbase archive update-ci-config --skip-specs
```

**What it does:**

1. Validates the change (unless `--no-validate`)
2. Prompts for confirmation (unless `--yes`)
3. Merges delta specs into `specbase/specs/`
4. Moves change folder to `specbase/changes/archive/YYYY-MM-DD-<name>/`

---

## Workflow Commands

These commands support the artifact-driven SPCB workflow. They're useful for both humans checking progress and agents determining next steps.

### `specbase new change`

Create a change directory and optional checked-in metadata in the resolved Specbase root.

```bash
specbase new change <name> [options]
```

Change names must use lowercase kebab-case. They start with a lowercase letter,
then contain lowercase letters, numbers, and single hyphens. They cannot start
with a number, contain spaces, underscores, uppercase letters, consecutive
hyphens, or leading/trailing hyphens. When including an external ticket ID,
prefix it with a word, for example `ticket-123-add-notifications` instead of
`123-add-notifications`.

**Options:**

| Option | Description |
|--------|-------------|
| `--description <text>` | Description to add to `README.md` |
| `--goal <text>` | Optional goal metadata to store with the change |
| `--schema <name>` | Workflow schema to use |
| `--store <id>` | Store id to use as the Specbase root (a store is a standalone Specbase repo you've registered) |
| `--json` | Output JSON |

Examples:

```bash
specbase new change add-billing-api
specbase new change add-billing-api --store team-context --json
```

### `specbase status`

Display artifact completion status for a change.

```
specbase status [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--change <id>` | Change name (prompts if omitted) |
| `--schema <name>` | Schema override (auto-detected from change's config) |
| `--json` | Output as JSON |

**Examples:**

```bash
# Interactive status check
specbase status

# Status for specific change
specbase status --change add-dark-mode

# JSON for agent use
specbase status --change add-dark-mode --json
```

**Output (text):**

```
Change: add-dark-mode
Schema: spec-driven
Progress: 2/4 artifacts complete

[x] proposal
[ ] design
[x] specs
[-] tasks (blocked by: design)
```

**Output (JSON):**

```json
{
  "changeName": "add-dark-mode",
  "schemaName": "spec-driven",
  "isComplete": false,
  "applyRequires": ["tasks"],
  "artifacts": [
    {"id": "proposal", "outputPath": "proposal.md", "status": "done"},
    {"id": "design", "outputPath": "design.md", "status": "ready"},
    {"id": "specs", "outputPath": "specs/**/*.md", "status": "done"},
    {"id": "tasks", "outputPath": "tasks.md", "status": "blocked", "missingDeps": ["design"]}
  ]
}
```

---

### `specbase instructions`

Get enriched instructions for creating an artifact or applying tasks. Used by AI agents to understand what to create next.

```
specbase instructions [artifact] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `artifact` | No | Artifact ID: `proposal`, `specs`, `design`, `tasks`, or `apply` |

**Options:**

| Option | Description |
|--------|-------------|
| `--change <id>` | Change name (required in non-interactive mode) |
| `--schema <name>` | Schema override |
| `--json` | Output as JSON |

**Special case:** Use `apply` as the artifact to get task implementation instructions.

**Examples:**

```bash
# Get instructions for next artifact
specbase instructions --change add-dark-mode

# Get specific artifact instructions
specbase instructions design --change add-dark-mode

# Get apply/implementation instructions
specbase instructions apply --change add-dark-mode

# JSON for agent consumption
specbase instructions design --change add-dark-mode --json
```

**Output includes:**

- Template content for the artifact
- Project context from config
- Content from dependency artifacts
- Per-artifact rules from config

---

### `specbase templates`

Show resolved template paths for all artifacts in a schema.

```
specbase templates [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--schema <name>` | Schema to inspect (default: `spec-driven`) |
| `--json` | Output as JSON |

**Examples:**

```bash
# Show template paths for default schema
specbase templates

# Show templates for custom schema
specbase templates --schema my-workflow

# JSON for programmatic use
specbase templates --json
```

**Output (text):**

```
Schema: spec-driven

Templates:
  proposal  → ~/.specbase/schemas/spec-driven/templates/proposal.md
  specs     → ~/.specbase/schemas/spec-driven/templates/specs.md
  design    → ~/.specbase/schemas/spec-driven/templates/design.md
  tasks     → ~/.specbase/schemas/spec-driven/templates/tasks.md
```

---

### `specbase schemas`

List available workflow schemas with their descriptions and artifact flows.

```
specbase schemas [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

**Example:**

```bash
specbase schemas
```

**Output:**

```
Available schemas:

  spec-driven (package)
    The default spec-driven development workflow
    Flow: proposal → specs → design → tasks

  my-custom (project)
    Custom workflow for this project
    Flow: research → proposal → tasks
```

---

## Schema Commands

Commands for creating and managing custom workflow schemas.

### `specbase schema init`

Create a new project-local schema.

```
specbase schema init <name> [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Schema name (kebab-case) |

**Options:**

| Option | Description |
|--------|-------------|
| `--description <text>` | Schema description |
| `--artifacts <list>` | Comma-separated artifact IDs (default: `proposal,specs,design,tasks`) |
| `--default` | Set as project default schema |
| `--no-default` | Don't prompt to set as default |
| `--force` | Overwrite existing schema |
| `--json` | Output as JSON |

**Examples:**

```bash
# Interactive schema creation
specbase schema init research-first

# Non-interactive with specific artifacts
specbase schema init rapid \
  --description "Rapid iteration workflow" \
  --artifacts "proposal,tasks" \
  --default
```

**What it creates:**

```
specbase/schemas/<name>/
├── schema.yaml           # Schema definition
└── templates/
    ├── proposal.md       # Template for each artifact
    ├── specs.md
    ├── design.md
    └── tasks.md
```

---

### `specbase schema fork`

Copy an existing schema to your project for customization.

```
specbase schema fork <source> [name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `source` | Yes | Schema to copy |
| `name` | No | New schema name (default: `<source>-custom`) |

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Overwrite existing destination |
| `--json` | Output as JSON |

**Example:**

```bash
# Fork the built-in spec-driven schema
specbase schema fork spec-driven my-workflow
```

---

### `specbase schema validate`

Validate a schema's structure and templates.

```
specbase schema validate [name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | No | Schema to validate (validates all if omitted) |

**Options:**

| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed validation steps |
| `--json` | Output as JSON |

**Example:**

```bash
# Validate a specific schema
specbase schema validate my-workflow

# Validate all schemas
specbase schema validate
```

---

### `specbase schema which`

Show where a schema resolves from (useful for debugging precedence).

```
specbase schema which [name] [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | No | Schema name |

**Options:**

| Option | Description |
|--------|-------------|
| `--all` | List all schemas with their sources |
| `--json` | Output as JSON |

**Example:**

```bash
# Check where a schema comes from
specbase schema which spec-driven
```

**Output:**

```
spec-driven resolves from: package
  Source: /usr/local/lib/node_modules/@awarebydefault/specbase/schemas/spec-driven
```

**Schema precedence:**

1. Project: `specbase/schemas/<name>/`
2. User: `~/.local/share/specbase/schemas/<name>/`
3. Package: Built-in schemas

---

## Configuration Commands

### `specbase config`

View and modify global Specbase configuration.

```
specbase config <subcommand> [options]
```

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `path` | Show config file location |
| `list` | Show all current settings |
| `get <key>` | Get a specific value |
| `set <key> <value>` | Set a value |
| `unset <key>` | Remove a key |
| `reset` | Reset to defaults |
| `edit` | Open in `$EDITOR` |
| `profile [preset]` | Configure workflow profile interactively or via preset |

**Examples:**

```bash
# Show config file path
specbase config path

# List all settings
specbase config list

# Get a specific value
specbase config get telemetry.enabled

# Set a value
specbase config set telemetry.enabled false

# Set a string value explicitly
specbase config set user.name "My Name" --string

# Remove a custom setting
specbase config unset user.name

# Reset all configuration
specbase config reset --all --yes

# Edit config in your editor
specbase config edit

# Configure profile with action-based wizard
specbase config profile

# Fast preset: switch workflows to core (keeps delivery mode)
specbase config profile core
```

`specbase config profile` starts with a current-state summary, then lets you choose:
- Change delivery + workflows
- Change delivery only
- Change workflows only
- Keep current settings (exit)

If you keep current settings, no changes are written and no update prompt is shown.
If there are no config changes but the current project files are out of sync with your global profile/delivery, Specbase will show a warning and suggest `specbase update`.
Pressing `Ctrl+C` also cancels the flow cleanly (no stack trace) and exits with code `130`.
In the workflow checklist, `[x]` means the workflow is selected in global config. To apply those selections to project files, run `specbase update` (or choose `Apply changes to this project now?` when prompted inside a project).

**Interactive examples:**

```bash
# Delivery-only update
specbase config profile
# choose: Change delivery only
# choose delivery: Skills only

# Workflows-only update
specbase config profile
# choose: Change workflows only
# toggle workflows in the checklist, then confirm
```

---

## Utility Commands

### `specbase feedback`

Submit feedback about Specbase. Creates a GitHub issue.

```
specbase feedback <message> [options]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `message` | Yes | Feedback message |

**Options:**

| Option | Description |
|--------|-------------|
| `--body <text>` | Detailed description |

**Requirements:** GitHub CLI (`gh`) must be installed and authenticated.

**Example:**

```bash
specbase feedback "Add support for custom artifact types" \
  --body "I'd like to define my own artifact types beyond the built-in ones."
```

---

### `specbase completion`

Manage shell completions for the Specbase CLI.

```
specbase completion <subcommand> [shell]
```

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `generate [shell]` | Output completion script to stdout |
| `install [shell]` | Install completion for your shell |
| `uninstall [shell]` | Remove installed completions |

**Supported shells:** `bash`, `zsh`, `fish`, `powershell`

**Examples:**

```bash
# Install completions (auto-detects shell)
specbase completion install

# Install for specific shell
specbase completion install zsh

# Generate script for manual installation
specbase completion generate bash > ~/.bash_completion.d/specbase

# Uninstall
specbase completion uninstall
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (validation failure, missing files, etc.) |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SPECBASE_TELEMETRY` | Set to `0` to disable telemetry |
| `DO_NOT_TRACK` | Set to `1` to disable telemetry (standard DNT signal) |
| `SPECBASE_CONCURRENCY` | Default concurrency for bulk validation (default: 6) |
| `EDITOR` or `VISUAL` | Editor for `specbase config edit` |
| `NO_COLOR` | Disable color output when set |

---

## Related Documentation

- [Commands](commands.md) - AI slash commands (`/spcb:propose`, `/spcb:apply`, etc.)
- [Workflows](workflows.md) - Common patterns and when to use each command
- [Customization](customization.md) - Create custom schemas and templates
- [Getting Started](getting-started.md) - First-time setup guide
