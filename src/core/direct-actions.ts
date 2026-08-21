import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';

import { resolveLifecycleSnapshot, type LifecycleSnapshot, type ResolvedLifecycleSnapshot } from './lifecycle-snapshot.js';
import { resolvePlanningDirName } from './planning-dir.js';
import { getChangeStackContext, type ChangeStackContext } from './change-stacks/context.js';
import { resolveSchema } from './artifact-graph/resolver.js';
import { resolveSpecModel } from './artifact-graph/types.js';
import { resolveRegisteredStore } from './store/registry.js';
import { Validator } from './validation/validator.js';
import { FileSystemUtils } from '../utils/file-system.js';

/** Version of the supported direct-action catalogue contract. */
export const DIRECT_ACTION_CATALOG_VERSION = 1 as const;

export type DirectActionId =
  | 'explore'
  | 'propose-feature'
  | 'explore-enforcement'
  | 'propose-enforcement'
  | 'apply'
  | 'deliver-local'
  | 'review'
  | 'open-draft-pr'
  | 'archive';

export type DirectActionSkillId =
  | 'specbase-explore'
  | 'specbase-propose'
  | 'specbase-explore-enforce'
  | 'specbase-propose-enforce'
  | 'specbase-apply-change'
  | 'specbase-review-panel'
  | 'specbase-archive-change';

export type DirectActionCapabilityId = 'specbase.local-delivery' | 'specbase.draft-pr-delivery';
export type DirectActionDispatchKind = 'skill' | 'capability';
export type DirectActionAvailability = 'available' | 'blocked';
export type DirectActionTargetPosition = 'idea' | 'active' | 'archived';

export interface DirectActionTarget {
  storeId: string | null;
  workItemId: string;
  position: DirectActionTargetPosition;
}

export interface DirectActionBlocker {
  code: string;
  message: string;
  remediation: string;
}

export interface DirectActionDiagnostic {
  code: string;
  target: { storeId: string | null; workItemId: string | null };
  actionId?: string;
  message: string;
  remediation: string;
}

export interface SkillDispatchContext {
  kind: 'skill';
  skillId: DirectActionSkillId;
  arguments:
    | { workItemId: string; storeId?: string }
    | { workItemId: string; fromIdea: true; storeId?: string }
    | { changeId: string; storeId?: string };
}

export interface CapabilityDispatchContext {
  kind: 'capability';
  capabilityId: DirectActionCapabilityId;
  arguments: { changeId: string; storeId?: string };
}

export type DirectActionDispatchContext = SkillDispatchContext | CapabilityDispatchContext;

export interface DirectActionDescriptor {
  actionId: DirectActionId;
  label: string;
  availability: DirectActionAvailability;
  blocker: DirectActionBlocker | null;
  dispatch: DirectActionDispatchContext;
}

export interface DirectActionCatalog {
  version: typeof DIRECT_ACTION_CATALOG_VERSION;
  target: DirectActionTarget | null;
  actions: DirectActionDescriptor[];
  diagnostics: DirectActionDiagnostic[];
}

export interface GetDirectActionsOptions {
  /** Repository root, or the current directory when omitted. */
  root?: string;
  /** Immutable metadata ID; labels and board-card IDs are never accepted. */
  workItemId: string;
  /** Optional registered store identity. When set it is resolved afresh. */
  storeId?: string;
  /** Testable override for the store registry location. */
  globalDataDir?: string;
}

/** The minimal client-held selection validated immediately before dispatch. */
export interface DirectActionIntent {
  version: number;
  storeId: string | null;
  workItemId: string;
  actionId: DirectActionId;
  dispatchKind: DirectActionDispatchKind;
}

export type DirectActionIntentValidation =
  | { accepted: true; descriptor: DirectActionDescriptor; diagnostics: [] }
  | { accepted: false; descriptor: null; diagnostics: DirectActionDiagnostic[] };

interface ChangeFacts {
  snapshot: LifecycleSnapshot;
  resolved: ResolvedLifecycleSnapshot;
  stack: ChangeStackContext | null;
  strictValid: boolean;
  governed: boolean;
  featureComplete: boolean;
  enforcementComplete: boolean;
}

type TargetFacts =
  | { kind: 'idea'; target: DirectActionTarget }
  | { kind: 'change'; target: DirectActionTarget; change: ChangeFacts };

