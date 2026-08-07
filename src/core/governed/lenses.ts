/**
 * Review-panel lens vocabulary and routing (add-review-panel-enforcement,
 * refactor-review-panel-lens-projection).
 *
 * A lens is a focused reviewer that judges exactly one concern and is blind to
 * the others. Its scope is a plane-qualified locator subtree; the router assigns
 * each governed pair to the MOST-SPECIFIC lens whose subtree covers it, falling
 * back up the tree to a plane-wide default — the same most-specific-wins rule as
 * locator resolution.
 *
 * The BASE lens set is a PROJECTION of the resolved review model, never a
 * hand-typed copy: one lens per resolved plane that declares a `reviewLens`
 * (scope = the plane's storage subtree), plus the cross-cutting `enforcement`
 * lens, plus any declared augmentation lenses (scoped sub-lenses or extra
 * cross-cutting lenses). `DEFAULT_LENSES` below is the projection of the shipped
 * default roster, so it stays the six-lens set historically shipped — but the
 * data now derives from the plane roster instead of being a separate constant
 * that could drift from it.
 *
 * This module is PURE and never runs a reviewer: it only derives the lens set
 * from a resolved model and resolves a binding's declared/default lens so
 * coverage and the workflows can surface lens allocation, un-lensed gaps, and
 * split pressure. Lenses grow or split by PROPOSAL (a normal change), never
 * automatically — the tool only makes the pressure visible.
 */
import type { Plane } from '../artifact-graph/types.js';

/** A review-panel lens: an id, the concern it judges, and its scope subtree. */
export interface LensDefinition {
  /** Kebab id, matched against a binding's declared `lens`. */
  id: string;
  /** The single concern this lens judges (human-readable). */
  question: string;
  /**
   * Scope as a plane-qualified locator prefix; `''` means the whole spec tree.
   * A scoped lens uses a deeper prefix (e.g. `architecture/rings/boundaries`).
   */
  scope: string;
  /**
   * True for lenses that apply across the whole tree/every pair rather than
   * owning a plane subtree. Cross-cutting lenses are never a subtree default the
   * router falls back to; a binding reaches them only by naming them explicitly.
   */
  crossCutting: boolean;
}

/**
 * The canonical question each shipped lens asks, keyed by lens id. A plane whose
 * `reviewLens` id is unknown (a declared augmentation or a project-defined
 * plane) falls back to a generated question below rather than carrying none.
 */
export const LENS_QUESTIONS: Readonly<Record<string, string>> = {
  architectural: "Does the code deviate from the architecture specs' invariants and boundaries?",
  behavioural: 'Does the code produce the behavioral specs, consistently and unerringly?',
  ops: 'Does the repo use what the ops specs declare and run it as declared?',
  'code-quality': 'Is the code clean, simple, and free of cruft?',
  design: 'Does the UI and copy honor the design tokens, principles, and voice?',
  enforcement: 'Do the bound checks actually exercise the claim, not merely running?',
};

/** A resolved review model, or any shape carrying a resolved plane roster. */
export interface ReviewModelLike {
  planes: readonly Plane[];
}

/**
 * Project the base lens set from a resolved review model: one NON-cross-cutting
 * lens per plane that declares a `reviewLens` (scope = the plane's storage
 * subtree), skipping planes without one, always appending the cross-cutting
 * `enforcement` lens, then any declared augmentation lenses. A flat/legacy
 * model (no planes, or no plane with a `reviewLens`) projects to just the
 * `enforcement` lens — the general spec-conformance reviewer the panel falls
 * back to — so the panel is never empty.
 */
export function lensesFromPlanes(
  model: ReviewModelLike,
  augmentation?: readonly LensDefinition[]
): LensDefinition[] {
  const lenses: LensDefinition[] = [];
  for (const plane of model.planes) {
    if (!plane.reviewLens) continue; // a plane without a reviewLens contributes no lens
    lenses.push({
      id: plane.reviewLens,
      question:
        LENS_QUESTIONS[plane.reviewLens] ??
        `Does the implementation honor the ${plane.id} specs' declared intent?`,
      scope: plane.id,
      crossCutting: false,
    });
  }
  lenses.push({
    id: 'enforcement',
    question: LENS_QUESTIONS.enforcement,
    scope: '',
    crossCutting: true,
  });
  if (augmentation) lenses.push(...augmentation);
  return lenses;
}

/**
 * The shipped default plane roster — the resolved default set of the
 * `spec-driven-governed` schema. Kept here (not read from disk) so this module
 * stays pure; the schema file and this constant are the same six planes and the
 * projection conformance test pins that they agree.
 */
