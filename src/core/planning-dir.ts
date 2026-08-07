import { statSync } from 'node:fs';
import * as path from 'node:path';

/**
 * The per-project planning directory name for new projects.
 */
export const PLANNING_DIR_NAME = 'specbase';

/**
 * The legacy per-project planning directory name. Existing projects that
 * already use this directory keep resolving to it for backward compatibility.
 */
export const LEGACY_PLANNING_DIR_NAME = 'openspec';

function isExistingDirectory(candidate: string): boolean {
  try {
    return statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Resolve the planning directory NAME for a given filesystem root.
 *
 * Preference order:
 *   1. `specbase/` when it already exists under `root`.
 *   2. an existing legacy `openspec/` (keeps existing projects unchanged).
 *   3. the default `specbase` for new roots.
 */
export function resolvePlanningDirName(root: string): string {
  if (isExistingDirectory(path.join(root, PLANNING_DIR_NAME))) {
    return PLANNING_DIR_NAME;
  }
  if (isExistingDirectory(path.join(root, LEGACY_PLANNING_DIR_NAME))) {
    return LEGACY_PLANNING_DIR_NAME;
  }
  return PLANNING_DIR_NAME;
}

/**
 * Resolve the absolute planning directory PATH for a given filesystem root,
 * applying the same prefer/fallback logic as `resolvePlanningDirName`.
 */
export function planningDir(root: string): string {
  return path.join(root, resolvePlanningDirName(root));
}
