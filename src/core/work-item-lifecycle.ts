/**
 * Derived work-item lifecycle (work-item-lifecycle).
 *
 * A change's position in the proposal -> enforcement -> ready-to-apply ->
 * implementing -> reviewing -> archived arc is COMPUTED on read from the
 * artifacts, task completion, a canonical pull-request observation, and the
 * archive location. The state is never stored as a `state` field that can drift from
 * the artifacts that define it. The `proposed` / `enforcement` distinction is
 * the surfaced form of change A (split-enforcement-workflow): both mean
 * "feature artifacts present, enforcement not complete," and the distinguisher
 * is whether the enforcement write has begun (`enforcement` artifact present).
 * `reviewing` represents externally observed readiness for human review. It is
 * derived from the canonical pull-request observation recorded in
 * `.openspec.yaml`; the panel's separate audit timestamp is non-transitional.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export type LifecycleState =
  | 'proposed'
  | 'enforcement'
  | 'ready-to-apply'
  | 'implementing'
  | 'reviewing'
  | 'archived';

/** A per-artifact disposition reported by status. */
type ArtifactDisposition = 'done' | 'ready' | 'blocked';

export interface LifecycleInput {
  /** True when the change directory lives under `changes/archive/`. */
  archived: boolean;
  /** Present artifact dispositions keyed by artifact id. */
  artifactDispositions: Record<string, ArtifactDisposition>;
  /** Artifact ids the schema requires before apply (e.g. `['tasks']`). */
  applyRequires: string[];
  /** Completed task checkboxes read from the tracked tasks file. */
  tasksChecked: number;
  /** Total task checkboxes read from the tracked tasks file (0 when none). */
  tasksTotal: number;
  /** True when the review panel recorded a `lastReviewedAt` audit footprint. */
  reviewFootprint: boolean;
  /** Readiness state of the canonical pull-request observation, when present. */
  pullRequestState?: 'draft' | 'ready';
}

const DONE: ArtifactDisposition = 'done';

/**
 * Derive a change's lifecycle state from its observable reality. Pure: no I/O,
 * so the status test can exercise every state with crafted inputs.
 *
 * Decision order:
 * - `archived` -> terminal.
 * - All apply-required artifacts present, apply not yet started -> ready-to-apply.
 * - All tasks complete + ready pull-request observation -> reviewing.
 * - Apply started (any task progress), or tasks complete without a ready PR
 *   -> implementing (the "awaiting human review" bucket).
 * - Enforcement write begun but the apply gate not met -> enforcement.
 * - Otherwise so far -> proposed (features drafted, enforcement pending).
 */
export function deriveLifecycleState(input: LifecycleInput): LifecycleState {
  if (input.archived) {
    return 'archived';
  }

  const allApplyDone =
    input.applyRequires.length > 0 &&
    input.applyRequires.every((id) => input.artifactDispositions[id] === DONE);
  const tasksExist = input.tasksTotal > 0 && Number.isFinite(input.tasksTotal);
  const tasksDone = tasksExist && input.tasksChecked >= input.tasksTotal;
  const applyStarted = tasksExist && input.tasksChecked > 0;
  const enforcementBegun = input.artifactDispositions['enforcement'] === DONE;

  if (allApplyDone && !applyStarted && !tasksDone) {
    return 'ready-to-apply';
  }
  if (tasksDone && input.pullRequestState === 'ready') {
    return 'reviewing';
  }
  if (applyStarted || tasksDone) {
    return 'implementing';
  }
  if (enforcementBegun && !allApplyDone) {
    return 'enforcement';
  }
  return 'proposed';
}

/** Count completed/incomplete Markdown task checkboxes in tasks content. */
export function countTaskCheckboxes(
  content: string
): { checked: number; total: number } {
  let checked = 0;
  let total = 0;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (/^[-*]\s*\[[xX]\]/.test(trimmed)) {
      checked += 1;
      total += 1;
    } else if (/^[-*]\s*\[\s*\]/.test(trimmed)) {
      total += 1;
    }
  }
  return { checked, total };
}

