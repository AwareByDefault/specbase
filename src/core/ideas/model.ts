/**
 * The idea record model.
 *
 * An idea is stored as `.openspec.yaml` at the root of its scratchpad
 * directory (`<planningDir>/ideas/<id>/.openspec.yaml`) with exactly three
 * fields. `notes.md` is the conventional prose entry point; any other files
 * in the directory are supporting material (images, refs, scratch files).
 */

/** A derived age string: human-rendered days since `created`. */
export interface Idea {
  /** Stable, immutable id (`<slug>-<short-uuid>`), also the directory name. */
  id: string;
  /** One-line card text; also written to the directory name slug. */
  summary: string;
  /** ISO date (`YYYY-MM-DD`) the idea was created. */
  created: string;
  /** Absolute path to the idea's scratchpad directory. */
  dir: string;
  /** Relative file names in the scratchpad directory (excluding `.openspec.yaml`). */
  members: string[];
}

export interface IdeaMetadata {
  id: string;
  summary: string;
  created: string;
}

/**
 * Derive the current age of an idea from its `created` date. Age is always
 * derived, never stored.
 */
export function deriveAge(created: string, now: Date = new Date()): { days: number } {
  const createdDate = new Date(`${created}T00:00:00Z`);
  const nowMs = now.getTime();
  const createdMs = createdDate.getTime();
  if (Number.isNaN(createdMs)) {
    return { days: 0 };
  }
  const days = Math.max(0, Math.floor((nowMs - createdMs) / 86_400_000));
  return { days };
}

/** Human label for a derived age: "today" or "Nd ago". */
export function ageLabel(days: number): string {
  if (days <= 0) return 'today';
  return days === 1 ? '1d ago' : `${days}d ago`;
}