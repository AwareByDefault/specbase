/**
 * Import-boundary fitness function.
 *
 * Binds:
 *  - architecture.boundaries#import-boundary-fitness-function
 *  - architecture.persistence-port#store-port-boundary-check
 *
 * Statically scans src/**\/*.ts import specifiers (no execution, no
 * transpilation) and asserts:
 *  1. The domain layer imports nothing from adapters, the CLI entry point, or
 *     ambient I/O modules (filesystem, network, child_process).
 *  2. The domain layer does depend on its own injected Store port (positive
 *     check that the pattern is actually used, not just that bad imports are
 *     absent).
 *  3. At least one adapter/CLI module imports the domain (the allowed,
 *     expected edge exists and is exercised).
 *  4. No module other than the JSON-file adapter imports an `fs` module -
 *     it is the sole filesystem access point for habit data.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, test } from "bun:test";

const projectRoot = join(import.meta.dir, "..", "..");
const srcRoot = join(projectRoot, "src");

interface SourceFile {
  abs: string;
  /** Path relative to src/, using forward slashes regardless of platform. */
  rel: string;
}

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

function toSourceFile(abs: string): SourceFile {
  return { abs, rel: relative(srcRoot, abs).split(sep).join("/") };
}

function importSpecifiers(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const specifiers: string[] = [];
  // Matches `import ... from "spec"`, `import "spec"`, and `export ... from "spec"`.
  const re = /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?from\s+)?["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

const FS_MODULES = new Set(["fs", "node:fs", "node:fs/promises"]);
const AMBIENT_IO_MODULES = new Set([
  ...FS_MODULES,
  "net",
  "node:net",
  "http",
  "node:http",
  "https",
  "node:https",
  "child_process",
  "node:child_process",
]);

const sourceFiles = collectTsFiles(srcRoot).map(toSourceFile);
const domainFiles = sourceFiles.filter((f) => f.rel.startsWith("domain/"));
const nonDomainFiles = sourceFiles.filter((f) => !f.rel.startsWith("domain/"));

function isAdapterOrMainSpecifier(spec: string): boolean {
  return (
    spec.includes("adapters/") ||
    spec === "./main" ||
    spec === "../main" ||
    spec.endsWith("/main")
  );
}

function isDomainSpecifier(spec: string): boolean {
  return spec.includes("domain/") || spec === "../domain" || spec === "./domain";
}

describe("architecture.boundaries: domain isolation and inward dependency direction", () => {
  test("domain modules do not import adapters, the CLI entry, or ambient I/O", () => {
    const violations: string[] = [];
    for (const file of domainFiles) {
      for (const spec of importSpecifiers(file.abs)) {
        if (isAdapterOrMainSpecifier(spec) || AMBIENT_IO_MODULES.has(spec)) {
          violations.push(`${file.rel} imports "${spec}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("the domain depends on its own injected Store port", () => {
    const usesOwnPort = domainFiles.some((file) =>
      importSpecifiers(file.abs).some(
        (spec) => spec === "./ports/store" || spec.endsWith("/ports/store"),
      ),
    );
    expect(usesOwnPort).toBe(true);
  });

  test("adapters and the CLI may depend on the domain, and that edge is exercised", () => {
    const anyImportsDomain = nonDomainFiles.some((file) =>
      importSpecifiers(file.abs).some(isDomainSpecifier),
    );
    expect(anyImportsDomain).toBe(true);
  });
});

describe("architecture.persistence-port: the JSON-file adapter is the sole filesystem access point", () => {
  test("no module other than the JSON-file adapter imports an fs module", () => {
    const violations: string[] = [];
    for (const file of sourceFiles) {
      const isJsonAdapter = file.rel === "adapters/json-file-store.ts";
      if (isJsonAdapter) continue;
      for (const spec of importSpecifiers(file.abs)) {
        if (FS_MODULES.has(spec)) {
          violations.push(`${file.rel} imports "${spec}"`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
