/**
 * Governed-aware enrichment for the schema-driven status / instructions surface
 * (design decisions 6 and 9, cli-artifact-workflow spec).
 *
 * The legacy flat workflow never reaches this module: every entry point returns
 * `undefined` unless the change's resolved spec model is `governed`, so legacy
 * status / instruction output stays byte-for-byte unchanged. Under the governed
 * model it exposes, as additive JSON, the concrete governed pair paths and pair
 * context the workflow guidance (authored in Unit 3) already tells agents to
 * read from CLI output:
 *
 *   - behavioral and architectural target roots (delta + current),
 *   - every governed spec / enforcement DELTA pair under the change, with its
 *     plane, normalized locator, stable spec ID, and native `spec.md` /
 *     `enforcement.md` paths and completeness, and
 *   - the corresponding permanent ("current") pair when one exists.
 *
 * It consumes the Unit 1-2 governed repository APIs and never re-parses the
 * governed file format itself.
 */
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { resolveSchema } from './resolver.js';
import {
  resolveSpecModel,
  type SpecModel,
  type SpecPlane,
} from './types.js';
import { mergeProjectPlanes } from '../shared/skill-generation.js';
import { readProjectConfig } from '../project-config.js';
import type {
  ArtifactInstructions,
  ChangeContext,
  ChangeStatus,
} from './instruction-loader.js';
import {
  discoverGovernedPairs,
  loadGovernedRepository,
  parseGovernedSpec,
  planeRoot,
  type IndexedPair,
} from '../governed/index.js';
import type { PairCompleteness } from '../schemas/governed-spec.schema.js';

/** Behavioral / architectural target roots for a governed change. */
export interface GovernedPlaneRoot {
  plane: SpecPlane;
  /** Native delta plane root under the change dir (`specs/<plane>`). */
  deltaRoot: string;
  /** Native current plane root under the specbase root (`specs/<plane>`). */
  currentRoot: string;
}

/** The permanent governed pair a delta targets, when it already exists. */
export interface GovernedCurrentPair {
  /** Project-unique stable spec ID, or null when the current spec is absent/unparsed. */
  specId: string | null;
  /** Plane-qualified, slash-separated locator. */
  locator: string;
  /** Native current `spec.md` path, or null. */
  specPath: string | null;
  /** Native current `enforcement.md` path, or null. */
  enforcementPath: string | null;
  completeness: PairCompleteness;
}

/** One governed spec/enforcement DELTA pair authored under the change. */
export interface GovernedDeltaPair {
  plane: SpecPlane;
  /** Plane-qualified, slash-separated locator, e.g. `behavior/session-loop`. */
  locator: string;
  /** Project-unique stable spec ID from the delta `spec.md` frontmatter, when authored. */
  specId: string | null;
  /** Native delta `spec.md` path, or null when only enforcement was authored. */
  specPath: string | null;
  /** Native delta `enforcement.md` path, or null when the spec is not yet paired. */
  enforcementPath: string | null;
  /** `complete` | `spec-only` | `enforcement-only` on disk. */
  completeness: PairCompleteness;
  /** The corresponding permanent pair at the same locator (or spec ID), when it exists. */
  currentPair?: GovernedCurrentPair;
}

/**
 * The additive governed payload attached to status / instructions / apply
 * output. Present only under the governed spec model.
 */
export interface GovernedWorkflowContext {
  /** Behavioral and architectural target roots (delta + current). */
  planeRoots: GovernedPlaneRoot[];
  /** Every governed spec/enforcement delta pair discovered under the change. */
  deltaPairs: GovernedDeltaPair[];
}

export interface GovernedContextResult {
  /** Resolved spec model (`kind: "governed"` here). */
  specModel: SpecModel;
  /** The governed pair + plane context. */
  governed: GovernedWorkflowContext;
}

/**
 * The specbase root that holds the permanent governed pairs, derived from the
 * change directory (`<specbaseRoot>/changes/<change>` → `<specbaseRoot>`). This
 * matches the repo and store layouts without threading a separate root through.
 */
function specbaseRootForChange(changeDir: string): string {
  return path.resolve(changeDir, '..', '..');
}

