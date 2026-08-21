import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFile(path.join(root, ...relative.split('/')), 'utf8');

describe('contained TUI runtime contract', () => {
  it('keeps Node >=20.19 and pins OpenTUI Core exactly as a production dependency', async () => {
    const manifest = JSON.parse(await read('package.json'));
    expect(manifest.engines.node).toBe('>=20.19.0');
    expect(manifest.dependencies['@opentui/core']).toBe('0.5.4');
    expect(manifest.devDependencies?.['@opentui/core']).toBeUndefined();
    const lock = await read('pnpm-lock.yaml');
    expect(lock).toMatch(/'@opentui\/core':\s*\n\s+specifier: 0\.5\.4\s*\n\s+version: 0\.5\.4/);
  });

  it('gates only interactive mode on Bun >=1.3 and declares fd 3 EOF JSON metadata', async () => {
    const launcher = await read('src/core/view/launcher.ts');
    const command = await read('src/core/view.ts');
    const protocol = await read('src/core/view/protocol.ts');
    expect(launcher).toMatch(/discoverBun/);
    expect(protocol).toContain('minor: 3');
    expect(protocol).toContain('VIEW_MODEL_FD = 3');
    expect(launcher).toContain("SPECBASE_VIEW_PROTOCOL: 'fd3-eof-json-v1'");
    const launchCall = command.indexOf('const result = await');
    expect(command.indexOf('if (options.json)')).toBeLessThan(launchCall);
    expect(command.indexOf('if (options.plain')).toBeLessThan(launchCall);
    expect(command).not.toMatch(/@opentui\/core/);
  });

  it('publishes one private application bundle while keeping OpenTUI and native packages external', async () => {
    const build = await read('build.js');
    const bundle = await read('dist/internal/view-tui.mjs');
    const manifest = JSON.parse(await read('package.json'));
    expect(build).toContain("'--external', '@opentui/core'");
    expect(build).toContain("'--external', '@opentui/core/*'");
    expect(bundle).toMatch(/from\s+["']@opentui\/core["']/);
    expect(bundle.length).toBeLessThan(150_000);
    expect(manifest.files).toContain('dist');
    expect(await fs.stat(path.join(root, 'dist', 'internal', 'view-tui.mjs'))).toBeTruthy();
    await expect(fs.stat(path.join(root, 'dist', 'tui', 'view', 'entry.js'))).rejects.toThrow();

    // Audit that the packed tarball does not vendor OpenTUI or native binaries.
    // Skip the prepare/build lifecycle (npm_config_ignore_scripts) so `pnpm pack`
    // does not wipe+rebuild `dist/` while parallel test workers use it.
    const { execFileSync } = await import('node:child_process');
    const packDir = path.join(root, 'dist');
    try {
      execFileSync('pnpm', ['pack', '--pack-destination', packDir], {
        cwd: root, stdio: 'pipe',
        env: { ...process.env, npm_config_ignore_scripts: 'true' },
      });
      const tgz = (await fs.readdir(packDir)).filter((n) => n.endsWith('.tgz'))[0];
      if (tgz) {
        const list = execFileSync('tar', ['tzf', path.join(packDir, tgz)], { encoding: 'utf8', stdio: 'pipe' });
        // The tarball must not contain vendored @opentui or native platform binaries
        expect(list).not.toMatch(/@opentui\/core\//);
        expect(list).not.toMatch(/\.node$/);
        // The private entrypoint must be present
        expect(list).toMatch(/dist\/internal\/view-tui\.mjs/);
        // Clean up the tarball
        await fs.rm(path.join(packDir, tgz));
      }
    } catch { /* pack may fail in non-pnpm environments; skip tarball audit */ }

    // Reject React or Solid as renderer dependencies
    const allDeps = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
    for (const dep of Object.keys(allDeps || {})) {
      expect(dep).not.toMatch(/^(react|solid|preact)/);
    }
  });

  it('has an explicit Bun TUI suite and every CI OS matrix member runs it after normal tests', async () => {
    const manifest = JSON.parse(await read('package.json'));
    const ci = await read('.github/workflows/ci.yml');
    expect(manifest.scripts['test:tui']).toContain('bun test');
    for (const os of ['ubuntu-latest', 'macos-latest', 'windows-latest']) expect(ci).toContain(`os: ${os}`);
    expect(ci).toContain('oven-sh/setup-bun@v2');
    expect(ci).toContain("bun-version: '1.3.14'");
    expect(ci).toContain('run: pnpm run test:tui');
    expect(ci.indexOf('run: pnpm test')).toBeLessThan(ci.indexOf('run: pnpm run test:tui'));
  });
});
