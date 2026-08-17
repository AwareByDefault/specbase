import { describe, expect, it } from 'vitest';
import { SpecModelSchema } from '../../../src/core/artifact-graph/types.js';
import { mergeProjectEnforcementTypes } from '../../../src/core/shared/skill-generation.js';

const model = SpecModelSchema.parse({ kind: 'governed', version: 1, planes: [] });
const custom = { id: 'nix-check', purpose: 'Evaluated Nix assertions.', strength: 'automated', sourceKind: 'file' } as const;

describe('resolved enforcement types', () => {
  it('seeds curated defaults', () => {
    expect(model.enforcement.types.map((type) => type.id)).toEqual([
      'test', 'lint', 'static-analysis', 'command', 'review', 'manual',
    ]);
  });

  it('supports replacement and append', () => {
    const replaced = mergeProjectEnforcementTypes(model, {
      specModel: { enforcement: { types: [custom] } },
    } as never);
    expect(replaced.enforcement.types).toEqual([custom]);

    const appended = mergeProjectEnforcementTypes(model, {
      specModel: { enforcement: { 'types+': [custom] } },
    } as never);
    expect(appended.enforcement.types.at(-1)).toEqual(custom);
  });

  it.each([
    { types: [custom, custom] },
    { types: [{ ...custom, id: 'Not Kebab' }] },
    { types: [{ ...custom, strength: 'absolute' }] },
    { types: [custom], 'types+': [custom] },
  ])('falls back to schema defaults for invalid or ambiguous declarations', (enforcement) => {
    const resolved = mergeProjectEnforcementTypes(model, {
      specModel: { enforcement },
    } as never);
    expect(resolved.enforcement.types).toEqual(model.enforcement.types);
  });
});
