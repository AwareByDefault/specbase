import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { planningDir } from '../planning-dir.js';
import { parseGovernedSpec } from '../governed/spec-parser.js';
import { getTaskProgressForChange } from '../../utils/task-progress.js';
import { resolveArtifactOutputs, resolveSchema } from '../artifact-graph/index.js';
import { resolveSchemaForChange } from '../../utils/change-metadata.js';
import { deriveLifecycleState, gatherLifecycleInput, type LifecycleState } from '../work-item-lifecycle.js';
import { VIEW_BOARD_VERSION } from './version.js';

export { VIEW_BOARD_VERSION } from './version.js';
export type { LifecycleState } from '../work-item-lifecycle.js';

export interface ViewDiagnostic {
  source: string;
  message: string;
}

export interface ProgressCount {
  completed: number;
  total: number;
}

export interface IdeaCard {
  kind: 'idea';
  id: string;
  title: string;
  created: string | null;
  members: string[];
}

export interface ChangeCard {
  kind: 'change';
  id: string;
  title: string;
  created: string | null;
  artifacts: ProgressCount;
  tasks: ProgressCount;
  /** Derived lifecycle state that determined this card's lane placement. */
  lifecycle: LifecycleState;
}

export interface ArchiveCard {
  kind: 'archive';
  id: string;
  title: string;
  archived: string | null;
  tasks: ProgressCount;
}

export interface SpecCard {
  kind: 'spec';
  id: string;
  locator: string;
  title: string;
  requirementCount: number;
  requirements: string[];
  diagnostic: string | null;
}

export interface ViewBoardModel {
  version: typeof VIEW_BOARD_VERSION;
  project: {
    /** Display-safe identity for the selected project root. */
    name: string;
  };
  summary: {
    acceptedSpecs: number;
    requirements: number;
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
  specs: SpecCard[];
  diagnostics: ViewDiagnostic[];
}

export interface ViewModelPorts {
  readDir(dir: string): Promise<import('node:fs').Dirent[]>;
  readFile(file: string): Promise<string>;
  taskProgress?(changesDir: string, changeName: string, projectRoot: string): Promise<ProgressCount>;
  artifactProgress?(changeDir: string, projectRoot: string): ProgressCount;
  lifecycleState?(
    changeDir: string,
    changesDir: string,
    projectRoot: string,
    metadata: Record<string, unknown> | null
  ): LifecycleState;
}

const defaultPorts: ViewModelPorts = {
  readDir: (dir) => fs.readdir(dir, { withFileTypes: true }),
  readFile: (file) => fs.readFile(file, 'utf8'),
  taskProgress: getTaskProgressForChange,
  artifactProgress,
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
        message: `Could not read this board section: ${error instanceof Error ? error.message : String(error)}`,
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

function artifactProgress(changeDir: string, projectRoot: string): ProgressCount {
  try {
    const schemaName = resolveSchemaForChange(changeDir, undefined, projectRoot);
    const schema = resolveSchema(schemaName, projectRoot);
    const total = schema.artifacts.length;
    const completed = schema.artifacts.filter((artifact) => resolveArtifactOutputs(changeDir, artifact.generates).length > 0).length;
    return { completed, total };
  } catch {
    const conventional = ['proposal.md', 'design.md', 'tasks.md'];
    return {
      completed: conventional.filter((name) => {
        try { return resolveArtifactOutputs(changeDir, name).length > 0; } catch { return false; }
      }).length,
      total: conventional.length,
    };
  }
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
      diagnostics.push({ source: path.relative(root, dir), message: error instanceof Error ? error.message : String(error) });
    }
  }
  return cards.sort((a, b) => {
    if (a.created && b.created && a.created !== b.created) return a.created.localeCompare(b.created);
    if (a.created && !b.created) return -1;
    if (!a.created && b.created) return 1;
    return a.id.localeCompare(b.id);
  });
}

