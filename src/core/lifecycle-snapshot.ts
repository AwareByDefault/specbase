import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  formatChangeStatus,
  loadChangeContext,
  type ChangeContext,
  type ChangeStatus,
} from './artifact-graph/instruction-loader.js';
import { resolveArtifactOutputs } from './artifact-graph/outputs.js';
import { resolveSchema } from './artifact-graph/resolver.js';
import { resolvePlanningDirName } from './planning-dir.js';
import type { PlanningHome } from './planning-home.js';
import { ChangeMetadataError, readChangeMetadata } from '../utils/change-metadata.js';
import { FileSystemUtils } from '../utils/file-system.js';
import { countTaskCheckboxes } from './work-item-lifecycle.js';
import type { DraftPullRequest } from './change-metadata/index.js';

/** Version of the stable, serializable lifecycle snapshot contract. */
export const LIFECYCLE_SNAPSHOT_VERSION = 1 as const;

export type LifecycleSnapshotPosition = 'active' | 'archived';

export interface LifecycleSnapshotDiagnostic {
  code: 'lifecycle_snapshot_missing_id' | 'lifecycle_snapshot_unresolved' | 'lifecycle_snapshot_ambiguous';
  id: string | null;
  message: string;
  remediation: string;
}

export interface LifecycleSnapshot {
  id: string;
  position: LifecycleSnapshotPosition;
  lifecycle: NonNullable<ChangeStatus['lifecycle']>;
  artifacts: { complete: number; total: number };
  tasks: { complete: number; total: number };
  draftPullRequest?: DraftPullRequest;
}

export interface LifecycleSnapshotResult {
  version: typeof LIFECYCLE_SNAPSHOT_VERSION;
  snapshot: LifecycleSnapshot | null;
  diagnostics: LifecycleSnapshotDiagnostic[];
}

export interface GetLifecycleSnapshotOptions {
  /** Repository root containing `specbase/` or the legacy `openspec/` home. */
  root: string;
  /** Immutable work-item metadata ID. */
  id: string;
}

interface ResolveLifecycleSnapshotOptions extends GetLifecycleSnapshotOptions {
  /** Optional schema override used by the status adapter. */
  schema?: string;
  /** Optional store identity used only when projecting status next-step hints. */
  storeId?: string;
  /** CLI-only compatibility for its established directory-name selector. */
  allowDirectoryFallback?: boolean;
}

interface Candidate {
  changeDir: string;
  directoryName: string;
  id: string;
  position: LifecycleSnapshotPosition;
  draftPullRequest?: DraftPullRequest;
}

export interface ResolvedLifecycleSnapshot extends LifecycleSnapshotResult {
  context?: ChangeContext;
  status?: ChangeStatus;
}

