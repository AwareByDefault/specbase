import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const template = (name: string) =>
  readFileSync(new URL(`../../../schemas/spec-driven-governed/templates/${name}`, import.meta.url), 'utf8');

describe('governed enforcement planning templates', () => {
  it('proposal commits to type, source, covered truth, and intended proof', () => {
    const text = template('proposal.md');
    expect(text).toContain('Covered truth');
    expect(text).toContain('Planned type');
    expect(text).toContain('Planned source');
    expect(text).toContain('Intended proof');
  });

  it('design owns the source behavior, harness, failure, and boundary', () => {
    const text = template('design.md');
    expect(text).toContain('assertions or observations');
    expect(text).toContain('native harness');
    expect(text).toContain('failure signal');
    expect(text).toContain('known boundary');
  });

  it('tasks separate source implementation, linking, execution, and result', () => {
    const text = template('tasks.md');
    expect(text).toContain('Implement or update source');
    expect(text).toContain('Link binding');
    expect(text).toContain('Execute source');
    expect(text).toContain('Record the command/procedure and result');
  });
});
