import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  loadChangeContext,
  formatChangeStatus,
  generateInstructions,
  loadGovernedContext,
  withGovernedStatus,
  withGovernedInstructions,
  collectCurrentPairFiles,
} from '../../../src/core/artifact-graph/index.js';

const GOVERNED_SCHEMA = 'spec-driven-governed';
const LEGACY_SCHEMA = 'spec-driven';
const CHANGE = 'add-governed';

let projectRoot: string;

/** Native change directory for the fixture change. */
function changeDir(): string {
  return path.join(projectRoot, 'openspec', 'changes', CHANGE);
}

/** Canonicalized (realpath) change dir — matches the path recorded on the change context. */
function realChangeDir(): string {
  return fs.realpathSync(changeDir());
}

/** Canonicalized openspec root, two levels above the change dir. */
function realOpenspecRoot(): string {
  return path.resolve(realChangeDir(), '..', '..');
}

/** A valid governed spec.md declaring `id` plus one requirement/scenario. */
function specDoc(id: string): string {
  return `---\nid: ${id}\n---\n### Requirement: R\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

const enforcementDoc =
  '# Enforcement\n\n```yaml\nversion: 1\nspec: x\nbindings: []\n```\n';

/**
 * Write a governed pair under either the change delta root
 * (`<changeDir>/specs/<locator>`) or the permanent current root
 * (`<openspec>/specs/<locator>`).
 */
function writePair(
  scope: 'delta' | 'current',
  locator: string,
  opts: { spec?: string; enforcement?: string }
): void {
  const base =
    scope === 'delta'
      ? changeDir()
      : path.join(projectRoot, 'openspec');
  const dir = path.join(base, 'specs', ...locator.split('/'));
  fs.mkdirSync(dir, { recursive: true });
  if (opts.spec !== undefined) {
    fs.writeFileSync(path.join(dir, 'spec.md'), opts.spec);
  }
  if (opts.enforcement !== undefined) {
    fs.writeFileSync(path.join(dir, 'enforcement.md'), opts.enforcement);
  }
}

/** Load the change context for the given schema (change dir must exist). */
function context(schema: string) {
  fs.mkdirSync(changeDir(), { recursive: true });
  return loadChangeContext(projectRoot, CHANGE, schema, {
    changeDir: changeDir(),
  });
}

beforeEach(() => {
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'governed-ctx-'));
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

describe('loadGovernedContext (governed schema)', () => {
  it('exposes both plane roots (behavior + architecture) with delta and current roots', async () => {
    writePair('delta', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });

    const result = await loadGovernedContext(context(GOVERNED_SCHEMA));
    expect(result).toBeDefined();
    const planes = result!.governed.planeRoots;
    expect(planes.map((p) => p.plane).sort()).toEqual([
      'architecture',
      'behavior',
    ]);
    const behavior = planes.find((p) => p.plane === 'behavior')!;
    expect(behavior.deltaRoot).toBe(
      path.join(realChangeDir(), 'specs', 'behavior')
    );
    expect(behavior.currentRoot).toBe(
      path.join(realOpenspecRoot(), 'specs', 'behavior')
    );
  });

  it('reports a complete delta pair with its spec id, paired paths, and completeness', async () => {
    writePair('delta', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });

    const result = await loadGovernedContext(context(GOVERNED_SCHEMA));
    const pairs = result!.governed.deltaPairs;
    expect(pairs).toHaveLength(1);
    const [pair] = pairs;
    expect(pair.plane).toBe('behavior');
    expect(pair.locator).toBe('behavior/session-loop');
    expect(pair.specId).toBe('behavior.session-loop');
    expect(pair.completeness).toBe('complete');
    const dir = path.join(realChangeDir(), 'specs', 'behavior', 'session-loop');
    expect(pair.specPath).toBe(path.join(dir, 'spec.md'));
    expect(pair.enforcementPath).toBe(path.join(dir, 'enforcement.md'));
    // No permanent pair authored, so there is no current-pair link.
    expect(pair.currentPair).toBeUndefined();
  });

  it('links a delta pair to the corresponding permanent (current) pair', async () => {
    writePair('current', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });
    writePair('delta', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });

    const result = await loadGovernedContext(context(GOVERNED_SCHEMA));
    const [pair] = result!.governed.deltaPairs;
    expect(pair.currentPair).toBeDefined();
    expect(pair.currentPair!.specId).toBe('behavior.session-loop');
    expect(pair.currentPair!.locator).toBe('behavior/session-loop');
    const currentDir = path.join(
      realOpenspecRoot(),
      'specs',
      'behavior',
      'session-loop'
    );
    expect(pair.currentPair!.specPath).toBe(path.join(currentDir, 'spec.md'));
    expect(pair.currentPair!.enforcementPath).toBe(
      path.join(currentDir, 'enforcement.md')
    );
    expect(pair.currentPair!.completeness).toBe('complete');
  });

  it('surfaces an incomplete delta pair rather than omitting it', async () => {
    // Only spec.md authored — the enforcement half is missing.
    writePair('delta', 'architecture/domain', {
      spec: specDoc('architecture.domain'),
    });

    const result = await loadGovernedContext(context(GOVERNED_SCHEMA));
    const [pair] = result!.governed.deltaPairs;
    expect(pair.completeness).toBe('spec-only');
    expect(pair.specPath).not.toBeNull();
    expect(pair.enforcementPath).toBeNull();
  });

  it('collectCurrentPairFiles returns the deduped, sorted current pair source files', async () => {
    writePair('current', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });
    writePair('delta', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });

    const result = await loadGovernedContext(context(GOVERNED_SCHEMA));
    const files = collectCurrentPairFiles(result!.governed);
    const currentDir = path.join(
      realOpenspecRoot(),
      'specs',
      'behavior',
      'session-loop'
    );
    expect(files).toEqual(
      [
        path.join(currentDir, 'spec.md'),
        path.join(currentDir, 'enforcement.md'),
      ].sort()
    );
  });
});

describe('governed status / instructions wrappers', () => {
  it('withGovernedStatus attaches the governed spec model and pair context', async () => {
    writePair('delta', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });
    const ctx = context(GOVERNED_SCHEMA);
    const base = formatChangeStatus(ctx);
    expect(base.specModel).toBeUndefined();

    const enriched = await withGovernedStatus(base, ctx);
    expect(enriched.specModel?.kind).toBe('governed');
    expect(enriched.governed?.deltaPairs).toHaveLength(1);
    expect(enriched.governed?.planeRoots).toHaveLength(2);
  });

  it('withGovernedInstructions attaches the governed spec model and pair context', async () => {
    writePair('delta', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });
    const ctx = context(GOVERNED_SCHEMA);
    const base = generateInstructions(ctx, 'proposal', projectRoot);
    expect(base.specModel).toBeUndefined();

    const enriched = await withGovernedInstructions(base, ctx);
    expect(enriched.specModel?.kind).toBe('governed');
    expect(enriched.governed?.deltaPairs).toHaveLength(1);
  });
});

describe('legacy schema is unchanged', () => {
  it('loadGovernedContext returns undefined under the legacy schema', async () => {
    writePair('delta', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: enforcementDoc,
    });
    const result = await loadGovernedContext(context(LEGACY_SCHEMA));
    expect(result).toBeUndefined();
  });

  it('withGovernedStatus / withGovernedInstructions return the base object unchanged (no governed fields leak)', async () => {
    const ctx = context(LEGACY_SCHEMA);
    const baseStatus = formatChangeStatus(ctx);
    const status = await withGovernedStatus(baseStatus, ctx);
    expect(status).toBe(baseStatus);
    expect(status.specModel).toBeUndefined();
    expect(status.governed).toBeUndefined();

    const baseInstructions = generateInstructions(ctx, 'proposal', projectRoot);
    const instructions = await withGovernedInstructions(baseInstructions, ctx);
    expect(instructions).toBe(baseInstructions);
    expect(instructions.specModel).toBeUndefined();
    expect(instructions.governed).toBeUndefined();
  });
});
