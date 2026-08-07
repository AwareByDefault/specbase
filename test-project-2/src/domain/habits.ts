import type { Store } from "./ports/store";

const MAX_NAME_LENGTH = 100;

export class ValidationError extends Error {}
export class DuplicateHabitError extends Error {}

/**
 * Trims surrounding whitespace. This is the single normalization step applied
 * before validation and storage, so "stored name" and "validated name" always
 * agree.
 */
export function normalizeHabitName(rawName: string): string {
  return rawName.trim();
}

function assertValidHabitName(name: string): void {
  if (name.length === 0) {
    throw new ValidationError("Habit name must not be empty.");
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new ValidationError(
      `Habit name must be at most ${MAX_NAME_LENGTH} characters (got ${name.length}).`,
    );
  }
}

/**
 * Adds a habit by name. Validates and normalizes the name, rejects an exact
 * duplicate of an existing habit, and otherwise persists it via the injected
 * Store port. Name is the stable key for now (see design.md) - no separate id
 * is minted.
 */
export async function addHabit(store: Store, rawName: string): Promise<void> {
  const name = normalizeHabitName(rawName);
  assertValidHabitName(name);

  const existing = await store.list();
  if (existing.includes(name)) {
    throw new DuplicateHabitError(`A habit named "${name}" already exists.`);
  }

  await store.add(name);
}

/** Lists habits in the order they were added. */
export async function listHabits(store: Store): Promise<string[]> {
  return store.list();
}
