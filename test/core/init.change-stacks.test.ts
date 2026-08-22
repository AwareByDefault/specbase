import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { InitCommand } from '../../src/core/init.js';
import { loadGovernedRepository } from '../../src/core/governed/index.js';

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map((entry) => fs.rm(entry, { recursive: true, force: true }))));

describe('stack planning layout', () => {
  it('plants stacks/ beside ideas/, changes/, and specs/', async () => {
    const project = await fs.mkdtemp(path.join(os.tmpdir(), 'stack-init-'));
    roots.push(project);
    await new InitCommand({ tools: 'none', force: true, interactive: false }).execute(project);
    for (const region of ['ideas', 'stacks', 'changes', 'specs']) {
      expect((await fs.stat(path.join(project, 'specbase', region))).isDirectory()).toBe(true);
    }
  });

  it('keeps a young root without stacks readable and excludes stack content from governed discovery', async () => {
    const project = await fs.mkdtemp(path.join(os.tmpdir(), 'stack-young-root-'));
    roots.push(project);
    const planning = path.join(project, 'specbase');
    await fs.mkdir(path.join(planning, 'specs'), { recursive: true });
    await fs.mkdir(path.join(planning, 'changes', 'archive'), { recursive: true });
    await fs.writeFile(path.join(planning, 'config.yaml'), 'schema: spec-driven-governed\n');
    expect((await loadGovernedRepository(planning)).discovery.pairs).toEqual([]);

    await fs.mkdir(path.join(planning, 'stacks', 'delivery'), { recursive: true });
    await fs.writeFile(path.join(planning, 'stacks', 'delivery', 'spec.md'), '# scratchpad, not truth\n');
    expect((await loadGovernedRepository(planning)).discovery.pairs).toEqual([]);
  });
});
