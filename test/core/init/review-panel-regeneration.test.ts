/**
 * Regeneration conformance (`architecture.review-panel-projection /
 * regenerated-every-model`): `specbase init` and `specbase update` generate the
 * review-panel skill for EVERY project — flat or governed — and regenerate it so
 * a roster change re-projects the skill, idempotently (an unchanged model yields
 * an unchanged skill, byte-for-byte).
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { InitCommand } from '../../../src/core/init.js';
import { UpdateCommand } from '../../../src/core/update.js';

const { showWelcomeScreenMock } = vi.hoisted(() => ({
  showWelcomeScreenMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/ui/welcome-screen.js', () => ({
  showWelcomeScreen: showWelcomeScreenMock,
}));

function skillFile(project: string): string {
  return path.join(project, '.claude', 'skills', 'specbase-review-panel', 'SKILL.md');
}

function governedConfig(planeIds: string[]): string {
  const planes: Record<string, string> = {
    behavior: 'behavioural',
    architecture: 'architectural',
    ops: 'ops',
    'code-quality': 'code-quality',
    'design-system': 'design',
  };
  const rows = planeIds
    .map(
      (id) =>
        `    - id: ${id}\n      purpose: purpose-${id}\n      enforcementFlavor: flavor-${id}\n      reviewLens: ${planes[id]}\n`
    )
    .join('');
  return `schema: spec-driven-governed\nspecModel:\n  planes:\n${rows}`;
}

describe('review-panel regeneration (regenerated-every-model)', () => {
  let project: string;

  beforeEach(async () => {
    project = path.join(os.tmpdir(), `specbase-rp-regen-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(project, { recursive: true });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    showWelcomeScreenMock.mockClear();
  });

  afterEach(async () => {
    await fs.rm(project, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('init produces the skill in a flat project (general spec-conformance reviewer)', async () => {
    await new InitCommand({ tools: 'claude', force: true }).execute(project);

    const content = await fs.readFile(skillFile(project), 'utf-8');
    expect(content).toContain('`spec-conformance` — scope: every spec');
    expect(content).not.toContain('`architectural` — scope');
  });

  it('update re-projects the skill for a governed roster, including newly added planes', async () => {
    await new InitCommand({ tools: 'claude', force: true }).execute(project);

    // First governed roster: behavior + architecture.
    await fs.writeFile(path.join(project, 'specbase', 'config.yaml'), governedConfig(['behavior', 'architecture']));
    await new UpdateCommand({ force: true }).execute(project);
    let content = await fs.readFile(skillFile(project), 'utf-8');
    expect(content).toContain('`architectural` — scope: `architecture/**`');
    expect(content).toContain('`behavioural` — scope: `behavior/**`');
    expect(content).not.toContain('`ops` — scope');

    // Roster change: add ops + design-system -> update re-projects.
    await fs.writeFile(
      path.join(project, 'specbase', 'config.yaml'),
      governedConfig(['behavior', 'architecture', 'ops', 'design-system'])
    );
    await new UpdateCommand({ force: true }).execute(project);
    content = await fs.readFile(skillFile(project), 'utf-8');
    expect(content).toContain('`ops` — scope: `ops/**`');
    expect(content).toContain('`design` — scope: `design-system/**`');
  });

  it('re-projection is idempotent: an unchanged model regenerates byte-identical skill', async () => {
    await new InitCommand({ tools: 'claude', force: true }).execute(project);
    await fs.writeFile(path.join(project, 'specbase', 'config.yaml'), governedConfig(['behavior', 'architecture', 'ops']));

    await new UpdateCommand({ force: true }).execute(project);
    const first = await fs.readFile(skillFile(project), 'utf-8');

    await new UpdateCommand({ force: true }).execute(project);
    const second = await fs.readFile(skillFile(project), 'utf-8');

    expect(second).toBe(first);
  });
});