interface ResolvedRoot {
  root: string;
  storeId: string | null;
}

type RegistryEntry =
  | { actionId: DirectActionId; label: string; kind: 'skill'; skillId: DirectActionSkillId }
  | { actionId: DirectActionId; label: string; kind: 'capability'; capabilityId: DirectActionCapabilityId };

const REGISTRY: readonly RegistryEntry[] = [
  { actionId: 'explore', label: 'Explore', kind: 'skill', skillId: 'specbase-explore' },
  { actionId: 'propose-feature', label: 'Propose feature', kind: 'skill', skillId: 'specbase-propose' },
  { actionId: 'explore-enforcement', label: 'Explore enforcement', kind: 'skill', skillId: 'specbase-explore-enforce' },
  { actionId: 'propose-enforcement', label: 'Propose enforcement', kind: 'skill', skillId: 'specbase-propose-enforce' },
  { actionId: 'apply', label: 'Apply conversationally', kind: 'skill', skillId: 'specbase-apply-change' },
  { actionId: 'deliver-local', label: 'Deliver to green local commits', kind: 'capability', capabilityId: 'specbase.local-delivery' },
  { actionId: 'review', label: 'Review change', kind: 'skill', skillId: 'specbase-review-panel' },
  { actionId: 'open-draft-pr', label: 'Review and open draft PR', kind: 'capability', capabilityId: 'specbase.draft-pr-delivery' },
  { actionId: 'archive', label: 'Archive change', kind: 'skill', skillId: 'specbase-archive-change' },
];

const ACTION_IDS = new Set<string>(REGISTRY.map((entry) => entry.actionId));

function diagnostic(
  code: string,
  storeId: string | null,
  workItemId: string | null,
  message: string,
  remediation: string,
  actionId?: string
): DirectActionDiagnostic {
  return { code, target: { storeId, workItemId }, ...(actionId ? { actionId } : {}), message, remediation };
}

function blocker(code: string, message: string, remediation: string): DirectActionBlocker {
  return { code, message, remediation };
}

function blocked(entry: RegistryEntry, dispatch: DirectActionDispatchContext, value: DirectActionBlocker): DirectActionDescriptor {
  return { actionId: entry.actionId, label: entry.label, availability: 'blocked', blocker: value, dispatch };
}

function available(entry: RegistryEntry, dispatch: DirectActionDispatchContext): DirectActionDescriptor {
  return { actionId: entry.actionId, label: entry.label, availability: 'available', blocker: null, dispatch };
}

async function resolveRoot(options: GetDirectActionsOptions): Promise<ResolvedRoot> {
  if (options.storeId) {
    const store = await resolveRegisteredStore({
      id: options.storeId,
      ...(options.globalDataDir ? { globalDataDir: options.globalDataDir } : {}),
    });
    return { root: FileSystemUtils.canonicalizeExistingPath(store.storeRoot), storeId: store.id };
  }
  return { root: FileSystemUtils.canonicalizeExistingPath(path.resolve(options.root ?? '.')), storeId: null };
}

