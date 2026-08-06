import { stringify as stringifyYaml } from 'yaml';
import type { ProjectConfig } from './project-config.js';

/**
 * Serialize config to YAML string with helpful comments.
 *
 * @param config - Partial config object (schema required, context/rules optional)
 * @returns YAML string ready to write to file
 */
export function serializeConfig(config: Partial<ProjectConfig>): string {
  const lines: string[] = [];

  // Schema (required)
  lines.push(`schema: ${config.schema}`);
  lines.push('');

  // Spec-model overrides (governed init only). A `planes:` list REPLACES the
  // schema's default plane set with exactly the planes selected at init; a
  // `planes+:` list APPENDS to the defaults. Init writes `planes:` when the
  // selection differs from the schema defaults, so an arbitrary subset (or an
  // added optional plane like design-system / agents) round-trips faithfully.
  const planesReplace = config.specModel?.planes;
  const planesAppend = config.specModel?.planesAppend;
  if (Array.isArray(planesReplace) && planesReplace.length > 0) {
    const block = stringifyYaml({ specModel: { planes: planesReplace } }).trimEnd();
    lines.push('# Spec planes governing this project (selected at init).');
    lines.push(block);
    lines.push('');
  } else if (Array.isArray(planesAppend) && planesAppend.length > 0) {
    const block = stringifyYaml({ specModel: { 'planes+': planesAppend } }).trimEnd();
    lines.push('# Planes this project opted into at init, appended to the schema defaults.');
    lines.push(block);
    lines.push('');
  }

  // Context section with comments
  lines.push('# Project context (optional)');
  lines.push('# This is shown to AI when creating artifacts.');
  lines.push('# Add your tech stack, conventions, style guides, domain knowledge, etc.');
  lines.push('# Example:');
  lines.push('#   context: |');
  lines.push('#     Tech stack: TypeScript, React, Node.js');
  lines.push('#     We use conventional commits');
  lines.push('#     Domain: e-commerce platform');
  lines.push('');

  // Rules section with comments
  lines.push('# Per-artifact rules (optional)');
  lines.push('# Add custom rules for specific artifacts.');
  lines.push('# Example:');
  lines.push('#   rules:');
  lines.push('#     proposal:');
  lines.push('#       - Keep proposals under 500 words');
  lines.push('#       - Always include a "Non-goals" section');
  lines.push('#     tasks:');
  lines.push('#       - Break tasks into chunks of max 2 hours');

  return lines.join('\n') + '\n';
}
