import { afterEach, describe, expect, test } from 'bun:test';
import { Buffer } from 'node:buffer';
import { createTestRenderer } from '@opentui/core/testing';
import { BoxRenderable, type Renderable } from '@opentui/core';
import { createViewBoard, type ViewBoardController } from '../../src/tui/view/board.js';
import type { ViewBoardModel, LifecycleState } from '../../src/core/view/model.js';
import { BOARD_PANES, MINIMUM_BOARD_COLUMN_WIDTH, VIEW_PANES, boardColumnCapacity, visibleBoardPaneWindow } from '../../src/core/view/commands.js';

const cleanups: Array<() => void> = [];
afterEach(() => { while (cleanups.length) cleanups.pop()?.(); });

function changeCard(id: string, title: string, lifecycle: LifecycleState, tasks = { completed: 0, total: 10 }): import('../../src/core/view/model.js').ChangeCard {
  return { kind: 'change', id, title, created: null, artifacts: { completed: 1, total: 3 }, tasks, lifecycle };
}

function fixture(readyCount = 8): ViewBoardModel {
  return {
    version: 3,
    project: { name: 'sample-project' },
    summary: { acceptedSpecs: 1, requirements: 2, openIdeas: 2, completedTasks: 3, totalTasks: 10, lanes: { proposed: 0, enforcement: 0, 'ready-to-apply': readyCount, implementing: 2, reviewing: 1, archived: 1 } },
    lanes: {
      ideas: [
        { kind: 'idea', id: 'idea-a', title: 'First idea', created: '2025-01-01', members: ['notes.md'] },
        { kind: 'idea', id: 'idea-b', title: 'Second idea', created: '2025-01-02', members: [] },
      ],
      proposed: [],
      enforcement: [],
      'ready-to-apply': Array.from({ length: readyCount }, (_, index) => changeCard(`ready-${index}`, `Ready ${index}`, 'ready-to-apply', { completed: index, total: 10 })),
      implementing: [
        changeCard('imp-a', 'Implementing A', 'implementing', { completed: 2, total: 3 }),
        changeCard('imp-b', 'Implementing B', 'implementing', { completed: 1, total: 3 }),
      ],
      reviewing: [changeCard('rev-a', 'Reviewing A', 'reviewing', { completed: 3, total: 3 })],
      archived: [{ kind: 'archive', id: 'archived-a', title: 'Archived A', archived: '2025-01-03', tasks: { completed: 2, total: 2 } }],
    },
    specs: [{ kind: 'spec', id: 'behavior.sample', locator: 'behavior/sample', title: 'behavior/sample', requirementCount: 2, requirements: ['First outcome', 'Second outcome'], diagnostic: 'sample warning' }],
    diagnostics: [],
  };
}

