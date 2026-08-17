import { parse as parseYaml } from 'yaml';
import {
  CompactEnforcementDeltaDocumentSchema,
  CompactEnforcementDocumentSchema,
  EnforcementDocumentSchema,
  type Binding,
} from '../schemas/governed-spec.schema.js';

/**
 * Governed `enforcement.md` parser. An enforcement file is readable Markdown
 * that carries exactly one authoritative fenced YAML document (design decision
 * 4):
 *
 *   # Enforcement: Domain Architecture
 *
 *   ```yaml
 *   version: 1
 *   spec: architecture.domain
 *   bindings:
 *     - id: import-boundary
 *       covers: [domain-import-boundary]
 *       mechanism: lint
 *       strength: automated
 *       status: active
 *       targets: [tools/lint/boundaries.test.ts]
 *       run: { command: pnpm, args: [vitest, run, ...], cwd: . }
 *   ```
 *
 * Core only parses and reports; it never executes a binding's declared command.
 * Like the spec parser, this never throws on malformed content — callers read
 * `issues` and decide severity.
 */

export type EnforcementIssueCode =
  | 'missing-yaml-document'
  | 'multiple-yaml-documents'
  | 'invalid-yaml'
  | 'invalid-document'
  | 'duplicate-binding-id';

export interface EnforcementIssue {
  code: EnforcementIssueCode;
  message: string;
  /** The pair-local binding ID an issue is scoped to, when applicable. */
  bindingId?: string;
}

export interface ParsedEnforcement {
  /** Source grammar used for this document. */
  format?: 'yaml' | 'markdown';
  /** Declared document version, or null when absent/invalid. */
  version: number | null;
  /** The stable spec ID this enforcement claims to pair with, or null. */
  spec: string | null;
  /** Bindings with unique IDs; duplicates are dropped and reported in `issues`. */
  bindings: Binding[];
  issues: EnforcementIssue[];
}

interface FencedBlock {
  lang: string;
  body: string;
}

