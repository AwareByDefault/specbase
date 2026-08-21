import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { planningDir } from '../planning-dir.js';
import { loadChangeContext } from '../artifact-graph/instruction-loader.js';
import { resolveSchema } from '../artifact-graph/resolver.js';
import { resolveSpecModel, type SpecModel } from '../artifact-graph/types.js';
import { mergeProjectSpecModel } from '../shared/skill-generation.js';
import { readProjectConfig } from '../project-config.js';
import { findSpecUpdates, buildUpdatedSpec } from '../specs-apply.js';
import { Validator } from '../validation/validator.js';
import {
  prepareGovernedArchive,
  writeGovernedArchivePairs,
  type GovernedArchivePlan,
} from '../governed-archive.js';
import { validateStack } from './store.js';
import type { ResolvedStackMember, StackManifest } from './model.js';

export interface StackProjectionArtifact {
  locator: string;
  specPath: string;
  enforcementPath?: string;
}

export interface StackProjectionDelta extends StackProjectionArtifact {
  member: string;
  model: SpecModel['kind'];
  operations: { added: number; modified: number; removed: number; renamed: number; bindings?: { added: number; modified: number; removed: number } };
}

export interface StackProjectionResultSummary {
  model: SpecModel['kind'];
  pairs: Array<{
    locator: string;
    specId?: string | null;
    operations: StackProjectionDelta['operations'];
  }>;
  diagnostics: string[];
}

export interface StackProjectionStep {
  member: string;
  position: ResolvedStackMember['position'];
  status: 'skipped-archived' | 'planned' | 'valid' | 'invalid' | 'blocked';
  base: {
    accepted: StackProjectionArtifact[];
    predecessors: StackProjectionDelta[];
  };
  result?: StackProjectionResultSummary;
  blockedBy?: string;
}

export interface StackProjectionResult {
  stack: string;
  valid: boolean;
  firstInvalidMember: string | null;
  blockedByPlannedMember: string | null;
  steps: StackProjectionStep[];
}

async function seedCurrentTruth(root: string, destination: string): Promise<void> {
  const source = path.join(planningDir(root), 'specs');
  const target = path.join(destination, 'specs');
  await fs.mkdir(destination, { recursive: true });
  try {
    await fs.cp(source, target, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    await fs.mkdir(target, { recursive: true });
  }
}

async function walkFiles(dir: string): Promise<string[]> {
  let entries: import('node:fs').Dirent[];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return []; }
  const files: string[] = [];
  for (const entry of entries) {
    const candidate = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(candidate));
    else files.push(candidate);
  }
  return files;
}

async function acceptedArtifacts(root: string): Promise<StackProjectionArtifact[]> {
  const specsRoot = path.join(planningDir(root), 'specs');
  const files = await walkFiles(specsRoot);
  const specs = files.filter((file) => path.basename(file) === 'spec.md').sort();
  return specs.map((specPath) => {
    const dir = path.dirname(specPath);
    const yamlPath = path.join(dir, 'enforcement.yaml');
    const mdPath = path.join(dir, 'enforcement.md');
    const enforcementPath = files.includes(yamlPath) ? yamlPath : files.includes(mdPath) ? mdPath : undefined;
    return {
      locator: path.relative(specsRoot, dir).split(path.sep).join('/'),
      specPath,
      ...(enforcementPath ? { enforcementPath } : {}),
    };
  });
}

function resolveMemberModel(root: string, member: ResolvedStackMember): SpecModel {
  const context = loadChangeContext(root, member.directoryName, undefined, { changeDir: member.dir });
  const model = resolveSpecModel(resolveSchema(context.schemaName, root));
  return mergeProjectSpecModel(model, readProjectConfig(root));
}

function governedDiagnostics(plan: GovernedArchivePlan): string[] {
  return [
    ...plan.incompletePairs.map((pair) => `${pair.locator}: missing ${pair.missingMember}`),
    ...plan.unsafeLocators.map((item) => item.message),
    ...plan.notReady.flatMap((pair) => pair.blockers.map((blocker) => `${pair.locator}: ${String(blocker)}`)),
    ...plan.mergeErrors.flatMap((error) => error.messages.map((message) => `${error.locator}: ${message}`)),
    ...(plan.validation?.specs.flatMap((spec) => spec.diagnostics.filter((item) => item.severity === 'error').map((item) => `${spec.locator}: ${item.message}`)) ?? []),
    ...(plan.validation?.unknownPlanes?.filter((item) => item.severity === 'error').map((item) => item.message) ?? []),
  ];
}

async function applyGovernedMember(
  root: string,
  member: ResolvedStackMember,
  temporaryRoot: string
): Promise<{ ready: boolean; deltas: StackProjectionDelta[]; result: StackProjectionResultSummary }> {
  const plan = await prepareGovernedArchive({ changeDir: member.dir, specbaseRoot: temporaryRoot, projectRoot: root });
  const diagnostics = governedDiagnostics(plan);
  const pairs = plan.pairs.map((pair) => ({
    locator: pair.locator,
    specId: pair.specId,
    operations: { ...pair.normativeOps, bindings: { ...pair.bindingOps } },
  }));
  const deltas = plan.pairs.map((pair) => ({
    member: member.id,
    model: 'governed' as const,
    locator: pair.locator,
    specPath: path.join(member.dir, 'specs', ...pair.locator.split('/'), 'spec.md'),
    enforcementPath: path.join(member.dir, 'specs', ...pair.locator.split('/'), 'enforcement.yaml'),
    operations: { ...pair.normativeOps, bindings: { ...pair.bindingOps } },
  }));
  if (plan.ready) await writeGovernedArchivePairs(plan.pairs);
  return { ready: plan.ready, deltas, result: { model: 'governed', pairs, diagnostics } };
}

