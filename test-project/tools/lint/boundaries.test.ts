import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DOMAIN_DIR = join(import.meta.dir, "../../src/domain");

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

// Architectural invariant: the domain layer must not import from adapters,
// and must not read ambient time (new Date / Date.now).
test("domain does not import adapters", () => {
  for (const file of tsFiles(DOMAIN_DIR)) {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/from\s+["'].*adapters/);
  }
});

test("domain does not read ambient time", () => {
  for (const file of tsFiles(DOMAIN_DIR)) {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/new\s+Date\s*\(|Date\.now\s*\(/);
  }
});
