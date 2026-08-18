import type { ViewBoardModel } from './model.js';

export const VIEW_PANES = ['ideas', 'changes', 'archives', 'specs'] as const;
export type ViewPane = (typeof VIEW_PANES)[number];

export type ViewCommand =
  | { type: 'focus-next'; direction: 1 | -1 }
  | { type: 'select-pane'; pane: ViewPane }
  | { type: 'select-item'; pane: ViewPane; index: number }
  | { type: 'move-item'; direction: 1 | -1 }
  | { type: 'scroll-pane'; pane: ViewPane; delta: number }
  | { type: 'scroll-detail'; delta: number }
  | { type: 'open-detail' }
  | { type: 'close-detail' }
  | { type: 'resize'; width: number; height: number }
  | { type: 'quit' };

export interface ViewerState {
  pane: ViewPane;
  selected: Record<ViewPane, number>;
  scroll: Record<ViewPane, number>;
  detail: { pane: ViewPane; index: number } | null;
  detailScroll: number;
  width: number;
  height: number;
  narrow: boolean;
  quit: boolean;
}

export function paneLength(model: ViewBoardModel, pane: ViewPane): number {
  return pane === 'specs' ? model.specs.length : model.columns[pane].length;
}

function clampedIndex(model: ViewBoardModel, pane: ViewPane, index: number): number {
  return Math.max(0, Math.min(Math.max(0, paneLength(model, pane) - 1), index));
}

function reconcileVisibility(state: ViewerState, model: ViewBoardModel): ViewerState {
  const viewportRows = Math.max(1, Math.floor((state.height - 12) / 5));
  const index = state.selected[state.pane];
  const current = state.scroll[state.pane];
  const next = index < current ? index : index >= current + viewportRows ? index - viewportRows + 1 : current;
  return { ...state, scroll: { ...state.scroll, [state.pane]: Math.max(0, next) } };
}

export function createViewerState(model: ViewBoardModel, width = 120, height = 30): ViewerState {
  const first = VIEW_PANES.find((pane) => paneLength(model, pane) > 0) ?? 'ideas';
  return {
    pane: first,
    selected: { ideas: 0, changes: 0, archives: 0, specs: 0 },
    scroll: { ideas: 0, changes: 0, archives: 0, specs: 0 },
    detail: null,
    detailScroll: 0,
    width,
    height,
    narrow: width < 78,
    quit: false,
  };
}

export function reduceViewerState(state: ViewerState, command: ViewCommand, model: ViewBoardModel): ViewerState {
  let next = state;
  switch (command.type) {
    case 'focus-next': {
      const current = VIEW_PANES.indexOf(state.pane);
      const pane = VIEW_PANES[(current + command.direction + VIEW_PANES.length) % VIEW_PANES.length];
      next = { ...state, pane, detail: null };
      break;
    }
    case 'select-pane':
      next = { ...state, pane: command.pane, detail: null };
      break;
    case 'select-item': {
      const index = clampedIndex(model, command.pane, command.index);
      next = { ...state, pane: command.pane, selected: { ...state.selected, [command.pane]: index } };
      break;
    }
    case 'move-item': {
      const index = clampedIndex(model, state.pane, state.selected[state.pane] + command.direction);
      next = { ...state, selected: { ...state.selected, [state.pane]: index } };
      break;
    }
    case 'scroll-pane': {
      const maximum = Math.max(0, paneLength(model, command.pane) - 1);
      const offset = Math.max(0, Math.min(maximum, state.scroll[command.pane] + command.delta));
      next = { ...state, pane: command.pane, scroll: { ...state.scroll, [command.pane]: offset } };
      break;
    }
    case 'scroll-detail':
      next = { ...state, detailScroll: Math.max(0, state.detailScroll + command.delta) };
      break;
    case 'open-detail':
      next = paneLength(model, state.pane) > 0 ? { ...state, detail: { pane: state.pane, index: state.selected[state.pane] }, detailScroll: 0 } : state;
      break;
    case 'close-detail':
      next = { ...state, detail: null, detailScroll: 0 };
      break;
    case 'resize': {
      const selected = { ...state.selected };
      for (const pane of VIEW_PANES) selected[pane] = clampedIndex(model, pane, selected[pane]);
      next = { ...state, width: command.width, height: command.height, narrow: command.width < 78, selected };
      break;
    }
    case 'quit':
      next = { ...state, quit: true };
      break;
  }
  return command.type === 'scroll-pane' ? next : reconcileVisibility(next, model);
}

export function keyboardCommand(key: { name: string; shift?: boolean }): ViewCommand | null {
  if (key.name === 'q') return { type: 'quit' };
  if (key.name === 'escape') return { type: 'close-detail' };
  if (key.name === 'return' || key.name === 'enter') return { type: 'open-detail' };
  if (key.name === 'tab') return { type: 'focus-next', direction: key.shift ? -1 : 1 };
  if (key.name === 'up' || key.name === 'k') return { type: 'move-item', direction: -1 };
  if (key.name === 'down' || key.name === 'j') return { type: 'move-item', direction: 1 };
  if (key.name === 'pageup') return { type: 'scroll-pane', pane: 'ideas' as ViewPane, delta: -10 };
  if (key.name === 'pagedown') return { type: 'scroll-pane', pane: 'ideas' as ViewPane, delta: 10 };
  if (key.name === 'left' || key.name === 'h') return { type: 'focus-next', direction: -1 };
  if (key.name === 'right' || key.name === 'l') return { type: 'focus-next', direction: 1 };
  return null;
}

export function mouseSelectCommand(pane: ViewPane, index: number): ViewCommand {
  return { type: 'select-item', pane, index };
}

export function mouseWheelCommand(pane: ViewPane, direction: 'up' | 'down'): ViewCommand {
  return { type: 'scroll-pane', pane, delta: direction === 'up' ? -3 : 3 };
}
