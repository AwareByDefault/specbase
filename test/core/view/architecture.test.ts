import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { createViewerState, keyboardCommand, mouseSelectCommand, reduceViewerState } from '../../../src/core/view/commands.js';
import type { ViewBoardModel } from '../../../src/core/view/model.js';

const root = process.cwd();
const source = (relative: string) => fs.readFile(path.join(root, ...relative.split('/')), 'utf8');
const model: ViewBoardModel = {
  version: 3,
  project: { name: 'architecture-project' },
  summary: { acceptedSpecs: 0, requirements: 0, openIdeas: 2, completedTasks: 0, totalTasks: 0, lanes: { proposed: 0, enforcement: 0, 'ready-to-apply': 0, implementing: 0, reviewing: 0, archived: 0 } },
  lanes: { ideas: [
    { kind: 'idea', id: 'a', title: 'A', created: null, members: [] },
    { kind: 'idea', id: 'b', title: 'B', created: null, members: [] },
  ], proposed: [], enforcement: [], 'ready-to-apply': [], implementing: [], reviewing: [], archived: [] }, specs: [], diagnostics: [],
};

describe('view architecture boundaries', () => {
  it('keeps pure model, projections, protocol, and command modules free of renderer imports', async () => {
    for (const file of ['src/core/view/model.ts', 'src/core/view/projections.ts', 'src/core/view/protocol.ts', 'src/core/view/commands.ts', 'src/core/view.ts']) {
      const text = await source(file);
      expect(text, file).not.toMatch(/from ['"]@opentui\//);
      expect(text, file).not.toMatch(/src\/tui|\.\.\/\.\.\/tui/);
    }
  });

  it('traverses the production import graph and rejects OpenTUI/TUI dependencies outside approved modules', async () => {
    // Collect all production source files that are not test files
    const fs = await import('node:fs');
    const pathMod = await import('node:path');
    const productionFiles: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = pathMod.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) walk(abs);
        else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) productionFiles.push(abs);
      }
    }
    walk(pathMod.join(root, 'src'));

    const approvedModules = new Set([
      'src/core/view/',
      'src/tui/view/board.ts',
      'src/tui/view/entry.ts',
    ]);
    const rejected = new Set<string>();
    for (const file of productionFiles) {
      const relative = pathMod.relative(root, file).replace(/\\/g, '/');
      const text = fs.readFileSync(file, 'utf8');
      // Skip files that import from OpenTUI or reference tui
      if (text.includes('@opentui') || text.includes('tui/view')) {
        const isApproved = [...approvedModules].some((a) => relative.startsWith(a));
        if (!isApproved) rejected.add(relative);
      }
    }
    expect([...rejected]).toEqual([]);

    // Verify all projections consume the shared model types
    const projections = await source('src/core/view/projections.ts');
    expect(projections).toMatch(/from ['"].\/model(\.js)?['"]/);
    const board = await source('src/tui/view/board.ts');
    expect(board).toMatch(/from ['"].+\/model(\.js)?['"]/);
    const entry = await source('src/tui/view/entry.ts');
    expect(entry).toMatch(/from ['"].+\/protocol(\.js)?['"]/);
  });

  it('reduces equivalent keyboard and mouse selection/detail commands through immutable transient state', () => {
    const initial = createViewerState(model);
    const keyboardMoved = reduceViewerState(initial, keyboardCommand({ name: 'down' })!, model);
    const mouseMoved = reduceViewerState(initial, mouseSelectCommand('ideas', 1), model);
    expect(keyboardMoved.selected).toEqual(mouseMoved.selected);
    const keyboardDetail = reduceViewerState(keyboardMoved, keyboardCommand({ name: 'enter' })!, model);
    const mouseDetail = reduceViewerState(mouseMoved, { type: 'open-detail' }, model);
    expect(keyboardDetail.detail).toEqual(mouseDetail.detail);
    expect(model.lanes.ideas.map((card) => card.id)).toEqual(['a', 'b']);
  });

  it('confines renderer ownership and cleanup to one child entrypoint', async () => {
    const entry = await source('src/tui/view/entry.ts');
    const board = await source('src/tui/view/board.ts');
    const launcher = await source('src/core/view/launcher.ts');
    expect(entry).toMatch(/createCliRenderer/);
    expect(entry).toMatch(/finally\s*{/);
    expect(entry).toMatch(/controller\?\.destroy\(\)/);
    expect(entry).toMatch(/renderer\?\.destroy\(\)/);
    expect(board).not.toMatch(/createCliRenderer/);
    expect(launcher).not.toMatch(/@opentui\/core/);
  });

  it('enforces inherited TTY fds, one fd 3 EOF frame, signal forwarding, and exact child results', async () => {
    const launcher = await source('src/core/view/launcher.ts');
    expect(launcher).toContain("stdio: ['inherit', 'inherit', 'inherit', 'pipe']");
    expect(launcher).toMatch(/\.end\(JSON\.stringify\(model\)\)/);
    expect(launcher).toMatch(/process\.once\('SIGINT'/);
    expect(launcher).toMatch(/process\.once\('SIGTERM'/);
    expect(launcher).toMatch(/child\.kill\(signal\)/);
    expect(launcher).toMatch(/finish\(\{ code \}\)/);
    // Spawn and pipe failures are caught with actionable error messages
    expect(launcher).toMatch(/catch \(error\)/);
    expect(launcher).toContain('Could not start the interactive renderer');
    expect(launcher).toContain('specbase view --plain');
    // fd 3 pipe errors are caught and reported
    expect(launcher).toMatch(/modelPipe\.once\(.error.,/);
    expect(launcher).toContain('Interactive renderer handoff failed');
    const entry = await source('src/tui/view/entry.ts');
    expect(entry.indexOf('decodeViewModelFrame')).toBeLessThan(entry.indexOf('process.once'));
    // Signal handlers registered before any OpenTUI dynamic import
    const sigintPos = entry.indexOf("process.once('SIGINT'");
    const sigtermPos = entry.indexOf("process.once('SIGTERM'");
    const importCorePos = entry.indexOf("import('@opentui/core')");
    // Signal handlers should appear before the dynamic import
    expect(sigintPos).toBeGreaterThan(0);
    expect(sigtermPos).toBeGreaterThan(0);
    // There may be a type-level import('@opentui/core') earlier; check that
    // the signal handlers appear before the dynamic import in the try block.
    // Find the second occurrence (the dynamic import inside the try block)
    const allImportPositions = [...entry.matchAll(/import\('@opentui\/core'\)/g)].map(m => m.index);
    const dynamicImportPos = allImportPositions.length >= 2 ? allImportPositions[1] : allImportPositions[0];
    expect(sigintPos).toBeLessThan(dynamicImportPos);
    expect(sigtermPos).toBeLessThan(dynamicImportPos);
  });
});
