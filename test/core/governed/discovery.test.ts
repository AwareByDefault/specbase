import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  discoverGovernedPairs,
} from '../../../src/core/governed/discovery.js';
import {
  loadGovernedRepository,
  resolvePair,
} from '../../../src/core/governed/repository.js';

let specbaseRoot: string;

function writePair(
  locator: string,
  opts: { spec?: string; enforcement?: string }
): void {
  const dir = path.join(specbaseRoot, 'specs', ...locator.split('/'));
  fs.mkdirSync(dir, { recursive: true });
  if (opts.spec !== undefined) {
    fs.writeFileSync(path.join(dir, 'spec.md'), opts.spec);
  }
  if (opts.enforcement !== undefined) {
    fs.writeFileSync(path.join(dir, 'enforcement.md'), opts.enforcement);
  }
}

function specDoc(id: string): string {
  return `---\nid: ${id}\n---\n### Requirement: R\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

const enforcementDoc = '# Enforcement\n\n```yaml\nversion: 1\nspec: x\nbindings: []\n```\n';

beforeEach(() => {
  specbaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'governed-disc-'));
});

afterEach(() => {
  fs.rmSync(specbaseRoot, { recursive: true, force: true });
});

describe('governed/discovery', () => {
  it('discovers complete pairs on both planes with plane-qualified locators', async () => {
    writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });
    writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: enforcementDoc,
    });

    const discovery = await discoverGovernedPairs(specbaseRoot);
    const locators = discovery.pairs.map((p) => p.locator);
    expect(locators).toContain('behavior/session-loop');
    expect(locators).toContain('architecture/platforms/desktop');
    expect(discovery.incompletePairs).toHaveLength(0);

    const nested = discovery.pairs.find(
      (p) => p.locator === 'architecture/platforms/desktop'
    );
    expect(nested?.completeness).toBe('complete');
    expect(nested?.specPath).toBe(
      path.join(specbaseRoot, 'specs', 'architecture', 'platforms', 'desktop', 'spec.md')
    );
  });

  it('treats a directory with no pair files as a namespace, not a pair', async () => {
    // A parent namespace holding only a child pair.
    writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: enforcementDoc,
    });
    const discovery = await discoverGovernedPairs(specbaseRoot);
    const locators = discovery.pairs.map((p) => p.locator);
    expect(locators).toEqual(['architecture/platforms/desktop']);
    // `architecture/platforms` is a pure namespace and must not appear.
    expect(locators).not.toContain('architecture/platforms');
  });

  it('allows a parent pair to coexist with child pairs without inheritance', async () => {
    writePair('architecture/platforms', {
      spec: specDoc('architecture.platforms'),
      enforcement: enforcementDoc,
    });
    writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: enforcementDoc,
    });
    const discovery = await discoverGovernedPairs(specbaseRoot);
    const locators = discovery.pairs.map((p) => p.locator).sort();
    expect(locators).toEqual([
      'architecture/platforms',
      'architecture/platforms/desktop',
    ]);
  });

  it('reports an incomplete pair when only one file is present', async () => {
    writePair('behavior/only-spec', { spec: specDoc('behavior.only-spec') });
    writePair('behavior/only-enforcement', { enforcement: enforcementDoc });

    const discovery = await discoverGovernedPairs(specbaseRoot);
    const byLocator = new Map(discovery.pairs.map((p) => [p.locator, p]));
    expect(byLocator.get('behavior/only-spec')?.completeness).toBe('spec-only');
    expect(byLocator.get('behavior/only-enforcement')?.completeness).toBe(
      'enforcement-only'
    );
    expect(discovery.incompletePairs.map((p) => p.locator).sort()).toEqual([
      'behavior/only-enforcement',
      'behavior/only-spec',
    ]);
  });

  it('never traverses hidden control directories', async () => {
    const hiddenDir = path.join(specbaseRoot, 'specs', 'behavior', '.git', 'obj');
    fs.mkdirSync(hiddenDir, { recursive: true });
    fs.writeFileSync(path.join(hiddenDir, 'spec.md'), specDoc('behavior.sneaky'));

    const discovery = await discoverGovernedPairs(specbaseRoot);
    expect(discovery.pairs).toHaveLength(0);
  });

  it('supports basename collisions across nested locators', async () => {
    writePair('behavior/desktop', {
      spec: specDoc('behavior.desktop'),
      enforcement: enforcementDoc,
    });
    writePair('architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: enforcementDoc,
    });
    const discovery = await discoverGovernedPairs(specbaseRoot);
    const locators = discovery.pairs.map((p) => p.locator).sort();
    expect(locators).toEqual([
      'architecture/platforms/desktop',
      'behavior/desktop',
    ]);
  });

  it('returns empty discovery when planes are absent', async () => {
    const discovery = await discoverGovernedPairs(specbaseRoot);
    expect(discovery.pairs).toEqual([]);
    expect(discovery.incompletePairs).toEqual([]);
    expect(discovery.unsafeLocators).toEqual([]);
  });
});

describe('governed/repository resolution', () => {
  it('resolves a pair by plane-qualified locator', async () => {
    writePair('behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });
    const repo = await loadGovernedRepository(specbaseRoot);
    const resolution = resolvePair(repo, 'behavior/session-loop');
    expect(resolution.found).toBe(true);
    if (resolution.found) {
      expect(resolution.via).toBe('locator');
      expect(resolution.pair.specPath).toContain('session-loop');
      expect(resolution.pair.enforcementPath).toContain('enforcement.md');
    }
  });

  it('resolves a moved spec by its stable spec ID regardless of locator', async () => {
    // Same stable id, "moved" to a different locator than its dotted id implies.
    writePair('architecture/relocated/here', {
      spec: specDoc('architecture.domain'),
      enforcement: enforcementDoc,
    });
    const repo = await loadGovernedRepository(specbaseRoot);
    const resolution = resolvePair(repo, 'architecture.domain');
    expect(resolution.found).toBe(true);
    if (resolution.found) {
      expect(resolution.via).toBe('spec-id');
      expect(resolution.pair.locator).toBe('architecture/relocated/here');
    }
  });

  it('reports incomplete pairs but still resolves them', async () => {
    writePair('behavior/half', { spec: specDoc('behavior.half') });
    const repo = await loadGovernedRepository(specbaseRoot);
    const resolution = resolvePair(repo, 'behavior/half');
    expect(resolution.found).toBe(true);
    if (resolution.found) {
      expect(resolution.pair.completeness).toBe('spec-only');
    }
    expect(repo.discovery.incompletePairs).toHaveLength(1);
  });

  it('returns not-found for unknown locators and spec IDs', async () => {
    const repo = await loadGovernedRepository(specbaseRoot);
    expect(resolvePair(repo, 'behavior/missing')).toEqual({
      found: false,
      reason: 'unknown-locator',
    });
    expect(resolvePair(repo, 'behavior.missing')).toEqual({
      found: false,
      reason: 'unknown-spec-id',
    });
  });

  it('detects duplicate spec IDs across the project with all locations', async () => {
    writePair('behavior/a', { spec: specDoc('shared.id') });
    writePair('behavior/b', { spec: specDoc('shared.id') });
    const repo = await loadGovernedRepository(specbaseRoot);
    expect(repo.index.conflicts).toHaveLength(1);
    expect(repo.index.conflicts[0].id).toBe('shared.id');
    expect(repo.index.conflicts[0].locations).toHaveLength(2);
  });
});
