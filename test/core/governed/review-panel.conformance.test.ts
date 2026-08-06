import { describe, it, expect } from 'vitest';
import { DEFAULT_LENSES } from '../../../src/core/governed/lenses.js';
import { resolveSpecModel } from '../../../src/core/artifact-graph/types.js';
import { resolveSchema } from '../../../src/core/artifact-graph/resolver.js';

/**
 * Lens-conformance test for the `agents.review-panel` baseline spec: OpenSpec
 * OWNS its review panel (the lens set in `src/core/governed/lenses.ts`), so its
 * agentic-review enforcement is an automated `test` binding rather than the
 * review binding a consuming project gets. This is that binding's target: it
 * asserts the resolved lens set conforms to the review-panel spec — one
 * non-cross-cutting lens per governed plane plus the cross-cutting enforcement
 * lens — so the panel cannot silently drift from the governed plane roster.
 */
describe('review panel conforms to the governed plane roster', () => {
  const governed = resolveSpecModel(resolveSchema('spec-driven-governed'));
  const planeIds = governed.planes.map((p) => p.id);
  const lensedPlanes = governed.planes.filter((p) => p.reviewLens);
  const nonCrossCutting = DEFAULT_LENSES.filter((l) => !l.crossCutting);
  const crossCutting = DEFAULT_LENSES.filter((l) => l.crossCutting);

  it('provides exactly one matching lens for each plane that declares a review lens', () => {
    for (const plane of lensedPlanes) {
      const matches = nonCrossCutting.filter(
        (l) => l.id === plane.reviewLens && l.scope === plane.id
      );
      expect(
        matches,
        `expected exactly one '${plane.reviewLens}' lens scoped to plane '${plane.id}'`
      ).toHaveLength(1);
    }
  });

  it('has no non-cross-cutting lens for an undeclared plane', () => {
    for (const lens of nonCrossCutting) {
      expect(planeIds, `lens '${lens.id}' is scoped to '${lens.scope}', not a governed plane`).toContain(
        lens.scope
      );
    }
  });

  it('provides a cross-cutting enforcement lens', () => {
    expect(crossCutting.map((l) => l.id)).toContain('enforcement');
  });
});
