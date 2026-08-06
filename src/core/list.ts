import { promises as fs } from 'fs';
import path from 'path';
import { getTaskProgressForChange, formatTaskStatus } from '../utils/task-progress.js';
import { readFileSync, type Dirent } from 'fs';
import { join } from 'path';
import { MarkdownParser } from './parsers/markdown-parser.js';
import type { RootOutput } from './root-selection.js';
import { resolveProjectSpecModel } from './shared/skill-generation.js';
import {
  loadGovernedRepository,
  parseEnforcement,
  analyzePairDrift,
  type ParsedEnforcement,
} from './governed/index.js';
import type { PairCompleteness } from './schemas/governed-spec.schema.js';
import type { SpecPlane } from './artifact-graph/types.js';

interface ChangeInfo {
  name: string;
  completedTasks: number;
  totalTasks: number;
  lastModified: Date;
}

interface ListOptions {
  sort?: 'recent' | 'name';
  json?: boolean;
  root?: RootOutput;
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

async function readChangeDirectoryEntries(changesDir: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(changesDir, { withFileTypes: true });
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }
}

/**
 * Get the most recent modification time of any file in a directory (recursive).
 * Falls back to the directory's own mtime if no files are found.
 */
async function getLastModified(dirPath: string): Promise<Date> {
  let latest: Date | null = null;

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const stat = await fs.stat(fullPath);
        if (latest === null || stat.mtime > latest) {
          latest = stat.mtime;
        }
      }
    }
  }

  await walk(dirPath);

  // If no files found, use the directory's own modification time
  if (latest === null) {
    const dirStat = await fs.stat(dirPath);
    return dirStat.mtime;
  }

  return latest;
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMins > 0) {
    return `${diffMins}m ago`;
  } else {
    return 'just now';
  }
}

/**
 * Concise single-word coverage/pair state for a governed spec, in the
 * distinguishing order the cli-list spec enumerates (broken/stale/hanging/
 * planned all outrank a plain "complete", and a missing pair half outranks
 * every coverage finding).
 */
type GovernedCoverageState =
  | 'complete'
  | 'planned'
  | 'hanging'
  | 'stale'
  | 'broken'
  | 'incomplete-pair';

interface GovernedCoverageSummary {
  state: GovernedCoverageState;
  ready: boolean;
  covered: number;
  hanging: number;
  stale: number;
  broken: number;
  planned: number;
}

interface GovernedSpecInfo {
  id: string;
  requirementCount: number;
  locator: string;
  specId: string | null;
  plane: SpecPlane;
  pairStatus: PairCompleteness;
  specPath: string | null;
  enforcementPath: string | null;
  coverage: GovernedCoverageSummary;
}

const EMPTY_ENFORCEMENT: ParsedEnforcement = {
  version: null,
  spec: null,
  bindings: [],
  issues: [],
};