function ideaCandidates(root: string, id: string): string[] {
  const home = path.join(root, resolvePlanningDirName(root), 'ideas');
  try {
    return fs.readdirSync(home, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .flatMap((entry) => {
        try {
          const metadata = parseYaml(fs.readFileSync(path.join(home, entry.name, '.openspec.yaml'), 'utf8')) as { id?: unknown } | null;
          return metadata?.id === id ? [entry.name] : [];
        } catch {
          return [];
        }
      })
      .sort();
  } catch {
    return [];
  }
}

async function strictValidation(change: ResolvedLifecycleSnapshot): Promise<boolean> {
  if (!change.context || !change.status?.isComplete) return false;
  try {
    return (await new Validator(true).validateChangeDeltaSpecs(change.context.changeDir)).valid;
  } catch {
    return false;
  }
}

/**
 * Resolve all filesystem-derived facts exactly once.  Policy below is pure over
 * this record, so descriptors in one response cannot observe different state.
 */
function planningRevision(root: string): string {
  const planningRoot = path.join(root, resolvePlanningDirName(root));
  const entries: string[] = [];
  const walk = (directory: string): void => {
    let children: fs.Dirent[];
    try {
      children = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return;
    }
    for (const child of children) {
      const absolute = path.join(directory, child.name);
      if (child.isDirectory()) walk(absolute);
      else if (child.isFile()) {
        const stat = fs.statSync(absolute);
        entries.push(`${path.relative(planningRoot, absolute)}:${stat.size}:${stat.mtimeMs}`);
      }
    }
  };
  walk(planningRoot);
  return entries.join('|');
}

async function resolveFactsOnce(options: GetDirectActionsOptions): Promise<{ facts: TargetFacts | null; diagnostics: DirectActionDiagnostic[] }> {
  const id = options.workItemId?.trim();
  const root = await resolveRoot(options);
  if (!id) {
    return { facts: null, diagnostics: [diagnostic('direct_action_target_missing', root.storeId, null, 'A work-item ID is required.', 'Pass the immutable work-item metadata ID.')] };
  }

  const ideas = ideaCandidates(root.root, id);
  const lifecycle = resolveLifecycleSnapshot({ root: root.root, id });
  if (ideas.length + (lifecycle.snapshot ? 1 : 0) > 1 || lifecycle.diagnostics.some((item) => item.code === 'lifecycle_snapshot_ambiguous')) {
    return { facts: null, diagnostics: [diagnostic('direct_action_target_ambiguous', root.storeId, id, `More than one work item resolves to '${id}'.`, 'Restore unique immutable IDs before requesting direct actions.')] };
  }
  if (ideas.length === 1) {
    return { facts: { kind: 'idea', target: { storeId: root.storeId, workItemId: id, position: 'idea' } }, diagnostics: [] };
  }
  if (!lifecycle.snapshot) {
    return {
      facts: null,
      diagnostics: [diagnostic('direct_action_target_unresolved', root.storeId, id, `No work item resolves to '${id}'.`, 'Choose an immutable ID from the selected planning store.')],
    };
  }

  const snapshot = lifecycle.snapshot;
  const stack = snapshot.position === 'active' ? await getChangeStackContext(root.root, snapshot.id) : null;
  const artifactStatus = new Map(lifecycle.status?.artifacts.map((artifact) => [artifact.id, artifact.status]) ?? []);
  const governed = lifecycle.context
    ? resolveSpecModel(resolveSchema(lifecycle.context.schemaName, root.root)).kind === 'governed'
    : false;
  return {
    facts: {
      kind: 'change',
      target: { storeId: root.storeId, workItemId: snapshot.id, position: snapshot.position === 'archived' ? 'archived' : 'active' },
      change: {
        snapshot,
        resolved: lifecycle,
        stack,
        strictValid: await strictValidation(lifecycle),
        governed,
        featureComplete: ['proposal', 'specs', 'design'].every((id) => artifactStatus.get(id) === 'done'),
        enforcementComplete: artifactStatus.get('enforcement') === 'done',
      },
    },
    diagnostics: [],
  };
}

async function resolveFacts(
  options: GetDirectActionsOptions,
  afterRead?: (attempt: number) => void
): Promise<{ facts: TargetFacts | null; diagnostics: DirectActionDiagnostic[] }> {
  const resolvedRoot = await resolveRoot(options);
  for (let attempt = 0; attempt < 2; attempt++) {
    const before = planningRevision(resolvedRoot.root);
    const result = await resolveFactsOnce({ ...options, root: resolvedRoot.root, ...(resolvedRoot.storeId ? { storeId: resolvedRoot.storeId } : {}) });
    afterRead?.(attempt);
    if (before === planningRevision(resolvedRoot.root)) return result;
  }
  return {
    facts: null,
    diagnostics: [diagnostic(
      'direct_action_state_changed',
      resolvedRoot.storeId,
      options.workItemId?.trim() || null,
      'The planning store changed while direct-action facts were being resolved.',
      'Refresh the catalog and select the action again.'
    )],
  };
}

function dispatch(entry: RegistryEntry, target: DirectActionTarget): DirectActionDispatchContext {
  const store = target.storeId ? { storeId: target.storeId } : {};
  if (entry.kind === 'capability') return {
    kind: 'capability',
    capabilityId: entry.capabilityId,
    arguments: { changeId: target.workItemId, ...store },
  };
  if (entry.actionId === 'explore') return { kind: 'skill', skillId: entry.skillId, arguments: { workItemId: target.workItemId, ...store } };
  if (entry.actionId === 'propose-feature') return { kind: 'skill', skillId: entry.skillId, arguments: { workItemId: target.workItemId, fromIdea: true, ...store } };
  return { kind: 'skill', skillId: entry.skillId, arguments: { changeId: target.workItemId, ...store } };
}

function targetMismatch(entry: RegistryEntry, target: DirectActionTarget): DirectActionBlocker {
  return blocker(
    'direct_action_target_kind',
    `Action '${entry.actionId}' is not available for this ${target.position} work item.`,
    target.position === 'idea' ? 'Select explore or propose-feature for this open idea.' : 'Select an action supported by the current change lifecycle.'
  );
}

function policy(entry: RegistryEntry, facts: TargetFacts): DirectActionDescriptor {
  const route = dispatch(entry, facts.target);
  if (facts.kind === 'idea') {
    return entry.actionId === 'explore' || entry.actionId === 'propose-feature'
      ? available(entry, route)
      : blocked(entry, route, targetMismatch(entry, facts.target));
  }

  const { snapshot, stack, strictValid, governed, featureComplete, enforcementComplete } = facts.change;
  if (snapshot.position === 'archived') return blocked(entry, route, blocker(
    'direct_action_terminal',
    'Archived work items are terminal and cannot receive direct actions.',
    'Choose an active work item to continue lifecycle work.'
  ));
  if (entry.actionId === 'explore') return available(entry, route);
  if (entry.actionId === 'propose-feature') return blocked(entry, route, targetMismatch(entry, facts.target));
  if (entry.actionId === 'explore-enforcement' || entry.actionId === 'propose-enforcement') {
    if (!governed) return blocked(entry, route, blocker(
      'direct_action_governed_required',
      'Enforcement-phase actions require a governed Specbase change.',
      'Use the workflow supported by this change schema, or migrate it to a governed schema.'
    ));
    if (!featureComplete) return blocked(entry, route, blocker(
      'direct_action_feature_incomplete',
      'Feature proposal, specifications, and design are not complete.',
      'Complete the feature artifacts before exploring or proposing enforcement.'
    ));
    if (enforcementComplete) return blocked(entry, route, blocker(
      'direct_action_enforcement_complete',
      'The enforcement artifact is already complete.',
      'Use the action for the current implementation lifecycle stage.'
    ));
    return snapshot.lifecycle === 'proposed' || snapshot.lifecycle === 'enforcement'
      ? available(entry, route)
      : blocked(entry, route, blocker('direct_action_enforcement_phase', 'The change is not in the enforcement-planning phase.', 'Refresh the change and use the action for its current lifecycle stage.'));
  }
  if (entry.actionId === 'apply') {
    if (snapshot.lifecycle === 'ready-to-apply') return available(entry, route);
    if (snapshot.lifecycle === 'implementing' && snapshot.tasks.complete < snapshot.tasks.total) return available(entry, route);
    if (snapshot.lifecycle === 'implementing' && snapshot.tasks.total > 0 && snapshot.tasks.complete === snapshot.tasks.total) return blocked(entry, route, blocker(
      'direct_action_apply_complete',
      'All tracked implementation tasks are complete.',
      'Run review when deterministic validation is ready.'
    ));
    return blocked(entry, route, blocker('direct_action_apply_gate', 'Apply requirements are not currently ready.', 'Complete the required planning artifacts before applying the change.'));
  }
  if (entry.actionId === 'deliver-local') {
    if (!governed) return blocked(entry, route, blocker(
      'direct_action_governed_required',
      'Autonomous local delivery requires a governed Specbase change.',
      'Use conversational Apply for this schema, or migrate the change to a governed schema.'
    ));
    if (!featureComplete || !enforcementComplete) return blocked(entry, route, blocker(
      'direct_action_delivery_planning',
      'Autonomous local delivery requires complete feature and enforcement planning.',
      'Complete the governed proposal, specifications, design, enforcement, and tasks before local delivery.'
    ));
    if (snapshot.lifecycle === 'ready-to-apply') return available(entry, route);
    if (snapshot.lifecycle === 'implementing' && snapshot.tasks.complete < snapshot.tasks.total) return available(entry, route);
    return blocked(entry, route, blocker(
      'direct_action_delivery_gate',
      'The change is not ready for autonomous local delivery.',
      snapshot.tasks.total > 0 && snapshot.tasks.complete === snapshot.tasks.total
        ? 'Run the review-to-draft-PR action when deterministic validation is ready.'
        : 'Complete the governed planning artifacts before local delivery.'
    ));
  }
  if (entry.actionId === 'review' || entry.actionId === 'open-draft-pr') {
    const remote = entry.actionId === 'open-draft-pr';
    if (snapshot.tasks.total === 0 || snapshot.tasks.complete < snapshot.tasks.total) return blocked(entry, route, blocker('direct_action_tasks_incomplete', 'Implementation tasks are incomplete.', `Complete every tracked implementation task before ${remote ? 'draft-PR delivery' : 'review'}.`));
    if (!strictValid) return blocked(entry, route, blocker('direct_action_strict_validation', 'Strict change validation is not currently passing.', `Repair the change and run strict validation before ${remote ? 'draft-PR delivery' : 'review'}.`));
    return snapshot.lifecycle === 'implementing'
      ? available(entry, route)
      : blocked(entry, route, blocker('direct_action_review_complete', 'This change already has a review footprint.', 'Address review findings or select the archive action when eligible.'));
  }
  if (stack && !stack.archiveEligible) return blocked(entry, route, blocker(
    'direct_action_stack_predecessor',
    `Stack predecessor '${stack.requiredPredecessor}' must archive first.`,
    `Archive '${stack.requiredPredecessor}' before archiving this stack member.`
  ));
  if (snapshot.tasks.total === 0 || snapshot.tasks.complete < snapshot.tasks.total) return blocked(entry, route, blocker('direct_action_tasks_incomplete', 'Implementation tasks are incomplete.', 'Complete every tracked implementation task before archiving.'));
  if (!strictValid) return blocked(entry, route, blocker('direct_action_strict_validation', 'Strict change validation is not currently passing.', 'Repair the change and run strict validation before archiving.'));
  return snapshot.lifecycle === 'reviewing'
    ? available(entry, route)
    : blocked(entry, route, blocker('direct_action_review_required', 'A review footprint is required before archive.', 'Run the review action and address its findings before archiving.'));
}

function catalogFromFacts(facts: TargetFacts): DirectActionCatalog {
  return {
    version: DIRECT_ACTION_CATALOG_VERSION,
    target: facts.target,
    actions: REGISTRY.map((entry) => policy(entry, facts)),
    diagnostics: [],
  };
}

async function getDirectActionsInternal(
  options: GetDirectActionsOptions,
  afterRead?: (attempt: number) => void
): Promise<DirectActionCatalog> {
  try {
    const resolved = await resolveFacts(options, afterRead);
    return resolved.facts
      ? catalogFromFacts(resolved.facts)
      : { version: DIRECT_ACTION_CATALOG_VERSION, target: null, actions: [], diagnostics: resolved.diagnostics };
  } catch (error) {
    const id = options.workItemId?.trim() || null;
    return {
      version: DIRECT_ACTION_CATALOG_VERSION,
      target: null,
      actions: [],
      diagnostics: [diagnostic('direct_action_store_unresolved', options.storeId ?? null, id, 'The selected store could not be resolved.', 'Select a registered store or provide a readable repository root.')],
    };
  }
}

/** Return the canonical available and blocked actions for one immutable target. */
export async function getDirectActions(options: GetDirectActionsOptions): Promise<DirectActionCatalog> {
  return getDirectActionsInternal(options);
}

/** @internal Deterministic seam for proving revision-guard retries. */
export async function getDirectActionsWithReadProbe(
  options: GetDirectActionsOptions,
  afterRead: (attempt: number) => void
): Promise<DirectActionCatalog> {
  return getDirectActionsInternal(options, afterRead);
}

function rejected(
  code: string,
  intent: { storeId?: string | null; workItemId?: string | null; actionId?: string },
  message: string,
  remediation: string
): DirectActionIntentValidation {
  return { accepted: false, descriptor: null, diagnostics: [diagnostic(code, intent.storeId ?? null, intent.workItemId ?? null, message, remediation, intent.actionId)] };
}

function intentIdentity(record: Record<string, unknown>): { storeId?: string | null; workItemId?: string; actionId?: string } {
  return {
    ...(typeof record.storeId === 'string' || record.storeId === null ? { storeId: record.storeId as string | null } : {}),
    ...(typeof record.workItemId === 'string' ? { workItemId: record.workItemId } : {}),
    ...(typeof record.actionId === 'string' ? { actionId: record.actionId } : {}),
  };
}

function parseIntent(value: unknown): { intent: DirectActionIntent } | { rejection: DirectActionIntentValidation } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { rejection: rejected('direct_action_intent_malformed', {}, 'A direct-action intent must be an object.', 'Create a new intent from the current catalog descriptor.') };
  const record = value as Record<string, unknown>;
  const identity = intentIdentity(record);
  const executable = ['command', 'skill', 'workflow', 'git', 'shell'].find((key) => key in record);
  if (executable) return { rejection: rejected('direct_action_intent_executable_field', identity, `Intent field '${executable}' is not allowed.`, 'Send only the exact version, storeId, workItemId, actionId, and dispatchKind fields.') };
  const keys = Object.keys(record).sort();
  const expected = ['actionId', 'dispatchKind', 'storeId', 'version', 'workItemId'];
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) return { rejection: rejected('direct_action_intent_malformed', identity, 'Intent fields do not match the supported exact-intent shape.', 'Send only the exact version, storeId, workItemId, actionId, and dispatchKind fields.') };
  if (typeof record.version !== 'number' || !Number.isInteger(record.version) || (typeof record.storeId !== 'string' && record.storeId !== null) || typeof record.workItemId !== 'string' || typeof record.actionId !== 'string' || (record.dispatchKind !== 'skill' && record.dispatchKind !== 'capability')) {
    return { rejection: rejected('direct_action_intent_malformed', identity, 'Intent values do not match the supported exact-intent shape.', 'Create a new intent from the current catalog descriptor.') };
  }
  return { intent: record as unknown as DirectActionIntent };
}

