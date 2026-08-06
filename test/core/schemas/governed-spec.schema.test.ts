import { describe, it, expect } from 'vitest';
import {
  SpecIdSchema,
  LocalSlugSchema,
  GovernedSpecFrontmatterSchema,
  GovernedSpecRecordSchema,
  EnforcementDocumentSchema,
  GovernedPairRecordSchema,
} from '../../../src/core/schemas/governed-spec.schema.js';

describe('governed-spec.schema', () => {
  describe('SpecIdSchema', () => {
    it('accepts dotted kebab spec IDs', () => {
      expect(SpecIdSchema.safeParse('architecture.domain').success).toBe(true);
      expect(SpecIdSchema.safeParse('behavior.session-loop').success).toBe(true);
      expect(SpecIdSchema.safeParse('single').success).toBe(true);
    });

    it('rejects malformed spec IDs', () => {
      expect(SpecIdSchema.safeParse('Architecture.Domain').success).toBe(false);
      expect(SpecIdSchema.safeParse('a..b').success).toBe(false);
      expect(SpecIdSchema.safeParse('a/b').success).toBe(false);
      expect(SpecIdSchema.safeParse('').success).toBe(false);
    });
  });

  describe('LocalSlugSchema', () => {
    it('accepts plain kebab slugs and rejects dotted/upper forms', () => {
      expect(LocalSlugSchema.safeParse('domain-determinism').success).toBe(true);
      expect(LocalSlugSchema.safeParse('a.b').success).toBe(false);
      expect(LocalSlugSchema.safeParse('Bad').success).toBe(false);
    });
  });

  describe('GovernedSpecFrontmatterSchema', () => {
    it('requires a valid id', () => {
      expect(GovernedSpecFrontmatterSchema.safeParse({ id: 'behavior.x' }).success).toBe(true);
      expect(GovernedSpecFrontmatterSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('GovernedSpecRecordSchema', () => {
    it('parses a full governed spec record', () => {
      const result = GovernedSpecRecordSchema.safeParse({
        id: 'architecture.domain',
        requirements: [
          {
            id: 'domain-determinism',
            title: 'Domain determinism',
            scenarios: [{ id: 'ambient-time-rejected', title: 'Ambient time is rejected' }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('EnforcementDocumentSchema', () => {
    it('parses the authoritative enforcement YAML shape with a binding', () => {
      const result = EnforcementDocumentSchema.safeParse({
        version: 1,
        spec: 'architecture.domain',
        bindings: [
          {
            id: 'import-boundary',
            covers: ['domain-determinism', 'ambient-time-rejected'],
            mechanism: 'lint',
            strength: 'automated',
            status: 'active',
            targets: ['tools/lint/boundaries.test.ts'],
            run: { command: 'pnpm', args: ['vitest', 'run'], cwd: '.' },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('defaults an empty bindings list', () => {
      const result = EnforcementDocumentSchema.parse({ version: 1, spec: 'behavior.x' });
      expect(result.bindings).toEqual([]);
    });

    it('rejects an unknown mechanism', () => {
      const result = EnforcementDocumentSchema.safeParse({
        version: 1,
        spec: 'behavior.x',
        bindings: [
          {
            id: 'b',
            mechanism: 'telepathy',
            strength: 'automated',
            status: 'active',
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GovernedPairRecordSchema', () => {
    it('accepts a complete and an incomplete pair record', () => {
      expect(
        GovernedPairRecordSchema.safeParse({
          plane: 'behavior',
          locator: 'behavior/session-loop',
          dir: '/p/behavior/session-loop',
          specPath: '/p/behavior/session-loop/spec.md',
          enforcementPath: '/p/behavior/session-loop/enforcement.md',
          completeness: 'complete',
        }).success
      ).toBe(true);

      expect(
        GovernedPairRecordSchema.safeParse({
          plane: 'architecture',
          locator: 'architecture/x',
          dir: '/p/architecture/x',
          specPath: '/p/architecture/x/spec.md',
          enforcementPath: null,
          completeness: 'spec-only',
        }).success
      ).toBe(true);
    });
  });
});
