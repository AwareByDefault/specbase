/**
 * Ops fitness function.
 *
 * Binds:
 *  - ops.runtime#mandated-stack
 *  - ops.runtime#runtime-dependency-added
 *  - ops.runtime#strict-disabled
 *
 * Statically reads package.json and tsconfig.json (no execution) and asserts
 * the mandated runtime stack: no runtime dependencies, and TypeScript strict
 * mode on.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

const projectRoot = join(import.meta.dir, "..", "..");

function readJson(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(projectRoot, rel), "utf8")) as Record<string, unknown>;
}

describe("ops.runtime — mandated runtime stack", () => {
  test("package.json declares no runtime dependencies", () => {
    const pkg = readJson("package.json");
    const deps = (pkg.dependencies ?? {}) as Record<string, unknown>;
    expect(Object.keys(deps)).toEqual([]);
  });

  test("tsconfig.json enables strict mode", () => {
    const tsconfig = readJson("tsconfig.json");
    const compilerOptions = (tsconfig.compilerOptions ?? {}) as Record<string, unknown>;
    expect(compilerOptions.strict).toBe(true);
  });
});
