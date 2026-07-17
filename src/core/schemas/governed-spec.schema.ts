import { z } from 'zod';
import { SPEC_PLANES } from '../artifact-graph/types.js';
import {
  SPEC_ID_REGEX,
  SPEC_ID_DESCRIPTION,
  KEBAB_ID_REGEX,
  KEBAB_ID_DESCRIPTION,
} from '../id.js';

/**
 * Runtime schemas for the governed spec model (design decisions 1-4). These
 * validate governed document *content*; the filesystem discovery records that
 * carry native paths live alongside the governed repository modules.
 *
 * The legacy flat model keeps its own schemas (spec.schema.ts / base.schema.ts)
 * untouched — nothing here feeds the legacy parser.
 */

/** A project-unique stable spec ID, e.g. `architecture.domain`. */
export const SpecIdSchema = z
  .string()
  .regex(SPEC_ID_REGEX, { error: `Spec ID ${SPEC_ID_DESCRIPTION}` });

/** A pair-local stable slug for a requirement, scenario, or binding. */
export const LocalSlugSchema = z
  .string()
  .regex(KEBAB_ID_REGEX, { error: `ID ${KEBAB_ID_DESCRIPTION}` });

/** The plane a governed pair lives under. */
export const SpecPlaneSchema = z.enum(SPEC_PLANES);

/**
 * Minimal governed spec frontmatter. Type comes from the containing plane, so
 * `id` is the only required field (design decision 3).
 */
export const GovernedSpecFrontmatterSchema = z.object({
  id: SpecIdSchema,
});

/** A scenario with its stable local ID. Title is mutable presentation. */
export const GovernedScenarioSchema = z.object({
  id: LocalSlugSchema,
  title: z.string().min(1),
});

/** A requirement with its stable local ID and scenarios. */
export const GovernedRequirementSchema = z.object({
  id: LocalSlugSchema,
  title: z.string().min(1),
  scenarios: z.array(GovernedScenarioSchema),
});

/** The parsed, normalized content of one governed `spec.md`. */
export const GovernedSpecRecordSchema = z.object({
  id: SpecIdSchema,
  requirements: z.array(GovernedRequirementSchema),
});

// ---------------------------------------------------------------------------
// Enforcement — minimal/stubbed here. The drift engine (a later unit) owns the
// full binding/coverage validation; version 1's field vocabulary is captured so
// the pair record shape is stable, but nothing here computes drift states.
// ---------------------------------------------------------------------------

export const BindingMechanismSchema = z.enum([
  'test',
  'lint',
  'static-analysis',
  'command',
  'review',
  'manual',
]);

export const BindingStrengthSchema = z.enum([
  'automated',
  'review',
  'manual',
  'unenforced',
]);

export const BindingStatusSchema = z.enum(['planned', 'active']);

/** Executable declaration for automated bindings (parsed, never run by core). */
export const BindingRunSchema = z.object({
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  cwd: z.string().default('.'),
});

/** One enforcement binding. Loosely modeled here; later units tighten it. */
export const BindingSchema = z.object({
  id: LocalSlugSchema,
  covers: z.array(LocalSlugSchema).default([]),
  mechanism: BindingMechanismSchema,
  strength: BindingStrengthSchema,
  status: BindingStatusSchema,
  targets: z.array(z.string()).default([]),
  run: BindingRunSchema.optional(),
  review: z.unknown().optional(),
  procedure: z.string().optional(),
  rationale: z.string().optional(),
  limitations: z.string().optional(),
});

/** The authoritative fenced YAML document inside an `enforcement.md`. */
export const EnforcementDocumentSchema = z.object({
  version: z.number().int().positive(),
  spec: SpecIdSchema,
  bindings: z.array(BindingSchema).default([]),
});

/** How complete a discovered governed pair is on disk. */
export const PairCompletenessSchema = z.enum([
  'complete',
  'spec-only',
  'enforcement-only',
]);

/**
 * The normalized governed pair record shared CLI consumers receive. Locators
 * are OS-independent slash-separated strings; the `*Path` fields are native
 * paths for filesystem access.
 */
export const GovernedPairRecordSchema = z.object({
  plane: SpecPlaneSchema,
  // Plane-qualified, slash-separated, e.g. `architecture/platforms/desktop`.
  locator: z.string().min(1),
  // Native absolute directory that holds the pair.
  dir: z.string().min(1),
  // Native absolute paths, or null when that half of the pair is absent.
  specPath: z.string().nullable(),
  enforcementPath: z.string().nullable(),
  completeness: PairCompletenessSchema,
});

export type SpecId = z.infer<typeof SpecIdSchema>;
export type GovernedSpecFrontmatter = z.infer<typeof GovernedSpecFrontmatterSchema>;
export type GovernedScenario = z.infer<typeof GovernedScenarioSchema>;
export type GovernedRequirement = z.infer<typeof GovernedRequirementSchema>;
export type GovernedSpecRecord = z.infer<typeof GovernedSpecRecordSchema>;
export type BindingMechanism = z.infer<typeof BindingMechanismSchema>;
export type BindingStrength = z.infer<typeof BindingStrengthSchema>;
export type BindingStatus = z.infer<typeof BindingStatusSchema>;
export type Binding = z.infer<typeof BindingSchema>;
export type EnforcementDocument = z.infer<typeof EnforcementDocumentSchema>;
export type PairCompleteness = z.infer<typeof PairCompletenessSchema>;
export type GovernedPairRecord = z.infer<typeof GovernedPairRecordSchema>;
