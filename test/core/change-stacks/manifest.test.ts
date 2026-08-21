import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createStack,
  readStackManifest,
  resolveStackMembers,
  stackDir,
  StackValidationError,
} from '../../../src/core/change-stacks/index.js';

const roots: string[] = [];
async function root(): Promise<string> {
  const value = await fs.mkdtemp(path.join(os.tmpdir(), 'stack-manifest-'));
  roots.push(value);
  await fs.mkdir(path.join(value, 'specbase', 'changes', 'archive'), { recursive: true });
  await fs.mkdir(path.join(value, 'specbase', 'ideas'), { recursive: true });
  return value;
}
async function item(rootPath: string, region: 'ideas' | 'changes' | 'archive', directory: string, id: string): Promise<void> {
  const base = region === 'archive'
    ? path.join(rootPath, 'specbase', 'changes', 'archive')
    : path.join(rootPath, 'specbase', region);
  const dir = path.join(base, directory);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, '.openspec.yaml'), yaml.stringify({ id, ...(region === 'ideas' ? { summary: id, created: '2026-01-01' } : { schema: 'spec-driven' }) }));
}
afterEach(async () => Promise.all(roots.splice(0).map((entry) => fs.rm(entry, { recursive: true, force: true }))));

describe('change stack manifests', () => {
  it('resolves immutable IDs across idea, change, and dated archive positions in order', async () => {
    const project = await root();
    await item(project, 'ideas', 'one', 'one');
    await item(project, 'changes', 'two', 'two');
    await item(project, 'archive', '2026-01-02-three', 'three');
    const manifest = await createStack(project, { id: 'delivery', summary: 'Deliver three slices', members: ['one', 'two', 'three'] });
    const resolved = await resolveStackMembers(project, manifest);
    expect(resolved.map((member) => [member.id, member.position])).toEqual([
      ['one', 'idea'], ['two', 'change'], ['three', 'archived'],
    ]);
  });

  it.each([
    { members: ['one'], message: 'at least two' },
    { members: ['one', 'one'], message: 'duplicate' },
    { members: ['../one', 'two'], message: 'stable kebab-case' },
  ])('rejects malformed membership: $message', async ({ members, message }) => {
    const project = await root();
    await item(project, 'ideas', 'one', 'one');
    await item(project, 'ideas', 'two', 'two');
    await expect(createStack(project, { id: 'delivery', summary: 'Delivery', members })).rejects.toThrow(message);
    await expect(fs.access(stackDir(project, 'delivery'))).rejects.toThrow();
  });

  it('rejects missing, ambiguous, nested, and multiple-stack members', async () => {
    const project = await root();
    await item(project, 'ideas', 'one', 'one');
    await item(project, 'ideas', 'two', 'two');
    await item(project, 'changes', 'two-copy', 'two');
    await expect(createStack(project, { id: 'ambiguous', summary: 'Ambiguous', members: ['one', 'two'] })).rejects.toBeInstanceOf(StackValidationError);

    await fs.rm(path.join(project, 'specbase', 'changes', 'two-copy'), { recursive: true });
    await createStack(project, { id: 'first-stack', summary: 'First', members: ['one', 'two'] });
    await item(project, 'ideas', 'three', 'three');
    await expect(createStack(project, { id: 'second-stack', summary: 'Second', members: ['two', 'three'] })).rejects.toThrow('already belongs');
    await expect(createStack(project, { id: 'nested', summary: 'Nested', members: ['first-stack', 'three'] })).rejects.toThrow('nested stacks');
    await expect(createStack(project, { id: 'missing', summary: 'Missing', members: ['three', 'absent'] })).rejects.toThrow('does not resolve');
  });

  it('returns typed diagnostics for malformed YAML shape', async () => {
    const project = await root();
    const dir = stackDir(project, 'broken');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.openspec.yaml'), 'id: broken\nmembers: []\nextra: true\n');
    await expect(readStackManifest(project, 'broken')).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'invalid_stack_manifest' })]),
    });
  });

  it('rejects malformed present member metadata instead of falling back to its directory', async () => {
    const project = await root();
    const malformed = path.join(project, 'specbase', 'ideas', 'broken-member');
    await fs.mkdir(malformed, { recursive: true });
    await fs.writeFile(path.join(malformed, '.openspec.yaml'), 'id: [not-valid\n');
    await item(project, 'ideas', 'valid-member', 'valid-member');
    await expect(createStack(project, { id: 'delivery', summary: 'Delivery', members: ['broken-member', 'valid-member'] })).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'malformed_member_metadata', member: 'broken-member' })]),
    });
  });

  it('preserves idea identity and rejects traversal, metadata mismatch, and alternate ids before movement', async () => {
    const project = await root();
    await item(project, 'ideas', 'umbrella', 'umbrella');
    await item(project, 'ideas', 'one', 'one');
    await item(project, 'ideas', 'two', 'two');
    await expect(createStack(project, { id: 'replacement', fromIdea: 'umbrella', summary: 'Delivery', members: ['one', 'two'] })).rejects.toThrow('must equal source idea id');
    await expect(createStack(project, { id: 'safe', fromIdea: '../changes/victim', summary: 'Delivery', members: ['one', 'two'] })).rejects.toThrow('must be a stable kebab-case ID');
    expect(await fs.stat(path.join(project, 'specbase', 'ideas', 'umbrella'))).toBeTruthy();

    await fs.writeFile(path.join(project, 'specbase', 'ideas', 'umbrella', '.openspec.yaml'), 'id: another-id\nsummary: Umbrella\ncreated: 2026-01-01\n');
    await expect(createStack(project, { fromIdea: 'umbrella', summary: 'Delivery', members: ['one', 'two'] })).rejects.toThrow("declares immutable id 'another-id'");
    expect(await fs.stat(path.join(project, 'specbase', 'ideas', 'umbrella'))).toBeTruthy();
  });

  it.skipIf(process.platform === 'win32')('rejects idea symlinks and leaves external bytes untouched', async () => {
    const project = await root();
    const external = await fs.mkdtemp(path.join(os.tmpdir(), 'stack-external-idea-'));
    roots.push(external);
    await fs.writeFile(path.join(external, '.openspec.yaml'), 'id: umbrella\nsummary: Umbrella\ncreated: 2026-01-01\n');
    await fs.writeFile(path.join(external, 'research.txt'), 'external bytes\n');
    await fs.symlink(external, path.join(project, 'specbase', 'ideas', 'umbrella'), 'dir');
    await item(project, 'ideas', 'one', 'one');
    await item(project, 'ideas', 'two', 'two');

    await expect(createStack(project, { fromIdea: 'umbrella', summary: 'Delivery', members: ['one', 'two'] })).rejects.toThrow('real directory');
    expect(await fs.readFile(path.join(external, 'research.txt'), 'utf-8')).toBe('external bytes\n');
    expect((await fs.lstat(path.join(project, 'specbase', 'ideas', 'umbrella'))).isSymbolicLink()).toBe(true);
    await expect(fs.access(stackDir(project, 'umbrella'))).rejects.toThrow();
  });

  it('rejects self-membership before publishing or moving the source idea', async () => {
    const project = await root();
    await item(project, 'ideas', 'umbrella', 'umbrella');
    await item(project, 'ideas', 'other', 'other');
    await expect(createStack(project, { fromIdea: 'umbrella', summary: 'Delivery', members: ['umbrella', 'other'] })).rejects.toThrow('cannot include itself');
    expect((await fs.stat(path.join(project, 'specbase', 'ideas', 'umbrella'))).isDirectory()).toBe(true);
    await expect(fs.access(stackDir(project, 'umbrella'))).rejects.toThrow();
  });

  it('serializes concurrent publication and rechecks exclusive membership under the lock', async () => {
    const project = await root();
    await item(project, 'ideas', 'shared', 'shared');
    await item(project, 'ideas', 'second', 'second');
    await item(project, 'ideas', 'third', 'third');
    const results = await Promise.allSettled([
      createStack(project, { id: 'first-delivery', summary: 'First', members: ['shared', 'second'] }),
      createStack(project, { id: 'second-delivery', summary: 'Second', members: ['shared', 'third'] }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const manifests = await fs.readdir(path.join(project, 'specbase', 'stacks'));
    expect(manifests.filter((name) => !name.startsWith('.'))).toHaveLength(1);
  });
});
