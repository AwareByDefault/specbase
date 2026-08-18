import { promises as fs } from 'fs';
import path from 'path';
import { getTaskProgressForChange, formatTaskStatus } from '../utils/task-progress.js';
import { Validator } from './validation/validator.js';
import chalk from 'chalk';
import {
  emitStoreRootBanner,
  isRootSelectionError,
  resolveSpecbaseRoot,
  toRootOutput,
  withStoreFlag,
  type ResolvedSpecbaseRoot,
  isStoreSelectedRoot,
} from './root-selection.js';
import {
  findSpecUpdates,
  buildUpdatedSpec,
  writeUpdatedSpec,
  type SpecUpdate,
} from './specs-apply.js';
import { loadChangeContext } from './artifact-graph/instruction-loader.js';
import { resolveSchema } from './artifact-graph/resolver.js';
import { resolveSpecModel, LEGACY_SPEC_MODEL, type SpecModel } from './artifact-graph/types.js';
import { mergeProjectPlanes } from './shared/skill-generation.js';
import { readProjectConfig } from './project-config.js';
import { renderDiagnostics } from './governed/index.js';
import { getChangeStackContext, resolveSelectedChangeId } from './change-stacks/context.js';
import {
  prepareGovernedArchive,
  writeGovernedArchivePairs,
  type GovernedArchivePlan,
  type PreparedGovernedPair,
} from './governed-archive.js';

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

async function listActiveChangeNames(changesDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(changesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (!isMissingPathError(error)) throw error;
    return [];
  }
}

export interface ArchiveOptions {
  yes?: boolean;
  skipSpecs?: boolean;
  noValidate?: boolean;
  validate?: boolean;
  json?: boolean;
  store?: string;
  storePath?: string;
}

interface ArchiveDiagnostic {
  severity: 'error';
  code: string;
  message: string;
  fix?: string;
}

interface ArchiveResult {
  change: string;
  archivedAs: string;
  path: string;
  specsUpdated: boolean;
  totals?: { added: number; modified: number; removed: number; renamed: number };
  governed?: GovernedArchiveReport;
}

/** Governed archive reporting: updated locators, op counts, retired targets, verification. */
interface GovernedArchiveReport {
  /** `verified` for a validated archive; `unverified-bypass` when validation was skipped. */
  verification: 'verified' | 'unverified-bypass';
  pairs: Array<{
    locator: string;
    specId: string | null;
    moved: boolean;
    previousLocator: string | null;
    normativeOps: PreparedGovernedPair['normativeOps'];
    bindingOps: PreparedGovernedPair['bindingOps'];
    retiredTargets: PreparedGovernedPair['retiredTargets'];
  }>;
}

/**
 * JSON mode is non-interactive: any point where the human flow would prompt or
 * print prose instead throws this error, which becomes a machine-readable
 * status entry with a non-zero exit code.
 */
class ArchiveBlockedError extends Error {
  readonly diagnostic: ArchiveDiagnostic;

  constructor(code: string, message: string, fix?: string) {
    super(message);
    this.name = 'ArchiveBlockedError';
    this.diagnostic = {
      severity: 'error',
      code,
      message,
      ...(fix ? { fix } : {}),
    };
  }
}

