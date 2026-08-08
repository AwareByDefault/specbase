import path from 'path';
import { FileSystemUtils } from './file-system.js';
import { writeChangeMetadata, validateSchemaName } from './change-metadata.js';
import { readProjectConfig } from '../core/project-config.js';
import { planningDir } from '../core/planning-dir.js';
import { generateIdeaId } from '../core/ideas/id.js';
import type { ChangeMetadata } from '../core/change-metadata/index.js';

const DEFAULT_SCHEMA = 'spec-driven';

/**
 * Options for creating a change.
 */
export interface CreateChangeOptions {
  /** The workflow schema to use (default: 'spec-driven') */
  schema?: string;
  /** Default schema to use when no explicit schema or project config is present */
  defaultSchema?: string;
  /** Directory that should contain the change directories */
  changesDir?: string;
  /** Additional metadata to persist in the change's .openspec.yaml */
  metadata?: Partial<Pick<ChangeMetadata, 'goal' | 'affected_areas' | 'initiative' | 'id'>>;
  /**
   * When set, the change is created by MOVING this existing idea directory
   * from ideas/<id>/ to changes/<id>/ — graduation by move. The idea's id is
   * carried forward unchanged, its scratchpad files preserved. The change
   * artifacts (proposal.md, tasks.md, design.md, specs/) are scaffolded
   * inside the moved directory.
   */
  fromIdea?: {
    /** Id of the open idea under <specbase>/ideas/. */
    id: string;
  };
}

/**
 * Result of creating a change.
 */
export interface CreateChangeResult {
  /** The schema that was actually used (resolved from options, config, or default) */
  schema: string;
  /** Absolute path to the created change directory */
  changeDir: string;
}

/**
 * Result of validating a change name.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that a change name follows kebab-case conventions.
 *
 * Valid names:
 * - Start with a lowercase letter
 * - Contain only lowercase letters, numbers, and hyphens
 * - Do not start or end with a hyphen
 * - Do not contain consecutive hyphens
 *
 * @param name - The change name to validate
 * @returns Validation result with `valid: true` or `valid: false` with an error message
 *
 * @example
 * validateChangeName('add-auth') // { valid: true }
 * validateChangeName('Add-Auth') // { valid: false, error: '...' }
 */
export function validateChangeName(name: string): ValidationResult {
  // Pattern: starts with lowercase letter, followed by lowercase letters/numbers,
  // optionally followed by hyphen + lowercase letters/numbers (repeatable)
  const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  if (!name) {
    return { valid: false, error: 'Change name cannot be empty' };
  }

  if (!kebabCasePattern.test(name)) {
    // Provide specific error messages for common mistakes
    if (/[A-Z]/.test(name)) {
      return { valid: false, error: 'Change name must be lowercase (use kebab-case)' };
    }
    if (/\s/.test(name)) {
      return { valid: false, error: 'Change name cannot contain spaces (use hyphens instead)' };
    }
    if (/_/.test(name)) {
      return { valid: false, error: 'Change name cannot contain underscores (use hyphens instead)' };
    }
    if (name.startsWith('-')) {
      return { valid: false, error: 'Change name cannot start with a hyphen' };
    }
    if (name.endsWith('-')) {
      return { valid: false, error: 'Change name cannot end with a hyphen' };
    }
    if (/--/.test(name)) {
      return { valid: false, error: 'Change name cannot contain consecutive hyphens' };
    }
    if (/[^a-z0-9-]/.test(name)) {
      return { valid: false, error: 'Change name can only contain lowercase letters, numbers, and hyphens' };
    }
    if (/^[0-9]/.test(name)) {
      return { valid: false, error: 'Change name must start with a letter' };
    }

    return { valid: false, error: 'Change name must follow kebab-case convention (e.g., add-auth, refactor-db)' };
  }

  return { valid: true };
}

/**
 * Creates a new change directory with metadata file.
 *
 * @param projectRoot - The root directory of the project (where `specbase/` lives)
 * @param name - The change name (must be valid kebab-case)
 * @param options - Optional settings for the change
 * @throws Error if the change name is invalid
 * @throws Error if the schema name is invalid
 * @throws Error if the change directory already exists
 *
 * @returns Result containing the resolved schema name
 *
 * @example
 * // Creates specbase/changes/add-auth/ with default schema
 * const result = await createChange('/path/to/project', 'add-auth')
 * console.log(result.schema) // 'spec-driven' or value from config
 *
 * @example
 * // Creates specbase/changes/add-auth/ with custom schema
 * const result = await createChange('/path/to/project', 'add-auth', { schema: 'my-workflow' })
 * console.log(result.schema) // 'my-workflow'
 */
