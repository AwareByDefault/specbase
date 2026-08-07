import * as fs from 'node:fs';
import * as path from 'node:path';

/** Minimal healthy Specbase root layout shared by slice test suites. */
export function createSpecbaseRoot(rootDir: string): void {
  fs.mkdirSync(path.join(rootDir, 'specbase', 'specs'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'specbase', 'changes', 'archive'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'specbase', 'config.yaml'), 'schema: spec-driven\n');
}

/** Writes a spec file under the root's specbase/specs/<id>/spec.md. */
export function writeSpec(rootDir: string, specId: string, body: string): void {
  const specDir = path.join(rootDir, 'specbase', 'specs', specId);
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, 'spec.md'), body);
}