function toArchiveDiagnostic(error: unknown): ArchiveDiagnostic {
  if (error instanceof ArchiveBlockedError) {
    return error.diagnostic;
  }
  if (isRootSelectionError(error)) {
    return error.diagnostic;
  }
  return {
    severity: 'error',
    code: 'archive_error',
    message: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Atomically reserve the final archive directory and stage a complete,
 * non-destructive copy of the active change inside it. The directory itself is
 * the reservation, so no marker filename can collide with user content.
 */
async function reserveAndStageArchiveDestination(
  archiveDir: string,
  archivePath: string,
  archiveName: string,
  sourceDir: string
): Promise<void> {
  await fs.mkdir(archiveDir, { recursive: true });
  try {
    await fs.mkdir(archivePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new ArchiveBlockedError('archive_target_exists', `Archive '${archiveName}' already exists.`);
    }
    throw error;
  }

  try {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      await fs.cp(path.join(sourceDir, entry.name), path.join(archivePath, entry.name), {
        recursive: true,
        force: false,
        errorOnExist: true,
        verbatimSymlinks: true,
      });
    }
  } catch (error) {
    await fs.rm(archivePath, { recursive: true, force: true });
    throw error;
  }
}

async function removeArchivedSource(sourceDir: string): Promise<void> {
  await fs.rm(sourceDir, { recursive: true, force: true });
}

export class ArchiveCommand {
  async execute(changeName?: string, options: ArchiveOptions = {}): Promise<void> {
    const json = !!options.json;

    let root: ResolvedSpecbaseRoot;
    try {
      root = await resolveSpecbaseRoot({
        ...(options.store !== undefined ? { store: options.store } : {}),
        ...(options.storePath !== undefined ? { storePath: options.storePath } : {}),
      });
    } catch (error) {
      if (json && isRootSelectionError(error)) {
        this.printJsonFailure(undefined, toArchiveDiagnostic(error));
        return;
      }
      throw error;
    }

    if (json) {
      try {
        const result = await this.run(changeName, options, root, true);
        if (!result) {
          return;
        }
        console.log(JSON.stringify({ archive: result, root: toRootOutput(root) }, null, 2));
      } catch (error) {
        this.printJsonFailure(root, toArchiveDiagnostic(error));
      }
      return;
    }

    emitStoreRootBanner(root);
    await this.run(changeName, options, root, false);
  }

  private printJsonFailure(root: ResolvedSpecbaseRoot | undefined, diagnostic: ArchiveDiagnostic): void {
    console.log(
      JSON.stringify(
        {
          archive: null,
          ...(root ? { root: toRootOutput(root) } : {}),
          status: [diagnostic],
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  }

  /**
   * Shared archive flow. In human mode (json=false) prompts and prose match
   * the historical behavior and cancellations return null. In JSON mode no
   * prose reaches stdout and every blocked path throws.
   */
  private async run(
    changeName: string | undefined,
    options: ArchiveOptions,
    root: ResolvedSpecbaseRoot,
    json: boolean
  ): Promise<ArchiveResult | null> {
    const changesDir = root.changesDir;
    const archiveDir = root.archiveDir;
    const mainSpecsDir = root.specsDir;

    // Get change name interactively if not provided
    if (!changeName) {
      if (json) {
        throw new ArchiveBlockedError(
          'archive_change_name_required',
          'A change name is required: archive --json is non-interactive.',
          withStoreFlag(root, 'specbase archive <change-name> --json')
        );
      }
      const selectedChange = await this.selectChange(changesDir);
      if (!selectedChange) {
        console.log('No change selected. Aborting.');
        return null;
      }
      changeName = selectedChange;
    }

    const changeDir = path.join(changesDir, changeName);

    // Verify change exists
    try {
      const stat = await fs.stat(changeDir);
      if (!stat.isDirectory()) {
        throw new Error(`Change '${changeName}' not found.`);
      }
    } catch {
      const available = await listActiveChangeNames(changesDir);
      throw new ArchiveBlockedError(
        'archive_change_not_found',
        available.length > 0
          ? `Change '${changeName}' not found. Available changes: ${available.join(', ')}`
          : `Change '${changeName}' not found. No active changes exist in this root.`
      );
    }

    const stableChangeId = await resolveSelectedChangeId(changeDir, changeName);
    const stackContext = await getChangeStackContext(root.path, stableChangeId);
    if (stackContext && !stackContext.archiveEligible) {
      throw new ArchiveBlockedError(
        'archive_stack_predecessor_required',
        `Change '${changeName}' cannot archive before predecessor '${stackContext.requiredPredecessor}'.`,
        `Archive '${stackContext.requiredPredecessor}' first, then retry.`
      );
    }

    // Preflight a deterministic destination collision before any accepted-spec write.
    const archiveName = `${this.getArchiveDate()}-${changeName}`;
    const archivePath = path.join(archiveDir, archiveName);
    try {
      await fs.access(archivePath);
      throw new ArchiveBlockedError('archive_target_exists', `Archive '${archiveName}' already exists.`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    const skipValidation = options.validate === false || options.noValidate === true;

    // Governed spec model routes through pair-aware preparation; the legacy flat
    // model keeps every step below byte-for-byte unchanged. Any failure to
    // positively resolve a governed model falls back to the legacy path.
    const specModel = this.resolveSpecModelForChange(root.path, changeName, changeDir);
    if (specModel.kind === 'governed') {
      return await this.runGoverned(changeName, stableChangeId, changeDir, options, root, json, skipValidation, stackContext !== null);
    }

    const legacySpecUpdates = await findSpecUpdates(changeDir, mainSpecsDir);
    if (stackContext && legacySpecUpdates.length > 0 && options.skipSpecs) {
      throw new ArchiveBlockedError(
        'archive_stack_delta_required',
        `Stacked change '${stableChangeId}' has deltas that downstream members depend on; --skip-specs is not allowed.`,
        'Archive with spec updates applied.'
      );
    }

    // Validate specs and change before archiving
    if (!skipValidation) {
      const validator = new Validator();
      let hasValidationErrors = false;

      // Validate proposal.md (informative only; human mode prints warnings)
      if (!json) {
        const changeFile = path.join(changeDir, 'proposal.md');
        try {
          await fs.access(changeFile);
          const changeReport = await validator.validateChange(changeFile);
          // Proposal validation is informative only (do not block archive)
          if (!changeReport.valid) {
            console.log(chalk.yellow(`\nProposal warnings in proposal.md (non-blocking):`));
            for (const issue of changeReport.issues) {
              const symbol = issue.level === 'ERROR' ? '⚠' : (issue.level === 'WARNING' ? '⚠' : 'ℹ');
              console.log(chalk.yellow(`  ${symbol} ${issue.message}`));
            }
          }
        } catch {
          // Change file doesn't exist, skip validation
        }
      }

      // Validate delta-formatted spec files under the change directory if present
      const changeSpecsDir = path.join(changeDir, 'specs');
      let hasDeltaSpecs = false;
      try {
        const candidates = await fs.readdir(changeSpecsDir, { withFileTypes: true });
        for (const c of candidates) {
          if (c.isDirectory()) {
            try {
              const candidatePath = path.join(changeSpecsDir, c.name, 'spec.md');
              await fs.access(candidatePath);
              const content = await fs.readFile(candidatePath, 'utf-8');
              if (/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements/m.test(content)) {
                hasDeltaSpecs = true;
                break;
              }
            } catch {}
          }
        }
      } catch {}
      if (hasDeltaSpecs) {
        const deltaReport = await validator.validateChangeDeltaSpecs(changeDir);
        if (!deltaReport.valid) {
          hasValidationErrors = true;
          if (!json) {
            console.log(chalk.red(`\nValidation errors in change delta specs:`));
            for (const issue of deltaReport.issues) {
              if (issue.level === 'ERROR') {
                console.log(chalk.red(`  ✗ ${issue.message}`));
              } else if (issue.level === 'WARNING') {
                console.log(chalk.yellow(`  ⚠ ${issue.message}`));
              }
            }
          }
        }
      }

      if (hasValidationErrors) {
        if (json) {
          throw new ArchiveBlockedError(
            'archive_validation_failed',
            `Validation failed for change '${changeName}'.`,
            `Run ${withStoreFlag(root, `specbase validate ${changeName}`)} for details, fix the errors, or rerun with --no-validate.`
          );
        }
        console.log(chalk.red('\nValidation failed. Please fix the errors before archiving.'));
        console.log(chalk.yellow('To skip validation (not recommended), use --no-validate flag.'));
        process.exitCode = 1;
        return null;
      }
    } else if (json) {
      if (!options.yes) {
        throw new ArchiveBlockedError(
          'archive_confirmation_required',
          'Skipping validation requires confirmation: rerun with --yes.',
          withStoreFlag(root, 'specbase archive <change-name> --json --no-validate --yes')
        );
      }
    } else {
      // Log warning when validation is skipped
      const timestamp = new Date().toISOString();

      if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        const proceed = await confirm({
          message: chalk.yellow('⚠️  WARNING: Skipping validation may archive invalid specs. Continue? (y/N)'),
          default: false
        });
        if (!proceed) {
          console.log('Archive cancelled.');
          return null;
        }
      } else {
        console.log(chalk.yellow(`\n⚠️  WARNING: Skipping validation may archive invalid specs.`));
      }

      console.log(chalk.yellow(`[${timestamp}] Validation skipped for change: ${changeName}`));
      console.log(chalk.yellow(`Affected files: ${changeDir}`));
    }

    // Show progress and check for incomplete tasks
    const progress = await getTaskProgressForChange(changesDir, changeName, path.resolve(changesDir, '..', '..'));
    if (!json) {
      const status = formatTaskStatus(progress);
      console.log(`Task status: ${status}`);
    }

    const incompleteTasks = Math.max(progress.total - progress.completed, 0);
    if (incompleteTasks > 0) {
      if (json) {
        if (!options.yes) {
          throw new ArchiveBlockedError(
            'archive_tasks_incomplete',
            `${incompleteTasks} incomplete task(s) found for change '${changeName}'.`,
            'Complete the tasks or rerun with --yes.'
          );
        }
      } else if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        const proceed = await confirm({
          message: `Warning: ${incompleteTasks} incomplete task(s) found. Continue?`,
          default: false
        });
        if (!proceed) {
          console.log('Archive cancelled.');
          return null;
        }
      } else {
        console.log(`Warning: ${incompleteTasks} incomplete task(s) found. Continuing due to --yes flag.`);
      }
    }

    // Atomically claim and stage the final archive before accepted truth can change.
    // A concurrent creator that wins during preparation is detected here.
    await reserveAndStageArchiveDestination(archiveDir, archivePath, archiveName, changeDir);
    let archiveCommitted = false;
    try {
    // Handle spec updates unless skipSpecs flag is set
    let specsUpdated = false;
    let totals: ArchiveResult['totals'];
    if (options.skipSpecs) {
      if (!json) {
        console.log('Skipping spec updates (--skip-specs flag provided).');
      }
    } else {
      // Find specs to update
      const specUpdates = legacySpecUpdates;

      if (specUpdates.length > 0) {
        if (!json) {
          console.log('\nSpecs to update:');
          for (const update of specUpdates) {
            const status = update.exists ? 'update' : 'create';
            const capability = path.basename(path.dirname(update.target));
            console.log(`  ${capability}: ${status}`);
          }
        }

        let shouldUpdateSpecs = true;
        if (!options.yes) {
          if (json) {
            throw new ArchiveBlockedError(
              'archive_confirmation_required',
              `Updating ${specUpdates.length} spec(s) requires confirmation: rerun with --yes.`,
              withStoreFlag(root, 'specbase archive <change-name> --json --yes')
            );
          }
          const { confirm } = await import('@inquirer/prompts');
          shouldUpdateSpecs = await confirm({
            message: 'Proceed with spec updates?',
            default: true
          });
          if (!shouldUpdateSpecs) {
            if (stackContext) {
              console.log(chalk.red('Stacked changes with deltas must apply those deltas before advancing.'));
              process.exitCode = 1;
              return null;
            }
            console.log('Skipping spec updates. Proceeding with archive.');
          }
        }

        if (shouldUpdateSpecs) {
          // Prepare all updates first (validation pass, no writes)
          const prepared: Array<{ update: SpecUpdate; rebuilt: string; counts: { added: number; modified: number; removed: number; renamed: number } }> = [];
          try {
            for (const update of specUpdates) {
              const built = await buildUpdatedSpec(update, stableChangeId, { silent: json });
              prepared.push({ update, rebuilt: built.rebuilt, counts: built.counts });
            }
          } catch (err: any) {
            if (json) {
              throw new ArchiveBlockedError(
                'archive_spec_update_failed',
                String(err.message || err),
                'Fix the change delta specs and rerun. No files were changed.'
              );
            }
            console.log(String(err.message || err));
            console.log('Aborted. No files were changed.');
            process.exitCode = 1;
            return null;
          }

          // Validate every rebuilt spec before writing any of them, so a
          // late validation failure really does leave all targets unchanged.
          if (!skipValidation) {
            for (const p of prepared) {
              const specName = path.basename(path.dirname(p.update.target));
              const report = await new Validator().validateSpecContent(specName, p.rebuilt);
              if (!report.valid) {
                if (json) {
                  throw new ArchiveBlockedError(
                    'archive_spec_validation_failed',
                    `Rebuilt spec for '${specName}' failed validation. No files were changed.`,
                    `Run ${withStoreFlag(root, `specbase validate ${specName}`)} after fixing the change deltas.`
                  );
                }
                console.log(chalk.red(`\nValidation errors in rebuilt spec for ${specName} (will not write changes):`));
                for (const issue of report.issues) {
                  if (issue.level === 'ERROR') console.log(chalk.red(`  ✗ ${issue.message}`));
                  else if (issue.level === 'WARNING') console.log(chalk.yellow(`  ⚠ ${issue.message}`));
                }
                console.log('Aborted. No files were changed.');
                process.exitCode = 1;
                return null;
              }
            }
          }

          // All validations passed; write files and display counts
          const writeTotals = { added: 0, modified: 0, removed: 0, renamed: 0 };
          for (const p of prepared) {
            await writeUpdatedSpec(p.update, p.rebuilt, p.counts, {
              silent: json,
              // Cross-root paths must be absolute when a store is selected.
              ...(isStoreSelectedRoot(root) ? { displayPath: p.update.target } : {}),
            });
            writeTotals.added += p.counts.added;
            writeTotals.modified += p.counts.modified;
            writeTotals.removed += p.counts.removed;
            writeTotals.renamed += p.counts.renamed;
          }
          specsUpdated = true;
          totals = writeTotals;
          if (!json) {
            console.log(
              `Totals: + ${writeTotals.added}, ~ ${writeTotals.modified}, - ${writeTotals.removed}, → ${writeTotals.renamed}`
            );
            console.log('Specs updated successfully.');
          }
        }
      }
    }

    // Accepted truth has committed. Preserve the staged archive even if source
    // cleanup is interrupted; the complete source copy was validated first.
    archiveCommitted = true;
    await removeArchivedSource(changeDir);

    if (!json) {
      console.log(`Change '${changeName}' archived as '${archiveName}'.`);
    }

    return {
      change: changeName,
      archivedAs: archiveName,
      path: archivePath,
      specsUpdated,
      ...(totals ? { totals } : {}),
    };
    } finally {
      if (!archiveCommitted) await fs.rm(archivePath, { recursive: true, force: true });
    }
  }

  /**
   * Resolve the change's spec model, defaulting to legacy on ANY failure so the
   * legacy archive path can never be affected by governed resolution. Core
   * dispatches on the resolved model, never on the schema name (design decision 6).
   */
  private resolveSpecModelForChange(
    projectRoot: string,
    changeName: string,
    changeDir: string
  ): SpecModel {
    try {
      const context = loadChangeContext(projectRoot, changeName, undefined, {
        changeDir,
      });
      return mergeProjectPlanes(
        resolveSpecModel(resolveSchema(context.schemaName, projectRoot)),
        readProjectConfig(projectRoot)
      );
    } catch {
      return LEGACY_SPEC_MODEL;
    }
  }

  /**
   * Governed archive: pair-aware preparation, readiness enforcement, coherent
   * pair writes, retired-target reporting, and honest bypass reporting. The
   * legacy flat archive path is never reached here.
   */
  private async runGoverned(
    changeName: string,
    stableChangeId: string,
    changeDir: string,
    options: ArchiveOptions,
    root: ResolvedSpecbaseRoot,
    json: boolean,
    skipValidation: boolean,
    stacked: boolean
  ): Promise<ArchiveResult | null> {
    const changesDir = root.changesDir;
    const archiveDir = root.archiveDir;
    const specbaseRoot = path.resolve(changeDir, '..', '..');
    const projectRoot = root.path;

    // Bypass confirmation semantics mirror the legacy path exactly.
    if (skipValidation) {
      if (json) {
        if (!options.yes) {
          throw new ArchiveBlockedError(
            'archive_confirmation_required',
            'Skipping validation requires confirmation: rerun with --yes.',
            withStoreFlag(root, 'specbase archive <change-name> --json --no-validate --yes')
          );
        }
      } else {
        const timestamp = new Date().toISOString();
        if (!options.yes) {
          const { confirm } = await import('@inquirer/prompts');
          const proceed = await confirm({
            message: chalk.yellow('⚠️  WARNING: Skipping validation may archive unverified governed enforcement. Continue? (y/N)'),
            default: false,
          });
          if (!proceed) {
            console.log('Archive cancelled.');
            return null;
          }
        } else {
          console.log(chalk.yellow('\n⚠️  WARNING: Skipping validation may archive unverified governed enforcement.'));
        }
        console.log(chalk.yellow(`[${timestamp}] Validation skipped for change: ${changeName}`));
        console.log(chalk.yellow(`Affected files: ${changeDir}`));
      }
    }

    const archiveName = `${this.getArchiveDate()}-${changeName}`;
    const archivePath = path.join(archiveDir, archiveName);
    try {
      await fs.access(archivePath);
      throw new ArchiveBlockedError('archive_target_exists', `Archive '${archiveName}' already exists.`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    // Prepare the governed archive plan (no writes) BEFORE any current-spec write.
    const plan = await prepareGovernedArchive({ changeDir, specbaseRoot, projectRoot });
    if (stacked && plan.hasGovernedDeltas && options.skipSpecs) {
      throw new ArchiveBlockedError(
        'archive_stack_delta_required',
        `Stacked change '${stableChangeId}' has deltas that downstream members depend on; --skip-specs is not allowed.`,
        'Archive with spec updates applied.'
      );
    }

    // Block on structural + semantic problems unless validation is bypassed.
    if (!skipValidation) {
      const ok = this.enforceGovernedReadiness(plan, changeName, root, json);
      if (!ok) return null;
    }

    // Task progress + incomplete-task confirmation (legacy semantics).
    const proceed = await this.checkTaskProgress(changesDir, changeName, options, json);
    if (!proceed) return null;

    // Reserve and stage after the potentially expensive plan/readiness pass and
    // before accepted truth writes. If a concurrent archive won during
    // preparation, this fails atomically while truth and the active change are untouched.
    await reserveAndStageArchiveDestination(archiveDir, archivePath, archiveName, changeDir);
    let archiveCommitted = false;
    try {
    // Write each validated pair coherently unless --skip-specs is set.
    let appliedPairs: PreparedGovernedPair[] = [];
    if (options.skipSpecs) {
      if (!json) console.log('Skipping spec updates (--skip-specs flag provided).');
    } else if (plan.pairs.length > 0) {
      if (!json) {
        console.log('\nGoverned pairs to update:');
        for (const p of plan.pairs) {
          const label = p.moved ? `${p.previousLocator} → ${p.locator} (moved)` : p.locator;
          console.log(`  ${label}`);
        }
      }

      let shouldWrite = true;
      if (!options.yes) {
        if (json) {
          throw new ArchiveBlockedError(
            'archive_confirmation_required',
            `Updating ${plan.pairs.length} governed pair(s) requires confirmation: rerun with --yes.`,
            withStoreFlag(root, 'specbase archive <change-name> --json --yes')
          );
        }
        const { confirm } = await import('@inquirer/prompts');
        shouldWrite = await confirm({ message: 'Proceed with governed pair updates?', default: true });
        if (!shouldWrite) {
          if (stacked && plan.hasGovernedDeltas) {
            console.log(chalk.red('Stacked changes with deltas must apply those deltas before advancing.'));
            process.exitCode = 1;
            return null;
          }
          console.log('Skipping spec updates. Proceeding with archive.');
        }
      }

      if (shouldWrite) {
        await writeGovernedArchivePairs(plan.pairs);
        appliedPairs = plan.pairs;
        if (!json) this.printGovernedPairSummary(appliedPairs);
      }
    }

    // Accepted truth has committed. Preserve the staged archive even if source
    // cleanup is interrupted; the complete source copy was validated first.
    archiveCommitted = true;
    await removeArchivedSource(changeDir);

    const verification: GovernedArchiveReport['verification'] = skipValidation
      ? 'unverified-bypass'
      : 'verified';

    if (!json) {
      console.log(`Change '${changeName}' archived as '${archiveName}'.`);
      if (verification === 'unverified-bypass') {
        console.log(chalk.yellow('Governed enforcement was not fully verified (validation bypassed).'));
      }
    }

    return {
      change: changeName,
      archivedAs: archiveName,
      path: archivePath,
      specsUpdated: appliedPairs.length > 0,
      governed: {
        verification,
        pairs: appliedPairs.map((p) => ({
          locator: p.locator,
          specId: p.specId,
          moved: p.moved,
          previousLocator: p.previousLocator,
          normativeOps: p.normativeOps,
          bindingOps: p.bindingOps,
          retiredTargets: p.retiredTargets,
        })),
      },
    };
    } finally {
      if (!archiveCommitted) await fs.rm(archivePath, { recursive: true, force: true });
    }
  }

  /**
   * Enforce governed archive readiness. Returns true when nothing blocks; in
   * human mode prints the blockers, sets a non-zero exit code, and returns false
   * so the caller aborts before any write; in JSON mode throws a machine-readable
   * blocked error instead.
   */
  private enforceGovernedReadiness(
    plan: GovernedArchivePlan,
    changeName: string,
    root: ResolvedSpecbaseRoot,
    json: boolean
  ): boolean {
    if (plan.incompletePairs.length > 0) {
      const detail = plan.incompletePairs
        .map((p) => `${p.locator} is missing ${p.missingMember}`)
        .join('; ');
      if (json) {
        throw new ArchiveBlockedError(
          'archive_governed_incomplete_pair',
          `Incomplete governed delta pair(s) in change '${changeName}': ${detail}.`,
          'Author both spec.md and enforcement.yaml for each affected pair, then rerun.'
        );
      }
      console.log(chalk.red(`\nIncomplete governed delta pair(s) (aborting before any spec write):`));
      for (const p of plan.incompletePairs) {
        console.log(chalk.red(`  ✗ ${p.locator} is missing ${p.missingMember}`));
      }
      process.exitCode = 1;
      return false;
    }

    if (plan.unsafeLocators.length > 0) {
      const detail = plan.unsafeLocators.map((u) => u.message).join('; ');
      if (json) {
        throw new ArchiveBlockedError('archive_governed_unsafe_locator', `Unsafe governed locator(s): ${detail}.`);
      }
      console.log(chalk.red(`\nUnsafe governed locator(s) (aborting):`));
      for (const u of plan.unsafeLocators) console.log(chalk.red(`  ✗ ${u.message}`));
      process.exitCode = 1;
      return false;
    }

    if (plan.mergeErrors.length > 0) {
      const detail = plan.mergeErrors
        .map((m) => `${m.locator}: ${m.messages.join('; ')}`)
        .join(' | ');
      if (json) {
        throw new ArchiveBlockedError(
          'archive_governed_merge_conflict',
          `Governed delta could not be reconciled onto the current pair in change '${changeName}': ${detail}.`,
          'Fix the delta operations (unknown MODIFIED/REMOVED IDs, duplicate ADDED IDs) and rerun.'
        );
      }
      console.log(chalk.red(`\nGoverned delta reconciliation failed (aborting before any spec write):`));
      for (const m of plan.mergeErrors) {
        for (const message of m.messages) {
          console.log(chalk.red(`  ✗ ${m.locator}: ${message}`));
        }
      }
      process.exitCode = 1;
      return false;
    }

    const validationErrors = (plan.validation?.specs ?? [])
      .flatMap((s) => s.diagnostics)
      .filter((d) => d.severity === 'error');
    const blocked = !plan.ready;
    if (blocked) {
      const readinessDetail = plan.notReady
        .map((n) => `${n.locator}: ${n.blockers.join(', ')}`)
        .join('; ');
      if (json) {
        throw new ArchiveBlockedError(
          'archive_governed_not_ready',
          `Governed pair(s) are not ready to archive in change '${changeName}'.`,
          `Resolve blockers (${[
            ...validationErrors.map((d) => d.code),
            ...plan.notReady.flatMap((n) => n.blockers),
          ].join(', ')}) or rerun with --no-validate --yes to bypass. ` +
            `Run ${withStoreFlag(root, `specbase validate ${changeName}`)} for details.`
        );
      }
      console.log(chalk.red(`\nGoverned pair(s) are not ready to archive (aborting before any spec write):`));
      if (validationErrors.length > 0) {
        console.log(renderDiagnostics(validationErrors));
      }
      if (readinessDetail) {
        console.log(chalk.red(`  Readiness blockers — ${readinessDetail}`));
      }
      console.log(chalk.yellow('To bypass validation (not recommended), use --no-validate --yes.'));
      process.exitCode = 1;
      return false;
    }

    return true;
  }

  /** Print the applied governed pair operation counts and retired-target candidates. */
  private printGovernedPairSummary(pairs: PreparedGovernedPair[]): void {
    for (const p of pairs) {
      const n = p.normativeOps;
      const b = p.bindingOps;
      console.log(`Updated ${p.locator}${p.moved ? ` (moved from ${p.previousLocator})` : ''}:`);
      console.log(
        `  normative: + ${n.added}, ~ ${n.modified}, - ${n.removed}, → ${n.renamed}` +
          `  |  bindings: + ${b.added}, ~ ${b.modified}, - ${b.removed}`
      );
      for (const candidate of p.retiredTargets) {
        const status = candidate.stillReferenced
          ? `still shared by ${candidate.survivingBindingIds.join(', ')}`
          : 'no surviving binding references it';
        console.log(
          chalk.yellow(
            `  retired-target candidate: ${candidate.path} (was ${candidate.fromBindingIds.join(', ')}; ${status}) — not deleted`
          )
        );
      }
    }
  }

  /**
   * Task-progress gate shared with the legacy semantics: prints status (human),
   * and on incomplete tasks either throws (JSON, no --yes), prompts (human, no
   * --yes), or warns (--yes). Returns false when a human declines.
   */
  private async checkTaskProgress(
    changesDir: string,
    changeName: string,
    options: ArchiveOptions,
    json: boolean
  ): Promise<boolean> {
    const progress = await getTaskProgressForChange(
      changesDir,
      changeName,
      path.resolve(changesDir, '..', '..')
    );
    if (!json) {
      console.log(`Task status: ${formatTaskStatus(progress)}`);
    }
    const incompleteTasks = Math.max(progress.total - progress.completed, 0);
    if (incompleteTasks > 0) {
      if (json) {
        if (!options.yes) {
          throw new ArchiveBlockedError(
            'archive_tasks_incomplete',
            `${incompleteTasks} incomplete task(s) found for change '${changeName}'.`,
            'Complete the tasks or rerun with --yes.'
          );
        }
      } else if (!options.yes) {
        const { confirm } = await import('@inquirer/prompts');
        const proceed = await confirm({
          message: `Warning: ${incompleteTasks} incomplete task(s) found. Continue?`,
          default: false,
        });
        if (!proceed) {
          console.log('Archive cancelled.');
          return false;
        }
      } else {
        console.log(`Warning: ${incompleteTasks} incomplete task(s) found. Continuing due to --yes flag.`);
      }
    }
    return true;
  }

  private async selectChange(changesDir: string): Promise<string | null> {
    const { select } = await import('@inquirer/prompts');
    const changeDirs = await listActiveChangeNames(changesDir);

    if (changeDirs.length === 0) {
      console.log('No active changes found.');
      return null;
    }

    // Build choices with progress inline to avoid duplicate lists
    let choices: Array<{ name: string; value: string }> = changeDirs.map(name => ({ name, value: name }));
    try {
      const progressList: Array<{ id: string; status: string }> = [];
      for (const id of changeDirs) {
        const progress = await getTaskProgressForChange(changesDir, id, path.resolve(changesDir, '..', '..'));
        const status = formatTaskStatus(progress);
        progressList.push({ id, status });
      }
      const nameWidth = Math.max(...progressList.map(p => p.id.length));
      choices = progressList.map(p => ({
        name: `${p.id.padEnd(nameWidth)}     ${p.status}`,
        value: p.id
      }));
    } catch {
      // If anything fails, fall back to simple names
      choices = changeDirs.map(name => ({ name, value: name }));
    }

    try {
      const answer = await select({
        message: 'Select a change to archive',
        choices
      });
      return answer;
    } catch (error) {
      // User cancelled (Ctrl+C)
      return null;
    }
  }

  private getArchiveDate(): string {
    // Returns date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  }
}
