import type { ViewBoardModel } from './model.js';

export const VIEW_PANES = ['ideas', 'proposed', 'enforcement', 'ready-to-apply', 'implementing', 'reviewing', 'archived', 'specs'] as const;
export type ViewPane = (typeof VIEW_PANES)[number];
export type ViewerOverlay = 'help' | 'diagnostics';

const PANE_LABELS: Record<ViewPane, string> = {
  ideas: 'Ideas',
  proposed: 'Proposed',
  enforcement: 'Enforcement',
  'ready-to-apply': 'Ready to Apply',
  implementing: 'Implementing',
  reviewing: 'Reviewing',
  archived: 'Archived',
  specs: 'Specifications',
};

export type ViewCommand =
  | { type: 'focus-next'; direction: 1 | -1 }
  | { type: 'select-pane'; pane: ViewPane }
  | { type: 'select-item'; pane: ViewPane; index: number }
  | { type: 'move-item'; direction: 1 | -1 }
  | { type: 'page-item'; direction: 1 | -1 }
  | { type: 'scroll-pane'; pane: ViewPane; delta: number }
  | { type: 'scroll-detail'; delta: number; maximum?: number }
  | { type: 'open-detail' }
  | { type: 'open-help' }
  | { type: 'open-diagnostics' }
  | { type: 'close-overlay' }
  | { type: 'resize'; width: number; height: number }
  | { type: 'quit' };

export interface ViewerState {
  pane: ViewPane;
  selected: Record<ViewPane, number>;
  scroll: Record<ViewPane, number>;
  detail: { pane: ViewPane; index: number } | null;
  overlay: ViewerOverlay | null;
  detailScroll: number;
  announcement: string;
  width: number;
  height: number;
  narrow: boolean;
  quit: boolean;
}

export function paneLength(model: ViewBoardModel, pane: ViewPane): number {
  return pane === 'specs' ? model.specs.length : model.lanes[pane].length;
}

function clampedIndex(model: ViewBoardModel, pane: ViewPane, index: number): number {
  return Math.max(0, Math.min(Math.max(0, paneLength(model, pane) - 1), index));
}

function location(model: ViewBoardModel, pane: ViewPane, index: number): string {
  const count = paneLength(model, pane);
  return count === 0 ? `${PANE_LABELS[pane]}: no items.` : `${PANE_LABELS[pane]}: item ${index + 1} of ${count}.`;
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
    selected: Object.fromEntries(VIEW_PANES.map((pane) => [pane, 0])) as Record<ViewPane, number>,
    scroll: Object.fromEntries(VIEW_PANES.map((pane) => [pane, 0])) as Record<ViewPane, number>,
    detail: null,
    overlay: null,
    detailScroll: 0,
    announcement: location(model, first, 0),
    width,
    height,
    narrow: width < 104,
    quit: false,
  };
}

