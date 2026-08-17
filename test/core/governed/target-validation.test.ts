import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  validateTargets,
  looksLikePath,
} from '../../../src/core/governed/target-validation.js';
import type { Binding } from '../../../src/core/schemas/governed-spec.schema.js';

function binding(overrides: Partial<Binding>): Binding {
  return {
    id: 'b1',
    covers: ['r'],
    mechanism: 'test',
    strength: 'automated',
    status: 'active',
    targets: [],
    ...overrides,
  };
}

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'governed-targets-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('governed/target-validation', () => {
  it('passes when every active target and cwd resolves inside the root and exists', async () => {
    fs.mkdirSync(path.join(root, 'test'));
    fs.writeFileSync(path.join(root, 'test', 'a.test.ts'), '');
    const result = await validateTargets(
      [
        binding({
          targets: ['test/a.test.ts'],
          run: { command: 'pnpm', args: [], cwd: '.' },
        }),
      ],
      root
    );
    expect(result.problems).toEqual([]);
    expect(result.missingTargetsByBinding.size).toBe(0);
    expect(result.escapingBindingIds.size).toBe(0);
  });

  it('reports a missing target with binding id, field, and path', async () => {
    const result = await validateTargets(
      [binding({ targets: ['test/missing.test.ts'] })],
      root
    );
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toMatchObject({
      bindingId: 'b1',
      field: 'targets',
      path: 'test/missing.test.ts',
      kind: 'missing',
    });
    expect(result.missingTargetsByBinding.get('b1')).toEqual([
      'test/missing.test.ts',
    ]);
  });

  it('rejects a target escaping the root without accessing it', async () => {
    const result = await validateTargets(
      [binding({ targets: ['../../etc/passwd'] })],
      root
    );
    expect(result.problems[0].kind).toBe('escapes-root');
    expect(result.escapingBindingIds.has('b1')).toBe(true);
    // It is reported as an escape, not as missing.
    expect(result.missingTargetsByBinding.size).toBe(0);
  });

  it('rejects an absolute target as an escape', async () => {
    const result = await validateTargets(
      [binding({ targets: ['/etc/hosts'] })],
      root
    );
    expect(result.problems[0].kind).toBe('escapes-root');
  });

  it('rejects an escaping run.cwd', async () => {
    const result = await validateTargets(
      [binding({ run: { command: 'pnpm', args: [], cwd: '../outside' } })],
      root
    );
    expect(result.problems.some((p) => p.field === 'run.cwd')).toBe(true);
    expect(result.escapingBindingIds.has('b1')).toBe(true);
  });

  it('resolves the file portion before a compact source selector', async () => {
    fs.mkdirSync(path.join(root, 'test'));
    fs.writeFileSync(path.join(root, 'test', 'a.test.ts'), '');
    const result = await validateTargets(
      [binding({ type: 'test', source: 'test/a.test.ts#named-case' })],
      root,
      { compactBindings: true }
    );
    expect(result.problems).toEqual([]);
  });

  it('rejects a compact file source with an empty path before its selector', async () => {
    const result = await validateTargets(
      [binding({ type: 'test', source: '#named-case' })],
      root,
      { compactBindings: true }
    );
    expect(result.problems).toEqual([
      expect.objectContaining({
        bindingId: 'b1',
        field: 'source',
        path: '#named-case',
        kind: 'invalid-source',
      }),
    ]);
    expect(result.missingTargetsByBinding.get('b1')).toEqual(['#named-case']);
  });

  it('rejects a directory where a compact file source requires a file', async () => {
    fs.mkdirSync(path.join(root, 'test'));
    const result = await validateTargets(
      [binding({ type: 'test', source: 'test' })],
      root,
      { compactBindings: true }
    );
    expect(result.problems).toEqual([
      expect.objectContaining({
        bindingId: 'b1',
        field: 'source',
        path: 'test',
        kind: 'not-file',
      }),
    ]);
    expect(result.missingTargetsByBinding.get('b1')).toEqual(['test']);
  });

  it('resolves lens-backed compact sources against the configured roster', async () => {
    const result = await validateTargets(
      [binding({ type: 'review', source: 'architectural' })],
      root,
      { compactBindings: true, lensIds: ['enforcement'] }
    );
    expect(result.problems[0]).toMatchObject({
      field: 'source',
      path: 'architectural',
      kind: 'missing',
    });
  });

  it('skips existence checks for non-path rule selectors', async () => {
    const result = await validateTargets(
      [binding({ targets: ['no-restricted-imports'] })],
      root
    );
    expect(result.problems).toEqual([]);
  });

  it('ignores planned bindings', async () => {
    const result = await validateTargets(
      [binding({ status: 'planned', targets: ['test/missing.test.ts'] })],
      root
    );
    expect(result.problems).toEqual([]);
  });

  it('looksLikePath distinguishes files from selectors', () => {
    expect(looksLikePath('test/a.test.ts')).toBe(true);
    expect(looksLikePath('config.json')).toBe(true);
    expect(looksLikePath('no-restricted-imports')).toBe(false);
  });
});