async function collectChanges(root: string, store: string, ports: ViewModelPorts, diagnostics: ViewDiagnostic[]): Promise<ChangeCard[]> {
  const cards: ChangeCard[] = [];
  const home = path.join(store, 'changes');
  for (const entry of await safeDirectories(ports, home, root, diagnostics)) {
    if (entry.name === 'archive') continue;
    const dir = path.join(home, entry.name);
    try {
      const meta = await readMetadata(ports, dir);
      const tasks = await (ports.taskProgress ?? getTaskProgressForChange)(home, entry.name, root);
      const lifecycle = (ports.lifecycleState ?? lifecycleForChange)(dir, home, root, meta);
      cards.push({
        kind: 'change',
        id: textField(meta, 'id') ?? entry.name,
        title: textField(meta, 'goal') ?? entry.name,
        created: textField(meta, 'created'),
        artifacts: (ports.artifactProgress ?? artifactProgress)(dir, root),
        tasks,
        lifecycle,
      });
    } catch (error) {
      diagnostics.push({ source: path.relative(root, dir), message: error instanceof Error ? error.message : String(error) });
    }
  }
  return cards.sort((a, b) => progressRatio(a.tasks) - progressRatio(b.tasks) || a.id.localeCompare(b.id));
}

/**
 * Derive a change's lifecycle state from the same observable reality the status
 * surface uses: artifact presence, apply-required artifacts, tracked tasks, a
 * review-completion footprint, and the archive location. The board never reads a
 * stored state field; it consumes the derived state to place the card in a lane.
 */
function lifecycleForChange(
  changeDir: string,
  changesDir: string,
  projectRoot: string,
  meta: Record<string, unknown> | null
): LifecycleState {
  try {
    const schemaName = resolveSchemaForChange(changeDir, undefined, projectRoot);
    const schema = resolveSchema(schemaName, projectRoot);
    const artifactDispositions: Record<string, 'done' | 'ready' | 'blocked'> = {};
    for (const artifact of schema.artifacts) {
      artifactDispositions[artifact.id] =
        resolveArtifactOutputs(changeDir, artifact.generates).length > 0 ? 'done' : 'blocked';
    }
    const applyRequires = schema.apply?.requires ?? schema.artifacts.map((artifact) => artifact.id);
    return deriveLifecycleState(
      gatherLifecycleInput({
        changeDir,
        changesDir,
        tracksFile: schema.apply?.tracks ?? null,
        metadata: meta as { lastReviewedAt?: string } | null,
        artifactDispositions,
        applyRequires,
      })
    );
  } catch {
    return 'proposed';
  }
}

async function collectArchives(root: string, store: string, ports: ViewModelPorts, diagnostics: ViewDiagnostic[]): Promise<ArchiveCard[]> {
  const cards: ArchiveCard[] = [];
  const home = path.join(store, 'changes', 'archive');
  for (const entry of await safeDirectories(ports, home, root, diagnostics)) {
    const dir = path.join(home, entry.name);
    try {
      const meta = await readMetadata(ports, dir);
      const parts = archiveParts(entry.name);
      cards.push({
        kind: 'archive',
        id: textField(meta, 'id') ?? parts.fallbackId,
        title: textField(meta, 'goal') ?? parts.fallbackId,
        archived: parts.date,
        tasks: await (ports.taskProgress ?? getTaskProgressForChange)(home, entry.name, root),
      });
    } catch (error) {
      diagnostics.push({ source: path.relative(root, dir), message: error instanceof Error ? error.message : String(error) });
    }
  }
  return cards.sort((a, b) => {
    if (a.archived && b.archived && a.archived !== b.archived) return b.archived.localeCompare(a.archived);
    if (a.archived && !b.archived) return -1;
    if (!a.archived && b.archived) return 1;
    return a.id.localeCompare(b.id);
  });
}

