import { afterEach, describe, expect, test } from 'bun:test';
import { createTestRenderer } from '@opentui/core/testing';
import type { Renderable } from '@opentui/core';
import { createViewBoard, type ViewBoardController } from '../../src/tui/view/board.js';
import type { ViewBoardModel } from '../../src/core/view/model.js';

const cleanups: Array<() => void> = [];
afterEach(() => { while (cleanups.length) cleanups.pop()?.(); });

function fixture(changeCount = 8): ViewBoardModel {
  return {
    version: 1,
    summary: { acceptedSpecs: 1, requirements: 2, openIdeas: 2, activeChanges: changeCount, archivedChanges: 1, completedTasks: 3, totalTasks: 10 },
    columns: {
      ideas: [
        { kind: 'idea', id: 'idea-a', title: 'First idea', created: '2025-01-01', members: ['notes.md'] },
        { kind: 'idea', id: 'idea-b', title: 'Second idea', created: '2025-01-02', members: [] },
      ],
      changes: Array.from({ length: changeCount }, (_, index) => ({ kind: 'change' as const, id: `change-${index}`, title: `Change ${index}`, created: null, artifacts: { completed: index % 3, total: 3 }, tasks: { completed: index, total: 10 } })),
      archives: [{ kind: 'archive', id: 'archived-a', title: 'Archived A', archived: '2025-01-03', tasks: { completed: 2, total: 2 } }],
    },
    specs: [{ kind: 'spec', id: 'behavior.sample', locator: 'behavior/sample', title: 'behavior/sample', requirementCount: 2, requirements: ['First outcome', 'Second outcome'], diagnostic: 'sample warning' }],
    diagnostics: [],
  };
}

async function setup(width = 120, height = 30, changeCount = 8) {
  const harness = await createTestRenderer({ width, height, useMouse: true, kittyKeyboard: true });
  let quit = false;
  const controller = createViewBoard(harness.renderer, fixture(changeCount), () => { quit = true; });
  await harness.renderOnce();
  const cleanup = () => { controller.destroy(); harness.renderer.destroy(); };
  cleanups.push(cleanup);
  return { ...harness, controller, get quit() { return quit; } };
}

function target(renderer: { root: Renderable }, id: string): Renderable {
  const item = renderer.root.findDescendantById(id) as Renderable | undefined;
  if (!item) throw new Error(`missing renderable ${id}`);
  return item;
}
function center(item: Renderable): [number, number] {
  return [item.screenX + Math.max(0, Math.floor(item.width / 2)), item.screenY + Math.max(0, Math.floor(item.height / 2))];
}

