# Supported Tools

Specbase works with many AI coding assistants. When you run `specbase init`, Specbase configures selected tools using your active profile/workflow selection and delivery mode.

## How It Works

For each selected tool, Specbase can install:

1. **Skills** (if delivery includes skills): `.../skills/specbase-*/SKILL.md`
2. **Commands** (if delivery includes commands): tool-specific `spcb-*` command files

By default, Specbase uses the `core` profile, which includes:
- `propose`
- `explore`
- `apply`
- `sync`
- `archive`

You can enable expanded workflows (`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`) via `specbase config profile`, then run `specbase update`.

## Tool Directory Reference

| Tool (ID) | Skills path pattern | Command path pattern |
|-----------|---------------------|----------------------|
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/specbase-*/SKILL.md` | `.amazonq/prompts/spcb-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/specbase-*/SKILL.md` | `.agent/workflows/spcb-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/specbase-*/SKILL.md` | `.augment/commands/spcb-<id>.md` |
| IBM Bob Shell (`bob`) | `.bob/skills/specbase-*/SKILL.md` | `.bob/commands/spcb-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/specbase-*/SKILL.md` | `.claude/commands/spcb/<id>.md` |
| Cline (`cline`) | `.cline/skills/specbase-*/SKILL.md` | `.clinerules/workflows/spcb-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/specbase-*/SKILL.md` | `.codebuddy/commands/spcb/<id>.md` |
| Codex (`codex`) | `.codex/skills/specbase-*/SKILL.md` | `$CODEX_HOME/prompts/spcb-<id>.md`\* |
| ForgeCode (`forgecode`) | `.forge/skills/specbase-*/SKILL.md` | Not generated (no command adapter; use skill-based `/specbase-*` invocations) |
| Continue (`continue`) | `.continue/skills/specbase-*/SKILL.md` | `.continue/prompts/spcb-<id>.prompt` |
| CoStrict (`costrict`) | `.cospec/skills/specbase-*/SKILL.md` | `.cospec/specbase/commands/spcb-<id>.md` |
| Crush (`crush`) | `.crush/skills/specbase-*/SKILL.md` | `.crush/commands/spcb/<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/specbase-*/SKILL.md` | `.cursor/commands/spcb-<id>.md` |
| Factory Droid (`factory`) | `.factory/skills/specbase-*/SKILL.md` | `.factory/commands/spcb-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/specbase-*/SKILL.md` | `.gemini/commands/spcb/<id>.toml` |
| GitHub Copilot (`github-copilot`) | `.github/skills/specbase-*/SKILL.md` | `.github/prompts/spcb-<id>.prompt.md`\*\* |
| iFlow (`iflow`) | `.iflow/skills/specbase-*/SKILL.md` | `.iflow/commands/spcb-<id>.md` |
| Junie (`junie`) | `.junie/skills/specbase-*/SKILL.md` | `.junie/commands/spcb-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/specbase-*/SKILL.md` | `.kilocode/workflows/spcb-<id>.md` |
| Kimi CLI (`kimi`) | `.kimi/skills/specbase-*/SKILL.md` | Not generated (no command adapter; use skill-based `/skill:specbase-*` invocations) |
| Kiro (`kiro`) | `.kiro/skills/specbase-*/SKILL.md` | `.kiro/prompts/spcb-<id>.prompt.md` |
| Lingma (`lingma`) | `.lingma/skills/specbase-*/SKILL.md` | `.lingma/commands/spcb/<id>.md` |
| Mistral Vibe (`vibe`) | `.vibe/skills/specbase-*/SKILL.md` | Not generated (no command adapter; use skill-based `/specbase-*` invocations) |
| Oh My Pi (`oh-my-pi`) | `.omp/skills/specbase-*/SKILL.md` | `.omp/commands/spcb-<id>.md` |
| OpenCode (`opencode`) | `.opencode/skills/specbase-*/SKILL.md` | `.opencode/commands/spcb-<id>.md` |
| Pi (`pi`) | `.pi/skills/specbase-*/SKILL.md` | `.pi/prompts/spcb-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/specbase-*/SKILL.md` | `.qoder/commands/spcb/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/specbase-*/SKILL.md` | `.qwen/commands/spcb-<id>.toml` |
| RooCode (`roocode`) | `.roo/skills/specbase-*/SKILL.md` | `.roo/commands/spcb-<id>.md` |
| Trae (`trae`) | `.trae/skills/specbase-*/SKILL.md` | `.trae/commands/spcb-<id>.md` |
| Windsurf (`windsurf`) | `.windsurf/skills/specbase-*/SKILL.md` | `.windsurf/workflows/spcb-<id>.md` |

\* Codex commands are installed in the global Codex home (`$CODEX_HOME/prompts/` if set, otherwise `~/.codex/prompts/`), not your project directory.

\*\* GitHub Copilot prompt files are recognized as custom slash commands in IDE extensions (VS Code, JetBrains, Visual Studio). Copilot CLI does not currently consume `.github/prompts/*.prompt.md` directly.

## Non-Interactive Setup

For CI/CD or scripted setup, use `--tools` (and optionally `--profile`):

```bash
# Configure specific tools
specbase init --tools claude,cursor

# Configure all supported tools
specbase init --tools all

# Skip tool configuration
specbase init --tools none

# Override profile for this init run
specbase init --profile core
```

**Available tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `vibe`, `oh-my-pi`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `windsurf`

## Workflow-Dependent Installation

Specbase installs workflow artifacts based on selected workflows:

- **Core profile (default):** `propose`, `explore`, `apply`, `sync`, `archive`
- **Custom selection:** any subset of all workflow IDs:
  `propose`, `explore`, `new`, `continue`, `apply`, `ff`, `sync`, `archive`, `bulk-archive`, `verify`, `onboard`

In other words, skill/command counts are profile-dependent and delivery-dependent, not fixed.

## Generated Skill Names

When selected by profile/workflow config, Specbase generates these skills:

- `specbase-propose`
- `specbase-explore`
- `specbase-new-change`
- `specbase-continue-change`
- `specbase-apply-change`
- `specbase-update-change`
- `specbase-ff-change`
- `specbase-sync-specs`
- `specbase-archive-change`
- `specbase-bulk-archive-change`
- `specbase-verify-change`
- `specbase-onboard`

See [Commands](commands.md) for command behavior and [CLI](cli.md) for `init`/`update` options.

## Related

- [CLI Reference](cli.md) — Terminal commands
- [Commands](commands.md) — Slash commands and skills
- [Getting Started](getting-started.md) — First-time setup
