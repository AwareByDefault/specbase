import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { addHabit, listHabits } from "../../src/domain/habits";
import { JsonFileStore } from "../../src/adapters/json-file-store";

// binds: behavior.habits-manage#list-habits-tests

const tempDirs: string[] = [];

function makeStore(): JsonFileStore {
  const dir = mkdtempSync(join(tmpdir(), "habit-tracker-"));
  tempDirs.push(dir);
  return new JsonFileStore(join(dir, "habits.json"));
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("behavior.habits-manage: list-habits", () => {
  test("lists habits in the order they were added", async () => {
    const store = makeStore();

    await addHabit(store, "Read");
    await addHabit(store, "Stretch");
    await addHabit(store, "Meditate");

    expect(await listHabits(store)).toEqual(["Read", "Stretch", "Meditate"]);
  });

  test("produces no habit lines and no error before any habit is added", async () => {
    const store = makeStore();

    await expect(listHabits(store)).resolves.toEqual([]);
  });
});