export const DEFAULT_PLANES: readonly Plane[] = [
  {
    id: 'behavior',
    purpose: 'User/client-visible outcomes that must remain true',
    enforcementFlavor: 'tests / property tests',
    reviewLens: 'behavioural',
    crossCutting: false,
    defaultSelected: true,
  },
  {
    id: 'architecture',
    purpose: 'Package responsibilities, boundaries, and structural invariants',
    enforcementFlavor: 'lint / static-analysis / conformance',
    reviewLens: 'architectural',
    crossCutting: false,
    defaultSelected: true,
  },
  {
    id: 'ops',
    purpose: 'What we use and how it runs: packages, dev env, IaC, deployment',
    enforcementFlavor: 'lockfile audit / plan validate / drift detect',
    reviewLens: 'ops',
    crossCutting: false,
    defaultSelected: true,
  },
  {
    id: 'code-quality',
    purpose: 'What good code looks like: smells, qualities, and rules',
    enforcementFlavor: 'smell-lint + review',
    reviewLens: 'code-quality',
    crossCutting: false,
    defaultSelected: true,
  },
  {
    id: 'design-system',
    purpose: "The product's expressed identity: design tokens, principles, voice",
    enforcementFlavor: 'token-lint / contrast + a11y checks + design review',
    reviewLens: 'design',
    crossCutting: false,
    defaultSelected: false,
  },
  {
    id: 'agents',
    purpose: 'The repo\u2019s own agentic instruments',
    enforcementFlavor: 'instrument conforms to its spec',
    crossCutting: false,
    defaultSelected: false,
  },
];

/**
 * The default lenses for a project resolving the shipped default roster. A
 * PROJECTION, not a hand-typed copy: it is `lensesFromPlanes` over
 * `DEFAULT_PLANES`. A project whose config overrides the roster should derive
 * its own set via `lensesFromPlanes(resolvedModel)` (see governed-coverage).
 */
export const DEFAULT_LENSES: readonly LensDefinition[] = lensesFromPlanes({
  planes: DEFAULT_PLANES,
});

/** How a binding's lens was resolved. */
export type LensResolutionVia = 'declared' | 'default' | 'unresolved';

/** The outcome of routing one binding to a lens. */
export interface LensResolution {
  /** The lens id in play (a declared id, a default id, or null when none). */
  lens: string | null;
  /** True only when `lens` resolves to a defined lens. */
  resolved: boolean;
  /** The defined lens it resolved to, or null. */
  definition: LensDefinition | null;
  via: LensResolutionVia;
}

/** True when `scope` (a locator prefix; `''` = the whole tree) covers `locator`. */
export function scopeCovers(scope: string, locator: string): boolean {
  if (scope === '') return true;
  return locator === scope || locator.startsWith(`${scope}/`);
}

/** Depth (segment count) of a scope prefix; the whole-tree scope has depth 0. */
export function scopeDepth(scope: string): number {
  return scope === '' ? 0 : scope.split('/').length;
}

/**
 * The most-specific NON-cross-cutting lens whose subtree covers `locator`, or
 * null when none does. Deeper scopes win (most-specific-first); ties break by id
 * for determinism.
 */
export function resolveDefaultLens(
  locator: string,
  lenses: readonly LensDefinition[]
): LensDefinition | null {
  let best: LensDefinition | null = null;
  for (const lens of lenses) {
    if (lens.crossCutting) continue;
    if (!scopeCovers(lens.scope, locator)) continue;
    if (
      best === null ||
      lens.scope.length > best.scope.length ||
      (lens.scope.length === best.scope.length && lens.id < best.id)
    ) {
      best = lens;
    }
  }
  return best;
}

/**
 * Route one binding to a lens. A declared `lens` wins (resolving to a defined
 * lens, or `unresolved` when it names no defined lens — an un-lensed gap). With
 * no declared lens, fall back to the most-specific default subtree; when no
 * default covers the locator the claim has no covering lens (also un-lensed).
 */
export function resolveLensForBinding(
  declaredLens: string | undefined,
  locator: string,
  lenses: readonly LensDefinition[] = DEFAULT_LENSES
): LensResolution {
  if (declaredLens !== undefined) {
    const definition = lenses.find((lens) => lens.id === declaredLens) ?? null;
    return definition
      ? { lens: definition.id, resolved: true, definition, via: 'declared' }
      : { lens: declaredLens, resolved: false, definition: null, via: 'unresolved' };
  }
  const definition = resolveDefaultLens(locator, lenses);
  return definition
    ? { lens: definition.id, resolved: true, definition, via: 'default' }
    : { lens: null, resolved: false, definition: null, via: 'unresolved' };
}
