import { describe, it, expect } from 'vitest';
import {
  analyzeRelativeLocator,
  locatorFromSegments,
  isSpecPlane,
  parseLocator,
} from '../../../src/core/governed/locator.js';

describe('governed/locator', () => {
  describe('analyzeRelativeLocator', () => {
    it('accepts a safe nested path and returns its segments', () => {
      const result = analyzeRelativeLocator('platforms/desktop', '/abs/platforms/desktop');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.segments).toEqual(['platforms', 'desktop']);
      }
    });

    it('treats a native backslash path segment-by-segment', () => {
      const result = analyzeRelativeLocator('platforms\\desktop', 'C:\\p\\desktop');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.segments).toEqual(['platforms', 'desktop']);
      }
    });

    it('rejects an absolute path with the native source path', () => {
      const result = analyzeRelativeLocator('/etc/passwd', '/etc/passwd');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.problem.reason).toBe('absolute');
        expect(result.problem.nativeSourcePath).toBe('/etc/passwd');
      }
    });

    it('rejects a parent-traversal segment and reports the offending segment', () => {
      const result = analyzeRelativeLocator('a/../b', '/root/a/../b');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.problem.reason).toBe('parent-traversal');
        expect(result.problem.offendingSegment).toBe('..');
        expect(result.problem.nativeSourcePath).toBe('/root/a/../b');
      }
    });

    it('rejects a dot segment', () => {
      const result = analyzeRelativeLocator('a/./b', '/root/a/./b');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.problem.reason).toBe('dot-segment');
      }
    });

    it('rejects an empty segment', () => {
      const result = analyzeRelativeLocator('a//b', '/root/a//b');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.problem.reason).toBe('empty-segment');
      }
    });

    it('rejects a hidden control directory segment', () => {
      const result = analyzeRelativeLocator('.git/objects', '/root/.git/objects');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.problem.reason).toBe('hidden-control-directory');
        expect(result.problem.offendingSegment).toBe('.git');
      }
    });
  });

  describe('locatorFromSegments', () => {
    it('produces a plane-qualified slash-separated locator', () => {
      expect(locatorFromSegments('architecture', ['platforms', 'desktop'])).toBe(
        'architecture/platforms/desktop'
      );
    });
  });

  describe('isSpecPlane', () => {
    it('recognizes declared planes when a set is provided and rejects others', () => {
      expect(isSpecPlane('behavior', ['behavior', 'architecture'])).toBe(true);
      expect(isSpecPlane('architecture', ['behavior', 'architecture'])).toBe(true);
      expect(isSpecPlane('nonsense', ['behavior', 'architecture'])).toBe(false);
    });

    it('accepts any kebab id when no set is provided (membership is a validation concern)', () => {
      expect(isSpecPlane('behavior')).toBe(true);
      expect(isSpecPlane('security')).toBe(true);
      expect(isSpecPlane('Not-Kebab')).toBe(false);
    });
  });

  describe('parseLocator', () => {
    it('parses a plane-qualified locator', () => {
      expect(parseLocator('behavior/session-loop')).toEqual({
        plane: 'behavior',
        segments: ['session-loop'],
      });
    });

    it('parses a deeply nested locator', () => {
      expect(parseLocator('architecture/platforms/desktop')).toEqual({
        plane: 'architecture',
        segments: ['platforms', 'desktop'],
      });
    });

    it('returns null for an unknown plane when a set is provided', () => {
      expect(parseLocator('unknown/thing', ['behavior', 'architecture'])).toBeNull();
    });

    it('accepts a declared non-default plane when a set is provided', () => {
      expect(parseLocator('security/secret-handling', ['security'])).toEqual({
        plane: 'security',
        segments: ['secret-handling'],
      });
    });

    it('returns null for a bare plane with no sub-path', () => {
      expect(parseLocator('behavior')).toBeNull();
    });

    it('returns null for an unsafe locator', () => {
      expect(parseLocator('behavior/../escape')).toBeNull();
    });
  });
});
