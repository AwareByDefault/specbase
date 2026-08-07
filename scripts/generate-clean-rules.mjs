#!/usr/bin/env node
/**
 * Lift the marked Rules sections out of the clean-* manifestos into a generated
 * TypeScript module the skill generator imports.
 *
 * The manifestos are the single authored home of the rules. `docs/` does not
 * ship in the npm package, so the rules must be BAKED IN at build time: this
 * script runs before `tsc` (see `build.js`) and the compiled constant is what
 * every generated skill carries into an installed repo.
 *
 * Usage:
 *   node scripts/generate-clean-rules.mjs         # write when content changed
 *   node scripts/generate-clean-rules.mjs --check # exit 1 on drift, write nothing
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

/** Repo root, derived from this script's location so cwd never matters. */
export const REPO_ROOT = path.resolve(scriptDir, '..');

export const BEGIN_MARKER = '<!-- BEGIN RULES -->';
export const END_MARKER = '<!-- END RULES -->';

/** Repo-relative path of the module this script writes. */
export const OUTPUT_RELATIVE_PATH = path.join(
  'src',
  'core',
  'templates',
  'workflows',
  'clean-rules.generated.ts'
);

/**
 * The manifestos to lift from, in emission order. `exportName` is the constant
 * the skill generator imports; `doc` describes the constant in its JSDoc.
 */
export const MANIFESTOS = [
  {
    sourceRelativePath: path.join('docs', 'clean-spec.md'),
    exportName: 'CLEAN_SPEC_RULES',
    doc: 'Distilled rules for WRITING one governed spec pair, lifted verbatim from\n * the marked Rules section of `docs/clean-spec.md`.',
  },
  {
    sourceRelativePath: path.join('docs', 'clean-specbase.md'),
    exportName: 'CLEAN_SPECBASE_RULES',
    doc: 'Distilled rules for PLACING a governed pair in the spec tree, lifted verbatim\n * from the marked Rules section of `docs/clean-specbase.md`.',
  },
];

/**
 * Extract the single delimited Rules block from a manifesto's markdown.
 * Throws when the markers are missing, unbalanced, duplicated, or inverted so a
 * malformed manifesto fails the build rather than silently emitting nothing.
 */
export function extractRules(markdown, label) {
  const beginCount = markdown.split(BEGIN_MARKER).length - 1;
  const endCount = markdown.split(END_MARKER).length - 1;

  if (beginCount !== 1 || endCount !== 1) {
    throw new Error(
      `${label}: expected exactly one ${BEGIN_MARKER} / ${END_MARKER} pair, found ${beginCount} begin and ${endCount} end markers`
    );
  }

  const start = markdown.indexOf(BEGIN_MARKER) + BEGIN_MARKER.length;
  const end = markdown.indexOf(END_MARKER);

  if (end < start) {
    throw new Error(`${label}: ${END_MARKER} appears before ${BEGIN_MARKER}`);
  }

  const body = markdown.slice(start, end).trim();
  if (!body) {
    throw new Error(`${label}: the marked Rules section is empty`);
  }
  return body;
}

/** Escape a rules block so it survives as a TypeScript template literal. */
function toTemplateLiteral(text) {
  return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * Render the full generated module from the manifestos on disk. Pure with
 * respect to the filesystem read, so the drift check can compare this against
 * the committed file without writing anything.
 */
export function renderCleanRulesModule(repoRoot = REPO_ROOT) {
  const blocks = MANIFESTOS.map((manifesto) => {
    const sourcePath = path.join(repoRoot, manifesto.sourceRelativePath);
    const markdown = readFileSync(sourcePath, 'utf8');
    const rules = extractRules(markdown, manifesto.sourceRelativePath);
    return `/**\n * ${manifesto.doc}\n */\nexport const ${manifesto.exportName} = \`${toTemplateLiteral(rules)}\`;\n`;
  });

  const sources = MANIFESTOS.map((m) => m.sourceRelativePath.split(path.sep).join('/')).join(', ');

  return `// GENERATED FILE - DO NOT EDIT BY HAND.
//
// Source: ${sources} (the delimited Rules sections).
// Regenerate: node scripts/generate-clean-rules.mjs (runs automatically in \`pnpm build\`).
//
// The manifestos are the single authored home of these rules. \`docs/\` does not
// ship in the npm package, so the build bakes the rules in here and every
// generated skill carries them into an installed repo.

${blocks.join('\n')}`;
}

/** Read the committed generated module, or `undefined` when it does not exist. */
export function readCommittedModule(repoRoot = REPO_ROOT) {
  const outputPath = path.join(repoRoot, OUTPUT_RELATIVE_PATH);
  return existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : undefined;
}

function main(argv) {
  const checkOnly = argv.includes('--check');
  const outputPath = path.join(REPO_ROOT, OUTPUT_RELATIVE_PATH);
  const rendered = renderCleanRulesModule();
  const committed = readCommittedModule();

  if (rendered === committed) {
    console.log(`clean-rules: up to date (${OUTPUT_RELATIVE_PATH})`);
    return 0;
  }

  if (checkOnly) {
    console.error(
      `clean-rules: ${OUTPUT_RELATIVE_PATH} is stale. Run \`node scripts/generate-clean-rules.mjs\` and commit the result.`
    );
    return 1;
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, rendered, 'utf8');
  console.log(`clean-rules: wrote ${OUTPUT_RELATIVE_PATH}`);
  return 0;
}

// Only act as a CLI when executed directly; importing this module (tests, the
// drift check) must have no side effects.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
