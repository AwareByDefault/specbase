import { describe, it, expect } from 'vitest';
import { parseGovernedSpec } from '../../../src/core/governed/spec-parser.js';

const wellFormed = `---
id: architecture.domain
---

## Requirements

### Requirement: Domain determinism
**ID:** \`domain-determinism\`
The domain MUST obtain time and randomness through injected ports.

#### Scenario: Ambient time is rejected
**ID:** \`ambient-time-rejected\`
- **WHEN** a domain module reads ambient time
- **THEN** architectural enforcement reports the violation

#### Scenario: Injected time is accepted
**ID:** \`injected-time-accepted\`
- **WHEN** a domain module reads injected time
- **THEN** enforcement passes
`;

describe('governed/spec-parser', () => {
  it('parses frontmatter id, requirements, and scenarios with their slugs', () => {
    const parsed = parseGovernedSpec(wellFormed);
    expect(parsed.issues).toEqual([]);
    expect(parsed.id).toBe('architecture.domain');
    expect(parsed.requirements).toHaveLength(1);

    const req = parsed.requirements[0];
    expect(req.id).toBe('domain-determinism');
    expect(req.title).toBe('Domain determinism');
    expect(req.scenarios.map((s) => s.id)).toEqual([
      'ambient-time-rejected',
      'injected-time-accepted',
    ]);
    expect(req.scenarios[0].title).toBe('Ambient time is rejected');
  });

  it('keeps stable IDs even if titles change (identity is the slug, not the title)', () => {
    const renamed = wellFormed.replace(
      '### Requirement: Domain determinism',
      '### Requirement: Determinism of the domain layer'
    );
    const parsed = parseGovernedSpec(renamed);
    expect(parsed.requirements[0].id).toBe('domain-determinism');
    expect(parsed.requirements[0].title).toBe('Determinism of the domain layer');
  });

  it('reports missing frontmatter', () => {
    const parsed = parseGovernedSpec('### Requirement: X\n**ID:** `x`\n');
    expect(parsed.id).toBeNull();
    expect(parsed.issues.some((i) => i.code === 'missing-frontmatter')).toBe(true);
  });

  it('reports an invalid frontmatter id', () => {
    const parsed = parseGovernedSpec('---\nid: Not_A_Valid_ID\n---\n');
    expect(parsed.id).toBeNull();
    expect(parsed.issues.some((i) => i.code === 'invalid-frontmatter-id')).toBe(true);
  });

  it('reports a requirement missing its ID slug', () => {
    const parsed = parseGovernedSpec(
      '---\nid: behavior.x\n---\n### Requirement: No slug\nSome body text.\n'
    );
    const issue = parsed.issues.find((i) => i.code === 'requirement-missing-id');
    expect(issue).toBeDefined();
    expect(issue?.line).toBeGreaterThan(0);
    expect(parsed.requirements[0].id).toBe('');
  });

  it('reports a scenario missing its ID slug', () => {
    const parsed = parseGovernedSpec(
      '---\nid: behavior.x\n---\n### Requirement: R\n**ID:** `r`\n#### Scenario: S\n- **WHEN** something\n'
    );
    expect(parsed.issues.some((i) => i.code === 'scenario-missing-id')).toBe(true);
  });

  it('reports an invalid requirement id slug', () => {
    const parsed = parseGovernedSpec(
      '---\nid: behavior.x\n---\n### Requirement: R\n**ID:** `Bad_Slug`\n'
    );
    expect(parsed.issues.some((i) => i.code === 'invalid-requirement-id')).toBe(true);
  });

  it('reports a scenario that appears before any requirement', () => {
    const parsed = parseGovernedSpec(
      '---\nid: behavior.x\n---\n#### Scenario: Orphan\n**ID:** `orphan`\n'
    );
    expect(
      parsed.issues.some((i) => i.code === 'scenario-before-requirement')
    ).toBe(true);
    expect(parsed.requirements).toHaveLength(0);
  });

  it('ignores headings and ID lines inside fenced code blocks', () => {
    const withFence = `---
id: behavior.x
---
### Requirement: Real one
**ID:** \`real-one\`

\`\`\`markdown
### Requirement: Fenced example
**ID:** \`should-be-ignored\`
#### Scenario: fenced scenario
**ID:** \`ignored-too\`
\`\`\`
`;
    const parsed = parseGovernedSpec(withFence);
    expect(parsed.requirements).toHaveLength(1);
    expect(parsed.requirements[0].id).toBe('real-one');
    expect(parsed.requirements[0].scenarios).toHaveLength(0);
  });
});
