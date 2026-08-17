import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEnforcement } from '../../../src/core/governed/enforcement-parser.js';
import { discoverGovernedPairs } from '../../../src/core/governed/discovery.js';
import { mergeEnforcement } from '../../../src/core/governed/pair-merge.js';

describe('compact enforcement.yaml', () => {
  it('parses map-key identity and normalizes scalar/list covers', () => {
    const parsed = parseEnforcement(`bindings:\n  one:\n    type: test\n    covers: requirement-one\n    source: test/one.test.ts#case\n  two:\n    type: review\n    covers: [requirement-one, requirement-two]\n    source: enforcement\n`, { sourcePath: 'enforcement.yaml' });
    expect(parsed.issues).toEqual([]);
    expect(parsed.format).toBe('yaml');
    expect(parsed.spec).toBeNull();
    expect(parsed.bindings.map(({ id, type, covers, source }) => ({ id, type, covers, source }))).toEqual([
      { id: 'one', type: 'test', covers: ['requirement-one'], source: 'test/one.test.ts#case' },
      { id: 'two', type: 'review', covers: ['requirement-one', 'requirement-two'], source: 'enforcement' },
    ]);
  });

  it.each(['strength: automated', 'status: active', 'targets: [test/a.ts]', 'run: { command: pnpm }'])(
    'rejects legacy extra field %s',
    (extra) => {
      const parsed = parseEnforcement(`bindings:\n  one:\n    type: test\n    covers: requirement-one\n    source: test/one.test.ts\n    ${extra}\n`, { sourcePath: 'enforcement.yaml' });
      expect(parsed.bindings).toEqual([]);
      expect(parsed.issues.some((issue) => issue.code === 'invalid-document')).toBe(true);
    }
  );

  it('accepts remove only for compact change deltas and strips it from merged output', () => {
    const delta = `bindings:\n  replacement:\n    type: test\n    covers: requirement-two\n    source: test/two.test.ts\nremove: [retired]\n`;

    const permanentParse = parseEnforcement(delta, { sourcePath: 'enforcement.yaml' });
    expect(permanentParse.issues.some((issue) => issue.code === 'invalid-document')).toBe(true);

    const deltaParse = parseEnforcement(delta, {
      sourcePath: 'enforcement.yaml',
      allowDeltaRemove: true,
    });
    expect(deltaParse.issues).toEqual([]);
    expect(deltaParse.bindings.map((binding) => binding.id)).toEqual(['replacement']);

    const merged = mergeEnforcement(
      `bindings:\n  retired:\n    type: test\n    covers: requirement-one\n    source: test/one.test.ts\n`,
      delta,
      {
        currentSourcePath: 'enforcement.yaml',
        deltaSourcePath: 'enforcement.yaml',
      }
    );
    expect(merged.errors).toEqual([]);
    expect(merged.content).not.toContain('remove:');
    expect(merged.content).not.toContain('retired:');
    expect(merged.content).toContain('replacement:');
    expect(parseEnforcement(merged.content, { sourcePath: 'enforcement.yaml' }).issues).toEqual([]);
  });

  it('keeps compact delta binding values exact while allowing remove', () => {
    const parsed = parseEnforcement(
      `bindings:\n  one:\n    type: test\n    covers: requirement-one\n    source: test/one.test.ts\n    status: planned\nremove: []\n`,
      { sourcePath: 'enforcement.yaml', allowDeltaRemove: true }
    );
    expect(parsed.bindings).toEqual([]);
    expect(parsed.issues.some((issue) => issue.code === 'invalid-document')).toBe(true);
  });

  it('retains the lone Markdown fallback', () => {
    const parsed = parseEnforcement('# Enforcement\n\n```yaml\nversion: 1\nspec: behavior.demo\nbindings: []\n```\n', { sourcePath: 'enforcement.md' });
    expect(parsed.format).toBe('markdown');
    expect(parsed.spec).toBe('behavior.demo');
    expect(parsed.issues).toEqual([]);
  });

  it('rejects a fenced legacy document when its discovered filename is enforcement.yaml', () => {
    const parsed = parseEnforcement(
      '# Enforcement\n\n```yaml\nversion: 1\nspec: behavior.demo\nbindings: []\n```\n',
      { sourcePath: '/project/specs/behavior/demo/enforcement.yaml' }
    );
    expect(parsed.format).toBe('yaml');
    expect(parsed.bindings).toEqual([]);
    expect(parsed.issues.some((issue) => issue.code === 'invalid-document')).toBe(true);
  });

  it('splits every legacy target deterministically without dropping sources', () => {
    const legacy = `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: behavior.demo\nbindings:\n  - id: proof\n    covers: [requirement-one]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [test/a.test.ts, test/b.test.ts]\n  - id: proof-b\n    covers: [requirement-two]\n    mechanism: lint\n    strength: automated\n    status: active\n    targets: [test/c.test.ts]\n\`\`\`\n`;
    const merged = mergeEnforcement(legacy, 'bindings: {}\n', {
      currentSourcePath: 'enforcement.md',
      deltaSourcePath: 'enforcement.yaml',
    });
    expect(merged.errors).toEqual([]);
    const parsed = parseEnforcement(merged.content, { sourcePath: 'enforcement.yaml' });
    expect(parsed.bindings.map(({ id, type, covers, source }) => ({ id, type, covers, source }))).toEqual([
      { id: 'proof', type: 'test', covers: ['requirement-one'], source: 'test/a.test.ts' },
      { id: 'proof-b-2', type: 'test', covers: ['requirement-one'], source: 'test/b.test.ts' },
      { id: 'proof-b', type: 'lint', covers: ['requirement-two'], source: 'test/c.test.ts' },
    ]);
  });

  it('reserves delta IDs when generating legacy split IDs', () => {
    const legacy = `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: behavior.demo\nbindings:\n  - id: proof\n    covers: [requirement-one]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [test/a.ts, test/b.ts]\n\`\`\`\n`;
    const delta = `bindings:\n  proof-b:\n    type: lint\n    covers: requirement-two\n    source: test/c.ts\n`;
    const merged = mergeEnforcement(legacy, delta, {
      currentSourcePath: 'enforcement.md',
      deltaSourcePath: 'enforcement.yaml',
    });
    expect(merged.errors).toEqual([]);
    const parsed = parseEnforcement(merged.content, { sourcePath: 'enforcement.yaml' });
    expect(parsed.bindings.map(({ id, source }) => ({ id, source }))).toEqual([
      { id: 'proof', source: 'test/a.ts' },
      { id: 'proof-b-2', source: 'test/b.ts' },
      { id: 'proof-b', source: 'test/c.ts' },
    ]);
  });

  it('blocks on-touch migration when a legacy binding has no target or explicit source', () => {
    const legacy = `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: behavior.demo\nbindings:\n  - id: unresolved\n    covers: [requirement-one]\n    mechanism: manual\n    strength: manual\n    status: active\n    procedure: Inspect it.\n\`\`\`\n`;
    const merged = mergeEnforcement(legacy, 'bindings: {}\n', {
      currentSourcePath: 'enforcement.md',
      deltaSourcePath: 'enforcement.yaml',
    });
    expect(merged.errors).toContain(
      "Legacy binding 'unresolved' has no target/source; resolve it explicitly before on-touch migration."
    );
  });

  it('discovers YAML and records both filenames as an explicit conflict', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'enforcement-yaml-'));
    const pair = path.join(root, 'specbase', 'specs', 'behavior', 'demo');
    await mkdir(pair, { recursive: true });
    await writeFile(path.join(pair, 'spec.md'), '---\nid: behavior.demo\n---\n');
    await writeFile(path.join(pair, 'enforcement.yaml'), 'bindings: {}\n');
    await writeFile(path.join(pair, 'enforcement.md'), '# legacy\n');
    const discovery = await discoverGovernedPairs(path.join(root, 'specbase'));
    expect(discovery.pairs[0].enforcementPath).toBe(path.join(pair, 'enforcement.yaml'));
    expect(discovery.pairs[0].enforcementConflictPaths).toEqual([
      path.join(pair, 'enforcement.yaml'),
      path.join(pair, 'enforcement.md'),
    ]);
  });
});
