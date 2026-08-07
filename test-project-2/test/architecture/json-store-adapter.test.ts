import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonFileStore } from "../../src/adapters/json-file-store";

// binds: architecture.persistence-port#json-adapter-conformance

const tempDirs: string[] = [];

function makeStorePath(): string {
  const dir = mkdtempSync(join(tmpdir(), "habit-tracker-adapter-"));
  tempDirs.push(dir);
  return join(dir, "habits.json");
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("architecture.persistence-port: JSON-file adapter satisfies the Store contract", () => {
  test("add then list round-trips through the Store contract", async () => {
    const store = new JsonFileStore(makeStorePath());

    await store.add("Read");
    await store.add("Stretch");

    expect(await store.list()).toEqual(["Read", "Stretch"]);
  });

  test("list returns an empty array before any habit is added, including when the file does not yet exist", async () => {
    const store = new JsonFileStore(makeStorePath());

    expect(await store.list()).toEqual([]);
  });
});