export class ListCommand {
  async execute(targetPath: string = '.', mode: 'changes' | 'specs' = 'changes', options: ListOptions = {}): Promise<void> {
    const { sort = 'recent', json = false, root } = options;

    if (mode === 'changes') {
      const changesDir = path.join(targetPath, 'openspec', 'changes');

      // Get all directories in changes (excluding archive)
      const entries = await readChangeDirectoryEntries(changesDir);
      const changeDirs = entries
        .filter(entry => entry.isDirectory() && entry.name !== 'archive')
        .map(entry => entry.name);

      if (changeDirs.length === 0) {
        if (json) {
          console.log(JSON.stringify({ changes: [], ...(root ? { root } : {}) }, null, 2));
        } else {
          console.log('No active changes found.');
        }
        return;
      }

      // Collect information about each change
      const changes: ChangeInfo[] = [];

      for (const changeDir of changeDirs) {
        const progress = await getTaskProgressForChange(changesDir, changeDir, targetPath);
        const changePath = path.join(changesDir, changeDir);
        const lastModified = await getLastModified(changePath);
        changes.push({
          name: changeDir,
          completedTasks: progress.completed,
          totalTasks: progress.total,
          lastModified
        });
      }

      // Sort by preference (default: recent first)
      if (sort === 'recent') {
        changes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      } else {
        changes.sort((a, b) => a.name.localeCompare(b.name));
      }

      // JSON output for programmatic use
      if (json) {
        const jsonOutput = changes.map(c => ({
          name: c.name,
          completedTasks: c.completedTasks,
          totalTasks: c.totalTasks,
          lastModified: c.lastModified.toISOString(),
          status: c.totalTasks === 0 ? 'no-tasks' : c.completedTasks === c.totalTasks ? 'complete' : 'in-progress'
        }));
        console.log(JSON.stringify({ changes: jsonOutput, ...(root ? { root } : {}) }, null, 2));
        return;
      }

      // Display results
      console.log('Changes:');
      const padding = '  ';
      const nameWidth = Math.max(...changes.map(c => c.name.length));
      for (const change of changes) {
        const paddedName = change.name.padEnd(nameWidth);
        const status = formatTaskStatus({ total: change.totalTasks, completed: change.completedTasks });
        const timeAgo = formatRelativeTime(change.lastModified);
        console.log(`${padding}${paddedName}     ${status.padEnd(12)}  ${timeAgo}`);
      }
      return;
    }

    // specs mode
    // Governed projects recursively discover plane-qualified spec/enforcement
    // pairs; legacy projects keep the flat capability listing byte-for-byte.
    const specModel = resolveProjectSpecModel(targetPath);
    if (specModel.kind === 'governed') {
      await this.listGovernedSpecs(targetPath, { json, root }, specModel.planes.map((p) => p.id));
      return;
    }

    const specsDir = path.join(targetPath, 'openspec', 'specs');
    try {
      await fs.access(specsDir);
    } catch {
      if (json) {
        console.log(JSON.stringify({ specs: [], ...(root ? { root } : {}) }, null, 2));
      } else {
        console.log('No specs found.');
      }
      return;
    }

    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    const specDirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    if (specDirs.length === 0) {
      if (json) {
        console.log(JSON.stringify({ specs: [], ...(root ? { root } : {}) }, null, 2));
      } else {
        console.log('No specs found.');
      }
      return;
    }

    type SpecInfo = { id: string; requirementCount: number };
    const specs: SpecInfo[] = [];
    for (const id of specDirs) {
      const specPath = join(specsDir, id, 'spec.md');
      try {
        const content = readFileSync(specPath, 'utf-8');
        const parser = new MarkdownParser(content);
        const spec = parser.parseSpec(id);
        specs.push({ id, requirementCount: spec.requirements.length });
      } catch {
        // If spec cannot be read or parsed, include with 0 count
        specs.push({ id, requirementCount: 0 });
      }
    }

    specs.sort((a, b) => a.id.localeCompare(b.id));

    if (json) {
      console.log(JSON.stringify({ specs, ...(root ? { root } : {}) }, null, 2));
      return;
    }

    console.log('Specs:');
    const padding = '  ';
    const nameWidth = Math.max(...specs.map(s => s.id.length));
    for (const spec of specs) {
      const padded = spec.id.padEnd(nameWidth);
      console.log(`${padding}${padded}     requirements ${spec.requirementCount}`);
    }
  }

