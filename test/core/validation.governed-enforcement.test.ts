import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Validator } from '../../src/core/validation/validator.js';

let projectRoot: string;
let changeDir: string;

const deltaSpec = `---
id: behavior.strict-enforcement
---

## Purpose
Validate strict governed enforcement manifests.

## ADDED Requirements

### Requirement: Strict evidence
**ID:** strict-evidence
The system MUST validate paired enforcement.

#### Scenario: Valid source
**ID:** valid-source
- **WHEN** strict validation runs
- **THEN** the paired source is checked
`;

async function writePair(enforcementName: 'enforcement.yaml' | 'enforcement.md', content: string): Promise<void> {
  const pairDir = path.join(changeDir, 'specs', 'behavior', 'strict-enforcement');
  await fs.mkdir(pairDir, { recursive: true });
  await fs.writeFile(path.join(pairDir, 'spec.md'), deltaSpec);
  await fs.writeFile(path.join(pairDir, enforcementName), content);
}

beforeEach(async () => {
  projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'strict-governed-validation-'));
  changeDir = path.join(projectRoot, 'specbase', 'changes', 'strict-enforcement');
  await fs.mkdir(changeDir, { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, 'specbase', 'config.yaml'),
    'schema: spec-driven-governed\n'
  );
  await fs.mkdir(path.join(projectRoot, 'test'), { recursive: true });
  await fs.writeFile(path.join(projectRoot, 'test', 'strict.test.ts'), '// evidence\n');
});

afterEach(async () => {
  await fs.rm(projectRoot, { recursive: true, force: true });
});

describe('strict governed change enforcement validation', () => {
  it('discovers and validates a paired compact manifest and its resolved file source', async () => {
    await writePair(
      'enforcement.yaml',
      `bindings:\n  strict-source:\n    type: test\n    covers: strict-evidence\n    source: test/strict.test.ts#case\n`
    );

    const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
    expect(report.valid, report.issues.map((issue) => issue.message).join('\n')).toBe(true);
  });

  it('rejects non-exact compact fields during strict change validation', async () => {
    await writePair(
      'enforcement.yaml',
      `bindings:\n  strict-source:\n    type: test\n    covers: strict-evidence\n    source: test/strict.test.ts\n    status: active\n`
    );

    const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.message.includes('Unrecognized key'))).toBe(true);
  });

  it('rejects unresolved types and invalid file-source semantics during strict change validation', async () => {
    await fs.mkdir(path.join(projectRoot, 'test', 'directory-source'));
    await writePair(
      'enforcement.yaml',
      `bindings:\n  unknown-source:\n    type: unknown-check\n    covers: strict-evidence\n    source: test/strict.test.ts\n  directory-source:\n    type: test\n    covers: strict-evidence\n    source: test/directory-source\n`
    );

    const report = await new Validator(true).validateChangeDeltaSpecs(changeDir);
    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.message.includes("unknown type 'unknown-check'"))).toBe(true);
    expect(report.issues.some((issue) => issue.message.includes('must resolve to a file'))).toBe(true);
  });
});