/**
 * Build the governed workflow context for a change, or `undefined` when the
 * resolved spec model is legacy. Discovers the change's delta pairs, reads each
 * delta spec's stable ID, and attaches the corresponding permanent pair (matched
 * by locator, falling back to stable spec ID so a moved spec still links).
 */
export async function loadGovernedContext(
  context: ChangeContext
): Promise<GovernedContextResult | undefined> {
  const schema = resolveSchema(context.schemaName, context.projectRoot);
  const specModel = mergeProjectPlanes(
    resolveSpecModel(schema),
    readProjectConfig(context.projectRoot)
  );
  if (specModel.kind !== 'governed') {
    return undefined;
  }

  const changeDir = context.changeDir;
  const specbaseRoot = specbaseRootForChange(changeDir);

  // Change deltas live under `<changeDir>/specs/<plane>/...`; permanent pairs
  // under `<specbaseRoot>/specs/<plane>/...`. Both use the governed discovery.
  const planes = specModel.planes.map((p) => p.id);
  const [deltaDiscovery, repository] = await Promise.all([
    discoverGovernedPairs(changeDir, planes),
    loadGovernedRepository(specbaseRoot, planes),
  ]);

  const currentByLocator = new Map<string, IndexedPair>();
  for (const indexed of repository.indexedPairs) {
    currentByLocator.set(indexed.record.locator, indexed);
  }

  const deltaPairs: GovernedDeltaPair[] = [];
  for (const record of deltaDiscovery.pairs) {
    let specId: string | null = null;
    if (record.specPath) {
      const content = await fs.readFile(record.specPath, 'utf-8');
      specId = parseGovernedSpec(content).id;
    }

    // Primary correspondence is the shared plane-qualified locator; a moved spec
    // (same stable ID, new locator) still links through the spec-ID index.
    const current =
      currentByLocator.get(record.locator) ??
      (specId ? repository.index.bySpecId.get(specId) : undefined);

    const deltaPair: GovernedDeltaPair = {
      plane: record.plane,
      locator: record.locator,
      specId,
      specPath: record.specPath,
      enforcementPath: record.enforcementPath,
      completeness: record.completeness,
    };

    if (current) {
      deltaPair.currentPair = {
        specId: current.spec.id,
        locator: current.record.locator,
        specPath: current.record.specPath,
        enforcementPath: current.record.enforcementPath,
        completeness: current.record.completeness,
      };
    }

    deltaPairs.push(deltaPair);
  }

  const planeRoots: GovernedPlaneRoot[] = planes.map((plane) => ({
    plane,
    deltaRoot: planeRoot(changeDir, plane),
    currentRoot: planeRoot(specbaseRoot, plane),
  }));

  return { specModel, governed: { planeRoots, deltaPairs } };
}

/**
 * Return `status` enriched with the governed spec model and pair context when
 * the change uses the governed model; otherwise return it unchanged. Callers at
 * the command boundary await this after the synchronous {@link formatChangeStatus}.
 */
export async function withGovernedStatus(
  status: ChangeStatus,
  context: ChangeContext
): Promise<ChangeStatus> {
  const result = await loadGovernedContext(context);
  if (!result) return status;
  return { ...status, specModel: result.specModel, governed: result.governed };
}

/**
 * Return `instructions` enriched with the governed spec model and pair context
 * when the change uses the governed model; otherwise return it unchanged.
 */
export async function withGovernedInstructions(
  instructions: ArtifactInstructions,
  context: ChangeContext
): Promise<ArtifactInstructions> {
  const result = await loadGovernedContext(context);
  if (!result) return instructions;
  return { ...instructions, specModel: result.specModel, governed: result.governed };
}

/**
 * Every corresponding current-pair source file (native `spec.md` /
 * `enforcement.md` paths that exist on disk), deduped and stable-sorted. Apply
 * context surfaces these so implementation can read the permanent pairs a change
 * modifies.
 */
export function collectCurrentPairFiles(
  governed: GovernedWorkflowContext
): string[] {
  const files = new Set<string>();
  for (const pair of governed.deltaPairs) {
    const current = pair.currentPair;
    if (!current) continue;
    if (current.specPath) files.add(current.specPath);
    if (current.enforcementPath) files.add(current.enforcementPath);
  }
  return Array.from(files).sort();
}
