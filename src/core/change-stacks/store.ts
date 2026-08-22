import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import * as yaml from 'yaml';
import { planningDir } from '../planning-dir.js';
import { generateIdeaId } from '../ideas/id.js';
import { ideasHome } from '../ideas/store.js';
import { isKebabId } from '../id.js';
import {
  STACK_MANIFEST_FILENAME,
  STACK_NOTES_FILENAME,
  STACKS_DIRNAME,
  StackManifestSchema,
  StackValidationError,
  type ResolvedStackMember,
  type StackDiagnostic,
  type StackManifest,
} from './model.js';

export function stacksHome(root: string): string {
  return path.join(planningDir(root), STACKS_DIRNAME);
}

export function stackDir(root: string, id: string): string {
  return path.join(stacksHome(root), id);
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

async function exists(candidate: string): Promise<boolean> {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function assertDirectIdeaDirectory(root: string, candidate: string, ideaId: string): Promise<void> {
  const home = ideasHome(root);
  const stat = await fs.lstat(candidate);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new StackValidationError([{
      severity: 'error',
      code: 'invalid_stack_manifest',
      message: `Idea '${ideaId}' must be a real directory directly under ideas/.`,
      member: ideaId,
      path: candidate,
      fix: 'Replace the symlink or non-directory entry with a normal idea directory.',
    }]);
  }
  const [realHome, realCandidate] = await Promise.all([fs.realpath(home), fs.realpath(candidate)]);
  if (path.dirname(realCandidate) !== realHome) {
    throw new StackValidationError([{
      severity: 'error',
      code: 'invalid_stack_manifest',
      message: `Idea '${ideaId}' resolves outside the ideas home.`,
      member: ideaId,
      path: candidate,
      fix: 'Use a real direct child of ideas/.',
    }]);
  }

  async function rejectSymlinks(directory: string): Promise<void> {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new StackValidationError([{
          severity: 'error',
          code: 'invalid_stack_manifest',
          message: `Idea '${ideaId}' contains symlink '${entry.name}', which cannot be graduated safely.`,
          member: ideaId,
          path: entryPath,
          fix: 'Replace symlinked supporting files with repository-local regular files.',
        }]);
      }
      if (entry.isDirectory()) await rejectSymlinks(entryPath);
    }
  }
  await rejectSymlinks(realCandidate);
}

function malformedMetadata(dir: string, message: string): StackValidationError {
  const metadataPath = path.join(dir, STACK_MANIFEST_FILENAME);
  return new StackValidationError([{
    severity: 'error',
    code: 'malformed_member_metadata',
    message: `Work item metadata '${metadataPath}' ${message}.`,
    path: metadataPath,
    fix: 'Repair the metadata id so it is one immutable kebab-case work-item ID.',
  }]);
}

/**
 * Resolve immutable work-item identity. Directory fallback is retained only for
 * legacy work items whose metadata file or metadata `id` predates stable IDs;
 * malformed YAML and invalid present IDs are never silently accepted.
 */
