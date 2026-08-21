import { z } from 'zod';
import { isKebabId } from '../id.js';

export { isKebabId } from '../id.js';

const KebabIdentifierSchema = (label: string): z.ZodString =>
  z.string().superRefine((value, ctx) => {
    if (!isKebabId(value)) {
      ctx.addIssue({
        code: 'custom',
        message: `${label} must be kebab-case with lowercase letters, numbers, and single hyphen separators`,
      });
    }
  });

export const InitiativeLinkSchema = z.object({
  store: KebabIdentifierSchema('Store id'),
  id: KebabIdentifierSchema('Initiative id'),
}).strict();

export type InitiativeLink = z.infer<typeof InitiativeLinkSchema>;

export const DraftPullRequestSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().url(),
  repository: z.string().min(1),
  base: z.string().min(1),
  head: z.string().min(1),
  headSha: z.string().regex(/^[0-9a-f]{40}$/),
  runId: z.string().min(1),
}).strict();

export type DraftPullRequest = z.infer<typeof DraftPullRequestSchema>;

// Per-change metadata schema. The schema field is validated against available
// workflow schemas when metadata is read or written.
export const ChangeMetadataSchema = z.object({
  schema: z.string().min(1, { message: 'schema is required' }),
  created: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'created must be YYYY-MM-DD format',
    })
    .optional(),
  // Stable immutable id surviving the archive date-prefix move. Absent on
  // legacy changes predating the id field; present on every new change and
  // every moved idea. Immutable across moves.
  id: z
    .string()
    .min(1)
    .optional(),
  goal: z.string().min(1).optional(),
  affected_areas: z.array(z.string().min(1)).optional(),
  initiative: InitiativeLinkSchema.optional(),
  /// Review-completion footprint written by the review panel run (ISO timestamp).
  /// Presence derives the `reviewing` lifecycle state; absent means not yet reviewed.
  /// It records that the panel RAN, never that it approved (the panel never gates).
  lastReviewedAt: z.string().datetime({ offset: true }).optional(),
  /// Confirmed draft pull request recorded through the canonical direct-action
  /// result boundary. The URL is presentation data; lifecycle remains derived.
  draftPullRequest: DraftPullRequestSchema.optional(),
  /// Originating idea id (`<slug>-<short-uuid>`) when a change grew from an idea.
  /// Used by archive to carry the idea's preserved thinking into the archived change.
  ideaId: z
    .string()
    .min(1)
    .optional(),
});

export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>;