async function applyLegacyMember(
  member: ResolvedStackMember,
  temporaryRoot: string,
  acceptedRoot: string
): Promise<{ ready: boolean; deltas: StackProjectionDelta[]; result: StackProjectionResultSummary }> {
  const temporarySpecs = path.join(temporaryRoot, 'specs');
  const acceptedSpecs = path.join(planningDir(acceptedRoot), 'specs');
  const updates = await findSpecUpdates(member.dir, temporarySpecs);
  const prepared: Array<{ rebuilt: string; target: string; delta: StackProjectionDelta }> = [];
  const diagnostics: string[] = [];
  for (const update of updates) {
    try {
      const built = await buildUpdatedSpec(update, member.id, { silent: true });
      const locator = path.basename(path.dirname(update.source));
      const report = await new Validator().validateSpecContent(locator, built.rebuilt);
      if (!report.valid) {
        diagnostics.push(...report.issues.filter((issue) => issue.level === 'ERROR').map((issue) => `${locator}: ${issue.message}`));
        continue;
      }
      prepared.push({
        rebuilt: built.rebuilt,
        target: update.target,
        delta: {
          member: member.id,
          model: 'legacy',
          locator,
          specPath: update.source,
          operations: built.counts,
        },
      });
    } catch (error) {
      diagnostics.push(error instanceof Error ? error.message : String(error));
    }
  }
  const ready = diagnostics.length === 0;
  if (ready) {
    for (const item of prepared) {
      await fs.mkdir(path.dirname(item.target), { recursive: true });
      await fs.writeFile(item.target, item.rebuilt, 'utf-8');
    }
  }
  const pairs = prepared.map((item) => ({ locator: item.delta.locator, operations: item.delta.operations }));
  // Keep all public paths durable: targets are reported under actual accepted
  // truth, never under the temporary projection directory.
  const deltas = prepared.map((item) => ({ ...item.delta }));
  void acceptedSpecs;
  return { ready, deltas, result: { model: 'legacy', pairs, diagnostics } };
}

/**
 * Project a stack without mutating repository truth. Public results contain
 * only durable repository paths and compact operation/result summaries; the
 * isolated prospective tree remains an implementation detail and is removed.
 */
export async function projectStack(root: string, stackId: string): Promise<StackProjectionResult> {
  const { manifest, members } = await validateStack(root, stackId);
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-stack-project-'));
  await seedCurrentTruth(root, temporaryRoot);
  const accepted = await acceptedArtifacts(root);
  const predecessors: StackProjectionDelta[] = [];
  const steps: StackProjectionStep[] = [];
  let firstInvalidMember: string | null = null;
  let plannedBlocker: string | null = null;
  try {
    for (const member of members) {
      const base = { accepted, predecessors: [...predecessors] };
      const blocker = firstInvalidMember ?? plannedBlocker;
      if (blocker) {
        steps.push({ member: member.id, position: member.position, status: 'blocked', base, blockedBy: blocker });
        continue;
      }
      if (member.position === 'archived') {
        steps.push({ member: member.id, position: member.position, status: 'skipped-archived', base });
        continue;
      }
      if (member.position === 'idea') {
        steps.push({ member: member.id, position: member.position, status: 'planned', base });
        plannedBlocker = member.id;
        continue;
      }

      let applied;
      try {
        const model = resolveMemberModel(root, member);
        applied = model.kind === 'governed'
          ? await applyGovernedMember(root, member, temporaryRoot)
          : await applyLegacyMember(member, temporaryRoot, root);
      } catch (error) {
        applied = {
          ready: false,
          deltas: [],
          result: { model: 'legacy' as const, pairs: [], diagnostics: [error instanceof Error ? error.message : String(error)] },
        };
      }
      if (!applied.ready) {
        firstInvalidMember = member.id;
        steps.push({ member: member.id, position: member.position, status: 'invalid', base, result: applied.result });
        continue;
      }
      predecessors.push(...applied.deltas);
      steps.push({ member: member.id, position: member.position, status: 'valid', base, result: applied.result });
    }
    const hasBlockedDelivery = steps.some((step) => step.status === 'blocked');
    return {
      stack: manifest.id,
      valid: firstInvalidMember === null && !hasBlockedDelivery,
      firstInvalidMember,
      blockedByPlannedMember: plannedBlocker,
      steps,
    };
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}

export function projectionForTarget(
  manifest: StackManifest,
  result: StackProjectionResult,
  memberId: string
): { predecessors: StackProjectionStep[]; target: StackProjectionStep | null; blockedBy: string | null } {
  const index = manifest.members.indexOf(memberId);
  const target = result.steps[index] ?? null;
  return {
    predecessors: index < 0 ? [] : result.steps.slice(0, index),
    target,
    blockedBy: target?.status === 'blocked' ? target.blockedBy ?? null : null,
  };
}