async function setup(width = 120, height = 30, readyCount = 8, model = fixture(readyCount)) {
  const harness = await createTestRenderer({ width, height, useMouse: true, kittyKeyboard: true });
  let quit = false;
  const controller = createViewBoard(harness.renderer, model, () => { quit = true; });
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
  test('projects a pure contiguous lifecycle window at complete-column thresholds', () => {
    const exactTwoColumnWidth = MINIMUM_BOARD_COLUMN_WIDTH * 2 + 1;
    expect(boardColumnCapacity(exactTwoColumnWidth - 1)).toBe(1);
    expect(boardColumnCapacity(exactTwoColumnWidth)).toBe(2);
    expect(visibleBoardPaneWindow(MINIMUM_BOARD_COLUMN_WIDTH * 3 + 2, 'ideas')).toEqual(BOARD_PANES.slice(0, 3));
    expect(visibleBoardPaneWindow(MINIMUM_BOARD_COLUMN_WIDTH * 3 + 2, 'ready-to-apply')).toEqual(['proposed', 'enforcement', 'ready-to-apply']);
    expect(visibleBoardPaneWindow(MINIMUM_BOARD_COLUMN_WIDTH * 3 + 2, 'archived')).toEqual(['implementing', 'reviewing', 'archived']);
    expect(visibleBoardPaneWindow(MINIMUM_BOARD_COLUMN_WIDTH * 3 + 2, 'specs')).toEqual([]);
  });

  test('renders equal-width adjacent panes with isolated pointer and keyboard state', async () => {
    const model = fixture(12);
    const before = structuredClone(model);
    const app = await setup(160, 22, 12, model);
    const visible = ['ideas', 'proposed', 'enforcement', 'ready-to-apply'] as const;
    const panes = visible.map((pane) => target(app.renderer, `pane:${pane}`));
    expect(new Set(panes.map((pane) => pane.width)).size).toBe(1);
    for (let index = 1; index < panes.length; index++) expect(panes[index].screenX).toBeGreaterThan(panes[index - 1].screenX + panes[index - 1].width - 1);
    expect((panes[0] as BoxRenderable).borderStyle).toBe('double');
    expect((panes[1] as BoxRenderable).borderStyle).toBe('single');
    expect(app.captureCharFrame()).toContain('▶ First idea');

    const readyPane = target(app.renderer, 'pane:ready-to-apply');
    await app.mockMouse.scroll(...center(readyPane), 'down');
    await app.flush();
    expect(app.controller.state.pane).toBe('ideas');
    expect(app.controller.state.scroll['ready-to-apply']).toBeGreaterThan(0);
    expect(app.controller.state.scroll.ideas).toBe(0);

    const readyFocusTarget = target(app.renderer, 'pane:ready-to-apply');
    await app.mockMouse.click(readyFocusTarget.screenX + 1, readyFocusTarget.screenY + 1);
    await app.flush();
    const readySelectionBeforeKey = app.controller.state.selected['ready-to-apply'];
    app.mockInput.pressArrow('down');
    await app.flush();
    expect(app.controller.state.pane).toBe('ready-to-apply');
    expect(app.controller.state.selected['ready-to-apply']).toBe(readySelectionBeforeKey + 1);
    expect(app.controller.state.selected.ideas).toBe(0);

    const selectedReady = target(app.renderer, `card:ready-to-apply:ready-${readySelectionBeforeKey + 1}`) as BoxRenderable;
    expect(selectedReady.borderStyle).toBe('double');
    expect((target(app.renderer, 'pane:proposed') as BoxRenderable).borderStyle).toBe('single');
    for (const label of ['[◀ Prev]', '[Next ▶]', '[Details Enter]', '[Help ?]', '[Quit q]']) expect(app.captureCharFrame().split(label).length - 1).toBe(1);
    expect(model).toEqual(before);
  });

  test('preserves focused context, overlays, and per-pane memory across a wide-narrow-wide resize', async () => {
    const app = await setup(160, 22, 12);
    await app.mockMouse.click(...center(target(app.renderer, 'pane:ready-to-apply')));
    await app.flush();
    app.mockInput.pressArrow('down');
    app.controller.dispatch({ type: 'open-help' });
    await app.flush();
    app.resize(60, 22);
    app.controller.resize(60, 22);
    await app.renderOnce();
    expect(app.controller.state.pane).toBe('ready-to-apply');
    expect(app.controller.state.selected['ready-to-apply']).toBe(1);
    expect(app.controller.state.overlay).toBe('help');
    app.resize(160, 22);
    app.controller.resize(160, 22);
    await app.renderOnce();
    expect(app.controller.state.selected['ready-to-apply']).toBe(1);
    expect(app.controller.state.overlay).toBe('help');
    expect(app.captureCharFrame()).toContain('Keyboard help');
  });

  test('renders lifecycle lanes, labelled progress, controls, warnings, and non-color focus cues', async () => {
    const app = await setup();
    app.controller.dispatch({ type: 'select-pane', pane: 'ready-to-apply' });
    await app.flush();
    const frame = app.captureCharFrame();
    expect(frame).toContain('sample-project');
    expect(frame).toContain('Lifecycle Board');
    for (const label of ['Ideas 2', 'Proposed 0', 'Enforce 0', 'Ready 8', 'Doing 2', 'Review 1', 'Archived 1', 'Specs 1']) {
      expect(frame).toContain(label);
    }
    expect(frame).toContain('Ready to Apply');
    expect(frame).toContain('item 1/8');
    expect(frame).toContain('[Details Enter]');
    expect(frame).toContain('[Help ?]');
    expect(frame).toContain('[Quit q]');
    expect(frame).toContain('▶');
    expect(frame).toContain('◉ Tasks:');
    expect(frame).toContain('Ready 0');
    expect(frame).toContain('READ ONLY');
  });

  test('parses real mouse down/up clicks for selection and visible detail open/close controls', async () => {
    const app = await setup();
    app.controller.dispatch({ type: 'select-pane', pane: 'ready-to-apply' });
    await app.flush();
    app.controller.dispatch({ type: 'scroll-pane', pane: 'ready-to-apply', delta: 1 });
    await app.flush();
    const second = target(app.renderer, 'card:ready-to-apply:ready-1');
    await app.mockMouse.click(...center(second));
    await app.flush();
    expect(app.controller.state.selected['ready-to-apply']).toBe(1);
    expect(app.controller.state.detail).toBeNull();

    // Open detail via the precisely labelled Details control.
    const detailsControl = target(app.renderer, 'details-control');
    await app.mockMouse.click(...center(detailsControl));
    await app.flush();
    expect(app.controller.state.detail).toEqual({ pane: 'ready-to-apply', index: 1 });
    expect(app.captureCharFrame()).toContain('Ready to Apply change: Ready 1');
    expect(app.captureCharFrame()).toContain('Project sample-project • READ ONLY • Ready to Apply 2/8');
    expect(app.captureCharFrame()).toContain('[Close Esc]');

    const close = target(app.renderer, 'detail-close');
    await app.mockMouse.click(...center(close));
    await app.flush();
    expect(app.controller.state.detail).toBeNull();
    expect(app.controller.state.selected['ready-to-apply']).toBe(1);
  });

  test('routes parsed wheel input only to the intended lane and keeps focused cards visible', async () => {
    const app = await setup(120, 18, 12);
    app.controller.dispatch({ type: 'select-pane', pane: 'ready-to-apply' });
    await app.flush();
    const pane = target(app.renderer, 'pane:ready-to-apply');
    const beforeIdeas = app.controller.state.scroll.ideas;
    await app.mockMouse.scroll(...center(pane), 'down');
    await app.flush();
    expect(app.controller.state.scroll['ready-to-apply']).toBeGreaterThan(0);
    expect(app.controller.state.scroll.ideas).toBe(beforeIdeas);
    const selectionAfterWheel = app.controller.state.selected['ready-to-apply'];
    for (let index = 0; index < 8; index++) app.mockInput.pressArrow('down');
    await app.flush();
    expect(app.controller.state.selected['ready-to-apply']).toBe(Math.min(11, selectionAfterWheel + 8));
    expect(app.controller.state.scroll['ready-to-apply']).toBeGreaterThan(0);
    expect(app.captureCharFrame()).toContain(`Ready ${app.controller.state.selected['ready-to-apply']}`);
  });

  test('keyboard reaches pane, selection, detail, close, and quit outcomes', async () => {
    const app = await setup();
    app.controller.dispatch({ type: 'select-pane', pane: 'ready-to-apply' });
    await app.flush();
    app.mockInput.pressArrow('down');
    app.mockInput.pressEnter();
    await app.flush();
    expect(app.controller.state.pane).toBe('ready-to-apply');
    expect(app.controller.state.selected['ready-to-apply']).toBe(1);
    expect(app.controller.state.detail).toEqual({ pane: 'ready-to-apply', index: 1 });
    app.mockInput.pressEscape();
    await app.flush();
    expect(app.controller.state.detail).toBeNull();
    app.mockInput.pressKey('q');
    await app.flush();
    expect(app.quit).toBe(true);
  });

  test('reflows to narrow single-lane navigation while retaining logical focus', async () => {
    const app = await setup();
    app.controller.dispatch({ type: 'select-pane', pane: 'implementing' });
    app.controller.dispatch({ type: 'select-item', pane: 'implementing', index: 0 });
    app.resize(55, 20);
    app.controller.resize(55, 20);
    await app.renderOnce();
    const frame = app.captureCharFrame();
    expect(app.controller.state.narrow).toBe(true);
    expect(app.controller.state.selected.implementing).toBe(0);
    expect(frame).toContain('[Prev]');
    expect(frame).toContain('[Next]');
    expect(frame).toContain('[Details]');
    expect(frame).toContain('[Help]');
    expect(frame).toContain('sample-project');
    expect(frame).toContain('READ ONLY');
    expect(frame).toContain('Implementing 5/8');
    expect(frame).toContain('item 1/2');
    expect(frame).toContain('Implementing A');
    for (const label of ['[Prev]', '[Next]', '[Details]', '[Help]', '[Quit]']) {
      expect(frame.split(label).length - 1).toBe(1);
    }
    // The single-lane board must not show the archived lane's card.
    expect(frame).not.toContain('Archived A');
  });

  test('uses adjacent complete columns before falling back to focused-column recovery', async () => {
    const app = await setup(86, 20, 1);
    expect(app.controller.state.narrow).toBe(false);
    expect(() => target(app.renderer, 'board-column-window')).not.toThrow();
    expect(() => target(app.renderer, 'pane:ideas')).not.toThrow();
    expect(() => target(app.renderer, 'pane:proposed')).not.toThrow();
    expect(app.captureCharFrame()).toContain('First idea');
    expect(app.captureCharFrame()).toContain('[Details Enter]');
  });

  test('keeps wide capacity independent of lane counts and global control width', async () => {
    const app = await setup(120, 20, 1000);
    expect(app.controller.state.narrow).toBe(false);
    expect(() => target(app.renderer, 'lane-nav')).toThrow();
    expect(app.captureCharFrame()).toContain('[Details Enter]');
  });

  test('wraps labelled controls at very narrow supported widths without clipping them', async () => {
    const app = await setup(35, 20, 1);
    const frame = app.captureCharFrame();
    for (const label of ['[Prev]', '[Next]', '[Details]', '[Help]', '[Quit]']) expect(frame).toContain(label);
    for (const id of ['lane-prev', 'lane-next', 'details-control', 'help-control', 'quit-control']) {
      const control = target(app.renderer, id);
      expect(control.screenX).toBeGreaterThanOrEqual(0);
      expect(control.screenX + control.width).toBeLessThanOrEqual(35);
    }
  });

  test('shows explicit resize and recovery guidance below the supported terminal floor', async () => {
    const app = await setup(15, 20, 1);
    const frame = app.captureCharFrame();
    expect(frame).toContain('Terminal small');
    expect(frame).toContain('Resize');
    expect(frame).toContain('q');
  });

  test('keeps a recognizable project identity in constrained headers', async () => {
    const model = fixture(1);
    model.project.name = 'project-with-a-deliberately-long-identity-for-a-small-terminal';
    const app = await setup(55, 20, 1, model);
    const frame = app.captureCharFrame();
    expect(frame).toContain('project-with-a-deliberately');
    expect(frame).toContain('READ ONLY');
  });

  test('keeps fixed board and read-only identity with an unbounded wide project name', async () => {
    const model = fixture(1);
    model.project.name = 'x'.repeat(300);
    const app = await setup(120, 30, 1, model);
    const frame = app.captureCharFrame();
    expect(frame).toContain('SPECBASE • Lifecycle Board');
    expect(frame).toContain('READ ONLY • Project');
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

  test('actual mouse and keyboard routes produce equivalent pane, item, and detail state', async () => {
    const mouse = await setup(160);
    const keyboard = await setup(160);

    await mouse.mockMouse.click(...center(target(mouse.renderer, 'pane:ready-to-apply')));
    await mouse.flush();
    await mouse.mockMouse.click(...center(target(mouse.renderer, 'card:ready-to-apply:ready-0')));
    await mouse.flush();
    await mouse.mockMouse.click(...center(target(mouse.renderer, 'details-control')));
    await mouse.flush();

    for (let index = 0; index < 3; index++) keyboard.mockInput.pressArrow('right');
    keyboard.mockInput.pressEnter();
    await keyboard.flush();

    expect(mouse.controller.state.pane).toBe(keyboard.controller.state.pane);
    expect(mouse.controller.state.selected).toEqual(keyboard.controller.state.selected);
    expect(mouse.controller.state.detail).toEqual(keyboard.controller.state.detail);
  });

  test('mouse Prev, Next, and Quit controls match keyboard outcomes', async () => {
    const mouse = await setup();
    const keyboard = await setup();
    await mouse.mockMouse.click(...center(target(mouse.renderer, 'lane-prev')));
    keyboard.mockInput.pressArrow('left');
    await mouse.flush();
    await keyboard.flush();
    expect(mouse.controller.state.pane).toBe(keyboard.controller.state.pane);
    await mouse.mockMouse.click(...center(target(mouse.renderer, 'lane-next')));
    keyboard.mockInput.pressArrow('right');
    await mouse.flush();
    await keyboard.flush();
    expect(mouse.controller.state.pane).toBe(keyboard.controller.state.pane);
    await mouse.mockMouse.click(...center(target(mouse.renderer, 'quit-control')));
    keyboard.mockInput.pressKey('q');
    await mouse.flush();
    await keyboard.flush();
    expect(mouse.quit).toBe(true);
    expect(keyboard.quit).toBe(true);
  });

  test('mouse wheel and keyboard keys produce equivalent detail scrolling', async () => {
    const model = fixture(1);
    model.specs[0].requirements = Array.from({ length: 30 }, (_, index) => `Requirement ${index + 1}`);
    model.specs[0].requirementCount = 30;
    const mouse = await setup(80, 20, 1, model);
    const keyboard = await setup(80, 20, 1, model);
    for (const app of [mouse, keyboard]) {
      app.controller.dispatch({ type: 'select-pane', pane: 'specs' });
      app.controller.dispatch({ type: 'open-detail' });
      await app.flush();
    }
    await mouse.mockMouse.scroll(...center(target(mouse.renderer, 'detail-overlay')), 'down');
    for (let index = 0; index < 3; index++) keyboard.mockInput.pressArrow('down');
    await mouse.flush();
    await keyboard.flush();
    expect(mouse.controller.state.detailScroll).toBe(keyboard.controller.state.detailScroll);
  });

  test('opens and closes details for every work-item kind without losing origin selection', async () => {
    const app = await setup(120, 30, 2);
    for (const [pane, index] of [['ideas', 1], ['ready-to-apply', 1], ['archived', 0], ['specs', 0]] as const) {
      app.controller.dispatch({ type: 'select-pane', pane });
      app.controller.dispatch({ type: 'select-item', pane, index });
      app.controller.dispatch({ type: 'open-detail' });
      await app.flush();
      expect(app.controller.state.detail).toEqual({ pane, index });
      app.controller.dispatch({ type: 'close-overlay' });
      await app.flush();
      expect(app.controller.state.detail).toBeNull();
      expect(app.controller.state.selected[pane]).toBe(index);
    }
  });

  test('Page Down moves within the focused lane and keeps the selected card visible', async () => {
    const app = await setup(120, 18, 14);
    app.controller.dispatch({ type: 'select-pane', pane: 'ready-to-apply' });
    await app.flush();
    app.renderer.stdin.emit('data', Buffer.from('\u001b[57355u'));
    await app.flush();
    expect(app.controller.state.pane).toBe('ready-to-apply');
    expect(app.controller.state.selected['ready-to-apply']).toBe(10);
    expect(app.captureCharFrame()).toContain('Ready 10');
  });

  test('focused controls change border style as a non-color cue', async () => {
    const app = await setup();
    const control = target(app.renderer, 'help-control') as BoxRenderable;
    expect(control.borderStyle).toBe('single');
    control.focus();
    await app.flush();
    expect(control.borderStyle).toBe('double');
    control.blur();
    expect(control.borderStyle).toBe('single');
  });

  test('keyboard Tab advances through lifecycle lanes and arrow navigates within a lane', async () => {
    const app = await setup();
    app.controller.dispatch({ type: 'select-pane', pane: 'ready-to-apply' });
    await app.flush();
    // Tab from ready-to-apply advances forward through the pane cycle.
    app.mockInput.pressTab();
    await app.flush();
    expect(VIEW_PANES).toContain(app.controller.state.pane);
    // Back to a populated lane: arrow moves within it.
    app.controller.dispatch({ type: 'select-pane', pane: 'ready-to-apply' });
    await app.flush();
    app.mockInput.pressArrow('down');
    await app.flush();
    expect(app.controller.state.selected['ready-to-apply']).toBe(1);
  });

  test('mouse clicks a lane and card; wheel scrolls only the detail pane when open', async () => {
    const model = fixture();
    model.specs[0].requirements = Array.from({ length: 30 }, (_, index) => `Requirement ${index + 1}`);
    model.specs[0].requirementCount = 30;
    const app = await setup(120, 30, 8, model);
    app.controller.dispatch({ type: 'select-pane', pane: 'implementing' });
    await app.flush();
    expect(app.controller.state.pane).toBe('implementing');

    // Arrow navigation within the implementing lane (2 cards).
    app.mockInput.pressArrow('down');
    await app.flush();
    expect(app.controller.state.selected.implementing).toBe(1);
    app.mockInput.pressArrow('up');
    await app.flush();
    expect(app.controller.state.selected.implementing).toBe(0);

    // Mouse item selection.
    const card = target(app.renderer, 'card:implementing:imp-a');
    await app.mockMouse.click(...center(card));
    await app.flush();
    expect(app.controller.state.selected.implementing).toBe(0);

    // Wheel scrolls long detail content without changing the prior lane scroll.
    const laneScrollBefore = app.controller.state.scroll.implementing;
    app.controller.dispatch({ type: 'select-pane', pane: 'specs' });
    app.controller.dispatch({ type: 'open-detail' });
    await app.flush();
    expect(app.controller.state.detail).toBeDefined();
    const detailScrollBefore = app.controller.state.detailScroll;
    const detailOverlay = target(app.renderer, 'detail-overlay');
    await app.mockMouse.scroll(...center(detailOverlay), 'down');
    await app.flush();
    expect(app.controller.state.detailScroll).toBeGreaterThan(detailScrollBefore);
    expect(app.controller.state.scroll.implementing).toBe(laneScrollBefore);
  });

  test('opens discoverable help and closes it with the same Escape convention as details', async () => {
    const app = await setup();
    const help = target(app.renderer, 'help-control');
    await app.mockMouse.click(...center(help));
    await app.flush();
    expect(app.controller.state.overlay).toBe('help');
    const frame = app.captureCharFrame();
    for (const text of ['Project sample-project', 'Ideas 1/2', 'Board navigation', 'Detail navigation', 'Exit and recovery', '←/→ or h/l', '↑/↓ or k/j', 'Page Up/Down', 'Enter', 'Esc', 'q', '--plain', 'READ ONLY']) {
      expect(frame).toContain(text);
    }
    app.mockInput.pressEscape();
    await app.flush();
    expect(app.controller.state.overlay).toBeNull();
  });

  test('shows concise feedback for lane movement and empty or boundary actions', async () => {
    const app = await setup();
    app.controller.dispatch({ type: 'select-pane', pane: 'proposed' });
    await app.flush();
    expect(app.captureCharFrame()).toContain('No items in Proposed');
    app.mockInput.pressArrow('down');
    await app.flush();
    expect(app.controller.state.announcement).toContain('no items');
    app.controller.dispatch({ type: 'select-pane', pane: 'implementing' });
    await app.flush();
    expect(app.captureCharFrame()).toContain('Implementing: item 1 of 2');
    app.controller.dispatch({ type: 'select-item', pane: 'implementing', index: 1 });
    await app.flush();
    expect(app.captureCharFrame()).toContain('Implementing: item 2 of 2');
    app.controller.dispatch({ type: 'open-detail' });
    await app.flush();
    expect(app.controller.state.announcement).toContain('Details opened');
    expect(app.captureCharFrame()).toContain('Implementing details');
    app.controller.dispatch({ type: 'close-overlay' });
    await app.flush();
    expect(app.captureCharFrame()).toContain('Implementing: item 2 of 2');
    app.mockInput.pressArrow('down');
    await app.flush();
    expect(app.controller.state.announcement).toContain('End of Implementing');
    expect(app.captureCharFrame()).toContain('End of Implementing');
  });

  test('renders actionable diagnostics without hiding readable board content', async () => {
    const model = fixture(1);
    model.diagnostics.push({ source: 'changes/broken', message: 'metadata must be a mapping' });
    const app = await setup(120, 30, 1, model);
    expect(app.captureCharFrame()).toContain('First idea');
    const issues = target(app.renderer, 'diagnostics-control');
    await app.mockMouse.click(...center(issues));
    await app.flush();
    const frame = app.captureCharFrame();
    expect(frame).toContain('Project sample-project • READ ONLY • Ideas 1/2');
    expect(frame).toContain('Problem: metadata must be a mapping');
    expect(frame).toContain('Consequence: This item may be missing or incomplete in the snapshot.');
    expect(frame).toContain('Next step: Run specbase validate');
  });

  test('applies stored detail offset to visibly long detail content', async () => {
    const model = fixture(1);
    model.specs[0].requirements = Array.from({ length: 30 }, (_, index) => `Requirement ${index + 1}`);
    model.specs[0].requirementCount = 30;
    const app = await setup(80, 20, 1, model);
    app.controller.dispatch({ type: 'select-pane', pane: 'specs' });
    app.controller.dispatch({ type: 'open-detail' });
    await app.flush();
    expect(app.captureCharFrame()).toContain('Requirement 1');
    for (let index = 0; index < 8; index++) app.controller.dispatch({ type: 'scroll-detail', delta: 1 });
    await app.flush();
    expect(app.controller.state.detailScroll).toBeGreaterThan(0);
    expect(app.captureCharFrame()).not.toContain('Requirement 1\n');
  });

  test('short layout keeps identity, focused content, help, and quit recovery', async () => {
    const app = await setup(70, 12, 1);
    const frame = app.captureCharFrame();
    expect(frame).toContain('sample-project');
    expect(frame).toContain('READ ONLY');
    expect(frame).toContain('Ideas 1/8');
    expect(frame).toContain('Ideas: item 1 of 2.');
    expect(frame).toContain('▶ First idea');
    expect(frame).toContain('[Details]');
    expect(frame).toContain('[Help]');
    expect(frame).toContain('[Quit]');
    expect(frame).not.toContain('Specs 1 • Reqs');
    app.controller.dispatch({ type: 'open-detail' });
    await app.flush();
    const detail = app.captureCharFrame();
    expect(detail).toContain('Project sample-project');
    expect(detail).toContain('READ ONLY');
    expect(detail).toContain('Close');
  });

  test('distinguishes a completed active card from an archived card with distinct non-color cues', async () => {
    const app = await setup(120, 30, 1);
    app.controller.dispatch({ type: 'select-pane', pane: 'reviewing' });
    await app.flush();
    const activeFrame = app.captureCharFrame();
    expect(activeFrame).toContain('Reviewing');
    expect(activeFrame).toContain('◉');
    expect(activeFrame).toContain('◉ Tasks: 3/3');
    expect(activeFrame).not.toContain('✓ Tasks: 3/3');

    app.controller.dispatch({ type: 'select-pane', pane: 'archived' });
    await app.flush();
    const archiveFrame = app.captureCharFrame();
    expect(archiveFrame).toContain('✓');
    expect(archiveFrame).toContain('✓ Tasks:');

    // Focus each footer control and verify it remains reachable
    for (const ctrlId of ['help-control', 'quit-control', 'details-control']) {
      const ctrl = target(app.renderer, ctrlId);
      await app.mockMouse.click(...center(ctrl));
      await app.flush();
      expect(() => target(app.renderer, ctrlId)).not.toThrow();
    }
  });
});
