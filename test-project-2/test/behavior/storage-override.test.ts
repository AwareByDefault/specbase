import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../helpers/spawn-cli";
import { resolveHabitDataPath } from "../../src/adapters/storage-path";

// binds: behavior.habits-manage#storage-override-tests

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("behavior.habits-manage: storage-override", () => {
  test("HABIT_TRACKER_DATA overrides the default path for a real CLI process", async () => {
    const dataDir = makeTempDir("habit-tracker-override-");
    const dataFile = join(dataDir, "custom-habits.json");

    const addResult = await runCli(["add", "Journal"], { HABIT_TRACKER_DATA: dataFile });
    expect(addResult.exitCode).toBe(0);

    // The override path itself now holds the data (proving it was used, not
    // just that `list` happens to agree).
    const stored = JSON.parse(readFileSync(dataFile, "utf8"));
    expect(stored).toEqual(["Journal"]);

    const listResult = await runCli(["list"], { HABIT_TRACKER_DATA: dataFile });
    expect(listResult.stdout.trim().split("\n")).toEqual(["Journal"]);
  });

  test("an unset HABIT_TRACKER_DATA resolves to the default per-user path", () => {
    // A pure unit check of the resolution logic - deliberately not spawning a
    // process here, since that would read/write the real developer machine's
    // home directory (~/.habit-tracker/habits.json) as a side effect.
    const path = resolveHabitDataPath({} as NodeJS.ProcessEnv);

    expect(path).toBe(join(homedir(), ".habit-tracker", "habits.json"));
  });
});
