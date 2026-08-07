#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { createRequire } from 'module';

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
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}
