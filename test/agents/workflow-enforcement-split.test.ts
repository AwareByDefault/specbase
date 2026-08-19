import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Conformance evidence for `agents/workflow` (change split-enforcement-workflow).
 *
 * The pair's bindings are `command` conformance sources over the workflow
 * skill/prompt artifacts:
 *   - feature-propose-conformance  -> .pi/prompts/spcb-propose.md
 *   - explore-enforce-conformance  -> .pi/skills/specbase-explore-enforce/SKILL.md
 *   - propose-enforce-conformance  -> .pi/skills/specbase-propose-enforce/SKILL.md
 *
 * This test executes those conformance sources through the project's native
 * harness (vitest), asserting the shipped artifacts conform to what the
 * `agents/workflow` requirements promise. The `.pi` files are generated from
 * `src/core/templates/workflows/*.ts`; a regression that narrows or drops a
 * phase in the template but forgets to regenerate the artifact fails here.
 */

const ROOT = process.cwd();
const read = (p: string): string => readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p: string): boolean => existsSync(path.join(ROOT, p));

const EXPLORE_SKILL = '.pi/skills/specbase-explore/SKILL.md';
const PROPOSE_PROMPT = '.pi/prompts/spcb-propose.md';
const EXPLORE_ENFORCE_SKILL = '.pi/skills/specbase-explore-enforce/SKILL.md';
const PROPOSE_ENFORCE_SKILL = '.pi/skills/specbase-propose-enforce/SKILL.md';

describe('agents/workflow - enforcement split', () => {
  it('both enforcement skills ship as SKILL.md artifacts', () => {
    expect(exists(EXPLORE_ENFORCE_SKILL)).toBe(true);
    expect(exists(PROPOSE_ENFORCE_SKILL)).toBe(true);
  });

  it('the feature propose pass stops before enforcement (enforcement-own-phase)', () => {
    const propose = read(PROPOSE_PROMPT);
    // The feature pass must NOT promise to create every applyRequires artifact.
    expect(propose).not.toMatch(/Create ALL artifacts needed for implementation/i);
    // It must leave the enforcement/testing sections as TO-BE-FILLED and not write
    // enforcement.yaml.
    expect(propose).toMatch(/TO-BE-FILLED/);
    expect(propose).toMatch(/Do NOT write [`]enforcement[.]yaml[`]/);
  });

  it('the feature explore pass defers enforcement to its own phase (enforcement-own-phase)', () => {
    const explore = read(EXPLORE_SKILL);
    // Stage-three enforcement sketching is removed; enforcement is deferred.
    expect(explore).not.toMatch(/Enforcement approach - stay general/);
    expect(explore).toMatch(/Enforcement - deferred to its own phase/);
    expect(explore).toMatch(/explore-enforce/);
  });

  it('explore-enforce is a verification-only pass (explore-enforce-skill)', () => {
    const s = read(EXPLORE_ENFORCE_SKILL);
    expect(s).toMatch(/verification only/i);
    expect(s).toMatch(/highest-?leverage/i);
    expect(s).toMatch(/do not re-explore/i);
    expect(s).toMatch(/Enforcement design/); // thinking reuses design.md section
  });

  it('propose-enforce fills enforcement and may emit testability revisions (verifiability-feedback)', () => {
    const s = read(PROPOSE_ENFORCE_SKILL);
    expect(s).toMatch(/enforcement[.]yaml/);
    expect(s).toMatch(/TO-BE-FILLED/);
    expect(s).toMatch(/MODIFIED/);
    expect(s).toMatch(/verifiability/);
    expect(s).toMatch(/shall not broaden/i);
  });
});