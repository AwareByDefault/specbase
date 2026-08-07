import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { computeRepoCoverage } from '../../../src/core/artifact-graph/governed-coverage.js';

let tempDir: string;
let specbaseRoot: string;

function specDoc(id: string): string {
  return `---\nid: ${id}\n---\n### Requirement: R\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

/** A review binding covering `r`, optionally naming a lens. */
function reviewEnforcement(id: string, opts: { lens?: string } = {}): string {
  const lensLine = opts.lens ? `    lens: ${opts.lens}\n` : '';
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: rv\n    covers: [r]\n    mechanism: review\n    strength: review\n    status: active\n${lensLine}    review:\n      procedure: Inspect the boundaries\n\`\`\`\n`;
}

async function writePair(
  locator: string,
  opts: { spec?: string; enforcement?: string }
): Promise<void> {
  const dir = path.join(tempDir, 'specbase', 'specs', ...locator.split('/'));
  await fs.mkdir(dir, { recursive: true });
  if (opts.spec !== undefined) await fs.writeFile(path.join(dir, 'spec.md'), opts.spec);
  if (opts.enforcement !== undefined)
    await fs.writeFile(path.join(dir, 'enforcement.md'), opts.enforcement);
}

beforeEach(async () => {
  tempDir = path.join(
    os.tmpdir(),
    `specbase-cov-lens-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  specbaseRoot = path.join(tempDir, 'specbase');
  await fs.mkdir(specbaseRoot, { recursive: true });
  // Declare the governed model so the lens projection resolves the shipped
  // default roster (the coverage lens views route over the resolved model).
  await fs.writeFile(
    path.join(specbaseRoot, 'config.yaml'),
    'schema: spec-driven-governed\n'
  );
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('coverage lens rollup', () => {
  it('counts review claims per default lens by plane fallback and declared lens', async () => {
    await writePair('behavior/session', {
      spec: specDoc('behavior.session'),
      enforcement: reviewEnforcement('behavior.session'), // no lens -> behavioural
    });
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: reviewEnforcement('architecture.domain', { lens: 'code-quality' }),
    });

    const coverage = await computeRepoCoverage(specbaseRoot, tempDir);
    const byLens = new Map(coverage.lenses.rollup.map((e) => [e.lens, e.reviewClaims]));
    // All default-selected lenses always appear (even at zero); design-system
    // opts out of the schema default roster, so no design lens resolves here.
    expect([...byLens.keys()].sort()).toEqual([
      'architectural',
      'behavioural',
      'code-quality',
      'enforcement',
      'ops',
    ]);
    expect(byLens.get('behavioural')).toBe(1);
    expect(byLens.get('code-quality')).toBe(1);
    expect(byLens.get('architectural')).toBe(0);
    expect(coverage.lenses.unlensedReviews).toEqual([]);
    // None of this affects validity (a review-covered pair is degraded, not rot).
    expect(coverage.valid).toBe(true);
  });
});

describe('coverage un-lensed review gap', () => {
  it('flags a review binding naming an undefined lens, without gating', async () => {
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: reviewEnforcement('architecture.domain', { lens: 'security' }),
    });

    const coverage = await computeRepoCoverage(specbaseRoot, tempDir);
    expect(coverage.lenses.unlensedReviews).toEqual([
      {
        locator: 'architecture/domain',
        specId: 'architecture.domain',
        bindingId: 'rv',
        declaredLens: 'security',
        reason: 'undefined-lens',
      },
    ]);
    // The undefined lens does not accumulate in the rollup.
    const byLens = new Map(coverage.lenses.rollup.map((e) => [e.lens, e.reviewClaims]));
    expect([...byLens.keys()]).not.toContain('security');
    // Un-lensed reviews never gate.
    expect(coverage.valid).toBe(true);
  });
});

describe('coverage split candidate', () => {
  it('surfaces a subtree over the threshold under one broad lens, informational only', async () => {
    for (const seg of ['a', 'b']) {
      await writePair(`architecture/rings/${seg}`, {
        spec: specDoc(`architecture.rings-${seg}`),
        enforcement: reviewEnforcement(`architecture.rings-${seg}`), // -> architectural
      });
    }

    const coverage = await computeRepoCoverage(specbaseRoot, tempDir, {
      splitThreshold: 1,
    });
    expect(coverage.lenses.splitCandidates).toEqual([
      {
        lens: 'architectural',
        subtree: 'architecture/rings',
        reviewClaims: 2,
        threshold: 1,
      },
    ]);
    expect(coverage.valid).toBe(true);
  });

  it('does not flag a subtree sitting exactly AT the threshold (strictly greater)', async () => {
    for (const seg of ['a', 'b']) {
      await writePair(`architecture/rings/${seg}`, {
        spec: specDoc(`architecture.rings-${seg}`),
        enforcement: reviewEnforcement(`architecture.rings-${seg}`),
      });
    }
    const coverage = await computeRepoCoverage(specbaseRoot, tempDir, {
      splitThreshold: 2,
    });
    expect(coverage.lenses.splitCandidates).toEqual([]);
  });

  it('emits no split candidate under the default threshold', async () => {
    await writePair('architecture/rings/a', {
      spec: specDoc('architecture.rings-a'),
      enforcement: reviewEnforcement('architecture.rings-a'),
    });
    const coverage = await computeRepoCoverage(specbaseRoot, tempDir);
    expect(coverage.lenses.splitCandidates).toEqual([]);
    expect(coverage.lenses.threshold).toBe(4);
  });
});

describe('coverage lens views — determinism', () => {
  it('serializes byte-identically across two runs', async () => {
    await writePair('behavior/b', {
      spec: specDoc('behavior.b'),
      enforcement: reviewEnforcement('behavior.b', { lens: 'bogus' }),
    });
    await writePair('architecture/a', {
      spec: specDoc('architecture.a'),
      enforcement: reviewEnforcement('architecture.a'),
    });

    const serialize = async () => {
      const { repository, analyses, ...rest } = await computeRepoCoverage(
        specbaseRoot,
        tempDir
      );
      return JSON.stringify(rest.lenses);
    };
    expect(await serialize()).toBe(await serialize());
  });
});
