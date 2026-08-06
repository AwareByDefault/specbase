/**
 * Review-panel lens vocabulary and routing (add-review-panel-enforcement).
 *
 * A lens is a focused reviewer that judges exactly one concern and is blind to
 * the others. Its scope is a plane-qualified locator subtree; the router assigns
 * each governed pair to the MOST-SPECIFIC lens whose subtree covers it, falling
 * back up the tree to a plane-wide default — the same most-specific-wins rule as
 * locator resolution. The defaults fall out of the governed model's own plane
 * structure (a per-plane lens plus a cross-cutting enforcement layer):
 *
 *   architectural → architecture/**   behavioural  → behavior/**
 *   ops           → ops/**            code-quality → code-quality/**
 *   design        → design-system/**  enforcement  → every pair
 *
 * This module is PURE and never runs a reviewer: it only defines the defaults
 * and resolves a binding's declared/default lens so coverage and the workflows
 * can surface lens allocation, un-lensed gaps, and split pressure. Lenses grow
 * or split by PROPOSAL (a normal change), never automatically — the tool only
 * makes the pressure visible.
 */

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

/** The default lenses, always available under the governed model. */
export const DEFAULT_LENSES: readonly LensDefinition[] = [
  {
    id: 'architectural',
    question: "Does the code deviate from the architecture specs' invariants and boundaries?",
    scope: 'architecture',
    crossCutting: false,
  },
  {
    id: 'behavioural',
    question: 'Does the code produce the behavioral specs, consistently and unerringly?',
    scope: 'behavior',
    crossCutting: false,
  },
  {
    id: 'ops',
    question: 'Does the repo use what the ops specs declare and run it as declared?',
    scope: 'ops',
    crossCutting: false,
  },
  {
    id: 'code-quality',
    question: 'Is the code clean, simple, and free of cruft?',
    scope: 'code-quality',
    crossCutting: false,
  },
  {
    id: 'design',
    question: 'Does the UI and copy honor the design tokens, principles, and voice?',
    scope: 'design-system',
    crossCutting: false,
  },
  {
    id: 'enforcement',
    question: 'Do the bound checks actually exercise the claim rather than merely running?',
    scope: '',
    crossCutting: true,
  },
];

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
