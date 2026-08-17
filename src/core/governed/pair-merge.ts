/**
 * Governed delta reconciliation (tasks 4.1; GOVERNED_SYNC_GUIDANCE "reconcile
 * normative content by pair-local ID / preserve unaffected normative content").
 *
 * A change authors, per affected pair, a DELTA `spec.md` (with
 * `## ADDED / ## MODIFIED / ## REMOVED / ## RENAMED Requirements` operation
 * sections) and a DELTA `enforcement.md` (a `bindings` UPSERT, optional
 * `remove:` list). These are NOT the full next state. This module merges the
 * delta OPERATIONS onto the CURRENT pair by stable pair-local identity, so every
 * requirement/scenario/binding the delta does not mention is preserved.
 *
 * The merged `spec.md` is a clean governed spec (frontmatter `id:` + requirement
 * blocks, no `## ADDED/...` headers) that round-trips through `parseGovernedSpec`;
 * the merged `enforcement.md` round-trips through `parseEnforcement`.
 */
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { buildCodeFenceMask } from '../parsers/requirement-text.js';
import { parseDeltaSpec } from '../parsers/requirement-blocks.js';
import { parseEnforcement } from './enforcement-parser.js';

const REQUIREMENT_HEADER = /^###\s+Requirement:\s*(.+?)\s*$/;
// `**ID:** \`slug\`` with optional backticks and surrounding whitespace.
const ID_LINE = /^\*\*ID:\*\*\s*`?([^`\n]+?)`?\s*$/;
const OPEN_FENCE = /^\s*(`{3,}|~{3,})\s*([^\s`~]*)\s*$/;
const CLOSE_FENCE = /^\s*(`{3,}|~{3,})\s*$/;

export interface SpecMergeResult {
  /** The merged clean governed spec.md content. */
  content: string;
  /** Blocking merge errors (e.g. ADDED id collides, MODIFIED/REMOVED id absent). */
  errors: string[];
}

export interface EnforcementMergeResult {
  /** The merged enforcement.md content. */
  content: string;
  /** Blocking merge errors (e.g. delta enforcement is unparseable). */
  errors: string[];
}

/** One raw requirement block from a governed spec: its stable ID, title, text. */
interface GovBlock {
  id: string | null;
  title: string;
  raw: string;
}

/** Read the pair-local `**ID:**` slug directly below a requirement heading. */
function readBlockId(raw: string): string | null {
  const lines = raw.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) continue;
    const match = trimmed.match(ID_LINE);
    return match ? match[1].trim() : null;
  }
  return null;
}

/**
 * Split a clean governed spec into its head (frontmatter + title + any
 * `## Requirements` header, everything before the first requirement) and its
 * ordered requirement blocks, keyed by stable `**ID:**`. Fence-masked lines are
 * never treated as headers.
 */
function splitGovernedSpec(content: string): { head: string; blocks: GovBlock[] } {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const mask = buildCodeFenceMask(lines);
  const isReqHeader = (i: number): boolean =>
    !mask[i] && REQUIREMENT_HEADER.test(lines[i]);

  let first = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (isReqHeader(i)) {
      first = i;
      break;
    }
  }

  const head = lines.slice(0, first).join('\n');
  const blocks: GovBlock[] = [];
  let i = first;
  while (i < lines.length) {
    if (!isReqHeader(i)) {
      i++;
      continue;
    }
    const title = lines[i].match(REQUIREMENT_HEADER)![1].trim();
    const start = i;
    i++;
    while (i < lines.length && !isReqHeader(i)) i++;
    const raw = lines.slice(start, i).join('\n').trimEnd();
    blocks.push({ id: readBlockId(raw), title, raw });
  }
  return { head, blocks };
}

/** Rewrite a requirement block's heading title, preserving its ID and body. */
function retitleBlock(block: GovBlock, newTitle: string): GovBlock {
  const lines = block.raw.split('\n');
  lines[0] = `### Requirement: ${newTitle}`;
  return { ...block, title: newTitle, raw: lines.join('\n') };
}

