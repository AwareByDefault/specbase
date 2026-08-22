import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { KANBAN_BOARD_VERSION, validateKanbanBoardSnapshot } from '../../src/index.js';
import { ViewCommand } from '../../src/core/view.js';
import { decodeViewModelFrame, bunVersionSupported } from '../../src/core/view/protocol.js';
import { discoverBun } from '../../src/core/view/launcher.js';
import type { ViewBoardModel } from '../../src/core/view/model.js';

const model: ViewBoardModel = {
  version: 4,
  project: { name: 'sample-project' },
  summary: { openIdeas: 1, completedTasks: 0, totalTasks: 0, lanes: { proposed: 0, enforcement: 0, 'ready-to-apply': 0, implementing: 0, reviewing: 0, archived: 0 } },
  lanes: { ideas: [{ kind: 'idea', id: 'idea-1', title: 'Idea', created: '2025-01-01', members: [] }], proposed: [], enforcement: [], 'ready-to-apply': [], implementing: [], reviewing: [], archived: [] },
  diagnostics: [],
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
  it('validates unknown public kanban values without mutating a supported snapshot', () => {
    const before = JSON.stringify(model);
    const accepted = validateKanbanBoardSnapshot(model, KANBAN_BOARD_VERSION);
    expect(accepted).toEqual({ valid: true, snapshot: model, diagnostics: [] });
    expect(accepted.valid && accepted.snapshot).toBe(model);

    const unsupported = validateKanbanBoardSnapshot(model, KANBAN_BOARD_VERSION + 1);
    expect(unsupported).toMatchObject({
      valid: false,
      snapshot: null,
      diagnostics: [{ code: 'kanban_board_unsupported_version', message: expect.stringContaining(String(KANBAN_BOARD_VERSION + 1)), remediation: expect.stringContaining(String(KANBAN_BOARD_VERSION)) }],
    });
    const malformed = { ...model, lanes: { ...model.lanes, proposed: [{ kind: 'change', id: 'broken' }] } };
    const first = validateKanbanBoardSnapshot(malformed, KANBAN_BOARD_VERSION);
    const second = validateKanbanBoardSnapshot(malformed, KANBAN_BOARD_VERSION);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      valid: false,
      snapshot: null,
      diagnostics: [{ code: 'kanban_board_invalid_shape', message: expect.stringContaining('received version'), remediation: expect.any(String) }],
    });

    const archiveCard = {
      kind: 'archive' as const,
      id: 'archive-1',
      title: 'Archived',
      archived: '2025-01-01',
      tasks: { completed: 0, total: 0 },
      position: 'active',
      lifecycle: 'implementing',
      diagnostics: 'not-an-array',
    };
    const invalidOptionalFields = {
      ...model,
      summary: { ...model.summary, lanes: { ...model.summary.lanes, archived: 1 } },
      lanes: { ...model.lanes, archived: [archiveCard] },
    };
    expect(validateKanbanBoardSnapshot(invalidOptionalFields, KANBAN_BOARD_VERSION).valid).toBe(false);

    const inconsistentSummary = {
      ...model,
      summary: { ...model.summary, openIdeas: 0 },
    };
    expect(validateKanbanBoardSnapshot(inconsistentSummary, KANBAN_BOARD_VERSION).valid).toBe(false);
    expect(JSON.stringify(model)).toBe(before);
  });

  it('additively validates canonical pull-request observations on active and archived v4 cards', () => {
    const pullRequest = {
      number: 42,
      url: 'https://github.com/acme/widget/pull/42',
      repository: 'acme/widget',
      base: 'main',
      head: 'feature/change',
      headSha: 'a'.repeat(40),
      runId: 'view-validation',
      state: 'ready' as const,
    };
    const archiveCard = {
      kind: 'archive' as const,
      id: 'archive-pr',
      title: 'Archived PR',
      archived: '2025-01-01',
      tasks: { completed: 0, total: 0 },
      pullRequest,
    };
    const withArchivePr = {
      ...model,
      summary: { ...model.summary, lanes: { ...model.summary.lanes, archived: 1 } },
      lanes: { ...model.lanes, archived: [archiveCard] },
    };
    expect(validateKanbanBoardSnapshot(withArchivePr, KANBAN_BOARD_VERSION)).toMatchObject({ valid: true, snapshot: withArchivePr });
    expect(validateKanbanBoardSnapshot({
      ...withArchivePr,
      lanes: { ...withArchivePr.lanes, archived: [{ ...archiveCard, pullRequest: { ...pullRequest, state: 'unknown' } }] },
    }, KANBAN_BOARD_VERSION).valid).toBe(false);

    const reviewingCard = {
      kind: 'change' as const,
      id: 'reviewing-pr',
      title: 'Reviewing PR',
      created: '2025-01-01',
      artifacts: { completed: 1, total: 1 },
      tasks: { completed: 1, total: 1 },
      lifecycle: 'reviewing' as const,
      pullRequest,
    };
    const withReviewingPr = {
      ...model,
      summary: { ...model.summary, completedTasks: 1, totalTasks: 1, lanes: { ...model.summary.lanes, reviewing: 1 } },
      lanes: { ...model.lanes, reviewing: [reviewingCard] },
    };
    expect(validateKanbanBoardSnapshot(withReviewingPr, KANBAN_BOARD_VERSION).valid).toBe(true);
    expect(decodeViewModelFrame(Buffer.from(JSON.stringify(withReviewingPr)))).toEqual(withReviewingPr);

    const { state: _state, ...legacyDraftPullRequest } = pullRequest;
    const { pullRequest: _pullRequest, ...legacyReviewingCard } = reviewingCard;
    const legacyV4 = {
      ...withReviewingPr,
      lanes: { ...withReviewingPr.lanes, reviewing: [{ ...legacyReviewingCard, draftPullRequest: legacyDraftPullRequest }] },
    };
    expect(validateKanbanBoardSnapshot(legacyV4, KANBAN_BOARD_VERSION).valid).toBe(true);
    expect(decodeViewModelFrame(Buffer.from(JSON.stringify(legacyV4)))).toEqual(legacyV4);
    const malformedLegacyV4 = {
      ...legacyV4,
      lanes: { ...legacyV4.lanes, reviewing: [{ ...legacyV4.lanes.reviewing[0], draftPullRequest: { ...legacyDraftPullRequest, headSha: 'bad' } }] },
    };
    expect(validateKanbanBoardSnapshot(malformedLegacyV4, KANBAN_BOARD_VERSION).valid).toBe(false);
    expect(() => decodeViewModelFrame(Buffer.from(JSON.stringify(malformedLegacyV4)))).toThrow(/schema/);

    expect(validateKanbanBoardSnapshot({
      ...withReviewingPr,
      summary: { ...withReviewingPr.summary, lanes: { ...withReviewingPr.summary.lanes, reviewing: 0, implementing: 1 } },
      lanes: { ...withReviewingPr.lanes, reviewing: [], implementing: [{ ...reviewingCard, lifecycle: 'implementing' }] },
    }, KANBAN_BOARD_VERSION).valid).toBe(false);
  });

  it('validates complete legacy v3 snapshots and rejects malformed compatibility values', () => {
    const v3 = {
      ...model,
      version: 3,
      summary: { acceptedSpecs: 0, requirements: 0, ...model.summary },
      specs: [],
    };
    expect(validateKanbanBoardSnapshot(v3, 3)).toMatchObject({ valid: true, snapshot: v3, diagnostics: [] });
    expect(validateKanbanBoardSnapshot({ ...v3, summary: { ...v3.summary, acceptedSpecs: -1 } }, 3).valid).toBe(false);
    expect(validateKanbanBoardSnapshot({ ...v3, summary: { ...v3.summary, lanes: { ...v3.summary.lanes, reviewing: 1 } } }, 3).valid).toBe(false);
    expect(validateKanbanBoardSnapshot({ ...v3, lanes: { ...v3.lanes, proposed: [{ kind: 'change', id: 'broken' }] } }, 3).valid).toBe(false);
  });

  it.each([
    ['accepted-spec count', (board: Record<string, unknown>) => ({ ...board, summary: { ...(board.summary as Record<string, unknown>), acceptedSpecs: 0 } })],
    ['accepted requirement count', (board: Record<string, unknown>) => ({ ...board, summary: { ...(board.summary as Record<string, unknown>), requirements: 0 } })],
    ['accepted-spec pane', (board: Record<string, unknown>) => ({ ...board, specs: [] })],
    ['zero stack position', (board: Record<string, unknown>) => ({ ...board, lanes: { ...(board.lanes as Record<string, unknown>), ideas: [{ ...((board.lanes as Record<string, unknown[]>).ideas[0] as Record<string, unknown>), stack: { id: 'delivery', position: 0, total: 2 } }] } })],
    ['position beyond stack total', (board: Record<string, unknown>) => ({ ...board, lanes: { ...(board.lanes as Record<string, unknown>), ideas: [{ ...((board.lanes as Record<string, unknown[]>).ideas[0] as Record<string, unknown>), stack: { id: 'delivery', position: 3, total: 2 } }] } })],
  ])('rejects v4 work-only board with legacy or invalid stack data: %s', (_label, mutate) => {
    const legacy = model as unknown as Record<string, unknown>;
    const summary = { ...(legacy.summary as Record<string, unknown>) };
    delete summary.acceptedSpecs;
    delete summary.requirements;
    const v4 = { ...legacy, version: 4, summary };
    delete v4.specs;

    expect(validateKanbanBoardSnapshot(mutate(v4), 4)).toMatchObject({
      valid: false,
      snapshot: null,
      diagnostics: [{ code: 'kanban_board_invalid_shape' }],
    });
  });

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

  it('announces loading, launches only for two TTYs, and propagates the exact child status', async () => {
    let seen: ViewBoardModel | undefined;
    let stderr = '';
    const code = await new ViewCommand().execute('.', {
      stdinTTY: true, stdoutTTY: true, derive: async () => model,
      writeError: (text) => { stderr += text; },
      launcher: async (value) => { seen = value; return { code: 143 }; },
    });
    expect(stderr).toContain('Loading Specbase lifecycle board');
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
    for (const invalid of [Buffer.alloc(0), Buffer.from('{'), Buffer.from(`${JSON.stringify(model)} trailing`), Buffer.from(JSON.stringify({ ...model, version: 3 })), Buffer.from(JSON.stringify({ version: 1 }))]) {
      expect(() => decodeViewModelFrame(invalid)).toThrow();
    }
    const wrongLane = {
      ...model,
      lanes: {
        ...model.lanes,
        proposed: [{ kind: 'change', id: 'wrong', title: 'Wrong lane', created: null, artifacts: { completed: 0, total: 1 }, tasks: { completed: 0, total: 1 }, lifecycle: 'ready-to-apply' }],
      },
    };
    expect(() => decodeViewModelFrame(Buffer.from(JSON.stringify(wrongLane)))).toThrow(/schema/);
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
      version: 4,
      project: { name: 'rich-project' },
      summary: { openIdeas: 1, completedTasks: 3, totalTasks: 10, lanes: { proposed: 2, enforcement: 0, 'ready-to-apply': 0, implementing: 0, reviewing: 0, archived: 1 } },
      lanes: {
        ideas: [{ kind: 'idea', id: 'idea-a', title: 'Alpha idea', created: '2025-01-01', members: ['notes.md'] }],
        proposed: [
          { kind: 'change', id: 'change-low', title: 'Low progress', created: '2025-01-15', artifacts: { completed: 1, total: 3 }, tasks: { completed: 1, total: 10 }, lifecycle: 'proposed' },
          { kind: 'change', id: 'change-high', title: 'High progress', created: '2025-01-10', artifacts: { completed: 3, total: 3 }, tasks: { completed: 2, total: 10 }, lifecycle: 'proposed' },
        ],
        enforcement: [],
        'ready-to-apply': [],
        implementing: [],
        reviewing: [],
        archived: [{ kind: 'archive', id: 'archive-old', title: 'Old archive', archived: '2025-01-03', tasks: { completed: 5, total: 5 } }],
      },
      diagnostics: [{ source: 'ideas/bad', message: 'missing .openspec.yaml' }],
    };
    let output = '';
    const code = await new ViewCommand().execute('.', { plain: true, derive: async () => rich, writeOut: (text) => { output += text; } });
    expect(code).toBe(0);
    expect(output).toContain('Specbase Lifecycle Board');
    expect(output).toContain('Project: rich-project • Snapshot • Read only');
    expect(output).toContain('○ Alpha idea [idea-a]');
    expect(output).toContain('◉ Low progress [change-low] artifacts 1/3 | tasks 1/10');
    expect(output).toContain('◉ High progress [change-high] artifacts 3/3 | tasks 2/10');
    expect(output.indexOf('change-low')).toBeLessThan(output.indexOf('change-high'));
    expect(output).toContain('✓ Old archive [archive-old]');
    expect(output).not.toContain('Specifications');
    expect(output).toContain('⚠');
    expect(output).toContain('Diagnostics');
    expect(output).toContain('Problem: missing .openspec.yaml');
    expect(output).toContain('Consequence: This item may be missing or incomplete in the snapshot.');
    expect(output).toContain('Next step: Run specbase validate');
    expect(output).toContain('Viewer only');
    expect(output).not.toMatch(/\u001b\[/);
    const json = JSON.parse(await new ViewCommand().execute('.', { plain: true, json: true, derive: async () => rich, writeOut: (text) => { output = text; } }).then(() => output));
    expect(json.summary).toEqual(rich.summary);
    expect(json.lanes.ideas.length).toBe(rich.lanes.ideas.length);
    expect(json.lanes.proposed.map((card: { id: string }) => card.id)).toEqual(['change-low', 'change-high']);
    expect(json.lanes.proposed.map((card: { tasks: unknown }) => card.tasks)).toEqual(rich.lanes.proposed.map((card) => card.tasks));
    expect(json.lanes.archived.length).toBe(rich.lanes.archived.length);
    expect(Object.hasOwn(json, 'specs')).toBe(false);
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
        version: 4,
        project: { name: path.basename(root) },
        summary: { openIdeas: 1, completedTasks: 0, totalTasks: 0, lanes: { proposed: 1, enforcement: 0, 'ready-to-apply': 0, implementing: 0, reviewing: 0, archived: 0 } },
        lanes: {
          ideas: [{ kind: 'idea', id: 'idea-one', title: 'First idea', created: '2025-01-01', members: [] }],
          proposed: [{ kind: 'change', id: 'change-a', title: 'Change A', created: null, artifacts: { completed: 0, total: 3 }, tasks: { completed: 0, total: 0 }, lifecycle: 'proposed' }],
          enforcement: [], 'ready-to-apply': [], implementing: [], reviewing: [],
          archived: [],
        },
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
      expect(lastModel!.lanes.ideas.length).toBe(1);
      // Verify no filesystem changes
      expect(await snapshot(root)).toEqual(before);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