  /**
   * List governed specs: recursively discover every plane-qualified
   * spec/enforcement pair beneath both planes, resolve each pair's stable spec
   * ID and enforcement coverage via the Unit 1-2 governed engine, and render the
   * text/JSON forms the cli-list spec requires. Legacy discovery is untouched.
   */
  private async listGovernedSpecs(
    projectRoot: string,
    output: { json: boolean; root?: RootOutput },
    planes?: string[]
  ): Promise<void> {
    const { json, root } = output;
    const openspecRoot = path.join(projectRoot, 'openspec');
    const repository = await loadGovernedRepository(openspecRoot, planes);

    if (repository.indexedPairs.length === 0) {
      if (json) {
        console.log(JSON.stringify({ specs: [], ...(root ? { root } : {}) }, null, 2));
      } else {
        console.log('No specs found.');
      }
      return;
    }

    const specs: GovernedSpecInfo[] = [];
    for (const { record, spec } of repository.indexedPairs) {
      let enforcement = EMPTY_ENFORCEMENT;
      if (record.enforcementPath) {
        try {
          const content = readFileSync(record.enforcementPath, 'utf-8');
          enforcement = parseEnforcement(content);
        } catch {
          enforcement = EMPTY_ENFORCEMENT;
        }
      }

      const analysis = await analyzePairDrift({
        record,
        spec,
        enforcement,
        projectRoot,
      });

      const coverage = summarizeCoverage(record.completeness, analysis);
      specs.push({
        id: spec.id ?? record.locator,
        requirementCount: spec.requirements.length,
        locator: record.locator,
        specId: spec.id,
        plane: record.plane,
        pairStatus: record.completeness,
        specPath: record.specPath,
        enforcementPath: record.enforcementPath,
        coverage,
      });
    }

    // Discovery already sorts by locator; keep that stable, OS-independent order.

    if (json) {
      console.log(JSON.stringify({ specs, ...(root ? { root } : {}) }, null, 2));
      return;
    }

    console.log('Specs:');
    const padding = '  ';
    const nameWidth = Math.max(...specs.map((s) => s.locator.length));
    const idWidth = Math.max(...specs.map((s) => (s.specId ?? '-').length));
    for (const spec of specs) {
      const locator = spec.locator.padEnd(nameWidth);
      const id = (spec.specId ?? '-').padEnd(idWidth);
      const summary = formatCoverageSummary(spec.coverage);
      console.log(
        `${padding}${locator}   id ${id}   requirements ${spec.requirementCount}   ${summary}`
      );
    }
  }
}

/**
 * Derive the concise coverage/pair state and drift counts for one governed pair
 * from its {@link analyzePairDrift} result. An incomplete pair (a missing spec
 * or enforcement half) outranks every coverage finding; otherwise broken beats
 * stale beats hanging beats planned, and a clean pair is `complete`.
 */
function summarizeCoverage(
  completeness: PairCompleteness,
  analysis: Awaited<ReturnType<typeof analyzePairDrift>>
): GovernedCoverageSummary {
  const { coverage } = analysis;
  const covered = coverage.requirements.filter(
    (r) => r.state === 'covered'
  ).length;
  const hanging = coverage.hangingRequirementIds.length;
  const stale = coverage.staleBindingIds.length;
  const broken = coverage.brokenBindingIds.length;
  const planned = coverage.plannedBindingIds.length;

  let state: GovernedCoverageState;
  if (completeness !== 'complete') state = 'incomplete-pair';
  else if (broken > 0) state = 'broken';
  else if (stale > 0) state = 'stale';
  else if (hanging > 0) state = 'hanging';
  else if (planned > 0) state = 'planned';
  else state = 'complete';

  return {
    state,
    ready: analysis.ready,
    covered,
    hanging,
    stale,
    broken,
    planned,
  };
}

/** Render a governed coverage summary as a compact text token with counts. */
function formatCoverageSummary(coverage: GovernedCoverageSummary): string {
  const detail: string[] = [];
  if (coverage.broken > 0) detail.push(`broken ${coverage.broken}`);
  if (coverage.stale > 0) detail.push(`stale ${coverage.stale}`);
  if (coverage.hanging > 0) detail.push(`hanging ${coverage.hanging}`);
  if (coverage.planned > 0) detail.push(`planned ${coverage.planned}`);
  const suffix = detail.length > 0 ? ` (${detail.join(', ')})` : '';
  return `coverage ${coverage.state}${suffix}`;
}
