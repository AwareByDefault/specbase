import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  addHabit,
  DuplicateHabitError,
  listHabits,
  ValidationError,
} from "../../src/domain/habits";
import { JsonFileStore } from "../../src/adapters/json-file-store";

// binds: behavior.habits-manage#add-habit-tests

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

describe("behavior.habits-manage: add-habit", () => {
  test("adds a new habit with a valid, previously-unused name", async () => {
    const store = makeStore();

    await addHabit(store, "Read");

    expect(await listHabits(store)).toEqual(["Read"]);
  });

  test("rejects a duplicate name and does not create a second habit", async () => {
    const store = makeStore();
    await addHabit(store, "Read");

    await expect(addHabit(store, "Read")).rejects.toBeInstanceOf(DuplicateHabitError);
    expect(await listHabits(store)).toEqual(["Read"]);
  });

  test("rejects an empty or whitespace-only name", async () => {
    const store = makeStore();

    await expect(addHabit(store, "   ")).rejects.toBeInstanceOf(ValidationError);
    expect(await listHabits(store)).toEqual([]);
  });

  test("rejects a name longer than 100 characters", async () => {
    const store = makeStore();
    const overlongName = "a".repeat(101);

    await expect(addHabit(store, overlongName)).rejects.toBeInstanceOf(ValidationError);
    expect(await listHabits(store)).toEqual([]);
  });

  test("trims leading and trailing whitespace before storing", async () => {
    const store = makeStore();

    await addHabit(store, "  Read  ");

    expect(await listHabits(store)).toEqual(["Read"]);
  });
});
