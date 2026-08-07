import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  DEFAULT_SPECBASE_SCHEMA,
  ensureSpecbaseRoot,
  inspectSpecbaseRoot,
  rollbackCreatedPaths,
} from '../../src/core/index.js';

describe('Specbase root helper', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-root-helper-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createHealthyRoot(root: string, configName = 'config.yaml'): void {
    fs.mkdirSync(path.join(root, 'specbase', 'specs'), { recursive: true });
    fs.mkdirSync(path.join(root, 'specbase', 'changes', 'archive'), { recursive: true });
    fs.writeFileSync(path.join(root, 'specbase', configName), `schema: ${DEFAULT_SPECBASE_SCHEMA}\n`);
  }

  it('inspects a healthy root with config.yaml', async () => {
    const root = path.join(tempDir, 'store');
    createHealthyRoot(root);

    await expect(inspectSpecbaseRoot(root)).resolves.toEqual(expect.objectContaining({
      healthy: true,
      present: true,
      config: {
        present: true,
        path: 'specbase/config.yaml',
      },
      diagnostics: [],
    }));
  });

  it('inspects a healthy root with config.yml', async () => {
    const root = path.join(tempDir, 'store');
    createHealthyRoot(root, 'config.yml');

    await expect(inspectSpecbaseRoot(root)).resolves.toEqual(expect.objectContaining({
      healthy: true,
      config: {
        present: true,
        path: 'specbase/config.yml',
      },
    }));
  });

  it('reports missing root pieces without mutating files', async () => {
    const root = path.join(tempDir, 'store');
    fs.mkdirSync(path.join(root, 'specbase', 'changes'), { recursive: true });

    const inspection = await inspectSpecbaseRoot(root);

    expect(inspection.healthy).toBe(false);
    expect(inspection.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'specbase_config_missing',
    ]);
    expect(fs.existsSync(path.join(root, 'specbase', 'changes', 'archive'))).toBe(false);
  });

  it('accepts roots before changes, applied specs, or archives exist', async () => {
    const root = path.join(tempDir, 'store');
    fs.mkdirSync(path.join(root, 'specbase'), { recursive: true });
    fs.writeFileSync(path.join(root, 'specbase', 'config.yaml'), `schema: ${DEFAULT_SPECBASE_SCHEMA}\n`);

    const inspection = await inspectSpecbaseRoot(root);

    expect(inspection).toEqual(expect.objectContaining({
      healthy: true,
      specs: { present: false },
      changes: { present: false },
      archive: { present: false },
      diagnostics: [],
    }));
  });

  it('reports malformed optional planning paths without throwing', async () => {
    const root = path.join(tempDir, 'store');
    fs.mkdirSync(path.join(root, 'specbase'), { recursive: true });
    fs.writeFileSync(path.join(root, 'specbase', 'config.yaml'), `schema: ${DEFAULT_SPECBASE_SCHEMA}\n`);
    fs.writeFileSync(path.join(root, 'specbase', 'changes'), 'not a directory\n');

    const inspection = await inspectSpecbaseRoot(root);

    expect(inspection.healthy).toBe(false);
    expect(inspection.changes).toEqual({ present: false });
    expect(inspection.archive).toEqual({ present: false });
    expect(inspection.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'specbase_changes_not_directory',
    ]);
  });

  it('ensures the default root shape and records created paths', async () => {
    const root = path.join(tempDir, 'store');

    const result = await ensureSpecbaseRoot(root);

    expect(result.createdArtifacts).toEqual([
      'specbase/',
      'specbase/specs/',
      'specbase/changes/',
      'specbase/changes/archive/',
      'specbase/config.yaml',
    ]);
    expect(result.inspection.healthy).toBe(true);
    expect(fs.readFileSync(path.join(root, 'specbase', 'config.yaml'), 'utf-8')).toContain(
      `schema: ${DEFAULT_SPECBASE_SCHEMA}`
    );
  });

  it('preserves existing config and user files', async () => {
    const root = path.join(tempDir, 'store');
    createHealthyRoot(root, 'config.yml');
    fs.writeFileSync(path.join(root, 'specbase', 'specs', 'note.md'), 'keep me\n');

    const result = await ensureSpecbaseRoot(root);

    expect(result.createdArtifacts).toEqual([]);
    expect(fs.existsSync(path.join(root, 'specbase', 'config.yaml'))).toBe(false);
    expect(fs.readFileSync(path.join(root, 'specbase', 'config.yml'), 'utf-8')).toBe(
      `schema: ${DEFAULT_SPECBASE_SCHEMA}\n`
    );
    expect(fs.readFileSync(path.join(root, 'specbase', 'specs', 'note.md'), 'utf-8')).toBe(
      'keep me\n'
    );
  });

  it('rolls back only ledger-created files and empty directories', async () => {
    const root = path.join(tempDir, 'store');
    const result = await ensureSpecbaseRoot(root);
    fs.writeFileSync(path.join(root, 'user.md'), 'mine\n');

    await rollbackCreatedPaths(result.createdPaths);

    expect(fs.existsSync(path.join(root, 'specbase'))).toBe(false);
    expect(fs.readFileSync(path.join(root, 'user.md'), 'utf-8')).toBe('mine\n');
  });
});
