/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill and command files.
 */

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getUpdateChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOnboardSkillTemplate,
  getSpcbProposeSkillTemplate,
  getReviewPanelSkillTemplate,
  getSteWritingSkillTemplate,
  getExploreEnforceSkillTemplate,
  getProposeEnforceSkillTemplate,
  getReviewPanelCommandTemplate,
  getSpcbExploreCommandTemplate,
  getSpcbNewCommandTemplate,
  getSpcbContinueCommandTemplate,
  getSpcbApplyCommandTemplate,
  getSpcbUpdateCommandTemplate,
  getSpcbFfCommandTemplate,
  getSpcbSyncCommandTemplate,
  getSpcbArchiveCommandTemplate,
  getSpcbBulkArchiveCommandTemplate,
  getSpcbVerifyCommandTemplate,
  getSpcbOnboardCommandTemplate,
  getSpcbProposeCommandTemplate,
  getExploreEnforceCommandTemplate,
  getProposeEnforceCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';
import type { SpecModel } from '../artifact-graph/types.js';
import { EnforcementTypeSchema, LEGACY_SPEC_MODEL, resolveSpecModel } from '../artifact-graph/types.js';
import { resolveSchema } from '../artifact-graph/resolver.js';
import { readProjectConfig } from '../project-config.js';
import { SPECBASE_CLI_ALLOWED_TOOLS } from './allowed-tools.js';
import { isGovernedModel } from '../templates/workflows/governed-guidance.js';

/** The project default schema when config declares none. */
const DEFAULT_SCHEMA_NAME = 'spec-driven';

/**
 * Resolve the spec model a project's DEFAULT schema selects, so skill/command
 * generation can gate governed guidance on the declared model rather than a
 * schema name. Any failure (missing config, unknown/invalid schema) falls back
 * to the legacy model, keeping generation resilient and legacy output unchanged.
 *
 * Plane overrides declared in the project config (`specModel.planes+` to append
 * or `specModel.planes:` to replace) are merged into the resolved model so the
 * returned `specModel.planes` is the single source of truth for the plane set.
 */
export function resolveProjectSpecModel(projectRoot: string): SpecModel {
  try {
    const config = readProjectConfig(projectRoot);
    const schemaName = config?.schema ?? DEFAULT_SCHEMA_NAME;
    const schema = resolveSchema(schemaName, projectRoot);
    const model = resolveSpecModel(schema);
    return mergeProjectSpecModel(model, config);
  } catch {
    return LEGACY_SPEC_MODEL;
  }
}

/**
 * Resolve the project's plane set from the schema's single OFFER-ABLE plane list
 * (`model.planes`, every offer-able plane, each carrying `defaultSelected`) plus
 * any project-level override, then derive `kind` from the result.
 *
 * Resolution:
 * - No override → the `defaultSelected: true` subset (the resolved default set),
 *   so an existing governed project keeps its historical plane roster.
 * - `planes+` (append) → the default subset plus the appended records.
 * - `planes:` (replace) → exactly the declared records.
 *
 * Governance is emergent: if the resolved set is empty the model resolves to
 * `legacy` (flat); otherwise `governed`. Declared overrides are validated for
 * kebab ids and non-collision; an invalid override is ignored with the default
 * subset retained so a malformed config never silently empties the plane set.
 */
export function mergeProjectSpecModel(
  model: SpecModel,
  config: ReturnType<typeof readProjectConfig>
): SpecModel {
  const withPlanes = mergeProjectPlanes(model, config);
  return mergeProjectEnforcementTypes(withPlanes, config);
}