/** Assemble a clean governed spec from a head and ordered requirement blocks. */
function assembleSpec(head: string, blocks: GovBlock[]): string {
  const body = blocks.map((b) => b.raw.trimEnd()).join('\n\n');
  const trimmedHead = head.replace(/\s+$/, '');
  const joined = trimmedHead
    ? `${trimmedHead}\n\n${body}`
    : body;
  return `${joined.replace(/\n{3,}/g, '\n\n')}\n`;
}

/**
 * Merge a governed spec DELTA (operation sections) onto the CURRENT spec by
 * stable pair-local ID. Preserves every current requirement the delta does not
 * mention. When there is no current spec, the delta's ADDED requirements form a
 * brand-new clean spec (MODIFIED/RENAMED/REMOVED against a missing spec error).
 */
export function mergeGovernedSpec(
  currentContent: string | null,
  deltaContent: string
): SpecMergeResult {
  const errors: string[] = [];
  const plan = parseDeltaSpec(deltaContent);

  // Resolve the ADDED/MODIFIED delta blocks' stable IDs from their `**ID:**`.
  const addedBlocks: GovBlock[] = plan.added.map((b) => ({
    id: readBlockId(b.raw),
    title: b.name,
    raw: b.raw,
  }));
  const modifiedBlocks: GovBlock[] = plan.modified.map((b) => ({
    id: readBlockId(b.raw),
    title: b.name,
    raw: b.raw,
  }));

  const current = currentContent
    ? splitGovernedSpec(currentContent)
    : { head: extractFrontmatter(deltaContent), blocks: [] as GovBlock[] };

  const blocks: GovBlock[] = [...current.blocks];
  const findIndexById = (id: string | null): number =>
    id === null ? -1 : blocks.findIndex((b) => b.id === id);
  const findIndexByTitle = (title: string): number =>
    blocks.findIndex((b) => b.title === title);

  // Order mirrors the legacy applier: RENAMED -> REMOVED -> MODIFIED -> ADDED.
  // RENAMED (FROM/TO titles): keep the stable ID, change only the heading title.
  for (const { from, to } of plan.renamed) {
    let idx = findIndexByTitle(from);
    if (idx === -1) idx = findIndexById(from); // tolerate an ID-form FROM
    if (idx === -1) {
      errors.push(`RENAMED requirement '${from}' not found in the current spec.`);
      continue;
    }
    blocks[idx] = retitleBlock(blocks[idx], to);
  }

  // REMOVED: delta lists requirement headers (by title, optionally with an ID).
  for (const name of plan.removed) {
    let idx = findIndexByTitle(name);
    if (idx === -1) idx = findIndexById(name);
    if (idx === -1) {
      errors.push(`REMOVED requirement '${name}' not found in the current spec.`);
      continue;
    }
    blocks.splice(idx, 1);
  }

  // MODIFIED: replace the current requirement with the same stable ID in place.
  for (const block of modifiedBlocks) {
    if (block.id === null) {
      errors.push(
        `MODIFIED requirement '${block.title}' is missing a '**ID:**' slug.`
      );
      continue;
    }
    const idx = findIndexById(block.id);
    if (idx === -1) {
      errors.push(
        `MODIFIED requirement '${block.title}' (ID '${block.id}') does not exist in the current spec.`
      );
      continue;
    }
    blocks[idx] = block;
  }

  // ADDED: insert a new requirement; its ID must not already exist.
  for (const block of addedBlocks) {
    if (block.id === null) {
      errors.push(`ADDED requirement '${block.title}' is missing a '**ID:**' slug.`);
      continue;
    }
    if (findIndexById(block.id) !== -1) {
      errors.push(
        `ADDED requirement '${block.title}' (ID '${block.id}') already exists in the current spec.`
      );
      continue;
    }
    blocks.push(block);
  }

  const content = assembleSpec(current.head, blocks);

  return { content, errors };
}

