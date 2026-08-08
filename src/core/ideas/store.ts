/**
 * The idea catalogue store: CRUD over `ideas/` scratchpad directories.
 *
 * All paths are built with `path.join` (cross-platform). The ideas home is a
 * direct child of the planning directory: `<planningDir>/ideas/`. The store
 * creates it lazily on first add, and `init` also scaffolds an empty one.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { planningDir } from '../planning-dir.js';
import { generateIdeaId, idFromArchiveDirName } from './id.js';
import type { Idea, IdeaMetadata } from './model.js';

export const IDEAS_DIRNAME = 'ideas';
export const IDEA_METADATA_FILENAME = '.openspec.yaml';
export const IDEA_NOTES_FILENAME = 'notes.md';

export class IdeaNotFoundError extends Error {
  constructor(
    message: string,
    public readonly ideaId: string
  ) {
    super(message);
    this.name = 'IdeaNotFoundError';
  }
}

/** Absolute path of the ideas home for a project root. */
export function ideasHome(root: string): string {
  return path.join(planningDir(root), IDEAS_DIRNAME);
}

export function ideaDir(root: string, id: string): string {
  return path.join(ideasHome(root), id);
}

function ideaMetadataPath(root: string, id: string): string {
  return path.join(ideaDir(root, id), IDEA_METADATA_FILENAME);
}

async function directoryExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

async function readIdeaMetadata(root: string, id: string, dir: string): Promise<IdeaMetadata> {
  const metaPath = path.join(dir, IDEA_METADATA_FILENAME);
  let content: string;
  try {
    content = await fs.readFile(metaPath, 'utf-8');
  } catch {
    throw new IdeaNotFoundError(`Idea '${id}' has no metadata file, or the directory is not an idea`, id);
  }
  let parsed: unknown;
  try {
    parsed = yaml.parse(content);
  } catch {
    throw new IdeaNotFoundError(`Invalid YAML in idea metadata: ${metaPath}`, id);
  }
  const meta = parsed as Partial<IdeaMetadata>;
  if (!meta || typeof meta.id !== 'string' || typeof meta.summary !== 'string' || typeof meta.created !== 'string') {
    throw new IdeaNotFoundError(`Idea metadata at ${metaPath} is missing id/summary/created`, id);
  }
  return { id: meta.id, summary: meta.summary, created: meta.created };
}

async function listDirectoryMembers(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name !== IDEA_METADATA_FILENAME)
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/**
 * Create a new idea directory under `<planningDir>/ideas/`. Generates the
 * `<slug>-<short-uuid>` id from the title, writes `.openspec.yaml`
 * `{id, summary, created}`, and seeds `notes.md` with the optional note.
 * Creates the ideas home lazily when it does not yet exist.
 */
export async function createIdea(
  root: string,
  input: { title: string; note?: string }
): Promise<Idea> {
  const home = ideasHome(root);
  await fs.mkdir(home, { recursive: true });

  const id = generateIdeaId(input.title);
  const dir = path.join(home, id);
  await fs.mkdir(dir, { recursive: true });

  const metadata: IdeaMetadata = {
    id,
    summary: input.title.trim(),
    created: todayIso(),
  };
  await fs.writeFile(path.join(dir, IDEA_METADATA_FILENAME), yaml.stringify(metadata), 'utf-8');

  const noteBody = input.note?.trim() ? `${input.note.trim()}\n` : '';
  await fs.writeFile(path.join(dir, IDEA_NOTES_FILENAME), noteBody, 'utf-8');

  return {
    ...metadata,
    dir,
    members: input.note?.trim() ? [IDEA_NOTES_FILENAME] : [IDEA_NOTES_FILENAME],
  };
}

/**
 * List ideas. By default lists open ideas (everything currently under
 * `ideas/`), ordered oldest-first by `created`. `all` is accepted and, for
 * now, returns the same set — graduated ideas leave `ideas/` on propose, so
 * every directory under `ideas/` is an open idea.
 */
export async function listIdeas(root: string, _options: { all?: boolean } = {}): Promise<Idea[]> {
  const home = ideasHome(root);
  let entries;
  try {
    entries = await fs.readdir(home, { withFileTypes: true });
  } catch {
    return [];
  }

  const ideas: Idea[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const dir = path.join(home, entry.name);
    const meta = await readIdeaMetadata(root, entry.name, dir);
    const members = await listDirectoryMembers(dir);
    ideas.push({ id: meta.id, summary: meta.summary, created: meta.created, dir, members });
  }

  return ideas.sort((a, b) => a.created.localeCompare(b.created));
}