export function mergeProjectPlanes(
  model: SpecModel,
  config: ReturnType<typeof readProjectConfig>
): SpecModel {
  if (model.kind !== 'governed') return model;
  // `defaultSelected` defaults to true (PlaneSchema), so a plane resolves into
  // the default set unless it explicitly opts out with `defaultSelected: false`.
  const defaults = model.planes.filter((p) => p.defaultSelected !== false);
  const withPlanes = (planes: SpecModel['planes']): SpecModel => ({
    ...model,
    kind: planes.length > 0 ? 'governed' : 'legacy',
    planes,
  });
  const override = (config as Record<string, unknown> | null)?.specModel as
    | Record<string, unknown>
    | undefined;
  if (!override) return withPlanes(defaults);
  const replace = override.planes;
  const append = (override.planesAppend ?? override['planes+']) as unknown;
  if (replace !== undefined && append !== undefined) {
    return withPlanes(defaults); // ambiguous: ignore overrides, keep defaults
  }
  if (replace !== undefined) {
    const planes = normalizePlanes(replace);
    return planes ? withPlanes(planes) : withPlanes(defaults);
  }
  if (append !== undefined) {
    const extra = normalizePlanes(append);
    if (!extra) return withPlanes(defaults);
    const byId = new Map(defaults.map((p) => [p.id, p]));
    for (const plane of extra) byId.set(plane.id, plane); // last wins, but dups across append are validated below
    return withPlanes(Array.from(byId.values()));
  }
  return withPlanes(defaults);
}

export function mergeProjectEnforcementTypes(
  model: SpecModel,
  config: ReturnType<typeof readProjectConfig>
): SpecModel {
  if (model.kind !== 'governed') return model;
  const defaults = model.enforcement?.types ?? [];
  const override = (config as Record<string, unknown> | null)?.specModel as
    | Record<string, unknown>
    | undefined;
  const enforcement = override?.enforcement as Record<string, unknown> | undefined;
  if (!enforcement) return model;
  const replace = enforcement.types;
  const append = enforcement.typesAppend ?? enforcement['types+'];
  const fallback = (reason: string): SpecModel => {
    console.warn(`Invalid specModel.enforcement type declaration (${reason}); using schema defaults.`);
    return model;
  };
  if (replace !== undefined && append !== undefined) {
    return fallback('types and types+ cannot be declared together');
  }
  if (replace !== undefined) {
    const types = normalizeEnforcementTypes(replace);
    return types ? { ...model, enforcement: { types } } : fallback('types must be a unique list of valid type records');
  }
  if (append !== undefined) {
    const extra = normalizeEnforcementTypes(append);
    if (!extra) return fallback('types+ must be a unique list of valid type records');
    const ids = new Set(defaults.map((type) => type.id));
    if (extra.some((type) => ids.has(type.id))) {
      return fallback('types+ cannot duplicate a schema type id');
    }
    return { ...model, enforcement: { types: [...defaults, ...extra] } };
  }
  return model;
}

function normalizeEnforcementTypes(value: unknown): SpecModel['enforcement']['types'] | undefined {
  if (!Array.isArray(value)) return undefined;
  const parsed = value.map((entry) => {
    const result = EnforcementTypeSchema.safeParse(entry);
    return result.success ? result.data : null;
  });
  if (parsed.some((entry) => entry === null)) return undefined;
  const types = parsed.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  if (new Set(types.map((type) => type.id)).size !== types.length) return undefined;
  return types;
}

const PLANE_ID_RE = /^[a-z][a-z0-9-]*$/;
const RESERVED_PLANE_IDS = new Set(['spec', 'specs', 'enforcement']);

