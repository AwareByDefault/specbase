/**
 * Code-quality fitness function.
 *
 * Binds:
 *  - code-quality.domain-purity#no-console-in-domain
 *  - code-quality.domain-purity#console-in-domain
 *
 * Statically scans src/domain/**\/*.ts (comments stripped) and asserts the pure
 * domain never calls `console.*`. This is distinct from the import-boundary
 * check: `console` is a global with no import, so the boundary fitness function
 * cannot see it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, test } from "bun:test";

const projectRoot = join(import.meta.dir, "..", "..");
const domainRoot = join(projectRoot, "src", "domain");

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (entry.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

/** Remove // line comments and block comments so text in comments never trips the scan. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

const CONSOLE_CALL = /\bconsole\s*\.\s*[a-zA-Z]/;

describe("code-quality.domain-purity — no console in domain", () => {
  const files = collectTsFiles(domainRoot);

  test("the domain has source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const rel = relative(projectRoot, file).split(sep).join("/");
    test(`${rel} has no console.* call`, () => {
      const code = stripComments(readFileSync(file, "utf8"));
      expect(CONSOLE_CALL.test(code)).toBe(false);
    });
  }
});
