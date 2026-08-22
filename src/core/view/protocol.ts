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

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function progress(value: unknown): boolean {
  return isRecord(value) && Number.isInteger(value.completed) && Number.isInteger(value.total) && Number(value.completed) >= 0 && Number(value.total) >= Number(value.completed);
}

function stack(value: unknown): boolean {
  return isRecord(value)
    && hasOnlyKeys(value, ['id', 'position', 'total'])
    && typeof value.id === 'string' && value.id.trim().length > 0
    && Number.isInteger(value.position) && Number(value.position) > 0
    && Number.isInteger(value.total) && Number(value.total) > 0
    && Number(value.position) <= Number(value.total);
}

function pullRequestIdentity(value: Record<string, unknown>): boolean {
  return Number.isInteger(value.number) && Number(value.number) > 0
    && typeof value.url === 'string' && URL.canParse(value.url)
    && ['repository', 'base', 'head', 'runId'].every((key) => typeof value[key] === 'string' && String(value[key]).length > 0)
    && typeof value.headSha === 'string' && /^[0-9a-f]{40}$/.test(value.headSha);
}

function pullRequest(value: unknown): boolean {
  return isRecord(value)
    && hasOnlyKeys(value, ['number', 'url', 'repository', 'base', 'head', 'headSha', 'runId', 'state'])
    && pullRequestIdentity(value)
    && (value.state === 'draft' || value.state === 'ready');
}

function legacyDraftPullRequest(value: unknown): boolean {
  return isRecord(value)
    && hasOnlyKeys(value, ['number', 'url', 'repository', 'base', 'head', 'headSha', 'runId'])
    && pullRequestIdentity(value);
}

const LIFECYCLE_KEYS = ['proposed', 'enforcement', 'ready-to-apply', 'implementing', 'reviewing', 'archived'] as const;
const BOARD_KEYS = ['version', 'project', 'summary', 'lanes', 'diagnostics'] as const;
const SUMMARY_KEYS = ['openIdeas', 'lanes', 'completedTasks', 'totalTasks'] as const;
const LANE_KEYS = ['ideas', ...LIFECYCLE_KEYS] as const;

/** Validate the isolated fd-3 renderer payload without importing headless store code. */
export function validateViewBoardModel(value: unknown): value is ViewBoardModel {
  if (!isRecord(value) || value.version !== VIEW_BOARD_VERSION || !hasOnlyKeys(value, BOARD_KEYS)
    || !isRecord(value.project) || !isRecord(value.summary) || !isRecord(value.lanes)) return false;
  if (typeof value.project.name !== 'string' || !value.project.name.trim()) return false;
  const summary = value.summary;
  const lanes = value.lanes;
  if (!hasOnlyKeys(summary, SUMMARY_KEYS)
    || !Number.isInteger(summary.openIdeas) || Number(summary.openIdeas) < 0
    || !Number.isInteger(summary.completedTasks) || Number(summary.completedTasks) < 0
    || !Number.isInteger(summary.totalTasks) || Number(summary.totalTasks) < 0) return false;
  const laneSummary = summary.lanes;
  if (!isRecord(laneSummary) || !hasOnlyKeys(laneSummary, LIFECYCLE_KEYS)
    || !LIFECYCLE_KEYS.every((key) => Number.isInteger(laneSummary[key]) && Number(laneSummary[key]) >= 0)) return false;
  if (!hasOnlyKeys(lanes, LANE_KEYS)
    || !array(lanes.ideas) || !array(lanes.proposed) || !array(lanes.enforcement)
    || !array(lanes['ready-to-apply']) || !array(lanes.implementing) || !array(lanes.reviewing)
    || !array(lanes.archived) || !array(value.diagnostics)) return false;
  const base = (card: unknown, kind: string) => isRecord(card)
    && card.kind === kind
    && typeof card.id === 'string'
    && typeof card.title === 'string'
    && (card.stack === undefined || stack(card.stack));
  if (!lanes.ideas.every((card) => {
    if (!base(card, 'idea')) return false;
    const c = card as Record<string, unknown>;
    return array(c.members)
      && (c.created === null || typeof c.created === 'string')
      && c.members.every((member: unknown) => typeof member === 'string');
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
    return (c.created === null || typeof c.created === 'string')
      && c.lifecycle === expectedLifecycle
      && (c.pullRequest === undefined || pullRequest(c.pullRequest))
      && (c.draftPullRequest === undefined || legacyDraftPullRequest(c.draftPullRequest))
      && !(c.pullRequest !== undefined && c.draftPullRequest !== undefined)
      && (expectedLifecycle === 'reviewing'
        ? (isRecord(c.pullRequest) && c.pullRequest.state === 'ready') || legacyDraftPullRequest(c.draftPullRequest)
        : !isRecord(c.pullRequest) || c.pullRequest.state !== 'ready');
  }))) return false;
  if (!lanes.archived.every((card) => {
    if (!base(card, 'archive') || !progress((card as Record<string, unknown>).tasks)) return false;
    const c = card as Record<string, unknown>;
    return (c.archived === null || typeof c.archived === 'string')
      && (c.pullRequest === undefined || pullRequest(c.pullRequest));
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
