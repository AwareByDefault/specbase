# How Commands Work

**The one thing to know: Specbase has two kinds of commands, and they run in two different places.**

- `specbase ...` commands run in your **terminal**. (Example: `specbase init`.)
- `/spcb:...` commands run in your **AI assistant's chat**. (Example: `/spcb:propose`.)

If you ever type `/spcb:propose` into your terminal and nothing happens, this page is why. You are talking to the wrong half of Specbase. Slash commands are not terminal commands. They are instructions you give to your AI coding assistant, in the same chat box where you'd normally type "add a login form."

That single distinction is the most common stumbling block for new users, so let's make it crystal clear.

## The two halves

Specbase is one project wearing two hats.

**The CLI (terminal half).** A program named `specbase` that you install and run from your shell. It sets up your project, lists and validates changes, shows a dashboard, and archives finished work. You type these into iTerm, the VS Code terminal, PowerShell, anywhere you'd run `git` or `npm`.

```bash
specbase init        # set up Specbase in this project
specbase list        # see active changes
specbase view        # open the interactive dashboard
```

**The slash commands (chat half).** Short commands like `/spcb:propose` and `/spcb:apply` that you type into your AI assistant. These tell the AI to follow the Specbase workflow: draft a proposal, write specs, build from the task list, archive when done. You type these into Claude Code, Cursor, Windsurf, Copilot, or whichever assistant you use.

```text
/spcb:propose add-dark-mode    (typed in your AI chat)
/spcb:apply                    (typed in your AI chat)
/spcb:archive                  (typed in your AI chat)
```

Here's the mental model in one picture:

```text
        YOUR TERMINAL                         YOUR AI ASSISTANT'S CHAT
   ┌──────────────────────┐               ┌──────────────────────────────┐
   │  $ specbase init     │   installs    │  /spcb:propose add-dark-mode  │
   │  $ specbase list     │  ──────────►  │  /spcb:apply                  │
   │  $ specbase view     │   commands    │  /spcb:archive                │
   └──────────────────────┘    & skills   └──────────────────────────────┘
        run specbase here                       run /spcb:* here
```

Notice the arrow. Running `specbase init` in your terminal is what *installs* the slash commands into your AI tool. The terminal half sets up the chat half. After that, day-to-day driving mostly happens in chat.

## "How do I start interactive mode?"

**There is no separate interactive mode to start.** This question comes up a lot, so it deserves a plain answer.

You don't enter a special Specbase mode. You just open your AI coding assistant like you always do, and type a slash command into the chat. The slash command *is* how you "enter" Specbase. Your assistant recognizes it, loads the matching Specbase skill, and starts following the workflow.

So the real instructions are:

1. Open your AI coding assistant (Claude Code, Cursor, Windsurf, and so on) in your project.
2. Type `/spcb:propose` in its chat, the same place you type any other request.
3. Watch the autocomplete: if Specbase is installed, you'll see `/spcb:propose`, `/spcb:apply`, and friends appear as you type the slash.

That's it. No mode to toggle, no daemon to launch, no separate window.

One thing that *is* genuinely interactive lives in the terminal: `specbase view`. It opens a dashboard for browsing your specs and changes. But that's a viewer, not the thing you propose and build with. The building happens through slash commands in chat.

## Why this split exists

It's worth understanding, because it explains why Specbase works with 25+ different AI tools.

The CLI is the **engine**. It knows the rules: what a change folder looks like, which artifacts depend on which, how to merge a delta spec into your source of truth. It's the same everywhere.

The slash commands are the **steering wheel**, and every AI tool has a slightly different one. Claude Code calls them commands. Cursor and Windsurf have their own formats. Some tools call them skills. When you run `specbase init`, Specbase generates the right kind of file for each tool you selected, so the same `/spcb:propose` intent works no matter which assistant you prefer.

The strength of this design: you learn the workflow once and carry it across tools. The tradeoff: the exact syntax of a command can differ slightly between tools, which is the next section.

## Slash command syntax by tool

The intent is identical everywhere. The punctuation differs. Use the form that matches your assistant.

