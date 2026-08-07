import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ListCommand } from '../../src/core/list.js';

const GOVERNED_SCHEMA = 'spec-driven-governed';
const LEGACY_SCHEMA = 'spec-driven';

let tempDir: string;
let originalLog: typeof console.log;
let logOutput: string[] = [];

/** A valid governed spec.md declaring `id` plus one requirement/scenario. */
function specDoc(id: string): string {
  return `---\nid: ${id}\n---\n### Requirement: R\n**ID:** \`r\`\nThe system MUST do X.\n#### Scenario: S\n**ID:** \`s\`\n- **WHEN** a\n- **THEN** b\n`;
}

/** An enforcement.md covering requirement `r` with an active automated binding. */
function coveredEnforcement(id: string, target: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings:\n  - id: b\n    covers: [r]\n    mechanism: test\n    strength: automated\n    status: active\n    targets: [${target}]\n    run:\n      command: pnpm\n      args: [vitest, run, ${target}]\n      cwd: .\n\`\`\`\n`;
}

/** An enforcement.md with no bindings — leaves requirement `r` hanging. */
function hangingEnforcement(id: string): string {
  return `# Enforcement\n\n\`\`\`yaml\nversion: 1\nspec: ${id}\nbindings: []\n\`\`\`\n`;
}

async function writePair(
  scope: 'governed' | 'legacy',
  locator: string,
  opts: { spec?: string; enforcement?: string; target?: string }
): Promise<void> {
  const dir = path.join(tempDir, 'specbase', 'specs', ...locator.split('/'));
  await fs.mkdir(dir, { recursive: true });
  if (opts.spec !== undefined) {
    await fs.writeFile(path.join(dir, 'spec.md'), opts.spec);
  }
  if (opts.enforcement !== undefined) {
    await fs.writeFile(path.join(dir, 'enforcement.md'), opts.enforcement);
  }
  if (opts.target !== undefined) {
    const targetPath = path.join(tempDir, opts.target);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, '// target\n');
  }
}

async function writeConfig(schema: string): Promise<void> {
  const specbase = path.join(tempDir, 'specbase');
  await fs.mkdir(specbase, { recursive: true });
  await fs.writeFile(path.join(specbase, 'config.yaml'), `schema: ${schema}\n`);
}

beforeEach(async () => {
  tempDir = path.join(os.tmpdir(), `specbase-list-gov-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(tempDir, { recursive: true });
  originalLog = console.log;
  logOutput = [];
  console.log = (...args: unknown[]) => {
    logOutput.push(args.join(' '));
  };
});

afterEach(async () => {
  console.log = originalLog;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('ListCommand governed specs (text)', () => {
  it('recursively lists a nested governed pair with locator, stable id, and covered coverage', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('governed', 'architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement('architecture.platforms.desktop', 'src/desktop.test.ts'),
      target: 'src/desktop.test.ts',
    });

    await new ListCommand().execute(tempDir, 'specs');

    expect(logOutput).toContain('Specs:');
    const line = logOutput.find((l) => l.includes('architecture/platforms/desktop'));
    expect(line).toBeDefined();
    expect(line).toContain('id architecture.platforms.desktop');
    expect(line).toContain('requirements 1');
    expect(line).toContain('coverage complete');
  });

  it('marks a requirement with no binding as hanging', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('governed', 'behavior/session-loop', {
      spec: specDoc('behavior.session-loop'),
      enforcement: hangingEnforcement('behavior.session-loop'),
    });

    await new ListCommand().execute(tempDir, 'specs');

    const line = logOutput.find((l) => l.includes('behavior/session-loop'));
    expect(line).toBeDefined();
    expect(line).toContain('coverage hanging');
    expect(line).toContain('hanging 1');
  });

  it('surfaces an incomplete pair (spec-only) as incomplete-pair rather than omitting it', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('governed', 'architecture/domain', {
      spec: specDoc('architecture.domain'),
      // no enforcement.md — spec-only half
    });

    await new ListCommand().execute(tempDir, 'specs');

    const line = logOutput.find((l) => l.includes('architecture/domain'));
    expect(line).toBeDefined();
    expect(line).toContain('coverage incomplete-pair');
  });
});

describe('ListCommand governed specs (JSON)', () => {
  it('emits normalized locator, stable spec id, plane, native pair paths, and coverage counts', async () => {
    await writeConfig(GOVERNED_SCHEMA);
    await writePair('governed', 'architecture/platforms/desktop', {
      spec: specDoc('architecture.platforms.desktop'),
      enforcement: coveredEnforcement(
        'architecture.platforms.desktop',
        'src/desktop.test.ts'
      ),
      target: 'src/desktop.test.ts',
    });

    await new ListCommand().execute(tempDir, 'specs', { json: true });

    const parsed = JSON.parse(logOutput.join('\n'));
    expect(Array.isArray(parsed.specs)).toBe(true);
    expect(parsed.specs).toHaveLength(1);
    const [record] = parsed.specs;
    expect(record.locator).toBe('architecture/platforms/desktop');
    expect(record.specId).toBe('architecture.platforms.desktop');
    expect(record.plane).toBe('architecture');
    expect(record.pairStatus).toBe('complete');
    expect(record.specPath).toContain(
      path.join('specs', 'architecture', 'platforms', 'desktop', 'spec.md')
    );
    expect(record.enforcementPath).toContain('enforcement.md');
    expect(record.coverage).toMatchObject({
      state: 'complete',
      covered: 1,
      hanging: 0,
      stale: 0,
      broken: 0,
      planned: 0,
    });
  });
});

describe('ListCommand legacy specs are unchanged', () => {
  it('lists a flat legacy capability with a requirement count and no governed coverage token', async () => {
    await writeConfig(LEGACY_SCHEMA);
    const legacyDoc =
      '## Purpose\nAuth.\n\n## Requirements\n\n### Requirement: Login\nUsers MUST log in.\n\n#### Scenario: ok\n- **WHEN** x\n- **THEN** y\n';
    await writePair('legacy', 'auth', { spec: legacyDoc });

    await new ListCommand().execute(tempDir, 'specs');

    expect(logOutput).toContain('Specs:');
    const line = logOutput.find((l) => l.includes('auth'));
    expect(line).toBeDefined();
    expect(line).toContain('requirements 1');
    // Legacy output never carries the governed coverage token or a locator slash.
    expect(line).not.toContain('coverage');
    expect(line).not.toContain('/');
  });
});
