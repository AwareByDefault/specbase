import {
  BoxRenderable,
  ScrollBoxRenderable,
  TextRenderable,
  RenderableEvents,
  type CliRenderer,
  type MouseEvent,
} from '@opentui/core';
import type { ViewBoardModel } from '../../core/view/model.js';
import {
  VIEW_PANES,
  createViewerState,
  keyboardCommand,
  mouseSelectCommand,
  mouseWheelCommand,
  paneLength,
  reduceViewerState,
  type ViewCommand,
  type ViewerState,
  type ViewPane,
} from '../../core/view/commands.js';

export interface ViewBoardController {
  readonly state: ViewerState;
  dispatch(command: ViewCommand): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

const LABELS: Record<ViewPane, string> = {
  ideas: 'Ideas',
  proposed: 'Proposed',
  enforcement: 'Enforcement',
  'ready-to-apply': 'Ready to Apply',
  implementing: 'Implementing',
  reviewing: 'Reviewing',
  archived: 'Archived',
  specs: 'Specs',
};

const NAV_LABELS: Record<ViewPane, string> = {
  ideas: 'Ideas',
  proposed: 'Proposed',
  enforcement: 'Enforcement',
  'ready-to-apply': 'Ready',
  implementing: 'Implementing',
  reviewing: 'Reviewing',
  archived: 'Archived',
  specs: 'Specs',
};

function paneItems(model: ViewBoardModel, pane: ViewPane): Array<{ id: string; title: string }> {
  if (pane === 'specs') return model.specs.map((spec) => ({ id: spec.id, title: spec.locator }));
  return model.lanes[pane].map((card) => ({ id: card.id, title: card.title }));
}

function cardDescription(model: ViewBoardModel, pane: ViewPane, index: number): string[] {
  if (pane === 'ideas') {
    const card = model.lanes.ideas[index];
    return card ? [`○ Idea: ${card.title}`, `ID: ${card.id}`, `Created: ${card.created ?? 'unknown'}`, `Files: ${card.members.join(', ') || 'none'}`] : [];
  }
  if (pane === 'archived') {
    const card = model.lanes.archived[index];
    return card ? [`✓ Archived change: ${card.title}`, `ID: ${card.id}`, `Archived: ${card.archived ?? 'unknown'}`, `✓ Tasks: ${card.tasks.completed}/${card.tasks.total}`] : [];
  }
  if (pane === 'specs') {
    const spec = model.specs[index];
    return spec ? [`▪ Specification: ${spec.locator}`, `ID: ${spec.id}`, `Requirements: ${spec.requirementCount}`, ...spec.requirements.map((title) => `• ${title}`), ...(spec.diagnostic ? [`⚠ ${spec.diagnostic}`] : [])] : [];
  }
  const card = model.lanes[pane][index];
  return card ? [`◉ ${LABELS[pane]} change: ${card.title}`, `ID: ${card.id}`, `Lifecycle: ${card.lifecycle}`, `○ Artifacts: ${card.artifacts.completed}/${card.artifacts.total}`, `◉ Tasks: ${card.tasks.completed}/${card.tasks.total}`] : [];
}

function summaryText(model: ViewBoardModel): string {
  const s = model.summary;
  return `Specs ${s.acceptedSpecs} • Reqs ${s.requirements} • Ideas ${s.openIdeas} • Proposed ${s.lanes.proposed} • Enforce ${s.lanes.enforcement} • Ready ${s.lanes['ready-to-apply']} • Doing ${s.lanes.implementing} • Review ${s.lanes.reviewing} • Archived ${s.lanes.archived} • Tasks ${s.completedTasks}/${s.totalTasks}`;
}

function diagnosticDescription(model: ViewBoardModel): string[] {
  return model.diagnostics.flatMap((item, index) => [
    `${index + 1}. ${item.source}`,
    `Problem: ${item.message}`,
    'Consequence: This item may be missing or incomplete in the snapshot.',
    'Next step: Run specbase validate, then use specbase view --plain for full project context.',
    '',
  ]);
}

const HELP_LINES = [
  'Board navigation',
  '  ←/→ or h/l     Previous/next lane',
  '  Tab/Shift-Tab  Next/previous lane',
  '  ↑/↓ or k/j     Previous/next item',
  '  Page Up/Down   Move by a page in the focused lane',
  '',
  'Detail navigation',
  '  Enter          View selected item details',
  '  ↑/↓ or k/j     Scroll detail content',
  '  Page Up/Down   Scroll detail content by a page',
  '  d              View diagnostics when present',
  '  ?              Open this help',
  '  Esc            Close help, diagnostics, or details',
  '',
  'Exit and recovery',
  '  q              Quit',
  '  --plain        Use deterministic non-interactive output',
  '',
  'READ ONLY • The lifecycle board never changes project files.',
];

export function createViewBoard(renderer: CliRenderer, model: ViewBoardModel, onQuit: () => void): ViewBoardController {
  let state = createViewerState(model, renderer.terminalWidth, renderer.terminalHeight);
  let destroyed = false;
  const app = new BoxRenderable(renderer, {
    id: 'view-board-root', width: '100%', height: '100%', flexDirection: 'column', backgroundColor: '#10141c',
  });
  renderer.root.add(app);

  const clear = () => {
    for (const child of [...app.getChildren()]) {
      app.remove(child);
      child.destroyRecursively();
    }
  };

  const dispatch = (command: ViewCommand) => {
    if (destroyed) return;
    const existingDetail = command.type === 'scroll-detail'
      ? renderer.root.findDescendantById('detail-content') as ScrollBoxRenderable | undefined
      : undefined;
    const effectiveCommand: ViewCommand = command.type === 'scroll-detail'
      ? { ...command, maximum: existingDetail ? Math.max(0, existingDetail.scrollHeight - existingDetail.height) : command.maximum }
      : command;
    state = reduceViewerState(state, effectiveCommand, model);
    if (state.quit) {
      onQuit();
      return;
    }
    if (effectiveCommand.type === 'scroll-detail') {
      if (existingDetail) {
        existingDetail.scrollTop = state.detailScroll;
        renderer.requestRender();
        return;
      }
    }
    render();
    renderer.requestRender();
  };

  const click = (command: ViewCommand, after?: ViewCommand) => {
    let armed = false;
    return {
      onMouseDown(event: MouseEvent) {
        if (event.button !== 0) return;
        armed = true;
        event.stopPropagation();
      },
      onMouseUp(event: MouseEvent) {
        if (!armed || event.button !== 0) return;
        armed = false;
        dispatch(command);
        if (after) dispatch(after);
        event.stopPropagation();
      },
    };
  };

  const addControl = (parent: BoxRenderable, id: string, label: string, command: ViewCommand, width: number) => {
    const box = new BoxRenderable(renderer, {
      id, width, height: 3, border: true, borderStyle: 'double', borderColor: '#b5bdca',
      focusedBorderColor: '#ffffff', focusable: true, justifyContent: 'center', alignItems: 'center',
      ...click(command),
    });
    box.borderStyle = 'single';
    box.on(RenderableEvents.FOCUSED, () => { box.borderStyle = 'double'; });
    box.on(RenderableEvents.BLURRED, () => { box.borderStyle = 'single'; });
    box.add(new TextRenderable(renderer, { content: label, selectable: false }));
    parent.add(box);
  };

  const addPane = (parent: BoxRenderable, pane: ViewPane, width: number | `${number}%`) => {
    const focused = state.pane === pane;
    const items = paneItems(model, pane);
    const paneBox = new ScrollBoxRenderable(renderer, {
      id: `pane:${pane}`,
      width,
      height: '100%',
      border: true,
      borderStyle: focused ? 'double' : 'single',
      borderColor: focused ? '#ffffff' : '#64748b',
      title: `${focused ? '▶ ' : ''}${LABELS[pane]} (${items.length}) • ${items.length ? `item ${state.selected[pane] + 1}/${items.length}` : 'empty'}`,
      titleColor: '#ffffff',
      flexDirection: 'column',
      scrollY: true,
      scrollX: false,
      padding: state.height < 15 ? 0 : 1,
      onMouseDown(event) {
        if (event.button === 0) dispatch({ type: 'select-pane', pane });
      },
      onMouseScroll(event) {
        if (event.scroll?.direction === 'up' || event.scroll?.direction === 'down') {
          dispatch(mouseWheelCommand(pane, event.scroll.direction));
          event.stopPropagation();
        }
      },
    });
    const start = state.scroll[pane];
    const reservedRows = state.height < 15 ? 6 : state.height < 20 ? 8 : 12;
    const visibleRows = Math.max(1, state.height - reservedRows);
    const visible = items.slice(start, start + visibleRows);
    if (!visible.length) {
      paneBox.add(new TextRenderable(renderer, {
        content: `No items in ${LABELS[pane]}.\nUse ←/→ or Prev/Next to choose another lane.`,
        selectable: false,
        height: 2,
      }));
    }
    visible.forEach((item, offset) => {
      const index = start + offset;
      const selected = focused && state.selected[pane] === index;
      const details = cardDescription(model, pane, index);
      if (state.height < 15) {
        paneBox.add(new TextRenderable(renderer, {
          id: `card-label:${pane}:${item.id}`,
          content: `${selected ? '▶' : ' '} ${item.title}`,
          selectable: false,
          height: 1,
        }));
        return;
      }
      const card = new BoxRenderable(renderer, {
        id: `card:${pane}:${item.id}`,
        width: '100%', height: 5, marginBottom: 1, border: true,
        borderStyle: selected ? 'double' : 'single',
        borderColor: selected ? '#ffffff' : '#76839a',
        focusable: true,
        flexDirection: 'column',
        paddingLeft: 1,
        ...click(mouseSelectCommand(pane, index)),
        onMouseScroll(event) {
          if (event.scroll?.direction === 'up' || event.scroll?.direction === 'down') {
            dispatch(mouseWheelCommand(pane, event.scroll.direction));
            event.stopPropagation();
          }
        },
      });
      const progressLines = details.filter((line) => line.startsWith('○ Artifacts:') || line.startsWith('◉ Tasks:') || line.startsWith('✓ Tasks:') || line.startsWith('Requirements:') || line.startsWith('Created:') || line.startsWith('Archived:') || line.startsWith('⚠'));
      const progressStr = progressLines.map((line) => `  ${line}`).join('\n');
      card.add(new TextRenderable(renderer, { id: `card-label:${pane}:${item.id}`, content: `${selected ? '▶' : ' '} ${item.title}\n${progressStr}`, selectable: false }));
      paneBox.add(card);
    });
    parent.add(paneBox);
  };

  const addScrollableOverlay = (id: string, title: string, lines: string[], closeId: string, closeCommand: ViewCommand) => {
    const overlay = new BoxRenderable(renderer, {
      id, position: 'absolute', zIndex: 100, left: 1, top: 1, right: 1, bottom: 1,
      border: true, borderStyle: 'double', borderColor: '#ffffff', title,
      backgroundColor: '#111827', flexDirection: 'column', padding: 1,
      onMouseScroll(event) {
        if (event.scroll?.direction === 'up' || event.scroll?.direction === 'down') {
          dispatch({ type: 'scroll-detail', delta: event.scroll.direction === 'up' ? -3 : 3 });
          event.stopPropagation();
        }
      },
    });
    const overlayPane = state.detail?.pane ?? state.pane;
    const overlayIndex = state.detail?.index ?? state.selected[overlayPane];
    const overlayCount = paneLength(model, overlayPane);
    const context = `Project ${model.project.name} • READ ONLY • ${LABELS[overlayPane]} ${overlayCount ? `${overlayIndex + 1}/${overlayCount}` : 'empty'}`;
    overlay.add(new TextRenderable(renderer, {
      id: 'overlay-context',
      content: context.length < Math.max(8, state.width - 8) ? context : `${context.slice(0, Math.max(1, state.width - 9))}…`,
      selectable: false,
      height: 1,
    }));
    const compactOverlay = state.width < 30;
    const controls = new BoxRenderable(renderer, { width: '100%', height: compactOverlay ? 6 : 3, flexDirection: 'row', flexWrap: compactOverlay ? 'wrap' : 'no-wrap', gap: compactOverlay ? 0 : 1 });
    addControl(controls, closeId, compactOverlay ? '[Close]' : '[Close Esc]', closeCommand, compactOverlay ? 9 : 13);
    addControl(controls, `${id}-quit`, compactOverlay ? '[Quit]' : '[Quit q]', { type: 'quit' }, compactOverlay ? 8 : 10);
    overlay.add(controls);
    const content = new ScrollBoxRenderable(renderer, { id: 'detail-content', width: '100%', flexGrow: 1, scrollY: true, border: true, padding: 1 });
    content.add(new TextRenderable(renderer, { content: lines.join('\n'), selectable: true }));
    overlay.add(content);
    app.add(overlay);
  };

  const renderOverlay = () => {
    if (state.detail) {
      const { pane, index } = state.detail;
      addScrollableOverlay('detail-overlay', `${LABELS[pane]} details`, cardDescription(model, pane, index), 'detail-close', { type: 'close-overlay' });
      return;
    }
    if (state.overlay === 'help') {
      addScrollableOverlay('help-overlay', 'Keyboard help • READ ONLY', HELP_LINES, 'overlay-close', { type: 'close-overlay' });
      return;
    }
    if (state.overlay === 'diagnostics') {
      addScrollableOverlay('diagnostics-overlay', `Diagnostics (${model.diagnostics.length})`, diagnosticDescription(model), 'overlay-close', { type: 'close-overlay' });
    }
  };

  const render = () => {
    clear();
    const short = state.height < 15;
    const terminalTooSmall = state.width < 30 || state.height < 12 || (state.width < 48 && state.height < 14);
    const innerWidth = Math.max(8, state.width - 4);
    const fit = (text: string, width = innerWidth) => text.length <= width ? text : `${text.slice(0, Math.max(1, width - 1))}…`;
    const navItems = VIEW_PANES.map((pane) => {
      const count = pane === 'specs' ? model.specs.length : model.lanes[pane].length;
      const label = `[${NAV_LABELS[pane]} ${count}]`;
      return { pane, label, width: label.length + 2 };
    });
    const requiredNavWidth = navItems.reduce((sum, item) => sum + item.width, 0) + navItems.length - 1;
    const singleLane = state.narrow || requiredNavWidth > state.width;
    const header = new BoxRenderable(renderer, {
      id: 'board-context', width: '100%', height: short ? 4 : 5, border: true, borderStyle: 'double', borderColor: '#ffffff',
      flexDirection: 'column', paddingLeft: 1,
      title: 'SPECBASE • Lifecycle Board',
    });
    const paneCount = paneLength(model, state.pane);
    const location = `${LABELS[state.pane]} ${VIEW_PANES.indexOf(state.pane) + 1}/${VIEW_PANES.length} • ${paneCount ? `item ${state.selected[state.pane] + 1}/${paneCount}` : 'no items'}`;
    const issues = model.diagnostics.length ? ` • Issues ${model.diagnostics.length}` : '';
    const compactProject = fit(model.project.name, Math.max(4, innerWidth - 20));
    const contextLine = `READ ONLY • Project ${compactProject}`;
    const announcementLine = fit(`${state.announcement}${issues}`);
    const headerContent = short
      ? `${fit(`${contextLine} • ${LABELS[state.pane]} ${VIEW_PANES.indexOf(state.pane) + 1}/${VIEW_PANES.length}`)}\n${announcementLine}`
      : singleLane
        ? `${fit(contextLine)}\n${fit(`Snapshot • ${location}`)}\n${announcementLine}`
        : `${fit(contextLine)}\n${fit(summaryText(model))}\n${fit(`${location} • ${state.announcement}${issues}`)}`;
    header.add(new TextRenderable(renderer, { content: headerContent, selectable: false }));
    app.add(header);

    if (terminalTooSmall) {
      app.add(new TextRenderable(renderer, {
        id: 'terminal-too-small',
        content: 'Terminal small\nResize ≥30×12\nq Quit',
        selectable: false,
        flexGrow: 1,
      }));
      renderOverlay();
      return;
    }

    if (singleLane || state.pane === 'specs') {
      const body = new BoxRenderable(renderer, { width: '100%', flexGrow: 1 });
      addPane(body, state.pane, '100%');
      app.add(body);
    } else {
      const nav = new BoxRenderable(renderer, { id: 'lane-nav', width: '100%', height: 3, flexDirection: 'row', gap: 1 });
      for (const item of navItems) {
        addControl(nav, `lane:${item.pane}`, item.label, { type: 'select-pane', pane: item.pane }, item.width);
      }
      app.add(nav);
      const body = new BoxRenderable(renderer, { width: '100%', flexGrow: 1 });
      addPane(body, state.pane, '100%');
      app.add(body);
    }

    const veryNarrow = state.width < 48;
    const footerHeight = veryNarrow ? 6 : short ? 3 : 5;
    const footer = new BoxRenderable(renderer, {
      id: 'board-controls', width: '100%', height: footerHeight, flexDirection: 'row', flexWrap: veryNarrow ? 'wrap' : 'no-wrap',
      border: !short && !veryNarrow, borderColor: '#64748b', padding: !short && !veryNarrow ? 1 : 0,
    });
    const compact = singleLane;
    addControl(footer, 'lane-prev', compact ? '[Prev]' : '[◀ Prev]', { type: 'focus-next', direction: -1 }, compact ? 8 : 10);
    addControl(footer, 'lane-next', compact ? '[Next]' : '[Next ▶]', { type: 'focus-next', direction: 1 }, compact ? 8 : 10);
    addControl(footer, 'details-control', compact ? '[Details]' : '[Details Enter]', { type: 'open-detail' }, compact ? 11 : 17);
    addControl(footer, 'help-control', compact ? '[Help]' : '[Help ?]', { type: 'open-help' }, compact ? 8 : 10);
    addControl(footer, 'quit-control', compact ? '[Quit]' : '[Quit q]', { type: 'quit' }, compact ? 8 : 10);
    if (model.diagnostics.length) {
      const issuesLabel = compact ? `[Issues ${model.diagnostics.length}]` : `[Issues ${model.diagnostics.length}]`;
      addControl(footer, 'diagnostics-control', issuesLabel, { type: 'open-diagnostics' }, issuesLabel.length + 2);
    }
    if (!singleLane) footer.add(new TextRenderable(renderer, { content: ` ${state.announcement}`, selectable: false }));
    app.add(footer);
    renderOverlay();
  };

  const onKey = (key: { name: string; shift: boolean; preventDefault(): void }) => {
    if (state.detail || state.overlay) {
      if (key.name === 'up' || key.name === 'k') {
        key.preventDefault();
        dispatch({ type: 'scroll-detail', delta: -1 });
        return;
      }
      if (key.name === 'down' || key.name === 'j') {
        key.preventDefault();
        dispatch({ type: 'scroll-detail', delta: 1 });
        return;
      }
      if (key.name === 'pageup' || key.name === 'pagedown') {
        key.preventDefault();
        dispatch({ type: 'scroll-detail', delta: key.name === 'pageup' ? -10 : 10 });
        return;
      }
      if (key.name === 'escape') {
        key.preventDefault();
        dispatch({ type: 'close-overlay' });
        return;
      }
      if (key.name === 'q') {
        key.preventDefault();
        dispatch({ type: 'quit' });
        return;
      }
    }
    const command = keyboardCommand(key);
    if (!command) return;
    key.preventDefault();
    dispatch(command);
  };
  renderer.keyInput.on('keypress', onKey);
  render();

  return {
    get state() { return state; },
    dispatch,
    resize(width, height) { dispatch({ type: 'resize', width, height }); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      renderer.keyInput.off('keypress', onKey);
      renderer.root.remove(app);
      app.destroyRecursively();
    },
  };
}
