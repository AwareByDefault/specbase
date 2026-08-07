import { describe, it, expect } from 'vitest';
import {
  getReviewPanelSkillTemplate,
  getReviewPanelCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import {
  DEFAULT_PLANES,
  DEFAULT_LENSES,
  lensesFromPlanes,
} from '../../../src/core/governed/lenses.js';
import {
  LEGACY_SPEC_MODEL,
  type Plane,
  type SpecModel,
} from '../../../src/core/artifact-graph/types.js';

/**
 * Projection conformance for `architecture.review-panel-projection`
 * (`skill-is-projection`) and `agents.review-panel` (`lenses-conform`): the
 * generated review-panel skill's lens set equals the projection of the resolved
 * review model, and the generator consumes the model. Drives the generator
 * directly over a flat, minimal, and full (this repo's roster) model, asserting
 * the emitted lens set equals the projection with no extra lens.
 */

function governed(planes: ReadonlyArray<Plane>): SpecModel {
  return { kind: 'governed', version: 1, planes: [...planes], pairedEnforcement: true };
}

/** The lens ids named by the generated skill's method section. */
function emittedLensIds(body: string): string[] {
  const re = /^### `([^`]+)` — scope:/gm;
  const ids: string[] = [];
  for (const m of body.matchAll(re)) ids.push(m[1]);
  return ids;
}

function plane(id: string, reviewLens?: string): Plane {
  return {
    id,
    purpose: `purpose-${id}`,
    enforcementFlavor: `flavor-${id}`,
    reviewLens,
    crossCutting: false,
    defaultSelected: true,
  };
}

describe('review-panel projection conformance (skill-is-projection / lenses-conform)', () => {
  it('snapshot: this repo\u2019s roster projects to the existing six lenses (behavior-preserving for governed projects)', () => {
    const projected = lensesFromPlanes({ planes: DEFAULT_PLANES })
      .map((l) => l.id)
      .sort();
    expect(projected).toEqual([
      'architectural',
      'behavioural',
      'code-quality',
      'design',
      'enforcement',
      'ops',
    ]);
    // The shipped default constant IS that projection, not a separate copy.
    expect([...DEFAULT_LENSES].map((l) => l.id).sort()).toEqual(projected);
  });

  it('a flat/legacy model projects to the single general spec-conformance reviewer', () => {
    const body = getReviewPanelSkillTemplate(LEGACY_SPEC_MODEL).instructions;
    expect(emittedLensIds(body)).toEqual(['spec-conformance']);
    expect(getReviewPanelCommandTemplate(LEGACY_SPEC_MODEL).content).toBe(body);
  });

  it('emits exactly the projected lenses for a subset roster, no extra lens', () => {
    const planes = [
      plane('behavior', 'behavioural'),
      plane('architecture', 'architectural'),
      plane('agents'), // no reviewLens -> no lens
    ];
    const model = governed(planes);
    const projected = lensesFromPlanes({ planes: planes }).map((l) => l.id);
    const body = getReviewPanelSkillTemplate(model).instructions;

    const emitted = emittedLensIds(body).sort();
    expect(emitted).toEqual([...projected].sort());
    // Nothing absent from the projection appears (no ops/design lens, no hardcode).
    expect(body).not.toContain('`ops` — scope');
    expect(body).not.toContain('`design` — scope');
    expect(body).not.toContain('`security` — scope');
    expect(getReviewPanelCommandTemplate(model).content).toBe(body);
  });

  it('the generator consumes the model: distinct models emit distinct skills', () => {
    const flat = getReviewPanelSkillTemplate(LEGACY_SPEC_MODEL).instructions;
    const full = getReviewPanelSkillTemplate(governed(DEFAULT_PLANES)).instructions;
    const minimal = getReviewPanelSkillTemplate(
      governed([plane('behavior', 'behavioural'), plane('agents')])
    ).instructions;
    expect(flat).not.toBe(full);
    expect(full).not.toBe(minimal);
    expect(flat).not.toBe(minimal);
  });

  it('includes the gate/coverage steps only when the projection produced plane lenses', () => {
    const flat = getReviewPanelSkillTemplate(LEGACY_SPEC_MODEL).instructions;
    const full = getReviewPanelSkillTemplate(governed(DEFAULT_PLANES)).instructions;

    // Flat: the gate/coverage steps are no-ops, not real instructions.
    expect(flat).toContain('no-ops');
    expect(flat).not.toContain("Run the project's declared automated bindings");
    // Governed: the honest gate step runs the declared bindings.
    expect(full).toContain("Run the project's declared automated bindings");
    expect(full).not.toContain('no-ops');
  });
});