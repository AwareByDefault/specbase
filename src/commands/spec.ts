import { program } from 'commander';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { MarkdownParser } from '../core/parsers/markdown-parser.js';
import { Validator } from '../core/validation/validator.js';
import type { Spec } from '../core/schemas/index.js';
import type { RootOutput } from '../core/root-selection.js';
import { isInteractive } from '../utils/interactive.js';
import { getSpecIds } from '../utils/item-discovery.js';
import { resolveProjectSpecModel } from '../core/shared/skill-generation.js';
import { planningDir, resolvePlanningDirName } from '../core/config.js';
import { ListCommand } from '../core/list.js';
import {
  loadGovernedRepository,
  renderDiagnostics,
} from '../core/governed/index.js';
import {
  resolveGovernedShowTarget,
  analyzeGovernedPair,
  renderGovernedSpecSummary,
  reportGovernedResolutionError,
} from '../core/artifact-graph/governed-show.js';
import { validateGovernedPairs } from '../core/artifact-graph/governed-validate.js';

// cwd-based planning specs dir for the deprecated noun-form commands; resolved
// at call time so it prefers specbase/ and falls back to an existing openspec/.
function cwdSpecsDir(): string {
  return join(resolvePlanningDirName(process.cwd()), 'specs');
}

interface ShowOptions {
  json?: boolean;
  // JSON-only filters (raw-first text has no filters)
  requirements?: boolean;
  scenarios?: boolean; // --no-scenarios sets this to false (JSON only)
  requirement?: string; // JSON only
  noInteractive?: boolean;
  rootOutput?: RootOutput;
}

function parseSpecFromFile(specPath: string, specId: string): Spec {
  const content = readFileSync(specPath, 'utf-8');
  const parser = new MarkdownParser(content);
  return parser.parseSpec(specId);
}

function validateRequirementIndex(spec: Spec, requirementOpt?: string): number | undefined {
  if (!requirementOpt) return undefined;
  const index = Number.parseInt(requirementOpt, 10);
  if (!Number.isInteger(index) || index < 1 || index > spec.requirements.length) {
    throw new Error(`Requirement ${requirementOpt} not found`);
  }
  return index - 1; // convert to 0-based
}

function filterSpec(spec: Spec, options: ShowOptions): Spec {
  const requirementIndex = validateRequirementIndex(spec, options.requirement);
  const includeScenarios = options.scenarios !== false && !options.requirements;

  const filteredRequirements = (requirementIndex !== undefined
    ? [spec.requirements[requirementIndex]]
    : spec.requirements
  ).map(req => ({
    text: req.text,
    scenarios: includeScenarios ? req.scenarios : [],
  }));

  const metadata = spec.metadata ?? { version: '1.0.0', format: 'openspec' as const };

  return {
    name: spec.name,
    overview: spec.overview,
    requirements: filteredRequirements,
    metadata,
  };
}

/**
 * Print the raw markdown content for a spec file without any formatting.
 * Raw-first behavior ensures text mode is a passthrough for deterministic output.
 */
function printSpecTextRaw(specPath: string): void {
  const content = readFileSync(specPath, 'utf-8');
  console.log(content);
}

export class SpecCommand {
  private specsDir: string;
  private rootPath?: string;

  // rootPath is set only by root-aware callers (top-level `show`); the
  // deprecated noun-form commands stay cwd-based.
  constructor(rootPath?: string) {
    this.rootPath = rootPath;
    this.specsDir = rootPath ? join(planningDir(rootPath), 'specs') : cwdSpecsDir();
  }

  async show(specId?: string, options: ShowOptions = {}): Promise<void> {
    // Governed projects resolve by plane-qualified locator or stable spec ID and
    // render the paired enforcement + coverage summary; legacy stays byte-for-byte.
    const projectRoot = this.rootPath ?? process.cwd();
    if (resolveProjectSpecModel(projectRoot).kind === 'governed') {
      await this.showGoverned(specId, options, projectRoot);
      return;
    }

    if (!specId) {
      const canPrompt = isInteractive(options);
      const specIds = await getSpecIds(this.rootPath ?? process.cwd());
      if (canPrompt && specIds.length > 0) {
        const { select } = await import('@inquirer/prompts');
        specId = await select({
          message: 'Select a spec to show',
          choices: specIds.map(id => ({ name: id, value: id })),
        });
      } else {
        throw new Error('Missing required argument <spec-id>');
      }
    }

    const specPath = join(this.specsDir, specId, 'spec.md');
    if (!existsSync(specPath)) {
      // Root-aware callers get the absolute path; the cwd-based noun form
      // keeps its historical forward-slash relative message on all platforms.
      const displayPath = this.rootPath ? specPath : `${resolvePlanningDirName(process.cwd())}/specs/${specId}/spec.md`;
      throw new Error(`Spec '${specId}' not found at ${displayPath}`);
    }

    if (options.json) {
      if (options.requirements && options.requirement) {
        throw new Error('Options --requirements and --requirement cannot be used together');
      }
      const parsed = parseSpecFromFile(specPath, specId);
      const filtered = filterSpec(parsed, options);
      const output = {
        id: specId,
        title: parsed.name,
        overview: parsed.overview,
        requirementCount: filtered.requirements.length,
        requirements: filtered.requirements,
        metadata: parsed.metadata ?? { version: '1.0.0', format: 'openspec' as const },
        ...(options.rootOutput ? { root: options.rootOutput } : {}),
      };
      console.log(JSON.stringify(output, null, 2));
      return;
    }
    printSpecTextRaw(specPath);
  }

