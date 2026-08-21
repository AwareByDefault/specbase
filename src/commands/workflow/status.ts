/**
 * Status Command
 *
 * Displays artifact completion status for a change.
 */

import ora from 'ora';
import chalk from 'chalk';
import {
  resolveRootForCommand,
  toRootOutput,
  withStoreFlag,
  isStoreSelectedRoot,
} from '../../core/root-selection.js';
import {
  withGovernedStatus,
  type ChangeStatus,
} from '../../core/artifact-graph/index.js';
import { getChangeStackContext } from '../../core/change-stacks/context.js';
import { resolveLifecycleSnapshot } from '../../core/lifecycle-snapshot.js';
import {
  validateSchemaExists,
  getAvailableChanges,
  getStatusIndicator,
  getStatusColor,
} from './shared.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface StatusOptions {
  change?: string;
  schema?: string;
  store?: string;
  storePath?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

export async function statusCommand(options: StatusOptions): Promise<void> {
  // The root resolves (and the store banner prints) before the spinner starts
  // so the two do not fight over stderr.
  const root = await resolveRootForCommand(options, { json: options.json });
  if (!root) {
    return;
  }

  const spinner = options.json ? undefined : ora('Loading change status...').start();

  try {
    const projectRoot = root.path;
    const rootOutput = toRootOutput(root);
    const newChangeHint = withStoreFlag(root, 'specbase new change <name>');

    // Handle no-changes case gracefully — status is informational,
    // so "no changes" is a valid state, not an error.
    if (!options.change) {
      const available = await getAvailableChanges(projectRoot, root.changesDir);
      if (available.length === 0) {
        spinner?.stop();
        if (options.json) {
          console.log(
            JSON.stringify(
              { changes: [], message: 'No active changes.', root: rootOutput },
              null,
              2
            )
          );
          return;
        }
        console.log(`No active changes. Create one with: ${newChangeHint}`);
        return;
      }
      // Changes exist but --change not provided
      spinner?.stop();
      throw new Error(
        `Missing required option --change. Available changes:\n  ${available.join('\n  ')}`
      );
    }

    // Validate schema if explicitly provided before resolving the selected item.
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    const resolution = resolveLifecycleSnapshot({
      root: projectRoot,
      id: options.change,
      allowDirectoryFallback: true,
      ...(options.schema ? { schema: options.schema } : {}),
      ...(isStoreSelectedRoot(root) ? { storeId: root.storeId } : {}),
    });
    if (!resolution.snapshot || !resolution.context || !resolution.status) {
      const diagnostic = resolution.diagnostics[0];
      throw new Error(`${diagnostic.message} ${diagnostic.remediation}`);
    }

    // The shared resolver owns lifecycle/progress truth. Status only projects
    // that result into its established outer envelope.
    const status = await withGovernedStatus(resolution.status, resolution.context);
    const stack = await getChangeStackContext(projectRoot, resolution.snapshot.id);
    if (stack) status.stack = stack;

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify({
        ...status,
        lifecycleSnapshot: {
          version: resolution.version,
          snapshot: resolution.snapshot,
          diagnostics: resolution.diagnostics,
        },
        root: rootOutput,
      }, null, 2));
      return;
    }

    printStatusText(status);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printStatusText(status: ChangeStatus): void {
  const doneCount = status.artifacts.filter((a) => a.status === 'done').length;
  const total = status.artifacts.length;

  console.log(`Change: ${status.changeName}`);
  console.log(`Schema: ${status.schemaName}`);
  if (status.lifecycle) {
    console.log(`Lifecycle: ${status.lifecycle}`);
  }
  if (status.changeRoot) {
    console.log(`Change root: ${status.changeRoot}`);
  }
  console.log(`Progress: ${doneCount}/${total} artifacts complete`);
  console.log();

  for (const artifact of status.artifacts) {
    const indicator = getStatusIndicator(artifact.status);
    const color = getStatusColor(artifact.status);
    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += color(` (blocked by: ${artifact.missingDeps.join(', ')})`);
    }

    console.log(line);
  }

  if (status.isComplete) {
    console.log();
    console.log(chalk.green('All artifacts complete!'));
  }
}
