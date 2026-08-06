import { parse as parseYaml } from 'yaml';
import { buildCodeFenceMask } from '../parsers/requirement-text.js';
import { isSpecId, isLocalSlugId } from '../id.js';
import type {
  GovernedRequirement,
  GovernedScenario,
} from '../schemas/governed-spec.schema.js';

/**
 * Governed `spec.md` parser. Deliberately separate from the legacy
 * `MarkdownParser` so the flat spec path is untouched; it reuses the shared
 * fence-aware mask (`buildCodeFenceMask`) so fenced examples of headers and
 * `**ID:**` lines are never mistaken for real structure.
 *
 * A governed spec begins with minimal frontmatter (`id`) and declares stable
 * IDs immediately below each requirement/scenario heading:
 *
 *   ---
 *   id: architecture.domain
 *   ---
 *   ### Requirement: Domain determinism
 *   **ID:** `domain-determinism`
 *   #### Scenario: Ambient time is rejected
 *   **ID:** `ambient-time-rejected`
 */

export type GovernedSpecIssueCode =
  | 'missing-frontmatter'
  | 'invalid-frontmatter'
  | 'missing-frontmatter-id'
  | 'invalid-frontmatter-id'
  | 'requirement-missing-id'
  | 'invalid-requirement-id'
  | 'scenario-missing-id'
  | 'invalid-scenario-id'
  | 'scenario-before-requirement';

export interface GovernedSpecIssue {
  code: GovernedSpecIssueCode;
  message: string;
  /** 1-based line number of the offending heading, when known. */
  line?: number;
}

export interface ParsedGovernedSpec {
  /** Frontmatter spec ID, or null when absent/invalid. */
  id: string | null;
  requirements: GovernedRequirement[];
  issues: GovernedSpecIssue[];
}

const FRONTMATTER_FENCE = /^---\s*$/;
const REQUIREMENT_HEADER = /^###\s+Requirement:\s*(.+?)\s*$/;
const SCENARIO_HEADER = /^####\s+Scenario:\s*(.+?)\s*$/;
// `**ID:** \`slug\`` with optional backticks and surrounding whitespace.
const ID_LINE = /^\*\*ID:\*\*\s*`?([^`\n]+?)`?\s*$/;

interface Frontmatter {
  id: string | null;
  bodyStartLine: number; // 0-based line index where the body begins
  issues: GovernedSpecIssue[];
}

function parseFrontmatter(lines: string[]): Frontmatter {
  const issues: GovernedSpecIssue[] = [];

  // Frontmatter must open on the first non-empty line.
  let start = 0;
  while (start < lines.length && lines[start].trim().length === 0) {
    start++;
  }

  if (start >= lines.length || !FRONTMATTER_FENCE.test(lines[start])) {
    issues.push({
      code: 'missing-frontmatter',
      message: 'Governed spec must begin with `---` frontmatter declaring `id`.',
    });
    return { id: null, bodyStartLine: 0, issues };
  }

  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (FRONTMATTER_FENCE.test(lines[i])) {
      end = i;
      break;
    }
  }

  if (end === -1) {
    issues.push({
      code: 'invalid-frontmatter',
      message: 'Frontmatter block is not closed with `---`.',
    });
    return { id: null, bodyStartLine: 0, issues };
  }

  const yamlText = lines.slice(start + 1, end).join('\n');
  let parsed: unknown;
  try {
    parsed = parseYaml(yamlText);
  } catch (err) {
    issues.push({
      code: 'invalid-frontmatter',
      message: `Frontmatter is not valid YAML: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
    return { id: null, bodyStartLine: end + 1, issues };
  }

  const rawId =
    parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>).id
      : undefined;

  if (rawId === undefined || rawId === null || rawId === '') {
    issues.push({
      code: 'missing-frontmatter-id',
      message: 'Frontmatter is missing a spec `id`.',
    });
    return { id: null, bodyStartLine: end + 1, issues };
  }

  const id = String(rawId).trim();
  if (!isSpecId(id)) {
    issues.push({
      code: 'invalid-frontmatter-id',
      message: `Frontmatter spec id '${id}' is not a valid spec ID.`,
    });
    return { id: null, bodyStartLine: end + 1, issues };
  }

  return { id, bodyStartLine: end + 1, issues };
}

/**
 * Read the `**ID:**` slug that follows a heading. Scans forward over blank
 * lines only until it meets the ID line or any other content/heading, so a
 * missing ID is detected without swallowing the next block.
 */
function readIdBelow(
  lines: string[],
  mask: boolean[],
  headingIndex: number
): { id: string | null; raw: string | null } {
  for (let i = headingIndex + 1; i < lines.length; i++) {
    if (mask[i]) return { id: null, raw: null };
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) continue;
    const match = trimmed.match(ID_LINE);
    if (match) {
      const raw = match[1].trim();
      return { id: raw, raw };
    }
    // First meaningful line was not an ID line.
    return { id: null, raw: null };
  }
  return { id: null, raw: null };
}

/**
 * Parse a governed spec's markdown into a normalized structure plus a list of
 * structural issues. Never throws on malformed content — callers (validation,
 * indexing) consume `issues` and decide severity.
 */
export function parseGovernedSpec(content: string): ParsedGovernedSpec {
  const normalized = content.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const mask = buildCodeFenceMask(lines);

  const frontmatter = parseFrontmatter(lines);
  const issues: GovernedSpecIssue[] = [...frontmatter.issues];
  const requirements: GovernedRequirement[] = [];

  let currentRequirement: GovernedRequirement | null = null;

  for (let i = frontmatter.bodyStartLine; i < lines.length; i++) {
    if (mask[i]) continue;
    const line = lines[i];

    const reqMatch = line.match(REQUIREMENT_HEADER);
    if (reqMatch) {
      const title = reqMatch[1].trim();
      const { id } = readIdBelow(lines, mask, i);
      if (id === null) {
        issues.push({
          code: 'requirement-missing-id',
          message: `Requirement '${title}' is missing a '**ID:**' slug.`,
          line: i + 1,
        });
      } else if (!isLocalSlugId(id)) {
        issues.push({
          code: 'invalid-requirement-id',
          message: `Requirement '${title}' has an invalid ID '${id}'.`,
          line: i + 1,
        });
      }
      currentRequirement = {
        id: id ?? '',
        title,
        scenarios: [],
      };
      requirements.push(currentRequirement);
      continue;
    }

    const scenMatch = line.match(SCENARIO_HEADER);
    if (scenMatch) {
      const title = scenMatch[1].trim();
      const { id } = readIdBelow(lines, mask, i);
      if (id === null) {
        issues.push({
          code: 'scenario-missing-id',
          message: `Scenario '${title}' is missing a '**ID:**' slug.`,
          line: i + 1,
        });
      } else if (!isLocalSlugId(id)) {
        issues.push({
          code: 'invalid-scenario-id',
          message: `Scenario '${title}' has an invalid ID '${id}'.`,
          line: i + 1,
        });
      }
      const scenario: GovernedScenario = { id: id ?? '', title };
      if (currentRequirement) {
        currentRequirement.scenarios.push(scenario);
      } else {
        // A scenario before any requirement is malformed. Report it rather than
        // dropping it silently, so the structural error is visible to callers.
        issues.push({
          code: 'scenario-before-requirement',
          message: `Scenario '${title}' appears before any requirement.`,
          line: i + 1,
        });
      }
      continue;
    }
  }

  return { id: frontmatter.id, requirements, issues };
}
