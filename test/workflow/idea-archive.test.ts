import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { carryIdeaNotesIntoArchive } from '../../src/core/work-item-lifecycle.js';

/**
 * Behavior: when an idea-grown change is archived, the idea's preserved
 * thinking (notes.md + scratchpad) travels into the archived change
 * directory. By-move graduation already carries the idea into the change, so
 * the carry is a no-op when the scratchpad is already present; the by-id
 * case copies an idea's members from `ideas/<id>/` so no reasoning is
 * orphaned.
 */

let tempDir: string;
let ideasDir: string;
let archivedDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-idea-archive-'));
  ideasDir = path.join(tempDir, 'ideas');
  archivedDir = path.join(tempDir, 'changes', 'archive', '2026-08-19-idea-grown-change');
  await fs.mkdir(ideasDir, { recursive: true });
  await fs.mkdir(archivedDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('carryIdeaNotesIntoArchive', () => {
  it('carries an idea-grew-by-id scratchpad notes.md and members into the archived change, skipping metadata', async () => {
    const ideaId = 'dark-mode-x7k29f3a';
    const ideaDir = path.join(ideasDir, ideaId);
    await fs.mkdir(ideaDir, { recursive: true });
    await fs.writeFile(path.join(ideaDir, 'notes.md'), '# dark mode thinking\n');
    await fs.writeFile(path.join(ideaDir, 'scratch.txt'), 'extra\n');
    await fs.writeFile(path.join(ideaDir, '.openspec.yaml'), 'id: dark-mode-x7k29f3a\n');

    const carried = carryIdeaNotesIntoArchive({
      archivedChangeDir: archivedDir,
      ideasDir,
      ideaId,
    });

    expect(carried.sort()).toEqual(['notes.md', 'scratch.txt']);
    expect(await fs.readFile(path.join(archivedDir, 'notes.md'), 'utf8')).toBe(
      '# dark mode thinking\n'
    );
    expect(await fs.readFile(path.join(archivedDir, 'scratch.txt'), 'utf8')).toBe('extra\n');
    // metadata does not travel as a scratchpad member
    expect(
      await fs
        .access(path.join(archivedDir, '.openspec.yaml'))
        .then(() => true)
        .catch(() => false)
    ).toBe(false);
  });

  it('does not overwrite a member already present (by-move graduation is a no-op)', async () => {
    const ideaId = 'kanban-22a1';
    const ideaDir = path.join(ideasDir, ideaId);
    await fs.mkdir(ideaDir, { recursive: true });
    await fs.writeFile(path.join(ideaDir, 'notes.md'), 'idea-version\n');
    await fs.writeFile(path.join(archivedDir, 'notes.md'), 'change-version\n');

    const carried = carryIdeaNotesIntoArchive({
      archivedChangeDir: archivedDir,
      ideasDir,
      ideaId,
    });

    expect(carried).toEqual([]);
    expect(await fs.readFile(path.join(archivedDir, 'notes.md'), 'utf8')).toBe(
      'change-version\n'
    );
  });

  it('no-ops when no idea is linked or the idea directory is absent', async () => {
    expect(
      carryIdeaNotesIntoArchive({ archivedChangeDir: archivedDir, ideasDir })
    ).toEqual([]);
    expect(
      carryIdeaNotesIntoArchive({
        archivedChangeDir: archivedDir,
        ideasDir,
        ideaId: 'does-not-exist-111',
      })
    ).toEqual([]);
  });
});