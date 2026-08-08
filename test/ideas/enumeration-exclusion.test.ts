import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { createIdea } from '../../src/core/ideas/store.js';
import { createSpecbaseRoot } from '../helpers/specbase-fixtures.js';
import { runCLI } from '../helpers/run-cli.js';

function tempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specbase-ideas-exclude-'));
}

function makeGovernedStore(root: string): string {
  // A governed store shape with an idea directory present.
  createSpecbaseRoot(root);
  fs.writeFileSync(path.join(root, 'specbase', 'config.yaml'), 'schema: spec-driven-governed\n');
  fs.mkdirSync(path.join(root, 'specbase', 'specs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'specbase', 'changes'), { recursive: true });
  fs.mkdirSync(path.join(root, 'specbase', 'changes', 'archive'), { recursive: true });
  void createIdea(root, { title: 'untouched idea', note: 'must never appear in governed output' });
  return root;
}

describe('ideas excluded from governed enumeration (architecture.ideas)', () => {
  it('list --specs omits idea content', async () => {
    const root = tempRoot();
    const storeRoot = makeGovernedStore(root);
    const result = await runCLI(['list', '--specs', '--json'], { cwd: storeRoot, env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' } });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('ideas/');
    expect(result.stdout).not.toContain('untouched idea');
  });

  it('coverage omits idea content', async () => {
    const root = tempRoot();
    const storeRoot = makeGovernedStore(root);
    const result = await runCLI(['coverage', '--json'], { cwd: storeRoot, env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' } });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('ideas/');
    expect(result.stdout).not.toContain('untouched idea');
  });

  it('validate --specs omits idea content', async () => {
    const root = tempRoot();
    const storeRoot = makeGovernedStore(root);
    const result = await runCLI(['validate', '--specs', '--json'], { cwd: storeRoot, env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' } });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('ideas/');
    expect(result.stdout).not.toContain('untouched idea');
  });

  it('an idea is not reported as a change (list default)', async () => {
    const root = tempRoot();
    const storeRoot = makeGovernedStore(root);
    const result = await runCLI(['list', '--json'], { cwd: storeRoot, env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' } });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('untouched idea');
  });
});