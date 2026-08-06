import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LENSES,
  scopeCovers,
  resolveDefaultLens,
  resolveLensForBinding,
  type LensDefinition,
} from '../../../src/core/governed/lenses.js';

describe('lens vocabulary — defaults', () => {
  it('ships the structural defaults with the model scopes', () => {
    const byId = new Map(DEFAULT_LENSES.map((l) => [l.id, l]));
    expect([...byId.keys()].sort()).toEqual([
      'architectural',
      'behavioural',
      'code-quality',
      'design',
      'enforcement',
      'ops',
    ]);
    expect(byId.get('architectural')!.scope).toBe('architecture');
    expect(byId.get('behavioural')!.scope).toBe('behavior');
    expect(byId.get('ops')!.scope).toBe('ops');
    expect(byId.get('code-quality')!.scope).toBe('code-quality');
    expect(byId.get('design')!.scope).toBe('design-system');
    expect(byId.get('design')!.crossCutting).toBe(false);
    // enforcement is cross-cutting (whole tree / every pair); the plane-bound
    // lenses scope to their plane subtree.
    expect(byId.get('enforcement')!.crossCutting).toBe(true);
    expect(byId.get('code-quality')!.crossCutting).toBe(false);
  });
});

describe('scopeCovers', () => {
  it('covers the subtree and the exact node, and the whole tree for empty scope', () => {
    expect(scopeCovers('architecture', 'architecture')).toBe(true);
    expect(scopeCovers('architecture', 'architecture/rings/boundaries')).toBe(true);
    expect(scopeCovers('architecture', 'behavior/session')).toBe(false);
    expect(scopeCovers('', 'behavior/anything')).toBe(true);
  });

  it('matches only on segment boundaries (no string-prefix bleed)', () => {
    expect(scopeCovers('architecture', 'architecture-legacy')).toBe(false);
    expect(scopeCovers('architecture', 'architecture-legacy/rings')).toBe(false);
  });
});

describe('resolveDefaultLens — most-specific-wins', () => {
  const boundaries: LensDefinition = {
    id: 'boundaries',
    question: 'q',
    scope: 'architecture/rings/boundaries',
    crossCutting: false,
  };
  const withScoped = [...DEFAULT_LENSES, boundaries];

  it('routes a pair to the plane-wide default when no scoped lens covers it', () => {
    const lens = resolveDefaultLens('architecture/domain', withScoped);
    expect(lens?.id).toBe('architectural');
  });

  it('routes a pair under a scoped lens to the scoped lens, not the plane default', () => {
    const lens = resolveDefaultLens('architecture/rings/boundaries', withScoped);
    expect(lens?.id).toBe('boundaries');
  });

  it('returns null when no non-cross-cutting default covers the locator', () => {
    // A lens set with only cross-cutting lenses cannot cover any subtree.
    const onlyCrossCutting = DEFAULT_LENSES.filter((l) => l.crossCutting);
    expect(resolveDefaultLens('behavior/x', onlyCrossCutting)).toBeNull();
  });
});

describe('resolveLensForBinding', () => {
  it('resolves a declared lens that names a defined lens', () => {
    const r = resolveLensForBinding('architectural', 'architecture/domain');
    expect(r).toMatchObject({ lens: 'architectural', resolved: true, via: 'declared' });
  });

  it('marks a declared lens that names no defined lens as unresolved', () => {
    const r = resolveLensForBinding('security', 'architecture/domain');
    expect(r).toMatchObject({ lens: 'security', resolved: false, via: 'unresolved' });
    expect(r.definition).toBeNull();
  });

  it('falls back to the plane-wide default when no lens is declared', () => {
    expect(resolveLensForBinding(undefined, 'behavior/session')).toMatchObject({
      lens: 'behavioural',
      resolved: true,
      via: 'default',
    });
    expect(resolveLensForBinding(undefined, 'architecture/domain')).toMatchObject({
      lens: 'architectural',
      resolved: true,
      via: 'default',
    });
  });

  it('is unresolved (no covering lens) when nothing declared and no default covers', () => {
    const onlyCrossCutting = DEFAULT_LENSES.filter((l) => l.crossCutting);
    const r = resolveLensForBinding(undefined, 'behavior/x', onlyCrossCutting);
    expect(r).toMatchObject({ lens: null, resolved: false, via: 'unresolved' });
  });

  it('degrades to unresolved against an empty lens set, declared or not', () => {
    expect(resolveLensForBinding(undefined, 'behavior/x', [])).toMatchObject({
      lens: null,
      resolved: false,
      via: 'unresolved',
    });
    expect(resolveLensForBinding('architectural', 'behavior/x', [])).toMatchObject({
      lens: 'architectural',
      resolved: false,
      via: 'unresolved',
    });
  });
});