/**
 * Resolve an idea directory by id. Matching is tolerant: the exact id field
 * wins, then an exact directory-name match, then a prefix (a slug-only
 * reference) match against the directory names.
 */
export async function resolveIdeaDir(root: string, id: string): Promise<{ dir: string; id: string }> {
  const home = ideasHome(root);
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(home, { withFileTypes: true });
  } catch {
    throw new IdeaNotFoundError(`Idea '${id}' not found`, id);
  }

  const dirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);

  // 1. Exact directory-name match.
  if (dirs.includes(id)) {
    return { dir: path.join(home, id), id };
  }

  // 2. Metadata id match (id field is the source of truth).
  for (const name of dirs) {
    const dir = path.join(home, name);
    try {
      const meta = await readIdeaMetadata(root, name, dir);
      if (meta.id === id) {
        return { dir, id: meta.id };
      }
    } catch {
      // ignore unreadable entries
    }
  }

  // 3. Slug-only prefix match (`dark-mode` → `dark-mode-<uuid>`).
  const prefixMatches = dirs.filter((name) => name.startsWith(`${id}-`));
  if (prefixMatches.length === 1) {
    return { dir: path.join(home, prefixMatches[0]), id: prefixMatches[0] };
  }
  if (prefixMatches.length > 1) {
    throw new IdeaNotFoundError(`Idea '${id}' is ambiguous: multiple ideas start with it`, id);
  }

  throw new IdeaNotFoundError(`Idea '${id}' not found under ideas/. It may have been proposed into a change (moved to changes/).`, id);
}

/**
 * Read a single idea by id. Returns the record with its members list.
 */
export async function showIdea(root: string, id: string): Promise<Idea> {
  const resolved = await resolveIdeaDir(root, id);
  const meta = await readIdeaMetadata(root, resolved.id, resolved.dir);
  const members = await listDirectoryMembers(resolved.dir);
  return { id: meta.id, summary: meta.summary, created: meta.created, dir: resolved.dir, members };
}

/**
 * Delete an open idea's scratchpad directory. Only works for ideas still
 * under `ideas/` — an idea already proposed lives under `changes/` and is
 * not deletable as an idea.
 */
export async function deleteIdea(root: string, id: string): Promise<{ id: string; removed: boolean }> {
  const home = ideasHome(root);
  try {
    const entries = await fs.readdir(home, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);
    if (!dirs.includes(id)) {
      // Check whether it may have graduated into a change.
      throw new IdeaNotFoundError(
        `Idea '${id}' is not open. It may have been proposed into a change (check specbase/changes/${id}).`,
        id
      );
    }
    await fs.rm(path.join(home, id), { recursive: true, force: true });
    return { id, removed: true };
  } catch (error) {
    if (error instanceof IdeaNotFoundError) throw error;
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new IdeaNotFoundError(
        `Idea '${id}' is not open. It may have been proposed into a change (check specbase/changes/).`,
        id
      );
    }
    throw error;
  }
}

/**
 * Backfill helper (best-effort, idempotent): derive an object id from an
 * archive directory name (strip the leading YYYY-MM-DD-) and, when that
 * archive's `.openspec.yaml` lacks an `id` field, write the derived id in.
 * Never overwrites an existing id.
 */
export async function backfillArchiveId(
  archiveDir: string
): Promise<{ id: string; changed: boolean } | null> {
  const dirName = path.basename(archiveDir);
  const metaPath = path.join(archiveDir, IDEA_METADATA_FILENAME);
  let content: string;
  try {
    content = await fs.readFile(metaPath, 'utf-8');
  } catch {
    return null; // no metadata file (or not a change dir): skip
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = yaml.parse(content) ?? {};
  } catch {
    return null; // malformed: skip, best-effort
  }
  if (typeof parsed.id === 'string' && parsed.id.length > 0) {
    return { id: parsed.id, changed: false }; // already backfilled
  }
  const derivedId = idFromArchiveDirName(dirName);
  parsed.id = derivedId;
  await fs.writeFile(metaPath, yaml.stringify(parsed), 'utf-8');
  return { id: derivedId, changed: true };
}