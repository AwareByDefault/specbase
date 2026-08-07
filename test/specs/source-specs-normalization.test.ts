import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { parseGovernedSpec } from '../../src/core/governed/spec-parser.js';
import { stripFencedCodeBlocksPreservingLines } from '../../src/core/parsers/spec-structure.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const specsRoot = path.join(projectRoot, 'specbase', 'specs');

const PURPOSE_PLACEHOLDER_PATTERN = /TBD - created by archiving change .*?\. Update Purpose after archive\./;
const REQUIREMENT_HEADER_PATTERN = /^###\s+Requirement:/gm;

async function getSpecFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getSpecFiles(entryPath)));
      continue;
    }
    if (entry.isFile() && entry.name === 'spec.md') {
      files.push(entryPath);
    }
  }

  return files.sort();
}

/** The governed spec id a file's location in the store implies. */
function locatorIdFor(file: string): string {
  return path
    .relative(specsRoot, path.dirname(file))
    .split(path.sep)
    .join('.');
}

describe('source-of-truth specs normalization', () => {
  it('enforces governed spec structure and bans hidden requirements, placeholders, and delta headers', async () => {
    const files = await getSpecFiles(specsRoot);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const relativeFile = path.relative(projectRoot, file);
      const stripped = stripFencedCodeBlocksPreservingLines(content);
      const parsed = parseGovernedSpec(content);
      const rawRequirementCount = stripped.match(REQUIREMENT_HEADER_PATTERN)?.length ?? 0;

      expect(parsed.issues, `${relativeFile} must parse without governed spec issues`).toEqual([]);
      expect(parsed.id, `${relativeFile} frontmatter id must match its locator`).toBe(
        locatorIdFor(file)
      );
      expect(content, `${relativeFile} must not include archive placeholder purpose text`).not.toMatch(
        PURPOSE_PLACEHOLDER_PATTERN
      );
      // The governed parser is header-driven, so the legacy "delta header truncates
      // the ## Requirements section" hazard cannot hide a requirement here. The
      // equality below is the governed analog of that ban: every visible
      // `### Requirement:` header must also be a parsed requirement.
      expect(
        parsed.requirements.length,
        `${relativeFile} parsed requirement count must match visible requirement headers`
      ).toBe(rawRequirementCount);
    }
  });
});
