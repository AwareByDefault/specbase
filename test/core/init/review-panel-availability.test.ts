/**
 * Availability and lens content (`behavior.cli.review-panel-availability`):
 * init/update install the review-panel skill in every project, flat or governed,
 * and the installed skill names exactly the lenses its resolved review model
 * implies — a governed project declaring ops/design sees those lenses, a flat
 * project sees the single general spec-conformance reviewer.
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

const OPS_DESIGN_CONFIG = `schema: spec-driven-governed
specModel:
  planes:
    - id: behavior
      purpose: outcomes
      enforcementFlavor: tests
      reviewLens: behavioural
    - id: architecture
      purpose: boundaries
      enforcementFlavor: lint
      reviewLens: architectural
    - id: ops
      purpose: runs
      enforcementFlavor: audit
      reviewLens: ops
    - id: design-system
      purpose: identity
      enforcementFlavor: tokens
      reviewLens: design
`;

describe('review-panel availability (panel-available-every-project)', () => {
  let project: string;

  beforeEach(async () => {
    project = path.join(os.tmpdir(), `specbase-rp-avail-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(project, { recursive: true });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    showWelcomeScreenMock.mockClear();
  });

  afterEach(async () => {
    await fs.rm(project, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('a flat project gains the skill on init, naming the general reviewer only', async () => {
    await new InitCommand({ tools: 'claude', force: true }).execute(project);

    expect(await fs.readFile(skillFile(project), 'utf-8')).toContain(
      '`spec-conformance` — scope: every spec'
    );
  });

  it('a governed project retains the skill on update, naming its declared ops/design lenses', async () => {
    await new InitCommand({ tools: 'claude', force: true }).execute(project);
    await fs.writeFile(path.join(project, 'specbase', 'config.yaml'), OPS_DESIGN_CONFIG);
    await new UpdateCommand({ force: true }).execute(project);

    const content = await fs.readFile(skillFile(project), 'utf-8');
    expect(content).toContain('`ops` — scope: `ops/**`');
    expect(content).toContain('`design` — scope: `design-system/**`');
    // Not a fixed subset that omits them; and no lens the model does not imply.
    expect(content).not.toContain('`security` — scope');
  });

  it('a governed project that installs on init also carries the projected lenses', async () => {
    // Write the governed config first, then init: config creation keeps it and
    // the skill generation projects from it.
    await fs.mkdir(path.join(project, 'specbase'), { recursive: true });
    await fs.writeFile(path.join(project, 'specbase', 'config.yaml'), OPS_DESIGN_CONFIG);
    await new InitCommand({ tools: 'claude', force: true }).execute(project);

    const content = await fs.readFile(skillFile(project), 'utf-8');
    expect(content).toContain('`ops` — scope: `ops/**`');
    expect(content).toContain('`design` — scope: `design-system/**`');
  });
});