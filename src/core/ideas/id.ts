/**
 * Idea id generation (`<slug>-<short-uuid>`).
 *
 * The id is the stable identity of an idea AND of the change it graduates
 * into. It is stored in `.openspec.yaml` and must never depend on the
 * directory name, because the directory is renamed across the idea→change
 * move (`ideas/<id>/` → `changes/<id>/`) and across the archive move
 * (`changes/<id>/` → `changes/archive/<date>-<id>/`).
 */

import { randomUUID } from 'node:crypto';

/** Length of the unique suffix (8 hex chars). */
export const SHORT_UUID_LENGTH = 8;

/**
 * Slugify a freeform title into a kebab-case slug suitable as an idea id
 * prefix. Lower-cases, replaces non-alphanumeric runs with hyphens, and
 * trims leading/trailing hyphens. Falls back to 'idea' for an empty or
 * all-punctuation result.
 */
export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'idea';
}

/**
 * Generate a unique idea id: `<slug>-<short-uuid>`.
 */
export function generateIdeaId(title: string): string {
  const slug = slugifyTitle(title);
  const shortUuid = randomUUID().replace(/-/g, '').slice(0, SHORT_UUID_LENGTH);
  return `${slug}-${shortUuid}`;
}

/**
 * The id of an object moved into the archive: the archive directory name
 * with a leading `YYYY-MM-DD-` prefix stripped. This is the best-effort
 * backfill rule for legacy archived changes that predate the `id` field.
 * Returns the input unchanged when no date prefix is present.
 */
export function idFromArchiveDirName(dirName: string): string {
  return dirName.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}