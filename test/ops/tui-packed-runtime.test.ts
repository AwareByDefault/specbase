import { afterAll, describe, expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

let root = '';
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
afterAll(async () => { if (root) await fs.rm(root, { recursive: true, force: true }); });

async function command(argv: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  const child = Bun.spawn(argv, { cwd, stdout: 'pipe', stderr: 'pipe', env: process.env });
  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}

describe('packed consumer OpenTUI runtime', () => {
  test('packs, installs externally, resolves native artifacts, and initializes/destroys under Bun', async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'specbase-packed-tui-'));
    const packDir = path.join(root, 'pack');
    const consumer = path.join(root, 'consumer');
    await fs.mkdir(packDir, { recursive: true });
    await fs.mkdir(consumer, { recursive: true });

    const packed = await command([pnpmCommand, 'pack', '--pack-destination', packDir], process.cwd());
    expect(packed.code, packed.stderr).toBe(0);
    const tarballs = (await fs.readdir(packDir)).filter((name) => name.endsWith('.tgz'));
    expect(tarballs).toHaveLength(1);
    const tarball = path.join(packDir, tarballs[0]);
    await fs.writeFile(path.join(consumer, 'package.json'), JSON.stringify({ name: 'specbase-tui-smoke', private: true, type: 'module' }));
    const installed = await command([pnpmCommand, 'add', tarball, '--ignore-scripts'], consumer);
    expect(installed.code, `platform=${process.platform} arch=${process.arch}\n${installed.stderr}`).toBe(0);

    const privateEntry = path.join(consumer, 'node_modules', '@awarebydefault', 'specbase', 'dist', 'internal', 'view-tui.mjs');
    expect((await fs.stat(privateEntry)).isFile()).toBe(true);
    const smoke = path.join(consumer, 'smoke.mjs');
    await fs.writeFile(smoke, [
      "import { readdir, realpath } from 'node:fs/promises';",
      "import path from 'node:path';",
      "import { pathToFileURL } from 'node:url';",
      "const privateEntry = path.join(process.cwd(), 'node_modules', '@awarebydefault', 'specbase', 'dist', 'internal', 'view-tui.mjs');",
      "const realEntry = await realpath(privateEntry);",
      "const packageRoot = path.resolve(path.dirname(realEntry), '..', '..');",
      "const dependencyRoot = path.resolve(packageRoot, '..', '..', '@opentui', 'core');",
      "const testingPath = path.join(dependencyRoot, 'testing.js');",
      "const { createTestRenderer } = await import(pathToFileURL(testingPath).href);",
      "const setup = await createTestRenderer({ width: 20, height: 5 });",
      "await setup.renderOnce();",
      "setup.renderer.destroy();",
      "const scope = path.join(process.cwd(), 'node_modules', '.pnpm');",
      "const native = (await readdir(scope)).filter((name) => name.startsWith('@opentui+core-') && !name.startsWith('@opentui+core@'));",
      "console.log(JSON.stringify({ platform: process.platform, arch: process.arch, bun: Bun.version, core: dependencyRoot, native, destroyed: setup.renderer.isDestroyed }));",
      '',
    ].join('\n'));
    const initialized = await command([process.execPath, smoke], consumer);
    expect(initialized.code, `platform=${process.platform} arch=${process.arch}\n${initialized.stderr}`).toBe(0);
    const report = JSON.parse(initialized.stdout.trim());
    expect(report.platform).toBe(process.platform);
    expect(report.arch).toBe(process.arch);
    expect(report.core).toContain('@opentui');
    expect(report.native.length, `No native OpenTUI package resolved for ${process.platform}/${process.arch}`).toBeGreaterThan(0);
    expect(report.destroyed).toBe(true);
    const [major, minor] = String(report.bun).split('.').map(Number);
    expect(major > 1 || (major === 1 && minor >= 3)).toBe(true);

    // Exercise the packed private application itself, not only Core testing.
    const model = {
      version: 4,
      project: { name: 'packed-project' },
      summary: { openIdeas: 0, completedTasks: 0, totalTasks: 0, lanes: { proposed: 0, enforcement: 0, 'ready-to-apply': 0, implementing: 0, reviewing: 0, archived: 0 } },
      lanes: { ideas: [], proposed: [], enforcement: [], 'ready-to-apply': [], implementing: [], reviewing: [], archived: [] },
      diagnostics: [],
    };
    const applicationCode = await new Promise<number | null>((resolve, reject) => {
      const child = spawn(process.execPath, [privateEntry], {
        stdio: ['ignore', 'ignore', 'pipe', 'pipe'],
        env: { ...process.env, SPECBASE_VIEW_TEST_OUTCOME: 'exit:0' },
      });
      let stderr = '';
      child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
      child.once('error', reject);
      child.once('close', (code) => {
        if (code !== 0) reject(new Error(`packed renderer failed for ${process.platform}/${process.arch}: ${stderr}`));
        else resolve(code);
      });
      const pipe = child.stdio[3];
      if (!pipe || !('end' in pipe)) reject(new Error('packed renderer fd 3 unavailable'));
      else pipe.end(JSON.stringify(model));
    });
    expect(applicationCode).toBe(0);
  }, 120_000);

  test('missing native dependency reports package, platform, architecture, and remediation', async () => {
    // Run the built entrypoint under plain Node (not Bun). OpenTUI's native
    // FFI is unavailable under Node, so the entrypoint catch block emits the
    // required package/platform/architecture/remediation diagnostic and
    // returns 70. No pack/install dance is needed: this exercises the same
    // catch path a real missing/unloadable native dependency would hit.
    const privateEntry = path.join(process.cwd(), 'dist', 'internal', 'view-tui.mjs');
    expect((await fs.stat(privateEntry)).isFile()).toBe(true);
    const model = {
      version: 4,
      project: { name: 'packed-project' },
      summary: { openIdeas: 0, completedTasks: 0, totalTasks: 0, lanes: { proposed: 0, enforcement: 0, 'ready-to-apply': 0, implementing: 0, reviewing: 0, archived: 0 } },
      lanes: { ideas: [], proposed: [], enforcement: [], 'ready-to-apply': [], implementing: [], reviewing: [], archived: [] },
      diagnostics: [],
    };
    const node = process.platform === 'win32' ? 'node.exe' : 'node';
    const result = await new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
      const child = spawn(node, [privateEntry], { stdio: ['ignore', 'ignore', 'pipe', 'pipe'] });
      let stderr = '';
      child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
      child.once('error', reject);
      child.once('close', (code) => resolve({ code, stderr }));
      const pipe = child.stdio[3];
      if (!pipe || !('end' in pipe)) reject(new Error('fd 3 unavailable'));
      else pipe.end(JSON.stringify(model));
    });
    // Should fail with actionable diagnostic
    expect(result.code).toBe(70);
    expect(result.stderr.toLowerCase()).toMatch(/@opentui[/\\]core/);
    expect(result.stderr).toContain(process.platform);
    expect(result.stderr).toContain(process.arch);
    expect(result.stderr).toMatch(/reinstall|install|--plain/);
  }, 30_000);
});
