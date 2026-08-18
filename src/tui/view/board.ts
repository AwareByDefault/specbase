import {
  BoxRenderable,
  ScrollBoxRenderable,
  TextRenderable,
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
  ideas: 'Open Ideas',
  changes: 'Active Changes',
  archives: 'Archived Changes',
  specs: 'Specifications',
};

function paneItems(model: ViewBoardModel, pane: ViewPane): Array<{ id: string; title: string }> {
  if (pane === 'specs') return model.specs.map((spec) => ({ id: spec.id, title: spec.locator }));
  return model.columns[pane].map((card) => ({ id: card.id, title: card.title }));
}

function cardDescription(model: ViewBoardModel, pane: ViewPane, index: number): string[] {
  if (pane === 'ideas') {
    const card = model.columns.ideas[index];
    return card ? [`○ Idea: ${card.title}`, `ID: ${card.id}`, `Created: ${card.created ?? 'unknown'}`, `Files: ${card.members.join(', ') || 'none'}`] : [];
  }
  if (pane === 'changes') {
    const card = model.columns.changes[index];
    return card ? [`◉ Active change: ${card.title}`, `ID: ${card.id}`, `○ Artifacts: ${card.artifacts.completed}/${card.artifacts.total}`, `◉ Tasks: ${card.tasks.completed}/${card.tasks.total}`, 'Lifecycle: ACTIVE (completion does not archive)'] : [];
  }
  if (pane === 'archives') {
    const card = model.columns.archives[index];
    return card ? [`✓ Archived change: ${card.title}`, `ID: ${card.id}`, `Archived: ${card.archived ?? 'unknown'}`, `✓ Tasks: ${card.tasks.completed}/${card.tasks.total}`] : [];
  }
  const spec = model.specs[index];
  return spec ? [`▪ Specification: ${spec.locator}`, `ID: ${spec.id}`, `Requirements: ${spec.requirementCount}`, ...spec.requirements.map((title) => `• ${title}`), ...(spec.diagnostic ? [`⚠ ${spec.diagnostic}`] : [])] : [];
}

