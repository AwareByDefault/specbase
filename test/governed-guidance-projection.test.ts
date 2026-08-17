import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import * as guidance from '../src/core/templates/workflows/governed-guidance.js';
import {
  buildPlaneTriggers,
  DEFAULT_PLANE_TRIGGERS,
} from '../src/core/templates/workflows/governed-guidance.js';
import { DEFAULT_PLANES } from '../src/core/governed/lenses.js';
import { getCommandTemplates, getSkillTemplates } from '../src/core/shared/skill-generation.js';
import {
  DEFAULT_ENFORCEMENT_TYPES,
  type EnforcementType,
  type Plane,
  type SpecModel,
} from '../src/core/artifact-graph/types.js';

/**
 * Spec `architecture.governed-guidance-projection`, bindings
 * `guidance-roster-parity`, `no-frozen-roster-static`, `triggers-cover-defaults`.
 *
 * Every governed guidance surface — each workflow's skill projection and command
 * projection — must derive its plane roster from the resolved spec model. The
 * cases below generate the surfaces by ITERATING the shared workflow source, so a
 * workflow added later that forgets the model fails here without a test edit.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUIDANCE_SOURCE = readFileSync(
  path.join(REPO_ROOT, 'src/core/templates/workflows/governed-guidance.ts'),
  'utf8'
);

/** The primer heading every plane-aware governed surface carries. */
const PRIMER_MARKER = '## Governed spec model';
/** The onboarding lesson's section heading. */
const ONBOARD_MARKER = '### Teaching the governed model while onboarding (governed)';

/**
 * Workflows whose surfaces carry no plane roster by design: the review panel
 * projects the resolved LENS set instead (pinned by
 * `test/core/governed/review-panel.conformance.test.ts`), and the STE writing
 * skill is a prose-style instrument with no spec-model content at all.
 */
const MODEL_AGNOSTIC_WORKFLOWS = new Set(['review-panel', 'ste-writing']);

/** A plane no shipped default declares, so the roster under test is strictly larger. */
const EXTRA_PLANE: Plane = {
  id: 'observability',
  purpose: 'What the running system must make visible about itself',
  enforcementFlavor: 'signal presence checks',
  crossCutting: false,
  defaultSelected: true,
};

function governedModel(
  planes: readonly Plane[],
  types: readonly EnforcementType[] = DEFAULT_ENFORCEMENT_TYPES
): SpecModel {
  return {
    kind: 'governed',
    version: 1,
    planes: [...planes],
    enforcement: { types: [...types] },
    pairedEnforcement: true,
  };
}

/** More planes than the shipped defaults. */
const MULTI_PLANE_MODEL = governedModel([...DEFAULT_PLANES, EXTRA_PLANE]);
/** The historical minimum, used to prove a roster change re-projects every surface. */
const TWO_PLANE_MODEL = governedModel(DEFAULT_PLANES.slice(0, 2));

interface Surface {
  /** `skill:apply`, `command:archive`, ... — the failure label. */
  id: string;
  workflowId: string;
  content: string;
}

/** Every generated governed surface, from the shared workflow source. */
function surfacesFor(specModel: SpecModel): Surface[] {
  return [
    ...getSkillTemplates(undefined, specModel).map((entry) => ({
      id: `skill:${entry.workflowId}`,
      workflowId: entry.workflowId,
      content: entry.template.instructions,
    })),
    ...getCommandTemplates(undefined, specModel).map((entry) => ({
      id: `command:${entry.id}`,
      workflowId: entry.id,
      content: entry.template.content,
    })),
  ];
}

/** The roster line a primer built from `specModel` reports. */
function rosterLine(specModel: SpecModel): string {
  const ids = specModel.kind === 'governed' ? specModel.planes.map((p) => p.id) : [];
  return `planes: [${ids.join(', ')}]`;
}

/** Everything a surface says it knows about the roster. */
function rosterClaims(content: string): string[] {
  return [...content.matchAll(/planes: \[[^\]]*\]/g)].map((m) => m[0]);
}

