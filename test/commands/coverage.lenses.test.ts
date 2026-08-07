import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { CoverageCommand } from '../../src/commands/coverage.js';

let tempDir: string;
let originalCwd: string;
let originalLog: typeof console.log;
let originalError: typeof console.error;
let logOutput: string[];

function specDoc(id: string): string {
  return `---\nid: ${id}\n---\n### Requirement: R\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

function reviewEnforcement(id: string, lens?: string): string {
  const lensLine = lens ? `    lens: ${lens}\n` : '';
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: rv\n    covers: [r]\n    mechanism: review\n    strength: review\n    status: active\n${lensLine}    review:\n      procedure: Inspect\n\`\`\`\n`;
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

async function writeConfig(): Promise<void> {
  const specbase = path.join(tempDir, 'specbase');
  await fs.mkdir(specbase, { recursive: true });
  await fs.writeFile(path.join(specbase, 'config.yaml'), 'schema: spec-driven-governed\n');
}

async function runCoverage(
  target: string | undefined,
  options: Record<string, unknown> = {}
): Promise<void> {
  await new CoverageCommand().execute(target, options as never);
}

beforeEach(async () => {
  tempDir = path.join(
    os.tmpdir(),
    `specbase-cov-lens-cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  await fs.mkdir(tempDir, { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tempDir);
  originalLog = console.log;
  originalError = console.error;
  logOutput = [];
  console.log = (...args: unknown[]) => logOutput.push(args.join(' '));
  console.error = () => {};
});

afterEach(async () => {
  console.log = originalLog;
  console.error = originalError;
  process.chdir(originalCwd);
  process.exitCode = 0;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('coverage — lens views (text)', () => {
  it('renders the lens rollup and un-lensed review gap, informational', async () => {
    await writeConfig();
    await writePair('behavior/session', {
      spec: specDoc('behavior.session'),
      enforcement: reviewEnforcement('behavior.session'),
    });
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: reviewEnforcement('architecture.domain', 'security'),
    });

    await runCoverage(undefined);

    const out = logOutput.join('\n');
    expect(out).toContain('Lenses (review-panel; informational, never gates):');
    expect(out).toMatch(/behavioural\s+review claims 1/);
    expect(out).toContain('Un-lensed review claims (informational, never gates):');
    expect(out).toContain(
      "architecture/domain binding rv (lens 'security' is not a defined lens)"
    );
    expect(process.exitCode ?? 0).toBe(0);
  });
});

describe('coverage — lens views (JSON)', () => {
  it('nests review views under summary and keeps the top-level shape stable', async () => {
    await writeConfig();
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: reviewEnforcement('architecture.domain', 'security'),
    });

    await runCoverage(undefined, { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    // Top-level keys unchanged (additive under summary).
    expect(Object.keys(parsed)).toEqual([
      'summary',
      'specs',
      'orphans',
      'strict',
      'valid',
      'root',
    ]);
    expect(parsed.summary.review.threshold).toBe(4);
    // The projection resolves the schema's default-selected roster (design-system
    // and agents opt out by default), so five lenses appear: four plane lenses
    // plus the cross-cutting enforcement.
    expect(parsed.summary.review.lenses).toHaveLength(5);
    expect(parsed.summary.review.unlensed).toEqual([
      {
        locator: 'architecture/domain',
        specId: 'architecture.domain',
        bindingId: 'rv',
        declaredLens: 'security',
        reason: 'undefined-lens',
      },
    ]);
  });
});

describe('coverage — lens gaps never gate --strict', () => {
  it('exits zero under --strict with an un-lensed review gap present', async () => {
    await writeConfig();
    await writePair('architecture/domain', {
      spec: specDoc('architecture.domain'),
      enforcement: reviewEnforcement('architecture.domain', 'security'),
    });

    await runCoverage(undefined, { strict: true });

    expect(process.exitCode ?? 0).toBe(0);
  });
});