export function reduceViewerState(state: ViewerState, command: ViewCommand, model: ViewBoardModel): ViewerState {
  let next = state;
  switch (command.type) {
    case 'focus-next': {
      const current = VIEW_PANES.indexOf(state.pane);
      const pane = VIEW_PANES[(current + command.direction + VIEW_PANES.length) % VIEW_PANES.length];
      next = { ...state, pane, detail: null, overlay: null, detailScroll: 0, announcement: location(model, pane, state.selected[pane]) };
      break;
    }
    case 'select-pane':
      next = { ...state, pane: command.pane, detail: null, overlay: null, detailScroll: 0, announcement: location(model, command.pane, state.selected[command.pane]) };
      break;
    case 'select-item': {
      const index = clampedIndex(model, command.pane, command.index);
      next = {
        ...state,
        pane: command.pane,
        selected: { ...state.selected, [command.pane]: index },
        announcement: location(model, command.pane, index),
      };
      break;
    }
    case 'move-item':
    case 'page-item': {
      const count = paneLength(model, state.pane);
      if (count === 0) {
        next = { ...state, announcement: `${PANE_LABELS[state.pane]} has no items. Use left or right to choose another lane.` };
        break;
      }
      const step = command.type === 'page-item' ? 10 : 1;
      const current = state.selected[state.pane];
      const index = clampedIndex(model, state.pane, current + command.direction * step);
      const announcement = index === current
        ? `${current === 0 ? 'Start' : 'End'} of ${PANE_LABELS[state.pane]}; item ${current + 1} of ${count}.`
        : location(model, state.pane, index);
      next = { ...state, selected: { ...state.selected, [state.pane]: index }, announcement };
      break;
    }
    case 'scroll-pane': {
      const maximum = Math.max(0, paneLength(model, command.pane) - 1);
      const current = state.scroll[command.pane];
      const offset = Math.max(0, Math.min(maximum, current + command.delta));
      const boundary = offset === current
        ? `${command.delta < 0 ? 'Start' : 'End'} of ${PANE_LABELS[command.pane]} list.`
        : `${PANE_LABELS[command.pane]} list scrolled.`;
      next = {
        ...state,
        pane: command.pane,
        scroll: { ...state.scroll, [command.pane]: offset },
        announcement: paneLength(model, command.pane) === 0
          ? `${PANE_LABELS[command.pane]} has no items. Use left or right to choose another lane.`
          : boundary,
      };
      break;
    }
    case 'scroll-detail': {
      const maximum = Math.max(0, command.maximum ?? Number.MAX_SAFE_INTEGER);
      const offset = Math.max(0, Math.min(maximum, state.detailScroll + command.delta));
      next = {
        ...state,
        detailScroll: offset,
        announcement: offset === state.detailScroll
          ? `${command.delta < 0 ? 'Start' : 'End'} of details.`
          : 'Details scrolled.',
      };
      break;
    }
    case 'open-detail':
      next = paneLength(model, state.pane) > 0
        ? {
            ...state,
            detail: { pane: state.pane, index: state.selected[state.pane] },
            overlay: null,
            detailScroll: 0,
            announcement: `Details opened for ${PANE_LABELS[state.pane]} item ${state.selected[state.pane] + 1}.`,
          }
        : { ...state, announcement: `${PANE_LABELS[state.pane]} has no item to inspect.` };
      break;
    case 'open-help':
      next = { ...state, detail: null, overlay: 'help', detailScroll: 0, announcement: 'Keyboard help opened.' };
      break;
    case 'open-diagnostics':
      next = model.diagnostics.length
        ? { ...state, detail: null, overlay: 'diagnostics', detailScroll: 0, announcement: `Diagnostics opened; ${model.diagnostics.length} issue${model.diagnostics.length === 1 ? '' : 's'}.` }
        : { ...state, announcement: 'No diagnostics are present in this snapshot.' };
      break;
    case 'close-overlay':
      next = { ...state, detail: null, overlay: null, detailScroll: 0, announcement: location(model, state.pane, state.selected[state.pane]) };
      break;
    case 'resize': {
      const selected = { ...state.selected };
      for (const pane of VIEW_PANES) selected[pane] = clampedIndex(model, pane, selected[pane]);
      next = { ...state, width: command.width, height: command.height, narrow: command.width < 104, selected };
      break;
    }
    case 'quit':
      next = { ...state, quit: true };
      break;
  }
  return command.type === 'scroll-pane' || command.type === 'scroll-detail' ? next : reconcileVisibility(next, model);
}

export function keyboardCommand(key: { name: string; shift?: boolean }): ViewCommand | null {
  if (key.name === 'q') return { type: 'quit' };
  if (key.name === 'escape') return { type: 'close-overlay' };
  if (key.name === '?' || key.name === 'question') return { type: 'open-help' };
  if (key.name === 'd') return { type: 'open-diagnostics' };
  if (key.name === 'return' || key.name === 'enter') return { type: 'open-detail' };
  if (key.name === 'tab') return { type: 'focus-next', direction: key.shift ? -1 : 1 };
  if (key.name === 'up' || key.name === 'k') return { type: 'move-item', direction: -1 };
  if (key.name === 'down' || key.name === 'j') return { type: 'move-item', direction: 1 };
  if (key.name === 'pageup') return { type: 'page-item', direction: -1 };
  if (key.name === 'pagedown') return { type: 'page-item', direction: 1 };
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