/** The onboarding lesson body, without the legacy base the guidance is appended to. */
function onboardLesson(content: string): string {
  const start = content.indexOf(ONBOARD_MARKER);
  expect(start).toBeGreaterThan(-1);
  return content.slice(start);
}

describe('every governed surface projects the resolved plane roster', () => {
  it('generates surfaces for more planes than the shipped defaults', () => {
    expect(MULTI_PLANE_MODEL.planes.length).toBeGreaterThan(DEFAULT_PLANES.length);
    expect(surfacesFor(MULTI_PLANE_MODEL).length).toBeGreaterThan(0);
  });

  it('carries the plane-aware primer in every workflow surface that teaches the model', () => {
    for (const surface of surfacesFor(MULTI_PLANE_MODEL)) {
      if (MODEL_AGNOSTIC_WORKFLOWS.has(surface.workflowId)) continue;
      expect(surface.content, `${surface.id} teaches no governed spec model`).toContain(
        PRIMER_MARKER
      );
    }
  });

  it('reports exactly the declared roster in every claim it makes', () => {
    const expected = rosterLine(MULTI_PLANE_MODEL);
    for (const surface of surfacesFor(MULTI_PLANE_MODEL)) {
      if (!surface.content.includes(PRIMER_MARKER)) continue;
      const claims = rosterClaims(surface.content);
      expect(claims.length, `${surface.id} states no plane roster`).toBeGreaterThan(0);
      for (const claim of claims) {
        expect(claim, `${surface.id} states a roster the model does not declare`).toBe(expected);
      }
    }
  });

  it('enumerates each declared plane with its declared purpose', () => {
    for (const surface of surfacesFor(MULTI_PLANE_MODEL)) {
      if (!surface.content.includes(PRIMER_MARKER)) continue;
      for (const plane of MULTI_PLANE_MODEL.planes) {
        expect(surface.content, `${surface.id} omits plane ${plane.id}`).toContain(
          `- ${plane.id}: ${plane.purpose}`
        );
      }
    }
  });

  it('re-projects every surface when the roster changes', () => {
    const multi = surfacesFor(MULTI_PLANE_MODEL);
    const two = surfacesFor(TWO_PLANE_MODEL);
    const multiLine = rosterLine(MULTI_PLANE_MODEL);
    const twoLine = rosterLine(TWO_PLANE_MODEL);
    expect(multiLine).not.toBe(twoLine);
    // Both projections cover the same surfaces, so no workflow escapes the check.
    expect(two.map((s) => s.id)).toEqual(multi.map((s) => s.id));

    const twoById = new Map(two.map((s) => [s.id, s.content]));
    for (const surface of multi) {
      if (!surface.content.includes(PRIMER_MARKER)) continue;
      expect(surface.content, `${surface.id} retains the prior roster`).not.toContain(twoLine);
      // The reverse direction: a shrunk roster must not keep the larger one.
      expect(twoById.get(surface.id), `${surface.id} did not re-project`).not.toContain(multiLine);
    }
  });
});

describe('the onboarding lesson teaches the declared roster', () => {
  const onboardSurfaces = () =>
    surfacesFor(MULTI_PLANE_MODEL).filter((s) => s.workflowId === 'onboard');

  it('projects both the skill and the command', () => {
    expect(onboardSurfaces().map((s) => s.id).sort()).toEqual([
      'command:onboard',
      'skill:onboard',
    ]);
  });

  it('enumerates every declared plane in the lesson', () => {
    for (const surface of onboardSurfaces()) {
      const lesson = onboardLesson(surface.content);
      for (const plane of MULTI_PLANE_MODEL.planes) {
        expect(lesson, `${surface.id} lesson omits plane ${plane.id}`).toContain(
          `**${plane.id}** - ${plane.purpose}`
        );
      }
    }
  });

  it('states no fixed plane count a differing roster would falsify', () => {
    // A spelled-out count ("two truth planes") is the frozen claim; the primer's
    // derived `${planes.length}` digit is not, because it follows the model.
    const spelledCount = /\b(one|two|three|four|five|six|seven|eight)\s+([a-z-]+\s+)?planes?\b/i;
    for (const surface of onboardSurfaces()) {
      expect(onboardLesson(surface.content)).not.toMatch(spelledCount);
    }
  });
});

