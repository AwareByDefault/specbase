# Migration manifest: `openspec-old/` → `specbase/`

Per design **D7**, this is the coverage guarantee for the migration. Every
`### Requirement:` header in the legacy store gets exactly one row here with a
verdict and a destination locator. Drops carry a recorded reason; nothing is
dropped by implication.

## Scope

**Source (design D1)** = flat specs ∪ unarchived change-delta residue:

- `openspec-old/specs/*/spec.md` — 36 capability files, **246** requirements.
- `openspec-old/changes/*/specs/**/spec.md` (excluding `changes/archive/`) —
  77 delta files, **205** requirement entries.

The 82 changes under `openspec-old/changes/archive/` are history and are never
re-mined for current truth (D1). Totals below are mechanical counts taken from
the source tree, not estimates.

> Note on counts: the proposal/design cite "35 flat specs" and "~199 delta
> requirements". The actual tree holds **36** flat spec files and **205** delta
> requirement entries. This manifest uses the actual counts.

## Verdicts (design D2 / manifesto §5)

| Verdict | Meaning |
|---|---|
| **keep** | durable user-visible, structural, ops, or agentic truth |
| **promote** | internal mechanism that is a real structural invariant |
| **demote** | "how it works" narration with no contract to guard → design docs / code |
| **drop** | superseded, reverted, or an aspiration that never shipped |

