import { describe, it, expect } from 'vitest';
import { parseEnforcement } from '../../../src/core/governed/enforcement-parser.js';

/** A review binding declaring the new lens/covered_by vocabulary. */
const WITH_FIELDS = `# Enforcement

\`\`\`yaml
version: 1
spec: architecture.domain
bindings:
  - id: boundary-review
    covers: [import-boundary]
    mechanism: review
    strength: review
    status: active
    lens: architectural
    covered_by: [import-lint]
    review:
      procedure: Confirm no adapter imports leak into the domain.
\`\`\`
`;

/** The same binding with neither optional field. */
const WITHOUT_FIELDS = `# Enforcement

\`\`\`yaml
version: 1
spec: architecture.domain
bindings:
  - id: boundary-review
    covers: [import-boundary]
    mechanism: review
    strength: review
    status: active
    review:
      procedure: Confirm no adapter imports leak into the domain.
\`\`\`
`;

describe('enforcement binding lens/covered_by vocabulary', () => {
  it('parses and surfaces lens and covered_by when present (round-trip)', () => {
    const parsed = parseEnforcement(WITH_FIELDS);
    expect(parsed.issues).toEqual([]);
    expect(parsed.bindings).toHaveLength(1);
    const [binding] = parsed.bindings;
    expect(binding.lens).toBe('architectural');
    expect(binding.covered_by).toEqual(['import-lint']);
  });

  it('leaves the fields absent (not defaulted) when omitted — backward-compatible', () => {
    const parsed = parseEnforcement(WITHOUT_FIELDS);
    expect(parsed.issues).toEqual([]);
    const [binding] = parsed.bindings;
    expect(binding.lens).toBeUndefined();
    expect(binding.covered_by).toBeUndefined();
    // Absent fields do not add keys to the parsed binding.
    expect('lens' in binding).toBe(false);
    expect('covered_by' in binding).toBe(false);
  });

  it('rejects a non-kebab lens id via schema validation', () => {
    const bad = WITH_FIELDS.replace('lens: architectural', 'lens: Not_Kebab');
    const parsed = parseEnforcement(bad);
    expect(parsed.bindings).toHaveLength(0);
    expect(parsed.issues.some((i) => i.code === 'invalid-document')).toBe(true);
  });
});
