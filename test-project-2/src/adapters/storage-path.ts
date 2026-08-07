import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Resolves where habit data is read from and written to:
 * - HABIT_TRACKER_DATA, when set and non-empty, is used verbatim as the file path.
 * - Otherwise, defaults to a per-user path under the home directory, so
 *   persistence does not depend on the working directory the CLI is run from.
 *
 * Home resolution prefers env.HOME/env.USERPROFILE (the standard POSIX/Windows
 * variables) before falling back to os.homedir(), which keeps this
 * deterministic and testable via env injection without touching the real
 * filesystem.
 */
export function resolveHabitDataPath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const override = env.HABIT_TRACKER_DATA;
  if (override && override.trim().length > 0) {
    return override;
  }

  const home = env.HOME || env.USERPROFILE || homedir();
  if (!home) {
    throw new Error(
      "Unable to resolve a home directory for the default habit storage location. " +
        "Set HABIT_TRACKER_DATA to a file path instead.",
    );
  }

  return join(home, ".habit-tracker", "habits.json");
}