Classification applied the manifesto's three rules: the **actor test** (§1) for
the plane, the **hoisting rule** (§4) for parent-vs-leaf placement, and the
**quantification test** (§4) — universally quantified claims ("every command
SHALL…") land on the `behavior/cli` parent pair rather than being restated in
every leaf.

Destinations are locators in the **D3 target tree**. `—` means the requirement
has no destination (demote or drop).

Rows marked *"merges into"* are delta `MODIFIED` entries that revise a
requirement already counted in Part A. They are listed (never silently folded)
and their destination is the same locator as the flat row they revise.

---

## Summary

| | Rows | keep | promote | demote | drop |
|---|---:|---:|---:|---:|---:|
| **Part A — flat specs** (`openspec-old/specs/`) | 246 | 202 | 7 | 9 | 28 |
| **Part B — delta residue** (`openspec-old/changes/`) | 205 | 165 | 9 | 1 | 30 |
| **Total** | **451** | **367** | **16** | **10** | **58** |

Part A rows = 246, matching the 246 `### Requirement:` headers under
`openspec-old/specs/`. Part B rows = 205, matching the 205 headers under
`openspec-old/changes/*/specs/**` (archive excluded). 246 + 205 = 451 = total
rows in this manifest.

### Destination totals (all 451 rows; `—` = demote + drop)

| Destination locator | Rows |
|---|---:|
| — (no destination: 10 demote + 58 drop) | 68 |
| `behavior/cli/init` | 40 |
| `behavior/cli` (parent pair — hoisted invariants) | 33 |
| `behavior/cli/update` | 22 |
| `behavior/governed` (parent pair) | 19 |
| `behavior/schemas/manage` | 16 |
| `behavior/workflow/instructions` | 15 |
| `behavior/cli/validate` | 14 |
| `architecture/command-generation` | 14 |
| `behavior/governed/enforcement` | 14 |
| `behavior/governed/workflow` | 13 |
| `behavior/cli/archive` | 12 |
| `behavior/store/format` | 12 |
| `behavior/cli/config` | 10 |
| `behavior/workflow/status` | 9 |
| `behavior/config/project` | 9 |
| `behavior/telemetry` | 9 |
| `behavior/cli/completion` | 8 |
| `behavior/config/profiles` | 8 |
| `behavior/config/global` | 8 |
| `behavior/cli/list` | 8 |
| `behavior/governed/coverage` | 8 |
| `ops/tool-paths` | 7 |
| `behavior/cli/view` | 7 |
| `behavior/cli/legacy-cleanup` | 7 |
| `behavior/workflow/new-change` | 6 |
| `behavior/schemas` (parent pair) | 6 |
| `agents/agent-docs` | 6 |
| `behavior/governed/review-panel` | 6 |
| `behavior/config/install-scope` | 6 |
| `ops/nix-ci` | 5 |
| `behavior/cli/feedback` | 5 |
| `code-quality/spec-authoring` | 4 |
| `behavior/schemas/structure` | 3 |
| `behavior/workflow/templates` | 3 |
| `design-system/cli-voice` | 3 |
| `behavior/cli/show` | 3 |
| `behavior/store/layout` | 3 |
| `architecture/artifact-graph` | 1 |
| `architecture/completion` | 1 |
| **Total** | **451** |

Three D3 locators take no legacy rows and are therefore authored fresh:
`ops/planning-layout` (new truth, added by this change), `agents/spec-driven`
and `agents/review-panel` (planted baselines, repaired in place by this
change). `ops/stack` and `design-system/cli-voice` additionally absorb clauses
split out of rows whose primary destination is elsewhere — those splits are
named in the Notes column, not counted as separate rows.

### Drop register (58 rows)

| Source capability | Rows | Reason |
|---|---:|---|
| `opsx-onboard-skill` (flat) | 8 | opsx skill surface superseded by the **spcb** skills (D8) |
| `opsx-verify-skill` (flat) | 6 | superseded by spcb skills (D8) |
| `opsx-archive-skill` (flat) | 6 | superseded by spcb skills (D8) |
| `specs-sync-skill` (flat) | 3 | the opsx *sync* skill; superseded by spcb skills (D8) |
| `opsx-explore-skill` (delta) | 5 | superseded by spcb skills (D8) |
| `opsx-update-skill` (delta) | 5 | superseded by spcb skills (D8) |
| `opsx-archive-skill` (delta MODIFIED) | 3 | revises a dropped spec (D8) |
| `opsx-onboard-skill` (delta MODIFIED) | 3 | revises a dropped spec (D8) |
| `opsx-verify-skill` (delta MODIFIED) | 2 | revises a dropped spec (D8) |
| `opsx-verify-skill` (delta ADDED, `add-review-panel-enforcement`) | 1 | superseded by spcb skills (D8); claim survives in `behavior/governed/review-panel` |
| `specs-sync-skill` (delta MODIFIED) | 2 | revises a dropped spec (D8) |
| `change-stacking-workflow` + its deltas | 7 | never shipped — no stacking code in `src/` (D8) |
| `developer-qa-workflow` | 2 | never shipped — no `Makefile` exists (D8, verified) |
| `cli-artifact-workflow` residue | 3 | `artifact-experimental-setup` command does not exist in `src/` |
| `cli-config` residue | 1 | reserved placeholder superseded by the shipped `--scope` option |
| `openspec-conventions` residue | 1 | migration-era adoption mandate, completed |

### Verified verdicts

| Item | Evidence | Verdict |
|---|---|---|
| `oh-my-pi-tool` (+ its `cli-init` / `cli-update` deltas) | **Shipped.** `src/core/config.ts:45` registers `{ name: 'Oh My Pi', value: 'oh-my-pi', available: true, skillsDir: '.omp' }` in `AI_TOOLS`; `src/core/command-generation/adapters/oh-my-pi.ts` defines `ohMyPiAdapter`; `src/core/command-generation/registry.ts:65` registers it; `src/core/init.ts:627` and `src/core/update.ts:202,697` apply the hyphen-command transform for it. | **keep** → `behavior/cli/init` (tool files), `behavior/cli/update`, `ops/tool-paths` |
| `change-stacking-workflow` | No stacking code, no stack metadata, no `stack` commands in `src/`. | **drop** |
| `developer-qa-workflow` | `ls Makefile` → no such file. | **drop** |
| `cli-artifact-workflow` "Tool selection flag" / "Output messaging" | `grep -rn artifact-experimental-setup src/` → no hits; the command was never shipped or has been removed. | **drop** |
| `cli-init` "Experimental Command Alias" | `src/cli/index.ts:181-183` still registers the hidden `experimental` → `init` alias. | **keep** |
| `cli-config` "Reserved Scope Flag" | `src/commands/config.ts:212` ships `--scope <scope>` as a real option ("only global supported"), so the *reserved-for-future* claim is no longer true. | **drop** (superseded by `behavior/config/install-scope`) |

---

# Part A — flat specs (`openspec-old/specs/*/spec.md`), 246 requirements

## `ai-tool-paths` (3)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | AIToolOption skillsDir field | keep | `ops/tool-paths` | tool-registry shape is an ops fact |
| 2 | Path configuration for supported tools | keep | `ops/tool-paths` | |
| 3 | Cross-platform path handling | keep | `ops/tool-paths` | |

## `artifact-graph` (7)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Schema Loading | promote | `architecture/artifact-graph` | narrowed to the DAG invariants: cycles, dangling references and duplicate IDs are rejected |
| 2 | Build Order Calculation | demote | — | "compute a valid topological build order" is mechanism narration (design D2's own example); the code and `test/core/artifact-graph/*` embody it |
| 3 | State Detection | keep | `behavior/workflow/status` | artifact-state detection is observable via `status` |
| 4 | Ready Artifact Query | demote | — | function-level API scenario; the user-visible outcome is `status`'s next-artifact reporting |
| 5 | Completion Check | demote | — | function-level API scenario; observable outcome lives in `behavior/workflow/status` |
| 6 | Blocked Query | demote | — | function-level API scenario; observable outcome lives in `behavior/workflow/status` |
| 7 | Schema Directory Structure | keep | `behavior/schemas/structure` | self-contained schema dirs + override precedence |

## `change-creation` (2)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Change Creation | keep | `behavior/workflow/new-change` | |
| 2 | Change Name Validation | keep | `behavior/workflow/new-change` | |

## `ci-nix-validation` (6)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Nix Flake Build Validation | keep | `ops/nix-ci` | |
| 2 | Update Script Validation | keep | `ops/nix-ci` | |
| 3 | CI Job Integration | keep | `ops/nix-ci` | |
| 4 | Local Testing Support | keep | `ops/nix-ci` | `act`-runnable workflow |
| 5 | Nix Installation in CI | keep | `ops/nix-ci` | |
| 6 | CI Performance Optimization | demote | — | "SHALL be optimized to minimize CI runtime impact" is unfalsifiable tuning guidance, not a contract |

## `cli-archive` (10)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Change Selection | keep | `behavior/cli` | hoisted: interactive selection with non-interactive fallback (duplicated across archive/show/validate/spec) |
| 2 | Task Completion Check | keep | `behavior/cli/archive` | |
| 3 | Archive Process | keep | `behavior/cli/archive` | |
| 4 | Spec Update Process | keep | `behavior/cli/archive` | absorbs `openspec-conventions`' archive-apply semantics |
| 5 | Confirmation Behavior | keep | `behavior/cli/archive` | |
| 6 | Error Conditions | keep | `behavior/cli` | hoisted: exit codes / actionable errors |
| 7 | Skip Specs Option | keep | `behavior/cli/archive` | |
| 8 | Non-blocking confirmation | keep | `behavior/cli/archive` | |
| 9 | Display Output | keep | `behavior/cli` | hoisted: delta display symbols |
| 10 | Archive Validation | keep | `behavior/cli/archive` | |

## `cli-artifact-workflow` (16)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Status Command | keep | `behavior/workflow/status` | includes scaffolded (empty) changes |
| 2 | Next Artifact Discovery | keep | `behavior/workflow/status` | |
| 3 | Instructions Command | keep | `behavior/workflow/instructions` | |
| 4 | Templates Command | keep | `behavior/workflow/templates` | |
| 5 | New Change Command | keep | `behavior/workflow/new-change` | |
| 6 | Schema Selection | keep | `behavior/schemas` | parent pair: resolution precedence |
| 7 | Output Formatting | keep | `behavior/cli` | hoisted: consistent output framing; voice judgments split to `design-system/cli-voice` |
| 8 | Experimental Isolation | drop | — | transitional "implement in isolation for easy removal" scaffolding; the workflow commands are first-class today |
| 9 | Schema Apply Block | keep | `behavior/schemas/structure` | |
| 10 | Apply Instructions Command | keep | `behavior/workflow/instructions` | |
| 11 | Tool selection flag | drop | — | targets `openspec artifact-experimental-setup`, which does not exist in `src/` (verified) |
| 12 | Output messaging | drop | — | same non-existent setup command |
| 13 | Status JSON provides planning context | keep | `behavior/workflow/status` | |
| 14 | Status JSON action context | keep | `behavior/workflow/status` | |
| 15 | Instructions use resolved planning paths | keep | `behavior/workflow/instructions` | |
| 16 | Workflow skills use CLI artifact context | keep | `behavior/governed/workflow` | generated workflows treat CLI output as source of truth |

## `cli-change` (4) — capability dissolves (D3)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Change Command | keep | `behavior/cli` | verb–noun structure + deprecated noun-form back-compat |
| 2 | Legacy Compatibility | keep | `behavior/cli` | hoisted back-compat invariant (deprecation notices) |
| 3 | Interactive show selection | keep | `behavior/cli` | hoisted interactivity; command-specific residue → `behavior/cli/show` |
| 4 | Interactive validation selection | keep | `behavior/cli` | hoisted interactivity; residue → `behavior/cli/validate` |

## `cli-completion` (11)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Native Shell Behavior Integration | keep | `behavior/cli/completion` | |
| 2 | Command Structure | keep | `behavior/cli/completion` | |
| 3 | Shell Detection | keep | `behavior/cli/completion` | |
| 4 | Completion Generation | keep | `behavior/cli/completion` | |
| 5 | Dynamic Completions | keep | `behavior/cli/completion` | |
| 6 | Installation Automation | keep | `behavior/cli/completion` | |
| 7 | Uninstallation | keep | `behavior/cli/completion` | |
| 8 | Architecture Patterns | promote | `architecture/completion` | narrowed to the common generator/installer interface + single-registry invariant; class-level pattern detail demoted |
| 9 | Error Handling | keep | `behavior/cli` | hoisted: exit codes / actionable errors |
| 10 | Output Format | keep | `behavior/cli/completion` | |
| 11 | Testing Support | demote | — | test-harness affordance ("SHALL be testable"), no product contract to guard |

## `cli-config` (12)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Command Structure | keep | `behavior/cli/config` | command surface only |
| 2 | Config Path | keep | `behavior/cli/config` | |
| 3 | Config List | keep | `behavior/cli/config` | |
| 4 | Config Get | keep | `behavior/cli/config` | |
| 5 | Config Set | keep | `behavior/cli/config` | |
| 6 | Config Unset | keep | `behavior/cli/config` | |
| 7 | Config Reset | keep | `behavior/cli/config` | |
| 8 | Config Edit | keep | `behavior/cli/config` | |
| 9 | Profile Configuration Flow | keep | `behavior/config/profiles` | the preference model, not the command surface |
| 10 | Key Naming Convention | keep | `behavior/cli/config` | |
| 11 | Schema Validation | keep | `behavior/config/global` | config schema is the preference-model truth |
| 12 | Reserved Scope Flag | drop | — | placeholder "reserve `--scope` for future extensibility"; `--scope <scope>` shipped (`src/commands/config.ts:212`) and the model is now `behavior/config/install-scope` |

## `cli-feedback` (7)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Feedback command | keep | `behavior/cli/feedback` | |
| 2 | GitHub CLI dependency | keep | `behavior/cli/feedback` | the *fallback behavior* stays here; the `gh` toolchain dependency itself is an ops fact → `ops/stack` (no-foreign-facts, manifesto §2) |
| 3 | Issue metadata | keep | `behavior/cli/feedback` | |
| 4 | Feedback always works | keep | `behavior/cli/feedback` | independent of telemetry state |
| 5 | Error handling | keep | `behavior/cli` | hoisted: actionable errors |
| 6 | Feedback skill for agents | keep | `behavior/cli/feedback` | |
| 7 | Shell completions | keep | `behavior/cli` | hoisted: completion registration for every command |

## `cli-init` (15)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Progress Indicators | keep | `behavior/cli/init` | |
| 2 | Directory Creation | keep | `behavior/cli/init` | |
| 3 | AI Tool Configuration | keep | `behavior/cli/init` | |
| 4 | Interactive Mode | keep | `behavior/cli` | hoisted interactivity invariant |
| 5 | Safety Checks | keep | `behavior/cli/init` | |
| 6 | Success Output | keep | `design-system/cli-voice` | actionable next-steps framing is voice |
| 7 | Exit Codes | keep | `behavior/cli` | hoisted exit-code invariant |
| 8 | Additional AI Tool Initialization | keep | `behavior/cli/init` | extend mode |
| 9 | Success Output Enhancements | keep | `design-system/cli-voice` | |
| 10 | Exit Code Adjustments | keep | `behavior/cli/init` | extend-mode-specific, stays at the leaf |
| 11 | Non-Interactive Mode | keep | `behavior/cli` | hoisted non-interactive fallback |
| 12 | Skill Generation | keep | `behavior/cli/init` | |
| 13 | Slash Command Generation | keep | `behavior/cli/init` | |
| 14 | Config File Generation | keep | `behavior/cli/init` | |
| 15 | Experimental Command Alias | keep | `behavior/cli` | hoisted back-compat; alias still registered (`src/cli/index.ts:183`) |

## `cli-list` (7)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Command Execution | keep | `behavior/cli/list` | |
| 2 | Task Counting | keep | `behavior/cli/list` | |
| 3 | Output Format | keep | `behavior/cli/list` | |
| 4 | Flags | keep | `behavior/cli` | hoisted verb–noun structure (nouns as flags/arguments) |
| 5 | Empty State | keep | `behavior/cli/list` | |
| 6 | Error Handling | keep | `behavior/cli` | hoisted |
| 7 | Sorting | keep | `behavior/cli/list` | |

## `cli-show` (3)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Top-level show command | keep | `behavior/cli/show` | |
| 2 | Output format options | keep | `behavior/cli` | hoisted universal `--json` |
| 3 | Interactivity controls | keep | `behavior/cli` | hoisted `--no-interactive` / `OPEN_SPEC_INTERACTIVE=0` |

## `cli-spec` (4) — capability dissolves (D3)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Interactive spec show | keep | `behavior/cli` | hoisted interactivity; residue → `behavior/cli/show` |
| 2 | Spec Command | keep | `behavior/cli` | deprecated noun-form back-compat |
| 3 | JSON Schema Definition | keep | `behavior/store/format` | the parsed spec structure is store-format truth |
| 4 | Interactive spec validation | keep | `behavior/cli` | hoisted; residue → `behavior/cli/validate` |

## `cli-update` (7)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Update Behavior | keep | `behavior/cli/update` | |
| 2 | Prerequisites | keep | `behavior/cli/update` | |
| 3 | File Handling | keep | `behavior/cli/update` | |
| 4 | Tool-Agnostic Updates | keep | `behavior/cli/update` | |
| 5 | Core Files Always Updated | keep | `behavior/cli/update` | the ASCII-safe success-message clause splits to `design-system/cli-voice` |
| 6 | Slash Command Updates | keep | `behavior/cli/update` | |
| 7 | Archive Command Argument Support | keep | `behavior/cli/update` | |

## `cli-validate` (10)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Validation SHALL provide actionable remediation steps | keep | `behavior/cli/validate` | |
| 2 | Validator SHALL detect likely misformatted scenarios and warn with a fix | keep | `behavior/cli/validate` | |
| 3 | All issues SHALL include file paths and structured locations | keep | `behavior/cli/validate` | |
| 4 | Invalid results SHALL include a Next steps footer in human-readable output | keep | `behavior/cli/validate` | footer *wording* is `design-system/cli-voice` |
| 5 | Top-level validate command | keep | `behavior/cli/validate` | |
| 6 | Bulk and filtered validation | keep | `behavior/cli/validate` | |
| 7 | Validation options and progress indication | keep | `behavior/cli/validate` | |
| 8 | Item type detection and ambiguity handling | keep | `behavior/cli/validate` | |
| 9 | Interactivity controls | keep | `behavior/cli` | hoisted (identical text to `cli-show`'s — the DRY violation the parent pair fixes) |
| 10 | Parser SHALL handle cross-platform line endings | keep | `behavior/store/format` | LF/CRLF/CR parsing is a format contract |

## `cli-view` (8)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Dashboard Display | keep | `behavior/cli/view` | |
| 2 | Summary Section | keep | `behavior/cli/view` | |
| 3 | Active Changes Display | keep | `behavior/cli/view` | |
| 4 | Completed Changes Display | keep | `behavior/cli/view` | |
| 5 | Specifications Display | keep | `behavior/cli/view` | |
| 6 | Visual Formatting | keep | `design-system/cli-voice` | colors/symbols consistency is expression, not behavior |
| 7 | Error Handling | keep | `behavior/cli` | hoisted |
| 8 | Draft Changes Display | keep | `behavior/cli/view` | |

## `command-generation` (5)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | CommandContent interface | promote | `architecture/command-generation` | tool-agnostic content boundary |
| 2 | ToolCommandAdapter interface | promote | `architecture/command-generation` | the adapter boundary |
| 3 | Command generator function | promote | `architecture/command-generation` | |
| 4 | CommandAdapterRegistry | promote | `architecture/command-generation` | single-registry invariant |
| 5 | Shared command body content | promote | `architecture/command-generation` | one body, many adapters |

## `config-loading` (6)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Load project config from openspec/config.yaml | keep | `behavior/config/project` | restated against the resolved planning root, not a hardcoded `openspec/` path |
| 2 | Support .yml file extension alias | keep | `behavior/config/project` | |
| 3 | Use resilient field-by-field parsing | keep | `behavior/config/project` | |
| 4 | Enforce context size limit | keep | `behavior/config/project` | |
| 5 | Defer artifact ID validation to instruction loading | keep | `behavior/workflow/instructions` | the validation happens there |
| 6 | Gracefully handle config errors without halting | keep | `behavior/config/project` | |

## `context-injection` (3)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Inject context into all artifact instructions | keep | `behavior/workflow/instructions` | |
| 2 | Format context with XML-style tags | keep | `behavior/workflow/instructions` | |
| 3 | Preserve context content exactly as provided | keep | `behavior/workflow/instructions` | |

## `docs-agent-instructions` (6)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Quick Reference Placement | keep | `agents/agent-docs` | |
| 2 | Embedded Templates and Examples | keep | `agents/agent-docs` | |
| 3 | Pre-validation Checklist | keep | `agents/agent-docs` | |
| 4 | Progressive Disclosure of Workflow Guidance | keep | `agents/agent-docs` | |
| 5 | Behavior-First Spec Authoring Guidance | keep | `agents/agent-docs` | the docs must *teach* it; the craft rule itself lives in `code-quality/spec-authoring` |
| 6 | Lightweight-by-Default Guidance | keep | `agents/agent-docs` | same split as row 5 |

## `global-config` (6)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Global configuration storage | keep | `behavior/config/global` | |
| 2 | Global Config Directory Path | keep | `behavior/config/global` | XDG + platform fallbacks |
| 3 | Global Config Loading | keep | `behavior/config/global` | |
| 4 | Global Config Saving | keep | `behavior/config/global` | |
| 5 | Default Configuration | keep | `behavior/config/global` | |
| 6 | Config Schema Evolution | keep | `behavior/config/global` | merge-with-defaults forward compatibility |

## `instruction-loader` (4)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Template Loading | keep | `behavior/workflow/templates` | |
| 2 | Change Context Loading | demote | — | function-level API narration (`loadChangeContext(...)`); the observable outcome is covered by `behavior/workflow/status` + `instructions` |
| 3 | Template Enrichment | keep | `behavior/workflow/instructions` | |
| 4 | Status Formatting | keep | `behavior/workflow/status` | |

## `legacy-cleanup` (6)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Legacy artifact detection | keep | `behavior/cli/legacy-cleanup` | |
| 2 | Legacy cleanup confirmation | keep | `behavior/cli/legacy-cleanup` | |
| 3 | Surgical removal of config file content | keep | `behavior/cli/legacy-cleanup` | |
| 4 | Legacy directory removal | keep | `behavior/cli/legacy-cleanup` | |
| 5 | project.md migration hint | keep | `behavior/cli/legacy-cleanup` | |
| 6 | Cleanup reporting | keep | `behavior/cli/legacy-cleanup` | |

## `openspec-conventions` (12)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Structured conventions for specs and changes | keep | `behavior/store/format` | |
| 2 | Behavior-First Specification Boundary | keep | `code-quality/spec-authoring` | judgment a linter cannot make |
| 3 | Progressive Rigor | keep | `code-quality/spec-authoring` | |
| 4 | Project Structure | keep | `behavior/store/layout` | |
| 5 | Structured Format for Behavioral Specs | keep | `behavior/store/format` | |
| 6 | Header-Based Requirement Identification | keep | `behavior/store/format` | |
| 7 | Change Storage Convention | keep | `behavior/store/format` | delta storage + rename semantics |
| 8 | Archive Process Enhancement | keep | `behavior/cli/archive` | archive-apply semantics merge into the command (D3) |
| 9 | Proposal Format | keep | `behavior/store/format` | |
| 10 | Change Review | demote | — | process narration ("SHALL support multiple methods for reviewing"); the reviewable surfaces are already specified by `behavior/cli/show` and `behavior/cli/view` |
| 11 | Structured Format Adoption | drop | — | migration-era adoption mandate ("SHALL adopt … as the default"); the structured format is now the only format, stated once in `behavior/store/format` |
| 12 | Verb–Noun CLI Command Structure | keep | `behavior/cli` | the parent pair's headline invariant |

## `opsx-archive-skill` (6) — **all dropped** (D8: superseded by the spcb skill surface)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | OPSX Archive Skill | drop | — | opsx skill surface superseded by spcb |
| 2 | Artifact Completion Check | drop | — | ditto; the durable claim survives as `behavior/governed/workflow` archive readiness |
| 3 | Task Completion Check | drop | — | ditto; command-level claim lives in `behavior/cli/archive` |
| 4 | Spec Sync Prompt | drop | — | ditto |
| 5 | Archive Process | drop | — | ditto |
| 6 | Skill Output | drop | — | ditto |

## `opsx-onboard-skill` (8) — **all dropped** (D8)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | OPSX Onboard Skill | drop | — | opsx skill surface superseded by spcb |
| 2 | Codebase Analysis for Task Suggestions | drop | — | ditto |
| 3 | Explore Phase Demo | drop | — | ditto |
| 4 | Guided Artifact Creation | drop | — | ditto |
| 5 | Guided Implementation | drop | — | ditto |
| 6 | Archive with Explanation | drop | — | ditto |
| 7 | Recap and Next Steps | drop | — | ditto |
| 8 | Graceful Exit Handling | drop | — | ditto |

## `opsx-verify-skill` (6) — **all dropped** (D8)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Verify Skill Invocation | drop | — | opsx skill surface superseded by spcb |
| 2 | Completeness Verification | drop | — | ditto |
| 3 | Correctness Verification | drop | — | ditto |
| 4 | Coherence Verification | drop | — | ditto |
| 5 | Verification Report Format | drop | — | ditto |
| 6 | Flexible Artifact Handling | drop | — | ditto |

## `rules-injection` (6)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Inject rules only for matching artifact | keep | `behavior/workflow/instructions` | |
| 2 | Format rules with XML-style tags and bullet list | keep | `behavior/workflow/instructions` | |
| 3 | Preserve rule text exactly as provided | keep | `behavior/workflow/instructions` | |
| 4 | Support multiple artifacts with different rules | keep | `behavior/workflow/instructions` | |
| 5 | Rules are additive to schema guidance | keep | `behavior/workflow/instructions` | |
| 6 | Validate artifact IDs during instruction loading | keep | `behavior/workflow/instructions` | |

## `schema-fork-command` (4)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Schema fork copies existing schema | keep | `behavior/schemas/manage` | |
| 2 | Schema fork prevents accidental overwrites | keep | `behavior/schemas/manage` | |
| 3 | Schema fork preserves all schema files | keep | `behavior/schemas/manage` | |
| 4 | Schema fork outputs JSON format | keep | `behavior/cli` | hoisted universal `--json` (one of four identical per-command claims) |

## `schema-init-command` (4)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Schema init command creates project-local schema | keep | `behavior/schemas/manage` | |
| 2 | Schema init supports interactive mode | keep | `behavior/cli` | hoisted interactivity |
| 3 | Schema init supports setting project default | keep | `behavior/schemas/manage` | |
| 4 | Schema init outputs JSON format | keep | `behavior/cli` | hoisted universal `--json` |

## `schema-resolution` (10)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Project-local schema resolution | keep | `behavior/schemas` | parent pair: resolution precedence |
| 2 | Project schemas directory helper | demote | — | function-level helper (`getProjectSchemasDir`); no external contract |
| 3 | List schemas includes project-local | keep | `behavior/schemas/manage` | |
| 4 | Schema info includes project source | keep | `behavior/schemas/manage` | |
| 5 | Schemas command shows source | keep | `behavior/schemas/manage` | |
| 6 | Use config schema as default for new changes | keep | `behavior/schemas` | precedence claim |
| 7 | Resolve schema with updated precedence order | keep | `behavior/schemas` | the parent pair's headline invariant |
| 8 | Support project-local schema names in config | keep | `behavior/schemas/structure` | |
| 9 | Provide helpful error message for invalid schema | keep | `behavior/cli` | hoisted actionable errors |
| 10 | Maintain backwards compatibility for existing changes | keep | `behavior/schemas` | |

## `schema-validate-command` (6)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Schema validate checks schema structure | keep | `behavior/schemas/manage` | |
| 2 | Schema validate checks YAML syntax | keep | `behavior/schemas/manage` | |
| 3 | Schema validate checks template existence | keep | `behavior/schemas/manage` | |
| 4 | Schema validate checks dependency graph | keep | `behavior/schemas/manage` | rejects cycles/dangling refs; the structural invariant itself is `architecture/artifact-graph` |
| 5 | Schema validate outputs JSON format | keep | `behavior/cli` | hoisted universal `--json` |
| 6 | Schema validate supports verbose mode | keep | `behavior/schemas/manage` | |

## `schema-which-command` (4)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Schema which shows resolution result | keep | `behavior/schemas/manage` | |
| 2 | Schema which shows shadowing information | keep | `behavior/schemas/manage` | |
| 3 | Schema which outputs JSON format | keep | `behavior/cli` | hoisted universal `--json` |
| 4 | Schema which supports list mode | keep | `behavior/schemas/manage` | |

## `specs-sync-skill` (3) — **all dropped** (D8: the opsx *sync* skill)

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Specs Sync Skill | drop | — | opsx skill surface superseded by spcb |
| 2 | Delta Reconciliation Logic | drop | — | ditto; the reconciliation contract survives as `behavior/cli/archive` spec-update semantics |
| 3 | Skill Output | drop | — | ditto |

## `telemetry` (9) — **worked example, authored in this change**

| # | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|
| 1 | Command execution tracking | keep | `behavior/telemetry` | → `command-executed-tracking` |
| 2 | Privacy-preserving event design | keep | `behavior/telemetry` | → `privacy-preserving-events` |
| 3 | Environment variable opt-out | keep | `behavior/telemetry` | → `env-opt-out` |
| 4 | CI environment auto-disable | keep | `behavior/telemetry` | → `ci-auto-disable` |
| 5 | First-run telemetry notice | keep | `behavior/telemetry` | → `first-run-notice` |
| 6 | Anonymous user identification | keep | `behavior/telemetry` | → `anonymous-identity` |
| 7 | Immediate event sending | keep | `behavior/telemetry` | → `immediate-send` |
| 8 | Graceful shutdown | keep | `behavior/telemetry` | → `graceful-shutdown` |
| 9 | Silent failure handling | keep | `behavior/telemetry` | → `silent-failure`; the PostHog vendor fact moves to `ops/stack` (no-foreign-facts) |

---

# Part B — unarchived change deltas (`openspec-old/changes/*/specs/**/spec.md`), 205 entries

`archive/` is excluded (D1). `[A]` = ADDED, `[M]` = MODIFIED in the delta.

## `add-agents-plane` (12)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | agents-plane | [A] Agents plane membership | keep | `behavior/governed` | plane-catalog semantics (the product's agents plane) |
| 2 | agents-plane | [A] Conformance-binding pattern | keep | `behavior/governed/enforcement` | |
| 3 | agents-plane | [A] Describe direction of truth | keep | `behavior/governed/enforcement` | spec describes the operational artifact |
| 4 | agents-plane | [A] Init-planted baseline specs | keep | `behavior/cli/init` | |
| 5 | agents-plane | [A] Spec-driven self-hosting spec | keep | `behavior/cli/init` | realized in this repo by `agents/spec-driven` |
| 6 | agents-plane | [A] Review-panel worked example | keep | `behavior/cli/init` | realized in this repo by `agents/review-panel` |
| 7 | cli-init | [A] Agentic tooling prompt at init | keep | `behavior/cli/init` | |
| 8 | cli-init | [A] Agentic review opt-in | keep | `behavior/cli/init` | |
| 9 | cli-init | [A] Baseline specs planted as scaffolding | keep | `behavior/cli/init` | |
| 10 | openspec-conventions | [A] Agents plane conventions | keep | `behavior/governed` | |
| 11 | openspec-conventions | [A] Spec-versus-operational-artifact rule | keep | `behavior/governed/enforcement` | |
| 12 | openspec-conventions | [A] Describe-not-generate and init-scaffold exception | keep | `behavior/governed/enforcement` | |

## `add-change-stacking-awareness` (7) — **all dropped** (D8: never shipped)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | change-creation | [A] Stack Metadata Scaffolding | drop | — | no stacking code in `src/` (verified) |
| 2 | change-stacking-workflow | [A] Stack Metadata Model | drop | — | ditto |
| 3 | change-stacking-workflow | [A] Change Dependency Graph | drop | — | ditto |
| 4 | change-stacking-workflow | [A] Capability marker and overlap semantics | drop | — | ditto |
| 5 | cli-change | [A] Stack Planning Commands | drop | — | ditto |
| 6 | cli-change | [A] Split Large Change Scaffolding | drop | — | ditto |
| 7 | openspec-conventions | [A] Stack-Aware Change Planning Conventions | drop | — | ditto |

## `add-design-system-plane` (12)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-init | [A] Init presents planes as a single multi-select picker | keep | `behavior/cli/init` | |
| 2 | cli-init | [A] Init writes the selected planes and derived kind | keep | `behavior/cli/init` | |
| 3 | config-loading | [A] Derive specModel.kind from the resolved plane set | keep | `behavior/config/project` | |
| 4 | design-system-plane | [A] Design-system plane governs the product's expressed identity | keep | `behavior/governed` | plane-catalog record |
| 5 | design-system-plane | [A] Design-system separates token truth from voice truth in two strata | keep | `behavior/governed` | |
| 6 | design-system-plane | [A] Design review lens judges the design-system plane | keep | `behavior/governed/review-panel` | |
| 7 | design-system-plane | [A] Design-system ships a per-plane authoring template | keep | `behavior/workflow/templates` | |
| 8 | openspec-conventions | [A] Design-system plane authoring conventions | keep | `behavior/governed` | |
| 9 | openspec-conventions | [A] Governance is emergent from plane selection | keep | `behavior/governed` | |
| 10 | plane-selection-governance | [A] Governance emerges from plane selection | keep | `behavior/governed` | merges with row 9 (same claim, two files) |
| 11 | plane-selection-governance | [A] Planes are offered as a single selectable list with per-plane defaults | keep | `behavior/cli/init` | merges with row 1 |
| 12 | schema-resolution | [A] Resolve a single offer-able plane list with defaultSelected | keep | `behavior/governed` | planes-as-schema-data |

## `add-global-install-scope` (16)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | ai-tool-paths | [M] AIToolOption skillsDir field | keep | `ops/tool-paths` | supersedes flat `ai-tool-paths` #1 — merged, not double-counted |
| 2 | ai-tool-paths | [M] Path configuration for supported tools | keep | `ops/tool-paths` | supersedes flat `ai-tool-paths` #2 |
| 3 | cli-config | [A] Install scope configuration via profile flow | keep | `behavior/config/install-scope` | |
| 4 | cli-config | [A] Install scope visibility in config output | keep | `behavior/config/install-scope` | |
| 5 | cli-init | [A] Init install scope selection | keep | `behavior/cli/init` | |
| 6 | cli-init | [A] Init uses effective scope resolution | keep | `behavior/cli/init` | |
| 7 | cli-update | [A] Update install scope selection | keep | `behavior/cli/update` | |
| 8 | cli-update | [A] Scope-aware sync and drift detection | keep | `behavior/cli/update` | |
| 9 | command-generation | [M] ToolCommandAdapter interface | promote | `architecture/command-generation` | supersedes flat `command-generation` #2 |
| 10 | command-generation | [M] Command generator function | promote | `architecture/command-generation` | supersedes flat `command-generation` #3 |
| 11 | global-config | [A] Install scope field in global config | keep | `behavior/config/global` | |
| 12 | installation-scope | [A] Install scope preference model | keep | `behavior/config/install-scope` | |
| 13 | installation-scope | [A] Effective scope resolution by tool surface | keep | `behavior/config/install-scope` | |
| 14 | installation-scope | [A] Effective scope reporting | keep | `behavior/config/install-scope` | |

*(continued — `installation-scope` contributes 5 requirements)*

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 15 | installation-scope | [A] Cross-platform path behavior | keep | `ops/tool-paths` | path handling is an ops fact |
| 16 | installation-scope | [A] Cleanup safety for scope transitions | keep | `behavior/config/install-scope` | |

## `add-qa-smoke-harness` (2) — **all dropped** (D8: never shipped)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | developer-qa-workflow | [A] Makefile QA Entry Point | drop | — | no `Makefile` exists in the repo (verified) |
| 2 | developer-qa-workflow | [A] Sandboxed Smoke Scenario Runner | drop | — | never shipped |

## `add-review-panel-enforcement` (8)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-coverage | [A] Coverage reports lens allocation and review-panel gaps | keep | `behavior/governed/coverage` | |
| 2 | opsx-verify-skill | [A] Verify executes the review panel for review bindings | drop | — | opsx skill surface superseded by spcb (D8); the durable claim survives as `behavior/governed/review-panel` |
| 3 | spec-enforcement | [A] Review bindings name a lens and their deterministic residue | keep | `behavior/governed/enforcement` | |
| 4 | spec-review-panel | [A] Review is a growing per-codebase panel of blind lenses | keep | `behavior/governed/review-panel` | product feature, distinct from this repo's `agents/review-panel` instrument |
| 5 | spec-review-panel | [A] Lens scope is a spec-tree subtree resolved most-specific-first | keep | `behavior/governed/review-panel` | |
| 6 | spec-review-panel | [A] The panel reviews the residue above the deterministic gate | keep | `behavior/governed/review-panel` | |
| 7 | spec-review-panel | [A] Panel findings are refute-verified, critiqued, and non-gating | keep | `behavior/governed/review-panel` | |
| 8 | spec-review-panel | [A] Lenses source policy from the specs at review time and grow by proposal | keep | `behavior/governed/review-panel` | |

## `add-skill-cli-auto-approval` (2)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-init | [M] Skill Generation | keep | `behavior/cli/init` | supersedes flat `cli-init` #12 |
| 2 | command-generation | [M] ToolCommandAdapter interface | promote | `architecture/command-generation` | supersedes flat `command-generation` #2; merges with `add-global-install-scope` row 9 |

## `add-spec-coverage-tool` (10)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-coverage | [A] Repository coverage summary | keep | `behavior/governed/coverage` | |
| 2 | cli-coverage | [A] Spec drill-down | keep | `behavior/governed/coverage` | |
| 3 | cli-coverage | [A] Orphaned enforcement detection | keep | `behavior/governed/coverage` | |
| 4 | cli-coverage | [A] Agent-consumable JSON | keep | `behavior/governed/coverage` | the universal `--json` invariant itself lives on `behavior/cli` |
| 5 | cli-coverage | [A] Strict gating | keep | `behavior/governed/coverage` | |
| 6 | opsx-explore-skill | [A] Staged governed exploration | drop | — | opsx skill surface superseded by spcb (D8) |
| 7 | opsx-explore-skill | [A] Enforcement approach without premature certainty | drop | — | ditto |
| 8 | opsx-explore-skill | [A] Dual-plane classification | drop | — | ditto; the classification rule survives as `behavior/governed` plane semantics |
| 9 | opsx-explore-skill | [A] Coverage-informed health awareness | drop | — | ditto |
| 10 | opsx-explore-skill | [A] Coverage feeds governed workflows | drop | — | ditto |

## `add-tool-command-surface-capabilities` (6)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-init | [A] Command surface capability resolution | keep | `behavior/cli/init` | |
| 2 | cli-init | [A] Delivery compatibility by tool command surface | keep | `behavior/cli/init` | |
| 3 | cli-init | [A] Init compatibility signaling | keep | `behavior/cli/init` | |
| 4 | cli-update | [A] Delivery sync by command surface capability | keep | `behavior/cli/update` | |
| 5 | cli-update | [A] Configured-tool detection for skills-invocable command surfaces | keep | `behavior/cli/update` | |
| 6 | cli-update | [A] Update summary reflects effective per-tool delivery | keep | `behavior/cli/update` | |

## `add-update-workflow` (5) — **all dropped** (D8)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | opsx-update-skill | [A] Update Workflow Command | drop | — | opsx skill surface superseded by spcb |
| 2 | opsx-update-skill | [A] Schema-Driven Artifact Resolution | drop | — | ditto |
| 3 | opsx-update-skill | [A] Bidirectional Coherence Review | drop | — | ditto; the pair-coherence claim survives as `behavior/governed/workflow` |
| 4 | opsx-update-skill | [A] Next-Step Guidance | drop | — | ditto |
| 5 | opsx-update-skill | [A] User-Confirmed Incremental Application | drop | — | ditto |

## `feat-add-omp-tool-support` (5) — **kept** (shipped; see Verified verdicts)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-init | [A] Oh My Pi tool supported in init | keep | `behavior/cli/init` | |
| 2 | cli-update | [A] Oh My Pi tool supported in update | keep | `behavior/cli/update` | |
| 3 | oh-my-pi-tool | [A] Oh My Pi command file generation | keep | `behavior/cli/init` | tool-files claim; adapter boundary is `architecture/command-generation` |
| 4 | oh-my-pi-tool | [A] Oh My Pi skill file generation | keep | `behavior/cli/init` | |
| 5 | oh-my-pi-tool | [A] Oh My Pi tool detection | keep | `ops/tool-paths` | `.omp/` detection path is a tool-registry fact; the picker behavior is `behavior/cli/init` |

## `fix-opencode-commands-directory` (2)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | command-generation | [M] ToolCommandAdapter interface | promote | `architecture/command-generation` | supersedes flat `command-generation` #2 |
| 2 | command-generation | [A] Legacy cleanup for renamed OpenCode command directory | keep | `behavior/cli/legacy-cleanup` | user-visible cleanup, not an architectural edge |

## `fix-spec-parser-fidelity` (4)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-validate | [A] Requirement bodies SHALL be parsed in full for normative keywords | keep | `behavior/store/format` | parser fidelity is a format contract |
| 2 | cli-validate | [A] Fenced code blocks SHALL NOT corrupt extraction or scenario counting | keep | `behavior/store/format` | |
| 3 | cli-validate | [A] A single normative-keyword predicate SHALL be used across readers | demote | — | internal single-source-of-truth mechanism; the guardable outcome is rows 1–2 (readers agree because the behavior is specified, not because they share a function) |
| 4 | cli-validate | [A] Non-canonical headers in delta sections SHALL be surfaced without changing recognition | keep | `behavior/cli/validate` | |

## `fix-validate-view-resolution-parity` (4)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-archive | [A] Archive incomplete-task gate SHALL use the tracked-tasks artifact glob | keep | `behavior/cli/archive` | |
| 2 | cli-validate | [A] Validate SHALL resolve changes by directory existence, matching status | keep | `behavior/cli/validate` | |
| 3 | cli-validate | [A] SHALL/MUST body-keyword hint SHALL apply to main specs | keep | `behavior/cli/validate` | |
| 4 | cli-view | [A] Task progress SHALL be resolved through the tracked-tasks artifact glob | keep | `behavior/cli/view` | |

## `generalize-spec-planes` (18)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-artifact-workflow | [M] Status JSON output | keep | `behavior/workflow/status` | merges into flat `cli-artifact-workflow` #13/#14 |
| 2 | cli-config | [M] Command Structure | keep | `behavior/cli/config` | supersedes flat `cli-config` #1 |
| 3 | cli-init | [M] Directory Creation | keep | `behavior/cli/init` | supersedes flat `cli-init` #2 |
| 4 | cli-list | [M] Command Execution | keep | `behavior/cli/list` | supersedes flat `cli-list` #1 |
| 5 | cli-show | [M] Top-level show command | keep | `behavior/cli/show` | supersedes flat `cli-show` #1 |
| 6 | cli-spec | [M] Spec Command | keep | `behavior/cli` | supersedes flat `cli-spec` #2 (noun-form back-compat) |
| 7 | cli-update | [M] Tool-Agnostic Updates | keep | `behavior/cli/update` | supersedes flat `cli-update` #4 |
| 8 | cli-validate | [M] Validation SHALL provide actionable remediation steps | keep | `behavior/cli/validate` | supersedes flat `cli-validate` #1 |
| 9 | config-loading | [A] Load declared spec model planes | keep | `behavior/config/project` | |
| 10 | openspec-conventions | [M] Project Structure | keep | `behavior/store/layout` | supersedes flat `openspec-conventions` #4 |
| 11 | schema-resolution | [M] Project-local schema resolution | keep | `behavior/schemas` | supersedes flat `schema-resolution` #1 |
| 12 | spec-enforcement | [M] Enforcement coverage keyed by declared planes | keep | `behavior/governed/coverage` | |
| 13 | spec-planes | [A] Planes declared as schema data | keep | `behavior/governed` | parent-pair headline invariant |
| 14 | spec-planes | [A] Per-plane metadata record | keep | `behavior/governed` | |
| 15 | spec-planes | [A] Arbitrary plane locators | keep | `behavior/governed` | |
| 16 | spec-planes | [A] Stable scoped identities with open plane prefixes | keep | `behavior/governed` | supersedes `introduce-enforced-spec-planes`' "Stable scoped identities" |
| 17 | spec-planes | [A] Governed awareness generated from resolved planes | keep | `behavior/governed/workflow` | |
| 18 | spec-planes | [A] Plane declaration validation | keep | `behavior/governed` | |

## `graceful-status-no-changes` (2)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | graceful-status-empty | [A] Status command exits gracefully when no changes exist | keep | `behavior/workflow/status` | |
| 2 | graceful-status-empty | [A] Existing status validation behavior is preserved | keep | `behavior/workflow/status` | |

## `introduce-enforced-spec-planes` (53)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-archive | [M] Archive Process | keep | `behavior/cli/archive` | supersedes flat `cli-archive` #3 |
| 2 | cli-archive | [M] Spec Update Process | keep | `behavior/cli/archive` | supersedes flat `cli-archive` #4 |
| 3 | cli-artifact-workflow | [A] Governed spec context in artifact instructions | keep | `behavior/workflow/instructions` | |
| 4 | cli-list | [M] Command Execution | keep | `behavior/cli/list` | supersedes flat `cli-list` #1; superseded in turn by `generalize-spec-planes` row 4 |
| 5 | cli-list | [M] Output Format | keep | `behavior/cli/list` | supersedes flat `cli-list` #3 |
| 6 | cli-show | [A] Governed spec resolution and display | keep | `behavior/cli/show` | |
| 7 | cli-spec | [M] Spec Command | keep | `behavior/cli` | supersedes flat `cli-spec` #2 |
| 8 | cli-spec | [M] JSON Schema Definition | keep | `behavior/store/format` | supersedes flat `cli-spec` #3 |
| 9 | cli-validate | [A] Governed spec validation | keep | `behavior/cli/validate` | |
| 10 | cli-validate | [A] Governed change validation | keep | `behavior/cli/validate` | |
| 11 | enforced-spec-workflow | [A] Schema-driven governed workflow awareness | keep | `behavior/governed/workflow` | |
| 12 | enforced-spec-workflow | [A] Explore classifies durable insights | keep | `behavior/governed/workflow` | |
| 13 | enforced-spec-workflow | [A] Proposal and artifact creation classify governed changes | keep | `behavior/governed/workflow` | |
| 14 | enforced-spec-workflow | [A] Change updates preserve pair coherence | keep | `behavior/governed/workflow` | |
| 15 | enforced-spec-workflow | [A] Apply resolves enforcement bindings | keep | `behavior/governed/workflow` | |
| 16 | enforced-spec-workflow | [A] Verify uses declared enforcement first | keep | `behavior/governed/workflow` | |
| 17 | enforced-spec-workflow | [A] Sync preserves governed pairs | keep | `behavior/governed/workflow` | |
| 18 | enforced-spec-workflow | [A] Archive requires governed readiness | keep | `behavior/governed/workflow` | |
| 19 | enforced-spec-workflow | [A] Onboarding teaches governed truth | keep | `behavior/governed/workflow` | the *generated workflow* claim survives even though the opsx onboard skill spec is dropped |
| 20 | enforced-spec-workflow | [A] Generated workflow parity | keep | `behavior/governed/workflow` | |
| 21 | openspec-conventions | [M] Behavior-First Specification Boundary | keep | `code-quality/spec-authoring` | supersedes flat `openspec-conventions` #2 |
| 22 | openspec-conventions | [M] Project Structure | keep | `behavior/store/layout` | supersedes flat `openspec-conventions` #4; superseded in turn by `generalize-spec-planes` row 10 |
| 23 | openspec-conventions | [M] Header-Based Requirement Identification | keep | `behavior/store/format` | supersedes flat `openspec-conventions` #6 |
| 24 | openspec-conventions | [M] Change Storage Convention | keep | `behavior/store/format` | supersedes flat `openspec-conventions` #7 |
| 25 | openspec-conventions | [M] Archive Process Enhancement | keep | `behavior/cli/archive` | supersedes flat `openspec-conventions` #8 |
| 26 | opsx-archive-skill | [M] Artifact Completion Check | drop | — | revises a dropped spec (D8) |
| 27 | opsx-archive-skill | [M] Spec Sync Prompt | drop | — | ditto |
| 28 | opsx-archive-skill | [M] Archive Process | drop | — | ditto |
| 29 | opsx-onboard-skill | [M] Guided Artifact Creation | drop | — | ditto |
| 30 | opsx-onboard-skill | [M] Guided Implementation | drop | — | ditto |
| 31 | opsx-onboard-skill | [M] Archive with Explanation | drop | — | ditto |
| 32 | opsx-verify-skill | [M] Completeness Verification | drop | — | ditto |
| 33 | opsx-verify-skill | [M] Correctness Verification | drop | — | ditto |
| 34 | spec-enforcement | [A] Paired enforcement contract | keep | `behavior/governed/enforcement` | |
| 35 | spec-enforcement | [A] Structured enforcement bindings | keep | `behavior/governed/enforcement` | |
| 36 | spec-enforcement | [A] Honest evidence-strength classification | keep | `behavior/governed/enforcement` | |
| 37 | spec-enforcement | [A] Normative coverage | keep | `behavior/governed/coverage` | |
| 38 | spec-enforcement | [A] Bidirectional enforcement drift detection | keep | `behavior/governed/enforcement` | |
| 39 | spec-enforcement | [A] Retired enforcement cleanup candidates | keep | `behavior/governed/enforcement` | |
| 40 | spec-enforcement | [A] Resolvable enforcement targets | keep | `behavior/governed/enforcement` | |
| 41 | spec-enforcement | [A] Workflow-executed automated enforcement | keep | `behavior/governed/enforcement` | |
| 42 | spec-enforcement | [A] Semantic correspondence review | keep | `behavior/governed/enforcement` | |
| 43 | spec-enforcement | [A] Pair-coherent synchronization | keep | `behavior/governed/enforcement` | |
| 44 | spec-enforcement | [A] Governed workflow archive gate | keep | `behavior/governed/workflow` | |
| 45 | spec-planes | [A] Opt-in governed spec model | keep | `behavior/governed` | parent-pair headline invariant |
| 46 | spec-planes | [A] Behavioral and architectural planes | keep | `behavior/governed` | superseded in substance by `generalize-spec-planes` rows 13–18 (planes are data) |
| 47 | spec-planes | [A] Stable scoped identities | keep | `behavior/governed` | superseded by `generalize-spec-planes` row 16 |
| 48 | spec-planes | [A] Plane-qualified nested locators | keep | `behavior/governed` | |
| 49 | spec-planes | [A] Namespace directories without implicit inheritance | keep | `behavior/governed` | |
| 50 | spec-planes | [A] Governed pair resolution | keep | `behavior/governed` | |
| 51 | spec-planes | [A] Current architecture and historical rationale | keep | `code-quality/spec-authoring` | "specs state current truth; history lives in the archive" is a craft rule |
| 52 | specs-sync-skill | [M] Specs Sync Skill | drop | — | revises a dropped spec (D8) |
| 53 | specs-sync-skill | [M] Delta Reconciliation Logic | drop | — | ditto |

## `seed-planes-into-config` (6)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-init | [A] Init always writes selected planes into config | keep | `behavior/cli/init` | |
| 2 | cli-update | [A] Update offers to sync new catalog planes | keep | `behavior/cli/update` | |
| 3 | config-loading | [A] A declared plane list is authoritative | keep | `behavior/config/project` | |
| 4 | plane-config-seeding | [A] Init seeds selected planes as authoritative config records | keep | `behavior/cli/init` | merges with row 1 |
| 5 | plane-config-seeding | [A] Config is the authoritative plane set | keep | `behavior/config/project` | merges with row 3 |
| 6 | plane-config-seeding | [A] Seeded records omit picker-only fields | keep | `behavior/cli/init` | |

## `simplify-skill-installation` (26)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | cli-init | [M] Skill generation per tool (REPLACES fixed 9-skill mandate) | keep | `behavior/cli/init` | supersedes flat `cli-init` #12 |
| 2 | cli-init | [M] Command generation per tool (REPLACES fixed 9-command mandate) | keep | `behavior/cli/init` | supersedes flat `cli-init` #13 |
| 3 | cli-init | [M] Tool auto-detection | keep | `behavior/cli/init` | |
| 4 | cli-init | [M] Smart defaults init flow | keep | `behavior/cli/init` | |
| 5 | cli-init | [M] Init performs migration on existing projects | keep | `behavior/cli/init` | |
| 6 | cli-init | [M] Init respects global config | keep | `behavior/cli/init` | |
| 7 | cli-init | [M] Init applies configured profile without confirmation | keep | `behavior/cli/init` | |
| 8 | cli-init | [M] Init preserves existing workflows | keep | `behavior/cli/init` | |
| 9 | cli-init | [M] Init tool confirmation UX | keep | `behavior/cli/init` | |
| 10 | cli-update | [M] Update respects global profile config | keep | `behavior/cli/update` | |
| 11 | cli-update | [M] Update respects delivery setting | keep | `behavior/cli/update` | |
| 12 | cli-update | [M] Update detects configured tools from skills or commands | keep | `behavior/cli/update` | |
| 13 | cli-update | [M] One-time migration for existing users | keep | `behavior/cli/update` | |
| 14 | cli-update | [M] Update detects new tool directories | keep | `behavior/cli/update` | |
| 15 | cli-update | [M] Update requires an OpenSpec project | keep | `behavior/cli/update` | supersedes flat `cli-update` #2 (Prerequisites) |
| 16 | cli-update | [M] Extra workflows synchronized to active profile | keep | `behavior/cli/update` | |
| 17 | profiles | [A] Profile definitions | keep | `behavior/config/profiles` | |
| 18 | profiles | [A] Delivery is independent of profile | keep | `behavior/config/profiles` | |
| 19 | profiles | [A] Profile configuration via interactive picker | keep | `behavior/config/profiles` | |
| 20 | profiles | [A] Profile settings stored in global config | keep | `behavior/config/profiles` | |
| 21 | profiles | [A] Config is global, projects are explicit | keep | `behavior/config/profiles` | |
| 22 | profiles | [A] Config changes applied via update command | keep | `behavior/config/profiles` | |
| 23 | profiles | [A] Profile defaults | keep | `behavior/config/profiles` | |
| 24 | propose-workflow | [A] Propose workflow creation | keep | `behavior/workflow/new-change` | |
| 25 | propose-workflow | [A] Propose workflow onboarding UX | keep | `behavior/workflow/new-change` | |
| 26 | propose-workflow | [A] Propose workflow combines new and ff | keep | `behavior/workflow/new-change` | |

## `unify-template-generation-pipeline` (5)

| # | Source spec | Requirement | Verdict | Destination | Notes |
|---|---|---|---|---|---|
| 1 | template-artifact-pipeline | [A] Canonical Workflow Manifest | promote | `architecture/command-generation` | absorbed per D3 |
| 2 | template-artifact-pipeline | [A] Tool Profile Registry | promote | `architecture/command-generation` | |
| 3 | template-artifact-pipeline | [A] Ordered Transform Pipeline | promote | `architecture/command-generation` | |
| 4 | template-artifact-pipeline | [A] Shared Artifact Sync Engine | promote | `architecture/command-generation` | |
| 5 | template-artifact-pipeline | [A] Fidelity Guardrails | promote | `architecture/command-generation` | |

---

## Coverage attestation

Row counts per source file in this manifest were reconciled against a
mechanical extraction of `^### Requirement:` headers from
`openspec-old/specs/*/spec.md` and `openspec-old/changes/*/specs/**/spec.md`
(excluding `changes/archive/`). Part A totals 246 rows across 36 files; Part B
totals 205 rows across 77 files. **451 of 451 source requirements are
accounted for; none is omitted.**

Each follow-on tranche (`migrate-specbase-behavior`, `-architecture`, `-ops`,
`-agents`, `-quality-design`) must check its diff against the rows destined for
its plane before archiving — that check is the mechanical answer to "did
anything leak" (design D7).
