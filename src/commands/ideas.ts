/**
 * The `ideas` command group: an ungoverned idea catalogue.
 *
 * Ideas are scratchpads under `<specbase>/ideas/<id>/` that feed the
 * pipeline: an agent explores an idea and drafts a proposal; the human
 * approves at the archive gate. State is positional — an idea under
 * `ideas/` is open; the same directory moved into `changes/` is a
 * proposed change (the move IS the graduation; there is no `graduate`
 * verb). Ideas are excluded from validate/coverage/list --specs.
 */
import * as path from 'node:path';
import { Command, Option } from 'commander';

import {
  createIdea,
  deleteIdea,
  listIdeas,
  showIdea,
} from '../core/ideas/store.js';
import { deriveAge, ageLabel } from '../core/ideas/model.js';
import { resolveRootForCommand, type ResolvedSpecbaseRoot } from '../core/root-selection.js';
import { emitFailure, printJson } from './shared-output.js';
import { COMMAND_REGISTRY } from '../core/completions/command-registry.js';
import { isInteractive } from '../utils/interactive.js';

interface IdeasOptions {
  store?: string;
  storePath?: string;
  json?: boolean;
  noInteractive?: boolean;
  interactive?: boolean;
}

interface IdeasStatus {
  severity: 'ok' | 'warn' | 'error';
  code: string;
  message: string;
  fix?: string;
}

interface IdeasAddOptions extends IdeasOptions {
  title?: string;
  note?: string;
  json?: boolean;
}

interface IdeasListOptions extends IdeasOptions {
  all?: boolean;
  json?: boolean;
}

interface IdeasShowOptions extends IdeasOptions {
  json?: boolean;
}

interface IdeasDeleteOptions extends IdeasOptions {
  yes?: boolean;
  json?: boolean;
}

class IdeasCommand {
  async add(options: IdeasAddOptions = {}): Promise<void> {
    let failed = false;
    try {
      const root = await this.requireRoot(options);
      if (root === null) return;
      const interactive = !options.json && isInteractive(options);

      let title = options.title;
      if (!title && interactive) {
        const { input } = await import('@inquirer/prompts');
        title = await input({
          message: 'Idea title (one line)',
          required: true,
        });
      }
      if (!title || title.trim().length === 0) {
        throw new Error('Pass an idea title: specbase ideas add --title "<title>"');
      }

      const idea = await createIdea(root.path, {
        title: title.trim(),
        note: options.note,
      });

      if (options.json) {
        printJson({
          id: idea.id,
          path: idea.dir,
          summary: idea.summary,
          created: idea.created,
        });
        return;
      }

      console.log(`Created idea '${idea.id}'.`);
      console.log(`  Path: ${path.join(idea.dir)}`);
      console.log(`  Summary: ${idea.summary}`);
    } catch (error) {
      emitFailure(options.json, { idea: null, status: [] }, error, 'ideas_error');
    }
  }

  async list(options: IdeasListOptions = {}): Promise<void> {
    try {
      const root = await this.requireRoot(options);
      if (root === null) return;
      const ideas = await listIdeas(root.path, { all: options.all });
      const rows = ideas.map((idea) => ({
        id: idea.id,
        summary: idea.summary,
        created: idea.created,
        age: ageLabel(deriveAge(idea.created).days),
      }));

      if (options.json) {
        // The spec contract: a JSON array of {id, summary, created, age}.
        printJson(rows);
        return;
      }

      if (rows.length === 0) {
        console.log('No ideas in the catalogue yet. Add one: specbase ideas add --title "<title>"');
        return;
      }

      const width = Math.max(...rows.map((row) => row.id.length)) + 2;
      for (const row of rows) {
        console.log(`${row.id.padEnd(width)}${row.age.padEnd(8)}${row.summary}`);
      }
    } catch (error) {
      emitFailure(options.json, { ideas: [], status: [] }, error, 'ideas_error');
    }
  }

  async show(id: string, options: IdeasShowOptions = {}): Promise<void> {
    try {
      const root = await this.requireRoot(options);
      if (root === null) return;
      const idea = await showIdea(root.path, id);
      const notes = await readTextFileMaybe(path.join(idea.dir, 'notes.md'));
      const age = ageLabel(deriveAge(idea.created).days);
      if (options.json) {
        printJson({
          id: idea.id,
          summary: idea.summary,
          created: idea.created,
          age,
          members: idea.members,
          notes: notes ?? '',
        });
        return;
      }

      console.log(`Idea: ${idea.id}`);
      console.log(`Summary: ${idea.summary}`);
      console.log(`Created: ${idea.created} (${age})`);
      console.log('');
      console.log('Members:');
      for (const member of idea.members) {
        console.log(`  ${member}`);
      }
      console.log('');
      console.log(notes ?? '(no notes yet)');
    } catch (error) {
      emitFailure(options.json, { idea: null, status: [] }, error, 'ideas_error');
    }
  }

