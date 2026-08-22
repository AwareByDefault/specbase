import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { planningDir } from '../planning-dir.js';
import { buildStackMembershipIndex, type StackMembershipContext } from '../change-stacks/store.js';
import type { StackDiagnostic } from '../change-stacks/model.js';
import { type LifecycleState } from '../work-item-lifecycle.js';
import { getLifecycleSnapshot, type LifecycleSnapshotResult } from '../lifecycle-snapshot.js';
import { KANBAN_BOARD_VERSION } from './version.js';
import {
  DraftPullRequestSchema,
  PullRequestObservationSchema,
  type DraftPullRequest,
  type PullRequestObservation,
} from '../change-metadata/index.js';

export { KANBAN_BOARD_VERSION, VIEW_BOARD_VERSION } from './version.js';
export type { LifecycleState } from '../work-item-lifecycle.js';

/** A stable, machine-readable problem encountered while projecting a board. */
export interface KanbanDiagnostic {
  source: string;
  code?: string;
  message: string;
  remediation?: string;
}

/** @deprecated Internal renderer compatibility alias for KanbanDiagnostic. */
export type ViewDiagnostic = KanbanDiagnostic;

export interface ProgressCount {
  completed: number;
  total: number;
}

/** Canonical membership position for a work item in a valid delivery stack. */
export interface KanbanStackContext {
  id: string;
  position: number;
  total: number;
}

export interface IdeaCard {
  kind: 'idea';
  id: string;
  title: string;
  created: string | null;
  members: string[];
  stack?: KanbanStackContext;
}

export interface ChangeCard {
  kind: 'change';
  id: string;
  title: string;
  created: string | null;
  artifacts: ProgressCount;
  tasks: ProgressCount;
  /** Derived lifecycle state that determined this card's lane placement. */
  lifecycle: Exclude<LifecycleState, 'archived'>;
  /** Lifecycle-resolver position; additive for renderer compatibility. */
  position?: 'active';
  /** Canonically recorded PR observation, present when external delivery reports it. */
  pullRequest?: PullRequestObservation;
  /** @deprecated Kanban v4 source compatibility; current derivation uses pullRequest. */
  draftPullRequest?: DraftPullRequest;
  /** Lifecycle-resolver diagnostics; additive for renderer compatibility. */
  diagnostics?: KanbanDiagnostic[];
  stack?: KanbanStackContext;
}

export interface ArchiveCard {
  kind: 'archive';
  id: string;
  title: string;
  archived: string | null;
  tasks: ProgressCount;
  /** Lifecycle-resolver facts; additive for renderer compatibility. */
  artifacts?: ProgressCount;
  lifecycle?: 'archived';
  position?: 'archived';
  diagnostics?: KanbanDiagnostic[];
  stack?: KanbanStackContext;
  /** Canonically recorded PR observation retained after archive. */
  pullRequest?: PullRequestObservation;
}

/** @deprecated Kanban v3 accepted-specification card retained for source compatibility. */
export interface SpecCard {
  kind: 'spec';
  id: string;
  locator: string;
  title: string;
  requirementCount: number;
  requirements: string[];
  diagnostic: string | null;
}

/** The current work-only, serializable Kanban board contract. */
export interface ViewBoardModel {
  version: typeof KANBAN_BOARD_VERSION;
  project: {
    /** Display-safe identity for the selected project root. */
    name: string;
  };
  summary: {
    openIdeas: number;
    /** Per-lifecycle-lane counts for the six derived states. */
    lanes: Record<LifecycleState, number>;
    completedTasks: number;
    totalTasks: number;
  };
  /** Idea backlog lane plus six lifecycle-state lanes. */
  lanes: {
    ideas: IdeaCard[];
    proposed: ChangeCard[];
    enforcement: ChangeCard[];
    'ready-to-apply': ChangeCard[];
    implementing: ChangeCard[];
    reviewing: ChangeCard[];
    archived: ArchiveCard[];
  };
  diagnostics: ViewDiagnostic[];
}

export interface ViewModelPorts {
  readDir(dir: string): Promise<import('node:fs').Dirent[]>;
  readFile(file: string): Promise<string>;
  /** The single authoritative lifecycle source for active and archived cards. */
  lifecycleSnapshot?(root: string, id: string): LifecycleSnapshotResult;
  /** Builds canonical stack membership once for the whole snapshot. */
  stackMembershipIndex?(root: string, readableMemberIds: ReadonlySet<string>): Promise<{ members: Map<string, StackMembershipContext>; diagnostics: StackDiagnostic[] }>;
}