/**
 * Re-resolve current state and accept only an exact, currently available
 * canonical route. This boundary performs no dispatch, mutation, or external
 * adapter invocation.
 */
export async function validateDirectActionIntent(
  value: unknown,
  options: Omit<GetDirectActionsOptions, 'workItemId' | 'storeId'> = {}
): Promise<DirectActionIntentValidation> {
  const parsed = parseIntent(value);
  if ('rejection' in parsed) return parsed.rejection;
  const intent = parsed.intent;
  if (intent.version !== DIRECT_ACTION_CATALOG_VERSION) return rejected('direct_action_unsupported_version', intent, `Unsupported direct-action catalog version ${intent.version}.`, `Request direct-action catalog version ${DIRECT_ACTION_CATALOG_VERSION}.`);
  if (!ACTION_IDS.has(intent.actionId)) return rejected('direct_action_unknown_action', intent, `Unknown direct action '${intent.actionId}'.`, `Use an action ID from catalog version ${DIRECT_ACTION_CATALOG_VERSION}.`);

  const catalog = await getDirectActions({ ...options, workItemId: intent.workItemId, ...(intent.storeId ? { storeId: intent.storeId } : {}) });
  if (!catalog.target) return { accepted: false, descriptor: null, diagnostics: catalog.diagnostics };
  if (catalog.target.storeId !== intent.storeId || catalog.target.workItemId !== intent.workItemId) return rejected('direct_action_identity_mismatch', intent, 'Intent identity does not exactly match the current canonical target.', 'Create a new intent from the current catalog.');
  const descriptor = catalog.actions.find((entry) => entry.actionId === intent.actionId)!;
  if (descriptor.dispatch.kind !== intent.dispatchKind) return rejected('direct_action_dispatch_kind_mismatch', intent, 'Intent dispatch kind does not match the canonical action.', 'Preserve the dispatch kind from the current catalog descriptor.');
  if (descriptor.availability === 'blocked') return { accepted: false, descriptor: null, diagnostics: [diagnostic(descriptor.blocker!.code, catalog.target.storeId, catalog.target.workItemId, descriptor.blocker!.message, descriptor.blocker!.remediation, descriptor.actionId)] };
  return { accepted: true, descriptor, diagnostics: [] };
}