function archiveFallbackId(directoryName: string): string {
  return directoryName.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function directDirectories(directory: string): string[] {
  try {
    return fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function findCandidates(root: string, id: string, allowDirectoryFallback: boolean): Candidate[] {
  const changesDir = path.join(root, resolvePlanningDirName(root), 'changes');
  const locations: Array<{ directory: string; position: LifecycleSnapshotPosition }> = [
    { directory: changesDir, position: 'active' },
    { directory: path.join(changesDir, 'archive'), position: 'archived' },
  ];
  const candidates: Candidate[] = [];

  for (const location of locations) {
    for (const directoryName of directDirectories(location.directory)) {
      if (location.position === 'active' && directoryName === 'archive') continue;
      const changeDir = path.join(location.directory, directoryName);
      const fallbackId = location.position === 'archived'
        ? archiveFallbackId(directoryName)
        : directoryName;
      let metadata;
      try {
        metadata = readChangeMetadata(changeDir, root);
      } catch (error) {
        if (!(error instanceof ChangeMetadataError)) throw error;
        // A malformed sibling must not prevent resolving a healthy immutable
        // ID. Preserve the established CLI behavior when the malformed
        // directory itself was selected through the compatibility fallback.
        if (allowDirectoryFallback && fallbackId === id) throw error;
        continue;
      }
      if (metadata?.id === id || (!metadata?.id && fallbackId === id) || (allowDirectoryFallback && fallbackId === id)) {
        candidates.push({
          changeDir,
          directoryName,
          id: metadata?.id ?? fallbackId,
          position: location.position,
          ...(metadata?.draftPullRequest ? { draftPullRequest: metadata.draftPullRequest } : {}),
        });
      }
    }
  }

  return candidates.sort((a, b) =>
    a.position.localeCompare(b.position) || a.directoryName.localeCompare(b.directoryName)
  );
}

function diagnostic(
  code: LifecycleSnapshotDiagnostic['code'],
  id: string | null,
  message: string,
  remediation: string
): LifecycleSnapshotResult {
  return { version: LIFECYCLE_SNAPSHOT_VERSION, snapshot: null, diagnostics: [{ code, id, message, remediation }] };
}

/**
 * Resolve a lifecycle snapshot for one immutable work-item ID. This boundary is
 * intentionally headless: it reads the planning store and core artifact graph,
 * but never imports Commander, a renderer, or interactive input.
 */
export function resolveLifecycleSnapshot(
  options: ResolveLifecycleSnapshotOptions
): ResolvedLifecycleSnapshot {
  const id = options.id?.trim();
  if (!id) {
    return diagnostic(
      'lifecycle_snapshot_missing_id',
      null,
      'A work-item ID is required to resolve a lifecycle snapshot.',
      'Pass the immutable ID from the work item metadata.'
    );
  }

  const root = FileSystemUtils.canonicalizeExistingPath(path.resolve(options.root));
  const candidates = findCandidates(root, id, options.allowDirectoryFallback === true);
  if (candidates.length === 0) {
    return diagnostic(
      'lifecycle_snapshot_unresolved',
      id,
      `No active or archived work item resolves to '${id}'.`,
      'Choose an ID from the planning store, or restore the archived work item metadata.'
    );
  }
  if (candidates.length > 1) {
    return diagnostic(
      'lifecycle_snapshot_ambiguous',
      id,
      `More than one active or archived work item resolves to '${id}'.`,
      'Restore unique immutable IDs before resolving this work item.'
    );
  }

  const candidate = candidates[0];
  const planningHome: PlanningHome = {
    kind: 'repo',
    root,
    changesDir: path.join(root, resolvePlanningDirName(root), 'changes'),
    defaultSchema: 'spec-driven',
  };
  const context = loadChangeContext(root, candidate.directoryName, options.schema, {
    changeDir: candidate.changeDir,
    planningHome,
  });
  const status = formatChangeStatus(context, options.storeId ? { storeId: options.storeId } : {});
  const resolvedSchema = resolveSchema(context.schemaName, root);
  const tracksFile = resolvedSchema.apply?.tracks;
  const trackedArtifact = tracksFile
    ? resolvedSchema.artifacts.find((artifact) => artifact.generates === tracksFile)
    : resolvedSchema.artifacts.find((artifact) => artifact.id === 'tasks');
  const taskFiles = trackedArtifact
    ? resolveArtifactOutputs(candidate.changeDir, trackedArtifact.generates)
    : tracksFile
      ? resolveArtifactOutputs(candidate.changeDir, tracksFile)
      : [];
  const fallbackTasksPath = path.join(candidate.changeDir, 'tasks.md');
  const resolvedTaskFiles = taskFiles.length > 0
    ? taskFiles
    : fs.existsSync(fallbackTasksPath)
      ? [fallbackTasksPath]
      : [];
  const taskCounts = resolvedTaskFiles.reduce(
    (total, tasksPath) => {
      const counts = countTaskCheckboxes(fs.readFileSync(tasksPath, 'utf8'));
      return { checked: total.checked + counts.checked, total: total.total + counts.total };
    },
    { checked: 0, total: 0 }
  );
  const tasks = { complete: taskCounts.checked, total: taskCounts.total };

  return {
    version: LIFECYCLE_SNAPSHOT_VERSION,
    snapshot: {
      id: candidate.id,
      position: candidate.position,
      lifecycle: status.lifecycle!,
      artifacts: { complete: status.artifacts.filter((artifact) => artifact.status === 'done').length, total: status.artifacts.length },
      tasks,
      ...(candidate.draftPullRequest ? { draftPullRequest: candidate.draftPullRequest } : {}),
    },
    diagnostics: [],
    context,
    status,
  };
}

/** Supported package API for resolving one immutable lifecycle snapshot. */
export function getLifecycleSnapshot(options: GetLifecycleSnapshotOptions): LifecycleSnapshotResult {
  const { context: _context, status: _status, ...result } = resolveLifecycleSnapshot(options);
  return result;
}
