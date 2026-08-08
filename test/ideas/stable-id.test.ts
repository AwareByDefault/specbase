import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { createIdea, showIdea, ideaDir } from '../../src/core/ideas/store.js';
import { generateIdeaId, idFromArchiveDirName, slugifyTitle } from '../../src/core/ideas/id.js';
import { createChange } from '../../src/utils/change-utils.js';

function tempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specbase-ideas-'));
}

function writeIdeaMetadata(dir: string, id: string, summary: string, created: string): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '.openspec.yaml'), `id: ${id}\nsummary: ${summary}\ncreated: ${created}\n`);
}

describe('idea id generation (D3)', () => {
  it('produces a kebab slug prefix and an 8-char short uuid suffix', () => {
    const id = generateIdeaId('Real-time collaboration');
    expect(id).toMatch(/^real-time-collaboration-[0-9a-f]{8}$/);
  });

  it('slugifies titles into change-compatible forms', () => {
    expect(slugifyTitle('dark mode')).toBe('dark-mode');
    expect(slugifyTitle('Real-time collaboration')).toBe('real-time-collaboration');
    expect(slugifyTitle('  Auth   Rewrite  ')).toBe('auth-rewrite');
    expect(slugifyTitle('!!!')).toBe('idea'); // fallback
  });

  it('idFromArchiveDirName strips a leading date prefix only', () => {
    expect(idFromArchiveDirName('2026-08-08-dark-mode-x7k29f3a')).toBe('dark-mode-x7k29f3a');
    expect(idFromArchiveDirName('dark-mode-x7k29f3a')).toBe('dark-mode-x7k29f3a');
    // A date-shaped prefix also in the body must not be double-stripped.
    expect(idFromArchiveDirName('2026-08-08-a-b-c')).toBe('a-b-c');
  });
});

describe('stable id across moves (architecture.ideas)', () => {
  it('carries the idea id forward into a proposed change', async () => {
    const root = tempRoot();
    const idea = await createIdea(root, { title: 'dark mode', note: 'toggle the palette' });
    const ideaDir = path.join(root, 'specbase', 'ideas', idea.id);

    // A proposed change from an idea: move the directory and carry the id.
    const changeDir = path.join(root, 'specbase', 'changes', idea.id);
    fs.mkdirSync(path.join(root, 'specbase', 'changes'), { recursive: true });
    fs.renameSync(ideaDir, changeDir);
    fs.writeFileSync(
      path.join(changeDir, '.openspec.yaml'),
      `schema: spec-driven-governed\ncreated: 2026-08-08\nid: ${idea.id}\n`
    );
    fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Test\n');

    const meta = fs.readFileSync(path.join(changeDir, '.openspec.yaml'), 'utf-8');
    expect(meta).toContain(`id: ${idea.id}`);
  });

  it('a change id survives the archive date-prefix rename', async () => {
    const root = tempRoot();
    const idea = await createIdea(root, { title: 'dark mode' });
    const changeDir = path.join(root, 'specbase', 'changes', idea.id);
    fs.mkdirSync(changeDir, { recursive: true });
    writeIdeaMetadata(changeDir, idea.id, 'dark mode', '2026-08-01');
    fs.writeFileSync(path.join(changeDir, 'proposal.md'), '');

    // Simulate archive: changes/<id>/ → changes/archive/<date>-<id>/
    const archiveRoot = path.join(root, 'specbase', 'changes', 'archive');
    fs.mkdirSync(archiveRoot, { recursive: true });
    fs.renameSync(changeDir, path.join(archiveRoot, `2026-08-08-${idea.id}`));

    const archivedMeta = fs.readFileSync(path.join(archiveRoot, `2026-08-08-${idea.id}`, '.openspec.yaml'), 'utf-8');
    expect(archivedMeta).toContain(`id: ${idea.id}`);
  });

  it('createChange writes a generated id by default', async () => {
    const root = tempRoot();
    const result = await createChange(root, 'add-something', {});
    const meta = fs.readFileSync(path.join(result.changeDir, '.openspec.yaml'), 'utf-8');
    expect(meta).toMatch(/id: add-something-[0-9a-f]{8}/);
    expect(meta).toContain('schema: spec-driven');
  });

  it('createChange honors a metadata id supplied by an idea move', async () => {
    const root = tempRoot();
    const idea = await createIdea(root, { title: 'dark mode' });
    const result = await createChange(root, idea.id, {
      metadata: { id: idea.id },
    });
    const meta = fs.readFileSync(path.join(result.changeDir, '.openspec.yaml'), 'utf-8');
    expect(meta).toContain(`id: ${idea.id}`);
  });

  it('showIdea matches by id and tolerates a slug-only reference', async () => {
    const root = tempRoot();
    const created = await createIdea(root, { title: 'dark mode' });
    const idea = await showIdea(root, 'dark-mode'); // slug-only prefix
    expect(idea.id).toBe(created.id);
    expect(idea.summary).toBe('dark mode');
    expect(idea.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(idea.members).toContain('notes.md');
  });
});