function normalizePlanes(
  value: unknown
): SpecModel['planes'] | undefined {
  if (!Array.isArray(value)) return undefined;
  const planes: SpecModel['planes'] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return undefined;
    const id = (entry as { id?: unknown }).id;
    const purpose = (entry as { purpose?: unknown }).purpose;
    const enforcementFlavor = (entry as { enforcementFlavor?: unknown }).enforcementFlavor;
    if (typeof id !== 'string' || !PLANE_ID_RE.test(id) || RESERVED_PLANE_IDS.has(id)) {
      return undefined;
    }
    if (typeof purpose !== 'string' || purpose.length === 0) return undefined;
    if (typeof enforcementFlavor !== 'string' || enforcementFlavor.length === 0) {
      return undefined;
    }
    if (seen.has(id)) return undefined;
    seen.add(id);
    planes.push({
      id,
      purpose,
      enforcementFlavor,
      reviewLens: (entry as { reviewLens?: string }).reviewLens,
      crossCutting: (entry as { crossCutting?: boolean }).crossCutting ?? false,
      // A project-declared plane is, by definition, selected for that project;
      // `defaultSelected` only steers the init picker for schema-offered planes.
      defaultSelected: (entry as { defaultSelected?: boolean }).defaultSelected ?? true,
    });
  }
  return planes;
}

/** The resolved plane ids for a project, or the historical two-plane default. */
export function resolvedPlaneIds(projectRoot: string): string[] {
  const model = resolveProjectSpecModel(projectRoot);
  return model.kind === 'governed' ? model.planes.map((p) => p.id) : ['behavior', 'architecture'];
}

/**
 * Skill template with directory name and workflow ID mapping.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: string;
}

/**
 * Command template with ID mapping.
 */
