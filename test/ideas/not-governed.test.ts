import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { createIdea } from '../../src/core/ideas/store.js';
import { createSpecbaseRoot } from '../helpers/specbase-fixtures.js';
import { runCLI } from '../helpers/run-cli.js';

function tempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specbase-not-governed-'));
}

function makeGovernedStore(root: string): string {
  createSpecbaseRoot(root);
  fs.writeFileSync(path.join(root, 'specbase', 'config.yaml'), 'schema: spec-driven-governed\n');
  return root;
}

describe('ideas are not governed truth (behavior.ideas: ideas-not-governed)', () => {
  it('an idea carries no spec.md or enforcement.md pair', async () => {
    const root = tempRoot();
    makeGovernedStore(root);
    const { id } = JSON.parse(
      (
        await runCLI(['ideas', 'add', '--title', 'never governed', '--json'], {
          cwd: root,
          env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
        })
      ).stdout
    );
    const ideaDir = path.join(root, 'specbase', 'ideas', id);
    expect(fs.existsSync(path.join(ideaDir, 'spec.md'))).toBe(false);
    expect(fs.existsSync(path.join(ideaDir, 'enforcement.md'))).toBe(false);
  });

  it('no governed surface reports idea content as spec or change truth', async () => {
    const root = tempRoot();
    makeGovernedStore(root);
    await createIdea(root, { title: 'untouched idea', note: 'scratchpad text that must stay private' });

    for (const args of [
      ['validate', '--specs'],
      ['coverage', '--json'],
      ['list', '--specs', '--json'],
    ]) {
      const result = await runCLI(args, {
        cwd: root,
        env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
      });
      expect(result.exitCode, args.join(' ')).toBe(0);
      expect(result.stdout, args.join(' ')).not.toContain('ideas/');
      expect(result.stdout, args.join(' ')).not.toContain('untouched idea');
      expect(result.stdout, args.join(' ')).not.toContain('scratch text');
    }
  });

  it('ideas are not listed as changes', async () => {
    const root = tempRoot();
    makeGovernedStore(root);
    await createIdea(root, { title: 'not a change' });
    const result = await runCLI(['list', '--json'], {
      cwd: root,
      env: { ...process.env, OPEN_SPEC_INTERACTIVE: '0' },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('not-a-change-');
  });
});