  async delete(id: string, options: IdeasDeleteOptions = {}): Promise<void> {
    try {
      const root = await this.requireRoot(options);
      if (root === null) return;

      if (!options.yes) {
        if (options.json || !isInteractive(options)) {
          throw new Error(
            'Pass --yes to delete an idea non-interactively (idea catalogue entry is removed).'
          );
        }
        const { confirm } = await import('@inquirer/prompts');
        const confirmed = await confirm({
          message: `Delete idea '${id}'? Its scratchpad directory will be removed.`,
          default: false,
        });
        if (!confirmed) {
          throw new Error('Idea delete cancelled.');
        }
      }

      const result = await deleteIdea(root.path, id);
      if (options.json) {
        printJson({ deleted: result, status: [] });
        return;
      }
      console.log(`Deleted idea '${id}'.`);
    } catch (error) {
      emitFailure(options.json, { deleted: null, status: [] }, error, 'ideas_error');
    }
  }

  private async requireRoot(
    options: IdeasOptions
  ): Promise<ResolvedSpecbaseRoot | null> {
    // Diagnostic commands never scaffold: an idea query needs a real
    // planning root.
    return resolveRootForCommand(options, {
      json: options.json,
      allowImplicitRoot: false,
      failurePayload: { status: [] },
    });
  }
}

async function readTextFileMaybe(filePath: string): Promise<string | null> {
  try {
    const fs = await import('node:fs/promises');
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function registerIdeasCommand(program: Command): void {
  const ideasCommand = new IdeasCommand();
  const description =
    COMMAND_REGISTRY.find((entry) => entry.name === 'ideas')?.description ??
    'Capture and manage ideas - ungoverned scratchpad catalogue entries';
  const ideas = program.command('ideas').description(description);
  // Group-level --json so `specbase ideas --json <verb>` keeps the one
  // JSON-document contract just like workset/store.
  ideas.addOption(new Option('--json', 'Output as JSON').hideHelp());

  ideas
    .command('add')
    .description('Add an idea to the catalogue')
    .option('--title <title>', 'Idea title (one line)')
    .option('--note <note>', 'Seed note.md body')
    .option('--json', 'Output as JSON')
    .action(async (_options: IdeasAddOptions, command: Command) => {
      await ideasCommand.add(command.optsWithGlobals());
    });

  ideas
    .command('list')
    .alias('ls')
    .description('List open ideas oldest-first')
    .option('--all', 'Include all ideas (reserved; currently the same set)')
    .option('--json', 'Output as JSON')
    .action(async (options: IdeasListOptions, command: Command) => {
      await ideasCommand.list(command.optsWithGlobals());
    });

  ideas
    .command('show <id>')
    .description('Show an idea: metadata, member files, and notes')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: IdeasShowOptions, command: Command) => {
      await ideasCommand.show(id, command.optsWithGlobals());
    });

  ideas
    .command('delete <id>')
    .description('Delete an open idea (an idea already proposed into a change is not deletable)')
    .option('--yes', 'Confirm deletion non-interactively')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: IdeasDeleteOptions, command: Command) => {
      await ideasCommand.delete(id, command.optsWithGlobals());
    });

  const subcommandsLine = ideas.commands
    .map((subcommand) => {
      const aliases = subcommand.aliases();
      return aliases.length > 0
        ? `${subcommand.name()} (${aliases.join(', ')})`
        : subcommand.name();
    })
    .join(', ');

  // One handler owns missing AND unknown subcommands (same contract as
  // workset/store).
  ideas.allowExcessArguments(true);
  ideas.action(() => {
    const attempted = ideas.args.filter((operand) => !operand.startsWith('-'));
    const message =
      attempted.length > 0
        ? `Unknown command '${attempted[0]}' for 'specbase ideas'. Idea subcommands: ${subcommandsLine}.`
        : `Missing subcommand for 'specbase ideas'. Idea subcommands: ${subcommandsLine}.`;
    if (ideas.opts().json) {
      printJson({
        status: [
          {
            severity: 'error',
            code: 'unknown_ideas_subcommand',
            message,
            fix: 'Run one of the ideas subcommands.',
          } satisfies IdeasStatus,
        ],
      });
    } else {
      console.error(`Error: ${message}`);
    }
    process.exitCode = 1;
  });
}