import type { ViewBoardModel } from './model.js';
import { VIEW_BOARD_VERSION } from './version.js';

export const VIEW_MODEL_FD = 3;
export const VIEW_PROTOCOL_DATA_ERROR = 65;
export const VIEW_PROTOCOL_IO_ERROR = 74;
export const VIEW_RENDERER_ERROR = 70;
export const MIN_BUN_VERSION = { major: 1, minor: 3 } as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function array(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function progress(value: unknown): boolean {
  return isRecord(value) && Number.isInteger(value.completed) && Number.isInteger(value.total) && Number(value.completed) >= 0 && Number(value.total) >= Number(value.completed);
}

const LIFECYCLE_KEYS = ['proposed', 'enforcement', 'ready-to-apply', 'implementing', 'reviewing', 'archived'] as const;

export function validateViewBoardModel(value: unknown): value is ViewBoardModel {
  if (!isRecord(value) || value.version !== VIEW_BOARD_VERSION || !isRecord(value.project) || !isRecord(value.summary) || !isRecord(value.lanes)) return false;
  if (typeof value.project.name !== 'string' || !value.project.name.trim()) return false;
  const summary = value.summary;
  const lanes = value.lanes;
  if (!Number.isInteger(summary.acceptedSpecs) || Number(summary.acceptedSpecs) < 0) return false;
  if (!Number.isInteger(summary.requirements) || Number(summary.requirements) < 0) return false;
  if (!Number.isInteger(summary.openIdeas) || Number(summary.openIdeas) < 0) return false;
  if (!Number.isInteger(summary.completedTasks) || Number(summary.completedTasks) < 0) return false;
  if (!Number.isInteger(summary.totalTasks) || Number(summary.totalTasks) < 0) return false;
  const laneSummary = summary.lanes;
  if (!isRecord(laneSummary) || !LIFECYCLE_KEYS.every((key) => Number.isInteger(laneSummary[key]) && Number(laneSummary[key]) >= 0)) return false;
  if (!array(lanes.ideas) || !array(lanes.proposed) || !array(lanes.enforcement) || !array(lanes['ready-to-apply']) || !array(lanes.implementing) || !array(lanes.reviewing) || !array(lanes.archived) || !array(value.specs) || !array(value.diagnostics)) return false;
  const base = (card: unknown, kind: string) => isRecord(card) && card.kind === kind && typeof card.id === 'string' && typeof card.title === 'string';
  if (!lanes.ideas.every((card) => {
    if (!base(card, 'idea')) return false;
    const c = card as Record<string, unknown>;
    if (!array(c.members)) return false;
    if (c.created !== null && typeof c.created !== 'string') return false;
    return (c.members as unknown[]).every((m: unknown) => typeof m === 'string');
  })) return false;
  const changeLanes = [
    ['proposed', lanes.proposed],
    ['enforcement', lanes.enforcement],
    ['ready-to-apply', lanes['ready-to-apply']],
    ['implementing', lanes.implementing],
    ['reviewing', lanes.reviewing],
  ] as const;
  if (!changeLanes.every(([expectedLifecycle, lane]) => lane.every((card) => {
    if (!base(card, 'change') || !progress((card as Record<string, unknown>).artifacts) || !progress((card as Record<string, unknown>).tasks)) return false;
    const c = card as Record<string, unknown>;
    if (c.created !== null && typeof c.created !== 'string') return false;
    return c.lifecycle === expectedLifecycle;
  }))) return false;
  if (!lanes.archived.every((card) => {
    if (!base(card, 'archive') || !progress((card as Record<string, unknown>).tasks)) return false;
    const c = card as Record<string, unknown>;
    if (c.archived !== null && typeof c.archived !== 'string') return false;
    return true;
  })) return false;
  if (!value.specs.every((card) => {
    if (!base(card, 'spec') || typeof (card as Record<string, unknown>).locator !== 'string') return false;
    const c = card as Record<string, unknown>;
    if (!Number.isInteger(c.requirementCount) || Number(c.requirementCount) < 0) return false;
    if (!array(c.requirements) || !c.requirements.every((r: unknown) => typeof r === 'string')) return false;
    if (c.diagnostic !== null && typeof c.diagnostic !== 'string') return false;
    return true;
  })) return false;
  return value.diagnostics.every((diagnostic) => isRecord(diagnostic) && typeof diagnostic.source === 'string' && typeof diagnostic.message === 'string');
}

export function decodeViewModelFrame(bytes: Uint8Array): ViewBoardModel {
  if (bytes.byteLength === 0) throw new Error('fd 3 model frame is empty');
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('fd 3 model frame is not valid UTF-8');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('fd 3 model frame is not exactly one valid JSON value');
  }
  if (!isRecord(parsed) || parsed.version !== VIEW_BOARD_VERSION) {
    throw new Error(`unsupported view model version (expected ${VIEW_BOARD_VERSION})`);
  }
  if (!validateViewBoardModel(parsed)) throw new Error('fd 3 model frame does not match the view board schema');
  return parsed;
}

export function bunVersionSupported(version: string): boolean {
  const match = version.trim().match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > MIN_BUN_VERSION.major || (major === MIN_BUN_VERSION.major && minor >= MIN_BUN_VERSION.minor);
}

export function signalExitCode(signal: NodeJS.Signals): number {
  const numbers: Partial<Record<NodeJS.Signals, number>> = {
    SIGHUP: 1, SIGINT: 2, SIGQUIT: 3, SIGILL: 4, SIGTRAP: 5, SIGABRT: 6,
    SIGBUS: 7, SIGFPE: 8, SIGKILL: 9, SIGUSR1: 10, SIGSEGV: 11,
    SIGUSR2: 12, SIGPIPE: 13, SIGALRM: 14, SIGTERM: 15,
  };
  return 128 + (numbers[signal] ?? 1);
}
