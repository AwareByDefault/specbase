#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

const runTsc = (args = []) => {
  const tscPath = require.resolve('typescript/bin/tsc');
  execFileSync(process.execPath, [tscPath, ...args], { stdio: 'inherit' });
};

console.log('🔨 Building Specbase...\n');

// Clean dist directory
if (existsSync('dist')) {
  console.log('Cleaning dist directory...');
  rmSync('dist', { recursive: true, force: true });
}

// Lift the manifestos' marked Rules sections into their generated module BEFORE
// tsc, so the constant the skill generator imports compiles into dist. `docs/`
// does not ship, so this build-time bake is what carries the rules into an
// installed repo.
console.log('Generating clean-rules module...');
try {
  execFileSync(process.execPath, ['scripts/generate-clean-rules.mjs'], { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Build failed: could not generate the clean-rules module.');
  process.exit(1);
}

// Run TypeScript compiler (use local version explicitly)
console.log('Compiling TypeScript...');
try {
  runTsc(['--version']);
  runTsc();

  console.log('Bundling private Bun/OpenTUI renderer...');
  const internalDir = path.join('dist', 'internal');
  mkdirSync(internalDir, { recursive: true });
  execFileSync('bun', [
    'build',
    path.join('src', 'tui', 'view', 'entry.ts'),
    '--outfile', path.join(internalDir, 'view-tui.mjs'),
    '--target', 'bun',
    '--format', 'esm',
    '--external', '@opentui/core',
    '--external', '@opentui/core/*',
  ], { stdio: 'inherit' });
  // Only the private bundled application is published; intermediate tsc output
  // is not another renderer entrypoint.
  rmSync(path.join('dist', 'tui'), { recursive: true, force: true });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}
