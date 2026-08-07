import { join } from "node:path";

const projectRoot = join(import.meta.dir, "..", "..");
const mainPath = join(projectRoot, "src", "main.ts");

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Runs `src/main.ts` as a real, separate OS process via Bun.spawn (not an
 * in-process function call), so tests that use this prove behavior across
 * genuinely independent CLI invocations - not just within one test process.
 *
 * `envOverrides` is merged onto the current process env; a value of
 * `undefined` deletes that key from the child's environment (useful for
 * guaranteeing HABIT_TRACKER_DATA is absent in a given run).
 */
export async function runCli(
  args: string[],
  envOverrides: Record<string, string | undefined>,
  cwd: string = projectRoot,
): Promise<CliResult> {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  for (const [key, value] of Object.entries(envOverrides)) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  const proc = Bun.spawn({
    cmd: ["bun", mainPath, ...args],
    cwd,
    env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { exitCode, stdout, stderr };
}