export async function readWorkItemId(dir: string, legacyFallback?: string): Promise<string | null> {
  const metadataPath = path.join(dir, STACK_MANIFEST_FILENAME);
  let text: string;
  try {
    text = await fs.readFile(metadataPath, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return legacyFallback ?? null;
    throw malformedMetadata(dir, `cannot be read: ${(error as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = yaml.parse(text);
  } catch (error) {
    throw malformedMetadata(dir, `is not valid YAML: ${(error as Error).message}`);
  }
  const id = parsed && typeof parsed === 'object' ? (parsed as { id?: unknown }).id : undefined;
  if (id === undefined && parsed && typeof parsed === 'object') return legacyFallback ?? null;
  if (typeof id !== 'string' || !isKebabId(id)) throw malformedMetadata(dir, 'must declare a valid id');
  return id;
}

export async function readStackManifest(root: string, id: string): Promise<StackManifest> {
  const manifestPath = path.join(stackDir(root, id), STACK_MANIFEST_FILENAME);
  let input: unknown;
  try {
    input = yaml.parse(await fs.readFile(manifestPath, 'utf-8'));
  } catch (error) {
    const diagnostic: StackDiagnostic = {
      severity: 'error',
      code: (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'stack_not_found' : 'invalid_stack_manifest',
      message: (error as NodeJS.ErrnoException).code === 'ENOENT'
        ? `Stack '${id}' was not found under stacks/.`
        : `Stack manifest '${manifestPath}' is not valid YAML: ${(error as Error).message}`,
      path: manifestPath,
      fix: `Repair ${manifestPath} or recreate the stack.`,
    };
    throw new StackValidationError([diagnostic]);
  }
  const parsed = StackManifestSchema.safeParse(input);
  if (!parsed.success) {
    throw new StackValidationError(parsed.error.issues.map((issue) => ({
      severity: 'error' as const,
      code: 'invalid_stack_manifest' as const,
      message: `${issue.path.join('.') || 'manifest'}: ${issue.message}`,
      path: manifestPath,
      fix: 'Use one id, summary, created date, and an ordered list of at least two unique work-item IDs.',
    })));
  }
  if (parsed.data.id !== id) {
    throw new StackValidationError([{
      severity: 'error',
      code: 'invalid_stack_manifest',
      message: `Stack directory '${id}' does not match manifest id '${parsed.data.id}'.`,
      path: manifestPath,
      fix: 'Rename the directory or restore the immutable manifest id.',
    }]);
  }
  return parsed.data;
}

async function stackEntries(root: string): Promise<import('node:fs').Dirent[]> {
  try {
    return (await fs.readdir(stacksHome(root), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'));
  } catch {
    return [];
  }
}

export async function listStackManifests(root: string): Promise<StackManifest[]> {
  const manifests: StackManifest[] = [];
  for (const entry of await stackEntries(root)) manifests.push(await readStackManifest(root, entry.name));
  return manifests.sort((a, b) => a.created.localeCompare(b.created) || a.id.localeCompare(b.id));
}

/** Lightweight, stable stack context suitable for read-only work-item projections. */
export interface StackMembershipContext {
  id: string;
  position: number;
  total: number;
}

/**
 * Build membership once for a snapshot consumer. Every stack manifest is read
 * at most once; invalid stacks add diagnostics and never hide readable work.
 */
export async function buildStackMembershipIndex(
  root: string,
  readableMemberIds?: ReadonlySet<string>
): Promise<{ members: Map<string, StackMembershipContext>; diagnostics: StackDiagnostic[] }> {
  const members = new Map<string, StackMembershipContext>();
  const diagnostics: StackDiagnostic[] = [];
  const manifests: StackManifest[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = (await fs.readdir(stacksHome(root), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { members, diagnostics };
    diagnostics.push({
      severity: 'error',
      code: 'invalid_stack_manifest',
      message: `Could not read the stack directory: ${error instanceof Error ? error.message : String(error)}`,
      path: stacksHome(root),
      fix: 'Restore access to the stacks directory, then derive the board again.',
    });
    return { members, diagnostics };
  }

  for (const entry of entries) {
    try {
      manifests.push(await readStackManifest(root, entry.name));
    } catch (error) {
      if (error instanceof StackValidationError) diagnostics.push(...error.diagnostics);
      else diagnostics.push({
        severity: 'error',
        code: 'invalid_stack_manifest',
        message: error instanceof Error ? error.message : String(error),
        path: path.join(stacksHome(root), entry.name, STACK_MANIFEST_FILENAME),
        fix: 'Repair the stack manifest, then derive the board again.',
      });
    }
  }

  const stackIds = new Set(manifests.map((manifest) => manifest.id));
  const owners = new Map<string, string[]>();
  for (const manifest of manifests) {
    for (const member of manifest.members) owners.set(member, [...(owners.get(member) ?? []), manifest.id]);
  }
  const invalidStacks = new Set<string>();
  for (const manifest of manifests) {
    for (const member of manifest.members) {
      if (stackIds.has(member)) {
        invalidStacks.add(manifest.id);
        diagnostics.push({
          severity: 'error',
          code: 'nested_stack',
          member,
          message: `Member '${member}' identifies a stack; nested stacks are not supported.`,
          path: path.join(stackDir(root, manifest.id), STACK_MANIFEST_FILENAME),
          fix: 'Name ordinary idea/change IDs only.',
        });
      }
      const memberOwners = owners.get(member) ?? [];
      if (memberOwners.length > 1) {
        for (const owner of memberOwners) invalidStacks.add(owner);
        if (manifest.id === memberOwners[0]) diagnostics.push({
          severity: 'error',
          code: 'multiple_stack_membership',
          member,
          message: `Member '${member}' belongs to multiple stacks: ${memberOwners.join(', ')}.`,
          path: path.join(stackDir(root, manifest.id), STACK_MANIFEST_FILENAME),
          fix: 'Keep the member in exactly one manifest.',
        });
      }
      if (readableMemberIds && !readableMemberIds.has(member)) {
        invalidStacks.add(manifest.id);
        diagnostics.push({
          severity: 'error',
          code: 'missing_member',
          member,
          message: `Stack '${manifest.id}' member '${member}' is not a readable work item.`,
          path: path.join(stackDir(root, manifest.id), STACK_MANIFEST_FILENAME),
          fix: 'Restore the member or remove it from the stack manifest.',
        });
      }
    }
  }

  for (const manifest of manifests) {
    if (invalidStacks.has(manifest.id)) continue;
    for (const [index, member] of manifest.members.entries()) {
      members.set(member, { id: manifest.id, position: index + 1, total: manifest.members.length });
    }
  }
  return { members, diagnostics };
}

/**
 * Membership lookup is deliberately tolerant of unrelated malformed stacks so
 * ordinary unstacked workflows remain isolated. A malformed manifest that can
 * still be parsed and claims this member remains a strict error.
 */
export async function findStackForMember(root: string, memberId: string): Promise<{ manifest: StackManifest; index: number } | null> {
  const matches: Array<{ manifest: StackManifest; index: number }> = [];
  for (const entry of await stackEntries(root)) {
    try {
      const manifest = await readStackManifest(root, entry.name);
      const index = manifest.members.indexOf(memberId);
      if (index >= 0) matches.push({ manifest, index });
    } catch (error) {
      try {
        const raw = yaml.parse(await fs.readFile(path.join(stacksHome(root), entry.name, STACK_MANIFEST_FILENAME), 'utf-8')) as { members?: unknown };
        if (Array.isArray(raw?.members) && raw.members.includes(memberId)) throw error;
      } catch (rawError) {
        if (rawError === error) throw error;
        // Invalid unrelated YAML cannot establish membership and is ignored.
      }
    }
  }
  if (matches.length > 1) {
    throw new StackValidationError([{
      severity: 'error',
      code: 'multiple_stack_membership',
      member: memberId,
      message: `Member '${memberId}' belongs to multiple stacks: ${matches.map((match) => match.manifest.id).join(', ')}.`,
      fix: 'Keep the member in exactly one manifest.',
    }]);
  }
  return matches[0] ?? null;
}

export async function resolveStackMembers(root: string, manifest: StackManifest): Promise<ResolvedStackMember[]> {
  const planning = planningDir(root);
  const locations: Array<{ position: ResolvedStackMember['position']; home: string }> = [
    { position: 'idea', home: path.join(planning, 'ideas') },
    { position: 'change', home: path.join(planning, 'changes') },
    { position: 'archived', home: path.join(planning, 'changes', 'archive') },
  ];
  const manifests: StackManifest[] = [manifest];
  for (const entry of await stackEntries(root)) {
    if (entry.name === manifest.id) continue;
    try {
      manifests.push(await readStackManifest(root, entry.name));
    } catch (error) {
      try {
        const raw = yaml.parse(await fs.readFile(path.join(stacksHome(root), entry.name, STACK_MANIFEST_FILENAME), 'utf-8')) as { members?: unknown };
        if (Array.isArray(raw?.members) && raw.members.some((member) => manifest.members.includes(String(member)))) throw error;
      } catch (rawError) {
        if (rawError === error) throw error;
        // Unrelated malformed manifests cannot own a selected member and stay isolated.
      }
    }
  }
  const stackIds = new Set(manifests.map((stack) => stack.id));
  const owners = new Map<string, string[]>();
  for (const stack of manifests) {
    for (const member of stack.members) owners.set(member, [...(owners.get(member) ?? []), stack.id]);
  }

  const diagnostics: StackDiagnostic[] = [];
  const resolved: ResolvedStackMember[] = [];
  for (const member of manifest.members) {
    if (stackIds.has(member)) {
      diagnostics.push({ severity: 'error', code: 'nested_stack', member, message: `Member '${member}' identifies a stack; nested stacks are not supported.`, fix: 'Name ordinary idea/change IDs only.' });
      continue;
    }
    const memberOwners = owners.get(member) ?? [];
    if (memberOwners.some((owner) => owner !== manifest.id)) {
      diagnostics.push({ severity: 'error', code: 'multiple_stack_membership', member, message: `Member '${member}' already belongs to stack '${memberOwners.find((owner) => owner !== manifest.id)}'.`, fix: 'Remove it from the other stack before creating this stack.' });
      continue;
    }

    const matches: ResolvedStackMember[] = [];
    for (const location of locations) {
      let entries: import('node:fs').Dirent[] = [];
      try { entries = await fs.readdir(location.home, { withFileTypes: true }); } catch { /* young roots may omit a region */ }
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'archive' || entry.name.startsWith('.')) continue;
        const dir = path.join(location.home, entry.name);
        const fallback = location.position === 'archived'
          ? entry.name.replace(/^\d{4}-\d{2}-\d{2}-/, '')
          : entry.name;
        try {
          if (await readWorkItemId(dir, fallback) === member) {
            matches.push({ id: member, position: location.position, dir, directoryName: entry.name });
          }
        } catch (error) {
          // Malformed metadata is actionable when this directory would otherwise
          // be the requested legacy identity; unrelated corruption stays local.
          if (fallback === member && error instanceof StackValidationError) diagnostics.push(...error.diagnostics.map((item) => ({ ...item, member })));
        }
      }
    }
    if (matches.length === 0 && !diagnostics.some((item) => item.member === member)) {
      diagnostics.push({ severity: 'error', code: 'missing_member', member, message: `Member '${member}' does not resolve in ideas/, active changes/, or dated archives in this planning root.`, fix: `Create or restore work item '${member}' in this repository, or repair the manifest.` });
    } else if (matches.length > 1) {
      diagnostics.push({ severity: 'error', code: 'ambiguous_member', member, message: `Member '${member}' resolves to ${matches.length} work items in this planning root.`, fix: 'Keep exactly one lifecycle position for the stable ID.' });
    } else if (matches.length === 1) {
      resolved.push(matches[0]);
    }
  }
  if (diagnostics.length > 0) throw new StackValidationError(diagnostics);
  return resolved;
}

export async function validateStack(root: string, id: string): Promise<{ manifest: StackManifest; members: ResolvedStackMember[] }> {
  const manifest = await readStackManifest(root, id);
  return { manifest, members: await resolveStackMembers(root, manifest) };
}

export interface CreateStackInput {
  id?: string;
  summary: string;
  members: string[];
  fromIdea?: string;
}

async function withCreationLock<T>(root: string, operation: () => Promise<T>): Promise<T> {
  const home = stacksHome(root);
  await fs.mkdir(home, { recursive: true });
  const lock = path.join(home, '.create.lock');
  for (let attempt = 0; ; attempt += 1) {
    try {
      await fs.mkdir(lock);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || attempt >= 500) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  try {
    return await operation();
  } finally {
    await fs.rm(lock, { recursive: true, force: true });
  }
}

export async function createStack(root: string, input: CreateStackInput): Promise<StackManifest> {
  return withCreationLock(root, async () => {
    let ideaSource: string | null = null;
    let inherited: Partial<StackManifest> = {};
    if (input.fromIdea) {
      if (!isKebabId(input.fromIdea)) {
        throw new StackValidationError([{ severity: 'error', code: 'invalid_stack_manifest', message: `fromIdea: '${input.fromIdea}' must be a stable kebab-case ID, not a path.`, member: input.fromIdea }]);
      }
      if (input.id && input.id !== input.fromIdea) {
        throw new StackValidationError([{ severity: 'error', code: 'invalid_stack_manifest', message: `Stack id '${input.id}' must equal source idea id '${input.fromIdea}'.`, member: input.fromIdea, fix: 'Omit the positional stack id or use the unchanged idea id.' }]);
      }
      ideaSource = path.join(ideasHome(root), input.fromIdea);
      if (!(await exists(ideaSource))) throw new Error(`Idea '${input.fromIdea}' not found under ideas/.`);
      await assertDirectIdeaDirectory(root, ideaSource, input.fromIdea);
      const sourceId = await readWorkItemId(ideaSource);
      if (sourceId !== input.fromIdea) {
        throw new StackValidationError([{ severity: 'error', code: 'malformed_member_metadata', message: `Idea directory '${input.fromIdea}' declares immutable id '${sourceId ?? 'none'}'.`, member: input.fromIdea, path: path.join(ideaSource, STACK_MANIFEST_FILENAME), fix: 'Repair the idea metadata before graduation.' }]);
      }
      inherited = yaml.parse(await fs.readFile(path.join(ideaSource, STACK_MANIFEST_FILENAME), 'utf-8')) as Partial<StackManifest>;
    }

    const id = input.id ?? input.fromIdea ?? generateIdeaId(input.summary);
    const manifestResult = StackManifestSchema.safeParse({
      id,
      summary: inherited.summary ?? input.summary,
      created: inherited.created ?? todayIso(),
      members: input.members,
    });
    if (!manifestResult.success) {
      throw new StackValidationError(manifestResult.error.issues.map((issue) => ({ severity: 'error', code: 'invalid_stack_manifest', message: `${issue.path.join('.') || 'manifest'}: ${issue.message}` })));
    }
    const manifest = manifestResult.data;
    if (manifest.members.includes(manifest.id)) {
      throw new StackValidationError([{
        severity: 'error',
        code: 'nested_stack',
        member: manifest.id,
        message: `Stack '${manifest.id}' cannot include itself as a member.`,
        fix: 'Use only ordinary child work-item IDs as members.',
      }]);
    }
    const destination = stackDir(root, id);
    if (await exists(destination)) throw new Error(`Stack '${id}' already exists.`);

    // Re-check every member and exclusivity while the creation lock is held.
    await resolveStackMembers(root, manifest);

    const staging = path.join(stacksHome(root), `.tmp-${id}-${randomUUID()}`);
    try {
      if (ideaSource) await fs.cp(ideaSource, staging, { recursive: true, errorOnExist: true });
      else {
        await fs.mkdir(staging);
        await fs.writeFile(path.join(staging, STACK_NOTES_FILENAME), '', 'utf-8');
      }
      await fs.writeFile(path.join(staging, STACK_MANIFEST_FILENAME), yaml.stringify(manifest), 'utf-8');
      await fs.rename(staging, destination);
      if (ideaSource) {
        try {
          await fs.rm(ideaSource, { recursive: true });
        } catch (error) {
          await fs.rm(destination, { recursive: true, force: true });
          throw error;
        }
      }
      return manifest;
    } catch (error) {
      await fs.rm(staging, { recursive: true, force: true });
      throw error;
    }
  });
}