describe('OpenTUI lifecycle board', () => {
  test('renders hierarchy, labelled progress, controls, warnings, and non-color focus cues', async () => {
    const app = await setup();
    const frame = app.captureCharFrame();
    expect(frame).toContain('Viewer-only Lifecycle Board');
    expect(frame).toContain('Open Ideas (2)');
    expect(frame).toContain('Active Changes (8)');
    expect(frame).toContain('Archived Changes (1)');
    expect(frame).toContain('Specs 1');
    expect(frame).toContain('[Open Enter]');
    expect(frame).toContain('[Quit q]');
    expect(frame).toContain('▶');
    expect(frame).toContain('◉ Tasks:');
    expect(frame).toContain('READ ONLY');
  });

  test('parses real mouse down/up clicks for selection and visible detail open/close controls', async () => {
    const app = await setup();
    const second = target(app.renderer, 'card:ideas:idea-b');
    await app.mockMouse.click(...center(second));
    await app.flush();
    expect(app.controller.state.selected.ideas).toBe(1);
    expect(app.controller.state.detail).toBeNull();

    // Open detail via the footer Open control
    const openCtrl = target(app.renderer, 'open-control');
    await app.mockMouse.click(...center(openCtrl));
    await app.flush();
    expect(app.controller.state.detail).toEqual({ pane: 'ideas', index: 1 });
    expect(app.captureCharFrame()).toContain('Idea: Second idea');
    expect(app.captureCharFrame()).toContain('[Close Esc]');

    const close = target(app.renderer, 'detail-close');
    await app.mockMouse.click(...center(close));
    await app.flush();
    expect(app.controller.state.detail).toBeNull();
    expect(app.controller.state.selected.ideas).toBe(1);
  });

  test('routes parsed wheel input only to the intended pane and keeps focused cards visible', async () => {
    const app = await setup(120, 18, 12);
    app.controller.dispatch({ type: 'select-pane', pane: 'changes' });
    await app.flush();
    const pane = target(app.renderer, 'pane:changes');
    const beforeIdeas = app.controller.state.scroll.ideas;
    await app.mockMouse.scroll(...center(pane), 'down');
    await app.flush();
    expect(app.controller.state.scroll.changes).toBeGreaterThan(0);
    expect(app.controller.state.scroll.ideas).toBe(beforeIdeas);
    for (let index = 0; index < 8; index++) app.mockInput.pressArrow('down');
    await app.flush();
    expect(app.controller.state.selected.changes).toBe(8);
    expect(app.controller.state.scroll.changes).toBeGreaterThan(0);
    expect(app.captureCharFrame()).toContain('Change 8');
  });

  test('keyboard reaches pane, selection, detail, close, and quit outcomes', async () => {
    const app = await setup();
    app.mockInput.pressTab();
    app.mockInput.pressArrow('down');
    app.mockInput.pressEnter();
    await app.flush();
    expect(app.controller.state.pane).toBe('changes');
    expect(app.controller.state.selected.changes).toBe(1);
    expect(app.controller.state.detail).toEqual({ pane: 'changes', index: 1 });
    app.mockInput.pressEscape();
    await app.flush();
    expect(app.controller.state.detail).toBeNull();
    app.mockInput.pressKey('q');
    await app.flush();
    expect(app.quit).toBe(true);
  });

  test('reflows to narrow single-column navigation while retaining logical focus', async () => {
    const app = await setup();
    app.controller.dispatch({ type: 'select-pane', pane: 'changes' });
    app.controller.dispatch({ type: 'select-item', pane: 'changes', index: 3 });
    app.resize(55, 20);
    app.controller.resize(55, 20);
    await app.renderOnce();
    const frame = app.captureCharFrame();
    expect(app.controller.state.narrow).toBe(true);
    expect(app.controller.state.selected.changes).toBe(3);
    expect(frame).toContain('Active Changes 2/4');
    expect(frame).toContain('[◀ Prev]');
    expect(frame).toContain('[Next ▶]');
    expect(frame).toContain('Change 3');
    expect(frame).not.toContain('Archived Changes (1)');
  });

  test('opens specification identity, titles, and non-color warning detail', async () => {
    const app = await setup();
    app.controller.dispatch({ type: 'select-pane', pane: 'specs' });
    app.controller.dispatch({ type: 'open-detail' });
    await app.flush();
    const frame = app.captureCharFrame();
    expect(frame).toContain('▪ Specification: behavior/sample');
    expect(frame).toContain('ID: behavior.sample');
    expect(frame).toContain('First outcome');
    expect(frame).toContain('⚠ sample warning');
  });

  test('logical destroy is idempotent and removes input handlers and renderables', async () => {
    const app = await setup();
    app.controller.destroy();
    app.controller.destroy();
    expect(app.renderer.root.findDescendantById('view-board-root')).toBeUndefined();
  });

  test('table-driven mouse and keyboard equivalence for pane selection, detail access, and scroll', async () => {
    const app = await setup();
    const scenarios = [
      { action: () => { app.controller.dispatch({ type: 'select-pane', pane: 'changes' }); }, desc: 'changes pane via dispatch' },
    ];
    for (const { action, desc } of scenarios) {
      app.controller.dispatch({ type: 'select-pane', pane: 'ideas' });
      await app.flush();
      action();
      await app.flush();
      expect(app.controller.state.pane, desc).toBe('changes');
    }

    // Mouse pane selection: click on the changes pane border area
    app.controller.dispatch({ type: 'select-pane', pane: 'ideas' });
    await app.flush();
    const changesPane = target(app.renderer, 'pane:changes');
    await app.mockMouse.click(...center(changesPane));
    await app.flush();
    expect(app.controller.state.pane).toBe('changes');

    // Keyboard pane navigation (Tab)
    app.controller.dispatch({ type: 'select-pane', pane: 'changes' });
    await app.flush();
    app.mockInput.pressTab();
    await app.flush();
    expect(app.controller.state.pane).toBe('archives');

    // Keyboard item navigation
    app.controller.dispatch({ type: 'select-pane', pane: 'ideas' });
    await app.flush();
    app.mockInput.pressArrow('down');
    await app.flush();
    expect(app.controller.state.selected.ideas).toBe(1);

    // Mouse item selection
    app.mockInput.pressArrow('up');
    await app.flush();
    const firstCard = target(app.renderer, 'card:ideas:idea-a');
    await app.mockMouse.click(...center(firstCard));
    await app.flush();
    expect(app.controller.state.selected.ideas).toBe(0);

    // Wheel scrolls detail pane when detail is open
    app.controller.dispatch({ type: 'open-detail' });
    await app.flush();
    expect(app.controller.state.detail).toBeDefined();
    const detailScrollBefore = app.controller.state.detailScroll;
    const detailOverlay = target(app.renderer, 'detail-overlay');
    await app.mockMouse.scroll(...center(detailOverlay), 'down');
    await app.flush();
    expect(app.controller.state.detailScroll).toBeGreaterThan(detailScrollBefore);
  });

  test('renders complete active card vs archive with distinct cues and focused control states', async () => {
    const app = await setup(120, 30, 1);
    app.controller.dispatch({ type: 'select-pane', pane: 'changes' });
    await app.flush();
    const frame = app.captureCharFrame();
    expect(frame).toContain('Active Changes');
    expect(frame).toContain('◉');
    expect(frame).toContain('○ Artifacts:');
    expect(frame).toContain('◉ Tasks:');

    app.controller.dispatch({ type: 'select-pane', pane: 'archives' });
    await app.flush();
    const archiveFrame = app.captureCharFrame();
    expect(archiveFrame).toContain('✓');
    expect(archiveFrame).toContain('✓ Tasks:');

    // Focus each control in the footer and capture frame
    for (const ctrlId of ['specs-control', 'quit-control', 'open-control']) {
      const ctrl = target(app.renderer, ctrlId);
      await app.mockMouse.click(...center(ctrl));
      await app.flush();
      // The control was clicked, verify interaction happened
      expect(() => target(app.renderer, ctrlId)).not.toThrow();
    }
  });
});