/** Extract the leading `---` frontmatter block (inclusive), or '' when absent. */
function extractFrontmatter(content: string): string {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  let start = 0;
  while (start < lines.length && lines[start].trim().length === 0) start++;
  if (start >= lines.length || !/^---\s*$/.test(lines[start])) return '';
  for (let i = start + 1; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i])) {
      return lines.slice(start, i + 1).join('\n');
    }
  }
  return '';
}

/** Extract the first fenced ```yaml block body from an enforcement.md, or null. */
function extractYamlBody(content: string): string | null {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(OPEN_FENCE);
    if (!open) continue;
    const lang = (open[2] ?? '').toLowerCase();
    if (lang !== 'yaml' && lang !== 'yml') continue;
    const marker = open[1][0];
    const length = open[1].length;
    const body: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const close = lines[j].match(CLOSE_FENCE);
      if (close && close[1][0] === marker && close[1].length >= length) {
        return body.join('\n');
      }
      body.push(lines[j]);
    }
    return body.join('\n');
  }
  return null;
}

/** Replace the first ```yaml fence body in `content` with `newBody`. */
function spliceYamlBody(content: string, newBody: string): string | null {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(OPEN_FENCE);
    if (!open) continue;
    const lang = (open[2] ?? '').toLowerCase();
    if (lang !== 'yaml' && lang !== 'yml') continue;
    const marker = open[1][0];
    const length = open[1].length;
    for (let j = i + 1; j < lines.length; j++) {
      const close = lines[j].match(CLOSE_FENCE);
      if (close && close[1][0] === marker && close[1].length >= length) {
        const head = lines.slice(0, i + 1).join('\n');
        const tail = lines.slice(j).join('\n');
        return `${head}\n${newBody.replace(/\n+$/, '')}\n${tail}`;
      }
    }
    return null;
  }
  return null;
}

/** Binding-id list a delta may declare to explicitly retire current bindings. */
function collectRemoveIds(doc: unknown): string[] {
  if (!doc || typeof doc !== 'object') return [];
  const raw =
    (doc as Record<string, unknown>).remove ??
    (doc as Record<string, unknown>).removed;
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string') ids.push(entry);
    else if (entry && typeof entry === 'object' && typeof (entry as any).id === 'string')
      ids.push((entry as any).id);
  }
  return ids;
}

function parseEnforcementYaml(content: string): unknown {
  const fenced = extractYamlBody(content);
  return parseYaml(fenced ?? content);
}

function compactBinding(
  value: unknown,
  source?: string
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const type = raw.type ?? raw.mechanism;
  const covers = raw.covers;
  const resolvedSource = source ?? raw.source ?? raw.lens ??
    ((raw.review as Record<string, unknown> | undefined)?.inputs as unknown[] | undefined)?.[0];
  if (typeof type !== 'string' || typeof resolvedSource !== 'string' || resolvedSource.length === 0) {
    return null;
  }
  return { type, covers: covers ?? [], source: resolvedSource };
}

function targetSuffix(target: string): string {
  const filePart = target.split('#', 1)[0].replace(/\\/gu, '/');
  const basename = filePart.split('/').pop() ?? '';
  const withoutExtension = basename.replace(/(?:\.[^.]+)+$/u, '');
  const slug = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return slug || 'target';
}

function collisionSafeSplitId(baseId: string, target: string, used: Set<string>): string {
  const stem = `${baseId}-${targetSuffix(target)}`;
  let candidate = stem;
  let index = 2;
  while (used.has(candidate)) candidate = `${stem}-${index++}`;
  used.add(candidate);
  return candidate;
}

