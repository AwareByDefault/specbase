import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Store } from "../domain/ports/store";

/**
 * The only code path in the application that reads or writes the habit data
 * file (architecture.persistence-port: json-adapter-sole-access). Stores
 * habits as a JSON array of names, in insertion order, via whole-file
 * overwrite (not append/partial-write) to reduce the chance of a corrupt
 * partial write. Concurrent-write safety is explicitly deferred - see
 * design.md.
 */
export class JsonFileStore implements Store {
  constructor(private readonly filePath: string) {}

  async add(name: string): Promise<void> {
    const habits = await this.readAll();
    habits.push(name);
    await this.writeAll(habits);
  }

  async list(): Promise<string[]> {
    return this.readAll();
  }

  private async readAll(): Promise<string[]> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (err) {
      if (isNotFoundError(err)) {
        return [];
      }
      throw err;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string");
  }

  private async writeAll(habits: string[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(habits, null, 2), "utf8");
  }
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "ENOENT"
  );
}
