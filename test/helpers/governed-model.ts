import type { SpecModel } from '../../src/core/artifact-graph/types.js';

/**
 * A well-formed RESOLVED governed spec model for template tests: `planes` holds
 * Plane records (what `resolveSpecModel` produces), not bare ids, so plane-aware
 * guidance interpolates the roster exactly as it does at generation time.
 */
export const GOVERNED_TEST_SPEC_MODEL: SpecModel = {
  kind: 'governed',
  version: 1,
  planes: [
    {
      id: 'behavior',
      purpose: 'User/client-visible outcomes',
      enforcementFlavor: 'tests / property tests',
      crossCutting: false,
      defaultSelected: true,
    },
    {
      id: 'architecture',
      purpose: 'Package responsibilities, boundaries, and structural invariants',
      enforcementFlavor: 'lint / static-analysis / conformance',
      crossCutting: false,
      defaultSelected: true,
    },
  ],
  pairedEnforcement: true,
};