  /**
   * Show a governed spec resolved by plane-qualified locator or stable spec ID.
   * Reuses the Unit 7 governed-show helpers: text mode is raw-first (spec.md,
   * then the pair/enforcement/coverage summary); `--json` emits the structured
   * governed view (stable ID, plane, locator, native pair paths, requirement and
   * scenario IDs, bindings, coverage states).
   */
  private async showGoverned(
    specId: string | undefined,
    options: ShowOptions,
    projectRoot: string
  ): Promise<void> {
    const planes = resolveProjectSpecModel(projectRoot).planes.map((p) => p.id);
    const repository = await loadGovernedRepository(planningDir(projectRoot), planes);

    if (!specId) {
      const canPrompt = isInteractive(options);
      const locators = repository.discovery.pairs.map((p) => p.locator);
      if (canPrompt && locators.length > 0) {
        const { select } = await import('@inquirer/prompts');
        specId = await select({
          message: 'Select a spec to show',
          choices: locators.map((id) => ({ name: id, value: id })),
        });
      } else {
        throw new Error('Missing required argument <spec-id>');
      }
    }

    const resolution = resolveGovernedShowTarget(repository, specId);
    if (resolution.kind !== 'resolved') {
      reportGovernedResolutionError(specId, resolution, options);
      process.exitCode = 1;
      return;
    }

    const { view } = await analyzeGovernedPair({
      repository,
      record: resolution.record,
      projectRoot,
    });

    if (options.json) {
      const output = {
        ...view,
        ...(options.rootOutput ? { root: options.rootOutput } : {}),
      };
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    // Raw-first: print the spec source verbatim before the derived summary.
    if (resolution.record.specPath) {
      try {
        console.log(readFileSync(resolution.record.specPath, 'utf-8'));
      } catch {
        console.log('(spec.md could not be read)');
      }
    }
    console.log(renderGovernedSpecSummary(view));
  }
}

/**
 * Validate one governed pair (or every pair when no target is given) through the
 * shared governed validation engine ({@link validateGovernedPairs}): identity,
 * coverage, lifecycle state, declared paths, parse issues, scoped-identity
 * duplicates, and unsafe locators. Renders the deterministic diagnostics via
 * {@link renderDiagnostics}. The standalone top-level `validate` command reuses
 * the same engine so both surfaces stay semantically identical.
 */
async function validateGovernedSpec(
  target: string | undefined,
  options: { json?: boolean; noInteractive?: boolean },
  projectRoot: string
): Promise<void> {
  const planes = resolveProjectSpecModel(projectRoot).planes.map((p) => p.id);
  const repository = await loadGovernedRepository(planningDir(projectRoot), planes);

  let records = repository.discovery.pairs;
  let targeted = false;
  if (target) {
    const resolution = resolveGovernedShowTarget(repository, target);
    if (resolution.kind !== 'resolved') {
      reportGovernedResolutionError(target, resolution, options);
      process.exitCode = 1;
      return;
    }
    records = [resolution.record];
    targeted = true;
  } else if (isInteractive(options)) {
    const locators = repository.discovery.pairs.map((p) => p.locator);
    if (locators.length > 0) {
      const { select } = await import('@inquirer/prompts');
      const picked = await select({
        message: 'Select a spec to validate',
        choices: locators.map((id) => ({ name: id, value: id })),
      });
      const resolution = resolveGovernedShowTarget(repository, picked);
      records = resolution.kind === 'resolved' ? [resolution.record] : [];
      targeted = true;
    }
  }

  const report = await validateGovernedPairs({
    repository,
    records,
    projectRoot,
    includeUnsafeLocators: !targeted,
    planes,
  });

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const result of report.specs) {
      if (result.valid) {
        console.log(`Governed spec '${result.locator}' is valid`);
      } else {
        console.error(`Governed spec '${result.locator}' has issues`);
        console.error(renderDiagnostics(result.diagnostics));
      }
    }
    for (const unsafe of report.unsafeLocators) {
      console.error(`Unsafe locator rejected: ${unsafe.message} (${unsafe.nativeSourcePath})`);
    }
  }
  process.exitCode = report.valid ? 0 : 1;
}

