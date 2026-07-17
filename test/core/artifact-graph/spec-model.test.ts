import { describe, it, expect } from 'vitest';
import {
  SchemaYamlSchema,
  SpecModelSchema,
  LEGACY_SPEC_MODEL,
  resolveSpecModel,
  type SchemaYaml,
} from '../../../src/core/artifact-graph/types.js';

const baseSchema: SchemaYaml = {
  name: 'test',
  version: 1,
  artifacts: [
    { id: 'a', generates: 'a.md', description: 'A', template: 'a.md', requires: [] },
  ],
};

describe('artifact-graph/types spec model', () => {
  describe('resolveSpecModel', () => {
    it('defaults to the legacy model when no specModel is declared', () => {
      expect(resolveSpecModel(baseSchema)).toEqual(LEGACY_SPEC_MODEL);
      expect(resolveSpecModel(baseSchema).kind).toBe('legacy');
    });

    it('returns the declared governed model verbatim', () => {
      const schema: SchemaYaml = {
        ...baseSchema,
        specModel: {
          kind: 'governed',
          version: 1,
          planes: ['behavior', 'architecture'],
          pairedEnforcement: true,
        },
      };
      const model = resolveSpecModel(schema);
      expect(model.kind).toBe('governed');
      expect(model.planes).toEqual(['behavior', 'architecture']);
      expect(model.pairedEnforcement).toBe(true);
    });
  });

  describe('SpecModelSchema', () => {
    it('parses a governed declaration', () => {
      const parsed = SpecModelSchema.parse({
        kind: 'governed',
        version: 1,
        planes: ['behavior', 'architecture'],
        pairedEnforcement: true,
      });
      expect(parsed.kind).toBe('governed');
    });

    it('defaults planes and pairedEnforcement', () => {
      const parsed = SpecModelSchema.parse({ kind: 'legacy', version: 1 });
      expect(parsed.planes).toEqual([]);
      expect(parsed.pairedEnforcement).toBe(false);
    });

    it('rejects an unknown plane', () => {
      expect(() =>
        SpecModelSchema.parse({
          kind: 'governed',
          version: 1,
          planes: ['behavior', 'nonsense'],
          pairedEnforcement: true,
        })
      ).toThrow();
    });
  });

  describe('SchemaYamlSchema', () => {
    it('accepts a schema that declares a governed specModel', () => {
      const result = SchemaYamlSchema.safeParse({
        name: 'governed',
        version: 1,
        artifacts: baseSchema.artifacts,
        specModel: {
          kind: 'governed',
          version: 1,
          planes: ['behavior', 'architecture'],
          pairedEnforcement: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts a schema without specModel (legacy default)', () => {
      const result = SchemaYamlSchema.safeParse({
        name: 'legacy',
        version: 1,
        artifacts: baseSchema.artifacts,
      });
      expect(result.success).toBe(true);
      expect(result.data?.specModel).toBeUndefined();
    });
  });
});
