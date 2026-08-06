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

function bindingId(binding: unknown): string | null {
  if (binding && typeof binding === 'object' && typeof (binding as any).id === 'string') {
    return (binding as any).id;
  }
  return null;
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
  deltaContent: string
): EnforcementMergeResult {
  const errors: string[] = [];
  if (currentContent === null) {
    return { content: deltaContent, errors };
  }

  const currentBody = extractYamlBody(currentContent);
  const deltaBody = extractYamlBody(deltaContent);
  if (currentBody === null || deltaBody === null) {
    errors.push('Enforcement merge could not locate a fenced yaml document.');
    return { content: currentContent, errors };
  }

  let currentDoc: unknown;
  let deltaDoc: unknown;
  try {
    currentDoc = parseYaml(currentBody);
    deltaDoc = parseYaml(deltaBody);
  } catch (err) {
    errors.push(
      `Enforcement merge failed to parse yaml: ${err instanceof Error ? err.message : String(err)}`
    );
    return { content: currentContent, errors };
  }

  const currentBindings: unknown[] = Array.isArray(
    (currentDoc as any)?.bindings
  )
    ? [...(currentDoc as any).bindings]
    : [];
  const deltaBindings: unknown[] = Array.isArray((deltaDoc as any)?.bindings)
    ? (deltaDoc as any).bindings
    : [];
  const removeIds = new Set(collectRemoveIds(deltaDoc));

  const merged: unknown[] = [...currentBindings];
  const indexById = new Map<string, number>();
  merged.forEach((b, i) => {
    const id = bindingId(b);
    if (id !== null) indexById.set(id, i);
  });

  for (const binding of deltaBindings) {
    const id = bindingId(binding);
    if (id === null) continue;
    if (indexById.has(id)) {
      merged[indexById.get(id)!] = binding;
    } else {
      indexById.set(id, merged.length);
      merged.push(binding);
    }
  }

  const finalBindings =
    removeIds.size > 0
      ? merged.filter((b) => {
          const id = bindingId(b);
          return id === null || !removeIds.has(id);
        })
      : merged;

  const mergedDoc: Record<string, unknown> = {
    ...(currentDoc as Record<string, unknown>),
  };
  delete mergedDoc.remove;
  delete mergedDoc.removed;
  mergedDoc.bindings = finalBindings;

  const yamlBody = stringifyYaml(mergedDoc).replace(/\n$/, '');
  const spliced =
    spliceYamlBody(currentContent, yamlBody) ??
    `# Enforcement\n\n\`\`\`yaml\n${yamlBody}\n\`\`\`\n`;
  return { content: spliced, errors };
}
