import * as path from 'node:path';
import { getTaskProgressForChange } from '../../utils/task-progress.js';
import { formatChangeStatus, loadChangeContext } from '../artifact-graph/instruction-loader.js';
import { findStackForMember, readWorkItemId, validateStack } from './store.js';
import {
  projectStack,
  projectionForTarget,
  type StackProjectionArtifact,
  type StackProjectionDelta,
  type StackProjectionResultSummary,
  type StackProjectionStep,
} from './projection.js';

export interface StackMemberInspection {
  id: string;
  position: 'idea' | 'change' | 'archived';
  path: string;
  artifactProgress?: { complete: number; total: number };
  taskProgress?: { complete: number; total: number };
}

export interface StackInspection {
  id: string;
  summary: string;
  created: string;
  members: StackMemberInspection[];
  firstUnfinishedMember: string | null;
}

export async function inspectStack(root: string, stackId: string): Promise<StackInspection> {
  const { manifest, members } = await validateStack(root, stackId);
  const inspected: StackMemberInspection[] = [];
  for (const member of members) {
    const row: StackMemberInspection = { id: member.id, position: member.position, path: member.dir };
    if (member.position === 'change') {
      try {
        const context = loadChangeContext(root, member.directoryName, undefined, { changeDir: member.dir });
        const status = formatChangeStatus(context);
        row.artifactProgress = {
          complete: status.artifacts.filter((artifact) => artifact.status === 'done').length,
          total: status.artifacts.length,
        };
      } catch { /* malformed/incomplete changes remain inspectable by lifecycle */ }
      try {
        const progress = await getTaskProgressForChange(path.dirname(member.dir), member.directoryName, root);
        row.taskProgress = { complete: progress.completed, total: progress.total };
      } catch { /* tasks are optional */ }
    }
    inspected.push(row);
  }
  return {
    id: manifest.id,
    summary: manifest.summary,
    created: manifest.created,
    members: inspected,
    firstUnfinishedMember: inspected.find((member) => member.position !== 'archived')?.id ?? null,
  };
}

export interface ChangeStackContext {
  id: string;
  summary: string;
  member: string;
  position: number;
  total: number;
  predecessors: Array<{
    id: string;
    position: StackProjectionStep['position'];
    projection: StackProjectionStep['status'];
    result?: StackProjectionResultSummary;
  }>;
  projectedBase: {
    accepted: StackProjectionArtifact[];
    predecessors: StackProjectionDelta[];
  } | null;
  projectedResult: StackProjectionResultSummary | null;
  projection: StackProjectionStep['status'] | 'unavailable';
  blockedBy: string | null;
  archiveEligible: boolean;
  requiredPredecessor: string | null;
}

/** Resolve a CLI-selected active directory to immutable metadata identity. */
export async function resolveSelectedChangeId(changeDir: string, directoryName: string): Promise<string> {
  return (await readWorkItemId(changeDir, directoryName)) ?? directoryName;
}

export async function getChangeStackContext(root: string, memberId: string): Promise<ChangeStackContext | null> {
  const membership = await findStackForMember(root, memberId);
  if (!membership) return null;
  const { manifest, index } = membership;
  const { members } = await validateStack(root, manifest.id);
  const required = members.slice(0, index).find((member) => member.position !== 'archived') ?? null;
  let projection;
  try {
    projection = projectionForTarget(manifest, await projectStack(root, manifest.id), memberId);
  } catch {
    projection = { predecessors: [], target: null, blockedBy: null };
  }
  return {
    id: manifest.id,
    summary: manifest.summary,
    member: memberId,
    position: index + 1,
    total: manifest.members.length,
    predecessors: projection.predecessors.map((step) => ({
      id: step.member,
      position: step.position,
      projection: step.status,
      ...(step.result ? { result: step.result } : {}),
    })),
    projectedBase: projection.target?.base ?? null,
    projectedResult: projection.target?.result ?? null,
    projection: projection.target?.status ?? 'unavailable',
    blockedBy: projection.blockedBy,
    archiveEligible: required === null,
    requiredPredecessor: required?.id ?? null,
  };
}
