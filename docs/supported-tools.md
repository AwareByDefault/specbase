# Supported Tools

OpenSpec works with many AI coding assistants. When you run `openspec init`, OpenSpec configures selected tools using your active profile/workflow selection and delivery mode.

## How It Works

For each selected tool, OpenSpec can install:

1. **Skills** (if delivery includes skills): `.../skills/openspec-*/SKILL.md`
2. **Commands** (if delivery includes commands): tool-specific `spcb-*` command files

By default, OpenSpec uses the `core` profile, which includes:
- `propose`
- `explore`
- `apply`
- `sync`
- `archive`

You can enable expanded workflows (`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`) via `openspec config profile`, then run `openspec update`.

## Tool Directory Reference

| Tool (ID) | Skills path pattern | Command path pattern |
|-----------|---------------------|----------------------|
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/openspec-*/SKILL.md` | `.amazonq/prompts/spcb-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/openspec-*/SKILL.md` | `.agent/workflows/spcb-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/openspec-*/SKILL.md` | `.augment/commands/spcb-<id>.md` |
| IBM Bob Shell (`bob`) | `.bob/skills/openspec-*/SKILL.md` | `.bob/commands/spcb-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/openspec-*/SKILL.md` | `.claude/commands/spcb/<id>.md` |
| Cline (`cline`) | `.cline/skills/openspec-*/SKILL.md` | `.clinerules/workflows/spcb-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/openspec-*/SKILL.md` | `.codebuddy/commands/spcb/<id>.md` |
| Codex (`codex`) | `.codex/skills/openspec-*/SKILL.md` | `$CODEX_HOME/prompts/spcb-<id>.md`\* |
| ForgeCode (`forgecode`) | `.forge/skills/openspec-*/SKILL.md` | Not generated (no command adapter; use skill-based `/openspec-*` invocations) |
| Continue (`continue`) | `.continue/skills/openspec-*/SKILL.md` | `.continue/prompts/spcb-<id>.prompt` |
| CoStrict (`costrict`) | `.cospec/skills/openspec-*/SKILL.md` | `.cospec/openspec/commands/spcb-<id>.md` |
| Crush (`crush`) | `.crush/skills/openspec-*/SKILL.md` | `.crush/commands/spcb/<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/openspec-*/SKILL.md` | `.cursor/commands/spcb-<id>.md` |
| Factory Droid (`factory`) | `.factory/skills/openspec-*/SKILL.md` | `.factory/commands/spcb-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/openspec-*/SKILL.md` | `.gemini/commands/spcb/<id>.toml` |
| GitHub Copilot (`github-copilot`) | `.github/skills/openspec-*/SKILL.md` | `.github/prompts/spcb-<id>.prompt.md`\*\* |
| iFlow (`iflow`) | `.iflow/skills/openspec-*/SKILL.md` | `.iflow/commands/spcb-<id>.md` |
| Junie (`junie`) | `.junie/skills/openspec-*/SKILL.md` | `.junie/commands/spcb-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/openspec-*/SKILL.md` | `.kilocode/workflows/spcb-<id>.md` |
| Kimi CLI (`kimi`) | `.kimi/skills/openspec-*/SKILL.md` | Not generated (no command adapter; use skill-based `/skill:openspec-*` invocations) |
| Kiro (`kiro`) | `.kiro/skills/openspec-*/SKILL.md` | `.kiro/prompts/spcb-<id>.prompt.md` |
| Lingma (`lingma`) | `.lingma/skills/openspec-*/SKILL.md` | `.lingma/commands/spcb/<id>.md` |
| Mistral Vibe (`vibe`) | `.vibe/skills/openspec-*/SKILL.md` | Not generated (no command adapter; use skill-based `/openspec-*` invocations) |
| Oh My Pi (`oh-my-pi`) | `.omp/skills/openspec-*/SKILL.md` | `.omp/commands/spcb-<id>.md` |
| OpenCode (`opencode`) | `.opencode/skills/openspec-*/SKILL.md` | `.opencode/commands/spcb-<id>.md` |
| Pi (`pi`) | `.pi/skills/openspec-*/SKILL.md` | `.pi/prompts/spcb-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/openspec-*/SKILL.md` | `.qoder/commands/spcb/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/openspec-*/SKILL.md` | `.qwen/commands/spcb-<id>.toml` |
| RooCode (`roocode`) | `.roo/skills/openspec-*/SKILL.md` | `.roo/commands/spcb-<id>.md` |
| Trae (`trae`) | `.trae/skills/openspec-*/SKILL.md` | `.trae/commands/spcb-<id>.md` |
| Windsurf (`windsurf`) | `.windsurf/skills/openspec-*/SKILL.md` | `.windsurf/workflows/spcb-<id>.md` |

\* Codex commands are installed in the global Codex home (`$CODEX_HOME/prompts/` if set, otherwise `~/.codex/prompts/`), not your project directory.

\*\* GitHub Copilot prompt files are recognized as custom slash commands in IDE extensions (VS Code, JetBrains, Visual Studio). Copilot CLI does not currently consume `.github/prompts/*.prompt.md` directly.

## Non-Interactive Setup

For CI/CD or scripted setup, use `--tools` (and optionally `--profile`):

```bash
# Configure specific tools
openspec init --tools claude,cursor

# Configure all supported tools
openspec init --tools all

# Skip tool configuration
openspec init --tools none

# Override profile for this init run
openspec init --profile core
```

**Available tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `vibe`, `oh-my-pi`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `windsurf`

## Workflow-Dependent Installation

OpenSpec installs workflow artifacts based on selected workflows:

- **Core profile (default):** `propose`, `explore`, `apply`, `sync`, `archive`
- **Custom selection:** any subset of all workflow IDs:
  `propose`, `explore`, `new`, `continue`, `apply`, `ff`, `sync`, `archive`, `bulk-archive`, `verify`, `onboard`

In other words, skill/command counts are profile-dependent and delivery-dependent, not fixed.

## Generated Skill Names

When selected by profile/workflow config, OpenSpec generates these skills:

- `openspec-propose`
- `openspec-explore`
- `openspec-new-change`
- `openspec-continue-change`
- `openspec-apply-change`
- `openspec-update-change`
- `openspec-ff-change`
- `openspec-sync-specs`
- `openspec-archive-change`
- `openspec-bulk-archive-change`
- `openspec-verify-change`
- `openspec-onboard`

See [Commands](commands.md) for command behavior and [CLI](cli.md) for `init`/`update` options.

## Related

- [CLI Reference](cli.md) — Terminal commands
- [Commands](commands.md) — Slash commands and skills
- [Getting Started](getting-started.md) — First-time setup