export async function createChange(
  projectRoot: string,
  name: string,
  options: CreateChangeOptions = {}
): Promise<CreateChangeResult> {
  // Validate the name first
  const validation = validateChangeName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const defaultSchema = options.defaultSchema ?? DEFAULT_SCHEMA;

  // Determine schema: explicit option → project config → supplied default
  let schemaName: string;
  if (options.schema) {
    schemaName = options.schema;
  } else {
    // Try to read from project config
    try {
      const config = readProjectConfig(projectRoot);
      schemaName = config?.schema ?? defaultSchema;
    } catch {
      // If config read fails, use default
      schemaName = defaultSchema;
    }
  }

  // Validate the resolved schema
  validateSchemaName(schemaName, projectRoot);

  // Build the change directory path
  const changeDir = path.join(options.changesDir ?? path.join(planningDir(projectRoot), 'changes'), name);

  // Check if change already exists
  if (await FileSystemUtils.directoryExists(changeDir)) {
    throw new Error(`Change '${name}' already exists at ${changeDir}`);
  }

  // Creating a change may scaffold or complete the root itself (an
  // implicit root, or a config-only/incomplete clone). Never leave a
  // half-root behind that doctor immediately calls unhealthy: ensure
  // specs/ and changes/archive/ exist, and write a config only when
  // none exists. The config records the PROJECT default schema, never
  // a one-change --schema override.
  const specbaseDir = planningDir(projectRoot);

  let fromIdeaScaffolded = false;
  if (options.fromIdea) {
    // Graduation by move: the idea directory becomes the change directory.
    // Preserve every scratchpad file; the stable id is carried in metadata.
    const ideasHome = path.join(specbaseDir, 'ideas');
    const ideaDir = path.join(ideasHome, options.fromIdea.id);
    if (!(await FileSystemUtils.directoryExists(ideaDir))) {
      throw new Error(
        `Idea '${options.fromIdea.id}' is not open under ideas/. It may already have been proposed into a change (check specbase/changes/).`
      );
    }
    await FileSystemUtils.moveDirectory(ideaDir, changeDir);
    fromIdeaScaffolded = true;
  } else {
    // Create the directory (including parent directories if needed)
    await FileSystemUtils.createDirectory(changeDir);
  }
  await FileSystemUtils.createDirectory(path.join(specbaseDir, 'specs'));
  await FileSystemUtils.createDirectory(path.join(specbaseDir, 'changes', 'archive'));
  const configPath = path.join(specbaseDir, 'config.yaml');
  const configYmlPath = path.join(specbaseDir, 'config.yml');
  if (
    !(await FileSystemUtils.fileExists(configPath)) &&
    !(await FileSystemUtils.fileExists(configYmlPath))
  ) {
    await FileSystemUtils.writeFile(configPath, `schema: ${defaultSchema}\n`);
  }

  // Write metadata file with schema and creation date. Every new change
  // gains a stable `<slug>-<short-uuid>` id so identity survives the archive
  // date-prefix move. A change created from an idea carries the idea's id
  // instead (supplied via metadata.id by the move seam).
  const today = new Date().toISOString().split('T')[0];
  const id = options.metadata?.id ?? generateIdeaId(name);
  writeChangeMetadata(changeDir, {
    schema: schemaName,
    created: today,
    id,
    ...options.metadata,
  }, projectRoot);

  // The move IS the graduation: scaffold the change artifacts inside the
  // moved directory so the idea arrives as a proper proposed change. Sits
  // beside the preserved scratchpad files (notes.md, sketches, ...).
  if (fromIdeaScaffolded) {
    await scaffoldChangeArtifacts(changeDir, {
      name,
      ...(options.metadata?.id ? { id: options.metadata.id } : {}),
    });
  }

  return { schema: schemaName, changeDir };
}

/**
 * Writes the four standard change artifacts inside an existing change
 * directory. Used by the idea→change move seam so a graduated idea arrives
 * as a proper proposed change, ready for the propose draft.
 */
async function scaffoldChangeArtifacts(
  changeDir: string,
  meta: { name: string; id?: string }
): Promise<void> {
  const proposal = `## Why
<!-- why this idea deserves to become a change -->
\n## What Changes\n- <!-- user-visible change; add **BREAKING:** for breaking changes -->\n`;
  const tasks = `## 1.\n- [ ] 1.1 \n`;
  const design = `# Design: ${meta.name}\n<!-- how and why; known trade-offs -->\n`;

  await FileSystemUtils.writeFile(path.join(changeDir, 'proposal.md'), proposal);
  await FileSystemUtils.writeFile(path.join(changeDir, 'tasks.md'), tasks);
  await FileSystemUtils.writeFile(path.join(changeDir, 'design.md'), design);
  await FileSystemUtils.createDirectory(path.join(changeDir, 'specs'));
}