export interface CommandTemplateEntry {
  template: ReturnType<typeof getSpcbExploreCommandTemplate>;
  id: string;
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose workflowId is in this array
 */
export function getSkillTemplates(
  workflowFilter?: readonly string[],
  specModel?: SpecModel
): SkillTemplateEntry[] {
  const all: SkillTemplateEntry[] = [
    { template: getExploreSkillTemplate(specModel), dirName: 'specbase-explore', workflowId: 'explore' },
    { template: getNewChangeSkillTemplate(specModel), dirName: 'specbase-new-change', workflowId: 'new' },
    { template: getContinueChangeSkillTemplate(specModel), dirName: 'specbase-continue-change', workflowId: 'continue' },
    { template: getApplyChangeSkillTemplate(specModel), dirName: 'specbase-apply-change', workflowId: 'apply' },
    { template: getUpdateChangeSkillTemplate(specModel), dirName: 'specbase-update-change', workflowId: 'update' },
    { template: getFfChangeSkillTemplate(specModel), dirName: 'specbase-ff-change', workflowId: 'ff' },
    { template: getSyncSpecsSkillTemplate(specModel), dirName: 'specbase-sync-specs', workflowId: 'sync' },
    { template: getArchiveChangeSkillTemplate(specModel), dirName: 'specbase-archive-change', workflowId: 'archive' },
    { template: getBulkArchiveChangeSkillTemplate(specModel), dirName: 'specbase-bulk-archive-change', workflowId: 'bulk-archive' },
    { template: getVerifyChangeSkillTemplate(specModel), dirName: 'specbase-verify-change', workflowId: 'verify' },
    { template: getOnboardSkillTemplate(specModel), dirName: 'specbase-onboard', workflowId: 'onboard' },
    { template: getSpcbProposeSkillTemplate(specModel), dirName: 'specbase-propose', workflowId: 'propose' },
  ];

  const filterSet = workflowFilter ? new Set(workflowFilter) : undefined;
  const selected = filterSet
    ? all.filter(entry => filterSet.has(entry.workflowId))
    : all;

  // The review-panel orchestration skill ships to EVERY project, flat or
  // governed, because the panel's one job — review whether the implementation
  // produces the specs that were implemented — holds across that model
  // spectrum; planes only partition that job into blind lenses, and the lens
  // set is projected from the resolved model in the template itself. It remains
  // appended AFTER the profile filter on purpose (see comment above about why it
  // bypasses ALL_WORKFLOWS). In a flat project it registers the general
  // spec-conformance reviewer; in a governed one the projected lens set.
  selected.push({
    template: getReviewPanelSkillTemplate(specModel),
    dirName: 'specbase-review-panel',
    workflowId: 'review-panel',
  });

  // The STE writing skill is governed-only for the same reason the review-panel
  // is: it is a capability of the governed spec model's owned instruments (spec
  // `agents.ste-writing`), not a user-toggleable workflow, so it is deliberately
  // absent from ALL_WORKFLOWS. It ships to every governed project (capability
  // ships; only the baseline spec pairs are opt-in), and stays byte-identical
  // for legacy generation, which passes no governed model.
  if (isGovernedModel(specModel)) {
    selected.push({
      template: getSteWritingSkillTemplate(),
      dirName: 'specbase-ste-writing',
      workflowId: 'ste-writing',
    });
    selected.push({
      template: getExploreEnforceSkillTemplate(specModel),
      dirName: 'specbase-explore-enforce',
      workflowId: 'explore-enforce',
    });
    selected.push({
      template: getProposeEnforceSkillTemplate(specModel),
      dirName: 'specbase-propose-enforce',
      workflowId: 'propose-enforce',
    });
  }

  return selected;
}

/**
 * Gets command templates with their IDs, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose id is in this array
 */
export function getCommandTemplates(
  workflowFilter?: readonly string[],
  specModel?: SpecModel
): CommandTemplateEntry[] {
  const all: CommandTemplateEntry[] = [
    { template: getSpcbExploreCommandTemplate(specModel), id: 'explore' },
    { template: getSpcbNewCommandTemplate(specModel), id: 'new' },
    { template: getSpcbContinueCommandTemplate(specModel), id: 'continue' },
    { template: getSpcbApplyCommandTemplate(specModel), id: 'apply' },
    { template: getSpcbUpdateCommandTemplate(specModel), id: 'update' },
    { template: getSpcbFfCommandTemplate(specModel), id: 'ff' },
    { template: getSpcbSyncCommandTemplate(specModel), id: 'sync' },
    { template: getSpcbArchiveCommandTemplate(specModel), id: 'archive' },
    { template: getSpcbBulkArchiveCommandTemplate(specModel), id: 'bulk-archive' },
    { template: getSpcbVerifyCommandTemplate(specModel), id: 'verify' },
    { template: getSpcbOnboardCommandTemplate(specModel), id: 'onboard' },
    { template: getSpcbProposeCommandTemplate(specModel), id: 'propose' },
  ];

  const filterSet = workflowFilter ? new Set(workflowFilter) : undefined;
  const selected = filterSet ? all.filter(entry => filterSet.has(entry.id)) : all;

  // Every-model registration, matching the skill projection (parity: skill ==
  // command). See getSkillTemplates for why it bypasses the profile filter.
  selected.push({ template: getReviewPanelCommandTemplate(specModel), id: 'review-panel' });

  // Enforcement-phase commands, governed-only (same rationale as examine the
  // skill projection; see getSkillTemplates).
  if (isGovernedModel(specModel)) {
    selected.push({ template: getExploreEnforceCommandTemplate(specModel), id: 'explore-enforce' });
    selected.push({ template: getProposeEnforceCommandTemplate(specModel), id: 'propose-enforce' });
  }

  return selected;
}

/**
 * Converts command templates to CommandContent array, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return contents whose id is in this array
 */
export function getCommandContents(
  workflowFilter?: readonly string[],
  specModel?: SpecModel
): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter, specModel);
  return commandTemplates.map(({ template, id }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}

/**
 * Generates skill file content with YAML frontmatter.
 *
 * @param template - The skill template
 * @param generatedByVersion - The Specbase version to embed in the file
 * @param transformInstructions - Optional callback to transform the instructions content
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;

  return `---
name: ${template.name}
description: ${template.description}
allowed-tools: ${SPECBASE_CLI_ALLOWED_TOOLS}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'Requires specbase CLI.'}
metadata:
  author: ${template.metadata?.author || 'specbase'}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${generatedByVersion}"
---

${instructions}
`;
}
