import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { SpecPlane } from '../artifact-graph/types.js';
import type { GovernedPairRecord } from '../schemas/governed-spec.schema.js';
import {
  GOVERNED_SPECS_DIRNAME,
  analyzeRelativeLocator,
  locatorFromSegments,
  type UnsafeLocator,
} from './locator.js';

/**
 * Safe recursive discovery of governed pairs beneath the specs root. Uses
 * native path operations throughout and only exposes normalized
 * slash-separated locators.
 *
 * Discovery is FILESYSTEM-DRIVEN: every top-level directory under `specs/`
 * is treated as a plane root and walked for pairs. Plane membership (whether a
 * discovered plane id is in the project's resolved set) is a VALIDATION
 * concern, not a discovery concern, so an unknown plane is still discovered
 * and surfaced to validation rather than silently dropped. A directory is a
 * *pair* when it holds spec.md and/or enforcement.md. A directory with
 * neither is a *namespace* — it is walked for children but is not itself a pair.
 * Directory ancestry provides navigation only; nothing here inherits requirements.
 */

const SPEC_FILENAME = 'spec.md';
const ENFORCEMENT_FILENAME = 'enforcement.md';

export interface GovernedDiscovery {
  /** Every discovered pair, including incomplete ones, sorted by locator. */
  pairs: GovernedPairRecord[];
  /** Pairs missing exactly one of the two files (subset of `pairs`). */
  incompletePairs: GovernedPairRecord[];
  /** Directories rejected for unsafe locators, never surfaced as pairs. */
  unsafeLocators: UnsafeLocator[];
}

export function governedSpecsRoot(specbaseRoot: string): string {
  return path.join(specbaseRoot, GOVERNED_SPECS_DIRNAME);
}

export function planeRoot(specbaseRoot: string, plane: SpecPlane): string {
  return path.join(governedSpecsRoot(specbaseRoot), plane);
}

async function hasFile(dir: string, name: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(dir, name));
    return stat.isFile();
  } catch {
    return false;
  }
}

function toRecord(
  plane: SpecPlane,
  segments: string[],
  dir: string,
  hasSpec: boolean,
  hasEnforcement: boolean
): GovernedPairRecord {
  const completeness = hasSpec
    ? hasEnforcement
      ? ('complete' as const)
      : ('spec-only' as const)
    : ('enforcement-only' as const);
  return {
    plane,
    locator: locatorFromSegments(plane, segments),
    dir,
    specPath: hasSpec ? path.join(dir, SPEC_FILENAME) : null,
    enforcementPath: hasEnforcement ? path.join(dir, ENFORCEMENT_FILENAME) : null,
    completeness,
  };
}

/**
 * Recursively walk one plane, collecting pairs and unsafe-locator problems.
 * Hidden directories (leading `.`) are never traversed — they are reserved
 * control directories, not namespaces.
 */
async function walkPlane(
  plane: SpecPlane,
  root: string,
  relSegments: string[],
  dir: string,
  out: { pairs: GovernedPairRecord[]; unsafe: UnsafeLocator[] }
): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // plane or subtree does not exist
  }

  // A pair lives at any depth >= 1 below the plane; the plane root itself is
  // never a pair (its locator would be empty).
  if (relSegments.length > 0) {
    const nativeSourcePath = dir;
    const analysis = analyzeRelativeLocator(
      relSegments.join(path.sep),
      nativeSourcePath
    );
    const [hasSpec, hasEnforcement] = await Promise.all([
      hasFile(dir, SPEC_FILENAME),
      hasFile(dir, ENFORCEMENT_FILENAME),
    ]);
    if (hasSpec || hasEnforcement) {
      if (analysis.ok) {
        out.pairs.push(
          toRecord(plane, analysis.segments, dir, hasSpec, hasEnforcement)
        );
      } else {
        out.unsafe.push(analysis.problem);
      }
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue; // reserved hidden control dir
    await walkPlane(
      plane,
      root,
      [...relSegments, entry.name],
      path.join(dir, entry.name),
      out
    );
  }
}

/**
 * Discover every governed pair beneath the given specbase root by walking
 * every top-level directory under `specs/` as a plane root. Missing plane
 * directories are treated as empty, not errors. The optional `planes` filter,
 * when provided, RESTRICTS discovery to the named plane roots; when omitted,
 * every top-level directory under specs is walked so unknown planes are still surfaced.
 */
export async function discoverGovernedPairs(
  specbaseRoot: string,
  planes?: readonly SpecPlane[]
): Promise<GovernedDiscovery> {
  const out = { pairs: [] as GovernedPairRecord[], unsafe: [] as UnsafeLocator[] };

  const specsRoot = governedSpecsRoot(specbaseRoot);
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(specsRoot, { withFileTypes: true });
  } catch {
    entries = [];
  }
  const planeDirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);
  const selected = planes && planes.length > 0 ? planeDirs.filter((p) => planes.includes(p)) : planeDirs;

  for (const plane of selected) {
    const root = planeRoot(specbaseRoot, plane);
    await walkPlane(plane, root, [], root, out);
  }

  out.pairs.sort((a, b) => a.locator.localeCompare(b.locator));
  out.unsafe.sort((a, b) => a.nativeSourcePath.localeCompare(b.nativeSourcePath));

  const incompletePairs = out.pairs.filter((p) => p.completeness !== 'complete');

  return {
    pairs: out.pairs,
    incompletePairs,
    unsafeLocators: out.unsafe,
  };
}