const defaultPorts: ViewModelPorts = {
  readDir: (dir) => fs.readdir(dir, { withFileTypes: true }),
  readFile: (file) => fs.readFile(file, 'utf8'),
  lifecycleSnapshot: (root, id) => getLifecycleSnapshot({ root, id }),
  stackMembershipIndex: buildStackMembershipIndex,
};

async function safeDirectories(
  ports: ViewModelPorts,
  dir: string,
  root: string,
  diagnostics: ViewDiagnostic[]
): Promise<import('node:fs').Dirent[]> {
  try {
    return (await ports.readDir(dir)).filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      diagnostics.push({
        source: path.relative(root, dir),
        code: 'kanban_board_section_unreadable',
        message: `Could not read this board section: ${error instanceof Error ? error.message : String(error)}`,
        remediation: 'Restore access to this board section, then derive the board again.',
      });
    }
    return [];
  }
}

async function safeFiles(ports: ViewModelPorts, dir: string): Promise<string[]> {
  try {
    return (await ports.readDir(dir)).filter((entry) => entry.isFile() && !entry.name.startsWith('.')).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('metadata must be a mapping');
  return value as Record<string, unknown>;
}

async function readMetadata(ports: ViewModelPorts, dir: string): Promise<Record<string, unknown> | null> {
  try {
    return objectRecord(parseYaml(await ports.readFile(path.join(dir, '.openspec.yaml'))));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return null;
    throw error;
  }
}

function textField(record: Record<string, unknown> | null, key: string): string | null {
  return record && typeof record[key] === 'string' && (record[key] as string).trim() ? (record[key] as string).trim() : null;
}

function archiveParts(name: string): { date: string | null; fallbackId: string } {
  const match = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  return match ? { date: match[1], fallbackId: match[2] } : { date: null, fallbackId: name };
}

function progressRatio(progress: ProgressCount): number {
  return progress.total === 0 ? 0 : progress.completed / progress.total;
}

function lifecycleDiagnostics(result: LifecycleSnapshotResult, source: string): KanbanDiagnostic[] {
  return result.diagnostics.map((item) => ({ source, code: item.code, message: item.message, remediation: item.remediation }));
}

function stackDiagnostics(root: string, diagnostics: StackDiagnostic[]): KanbanDiagnostic[] {
  return diagnostics.map((item) => ({
    source: item.path ? path.relative(root, item.path) : path.join('specbase', 'stacks'),
    code: item.code,
    message: item.message,
    ...(item.fix ? { remediation: item.fix } : {}),
  }));
}

function unreadableDiagnostic(source: string, error: unknown): KanbanDiagnostic {
  return {
    source,
    code: 'kanban_board_item_unreadable',
    message: error instanceof Error ? error.message : String(error),
    remediation: 'Fix the item metadata or restore the item, then derive the board again.',
  };
}

async function collectIdeas(root: string, store: string, ports: ViewModelPorts, diagnostics: ViewDiagnostic[]): Promise<IdeaCard[]> {
  const cards: IdeaCard[] = [];
  const home = path.join(store, 'ideas');
  for (const entry of await safeDirectories(ports, home, root, diagnostics)) {
    const dir = path.join(home, entry.name);
    try {
      const meta = await readMetadata(ports, dir);
      if (!meta) throw new Error('missing .openspec.yaml');
      const id = textField(meta, 'id');
      const title = textField(meta, 'summary');
      if (!id || !title) throw new Error('metadata is missing id or summary');
      cards.push({ kind: 'idea', id, title, created: textField(meta, 'created'), members: await safeFiles(ports, dir) });
    } catch (error) {
      diagnostics.push(unreadableDiagnostic(path.relative(root, dir), error));
    }
  }
  return cards.sort((a, b) => {
    if (a.created && b.created && a.created !== b.created) return a.created.localeCompare(b.created);
    if (a.created && !b.created) return -1;
    if (!a.created && b.created) return 1;
    return a.id.localeCompare(b.id);
  });
}

async function collectChanges(root: string, store: string, ports: ViewModelPorts, diagnostics: KanbanDiagnostic[]): Promise<ChangeCard[]> {
  const cards: ChangeCard[] = [];
  const home = path.join(store, 'changes');
  for (const entry of await safeDirectories(ports, home, root, diagnostics)) {
    if (entry.name === 'archive') continue;
    const dir = path.join(home, entry.name);
    const source = path.relative(root, dir);
    try {
      const meta = await readMetadata(ports, dir);
      const requestedId = textField(meta, 'id') ?? entry.name;
      const resolved = (ports.lifecycleSnapshot ?? defaultPorts.lifecycleSnapshot!)(root, requestedId);
      const cardDiagnostics = lifecycleDiagnostics(resolved, source);
      diagnostics.push(...cardDiagnostics);
      if (!resolved.snapshot) continue;
      if (resolved.snapshot.position !== 'active' || resolved.snapshot.lifecycle === 'archived') {
        throw new Error(`Lifecycle resolver returned an invalid active card position for '${requestedId}'.`);
      }
      cards.push({
        kind: 'change',
        id: resolved.snapshot.id,
        title: textField(meta, 'goal') ?? entry.name,
        created: textField(meta, 'created'),
        artifacts: { completed: resolved.snapshot.artifacts.complete, total: resolved.snapshot.artifacts.total },
        tasks: { completed: resolved.snapshot.tasks.complete, total: resolved.snapshot.tasks.total },
        lifecycle: resolved.snapshot.lifecycle,
        position: resolved.snapshot.position,
        ...(resolved.snapshot.pullRequest ? { pullRequest: resolved.snapshot.pullRequest } : {}),
        diagnostics: cardDiagnostics,
      });
    } catch (error) {
      diagnostics.push(unreadableDiagnostic(source, error));
    }
  }
  return cards.sort((a, b) => progressRatio(a.tasks) - progressRatio(b.tasks) || a.id.localeCompare(b.id));
}

async function collectArchives(root: string, store: string, ports: ViewModelPorts, diagnostics: KanbanDiagnostic[]): Promise<ArchiveCard[]> {
  const cards: ArchiveCard[] = [];
  const home = path.join(store, 'changes', 'archive');
  for (const entry of await safeDirectories(ports, home, root, diagnostics)) {
    const dir = path.join(home, entry.name);
    const source = path.relative(root, dir);
    try {
      const meta = await readMetadata(ports, dir);
      const parts = archiveParts(entry.name);
      const requestedId = textField(meta, 'id') ?? parts.fallbackId;
      const resolved = (ports.lifecycleSnapshot ?? defaultPorts.lifecycleSnapshot!)(root, requestedId);
      const cardDiagnostics = lifecycleDiagnostics(resolved, source);
      diagnostics.push(...cardDiagnostics);
      if (!resolved.snapshot) continue;
      if (resolved.snapshot.position !== 'archived' || resolved.snapshot.lifecycle !== 'archived') {
        throw new Error(`Lifecycle resolver returned an invalid archive card position for '${requestedId}'.`);
      }
      cards.push({
        kind: 'archive',
        id: resolved.snapshot.id,
        title: textField(meta, 'goal') ?? parts.fallbackId,
        archived: parts.date,
        artifacts: { completed: resolved.snapshot.artifacts.complete, total: resolved.snapshot.artifacts.total },
        tasks: { completed: resolved.snapshot.tasks.complete, total: resolved.snapshot.tasks.total },
        lifecycle: resolved.snapshot.lifecycle,
        position: resolved.snapshot.position,
        ...(resolved.snapshot.pullRequest ? { pullRequest: resolved.snapshot.pullRequest } : {}),
        diagnostics: cardDiagnostics,
      });
    } catch (error) {
      diagnostics.push(unreadableDiagnostic(source, error));
    }
  }
  return cards.sort((a, b) => {
    if (a.archived && b.archived && a.archived !== b.archived) return b.archived.localeCompare(a.archived);
    if (a.archived && !b.archived) return -1;
    if (!a.archived && b.archived) return 1;
    return a.id.localeCompare(b.id);
  });
}

function annotateStack<T extends IdeaCard | ChangeCard | ArchiveCard>(cards: T[], members: Map<string, StackMembershipContext>): T[] {
  return cards.map((card) => {
    const stack = members.get(card.id);
    return stack ? { ...card, stack } : card;
  });
}

async function deriveBoard(root: string, ports: ViewModelPorts): Promise<KanbanBoardSnapshot> {
  const store = planningDir(root);
  try {
    await ports.readDir(store);
  } catch {
    throw new Error(`No specbase directory found under ${path.resolve(root)}. Run 'specbase init' first.`);
  }
  const diagnostics: ViewDiagnostic[] = [];
  const [ideaCards, changeCards, archiveCards] = await Promise.all([
    collectIdeas(root, store, ports, diagnostics),
    collectChanges(root, store, ports, diagnostics),
    collectArchives(root, store, ports, diagnostics),
  ]);
  const readableMemberIds = new Set([
    ...ideaCards.map((card) => card.id),
    ...changeCards.map((card) => card.id),
    ...archiveCards.map((card) => card.id),
  ]);
  const stackIndex = await (ports.stackMembershipIndex ?? defaultPorts.stackMembershipIndex!)(root, readableMemberIds);
  diagnostics.push(...stackDiagnostics(root, stackIndex.diagnostics));
  const ideas = annotateStack(ideaCards, stackIndex.members);
  const changes = annotateStack(changeCards, stackIndex.members);
  const archives = annotateStack(archiveCards, stackIndex.members);
  const changeLanes: Record<Exclude<LifecycleState, 'archived'>, ChangeCard[]> = {
    proposed: [],
    enforcement: [],
    'ready-to-apply': [],
    implementing: [],
    reviewing: [],
  };
  for (const card of changes) changeLanes[card.lifecycle].push(card);
  const lanes: ViewBoardModel['lanes'] = { ideas, ...changeLanes, archived: archives };
  const completedTasks = changes.reduce((sum, card) => sum + card.tasks.completed, 0);
  const totalTasks = changes.reduce((sum, card) => sum + card.tasks.total, 0);
  diagnostics.sort((a, b) =>
    a.source.localeCompare(b.source) || (a.code ?? '').localeCompare(b.code ?? '') || a.message.localeCompare(b.message)
  );
  const resolvedRoot = path.resolve(root);
  return {
    version: KANBAN_BOARD_VERSION,
    project: { name: path.basename(resolvedRoot) || resolvedRoot },
    summary: {
      openIdeas: ideas.length,
      lanes: {
        proposed: lanes.proposed.length,
        enforcement: lanes.enforcement.length,
        'ready-to-apply': lanes['ready-to-apply'].length,
        implementing: lanes.implementing.length,
        reviewing: lanes.reviewing.length,
        archived: lanes.archived.length,
      },
      completedTasks,
      totalTasks,
    },
    lanes,
    diagnostics,
  };
}

/** Derive the supported, versioned, serializable kanban snapshot for a project. */
export async function deriveKanbanBoard(root = '.'): Promise<KanbanBoardSnapshot> {
  return deriveBoard(root, defaultPorts);
}

/** Concise supported alias for deriveKanbanBoard. */
export const deriveKanbanSnapshot = deriveKanbanBoard;

/** @deprecated Renderer compatibility entrypoint; use deriveKanbanBoard publicly. */
export async function deriveViewBoard(root = '.', ports: ViewModelPorts = defaultPorts): Promise<ViewBoardModel> {
  return deriveBoard(root, ports);
}

export type KanbanBoardSnapshot = ViewBoardModel;
export type KanbanSnapshot = KanbanBoardSnapshot;
export type KanbanCard = IdeaCard | ChangeCard | ArchiveCard;
export type KanbanColumn = keyof KanbanBoardSnapshot['lanes'];
export type KanbanSummary = KanbanBoardSnapshot['summary'];

export interface KanbanValidationDiagnostic {
  code: 'kanban_board_unsupported_version' | 'kanban_board_invalid_shape';
  message: string;
  remediation: string;
}

export interface LegacyKanbanBoardSnapshot {
  version: 3;
  project: { name: string };
  summary: { acceptedSpecs: number; requirements: number; openIdeas: number; completedTasks: number; totalTasks: number; lanes: Record<LifecycleState, number> };
  lanes: {
    ideas: IdeaCard[];
    proposed: ChangeCard[];
    enforcement: ChangeCard[];
    'ready-to-apply': ChangeCard[];
    implementing: ChangeCard[];
    reviewing: ChangeCard[];
    archived: ArchiveCard[];
  };
  specs: SpecCard[];
  diagnostics: KanbanDiagnostic[];
}

type ValidatedKanbanSnapshot = KanbanBoardSnapshot | LegacyKanbanBoardSnapshot;

export type KanbanBoardValidationResult =
  | { valid: true; snapshot: ValidatedKanbanSnapshot; diagnostics: [] }
  | { valid: false; snapshot: null; diagnostics: KanbanValidationDiagnostic[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isProgress(value: unknown): boolean {
  return isRecord(value) && Number.isInteger(value.completed) && Number(value.completed) >= 0
    && Number.isInteger(value.total) && Number(value.total) >= Number(value.completed);
}

function isPullRequestObservation(value: unknown): boolean {
  return PullRequestObservationSchema.safeParse(value).success;
}

function isLegacyDraftPullRequest(value: unknown): boolean {
  return DraftPullRequestSchema.safeParse(value).success;
}

function isKanbanDiagnostic(value: unknown): boolean {
  return isRecord(value)
    && typeof value.source === 'string'
    && typeof value.message === 'string'
    && (value.code === undefined || typeof value.code === 'string')
    && (value.remediation === undefined || typeof value.remediation === 'string');
}

function isOptionalDiagnosticList(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(isKanbanDiagnostic));
}

function isStackContext(value: unknown): value is KanbanStackContext {
  return isRecord(value)
    && typeof value.id === 'string' && value.id.trim().length > 0
    && Number.isInteger(value.position) && Number(value.position) > 0
    && Number.isInteger(value.total) && Number(value.total) > 0
    && Number(value.position) <= Number(value.total)
    && hasOnlyKeys(value, ['id', 'position', 'total']);
}

const LIFECYCLE_KEYS = ['proposed', 'enforcement', 'ready-to-apply', 'implementing', 'reviewing', 'archived'] as const;
const CURRENT_BOARD_KEYS = ['version', 'project', 'summary', 'lanes', 'diagnostics'] as const;
const CURRENT_SUMMARY_KEYS = ['openIdeas', 'lanes', 'completedTasks', 'totalTasks'] as const;
const CURRENT_LANE_KEYS = ['ideas', ...LIFECYCLE_KEYS] as const;

/** True only for a value compatible with the current work-only kanban snapshot schema. */
export function isKanbanBoardSnapshot(value: unknown): value is KanbanBoardSnapshot {
  if (!isRecord(value) || value.version !== KANBAN_BOARD_VERSION || !isRecord(value.project) || !isRecord(value.summary) || !isRecord(value.lanes)) return false;
  if (!hasOnlyKeys(value, CURRENT_BOARD_KEYS) || typeof value.project.name !== 'string' || !value.project.name.trim()) return false;
  const { summary, lanes } = value;
  if (!hasOnlyKeys(summary, CURRENT_SUMMARY_KEYS)
    || !Number.isInteger(summary.openIdeas) || Number(summary.openIdeas) < 0
    || !Number.isInteger(summary.completedTasks) || Number(summary.completedTasks) < 0
    || !Number.isInteger(summary.totalTasks) || Number(summary.totalTasks) < 0
    || !isRecord(summary.lanes)) return false;
  const summaryLanes = summary.lanes;
  if (!hasOnlyKeys(summaryLanes, LIFECYCLE_KEYS) || !LIFECYCLE_KEYS.every((key) => Number.isInteger(summaryLanes[key]) && Number(summaryLanes[key]) >= 0)) return false;
  if (!hasOnlyKeys(lanes, CURRENT_LANE_KEYS)
    || !Array.isArray(lanes.ideas) || !Array.isArray(lanes.proposed) || !Array.isArray(lanes.enforcement)
    || !Array.isArray(lanes['ready-to-apply']) || !Array.isArray(lanes.implementing) || !Array.isArray(lanes.reviewing)
    || !Array.isArray(lanes.archived) || !Array.isArray(value.diagnostics)) return false;
  const card = (entry: unknown, kind: string) => isRecord(entry) && entry.kind === kind && typeof entry.id === 'string' && typeof entry.title === 'string'
    && (entry.stack === undefined || isStackContext(entry.stack));
  if (!lanes.ideas.every((entry) => card(entry, 'idea') && Array.isArray(entry.members)
    && entry.members.every((member: unknown) => typeof member === 'string') && (entry.created === null || typeof entry.created === 'string'))) return false;
  const changeLanes = [['proposed', lanes.proposed], ['enforcement', lanes.enforcement], ['ready-to-apply', lanes['ready-to-apply']], ['implementing', lanes.implementing], ['reviewing', lanes.reviewing]] as const;
  if (!changeLanes.every(([lifecycle, entries]) => entries.every((entry) => card(entry, 'change')
    && isProgress(entry.artifacts) && isProgress(entry.tasks) && entry.lifecycle === lifecycle
    && (entry.position === undefined || entry.position === 'active')
    && (entry.pullRequest === undefined || isPullRequestObservation(entry.pullRequest))
    && (entry.draftPullRequest === undefined || isLegacyDraftPullRequest(entry.draftPullRequest))
    && !(entry.pullRequest !== undefined && entry.draftPullRequest !== undefined)
    && (lifecycle === 'reviewing'
      ? (isRecord(entry.pullRequest) && entry.pullRequest.state === 'ready') || isLegacyDraftPullRequest(entry.draftPullRequest)
      : !isRecord(entry.pullRequest) || entry.pullRequest.state !== 'ready')
    && isOptionalDiagnosticList(entry.diagnostics)
    && (entry.created === null || typeof entry.created === 'string')))) return false;
  if (!lanes.archived.every((entry) => card(entry, 'archive') && isProgress(entry.tasks)
    && (entry.artifacts === undefined || isProgress(entry.artifacts))
    && (entry.lifecycle === undefined || entry.lifecycle === 'archived')
    && (entry.position === undefined || entry.position === 'archived')
    && (entry.pullRequest === undefined || isPullRequestObservation(entry.pullRequest))
    && isOptionalDiagnosticList(entry.diagnostics)
    && (entry.archived === null || typeof entry.archived === 'string'))) return false;

  const activeCards = [...lanes.proposed, ...lanes.enforcement, ...lanes['ready-to-apply'], ...lanes.implementing, ...lanes.reviewing];
  const taskTotals = activeCards.reduce(
    (totals, entry) => ({
      completed: totals.completed + Number((entry.tasks as Record<string, unknown>).completed),
      total: totals.total + Number((entry.tasks as Record<string, unknown>).total),
    }),
    { completed: 0, total: 0 }
  );
  if (summary.openIdeas !== lanes.ideas.length
    || summary.completedTasks !== taskTotals.completed
    || summary.totalTasks !== taskTotals.total
    || !LIFECYCLE_KEYS.every((key) => summaryLanes[key] === (lanes[key] as unknown[]).length)) return false;

  return value.diagnostics.every(isKanbanDiagnostic);
}

/** Recognizes complete v3 values only when callers explicitly request the legacy version. */
function isLegacyKanbanBoardSnapshot(value: unknown): value is LegacyKanbanBoardSnapshot {
  if (!isRecord(value) || value.version !== 3 || !isRecord(value.project) || !isRecord(value.summary) || !isRecord(value.lanes)
    || !Array.isArray(value.specs) || !Array.isArray(value.diagnostics)) return false;
  const summary = value.summary;
  const lanes = value.lanes;
  if (typeof value.project.name !== 'string' || !value.project.name.trim()
    || !Number.isInteger(summary.acceptedSpecs) || Number(summary.acceptedSpecs) < 0
    || !Number.isInteger(summary.requirements) || Number(summary.requirements) < 0
    || !Number.isInteger(summary.openIdeas) || Number(summary.openIdeas) < 0
    || !Number.isInteger(summary.completedTasks) || Number(summary.completedTasks) < 0
    || !Number.isInteger(summary.totalTasks) || Number(summary.totalTasks) < 0
    || !isRecord(summary.lanes)) return false;
  const summaryLanes = summary.lanes;
  if (!LIFECYCLE_KEYS.every((key) => Number.isInteger(summaryLanes[key]) && Number(summaryLanes[key]) >= 0)
    || !Array.isArray(lanes.ideas) || !Array.isArray(lanes.proposed) || !Array.isArray(lanes.enforcement)
    || !Array.isArray(lanes['ready-to-apply']) || !Array.isArray(lanes.implementing) || !Array.isArray(lanes.reviewing)
    || !Array.isArray(lanes.archived)) return false;
  const card = (entry: unknown, kind: string) => isRecord(entry)
    && entry.kind === kind && typeof entry.id === 'string' && typeof entry.title === 'string';
  if (!lanes.ideas.every((entry) => card(entry, 'idea') && Array.isArray(entry.members)
    && entry.members.every((member: unknown) => typeof member === 'string')
    && (entry.created === null || typeof entry.created === 'string'))) return false;
  const changeLanes = [['proposed', lanes.proposed], ['enforcement', lanes.enforcement], ['ready-to-apply', lanes['ready-to-apply']], ['implementing', lanes.implementing], ['reviewing', lanes.reviewing]] as const;
  if (!changeLanes.every(([lifecycle, entries]) => entries.every((entry) => card(entry, 'change')
    && isProgress(entry.artifacts) && isProgress(entry.tasks) && entry.lifecycle === lifecycle
    && (entry.created === null || typeof entry.created === 'string')))) return false;
  if (!lanes.archived.every((entry) => card(entry, 'archive') && isProgress(entry.tasks)
    && (entry.archived === null || typeof entry.archived === 'string'))) return false;
  if (!value.specs.every((entry) => card(entry, 'spec') && typeof entry.locator === 'string'
    && Number.isInteger(entry.requirementCount) && Number(entry.requirementCount) >= 0
    && Array.isArray(entry.requirements) && entry.requirements.every((requirement: unknown) => typeof requirement === 'string')
    && (entry.diagnostic === null || typeof entry.diagnostic === 'string'))) return false;
  const activeCards = [...lanes.proposed, ...lanes.enforcement, ...lanes['ready-to-apply'], ...lanes.implementing, ...lanes.reviewing];
  const taskTotals = activeCards.reduce(
    (totals, entry) => ({
      completed: totals.completed + Number((entry.tasks as Record<string, unknown>).completed),
      total: totals.total + Number((entry.tasks as Record<string, unknown>).total),
    }),
    { completed: 0, total: 0 }
  );
  return summary.acceptedSpecs === value.specs.length
    && summary.requirements === value.specs.reduce((total, entry) => total + Number((entry as Record<string, unknown>).requirementCount), 0)
    && summary.openIdeas === lanes.ideas.length
    && summary.completedTasks === taskTotals.completed
    && summary.totalTasks === taskTotals.total
    && LIFECYCLE_KEYS.every((key) => summaryLanes[key] === (lanes[key] as unknown[]).length)
    && value.diagnostics.every(isKanbanDiagnostic);
}

/**
 * Validate an unknown board value against an explicitly requested version.
 * V4 is the only current type; v3 remains a validation-only compatibility path.
 */
export function validateKanbanBoardSnapshot(value: unknown, requestedVersion: number): KanbanBoardValidationResult {
  const invalid = (): KanbanBoardValidationResult => {
    const receivedVersion = isRecord(value) && 'version' in value ? String(value.version) : 'none';
    return {
      valid: false,
      snapshot: null,
      diagnostics: [{
        code: 'kanban_board_invalid_shape',
        message: `Kanban board value does not match requested version ${requestedVersion} (received version ${receivedVersion}).`,
        remediation: 'Derive a new snapshot with deriveKanbanBoard, or provide a complete supported snapshot.',
      }],
    };
  };
  if (requestedVersion === KANBAN_BOARD_VERSION) {
    return isKanbanBoardSnapshot(value) ? { valid: true, snapshot: value, diagnostics: [] } : invalid();
  }
  if (requestedVersion === 3) {
    return isLegacyKanbanBoardSnapshot(value) ? { valid: true, snapshot: value, diagnostics: [] } : invalid();
  }
  return {
    valid: false,
    snapshot: null,
    diagnostics: [{
      code: 'kanban_board_unsupported_version',
      message: `Unsupported kanban board version ${requestedVersion}; supported versions are 3 and ${KANBAN_BOARD_VERSION}.`,
      remediation: `Request kanban board version ${KANBAN_BOARD_VERSION}.`,
    }],
  };
}

/** Concise supported alias for validateKanbanBoardSnapshot. */
export const validateKanbanSnapshot = validateKanbanBoardSnapshot;
export type KanbanValidationResult = KanbanBoardValidationResult;