function bindingMap(
  doc: unknown,
  reservedIds: ReadonlySet<string> = new Set()
): {
  bindings: Map<string, Record<string, unknown>>;
  errors: string[];
} {
  const bindings = new Map<string, Record<string, unknown>>();
  const errors: string[] = [];
  const raw = (doc as Record<string, unknown> | null)?.bindings;
  if (Array.isArray(raw)) {
    const declaredIds = new Set(
      raw.flatMap((binding) => {
        const id = binding && typeof binding === 'object'
          ? (binding as Record<string, unknown>).id
          : null;
        return typeof id === 'string' ? [id] : [];
      })
    );
    const used = new Set([...declaredIds, ...reservedIds]);
    for (const binding of raw) {
      if (!binding || typeof binding !== 'object') continue;
      const value = binding as Record<string, unknown>;
      const id = value.id;
      if (typeof id !== 'string') continue;

      const explicit = value.source ?? value.lens ??
        ((value.review as Record<string, unknown> | undefined)?.inputs as unknown[] | undefined)?.[0];
      if (typeof explicit === 'string' && explicit.length > 0) {
        const compact = compactBinding(value, explicit);
        if (compact) bindings.set(id, compact);
        continue;
      }

      const targets = Array.isArray(value.targets)
        ? value.targets.filter((target): target is string => typeof target === 'string' && target.length > 0)
        : [];
      if (targets.length === 0) {
        errors.push(
          `Legacy binding '${id}' has no target/source; resolve it explicitly before on-touch migration.`
        );
        continue;
      }
      targets.forEach((target, index) => {
        const compact = compactBinding(value, target);
        if (!compact) return;
        const splitId = index === 0 ? id : collisionSafeSplitId(id, target, used);
        bindings.set(splitId, compact);
      });
    }
  } else if (raw && typeof raw === 'object') {
    for (const [id, binding] of Object.entries(raw as Record<string, unknown>)) {
      const compact = compactBinding(binding);
      if (compact) bindings.set(id, compact);
    }
  }
  return { bindings, errors };
}

/**
 * Merge an enforcement DELTA onto the CURRENT enforcement by UPSERT on binding
 * id: delta bindings with a new id are appended, delta bindings whose id matches
 * a current binding replace it, and every current binding the delta does not
 * mention is PRESERVED (never silently dropped). A delta may explicitly retire a
 * current binding via a top-level `remove: [id, ...]` list. When there is no
 * current enforcement, the delta enforcement is the full content.
 */
export function mergeEnforcement(
  currentContent: string | null,
  deltaContent: string,
  options: { currentSourcePath?: string; deltaSourcePath: string }
): EnforcementMergeResult {
  const errors: string[] = [];
  let currentDoc: unknown = { bindings: {} };
  let deltaDoc: unknown;
  try {
    if (currentContent !== null) currentDoc = parseEnforcementYaml(currentContent);
    deltaDoc = parseEnforcementYaml(deltaContent);
  } catch (err) {
    errors.push(
      `Enforcement merge failed to parse yaml: ${err instanceof Error ? err.message : String(err)}`
    );
    return { content: currentContent ?? deltaContent, errors };
  }

  // Grammar comes from the discovered filename, never from content sniffing.
  // Compact deltas alone may carry `remove`; legacy fenced deltas remain
  // readable during migration.
  const parsedDelta = parseEnforcement(deltaContent, {
    sourcePath: options.deltaSourcePath,
    allowDeltaRemove: options.deltaSourcePath.endsWith('enforcement.yaml'),
  });
  errors.push(...parsedDelta.issues.map((issue) => issue.message));
  if (currentContent !== null && options.currentSourcePath) {
    const parsedCurrent = parseEnforcement(currentContent, {
      sourcePath: options.currentSourcePath,
    });
    errors.push(...parsedCurrent.issues.map((issue) => issue.message));
  }
  if (errors.length > 0) {
    return { content: currentContent ?? deltaContent, errors };
  }

  // Resolve delta identities first so generated IDs for split legacy-current
  // targets cannot be overwritten by an unrelated delta binding with the same
  // derived suffix. An exact current ID can still be intentionally upserted.
  const delta = bindingMap(deltaDoc);
  const current = bindingMap(currentDoc, new Set(delta.bindings.keys()));
  errors.push(...current.errors, ...delta.errors);
  if (errors.length > 0) {
    return { content: currentContent ?? deltaContent, errors };
  }
  for (const [id, binding] of delta.bindings) current.bindings.set(id, binding);
  for (const id of collectRemoveIds(deltaDoc)) current.bindings.delete(id);

  const bindings = Object.fromEntries(current.bindings);
  return { content: stringifyYaml({ bindings }), errors };
}
