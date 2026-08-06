import { z } from 'zod';

// Artifact definition schema
export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: 'Artifact ID is required' }),
  generates: z.string().min(1, { error: 'generates field is required' }),
  description: z.string(),
  template: z.string().min(1, { error: 'template field is required' }),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});

// Apply phase configuration for schema-aware apply instructions
export const ApplyPhaseSchema = z.object({
  // Artifact IDs that must exist before apply is available
  requires: z.array(z.string()).min(1, { error: 'At least one required artifact' }),
  // Path to file with checkboxes for progress (relative to change dir), or null if no tracking
  tracks: z.string().nullable().optional(),
  // Custom guidance for the apply phase
  instruction: z.string().optional(),
});

// A declared governed plane. Planes are schema-declared data (not a closed
// enum) so a project may add, remove, or replace planes without a code change.
// `id` is a kebab-case plane name used as the first locator segment and the
// spec-ID prefix. `purpose` is the human-readable meaning the classifier and
// prompts read. `enforcementFlavor` hints suited binding mechanisms. An
// optional `reviewLens` names the lens that judges this plane's specs. A
// `crossCutting` plane has no storage home and participates as a lens only.
//
// `defaultSelected` drives the `openspec init` plane picker: a schema declares
// ONE offer-able plane list, and each record's `defaultSelected` sets its
// initial checkbox state. Planes with `defaultSelected: true` also form the
// resolved default set for a project that declares no plane override, so
// existing governed projects keep their historical plane roster. It defaults to
// `true` so a record that omits it stays resolved-by-default.
const PLANE_ID_RE = /^[a-z][a-z0-9-]*$/;
const RESERVED_PLANE_IDS = new Set(['spec', 'specs', 'enforcement']);

export const PlaneSchema = z.object({
  id: z
    .string()
    .min(1, { error: 'Plane id is required' })
    .regex(PLANE_ID_RE, { error: 'Plane id must be kebab-case' })
    .refine((id) => !RESERVED_PLANE_IDS.has(id), { error: 'Plane id is reserved' }),
  purpose: z.string().min(1, { error: 'Plane purpose is required' }),
  enforcementFlavor: z.string().min(1, { error: 'Plane enforcementFlavor is required' }),
  reviewLens: z.string().optional(),
  crossCutting: z.boolean().default(false),
  defaultSelected: z.boolean().default(true),
});

export type Plane = z.infer<typeof PlaneSchema>;

// Back-compat: the historical two default planes. New default planes (`ops`,
// `code-quality`) are added via the schema's `specModel.planes` declaration.
// Callers should consume the resolved plane set (`SpecModel.planes`) rather
// than this constant, which remains for migration convenience only.
export const DEFAULT_SPEC_PLANES = ['behavior', 'architecture'] as const;

// Explicit, versioned declaration of the spec model a schema selects. Core
// dispatches on this resolved value — never on the schema's name — so a legacy
// schema and a governed schema are told apart only by what they declare.
export const SpecModelSchema = z.object({
  kind: z.enum(['governed', 'legacy']),
  version: z.number().int().positive({ error: 'Spec model version must be a positive integer' }),
  // Planes only carry meaning for the governed model; legacy declares none.
  // An open array of plane records — not a closed enum — so projects can extend.
  //
  // This is the single OFFER-ABLE plane list: every plane a project may select
  // at init, each carrying `defaultSelected`. It replaces the former split
  // between resolved-default `planes` and offered `optionalPlanes`. The RESOLVED
  // set a project actually uses is computed downstream (mergeProjectPlanes):
  // with no config override it is the `defaultSelected: true` subset; a config
  // `planes:`/`planes+:` override replaces or appends onto it.
  planes: z.array(PlaneSchema).default([]),
  pairedEnforcement: z.boolean().default(false),
});

// Full schema YAML structure
export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: 'Schema name is required' }),
  version: z.number().int().positive({ error: 'Version must be a positive integer' }),
  description: z.string().optional(),
  artifacts: z.array(ArtifactSchema).min(1, { error: 'At least one artifact required' }),
  // Optional apply phase configuration (for schema-aware apply instructions)
  apply: ApplyPhaseSchema.optional(),
  // Optional explicit spec-model declaration. Absent means the legacy flat
  // spec model (see resolveSpecModel), so existing schemas keep their behavior.
  specModel: SpecModelSchema.optional(),
});

// Derived TypeScript types
export type Artifact = z.infer<typeof ArtifactSchema>;
export type ApplyPhase = z.infer<typeof ApplyPhaseSchema>;
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;
// A plane id is a free-form kebab string declared by the schema/config, not a
// closed union. Kept as `string` so arbitrary user-declared planes type-check.
export type SpecPlane = string;
export type SpecModel = z.infer<typeof SpecModelSchema>;

// The model every schema resolves to when it declares no `specModel`. Legacy
// projects therefore keep the flat parser/discovery/archive path unchanged.
// Frozen (deeply) because it is a shared singleton returned by
// resolveSpecModel — a caller mutating it would corrupt the default for every
// legacy schema.
export const LEGACY_SPEC_MODEL: SpecModel = Object.freeze({
  kind: 'legacy',
  version: 1,
  planes: Object.freeze([] as Plane[]) as Plane[],
  pairedEnforcement: false,
});

/**
 * Resolve the spec model a schema declares, defaulting to the legacy flat
 * model when `specModel` is absent. Core should call this and dispatch on
 * `kind` rather than inspecting the schema name.
 */
export function resolveSpecModel(schema: SchemaYaml): SpecModel {
  return schema.specModel ?? LEGACY_SPEC_MODEL;
}

// Runtime state types (not Zod - internal only)

// Slice 1: Simple completion tracking via filesystem
export type CompletedSet = Set<string>;

// Return type for blocked query
export interface BlockedArtifacts {
  [artifactId: string]: string[];
}
