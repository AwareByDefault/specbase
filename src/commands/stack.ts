import { Command, Option } from 'commander';
import {
  createStack,
  inspectStack,
  listStackManifests,
  projectStack,
  StackValidationError,
  validateStack,
} from '../core/change-stacks/index.js';
import { resolveRootForCommand, toRootOutput } from '../core/root-selection.js';
import { printJson, statusFromError } from './workflow/shared.js';

interface StackOptions {
  json?: boolean;
  store?: string;
  storePath?: string;
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function emitStackFailure(
  options: StackOptions,
  error: unknown,
  payload: { stack: null } | { stacks: [] } = { stack: null }
): void {
  const status = error instanceof StackValidationError
    ? error.diagnostics
    : [statusFromError(error)];
  if (options.json) printJson({ ...payload, status });
  else {
    for (const diagnostic of status) {
      console.error(`Error: ${diagnostic.message}`);
      if ('fix' in diagnostic && diagnostic.fix) console.error(`Fix: ${diagnostic.fix}`);
    }
  }
  process.exitCode = 1;
}

export class StackCommand {
  async create(id: string | undefined, options: StackOptions & { summary?: string; member?: string[]; fromIdea?: string }): Promise<void> {
    try {
      const root = await resolveRootForCommand(options, { json: options.json, failurePayload: { stack: null } });
      if (!root) return;
      if (!options.summary?.trim()) throw new Error('Pass --summary "<observable delivery outcome>".');
      const manifest = await createStack(root.path, {
        ...(id ? { id } : {}),
        summary: options.summary,
        members: options.member ?? [],
        ...(options.fromIdea ? { fromIdea: options.fromIdea } : {}),
      });
      const inspection = await inspectStack(root.path, manifest.id);
      if (options.json) printJson({ stack: inspection, root: toRootOutput(root), status: [] });
      else {
        console.log(`Created stack '${manifest.id}' with ${manifest.members.length} members.`);
        manifest.members.forEach((member, index) => console.log(`  ${index + 1}. ${member}`));
      }
    } catch (error) { emitStackFailure(options, error); }
  }

  async list(options: StackOptions): Promise<void> {
    try {
      const root = await resolveRootForCommand(options, { json: options.json, failurePayload: { stacks: [] } });
      if (!root) return;
      const stacks = [];
      for (const manifest of await listStackManifests(root.path)) stacks.push(await inspectStack(root.path, manifest.id));
      if (options.json) printJson({ stacks, root: toRootOutput(root), status: [] });
      else if (stacks.length === 0) console.log('No change stacks.');
      else for (const stack of stacks) console.log(`${stack.id}  ${stack.members.length} members  next: ${stack.firstUnfinishedMember ?? 'complete'}  ${stack.summary}`);
    } catch (error) { emitStackFailure(options, error, { stacks: [] }); }
  }

  async show(id: string, options: StackOptions): Promise<void> {
    try {
      const root = await resolveRootForCommand(options, { json: options.json, failurePayload: { stack: null } });
      if (!root) return;
      const stack = await inspectStack(root.path, id);
      if (options.json) printJson({ stack, root: toRootOutput(root), status: [] });
      else {
        console.log(`Stack: ${stack.id}`);
        console.log(`Summary: ${stack.summary}`);
        console.log(`Created: ${stack.created}`);
        stack.members.forEach((member, index) => {
          const artifacts = member.artifactProgress ? ` artifacts ${member.artifactProgress.complete}/${member.artifactProgress.total}` : '';
          const tasks = member.taskProgress ? ` tasks ${member.taskProgress.complete}/${member.taskProgress.total}` : '';
          console.log(`  ${index + 1}. ${member.id} [${member.position}]${artifacts}${tasks}`);
        });
        console.log(`Next unfinished: ${stack.firstUnfinishedMember ?? 'none'}`);
      }
    } catch (error) { emitStackFailure(options, error); }
  }

  async validate(id: string, options: StackOptions): Promise<void> {
    try {
      const root = await resolveRootForCommand(options, { json: options.json, failurePayload: { stack: null } });
      if (!root) return;
      await validateStack(root.path, id);
      const projection = await projectStack(root.path, id);
      const problem = projection.firstInvalidMember ?? projection.blockedByPlannedMember;
      if (options.json) printJson({ stack: { id, valid: projection.valid, projection }, root: toRootOutput(root), status: projection.valid ? [] : [{ severity: 'error', code: projection.firstInvalidMember ? 'invalid_stack_projection' : 'blocked_stack_projection', message: projection.firstInvalidMember ? `Stack '${id}' first fails at '${problem}'.` : `Stack '${id}' cannot project beyond planned member '${problem}'.` }] });
      else if (projection.valid) console.log(`Stack '${id}' is valid.`);
      else if (projection.firstInvalidMember) console.error(`Stack '${id}' is invalid at '${problem}'.`);
      else console.error(`Stack '${id}' is blocked by planned member '${problem}'.`);
      process.exitCode = projection.valid ? 0 : 1;
    } catch (error) { emitStackFailure(options, error); }
  }
}

export function registerStackCommand(program: Command): void {
  const implementation = new StackCommand();
  const stack = program.command('stack').description('Create and inspect finite linear delivery stacks').allowExcessArguments(true);
  stack.addOption(new Option('--json', 'Output one JSON document').hideHelp());
  stack.action((_options, command) => emitStackFailure(command.optsWithGlobals(), new Error('A stack subcommand is required: create, list, show, or validate.')));
  stack.on('command:*', (operands: string[]) => {
    const options = { json: process.argv.includes('--json') };
    emitStackFailure(options, new Error(`Unknown stack subcommand '${operands[0]}'. Use create, list, show, or validate.`));
  });
  stack.command('create [id]')
    .description('Create a stack from ordinary work-item IDs in delivery order')
    .option('--summary <text>', 'Stack summary')
    .option('--member <id>', 'Ordered member ID (repeat at least twice)', collect, [])
    .option('--from-idea <id>', 'Move an umbrella idea scratchpad into the stack')
    .option('--store <id>', "Store id to use as the Specbase root (a store is a standalone Specbase repo you've registered)")
    .option('--json', 'Output as JSON')
    .action((id, _options, command) => implementation.create(id, command.optsWithGlobals()));
  stack.command('list').alias('ls').description('List stacks and their next unfinished member').option('--store <id>', "Store id to use as the Specbase root (a store is a standalone Specbase repo you've registered)").option('--json', 'Output as JSON')
    .action((_options, command) => implementation.list(command.optsWithGlobals()));
  stack.command('show <id>').description('Show members and derived lifecycle progress').option('--store <id>', "Store id to use as the Specbase root (a store is a standalone Specbase repo you've registered)").option('--json', 'Output as JSON')
    .action((id, _options, command) => implementation.show(id, command.optsWithGlobals()));
  stack.command('validate <id>').description('Validate membership and every projected prefix').option('--store <id>', "Store id to use as the Specbase root (a store is a standalone Specbase repo you've registered)").option('--json', 'Output as JSON')
    .action((id, _options, command) => implementation.validate(id, command.optsWithGlobals()));
}
