/**
 * Baseline planter (architecture.baseline-planting): the plane-parametric
 * planter and its init integration. Bindings `planter-conformance` and
 * `baseline-opt-in-integration`.
 *
 * Conformance drives `plantBaselines` directly: a declared multi-plane set
 * plants each pair under its own `specs/<plane>/<locator>`, an already-present
 * file is left untouched, and a second run rewrites nothing. Integration drives
 * `InitCommand` with a scripted governed plane selection: an accepted STE opt-in
 * plants both `agents/ste-writing` and `ops/ste`, a declined one plants
 * neither, and the existing agents baseline still plants unchanged.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { InitCommand, plantBaselines } from '../../src/core/init.js';

const { confirmMock, checkboxMock, showWelcomeScreenMock } = vi.hoisted(() => ({
  confirmMock: vi.fn().mockResolvedValue(true),
  checkboxMock: vi.fn().mockResolvedValue(['behavior', 'architecture', 'agents']),
  showWelcomeScreenMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock,
  checkbox: checkboxMock,
}));

vi.mock('../../src/ui/welcome-screen.js', () => ({
  showWelcomeScreen: showWelcomeScreenMock,
}));

const STE_BUNDLE: Array<{ plane: string; locator: string }> = [
  { plane: 'agents', locator: 'ste-writing' },
  { plane: 'ops', locator: 'ste' },
];

function specFile(projectRoot: string, plane: string, locator: string, file: string): string {
  return path.join(projectRoot, 'specbase', 'specs', plane, locator, file);
}

describe('plantBaselines — plane-parametric planter (planter-conformance)', () => {
  let project: string;

  beforeEach(() => {
    project = mkdtempSync(path.join(tmpdir(), 'ste-planter-'));
  });

  afterEach(async () => {
    await fs.rm(project, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('plants a declared multi-plane set under each pair\u2019s own plane', async () => {
    const pairs = [
      { plane: 'agents', locator: 'spec-driven' },
      { plane: 'agents', locator: 'review-panel' },
      { plane: 'agents', locator: 'ste-writing' },
      { plane: 'ops', locator: 'ste' },
    ];
    await plantBaselines(project, pairs);

    for (const { plane, locator } of pairs) {
      for (const file of ['spec.md', 'enforcement.md']) {
        expect(
          existsSync(specFile(project, plane, locator, file)),
          `${plane}/${locator}/${file}`
        ).toBe(true);
      }
    }
  });

  it('leaves an already-present (customized) baseline file untouched', async () => {
    const dest = specFile(project, 'ops', 'ste', 'spec.md');
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, '# custom ops/ste spec the user edited\n');
    const customized = readFileSync(dest, 'utf-8');

    await plantBaselines(project, STE_BUNDLE);

    expect(readFileSync(dest, 'utf-8')).toBe(customized);
  });

  it('re-running init changes nothing already planted (rerun-is-noop)', async () => {
    await plantBaselines(project, STE_BUNDLE);
    const before = readFileSync(specFile(project, 'ops', 'ste', 'spec.md'), 'utf-8');

    await plantBaselines(project, STE_BUNDLE);
    await plantBaselines(project, STE_BUNDLE);

    expect(readFileSync(specFile(project, 'ops', 'ste', 'spec.md'), 'utf-8')).toBe(before);
  });
});

describe('init opt-in STE bundle (baseline-opt-in-integration)', () => {
  let project: string;

  beforeEach(() => {
    project = mkdtempSync(path.join(tmpdir(), 'ste-init-'));
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    checkboxMock.mockReset();
    checkboxMock.mockResolvedValue(['behavior', 'architecture', 'agents']);
    showWelcomeScreenMock.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.rm(project, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('an accepted STE opt-in plants both STE pairs plus the agents baseline', async () => {
    const initCommand = new InitCommand({ tools: 'claude' });
    vi.spyOn(initCommand as unknown as { canPromptInteractively(): boolean }, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(project);

    // The agents baseline still plants unchanged.
    expect(existsSync(specFile(project, 'agents', 'spec-driven', 'spec.md'))).toBe(true);
    expect(existsSync(specFile(project, 'agents', 'review-panel', 'spec.md'))).toBe(true);
    // The STE bundle lands in both planes.
    expect(existsSync(specFile(project, 'agents', 'ste-writing', 'spec.md'))).toBe(true);
    expect(existsSync(specFile(project, 'ops', 'ste', 'spec.md'))).toBe(true);
  });

  it('a declined STE opt-in plants none of the STE bundle', async () => {
    confirmMock.mockResolvedValue(false);
    const initCommand = new InitCommand({ tools: 'claude' });
    vi.spyOn(initCommand as unknown as { canPromptInteractively(): boolean }, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(project);

    expect(existsSync(specFile(project, 'agents', 'spec-driven', 'spec.md'))).toBe(true);
    expect(existsSync(specFile(project, 'agents', 'ste-writing', 'spec.md'))).toBe(false);
    expect(existsSync(specFile(project, 'ops', 'ste', 'spec.md'))).toBe(false);
  });
});