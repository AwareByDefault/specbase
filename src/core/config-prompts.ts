import { stringify as stringifyYaml } from 'yaml';
import type { ProjectConfig } from './project-config.js';

/**
 * Reduce a plane record to the fields that carry meaning in a resolved config,
 * in a stable key order: `id`, `purpose`, `enforcementFlavor`, `reviewLens`
 * (only when declared), and `crossCutting` (only when true). The picker-only
 * `defaultSelected` flag and a `crossCutting: false` default are dropped so a
 * seeded config stays clean; resolution tolerates both being absent.
 */
function cleanPlaneRecord(plane: unknown): Record<string, unknown> {
  const p = (plane ?? {}) as Record<string, unknown>;
  const record: Record<string, unknown> = {
    id: p.id,
    purpose: p.purpose,
    enforcementFlavor: p.enforcementFlavor,
  };
  if (typeof p.reviewLens === 'string' && p.reviewLens.length > 0) {
    record.reviewLens = p.reviewLens;
  }
  if (p.crossCutting === true) {
    record.crossCutting = true;
  }
  return record;
}

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
  // schema's default plane set with exactly the planes it lists — so the config
  // is the authoritative source of truth for this project's planes: add a record
  // to gain a plane, remove one to drop it, empty the list to go flat. A
  // `planes+:` list instead APPENDS to the schema defaults (legacy/back-compat).
  // Init seeds the full selected set via `planes:`.
  const planesReplace = config.specModel?.planes;
  const planesAppend = config.specModel?.planesAppend;
  if (Array.isArray(planesReplace) && planesReplace.length > 0) {
    const block = stringifyYaml({ specModel: { planes: planesReplace.map(cleanPlaneRecord) } }).trimEnd();
    lines.push('# Spec planes governing this project — the authoritative source of');
    lines.push('# truth. Add a record to gain a plane, remove one to drop it, empty');
    lines.push('# the list to go flat.');
    lines.push(block);
    lines.push('');
  } else if (Array.isArray(planesAppend) && planesAppend.length > 0) {
    const block = stringifyYaml({ specModel: { 'planes+': planesAppend.map(cleanPlaneRecord) } }).trimEnd();
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