| Tool | How you type it |
|------|-----------------|
| Claude Code | `/spcb:propose`, `/spcb:apply` |
| Cursor | `/spcb-propose`, `/spcb-apply` |
| Windsurf | `/spcb-propose`, `/spcb-apply` |
| GitHub Copilot (IDE) | `/spcb-propose`, `/spcb-apply` |
| Oh My Pi | `/spcb-propose`, `/spcb-apply` |
| Kimi CLI | skill-style, e.g. `/skill:specbase-propose` |
| Trae | `/spcb-propose`, `/spcb-apply` |

Most tools use either the colon form (`/spcb:propose`) or the dash form (`/spcb-propose`). A few tools surface Specbase as named skills instead of slash commands; for those you invoke the skill by name. The full per-tool list, including exactly which files get written where, lives in [Supported Tools](supported-tools.md).

When in doubt, type a slash in your AI chat and look at the autocomplete. Your tool will show you the form it expects.

## How the commands got there: skills and commands

When you run `specbase init` (or `specbase update`), Specbase writes small files into your project so your AI tool can find the workflow. Depending on your tool and settings, these are **skills**, **commands**, or both.

- **Skills** live in places like `.claude/skills/specbase-*/SKILL.md`. They're the emerging cross-tool standard: a folder of instructions your assistant auto-detects.
- **Commands** live in places like `.claude/commands/spcb/<id>.md`. They're the older per-tool slash command files.

You don't have to care which one your tool uses. You just type the slash command and it works. But knowing these files exist helps when something goes wrong: if your commands vanish, it usually means these files are missing or stale, and `specbase update` regenerates them.

See [Supported Tools](supported-tools.md) for the exact paths per tool, and [Migration Guide](migration-guide.md) for how skills replaced the older command-only approach.

## Confirming it's installed

Quick checks, fastest first:

1. **Type a slash in your AI chat.** Start typing `/spcb` and watch for autocomplete suggestions. If they appear, you're set.
2. **Look for the files.** For Claude Code, check that `.claude/skills/` contains `specbase-*` folders. Other tools use their own directories ([Supported Tools](supported-tools.md) lists them).
3. **Re-run setup.** From your project root, run `specbase update`. This regenerates the skill and command files for whatever tools you configured.
4. **Restart your assistant.** Many tools scan for skills and commands at startup, so a fresh window can be the missing step.

## Which commands do I even have?

By default, Specbase installs the **core** set of slash commands:

- `/spcb:explore`: think through an idea with the AI before committing to a change (great first step when you're unsure)
- `/spcb:propose`: create a change and draft all its planning artifacts in one step
- `/spcb:apply`: build the change by working through its task list
- `/spcb:sync`: merge a change's spec updates into your main specs (usually automatic)
- `/spcb:archive`: finish a change and file it away

A good default rhythm: `explore` when you're figuring out what to do, then `propose`, `apply`, `archive`. The [Explore First](explore.md) guide explains why that opening step pays off.

There's also an **expanded** set for people who want finer control (`/spcb:new`, `/spcb:continue`, `/spcb:ff`, `/spcb:verify`, `/spcb:bulk-archive`, `/spcb:onboard`). You turn it on with `specbase config profile`, then apply it with `specbase update`.

New to all of this? `/spcb:onboard` (in the expanded set) walks you through a complete change on your own codebase, narrating each step. It's the friendliest possible introduction.

For what each command does in detail, see [Commands](commands.md). For when to reach for which, see [Workflows](workflows.md).

## A clean first run

Putting it together, here is the whole sequence with each step labeled by where it happens.

```text
TERMINAL   $ npm install -g @awarebydefault/specbase@latest
TERMINAL   $ cd your-project
TERMINAL   $ specbase init
              (installs slash commands into your AI tool)

AI CHAT      /spcb:explore
              (optional: think the idea through with the AI first)

AI CHAT      /spcb:propose add-dark-mode
              (AI drafts proposal, specs, design, tasks)

AI CHAT      /spcb:apply
              (AI builds it, checking off tasks)

AI CHAT      /spcb:archive
              (change is merged into your specs and filed away)
```

Two terminal steps to set up. Then you live in chat. That's the rhythm.

## Related

- [Getting Started](getting-started.md): the full first-change walkthrough
- [Commands](commands.md): every slash command in detail
- [CLI](cli.md): every terminal command in detail
- [Supported Tools](supported-tools.md): per-tool syntax and file locations
- [FAQ](faq.md): more quick answers
- [Troubleshooting](troubleshooting.md): fixes when commands don't show up
