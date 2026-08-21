import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

let projectRoot = '';
const cli = path.join(process.cwd(), 'bin', 'specbase.js');
const entry = path.join(process.cwd(), 'dist', 'internal', 'view-tui.mjs');

beforeAll(async () => {
  projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-view-pty-'));
  await fs.mkdir(path.join(projectRoot, 'specbase', 'ideas', 'mouse-idea'), { recursive: true });
  await fs.mkdir(path.join(projectRoot, 'specbase', 'changes', 'archive'), { recursive: true });
  await fs.mkdir(path.join(projectRoot, 'specbase', 'specs'), { recursive: true });
  await fs.writeFile(path.join(projectRoot, 'specbase', 'ideas', 'mouse-idea', '.openspec.yaml'), 'id: mouse-idea\nsummary: Mouse idea\ncreated: 2025-01-01\n');
});
afterAll(async () => fs.rm(projectRoot, { recursive: true, force: true }));

type Action = 'quit-key' | 'quit-mouse' | 'sigint' | 'sigterm' | 'sighup' | 'none';

async function projectSnapshot(): Promise<string[]> {
  const result: string[] = [];
  async function walk(dir: string): Promise<void> {
    for (const item of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(dir, item.name);
      if (item.isDirectory()) await walk(absolute);
      else result.push(`${path.relative(projectRoot, absolute)}:${await fs.readFile(absolute, 'utf8')}`);
    }
  }
  await walk(projectRoot);
  return result;
}

async function runPty(action: Action, extraEnv: Record<string, string> = {}) {
  let output = '';
  const filesBefore = await projectSnapshot();
  let acted = false;
  let processRef: ReturnType<typeof Bun.spawn> | undefined;
  const terminal = new Bun.Terminal({
    cols: 100,
    rows: 28,
    name: 'xterm-256color',
    data(_term, data) {
      output += new TextDecoder().decode(data);
      if (acted || !output.includes('Lifecycle Board')) return;
      acted = true;
      if (action === 'quit-key') terminal.write('q');
      if (action === 'quit-mouse') {
        // Real SGR mouse down/up on the visible footer Quit control.
        terminal.write('\u001b[<0;41;27M\u001b[<0;41;27m');
      }
      if (action === 'sigint') processRef?.kill('SIGINT');
      if (action === 'sigterm') processRef?.kill('SIGTERM');
      if (action === 'sighup') processRef?.kill('SIGHUP');
    },
  });
  const before = {
    input: terminal.inputFlags,
    output: terminal.outputFlags,
    control: terminal.controlFlags,
    local: terminal.localFlags,
  };
  const child = Bun.spawn(['node', cli, 'view'], {
    cwd: projectRoot,
    terminal,
    env: { ...process.env, SPECBASE_BUN: process.execPath, ...extraEnv },
  });
  processRef = child;
  const code = await child.exited;
  const after = {
    input: terminal.inputFlags,
    output: terminal.outputFlags,
    control: terminal.controlFlags,
    local: terminal.localFlags,
  };
  terminal.close();
  return { code, output, acted, before, after, filesBefore, filesAfter: await projectSnapshot() };
}

async function malformedFrame(payload: Uint8Array): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entry], { stdio: ['ignore', 'pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, stdout, stderr }));
    const pipe = child.stdio[3];
    if (!pipe || !('end' in pipe)) throw new Error('fd 3 pipe unavailable');
    pipe.end(payload);
  });
}

describe('real PTY parent/child terminal lifecycle', () => {
  test('fd 3 EOF handoff renders and normal keyboard quit restores screen, cursor, and terminal modes', async () => {
    const result = await runPty('quit-key');
    expect(result.acted).toBe(true);
    expect(result.code).toBe(0);
    expect(result.output).toContain('\u001b[?1049h');
    expect(result.output).toContain('\u001b[?1049l');
    expect(result.output).toContain('\u001b[?25l');
    expect(result.output).toContain('\u001b[?25h');
    expect(result.after).toEqual(result.before);
    expect(result.filesAfter).toEqual(result.filesBefore);
  }, 30_000);

  test('real SGR mouse down/up activates the visible Quit control and restores the PTY', async () => {
    const result = await runPty('quit-mouse');
    expect(result.acted).toBe(true);
    expect(result.code).toBe(0);
    expect(result.output).toContain('Quit');
    expect(result.output).toContain('\u001b[?1049l');
    expect(result.after).toEqual(result.before);
    expect(result.filesAfter).toEqual(result.filesBefore);
  }, 30_000);

  for (const [action, expected, restores] of [['sigint', 130, true], ['sigterm', 143, true], ['sighup', 129, false]] as const) {
    test(`${action.toUpperCase()} is forwarded, reaped, restored, and returned as ${expected}`, async () => {
      const result = await runPty(action);
      expect(result.acted).toBe(true);
      expect(result.code).toBe(expected);
      if (restores) {
        expect(result.output).toContain('\u001b[?1049l');
        expect(result.after).toEqual(result.before);
      }
    }, 30_000);
  }

  test('renderer failure cleans up exactly once and maps to 70', async () => {
    const result = await runPty('none', { SPECBASE_VIEW_TEST_OUTCOME: 'renderer-failure' });
    expect(result.code).toBe(70);
    expect(result.output).toContain('injected renderer failure');
    expect(result.output).toContain('interactive board ended without changing project files');
    expect(result.output).toContain('specbase view --plain');
    expect(result.output).toContain('\u001b[?1049l');
    expect(result.after).toEqual(result.before);
  }, 30_000);

  test('an explicit child nonzero is propagated unchanged after cleanup', async () => {
    const result = await runPty('none', { SPECBASE_VIEW_TEST_OUTCOME: 'exit:23' });
    expect(result.code).toBe(23);
    expect(result.output).toContain('\u001b[?1049l');
    expect(result.after).toEqual(result.before);
  }, 30_000);

  test('empty, malformed, trailing, unsupported, invalid UTF-8, and schema-invalid fd 3 frames fail 65 before takeover', async () => {
    const validShape = { version: 3, project: { name: 'pty-project' }, summary: {}, lanes: {}, specs: [], diagnostics: [] };
    for (const payload of [new Uint8Array(), Buffer.from('{'), Buffer.from('{} trailing'), Buffer.from(JSON.stringify({ ...validShape, version: 4 })), Uint8Array.from([0xff]), Buffer.from(JSON.stringify(validShape))]) {
      const result = await malformedFrame(payload);
      expect(result.code).toBe(65);
      expect(result.stderr).toContain('protocol error');
      expect(result.stderr).toContain('interactive board ended without changing project files');
      expect(result.stderr).toContain('specbase view --plain');
      expect(result.stdout).not.toContain('\u001b[?1049h');
    }
  }, 30_000);

  test('missing Bun fails before takeover with status 74 and plain guidance', async () => {
    const result = await runPty('none', { SPECBASE_BUN: path.join(projectRoot, 'definitely-missing-bun') });
    expect(result.code).toBe(74);
    expect(result.output).toContain('Bun >=1.3');
    expect(result.output).toContain('specbase view --plain');
    expect(result.output).not.toContain('\u001b[?1049h');
    expect(result.after).toEqual(result.before);
  }, 30_000);
});