const OPEN_FENCE = /^\s*(`{3,}|~{3,})\s*([^\s`~]*)\s*$/;
const CLOSE_FENCE = /^\s*(`{3,}|~{3,})\s*$/;

/**
 * Extract every fenced code block with its info-string language. A block closes
 * on a fence of the same marker whose length is at least the opening length,
 * mirroring the fence rules the rest of the parsers use.
 */
function extractFencedBlocks(content: string): FencedBlock[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: FencedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const open = lines[i].match(OPEN_FENCE);
    if (!open) {
      i++;
      continue;
    }
    const marker = open[1][0];
    const length = open[1].length;
    const lang = (open[2] ?? '').toLowerCase();

    const bodyLines: string[] = [];
    let j = i + 1;
    for (; j < lines.length; j++) {
      const close = lines[j].match(CLOSE_FENCE);
      if (close && close[1][0] === marker && close[1].length >= length) {
        break;
      }
      bodyLines.push(lines[j]);
    }
    blocks.push({ lang, body: bodyLines.join('\n') });
    i = j + 1;
  }

  return blocks;
}

/** Best-effort recovery of a raw string field before schema validation fails. */
function rawString(obj: unknown, key: string): string | null {
  if (obj && typeof obj === 'object') {
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

function rawVersion(obj: unknown): number | null {
  if (obj && typeof obj === 'object') {
    const value = (obj as Record<string, unknown>).version;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

/**
 * Drop bindings whose ID repeats within the pair, keeping the first occurrence,
 * and report each collision once. Binding IDs are unique inside a single
 * enforcement file (design decision 3).
 */
function dedupeBindingIds(
  bindings: Binding[],
  issues: EnforcementIssue[]
): Binding[] {
  const seen = new Set<string>();
  const reported = new Set<string>();
  const unique: Binding[] = [];

  for (const binding of bindings) {
    if (seen.has(binding.id)) {
      if (!reported.has(binding.id)) {
        issues.push({
          code: 'duplicate-binding-id',
          message: `Binding ID '${binding.id}' is declared more than once; binding IDs must be unique within the pair.`,
          bindingId: binding.id,
        });
        reported.add(binding.id);
      }
      continue;
    }
    seen.add(binding.id);
    unique.push(binding);
  }

  return unique;
}

export interface ParseEnforcementOptions {
  /** Native discovered path. Its filename selects the grammar; content never does. */
  sourcePath: string;
  /** Compact change deltas alone may carry the top-level `remove` operation. */
  allowDeltaRemove?: boolean;
}

/**
 * Parse a governed enforcement manifest using the grammar selected by its
 * discovered filename. `enforcement.yaml` is always compact direct YAML;
 * `enforcement.md` is always legacy Markdown with an authoritative YAML fence.
 * Content sniffing is deliberately forbidden so renaming a legacy document to
 * `.yaml` cannot preserve the legacy grammar accidentally.
 */
export function parseEnforcement(
  content: string,
  options: ParseEnforcementOptions
): ParsedEnforcement {
  const issues: EnforcementIssue[] = [];
  const filename = options.sourcePath.replace(/\\/gu, '/').split('/').pop();
  const format = filename === 'enforcement.yaml'
    ? 'yaml'
    : filename === 'enforcement.md'
      ? 'markdown'
      : null;

  if (format === null) {
    issues.push({
      code: 'invalid-document',
      message: `Unsupported enforcement filename '${filename ?? options.sourcePath}'; expected enforcement.yaml or enforcement.md.`,
    });
    return { version: null, spec: null, bindings: [], issues };
  }

  if (format === 'yaml') {
    if (extractFencedBlocks(content).length > 0) {
      issues.push({
        code: 'invalid-document',
        message: 'enforcement.yaml must be compact direct YAML and cannot contain fenced Markdown.',
      });
      return { format, version: null, spec: null, bindings: [], issues };
    }
    let raw: unknown;
    try {
      raw = parseYaml(content);
    } catch (err) {
      issues.push({
        code: 'invalid-yaml',
        message: `Enforcement YAML is not valid: ${err instanceof Error ? err.message : String(err)}`,
      });
      return { format, version: null, spec: null, bindings: [], issues };
    }
    const schema = options.allowDeltaRemove
      ? CompactEnforcementDeltaDocumentSchema
      : CompactEnforcementDocumentSchema;
    const result = schema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const location = issue.path.length > 0 ? ` at '${issue.path.join('.')}'` : '';
        issues.push({
          code: 'invalid-document',
          message: `Enforcement document is invalid${location}: ${issue.message}`,
        });
      }
      return { format, version: null, spec: null, bindings: [], issues };
    }
    const bindings: Binding[] = Object.entries(result.data.bindings).map(([id, value]) => ({
      id,
      type: value.type,
      source: value.source,
      covers: Array.isArray(value.covers) ? value.covers : [value.covers],
      mechanism: value.type,
      strength: 'unenforced',
      status: 'active',
      targets: [value.source.split('#', 1)[0]],
    }));
    return { format, version: null, spec: null, bindings, issues };
  }

  const yamlBlocks = extractFencedBlocks(content).filter(
    (block) => block.lang === 'yaml' || block.lang === 'yml'
  );
  if (yamlBlocks.length === 0) {
    issues.push({
      code: 'missing-yaml-document',
      message: 'Legacy enforcement.md must contain exactly one fenced yaml document.',
    });
    return { format, version: null, spec: null, bindings: [], issues };
  }

  if (yamlBlocks.length > 1) {
    issues.push({
      code: 'multiple-yaml-documents',
      message: `Enforcement file has ${yamlBlocks.length} fenced yaml documents; exactly one is authoritative. Using the first.`,
    });
  }

  let raw: unknown;
  try {
    raw = parseYaml(yamlBlocks[0].body);
  } catch (err) {
    issues.push({
      code: 'invalid-yaml',
      message: `Enforcement YAML is not valid: ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
    return { format: 'markdown', version: null, spec: null, bindings: [], issues };
  }

  const result = EnforcementDocumentSchema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const location = issue.path.length > 0 ? ` at '${issue.path.join('.')}'` : '';
      issues.push({
        code: 'invalid-document',
        message: `Enforcement document is invalid${location}: ${issue.message}`,
      });
    }
    return {
      format: 'markdown',
      version: rawVersion(raw),
      spec: rawString(raw, 'spec'),
      bindings: [],
      issues,
    };
  }

  const bindings = dedupeBindingIds(result.data.bindings, issues).map((binding) => ({
    ...binding,
    type: binding.mechanism,
    source:
      binding.lens ??
      binding.targets[0] ??
      binding.review?.inputs[0] ??
      binding.procedure ??
      '',
  }));

  return {
    format: 'markdown',
    version: result.data.version,
    spec: result.data.spec,
    bindings,
    issues,
  };
}
