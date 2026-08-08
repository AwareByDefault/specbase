import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { runCLI } from '../helpers/run-cli.js';
import { createSpecbaseRoot } from '../helpers/specbase-fixtures.js';

function tempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specbase-graduation-'));
}

async function addIdea(
  root: string,
  title: string
): Promise<{ id: string }> {
  const result = await runCLI(['ideas', 'add', '--title', title, '--json'], {
    cwd: root,
    env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
  });
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout);
}

describe('idea graduation by move (behavior.workflow.idea-graduation)', () => {
  it('moves the idea into a change with scaffolded artifacts and a carried id', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const { id } = await addIdea(root, 'dark mode');
    const ideaPath = path.join(root, 'specbase', 'ideas', id);
    // Seed the scratchpad so we can prove preservation.
    fs.writeFileSync(path.join(ideaPath, 'notes.md'), '# dark mode\nfindings here\n');
    fs.writeFileSync(path.join(ideaPath, 'sketch.png'), 'png');

    const result = await runCLI(['new', 'change', '--from-idea', id, '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);

    // The idea directory is gone from ideas/.
    expect(fs.existsSync(ideaPath)).toBe(false);

    // The change directory exists with all scaffolded artifacts.
    const changePath = path.join(root, 'specbase', 'changes', id);
    expect(fs.existsSync(changePath)).toBe(true);
    for (const artifact of ['proposal.md', 'tasks.md', 'design.md']) {
      expect(fs.existsSync(path.join(changePath, artifact)), artifact).toBe(true);
    }
    expect(fs.statSync(path.join(changePath, 'specs')).isDirectory()).toBe(true);

    // Scratchpad preserved alongside the artifacts.
    expect(fs.readFileSync(path.join(changePath, 'notes.md'), 'utf-8')).toContain('findings here');
    expect(fs.existsSync(path.join(changePath, 'sketch.png'))).toBe(true);

    // The id is carried forward unchanged.
    const meta = fs.readFileSync(path.join(changePath, '.openspec.yaml'), 'utf-8');
    expect(meta).toContain(`id: ${id}`);
  });

  it('still works when an explicit name matches the idea id', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const { id } = await addIdea(root, 'keyboard shortcuts');
    const result = await runCLI(['new', 'change', id, '--from-idea', id, '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).change.id).toBe(id);
    expect(fs.existsSync(path.join(root, 'specbase', 'changes', id, 'proposal.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'specbase', 'ideas', id))).toBe(false);
  });

  it('creates a fresh change when no idea is in context', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const result = await runCLI(['new', 'change', 'fresh-feature', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);
    const changePath = path.join(root, 'specbase', 'changes', 'fresh-feature');
    expect(fs.existsSync(changePath)).toBe(true);
    expect(fs.readdirSync(changePath).length).toBeGreaterThan(0);
  });

  it('rejects a graduation from an unknown idea', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const result = await runCLI(['new', 'change', '--from-idea', 'ghost-1234abcd', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).not.toBe(0);
    expect(JSON.parse(result.stdout).status[0].severity).toBe('error');
  });
});

describe('no graduate verb exists (behavior.workflow.idea-graduation)', () => {
  it('the ideas command exposes only add/list/show/delete', async () => {
    const root = tempRoot();
    createSpecbaseRoot(root);
    const result = await runCLI(['ideas'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout + result.stderr).not.toMatch(/graduate/i);
  });
});