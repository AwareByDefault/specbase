import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { runCLI } from '../helpers/run-cli.js';
import { createSpecbaseRoot } from '../helpers/specbase-fixtures.js';

function tempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specbase-ideas-cli-'));
}

function ideasDir(root: string): string {
  return path.join(root, 'specbase', 'ideas');
}

async function addIdea(
  root: string,
  title: string,
  note?: string
): Promise<{ id: string; path: string; summary: string }> {
  const args = ['ideas', 'add', '--title', title, '--json'];
  if (note) args.push('--note', note);
  const result = await runCLI(args, { cwd: root, env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' } });
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout);
}

describe('ideas add', () => {
  it('creates a directory with id, summary, created, and notes.md seeded from --note', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const added = await addIdea(root, 'dark mode', 'toggle the palette');

    expect(added.id).toMatch(/^dark-mode-[0-9a-f]{8}$/);
    expect(added.summary).toBe('dark mode');
    expect(added.path).toContain(path.join('specbase', 'ideas'));

    const ideaPath = path.join(ideasDir(root), added.id);
    expect(fs.existsSync(path.join(ideaPath, '.openspec.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(ideaPath, 'notes.md'))).toBe(true);
    expect(fs.readFileSync(path.join(ideaPath, 'notes.md'), 'utf-8')).toContain('toggle the palette');
  });

  it('creates specbase/ideas/ lazily when it does not exist', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    expect(fs.existsSync(ideasDir(root))).toBe(false);
    await addIdea(root, 'new idea');
    expect(fs.existsSync(ideasDir(root))).toBe(true);
  });

  it('generates unique ids for the same title (uniqueness without a counter)', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const first = await addIdea(root, 'same title');
    const second = await addIdea(root, 'same title');
    expect(first.id).not.toBe(second.id);
    expect(first.id).toMatch(/^same-title-[0-9a-f]{8}$/);
  });
});

describe('ideas list', () => {
  it('lists ideas oldest-first with age', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    // Backdate one idea by editing its metadata after creation so ordering
    // is provable by created dates.
    const older = await addIdea(root, 'older idea');
    const olderMeta = path.join(ideasDir(root), older.id, '.openspec.yaml');
    fs.writeFileSync(olderMeta, `id: ${older.id}\nsummary: older idea\ncreated: 2000-01-01\n`, 'utf-8');

    const newer = await addIdea(root, 'newer idea');
    expect(newer).toBeDefined();

    const result = await runCLI(['ideas', 'list', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);
    const rows = JSON.parse(result.stdout);
    expect(rows.length).toBe(2);
    expect(rows[0].id).toBe(older.id); // oldest first
    expect(rows[0]).toHaveProperty('summary');
    expect(rows[0]).toHaveProperty('created');
    expect(rows[0]).toHaveProperty('age');
    expect(rows[0].age).toMatch(/^\d+d ago$|^today$/);
  });

  it('empty catalogue prints no rows', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const result = await runCLI(['ideas', 'list', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual([]);
  });
});

describe('ideas show', () => {
  it('prints metadata, member files, and notes', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const { id } = await addIdea(root, 'show me', 'the note body');
    // Add a second member file (sketch)
    fs.writeFileSync(path.join(ideasDir(root), id, 'sketch.png'), '');

    const result = await runCLI(['ideas', 'show', id, '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.id).toBe(id);
    expect(parsed.summary).toBe('show me');
    expect(parsed.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parsed.notes).toContain('the note body');
    expect(parsed.members).toContain('notes.md');
    expect(parsed.members).toContain('sketch.png');
  });

  it('resolves a slug-only prefix', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const { id } = await addIdea(root, 'dark mode');
    const result = await runCLI(['ideas', 'show', 'dark-mode', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).id).toBe(id);
  });

  it('fails cleanly for an unknown idea', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const result = await runCLI(['ideas', 'show', 'does-not-exist-1234abcd', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).not.toBe(0);
    expect(JSON.parse(result.stdout).status[0].severity).toBe('error');
  });
});

describe('ideas delete', () => {
  it('removes an open idea', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const { id } = await addIdea(root, 'junk idea');
    const result = await runCLI(['ideas', 'delete', id, '--yes', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).deleted.id).toBe(id);
    expect(fs.existsSync(path.join(ideasDir(root), id))).toBe(false);
  });

  it('refuses to delete an idea that is no longer open', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const { id } = await addIdea(root, 'already proposed');
    // Simulate graduation: move the idea into changes/.
    fs.mkdirSync(path.join(root, 'specbase', 'changes'), { recursive: true });
    fs.renameSync(path.join(ideasDir(root), id), path.join(root, 'specbase', 'changes', id));

    const result = await runCLI(['ideas', 'delete', id, '--yes', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).not.toBe(0);
    expect(JSON.parse(result.stdout).status[0].severity).toBe('error');
    // The change directory is untouched.
    expect(fs.existsSync(path.join(root, 'specbase', 'changes', id, 'notes.md'))).toBe(true);
  });
});