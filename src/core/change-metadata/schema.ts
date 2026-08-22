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

/** @deprecated Read-only compatibility shape for legacy `draftPullRequest` metadata. */
export const DraftPullRequestSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().url(),
  repository: z.string().min(1),
  base: z.string().min(1),
  head: z.string().min(1),
  headSha: z.string().regex(/^[0-9a-f]{40}$/),
  runId: z.string().min(1),
}).strict();

/** @deprecated Use PullRequestObservation. */
export type DraftPullRequest = z.infer<typeof DraftPullRequestSchema>;

/** Canonical, versioned observation supplied by an external pull-request adapter. */
export const PullRequestObservationSchema = DraftPullRequestSchema.extend({
  state: z.enum(['draft', 'ready']),
}).strict();

export type PullRequestObservation = z.infer<typeof PullRequestObservationSchema>;

const ChangeMetadataInputSchema = z.object({
  schema: z.string().min(1, { message: 'schema is required' }),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'created must be YYYY-MM-DD format',
  }).optional(),
  // Stable immutable id surviving the archive date-prefix move. Absent on
  // legacy changes predating the id field; present on every new change and
  // every moved idea. Immutable across moves.
  id: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  affected_areas: z.array(z.string().min(1)).optional(),
  initiative: InitiativeLinkSchema.optional(),
  /** Audit footprint written by the review panel; it never derives Reviewing. */
  lastReviewedAt: z.string().datetime({ offset: true }).optional(),
  /** Canonical pull-request observation. This is the only shape written. */
  pullRequest: PullRequestObservationSchema.optional(),
  /** @deprecated Read-only source compatibility for historical metadata. */
  draftPullRequest: DraftPullRequestSchema.optional(),
  /** Originating idea id (`<slug>-<short-uuid>`) when a change grew from an idea. */
  ideaId: z.string().min(1).optional(),
}).superRefine((metadata, ctx) => {
  if (metadata.pullRequest && metadata.draftPullRequest) {
    ctx.addIssue({
      code: 'custom',
      message: 'metadata must not contain both pullRequest and deprecated draftPullRequest',
      path: ['pullRequest'],
    });
  }
}).transform(({ draftPullRequest, ...metadata }) => ({
  ...metadata,
  ...(metadata.pullRequest
    ? {}
    : draftPullRequest
      ? { pullRequest: { ...draftPullRequest, state: 'draft' as const } }
      : {}),
}));

// Per-change metadata schema. Legacy `draftPullRequest` input normalizes to
// canonical `pullRequest` on read and is deliberately omitted from all writes.
export const ChangeMetadataSchema = ChangeMetadataInputSchema;
export type ChangeMetadata = z.output<typeof ChangeMetadataSchema>;