function summaryText(model: ViewBoardModel): string {
  const s = model.summary;
  return `Specs ${s.acceptedSpecs} • Requirements ${s.requirements} • Ideas ${s.openIdeas} • Active ${s.activeChanges} • Archives ${s.archivedChanges} • Tasks ${s.completedTasks}/${s.totalTasks}`;
}

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
    state = reduceViewerState(state, command, model);
    if (state.quit) {
      onQuit();
      return;
    }
    render();
    renderer.requestRender();
  };

  const click = (command: ViewCommand, open = false) => {
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
        if (open) dispatch({ type: 'open-detail' });
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
      title: `${focused ? '▶ ' : ''}${LABELS[pane]} (${items.length})`,
      titleColor: '#ffffff',
      flexDirection: 'column',
      scrollY: true,
      scrollX: false,
      padding: 1,
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
    const visibleRows = Math.max(1, state.height - 12);
    const visible = items.slice(start, start + visibleRows);
    if (!visible.length) paneBox.add(new TextRenderable(renderer, { content: '  (none)', selectable: false, height: 1 }));
    visible.forEach((item, offset) => {
      const index = start + offset;
      const selected = focused && state.selected[pane] === index;
      const details = cardDescription(model, pane, index);
      const card = new BoxRenderable(renderer, {
        id: `card:${pane}:${item.id}`,
        width: '100%', height: 4, marginBottom: 1, border: true,
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
      const progressLines = details.filter((line) => line.startsWith('○ Artifacts:') || line.startsWith('◉ Tasks:') || line.startsWith('✓ Tasks:') || line.startsWith('Artifacts:') || line.startsWith('Tasks:') || line.startsWith('Requirements:') || line.startsWith('Created:') || line.startsWith('Archived:') || line.startsWith('⚠'));
      const progressStr = progressLines.length > 0 ? `  ${progressLines.slice(0, 2).join('  ')}` : '';
      card.add(new TextRenderable(renderer, { id: `card-label:${pane}:${item.id}`, content: `${selected ? '▶' : ' '} ${item.title}\n${progressStr}    [Open Enter]`, selectable: false }));
      paneBox.add(card);
    });
    parent.add(paneBox);
  };

  const renderDetail = () => {
    if (!state.detail) return;
    const { pane, index } = state.detail;
    const overlay = new BoxRenderable(renderer, {
      id: 'detail-overlay', position: 'absolute', zIndex: 100, left: 1, top: 1, right: 1, bottom: 1,
      border: true, borderStyle: 'double', borderColor: '#ffffff', title: `${LABELS[pane]} detail`,
      backgroundColor: '#111827', flexDirection: 'column', padding: 1,
      onMouseScroll(event) {
        if (event.scroll?.direction === 'up' || event.scroll?.direction === 'down') {
          dispatch({ type: 'scroll-detail', delta: event.scroll.direction === 'up' ? -3 : 3 });
          event.stopPropagation();
        }
      },
    });
    const controls = new BoxRenderable(renderer, { width: '100%', height: 3, flexDirection: 'row', gap: 1 });
    addControl(controls, 'detail-close', '[Close Esc]', { type: 'close-detail' }, 13);
    addControl(controls, 'detail-quit', '[Quit q]', { type: 'quit' }, 10);
    overlay.add(controls);
    const content = new ScrollBoxRenderable(renderer, { id: 'detail-content', width: '100%', flexGrow: 1, scrollY: true, border: true, padding: 1 });
    content.add(new TextRenderable(renderer, { content: cardDescription(model, pane, index).join('\n'), selectable: true }));
    overlay.add(content);
    app.add(overlay);
  };

  const render = () => {
    clear();
    const header = new BoxRenderable(renderer, { width: '100%', height: 5, border: true, borderStyle: 'double', borderColor: '#ffffff', flexDirection: 'column', paddingLeft: 1, title: 'SPECBASE • Viewer-only Lifecycle Board' });
    header.add(new TextRenderable(renderer, { content: `${summaryText(model)}${model.diagnostics.length ? ` • Diagnostics: ${model.diagnostics.length}` : ``}\nMouse: click / wheel • Keys: Tab or ←→ pane, ↑↓ item, Enter open, Esc close, q quit`, selectable: false }));
    app.add(header);

    if (state.narrow) {
      const prevLabel = '[◀ Prev]';
      const nextLabel = '[Next ▶]';
      const quitLabel = '[Quit q]';
      const prevWidth = prevLabel.length + 2;
      const nextWidth = nextLabel.length + 2;
      const quitWidth = quitLabel.length + 2;
      const centerMin = 8;
      const gaps = 3; // 3 gaps between 4 controls
      const available = Math.max(20, state.width - 2);
      const centerWidth = Math.max(centerMin, available - prevWidth - nextWidth - quitWidth - gaps);

      const controls = new BoxRenderable(renderer, { id: 'narrow-controls', width: '100%', height: 3, flexDirection: 'row', gap: 1 });
      addControl(controls, 'column-prev', prevLabel, { type: 'focus-next', direction: -1 }, prevWidth);
      controls.add(new TextRenderable(renderer, { content: `${LABELS[state.pane]} ${VIEW_PANES.indexOf(state.pane) + 1}/${VIEW_PANES.length}`, width: Math.max(centerMin, centerWidth), selectable: false }));
      addControl(controls, 'column-next', nextLabel, { type: 'focus-next', direction: 1 }, nextWidth);
      addControl(controls, 'board-quit', quitLabel, { type: 'quit' }, quitWidth);
      app.add(controls);
      const body = new BoxRenderable(renderer, { width: '100%', flexGrow: 1 });
      addPane(body, state.pane, '100%');
      app.add(body);
    } else if (state.pane === 'specs') {
      const body = new BoxRenderable(renderer, { width: '100%', flexGrow: 1, flexDirection: 'row', gap: 1 });
      addPane(body, 'specs', '100%');
      app.add(body);
    } else {
      const body = new BoxRenderable(renderer, { id: 'lifecycle-columns', width: '100%', flexGrow: 1, flexDirection: 'row', gap: 1 });
      addPane(body, 'ideas', '33%');
      addPane(body, 'changes', '34%');
      addPane(body, 'archives', '33%');
      app.add(body);
    }
    const footer = new BoxRenderable(renderer, { width: '100%', height: 5, flexDirection: 'row', border: true, borderColor: '#64748b', padding: 1 });
    addControl(footer, 'ideas-control', 'Ideas', { type: 'select-pane', pane: 'ideas' }, 7);
    addControl(footer, 'changes-control', 'Changes', { type: 'select-pane', pane: 'changes' }, 9);
    addControl(footer, 'archives-control', 'Archives', { type: 'select-pane', pane: 'archives' }, 10);
    addControl(footer, 'specs-control', `[Specs ${model.specs.length}]`, { type: 'select-pane', pane: 'specs' }, 13);
    addControl(footer, 'open-control', '[Open Enter]', { type: 'open-detail' }, 14);
    addControl(footer, 'quit-control', '[Quit q]', { type: 'quit' }, 10);
    footer.add(new TextRenderable(renderer, { content: ' READ ONLY', selectable: false }));
    app.add(footer);
    renderDetail();
  };

  const onKey = (key: { name: string; shift: boolean; preventDefault(): void }) => {
    if (state.detail) {
      // When detail is open, route movement keys to detail scrolling
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
      if (key.name === 'pageup') {
        key.preventDefault();
        dispatch({ type: 'scroll-detail', delta: -10 });
        return;
      }
      if (key.name === 'pagedown') {
        key.preventDefault();
        dispatch({ type: 'scroll-detail', delta: 10 });
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