export function registerSpecCommand(rootProgram: typeof program) {
  const specCommand = rootProgram
    .command('spec')
    .description('Manage and view Specbase specifications');

  // Deprecation notice for noun-based commands
  specCommand.hook('preAction', () => {
    console.error('Warning: The "openspec spec ..." commands are deprecated. Prefer verb-first commands (e.g., "openspec show", "openspec validate --specs").');
  });

  specCommand
    .command('show [spec-id]')
    .description('Display a specific specification')
    .option('--json', 'Output as JSON')
    .option('--requirements', 'JSON only: Show only requirements (exclude scenarios)')
    .option('--no-scenarios', 'JSON only: Exclude scenario content')
    .option('-r, --requirement <id>', 'JSON only: Show specific requirement by ID (1-based)')
    .option('--no-interactive', 'Disable interactive prompts')
    .action(async (specId: string | undefined, options: ShowOptions & { noInteractive?: boolean }) => {
      try {
        const cmd = new SpecCommand();
        await cmd.show(specId, options as any);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exitCode = 1;
      }
    });

  specCommand
    .command('list')
    .description('List all available specifications')
    .option('--json', 'Output as JSON')
    .option('--long', 'Show id and title with counts')
    .action(async (options: { json?: boolean; long?: boolean }) => {
      try {
        // Governed projects recursively list plane-qualified pairs with stable
        // IDs and coverage summaries (Unit 6 shape); legacy stays byte-for-byte.
        if (resolveProjectSpecModel(process.cwd()).kind === 'governed') {
          await new ListCommand().execute(process.cwd(), 'specs', { json: options.json });
          return;
        }

        const specsDir = cwdSpecsDir();
        if (!existsSync(specsDir)) {
          console.log('No items found');
          return;
        }

        const specs = readdirSync(specsDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => {
            const specPath = join(specsDir, dirent.name, 'spec.md');
            if (existsSync(specPath)) {
              try {
                const spec = parseSpecFromFile(specPath, dirent.name);
                
                return {
                  id: dirent.name,
                  title: spec.name,
                  requirementCount: spec.requirements.length
                };
              } catch {
                return {
                  id: dirent.name,
                  title: dirent.name,
                  requirementCount: 0
                };
              }
            }
            return null;
          })
          .filter((spec): spec is { id: string; title: string; requirementCount: number } => spec !== null)
          .sort((a, b) => a.id.localeCompare(b.id));

        if (options.json) {
          console.log(JSON.stringify(specs, null, 2));
        } else {
          if (specs.length === 0) {
            console.log('No items found');
            return;
          }
          if (!options.long) {
            specs.forEach(spec => console.log(spec.id));
            return;
          }
          specs.forEach(spec => {
            console.log(`${spec.id}: ${spec.title} [requirements ${spec.requirementCount}]`);
          });
        }
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exitCode = 1;
      }
    });

  specCommand
    .command('validate [spec-id]')
    .description('Validate a specification structure')
    .option('--strict', 'Enable strict validation mode')
    .option('--json', 'Output validation report as JSON')
    .option('--no-interactive', 'Disable interactive prompts')
    .action(async (specId: string | undefined, options: { strict?: boolean; json?: boolean; noInteractive?: boolean }) => {
      try {
        // Governed projects validate the paired spec/enforcement through the
        // Unit 1-2 drift engine and report diagnostics; legacy is unchanged.
        if (resolveProjectSpecModel(process.cwd()).kind === 'governed') {
          await validateGovernedSpec(specId, options, process.cwd());
          return;
        }

        if (!specId) {
          const canPrompt = isInteractive(options);
          const specIds = await getSpecIds();
          if (canPrompt && specIds.length > 0) {
            const { select } = await import('@inquirer/prompts');
            specId = await select({
              message: 'Select a spec to validate',
              choices: specIds.map(id => ({ name: id, value: id })),
            });
          } else {
            throw new Error('Missing required argument <spec-id>');
          }
        }

        const specPath = join(cwdSpecsDir(), specId, 'spec.md');

        if (!existsSync(specPath)) {
          throw new Error(`Spec '${specId}' not found at ${resolvePlanningDirName(process.cwd())}/specs/${specId}/spec.md`);
        }

        const validator = new Validator(options.strict);
        const report = await validator.validateSpec(specPath);

        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          if (report.valid) {
            console.log(`Specification '${specId}' is valid`);
          } else {
            console.error(`Specification '${specId}' has issues`);
            report.issues.forEach(issue => {
              const label = issue.level === 'ERROR' ? 'ERROR' : issue.level;
              const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
              console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
            });
          }
        }
        process.exitCode = report.valid ? 0 : 1;
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exitCode = 1;
      }
    });

  return specCommand;
}
