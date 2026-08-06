import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { Binding } from '../schemas/governed-spec.schema.js';

/**
 * Structural validation of active binding targets and working directories
 * (design decision 5, task 3.3). Two guarantees:
 *
 *   1. Path safety — a declared target or `run.cwd` that resolves outside the
 *      selected project root is rejected *without* touching the external
 *      location.
 *   2. Existence — an in-root, file-like target or working directory that does
 *      not exist is reported so its covered claims are not treated as ready.
 *
 * Only `active` bindings are validated; a `planned` binding may reference a file
 * that does not exist yet. Core only reports — it never executes a binding.
 */

export type TargetField = 'targets' | 'run.cwd';

export type TargetProblemKind = 'escapes-root' | 'missing';

export interface TargetProblem {
  bindingId: string;
  field: TargetField;
  /** The path exactly as declared in the binding. */
  path: string;
  kind: TargetProblemKind;
  message: string;
}

export interface TargetValidationResult {
  problems: TargetProblem[];
  /** binding id → declared target/cwd paths that resolve in-root but are missing. */
  missingTargetsByBinding: Map<string, string[]>;
  /** Binding IDs with a target or cwd escaping the project root. */
  escapingBindingIds: Set<string>;
}

export interface TargetValidationOptions {
  /** Existence probe, overridable for tests. Defaults to a filesystem stat. */
  pathExists?: (absolutePath: string) => Promise<boolean>;
}

async function defaultExists(absolutePath: string): Promise<boolean> {
  try {
    await fs.stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether a declared target looks like a concrete file/directory path rather
 * than a human-readable rule or test selector (design decision 4 allows both in
 * `targets`). A path-like target carries a separator or a file extension; a bare
 * selector such as `no-restricted-imports` is left for review, not stat'd.
 */
export function looksLikePath(target: string): boolean {
  return /[\\/]/u.test(target) || /\.[a-z0-9]+$/iu.test(target);
}

/**
 * Resolve a declared project-relative path against the project root and report
 * whether it stays inside. Absolute inputs, or paths that climb above the root,
 * are escapes. Returns the absolute path only when it is safely in-root.
 */
function resolveInRoot(
  projectRoot: string,
  declared: string
): { inRoot: true; absolute: string } | { inRoot: false } {
  if (path.isAbsolute(declared)) {
    return { inRoot: false };
  }
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, declared);
  const relative = path.relative(root, absolute);
  if (relative === '') {
    return { inRoot: true, absolute };
  }
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { inRoot: false };
  }
  return { inRoot: true, absolute };
}

/**
 * Validate the active bindings' declared paths against the project root. The
 * returned `missingTargetsByBinding` feeds the coverage engine so broken
 * enforcement leaves its covered claims hanging.
 */
export async function validateTargets(
  bindings: Binding[],
  projectRoot: string,
  options: TargetValidationOptions = {}
): Promise<TargetValidationResult> {
  const exists = options.pathExists ?? defaultExists;
  const problems: TargetProblem[] = [];
  const missingTargetsByBinding = new Map<string, string[]>();
  const escapingBindingIds = new Set<string>();

  const recordMissing = (bindingId: string, declared: string): void => {
    const bucket = missingTargetsByBinding.get(bindingId);
    if (bucket) bucket.push(declared);
    else missingTargetsByBinding.set(bindingId, [declared]);
  };

  const checkPath = async (
    bindingId: string,
    field: TargetField,
    declared: string,
    requireExists: boolean
  ): Promise<void> => {
    const resolved = resolveInRoot(projectRoot, declared);
    if (!resolved.inRoot) {
      escapingBindingIds.add(bindingId);
      problems.push({
        bindingId,
        field,
        path: declared,
        kind: 'escapes-root',
        message: `${field} '${declared}' resolves outside the selected project root; rejected without access.`,
      });
      return;
    }
    if (!requireExists) return;
    if (!(await exists(resolved.absolute))) {
      recordMissing(bindingId, declared);
      problems.push({
        bindingId,
        field,
        path: declared,
        kind: 'missing',
        message: `${field} '${declared}' does not exist under the project root.`,
      });
    }
  };

  for (const binding of bindings) {
    if (binding.status !== 'active') continue;

    // Working directory: always a real path; must resolve in-root and exist.
    if (binding.run) {
      await checkPath(binding.id, 'run.cwd', binding.run.cwd, true);
    }

    for (const target of binding.targets) {
      const pathLike = looksLikePath(target);
      // Non-path selectors are still safety-checked (they cannot escape a root),
      // but only file-like targets are checked for existence.
      await checkPath(binding.id, 'targets', target, pathLike);
    }
  }

  for (const bucket of missingTargetsByBinding.values()) {
    bucket.sort((a, b) => a.localeCompare(b));
  }
  problems.sort(
    (a, b) =>
      a.bindingId.localeCompare(b.bindingId) ||
      a.field.localeCompare(b.field) ||
      a.path.localeCompare(b.path)
  );

  return { problems, missingTargetsByBinding, escapingBindingIds };
}
