import {
  addHabit,
  DuplicateHabitError,
  listHabits,
  ValidationError,
} from "./domain/habits";
import { JsonFileStore } from "./adapters/json-file-store";
import { resolveHabitDataPath } from "./adapters/storage-path";

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const dataPath = resolveHabitDataPath();
  const store = new JsonFileStore(dataPath);

  if (command === "add") {
    const name = rest.join(" ");
    try {
      await addHabit(store, name);
      return 0;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof DuplicateHabitError) {
        console.error(`Error: ${err.message}`);
        return 1;
      }
      throw err;
    }
  }

  if (command === "list") {
    const habits = await listHabits(store);
    for (const habit of habits) {
      console.log(habit);
    }
    return 0;
  }

  console.error("Usage: habit-tracker <add <name> | list>");
  return 1;
}

const exitCode = await main(process.argv.slice(2));
process.exit(exitCode);
