/**
 * Design-system (voice) fitness function.
 *
 * Binds:
 *  - design-system.cli-voice#shouting-error
 *
 * Statically scans user-facing strings passed to console.error / console.log in
 * src/**\/*.ts and asserts none shouts with an exclamation mark. This is the
 * deterministic half of the cli-voice pair; the "terse, never blames the user"
 * residue is judged by the `design` review lens (see enforcement.md).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, test } from "bun:test";

const projectRoot = join(import.meta.dir, "..", "..");
const srcRoot = join(projectRoot, "src");

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

/** String/template literals passed to console.error / console.log in `source`. */
function userFacingStrings(source: string): string[] {
  const strings: string[] = [];
  const call = /console\s*\.\s*(?:error|log)\s*\(([\s\S]*?)\)/g;
  const literal = /"([^"]*)"|'([^']*)'|`([^`]*)`/g;
  let callMatch: RegExpExecArray | null;
  while ((callMatch = call.exec(source))) {
    const args = callMatch[1];
    let litMatch: RegExpExecArray | null;
    while ((litMatch = literal.exec(args))) {
      strings.push(litMatch[1] ?? litMatch[2] ?? litMatch[3] ?? "");
    }
  }
  return strings;
}

describe("design-system.cli-voice — no shouting in CLI copy", () => {
  const files = collectTsFiles(srcRoot);

  for (const file of files) {
    const rel = relative(projectRoot, file).split(sep).join("/");
    test(`${rel} user-facing copy has no exclamation mark`, () => {
      const shouting = userFacingStrings(readFileSync(file, "utf8")).filter((s) => s.includes("!"));
      expect(shouting).toEqual([]);
    });
  }
});
