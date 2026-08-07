import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../helpers/spawn-cli";

// binds: behavior.habits-manage#cross-run-persistence-tests
//
// These tests spawn `src/main.ts` as a real, separate OS process per CLI
// invocation (see helpers/spawn-cli.ts) - not two in-process instances of the
// same object graph - so they prove the actual headline promise: a habit
// added in one invocation is visible in a later, genuinely separate one.

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

describe("behavior.habits-manage: cross-run-persistence", () => {
  test("a habit added in one CLI process appears in a later, separate CLI process", async () => {
    const dataDir = makeTempDir("habit-tracker-data-");
    const dataFile = join(dataDir, "habits.json");

    const addResult = await runCli(["add", "Read"], { HABIT_TRACKER_DATA: dataFile });
    expect(addResult.exitCode).toBe(0);

    const listResult = await runCli(["list"], { HABIT_TRACKER_DATA: dataFile });
    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout.trim().split("\n")).toEqual(["Read"]);
  });

  test("persistence does not depend on the working directory the later invocation runs from", async () => {
    // No HABIT_TRACKER_DATA override here on purpose - this exercises the
    // *default* per-user storage location, redirected to a fake home via
    // HOME so the test never touches the real developer machine's home dir.
    const fakeHome = makeTempDir("habit-tracker-home-");
    const otherCwd = makeTempDir("habit-tracker-cwd-");

    const addResult = await runCli(
      ["add", "Meditate"],
      { HOME: fakeHome, HABIT_TRACKER_DATA: undefined },
      fakeHome,
    );
    expect(addResult.exitCode).toBe(0);

    const listResult = await runCli(
      ["list"],
      { HOME: fakeHome, HABIT_TRACKER_DATA: undefined },
      otherCwd,
    );
    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout.trim().split("\n")).toEqual(["Meditate"]);

    // And confirm it actually landed at the documented default location,
    // not somewhere cwd-relative.
    const expectedPath = join(fakeHome, ".habit-tracker", "habits.json");
    const stored = JSON.parse(readFileSync(expectedPath, "utf8"));
    expect(stored).toEqual(["Meditate"]);
  });
});