async function walkSpecFiles(
  ports: ViewModelPorts,
  dir: string,
  root: string,
  diagnostics: ViewDiagnostic[],
  relative: string[] = []
): Promise<Array<{ file: string; parts: string[] }>> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await ports.readDir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      diagnostics.push({
        source: path.relative(root, dir),
        message: `Could not read this specification section: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
    return [];
  }
  const found: Array<{ file: string; parts: string[] }> = [];
  if (entries.some((entry) => entry.isFile() && entry.name === 'spec.md')) found.push({ file: path.join(dir, 'spec.md'), parts: relative });
  for (const entry of entries.filter((item) => item.isDirectory() && !item.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name))) {
    found.push(...await walkSpecFiles(ports, path.join(dir, entry.name), root, diagnostics, [...relative, entry.name]));
  }
  return found;
}

async function collectSpecs(root: string, store: string, ports: ViewModelPorts, diagnostics: ViewDiagnostic[]): Promise<SpecCard[]> {
  const cards: SpecCard[] = [];
  for (const item of await walkSpecFiles(ports, path.join(store, 'specs'), root, diagnostics)) {
    const locator = item.parts.join('/');
    try {
      const content = await ports.readFile(item.file);
      const parsed = parseGovernedSpec(content);
      const structural = parsed.issues.map((issue) => issue.message).join('; ');
      if (structural) {
        diagnostics.push({ source: path.relative(root, item.file), message: structural });
      }
      if (parsed.id) {
        cards.push({ kind: 'spec', id: parsed.id, locator, title: locator, requirementCount: parsed.requirements.length, requirements: parsed.requirements.map((r) => r.title), diagnostic: structural || null });
      } else {
        // A readable but unparseable specification remains visible at zero weight.
        const legacyId = locator.replaceAll('/', '.');
        cards.push({ kind: 'spec', id: legacyId, locator, title: locator, requirementCount: 0, requirements: [], diagnostic: structural || 'Specification could not be parsed as a governed spec' });
      }
    } catch (error) {
      diagnostics.push({ source: path.relative(root, item.file), message: error instanceof Error ? error.message : String(error) });
    }
  }
  return cards.sort((a, b) => b.requirementCount - a.requirementCount || a.locator.localeCompare(b.locator));
}

export async function deriveViewBoard(root = '.', ports: ViewModelPorts = defaultPorts): Promise<ViewBoardModel> {
  const store = planningDir(root);
  try {
    await ports.readDir(store);
  } catch {
    throw new Error(`No specbase directory found under ${path.resolve(root)}. Run 'specbase init' first.`);
  }
  const diagnostics: ViewDiagnostic[] = [];
  const [ideas, changes, archives, specs] = await Promise.all([
    collectIdeas(root, store, ports, diagnostics),
    collectChanges(root, store, ports, diagnostics),
    collectArchives(root, store, ports, diagnostics),
    collectSpecs(root, store, ports, diagnostics),
  ]);
  // Distribute every change card into the lane for its derived lifecycle state.
  // `changes` is already sorted by progress then immutable ID; distributing a
  // sorted list preserves that per-lane ordering (progress then ID) for each lane.
  const changeLanes: Record<Exclude<LifecycleState, 'archived'>, ChangeCard[]> = {
    proposed: [],
    enforcement: [],
    'ready-to-apply': [],
    implementing: [],
    reviewing: [],
  };
  for (const card of changes) {
    if (card.lifecycle !== 'archived') changeLanes[card.lifecycle].push(card);
  }
  const lanes: ViewBoardModel['lanes'] = { ideas, ...changeLanes, archived: archives };
  const completedTasks = changes.reduce((sum, card) => sum + card.tasks.completed, 0);
  const totalTasks = changes.reduce((sum, card) => sum + card.tasks.total, 0);
  diagnostics.sort((a, b) => a.source.localeCompare(b.source) || a.message.localeCompare(b.message));
  const resolvedRoot = path.resolve(root);
  return {
    version: VIEW_BOARD_VERSION,
    project: { name: path.basename(resolvedRoot) || resolvedRoot },
    summary: {
      acceptedSpecs: specs.length,
      requirements: specs.reduce((sum, spec) => sum + spec.requirementCount, 0),
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
    specs,
    diagnostics,
  };
}
