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
  getOpsxProposeSkillTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxUpdateCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxVerifyCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxProposeCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';
import type { SpecModel } from '../artifact-graph/types.js';
import { LEGACY_SPEC_MODEL, resolveSpecModel } from '../artifact-graph/types.js';
import { resolveSchema } from '../artifact-graph/resolver.js';
import { readProjectConfig } from '../project-config.js';
import { OPENSPEC_CLI_ALLOWED_TOOLS } from './allowed-tools.js';

/** The project default schema when config declares none. */
const DEFAULT_SCHEMA_NAME = 'spec-driven';

/**
 * Resolve the spec model a project's DEFAULT schema selects, so skill/command
 * generation can gate governed guidance on the declared model rather than a
 * schema name. Any failure (missing config, unknown/invalid schema) falls back
 * to the legacy model, keeping generation resilient and legacy output unchanged.
 */
export function resolveProjectSpecModel(projectRoot: string): SpecModel {
  try {
    const config = readProjectConfig(projectRoot);
    const schemaName = config?.schema ?? DEFAULT_SCHEMA_NAME;
    return resolveSpecModel(resolveSchema(schemaName, projectRoot));
  } catch {
    return LEGACY_SPEC_MODEL;
  }
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
  template: ReturnType<typeof getOpsxExploreCommandTemplate>;
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
    { template: getExploreSkillTemplate(specModel), dirName: 'openspec-explore', workflowId: 'explore' },
    { template: getNewChangeSkillTemplate(specModel), dirName: 'openspec-new-change', workflowId: 'new' },
    { template: getContinueChangeSkillTemplate(specModel), dirName: 'openspec-continue-change', workflowId: 'continue' },
    { template: getApplyChangeSkillTemplate(specModel), dirName: 'openspec-apply-change', workflowId: 'apply' },
    { template: getUpdateChangeSkillTemplate(specModel), dirName: 'openspec-update-change', workflowId: 'update' },
    { template: getFfChangeSkillTemplate(specModel), dirName: 'openspec-ff-change', workflowId: 'ff' },
    { template: getSyncSpecsSkillTemplate(specModel), dirName: 'openspec-sync-specs', workflowId: 'sync' },
    { template: getArchiveChangeSkillTemplate(specModel), dirName: 'openspec-archive-change', workflowId: 'archive' },
    { template: getBulkArchiveChangeSkillTemplate(specModel), dirName: 'openspec-bulk-archive-change', workflowId: 'bulk-archive' },
    { template: getVerifyChangeSkillTemplate(specModel), dirName: 'openspec-verify-change', workflowId: 'verify' },
    { template: getOnboardSkillTemplate(), dirName: 'openspec-onboard', workflowId: 'onboard' },
    { template: getOpsxProposeSkillTemplate(specModel), dirName: 'openspec-propose', workflowId: 'propose' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.workflowId));
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
    { template: getOpsxExploreCommandTemplate(specModel), id: 'explore' },
    { template: getOpsxNewCommandTemplate(specModel), id: 'new' },
    { template: getOpsxContinueCommandTemplate(specModel), id: 'continue' },
    { template: getOpsxApplyCommandTemplate(specModel), id: 'apply' },
    { template: getOpsxUpdateCommandTemplate(specModel), id: 'update' },
    { template: getOpsxFfCommandTemplate(specModel), id: 'ff' },
    { template: getOpsxSyncCommandTemplate(specModel), id: 'sync' },
    { template: getOpsxArchiveCommandTemplate(specModel), id: 'archive' },
    { template: getOpsxBulkArchiveCommandTemplate(specModel), id: 'bulk-archive' },
    { template: getOpsxVerifyCommandTemplate(specModel), id: 'verify' },
    { template: getOpsxOnboardCommandTemplate(), id: 'onboard' },
    { template: getOpsxProposeCommandTemplate(specModel), id: 'propose' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.id));
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
 * @param generatedByVersion - The OpenSpec version to embed in the file
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
allowed-tools: ${OPENSPEC_CLI_ALLOWED_TOOLS}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'Requires openspec CLI.'}
metadata:
  author: ${template.metadata?.author || 'openspec'}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${generatedByVersion}"
---

${instructions}
`;
}