describe('no guidance surface embeds a frozen roster', () => {
  it('exposes every plane-aware guidance export as a function of the model', () => {
    const planeAware = Object.entries(guidance).filter(
      ([name]) => /^GOVERNED_.*_GUIDANCE$/.test(name)
    );
    expect(planeAware.length).toBeGreaterThan(0);
    for (const [name, value] of planeAware) {
      if (typeof value === 'function') continue;
      // A plain-string guidance export is allowed only when it is plane-agnostic.
      expect(String(value), `${name} bakes a plane roster into a static string`).not.toContain(
        'planes: ['
      );
      expect(String(value), `${name} bakes the primer into a static string`).not.toContain(
        PRIMER_MARKER
      );
    }
  });

  it('projects custom enforcement types and omits removed defaults on every model-aware surface', () => {
    const custom: EnforcementType = {
      id: 'nix-check',
      purpose: 'Evaluated Nix configuration assertions.',
      strength: 'automated',
      sourceKind: 'file',
    };
    const model = governedModel(DEFAULT_PLANES.slice(0, 2), [custom]);
    for (const surface of surfacesFor(model).filter(
      (entry) => !MODEL_AGNOSTIC_WORKFLOWS.has(entry.workflowId)
    )) {
      expect(surface.content, surface.id).toContain('nix-check: Evaluated Nix configuration assertions.');
      expect(surface.content, surface.id).not.toContain('- test: Executable tests');
      expect(surface.content, surface.id).toContain('exactly `type`, requirement-level `covers`, and one `source`');
    }
  });

  it('declares no back-compat alias that yields guidance without a model', () => {
    expect(GUIDANCE_SOURCE).not.toMatch(/\bGOVERNED_PRIMER\b/);
    // No module-level primer built from an inline (therefore frozen) model.
    expect(GUIDANCE_SOURCE).not.toMatch(/buildGovernedPrimer\(\s*\{/);
  });

  it('declares no hardcoded plane-roster literal', () => {
    const planeIds = DEFAULT_PLANES.map((p) => p.id).join('|');
    const rosterLiteral = new RegExp(`\\[\\s*(['"])(?:${planeIds})\\1\\s*,`);
    expect(GUIDANCE_SOURCE).not.toMatch(rosterLiteral);
  });
});

describe('curated pedagogy covers the defaults, extras derive theirs', () => {
  /** The block a plane gets when no curated triggers exist for it. */
  const DERIVED_MARKER = 'match claims to this plane by its declared purpose';

  it('curates triggers for exactly the default-shipped planes', () => {
    expect(Object.keys(DEFAULT_PLANE_TRIGGERS).sort()).toEqual(
      DEFAULT_PLANES.map((p) => p.id).sort()
    );
  });

  it('gives every default plane its curated block, not the fallback', () => {
    const blocks = buildPlaneTriggers(governedModel(DEFAULT_PLANES));
    for (const plane of DEFAULT_PLANES) {
      expect(blocks, `${plane.id} has no classifier block`).toContain(`**${plane.id} plane** —`);
    }
    expect(blocks).not.toContain(DERIVED_MARKER);
  });

  it('derives a purpose-matched block for a user-added plane', () => {
    const blocks = buildPlaneTriggers(governedModel([...DEFAULT_PLANES, EXTRA_PLANE]));
    expect(blocks).toContain(`**${EXTRA_PLANE.id} plane** — ${DERIVED_MARKER}`);
    expect(blocks).toContain(`"${EXTRA_PLANE.purpose}"`);
    expect(blocks).toContain(`Enforcement flavor: ${EXTRA_PLANE.enforcementFlavor}`);
  });
});
