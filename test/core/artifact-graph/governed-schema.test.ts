import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { resolveSchema, listSchemas } from '../../../src/core/artifact-graph/resolver.js';
import { ArtifactGraph } from '../../../src/core/artifact-graph/graph.js';
import { resolveSpecModel } from '../../../src/core/artifact-graph/types.js';
import { parseEnforcement } from '../../../src/core/governed/enforcement-parser.js';
import { parseGovernedSpec } from '../../../src/core/governed/spec-parser.js';

const SCHEMA_NAME = 'spec-driven-governed';

function templatesDir(): string {
  return path.join(process.cwd(), 'schemas', SCHEMA_NAME, 'templates');
}

function readTemplate(name: string): string {
  return fs.readFileSync(path.join(templatesDir(), name), 'utf-8');
}

describe('bundled governed schema (task 1.3)', () => {
  it('is discoverable alongside spec-driven', () => {
    expect(listSchemas()).toContain(SCHEMA_NAME);
    expect(listSchemas()).toContain('spec-driven');
  });

  it('declares the versioned governed spec model with the offered planes and paired enforcement', () => {
    const schema = resolveSchema(SCHEMA_NAME);
    const model = resolveSpecModel(schema);
    expect(model.kind).toBe('governed');
    expect(model.version).toBe(1);
    expect(model.pairedEnforcement).toBe(true);
    // The schema's `planes` is the single OFFER-ABLE list presented at init.
    const planeIds = model.planes.map((p) => p.id);
    expect(planeIds).toEqual([
      'behavior',
      'architecture',
      'ops',
      'code-quality',
      'design-system',
      'agents',
    ]);
    // The default-selected subset (pre-checked at init, and the resolved default
    // for a project with no plane override) is the core four.
    const defaultIds = model.planes.filter((p) => p.defaultSelected).map((p) => p.id);
    expect(defaultIds).toEqual(['behavior', 'architecture', 'ops', 'code-quality']);
    for (const plane of model.planes) {
      expect(typeof plane.purpose).toBe('string');
      expect(typeof plane.enforcementFlavor).toBe('string');
    }
  });

  it('encodes the governed artifact-graph dependencies', () => {
    const schema = resolveSchema(SCHEMA_NAME);
    const requires = Object.fromEntries(schema.artifacts.map((a) => [a.id, a.requires]));

    expect(requires.proposal).toEqual([]);
    expect(requires.specs).toEqual(['proposal']);
    expect(requires.design).toEqual(['proposal']);
    // enforcement follows BOTH specs and design.
    expect(requires.enforcement.sort()).toEqual(['design', 'specs']);
    // tasks requires specs, design, and enforcement.
    expect(requires.tasks.sort()).toEqual(['design', 'enforcement', 'specs']);
    expect(schema.apply?.requires).toEqual(['tasks']);
  });

  it('builds in the correct order: proposal -> design -> specs -> enforcement -> tasks', () => {
    const schema = resolveSchema(SCHEMA_NAME);
    const order = ArtifactGraph.fromSchema(schema).getBuildOrder();
    // proposal first; specs/design before enforcement; enforcement before tasks.
    expect(order[0]).toBe('proposal');
    expect(order.indexOf('specs')).toBeLessThan(order.indexOf('enforcement'));
    expect(order.indexOf('design')).toBeLessThan(order.indexOf('enforcement'));
    expect(order.indexOf('enforcement')).toBeLessThan(order.indexOf('tasks'));
    expect(order).toEqual(['proposal', 'design', 'specs', 'enforcement', 'tasks']);
  });

  it('routes governed spec/enforcement deltas to nested plane globs', () => {
    const schema = resolveSchema(SCHEMA_NAME);
    const generates = Object.fromEntries(schema.artifacts.map((a) => [a.id, a.generates]));
    expect(generates.specs).toBe('specs/**/spec.md');
    expect(generates.enforcement).toBe('specs/**/enforcement.yaml');
  });
});

describe('bundled governed templates (task 1.4)', () => {
  const templateNames = [
    'proposal.md',
    'spec.md',
    'behavioral-spec.md',
    'architectural-spec.md',
    'ops-spec.md',
    'code-quality-spec.md',
    'design-system-spec.md',
    'enforcement.yaml',
    'design.md',
    'tasks.md',
  ];

  it.each(templateNames)('ships a non-empty %s template', (name) => {
    const content = readTemplate(name);
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('references every artifact template that the schema declares', () => {
    const schema = resolveSchema(SCHEMA_NAME);
    for (const artifact of schema.artifacts) {
      expect(fs.existsSync(path.join(templatesDir(), artifact.template))).toBe(true);
    }
  });

  it('behavioral and architectural spec examples parse cleanly with governed frontmatter and slug IDs', () => {
    const behavioral = parseGovernedSpec(readTemplate('behavioral-spec.md'));
    expect(behavioral.issues).toEqual([]);
    expect(behavioral.id).toBe('behavior.session-loop');
    expect(behavioral.requirements[0]?.id).toBe('session-resume');
    expect(behavioral.requirements[0]?.scenarios.map((s) => s.id)).toContain('resume-after-crash');

    const architectural = parseGovernedSpec(readTemplate('architectural-spec.md'));
    expect(architectural.issues).toEqual([]);
    expect(architectural.id).toBe('architecture.domain');
    expect(architectural.requirements[0]?.id).toBe('domain-determinism');
  });

  it('enforcement template round-trips through the compact parser without issues', () => {
    const parsed = parseEnforcement(readTemplate('enforcement.yaml'), {
      sourcePath: 'enforcement.yaml',
    });
    expect(parsed.issues).toEqual([]);
    expect(parsed.format).toBe('yaml');
    expect(parsed.version).toBeNull();
    expect(parsed.spec).toBeNull();
    const ids = parsed.bindings.map((b) => b.id);
    expect(ids).toEqual(['import-boundary', 'determinism-review']);
    const automated = parsed.bindings.find((b) => b.id === 'import-boundary')!;
    expect(automated.type).toBe('lint');
    expect(automated.covers).toEqual(['domain-determinism']);
    expect(automated.source).toBe('tools/lint/boundaries.test.ts');
    const review = parsed.bindings.find((b) => b.id === 'determinism-review')!;
    expect(review.type).toBe('review');
    expect(review.source).toBe('architectural');
  });
});
