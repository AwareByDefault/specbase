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

// The two governed truth planes. Kept here (rather than in the governed
// modules) because resolved schema metadata references them and core must not
// branch on schema names to learn the model.
export const SPEC_PLANES = ['behavior', 'architecture'] as const;

// Explicit, versioned declaration of the spec model a schema selects. Core
// dispatches on this resolved value — never on the schema's name — so a legacy
// schema and a governed schema are told apart only by what they declare.
export const SpecModelSchema = z.object({
  kind: z.enum(['governed', 'legacy']),
  version: z.number().int().positive({ error: 'Spec model version must be a positive integer' }),
  // Planes only carry meaning for the governed model; legacy declares none.
  planes: z.array(z.enum(SPEC_PLANES)).default([]),
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
export type SpecPlane = (typeof SPEC_PLANES)[number];
export type SpecModel = z.infer<typeof SpecModelSchema>;

// The model every schema resolves to when it declares no `specModel`. Legacy
// projects therefore keep the flat parser/discovery/archive path unchanged.
// Frozen (deeply) because it is a shared singleton returned by
// resolveSpecModel — a caller mutating it would corrupt the default for every
// legacy schema.
export const LEGACY_SPEC_MODEL: SpecModel = Object.freeze({
  kind: 'legacy',
  version: 1,
  planes: Object.freeze([] as SpecPlane[]) as SpecPlane[],
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