export interface GatherLifecycleInputOptions {
  /** Absolute path to the change directory (active or archived). */
  changeDir: string;
  /** The planning `changes` directory, used to detect the archive location. */
  changesDir?: string;
  /** Schema `apply.tracks` file, relative to changeDir (e.g. `tasks.md`). */
  tracksFile?: string | null;
  /** Parsed change metadata (`.openspec.yaml`), for audit and PR readiness. */
  metadata?: { lastReviewedAt?: string; pullRequest?: { state: 'draft' | 'ready' } } | null;
  /** Dispositions produced by status for the change's artifacts. */
  artifactDispositions: Record<string, ArtifactDisposition>;
  /** Artifact ids the schema requires before apply. */
  applyRequires: string[];
}

/** Gather the observable inputs for `deriveLifecycleState` from the change. */
export function gatherLifecycleInput(
  options: GatherLifecycleInputOptions
): LifecycleInput {
  const archiveDir = options.changesDir ? path.resolve(options.changesDir, 'archive') : null;
  const relativeToArchive = archiveDir ? path.relative(archiveDir, path.resolve(options.changeDir)) : '';
  const archived = archiveDir !== null && relativeToArchive !== '' && !relativeToArchive.startsWith(`..${path.sep}`) && relativeToArchive !== '..' && !path.isAbsolute(relativeToArchive);

  let tasksChecked = 0;
  let tasksTotal = 0;
  if (options.tracksFile) {
    const tracksPath = path.join(options.changeDir, options.tracksFile);
    if (fs.existsSync(tracksPath)) {
      const counts = countTaskCheckboxes(fs.readFileSync(tracksPath, 'utf8'));
      tasksChecked = counts.checked;
      tasksTotal = counts.total;
    }
  }

  return {
    archived,
    artifactDispositions: options.artifactDispositions,
    applyRequires: options.applyRequires,
    tasksChecked,
    tasksTotal,
    reviewFootprint: Boolean(options.metadata?.lastReviewedAt),
    ...(options.metadata?.pullRequest ? { pullRequestState: options.metadata.pullRequest.state } : {}),
  };
}

/**
 * Copy an originating idea's preserved thinking into an archived change.
 *
 * By-move graduation moves the idea's directory into the change, so its
 * `notes.md` and scratchpad are already present after the archive `mv` and
 * this is a no-op. When the change instead only REFERENCES an idea by id
 * (metadata `ideaId`) whose scratchpad still lives in `ideas/<id>/`, this
 * copies its `notes.md` and supporting members into the archived change so no
 * carried reasoning is orphaned. Files already present in the archived change
 * are left untouched (a by-move idea is never duplicated or overwritten).
 *
 * @returns the relative file names carried into the archived change.
 */
export function carryIdeaNotesIntoArchive(opts: {
  /** Absolute path to the archived (post-move) change directory. */
  archivedChangeDir: string;
  /** Absolute path to the planning `ideas` directory. */
  ideasDir?: string;
  /** Originating idea id from the change metadata, when present. */
  ideaId?: string | null;
}): string[] {
  if (!opts.ideasDir || !opts.ideaId) {
    return [];
  }
  const ideaDir = path.join(opts.ideasDir, opts.ideaId);
  if (!fs.existsSync(ideaDir) || !fs.statSync(ideaDir).isDirectory()) {
    return [];
  }
  const carried: string[] = [];
  for (const member of fs.readdirSync(ideaDir)) {
    if (member === '.openspec.yaml') {
      continue; // metadata does not travel as a scratchpad member
    }
    const source = path.join(ideaDir, member);
    if (fs.statSync(source).isFile()) {
      const target = path.join(opts.archivedChangeDir, member);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(opts.archivedChangeDir, { recursive: true });
        fs.copyFileSync(source, target);
        carried.push(member);
      }
    }
  }
  return carried;
}