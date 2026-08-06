import { describe, it, expect } from 'vitest';
import { parseEnforcement } from '../../../src/core/governed/enforcement-parser.js';

const wellFormed = `# Enforcement: Domain Architecture

Some prose describing the intent.

\`\`\`yaml
version: 1
spec: architecture.domain
bindings:
  - id: import-boundary
    covers: [domain-determinism, ambient-time-rejected]
    mechanism: lint
    strength: automated
    status: active
    targets:
      - tools/lint/boundaries.test.ts
    run:
      command: pnpm
      args: [vitest, run, tools/lint/boundaries.test.ts]
      cwd: .
  - id: manual-review
    covers: [documented-tradeoff]
    mechanism: review
    strength: review
    status: active
    review:
      procedure: Read the module and confirm the boundary.
      inputs: [src/domain]
\`\`\`
`;

describe('governed/enforcement-parser', () => {
  it('parses the authoritative yaml document, spec id, and bindings', () => {
    const parsed = parseEnforcement(wellFormed);
    expect(parsed.issues).toEqual([]);
    expect(parsed.version).toBe(1);
    expect(parsed.spec).toBe('architecture.domain');
    expect(parsed.bindings).toHaveLength(2);

    const [lint, review] = parsed.bindings;
    expect(lint.id).toBe('import-boundary');
    expect(lint.mechanism).toBe('lint');
    expect(lint.strength).toBe('automated');
    expect(lint.status).toBe('active');
    expect(lint.covers).toEqual(['domain-determinism', 'ambient-time-rejected']);
    expect(lint.targets).toEqual(['tools/lint/boundaries.test.ts']);
    expect(lint.run).toEqual({
      command: 'pnpm',
      args: ['vitest', 'run', 'tools/lint/boundaries.test.ts'],
      cwd: '.',
    });
    expect(review.review?.procedure).toContain('confirm the boundary');
  });

  it('reports a missing yaml document', () => {
    const parsed = parseEnforcement('# Enforcement\n\nNo fenced yaml here.\n');
    expect(parsed.bindings).toEqual([]);
    expect(parsed.issues.map((i) => i.code)).toContain('missing-yaml-document');
  });

  it('reports multiple yaml documents but still uses the first', () => {
    const doc = `\`\`\`yaml
version: 1
spec: behavior.a
bindings: []
\`\`\`

\`\`\`yaml
version: 1
spec: behavior.b
bindings: []
\`\`\`
`;
    const parsed = parseEnforcement(doc);
    expect(parsed.issues.some((i) => i.code === 'multiple-yaml-documents')).toBe(
      true
    );
    expect(parsed.spec).toBe('behavior.a');
  });

  it('reports invalid yaml', () => {
    const doc = '```yaml\nversion: 1\nspec: [unbalanced\n```\n';
    const parsed = parseEnforcement(doc);
    expect(parsed.issues.some((i) => i.code === 'invalid-yaml')).toBe(true);
  });

  it('reports a schema violation but salvages spec/version for identity checks', () => {
    const doc = `\`\`\`yaml
version: 1
spec: architecture.domain
bindings:
  - id: bad
    mechanism: not-a-mechanism
    strength: automated
    status: active
\`\`\`
`;
    const parsed = parseEnforcement(doc);
    expect(parsed.bindings).toEqual([]);
    expect(parsed.issues.some((i) => i.code === 'invalid-document')).toBe(true);
    expect(parsed.spec).toBe('architecture.domain');
    expect(parsed.version).toBe(1);
  });

  it('rejects an invalid binding id via the schema', () => {
    const doc = `\`\`\`yaml
version: 1
spec: behavior.a
bindings:
  - id: Bad_Id
    mechanism: test
    strength: automated
    status: active
\`\`\`
`;
    const parsed = parseEnforcement(doc);
    expect(parsed.issues.some((i) => i.code === 'invalid-document')).toBe(true);
  });

  it('drops duplicate binding IDs and reports the collision once', () => {
    const doc = `\`\`\`yaml
version: 1
spec: behavior.a
bindings:
  - id: dup
    covers: [r]
    mechanism: test
    strength: automated
    status: active
    targets: [test/a.test.ts]
    run: { command: pnpm, args: [vitest] }
  - id: dup
    covers: [r2]
    mechanism: test
    strength: automated
    status: active
    targets: [test/b.test.ts]
    run: { command: pnpm, args: [vitest] }
\`\`\`
`;
    const parsed = parseEnforcement(doc);
    expect(parsed.bindings).toHaveLength(1);
    expect(parsed.bindings[0].covers).toEqual(['r']);
    const dup = parsed.issues.find((i) => i.code === 'duplicate-binding-id');
    expect(dup).toBeDefined();
    expect(dup?.bindingId).toBe('dup');
    expect(
      parsed.issues.filter((i) => i.code === 'duplicate-binding-id')
    ).toHaveLength(1);
  });
});
