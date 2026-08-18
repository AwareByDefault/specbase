import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ViewCommand } from '../../src/core/view.js';
import { decodeViewModelFrame, bunVersionSupported } from '../../src/core/view/protocol.js';
import { discoverBun } from '../../src/core/view/launcher.js';
import type { ViewBoardModel } from '../../src/core/view/model.js';

const model: ViewBoardModel = {
  version: 1,
  summary: { acceptedSpecs: 0, requirements: 0, openIdeas: 1, activeChanges: 0, archivedChanges: 0, completedTasks: 0, totalTasks: 0 },
  columns: { ideas: [{ kind: 'idea', id: 'idea-1', title: 'Idea', created: '2025-01-01', members: [] }], changes: [], archives: [] },
  specs: [], diagnostics: [],
};

async function snapshot(dir: string): Promise<string[]> {
  const result: string[] = [];
  async function walk(current: string): Promise<void> {
    for (const entry of (await fs.readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(dir, absolute);
      if (entry.isDirectory()) await walk(absolute);
      else result.push(`${relative}:${await fs.readFile(absolute, 'utf8')}`);
    }
  }
  await walk(dir);
  return result;
}

describe('view command modes and protocol', () => {
  it('automatically selects plain for either non-TTY and never launches', async () => {
    for (const [stdinTTY, stdoutTTY] of [[false, true], [true, false]]) {
      let output = '';
      let launches = 0;
      const code = await new ViewCommand().execute('.', {
        stdinTTY, stdoutTTY, derive: async () => model,
        writeOut: (text) => { output += text; },
        launcher: async () => { launches++; return { code: 0 }; },
      });
      expect(code).toBe(0);
      expect(output).toContain('Specbase Lifecycle Board');
      expect(output).not.toMatch(/\u001b\[/);
      expect(launches).toBe(0);
    }
  });

  it('forces plain and gives JSON precedence over plain and interactive modes', async () => {
    let output = '';
    const command = new ViewCommand();
    await command.execute('.', { plain: true, stdinTTY: true, stdoutTTY: true, derive: async () => model, writeOut: (text) => { output += text; } });
    expect(output).toContain('Open Ideas');
    output = '';
    await command.execute('.', { plain: true, json: true, stdinTTY: true, stdoutTTY: true, derive: async () => model, writeOut: (text) => { output += text; } });
    expect(JSON.parse(output)).toEqual(model);
  });

  it('launches only for two TTYs and propagates the exact child status', async () => {
    let seen: ViewBoardModel | undefined;
    const code = await new ViewCommand().execute('.', {
      stdinTTY: true, stdoutTTY: true, derive: async () => model,
      launcher: async (value) => { seen = value; return { code: 143 }; },
    });
    expect(seen).toEqual(model);
    expect(code).toBe(143);
  });

  it('reports actionable missing and old Bun failures without renderer startup', () => {
    const missing = () => discoverBun('missing-bun', (() => ({ status: null, signal: null, output: [], pid: 0, stdout: '', stderr: '', error: new Error('ENOENT') })) as never);
    expect(missing).toThrow(/Bun >=1\.3.*--plain/);
    const old = () => discoverBun('bun', (() => ({ status: 0, signal: null, output: [], pid: 1, stdout: '1.2.9\n', stderr: '' })) as never);
    expect(old).toThrow(/found 1\.2\.9.*--plain/);
    expect(bunVersionSupported('1.3.0')).toBe(true);
    expect(bunVersionSupported('1.2.99')).toBe(false);
  });

  it('accepts exactly one EOF-delimited JSON model and rejects malformed, empty, version, and schema failures', () => {
    expect(decodeViewModelFrame(Buffer.from(JSON.stringify(model)))).toEqual(model);
    for (const invalid of [Buffer.alloc(0), Buffer.from('{'), Buffer.from(`${JSON.stringify(model)} trailing`), Buffer.from(JSON.stringify({ ...model, version: 2 })), Buffer.from(JSON.stringify({ version: 1 }))]) {
      expect(() => decodeViewModelFrame(invalid)).toThrow();
    }
    expect(() => decodeViewModelFrame(Uint8Array.from([0xff]))).toThrow(/UTF-8/);
  });

  it('is read-only for every output and injected interactive navigation path', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-view-readonly-'));
    try {
      await fs.mkdir(path.join(root, 'specbase', 'ideas', 'one'), { recursive: true });
      await fs.writeFile(path.join(root, 'specbase', 'ideas', 'one', '.openspec.yaml'), 'id: one-id\nsummary: One\ncreated: 2025-01-01\n');
      const before = await snapshot(root);
      await new ViewCommand().execute(root, { plain: true, writeOut: () => {} });
      await new ViewCommand().execute(root, { json: true, writeOut: () => {} });
      await new ViewCommand().execute(root, { stdinTTY: true, stdoutTTY: true, launcher: async () => ({ code: 0 }) });
      expect(await snapshot(root)).toEqual(before);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('renders complete plain projection with every section, ordering, IDs, progress, warnings, and parity with JSON', async () => {
    const rich: ViewBoardModel = {
      version: 1,
      summary: { acceptedSpecs: 2, requirements: 3, openIdeas: 1, activeChanges: 2, archivedChanges: 1, completedTasks: 3, totalTasks: 10 },
      columns: {
        ideas: [{ kind: 'idea', id: 'idea-a', title: 'Alpha idea', created: '2025-01-01', members: ['notes.md'] }],
        changes: [
          { kind: 'change', id: 'change-low', title: 'Low progress', created: '2025-01-15', artifacts: { completed: 1, total: 3 }, tasks: { completed: 1, total: 10 } },
          { kind: 'change', id: 'change-high', title: 'High progress', created: '2025-01-10', artifacts: { completed: 3, total: 3 }, tasks: { completed: 2, total: 10 } },
        ],
        archives: [{ kind: 'archive', id: 'archive-old', title: 'Old archive', archived: '2025-01-03', tasks: { completed: 5, total: 5 } }],
      },
      specs: [
        { kind: 'spec', id: 'behavior.sample', locator: 'behavior/sample', title: 'behavior/sample', requirementCount: 2, requirements: ['First', 'Second'], diagnostic: 'parse warning' },
        { kind: 'spec', id: 'behavior.unparseable', locator: 'behavior/unparseable', title: 'behavior/unparseable', requirementCount: 0, requirements: [], diagnostic: 'expected frontmatter' },
      ],
      diagnostics: [{ source: 'ideas/bad', message: 'missing .openspec.yaml' }],
    };
    let output = '';
    const code = await new ViewCommand().execute('.', { plain: true, derive: async () => rich, writeOut: (text) => { output += text; } });
    expect(code).toBe(0);
    expect(output).toContain('Specbase Lifecycle Board');
    expect(output).toContain('○ Alpha idea [idea-a]');
    expect(output).toContain('◉ Low progress [change-low]');
    expect(output).toContain('◉ High progress [change-high]');
    expect(output).toContain('✓ Old archive [archive-old]');
    expect(output).toContain('behavior/sample');
    expect(output).toContain('behavior/unparseable');
    expect(output).toContain('⚠');
    expect(output).toContain('Diagnostics');
    expect(output).toContain('missing .openspec.yaml');
    expect(output).toContain('Viewer only');
    expect(output).not.toMatch(/\u001b\[/);
    const json = JSON.parse(await new ViewCommand().execute('.', { plain: true, json: true, derive: async () => rich, writeOut: (text) => { output = text; } }).then(() => output));
    expect(json.summary).toEqual(rich.summary);
    expect(json.columns.ideas.length).toBe(rich.columns.ideas.length);
    expect(json.columns.changes.length).toBe(rich.columns.changes.length);
    expect(json.columns.archives.length).toBe(rich.columns.archives.length);
    expect(json.specs.length).toBe(rich.specs.length);
    expect(json.diagnostics.length).toBe(rich.diagnostics.length);
  });

  it('exercises keyboard interaction against a real project and remains read-only', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-view-interactive-'));
    try {
      await fs.mkdir(path.join(root, 'specbase', 'ideas', 'idea-one'), { recursive: true });
      await fs.writeFile(path.join(root, 'specbase', 'ideas', 'idea-one', '.openspec.yaml'), 'id: idea-one\nsummary: First idea\ncreated: 2025-01-01\n');
      await fs.mkdir(path.join(root, 'specbase', 'changes', 'change-a'), { recursive: true });
      await fs.writeFile(path.join(root, 'specbase', 'changes', 'change-a', '.openspec.yaml'), 'schema: missing\nid: change-a\n');
      await fs.mkdir(path.join(root, 'specbase', 'specs', 'behavior', 'test'), { recursive: true });
      await fs.writeFile(path.join(root, 'specbase', 'specs', 'behavior', 'test', 'spec.md'), '---\nid: behavior.test\n---\n### Requirement: One\n**ID:** one\nText.\n');
      // Construct a model that has items to select and scroll
      const interactiveModel: ViewBoardModel = {
        version: 1,
        summary: { acceptedSpecs: 1, requirements: 1, openIdeas: 1, activeChanges: 1, archivedChanges: 0, completedTasks: 0, totalTasks: 0 },
        columns: {
          ideas: [{ kind: 'idea', id: 'idea-one', title: 'First idea', created: '2025-01-01', members: [] }],
          changes: [{ kind: 'change', id: 'change-a', title: 'Change A', created: null, artifacts: { completed: 0, total: 3 }, tasks: { completed: 0, total: 0 } }],
          archives: [],
        },
        specs: [{ kind: 'spec', id: 'behavior.test', locator: 'behavior/test', title: 'behavior/test', requirementCount: 1, requirements: ['One'], diagnostic: null }],
        diagnostics: [],
      };
      let interactions = 0;
      let lastModel: ViewBoardModel | undefined;
      const before = await snapshot(root);
      const code = await new ViewCommand().execute(root, {
        stdinTTY: true, stdoutTTY: true,
        derive: async () => interactiveModel,
        launcher: async (model) => {
          lastModel = model;
          interactions++;
          return { code: 0 };
        },
      });
      expect(code).toBe(0);
      expect(interactions).toBe(1);
      expect(lastModel).toBeDefined();
      expect(lastModel!.columns.ideas.length).toBe(1);
      // Verify no filesystem changes
      expect(await snapshot(root)).toEqual(before);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
