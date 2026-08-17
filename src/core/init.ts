/**
 * Init Command
 *
 * Sets up Specbase with Agent Skills and /spcb:* slash commands.
 * This is the unified setup command that replaces both the old init and experimental commands.
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { createRequire } from 'module';
import { FileSystemUtils } from '../utils/file-system.js';
import { classifySpecbaseDir, storePointerProblem } from './project-config.js';
import { findRepoPlanningRootSync } from './planning-home.js';
import { transformToHyphenCommands } from '../utils/command-references.js';
import {
  AI_TOOLS,
  resolvePlanningDirName,
  AIToolOption,
} from './config.js';
import { PALETTE } from './styles/palette.js';
import { isInteractive } from '../utils/interactive.js';
import { serializeConfig } from './config-prompts.js';
import {
  generateCommands,
  CommandAdapterRegistry,
} from './command-generation/index.js';
import {
  detectLegacyArtifacts,
  cleanupLegacyArtifacts,
  formatCleanupSummary,
  formatDetectionSummary,
  type LegacyDetectionResult,
} from './legacy-cleanup.js';
import {
  SKILL_NAMES,
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  getSkillTemplates,
  getCommandContents,
  generateSkillContent,
  resolveProjectSpecModel,
  type ToolSkillStatus,
} from './shared/index.js';
import { getGlobalConfig, type Delivery, type Profile } from './global-config.js';
import { getProfileWorkflows, CORE_WORKFLOWS, ALL_WORKFLOWS } from './profiles.js';
import { getAvailableTools } from './available-tools.js';
import { migrateIfNeeded } from './migration.js';
import { resolveSchema, getSchemaDir } from './artifact-graph/resolver.js';
import { resolveSpecModel, type Plane } from './artifact-graph/types.js';
import type { ProjectConfig } from './project-config.js';

const require = createRequire(import.meta.url);
const { version: SPECBASE_VERSION } = require('../../package.json');

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DEFAULT_SCHEMA = 'spec-driven';
// The governed schema a user opts into via the `specbase init` governed-model
// prompt. The global DEFAULT_SCHEMA stays flat; only an explicit yes writes this.
const GOVERNED_SCHEMA = 'spec-driven-governed';

// Result of the init plane picker. Governance is emergent: `governed` is simply
// whether at least one plane was selected. `planes` are the selected records.
interface PlaneSelection {
  governed: boolean;
  planes: Plane[];
  selectedIds: string[];
}

/**
 * The governed schema's single OFFER-ABLE plane list (every plane a project may
 * select at init, each carrying `defaultSelected`). Returns an empty list if the
 * schema or its spec model is absent. `projectRoot` lets a project-local schema
 * override the built-in.
 */
function getOfferedPlanes(schemaName: string, projectRoot?: string): Plane[] {
  try {
    return resolveSpecModel(resolveSchema(schemaName, projectRoot)).planes;
  } catch {
    return [];
  }
}

/** A one-line summary of a plane purpose for the picker (first sentence). */
function planeSummary(purpose: string): string {
  const oneLine = purpose.replace(/\s+/g, ' ').trim();
  const firstSentence = oneLine.split(/(?<=[.:])\s/)[0];
  return firstSentence.length > 72 ? `${firstSentence.slice(0, 69)}...` : firstSentence;
}

const PROGRESS_SPINNER = {
  interval: 80,
  frames: ['░░░', '▒░░', '▒▒░', '▒▒▒', '▓▒▒', '▓▓▒', '▓▓▓', '▒▓▓', '░▒▓'],
};

const WORKFLOW_TO_SKILL_DIR: Record<string, string> = {
  'explore': 'specbase-explore',
  'new': 'specbase-new-change',
  'continue': 'specbase-continue-change',
  'apply': 'specbase-apply-change',
  'update': 'specbase-update-change',
  'ff': 'specbase-ff-change',
  'sync': 'specbase-sync-specs',
  'archive': 'specbase-archive-change',
  'bulk-archive': 'specbase-bulk-archive-change',
  'verify': 'specbase-verify-change',
  'onboard': 'specbase-onboard',
  'propose': 'specbase-propose',
  // Governed-only, not a profile workflow; present here so delivery switches can
  // still sweep its skill directory.
  'review-panel': 'specbase-review-panel',
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type InitCommandOptions = {
  tools?: string;
  force?: boolean;
  interactive?: boolean;
  profile?: string;
};

// -----------------------------------------------------------------------------
// Init Command Class
// -----------------------------------------------------------------------------

export class InitCommand {
  private readonly toolsArg?: string;
  private readonly force: boolean;
  private readonly interactiveOption?: boolean;
  private readonly profileOverride?: string;

  constructor(options: InitCommandOptions = {}) {
    this.toolsArg = options.tools;
    this.force = options.force ?? false;
    this.interactiveOption = options.interactive;
    this.profileOverride = options.profile;
  }

  async execute(targetPath: string): Promise<void> {
    const projectPath = path.resolve(targetPath);
    // Resolve the planning dir name for this project: an existing specbase/
    // root keeps its name (extend), a fresh project initializes specbase/.
    const specbaseDir = resolvePlanningDirName(projectPath);
    const specbasePath = path.join(projectPath, specbaseDir);

    // Validation happens silently in the background
    const extendMode = await this.validate(projectPath, specbasePath);

    // Pointer guard (slice 3.2): a config-only specbase/ with a store:
    // declaration is externalized planning, not a root to extend — and a
    // subdirectory of such a repo must not silently grow a nested root.
    // Refuse before legacy cleanup, migration, or prompts touch anything.
    // In extend mode the walk finds projectPath itself; otherwise it
    // finds the nearest ancestor root (so pointer-repo subdirectories
    // refuse exactly where a normal command would resolve the pointer).
    const guardRoot = findRepoPlanningRootSync(projectPath);
    if (guardRoot) {
      const { hasPlanningShape, pointer } = classifySpecbaseDir(guardRoot);
      if (!hasPlanningShape) {
        if (pointer.malformed) {
          throw new Error(
            `The store declaration in ${pointer.filePath} is invalid (` +
              storePointerProblem(pointer.malformed) +
              `). Fix or remove the store: line before running specbase init.`
          );
        }
        if (pointer.value !== undefined) {
          throw new Error(
            `This repo's planning is externalized to store '${pointer.value}' (${pointer.filePath}). ` +
              `Remove the store: line first to convert this repo to a local Specbase root.`
          );
        }
      }
    }

    // Check for legacy artifacts and handle cleanup
    await this.handleLegacyCleanup(projectPath, extendMode);

    // Detect available tools in the project (task 7.1)
    const detectedTools = getAvailableTools(projectPath);

    // Migration check: migrate existing projects to profile system (task 7.3)
    if (extendMode) {
      migrateIfNeeded(projectPath, detectedTools);
    }

    // Show animated welcome screen (interactive mode only)
    const canPrompt = this.canPromptInteractively();
    if (canPrompt) {
      const { showWelcomeScreen } = await import('../ui/welcome-screen.js');
      await showWelcomeScreen();
    }

    // Validate profile override early so invalid values fail before tool setup.
    // The resolved value is consumed later when generation reads effective config.
    this.resolveProfileOverride();

    // Get tool states before processing
    const toolStates = getToolStates(projectPath);

    // Get tool selection (pass detected tools for pre-selection)
    const selectedToolIds = await this.getSelectedTools(toolStates, extendMode, detectedTools, projectPath);

    // Validate selected tools
    const validatedTools = this.validateTools(selectedToolIds, toolStates);

    // Create directory structure
    await this.createDirectoryStructure(specbasePath, extendMode);

    // Plane picker (fresh, interactive init only). Selecting one or more planes
    // makes the project governed; selecting none keeps the flat setup
    // byte-identical to before. The selection determines the schema written to
    // config and which baseline specs are planted.
    const planeSelection = await this.promptPlaneSelection(extendMode);

    // Create config.yaml BEFORE generating skills: skill generation reads the
    // resolved spec model from the on-disk config, so the governed schema must
    // be written first for governed skills/commands to be emitted.
    const configStatus = await this.createConfig(specbasePath, extendMode, planeSelection);

    // Generate skills and commands for each tool
    const results = await this.generateSkillsAndCommands(projectPath, validatedTools);

    // Plant baseline spec pairs as bootstrap scaffolding when a governed plane
    // was selected. The plane-parametric planter copies each pair from the
    // schema's baseline templates to specs/<plane>/<locator> (idempotent; never
    // overwrites a customized baseline).
    const baselinePairs: BaselinePair[] = [];
    if (planeSelection.governed && planeSelection.selectedIds.includes('agents')) {
      baselinePairs.push({ plane: 'agents', locator: 'spec-driven' });
      baselinePairs.push({ plane: 'agents', locator: 'review-panel' });
    }

    // The STE bundle (agents/ste-writing + ops/ste) is a separate opt-in,
    // gated the same shape as the agentic-review baseline: accepted, it plants
    // the whole bundle; declined, it plants none of it. Never imposed.
    if (planeSelection.governed && (await this.promptSteOptIn())) {
      baselinePairs.push({ plane: 'agents', locator: 'ste-writing' });
      baselinePairs.push({ plane: 'ops', locator: 'ste' });
    }

    if (baselinePairs.length > 0) {
      await plantBaselines(projectPath, baselinePairs);
    }

    // Display success message
    this.displaySuccessMessage(projectPath, validatedTools, results, configStatus);
  }

  // ═══════════════════════════════════════════════════════════
  // VALIDATION & SETUP
  // ═══════════════════════════════════════════════════════════

  private async validate(
    projectPath: string,
    specbasePath: string
  ): Promise<boolean> {
    const extendMode = await FileSystemUtils.directoryExists(specbasePath);

    // Check write permissions
    if (!(await FileSystemUtils.ensureWritePermissions(projectPath))) {
      throw new Error(`Insufficient permissions to write to ${projectPath}`);
    }
    return extendMode;
  }

  private canPromptInteractively(): boolean {
    if (this.interactiveOption === false) return false;
    if (this.toolsArg !== undefined) return false;
    return isInteractive({ interactive: this.interactiveOption });
  }

  private resolveProfileOverride(): Profile | undefined {
    if (this.profileOverride === undefined) {
      return undefined;
    }

    if (this.profileOverride === 'core' || this.profileOverride === 'custom') {
      return this.profileOverride;
    }

    throw new Error(`Invalid profile "${this.profileOverride}". Available profiles: core, custom`);
  }

  // ═══════════════════════════════════════════════════════════
  // LEGACY CLEANUP
  // ═══════════════════════════════════════════════════════════

  private async handleLegacyCleanup(projectPath: string, extendMode: boolean): Promise<void> {
    // Detect legacy artifacts
    const detection = await detectLegacyArtifacts(projectPath);

    if (!detection.hasLegacyArtifacts) {
      return; // No legacy artifacts found
    }

    // Show what was detected
    console.log();
    console.log(formatDetectionSummary(detection));
    console.log();

    const canPrompt = this.canPromptInteractively();

    if (this.force || !canPrompt) {
      // --force flag or non-interactive mode: proceed with cleanup automatically.
      // Legacy slash commands are 100% Specbase-managed, and config file cleanup
      // only removes markers (never deletes files), so auto-cleanup is safe.
      await this.performLegacyCleanup(projectPath, detection);
      return;
    }

    // Interactive mode: prompt for confirmation
    const { confirm } = await import('@inquirer/prompts');
    const shouldCleanup = await confirm({
      message: 'Upgrade and clean up legacy files?',
      default: true,
    });

    if (!shouldCleanup) {
      console.log(chalk.dim('Initialization cancelled.'));
      console.log(chalk.dim('Run with --force to skip this prompt, or manually remove legacy files.'));
      process.exit(0);
    }

    await this.performLegacyCleanup(projectPath, detection);
  }

  private async performLegacyCleanup(projectPath: string, detection: LegacyDetectionResult): Promise<void> {
    const spinner = ora('Cleaning up legacy files...').start();

    const result = await cleanupLegacyArtifacts(projectPath, detection);

    spinner.succeed('Legacy files cleaned up');

    const summary = formatCleanupSummary(result);
    if (summary) {
      console.log();
      console.log(summary);
    }

    console.log();
  }

  // ═══════════════════════════════════════════════════════════
  // TOOL SELECTION
  // ═══════════════════════════════════════════════════════════

  private async getSelectedTools(
    toolStates: Map<string, ToolSkillStatus>,
    extendMode: boolean,
    detectedTools: AIToolOption[],
    projectPath: string
  ): Promise<string[]> {
    // Check for --tools flag first
    const nonInteractiveSelection = this.resolveToolsArg();
    if (nonInteractiveSelection !== null) {
      return nonInteractiveSelection;
    }

    const validTools = getToolsWithSkillsDir();
    const detectedToolIds = new Set(detectedTools.map((t) => t.value));
    const configuredToolIds = new Set(
      [...toolStates.entries()]
        .filter(([, status]) => status.configured)
        .map(([toolId]) => toolId)
    );
    const shouldPreselectDetected = !extendMode && configuredToolIds.size === 0;
    const canPrompt = this.canPromptInteractively();

    // Non-interactive mode: use detected tools as fallback (task 7.8)
    if (!canPrompt) {
      if (detectedToolIds.size > 0) {
        return [...detectedToolIds];
      }
      throw new Error(
        `No tools detected and no --tools flag provided. Valid tools:\n  ${validTools.join('\n  ')}\n\nUse --tools all, --tools none, or --tools claude,cursor,...`
      );
    }

    if (validTools.length === 0) {
      throw new Error(
        `No tools available for skill generation.`
      );
    }

    // Interactive mode: show searchable multi-select
    const { searchableMultiSelect } = await import('../prompts/searchable-multi-select.js');

    // Build choices: pre-select configured tools; keep detected tools visible but unselected.
    const sortedChoices = validTools
      .map((toolId) => {
        const tool = AI_TOOLS.find((t) => t.value === toolId);
        const status = toolStates.get(toolId);
        const configured = status?.configured ?? false;
        const detected = detectedToolIds.has(toolId);

        return {
          name: tool?.name || toolId,
          value: toolId,
          configured,
          detected: detected && !configured,
          preSelected: configured || (shouldPreselectDetected && detected && !configured),
        };
      })
      .sort((a, b) => {
        // Configured tools first, then detected (not configured), then everything else.
        if (a.configured && !b.configured) return -1;
        if (!a.configured && b.configured) return 1;
        if (a.detected && !b.detected) return -1;
        if (!a.detected && b.detected) return 1;
        return 0;
      });

    const configuredNames = validTools
      .filter((toolId) => configuredToolIds.has(toolId))
      .map((toolId) => AI_TOOLS.find((t) => t.value === toolId)?.name || toolId);

    if (configuredNames.length > 0) {
      console.log(`Specbase configured: ${configuredNames.join(', ')} (pre-selected)`);
    }

    const detectedOnlyNames = detectedTools
      .filter((tool) => !configuredToolIds.has(tool.value))
      .map((tool) => tool.name);

    if (detectedOnlyNames.length > 0) {
      const detectionLabel = shouldPreselectDetected
        ? 'pre-selected for first-time setup'
        : 'not pre-selected';
      console.log(`Detected tool directories: ${detectedOnlyNames.join(', ')} (${detectionLabel})`);
    }

    const selectedTools = await searchableMultiSelect({
      message: `Select tools to set up (${validTools.length} available)`,
      pageSize: 15,
      choices: sortedChoices,
      validate: (selected: string[]) => selected.length > 0 || 'Select at least one tool',
    });

    if (selectedTools.length === 0) {
      throw new Error('At least one tool must be selected');
    }

    return selectedTools;
  }

  private resolveToolsArg(): string[] | null {
    if (typeof this.toolsArg === 'undefined') {
      return null;
    }

    const raw = this.toolsArg.trim();
    if (raw.length === 0) {
      throw new Error(
        'The --tools option requires a value. Use "all", "none", or a comma-separated list of tool IDs.'
      );
    }

    const availableTools = getToolsWithSkillsDir();
    const availableSet = new Set(availableTools);
    const availableList = ['all', 'none', ...availableTools].join(', ');

    const lowerRaw = raw.toLowerCase();
    if (lowerRaw === 'all') {
      return availableTools;
    }

    if (lowerRaw === 'none') {
      return [];
    }

    const tokens = raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    if (tokens.length === 0) {
      throw new Error(
        'The --tools option requires at least one tool ID when not using "all" or "none".'
      );
    }

    const normalizedTokens = tokens.map((token) => token.toLowerCase());

    if (normalizedTokens.some((token) => token === 'all' || token === 'none')) {
      throw new Error('Cannot combine reserved values "all" or "none" with specific tool IDs.');
    }

    const invalidTokens = tokens.filter(
      (_token, index) => !availableSet.has(normalizedTokens[index])
    );

    if (invalidTokens.length > 0) {
      throw new Error(
        `Invalid tool(s): ${invalidTokens.join(', ')}. Available values: ${availableList}`
      );
    }

    // Deduplicate while preserving order
    const deduped: string[] = [];
    for (const token of normalizedTokens) {
      if (!deduped.includes(token)) {
        deduped.push(token);
      }
    }

    return deduped;
  }

  private validateTools(
    toolIds: string[],
    toolStates: Map<string, ToolSkillStatus>
  ): Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> {
    const validatedTools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }> = [];

    for (const toolId of toolIds) {
      const tool = AI_TOOLS.find((t) => t.value === toolId);
      if (!tool) {
        const validToolIds = getToolsWithSkillsDir();
        throw new Error(
          `Unknown tool '${toolId}'. Valid tools:\n  ${validToolIds.join('\n  ')}`
        );
      }

      if (!tool.skillsDir) {
        const validToolsWithSkills = getToolsWithSkillsDir();
        throw new Error(
          `Tool '${toolId}' does not support skill generation.\nTools with skill generation support:\n  ${validToolsWithSkills.join('\n  ')}`
        );
      }

      const preState = toolStates.get(tool.value);
      validatedTools.push({
        value: tool.value,
        name: tool.name,
        skillsDir: tool.skillsDir,
        wasConfigured: preState?.configured ?? false,
      });
    }

    return validatedTools;
  }

  // ═══════════════════════════════════════════════════════════
  // DIRECTORY STRUCTURE
  // ═══════════════════════════════════════════════════════════

  private async createDirectoryStructure(specbasePath: string, extendMode: boolean): Promise<void> {
    if (extendMode) {
      // In extend mode, just ensure directories exist without spinner
      const directories = [
        specbasePath,
        path.join(specbasePath, 'specs'),
        path.join(specbasePath, 'changes'),
        path.join(specbasePath, 'changes', 'archive'),
        path.join(specbasePath, 'ideas'),
      ];

      for (const dir of directories) {
        await FileSystemUtils.createDirectory(dir);
      }
      return;
    }

    const spinner = this.startSpinner('Creating Specbase structure...');

    const directories = [
      specbasePath,
      path.join(specbasePath, 'specs'),
      path.join(specbasePath, 'changes'),
      path.join(specbasePath, 'changes', 'archive'),
      // The idea catalogue: an ungoverned scratchpad surface that feeds
      // the pipeline. Planted empty here so ideas/ has a first-class home.
      path.join(specbasePath, 'ideas'),
    ];

    for (const dir of directories) {
      await FileSystemUtils.createDirectory(dir);
    }

    spinner.stopAndPersist({
      symbol: PALETTE.white('▌'),
      text: PALETTE.white('Specbase structure created'),
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SKILL & COMMAND GENERATION
  // ═══════════════════════════════════════════════════════════

  private async generateSkillsAndCommands(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>
  ): Promise<{
    createdTools: typeof tools;
    refreshedTools: typeof tools;
    failedTools: Array<{ name: string; error: Error }>;
    commandsSkipped: string[];
    removedCommandCount: number;
    removedSkillCount: number;
  }> {
    const createdTools: typeof tools = [];
    const refreshedTools: typeof tools = [];
    const failedTools: Array<{ name: string; error: Error }> = [];
    const commandsSkipped: string[] = [];
    let removedCommandCount = 0;
    let removedSkillCount = 0;

    // Read global config for profile and delivery settings (use --profile override if set)
    const globalConfig = getGlobalConfig();
    const profile: Profile = this.resolveProfileOverride() ?? globalConfig.profile ?? 'core';
    const delivery: Delivery = globalConfig.delivery ?? 'both';
    const workflows = getProfileWorkflows(profile, globalConfig.workflows);

    // Get skill and command templates filtered by profile workflows
    const shouldGenerateSkills = delivery !== 'commands';
    const shouldGenerateCommands = delivery !== 'skills';
    // Gate governed workflow guidance on the project's declared spec model
    // (legacy fallback keeps default/legacy output byte-identical).
    const specModel = resolveProjectSpecModel(projectPath);
    const skillTemplates = shouldGenerateSkills ? getSkillTemplates(workflows, specModel) : [];
    const commandContents = shouldGenerateCommands ? getCommandContents(workflows, specModel) : [];

    // Process each tool
    for (const tool of tools) {
      const spinner = ora(`Setting up ${tool.name}...`).start();

      try {
        // Generate skill files if delivery includes skills
        if (shouldGenerateSkills) {
          // Use tool-specific skillsDir
          const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');

          // Create skill directories and SKILL.md files
          for (const { template, dirName } of skillTemplates) {
            const skillDir = path.join(skillsDir, dirName);
            const skillFile = path.join(skillDir, 'SKILL.md');

            // Generate SKILL.md content with YAML frontmatter including generatedBy
            // Use hyphen-based command references for tools where filename === command name (oh-my-pi, opencode, pi)
            const transformer = (tool.value === 'opencode' || tool.value === 'pi' || tool.value === 'oh-my-pi') ? transformToHyphenCommands : undefined;
            const skillContent = generateSkillContent(template, SPECBASE_VERSION, transformer);

            // Write the skill file
            await FileSystemUtils.writeFile(skillFile, skillContent);
          }
        }
        if (!shouldGenerateSkills) {
          const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
          removedSkillCount += await this.removeSkillDirs(skillsDir);
        }

        // Generate commands if delivery includes commands
        if (shouldGenerateCommands) {
          const adapter = CommandAdapterRegistry.get(tool.value);
          if (adapter) {
            const generatedCommands = generateCommands(commandContents, adapter);

            for (const cmd of generatedCommands) {
              const commandFile = path.isAbsolute(cmd.path) ? cmd.path : path.join(projectPath, cmd.path);
              await FileSystemUtils.writeFile(commandFile, cmd.fileContent);
            }
          } else {
            commandsSkipped.push(tool.value);
          }
        }
        if (!shouldGenerateCommands) {
          removedCommandCount += await this.removeCommandFiles(projectPath, tool.value);
        }

        spinner.succeed(`Setup complete for ${tool.name}`);

        if (tool.wasConfigured) {
          refreshedTools.push(tool);
        } else {
          createdTools.push(tool);
        }
      } catch (error) {
        spinner.fail(`Failed for ${tool.name}`);
        failedTools.push({ name: tool.name, error: error as Error });
      }
    }

    return {
      createdTools,
      refreshedTools,
      failedTools,
      commandsSkipped,
      removedCommandCount,
      removedSkillCount,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIG FILE
  // ═══════════════════════════════════════════════════════════

  private async createConfig(
    specbasePath: string,
    extendMode: boolean,
    selection: PlaneSelection = { governed: false, planes: [], selectedIds: [] }
  ): Promise<'created' | 'exists' | 'skipped'> {
    const configPath = path.join(specbasePath, 'config.yaml');
    const configYmlPath = path.join(specbasePath, 'config.yml');
    const configYamlExists = fs.existsSync(configPath);
    const configYmlExists = fs.existsSync(configYmlPath);

    if (configYamlExists || configYmlExists) {
      return 'exists';
    }


    try {
      const schema = selection.governed ? GOVERNED_SCHEMA : DEFAULT_SCHEMA;
      const config: Partial<ProjectConfig> = { schema };
      // Seed the full selected plane set into config as an authoritative
      // `planes:` replace-list, so config.yaml alone describes this project's
      // governed planes (no reliance on the schema's defaults staying implicit).
      // A zero-plane (flat) selection writes no plane list.
      if (selection.governed && selection.planes.length > 0) {
        config.specModel = { planes: selection.planes };
      }
      const yamlContent = serializeConfig(config);
      await FileSystemUtils.writeFile(configPath, yamlContent);
      return 'created';
    } catch {
      return 'skipped';
    }
  }

  /**
   * Present the schema's offered planes as one multi-select (Space toggles,
   * `a` toggles all). Selecting one or more planes makes the project governed;
   * selecting none leaves it flat. Only offered on a fresh, interactive init
   * (extend mode keeps the existing config; non-interactive/force keeps the flat
   * default), so a non-prompting init returns the empty (flat) selection.
   */
  private async promptPlaneSelection(extendMode: boolean): Promise<PlaneSelection> {
    const none: PlaneSelection = { governed: false, planes: [], selectedIds: [] };
    if (extendMode || this.force || !this.canPromptInteractively()) return none;

    const offered = getOfferedPlanes(GOVERNED_SCHEMA);
    if (offered.length === 0) return none;

    const { checkbox } = await import('@inquirer/prompts');
    const selectedIds = await checkbox({
      message:
        'Select spec planes to govern (Space toggles, a toggles all). Select none for a plain flat project:',
      choices: offered.map((p) => ({
        name: `${p.id} — ${planeSummary(p.purpose)}`,
        value: p.id,
        checked: p.defaultSelected,
      })),
    });

    const planes = offered.filter((p) => selectedIds.includes(p.id));
    return { governed: planes.length > 0, planes, selectedIds };
  }

  /**
   * Plant the agents-plane baseline pairs as bootstrap scaffolding: the
   * `spec-driven` self-hosting spec always, and `review-panel` when agentic
   * review was accepted. Routes through the plane-parametric `plantBaselines`
   * so the agents call site stays a single caller of the general routine.
   */
  private async plantAgentsBaseline(projectPath: string, agenticReview: boolean): Promise<void> {
    const pairs: BaselinePair[] = [{ plane: 'agents', locator: 'spec-driven' }];
    if (agenticReview) {
      pairs.push({ plane: 'agents', locator: 'review-panel' });
    }
    await plantBaselines(projectPath, pairs);
  }

  /**
   * Opt-in STE baseline prompt, gated the same shape as the agentic-review
   * selection: accepted, the planter plants the whole STE bundle
   * (`agents/ste-writing` + `ops/ste`); declined, it plants none of it. Only
   * offered on an interactive governed init, so a non-prompting run never
   * imposes the baseline.
   */
  private async promptSteOptIn(): Promise<boolean> {
    if (!this.canPromptInteractively()) return false;
    const { confirm } = await import('@inquirer/prompts');
    return confirm({
      message:
        'Adopt the Simplified Technical English (STE) writing baseline (agents/ste-writing + ops/ste) for this project?',
      default: false,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // UI & OUTPUT
  // ═══════════════════════════════════════════════════════════

  private displaySuccessMessage(
    projectPath: string,
    tools: Array<{ value: string; name: string; skillsDir: string; wasConfigured: boolean }>,
    results: {
      createdTools: typeof tools;
      refreshedTools: typeof tools;
      failedTools: Array<{ name: string; error: Error }>;
      commandsSkipped: string[];
      removedCommandCount: number;
      removedSkillCount: number;
    },
    configStatus: 'created' | 'exists' | 'skipped'
  ): void {
    console.log();
    console.log(chalk.bold('Specbase Setup Complete'));
    console.log();

    // Show created vs refreshed tools
    if (results.createdTools.length > 0) {
      console.log(`Created: ${results.createdTools.map((t) => t.name).join(', ')}`);
    }
    if (results.refreshedTools.length > 0) {
      console.log(`Refreshed: ${results.refreshedTools.map((t) => t.name).join(', ')}`);
    }

    // Show counts (respecting profile filter)
    const successfulTools = [...results.createdTools, ...results.refreshedTools];
    if (successfulTools.length > 0) {
      const globalConfig = getGlobalConfig();
      const profile: Profile = (this.profileOverride as Profile) ?? globalConfig.profile ?? 'core';
      const delivery: Delivery = globalConfig.delivery ?? 'both';
      const workflows = getProfileWorkflows(profile, globalConfig.workflows);
      const toolDirs = [...new Set(successfulTools.map((t) => t.skillsDir))].join(', ');
      // Resolve the spec model here too: under the governed model an extra
      // governed-only skill/command (review-panel) is written, so counting
      // without it would under-report what was just generated.
      const reportedSpecModel = resolveProjectSpecModel(projectPath);
      const skillCount =
        delivery !== 'commands'
          ? getSkillTemplates(workflows, reportedSpecModel).length
          : 0;
      const commandCount =
        delivery !== 'skills'
          ? getCommandContents(workflows, reportedSpecModel).length
          : 0;
      if (skillCount > 0 && commandCount > 0) {
        console.log(`${skillCount} skills and ${commandCount} commands in ${toolDirs}/`);
      } else if (skillCount > 0) {
        console.log(`${skillCount} skills in ${toolDirs}/`);
      } else if (commandCount > 0) {
        console.log(`${commandCount} commands in ${toolDirs}/`);
      }
    }

    // Show failures
    if (results.failedTools.length > 0) {
      console.log(chalk.red(`Failed: ${results.failedTools.map((f) => `${f.name} (${f.error.message})`).join(', ')}`));
    }

    // Show skipped commands
    if (results.commandsSkipped.length > 0) {
      console.log(chalk.dim(`Commands skipped for: ${results.commandsSkipped.join(', ')} (no adapter)`));
    }
    if (results.removedCommandCount > 0) {
      console.log(chalk.dim(`Removed: ${results.removedCommandCount} command files (delivery: skills)`));
    }
    if (results.removedSkillCount > 0) {
      console.log(chalk.dim(`Removed: ${results.removedSkillCount} skill directories (delivery: commands)`));
    }

    // Config status
    const planningDirName = resolvePlanningDirName(projectPath);
    if (configStatus === 'created') {
      const createdSchema =
        resolveProjectSpecModel(projectPath).kind === 'governed' ? GOVERNED_SCHEMA : DEFAULT_SCHEMA;
      console.log(`Config: ${planningDirName}/config.yaml (schema: ${createdSchema})`);
    } else if (configStatus === 'exists') {
      // Show actual filename (config.yaml or config.yml)
      const configYaml = path.join(projectPath, planningDirName, 'config.yaml');
      const configYml = path.join(projectPath, planningDirName, 'config.yml');
      const configName = fs.existsSync(configYaml) ? 'config.yaml' : fs.existsSync(configYml) ? 'config.yml' : 'config.yaml';
      console.log(`Config: ${planningDirName}/${configName} (exists)`);
    } else {
      console.log(chalk.dim(`Config: skipped (non-interactive mode)`));
    }

    // Getting started (task 7.6: show propose if in profile)
    const globalCfg = getGlobalConfig();
    const activeProfile: Profile = (this.profileOverride as Profile) ?? globalCfg.profile ?? 'core';
    const activeWorkflows = [...getProfileWorkflows(activeProfile, globalCfg.workflows)];
    console.log();
    if (activeWorkflows.includes('propose')) {
      console.log(chalk.bold('Getting started:'));
      console.log('  Start your first change: /spcb:propose "your idea"');
    } else if (activeWorkflows.includes('new')) {
      console.log(chalk.bold('Getting started:'));
      console.log('  Start your first change: /spcb:new "your idea"');
    } else {
      console.log("Done. Run 'specbase config profile' to configure your workflows.");
    }

    // Links
    console.log();
    console.log(`Learn more: ${chalk.cyan('https://github.com/AwareByDefault/specbase')}`);
    console.log(`Feedback:   ${chalk.cyan('https://github.com/AwareByDefault/specbase/issues')}`);

    // Restart instruction if any tools were configured
    if (results.createdTools.length > 0 || results.refreshedTools.length > 0) {
      console.log();
      console.log(chalk.white('Restart your IDE for slash commands to take effect.'));
    }

    console.log();
  }

  private startSpinner(text: string) {
    return ora({
      text,
      stream: process.stdout,
      color: 'gray',
      spinner: PROGRESS_SPINNER,
    }).start();
  }

  private async removeSkillDirs(skillsDir: string): Promise<number> {
    let removed = 0;

    // `review-panel` is every-model and deliberately absent from ALL_WORKFLOWS
    // (see skill-generation.ts), so it must be swept explicitly — otherwise
    // switching delivery to `commands` would strand its skill directory.
    for (const workflow of [...ALL_WORKFLOWS, 'review-panel']) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      if (!dirName) continue;

      const skillDir = path.join(skillsDir, dirName);
      try {
        if (fs.existsSync(skillDir)) {
          await fs.promises.rm(skillDir, { recursive: true, force: true });
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }

  private async removeCommandFiles(projectPath: string, toolId: string): Promise<number> {
    let removed = 0;
    const adapter = CommandAdapterRegistry.get(toolId);
    if (!adapter) return 0;

    // Every-model `review-panel` swept explicitly; see removeSkillDirs.
    for (const workflow of [...ALL_WORKFLOWS, 'review-panel']) {
      const cmdPath = adapter.getFilePath(workflow);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
          removed++;
        }
      } catch {
        // Ignore errors
      }
    }

    return removed;
  }
}

/**
 * A baseline pair to plant: the plane and locator of an opt-in baseline spec
 * pair, copied from `templates/baseline/<plane>/<locator>` to
 * `specs/<plane>/<locator>`.
 */
export interface BaselinePair {
  plane: string;
  locator: string;
}

/**
 * The plane-parametric baseline planter (`architecture.baseline-planting`).
 * It plants a declared set of `{plane, locator}` baseline pairs across whichever
 * planes each pair names, copying each `spec.md` + `enforcement.md` from the
 * governed schema's `templates/baseline/<plane>/<locator>` into
 * `<planningDir>/specs/<plane>/<locator>`, with no change entry.
 *
 * Idempotent and non-destructive: an already-present target file is left
 * untouched (never overwritten, reset, or duplicated), so a customized baseline
 * survives re-initialization.
 */
export async function plantBaselines(
  projectPath: string,
  pairs: BaselinePair[],
  schemaName: string = GOVERNED_SCHEMA
): Promise<void> {
  const schemaDir = getSchemaDir(schemaName, projectPath);
  if (!schemaDir || pairs.length === 0) return;
  const planningDirName = resolvePlanningDirName(projectPath);
  for (const { plane, locator } of pairs) {
    for (const file of BASELINE_FILES) {
      const src = path.join(schemaDir, 'templates', 'baseline', plane, locator, file);
      const dest = path.join(projectPath, planningDirName, 'specs', plane, locator, file);
      if (fs.existsSync(dest) || !fs.existsSync(src)) continue;
      await FileSystemUtils.writeFile(dest, fs.readFileSync(src, 'utf-8'));
    }
  }
}

/** The files a baseline pair comprises. A directory without these is a namespace, not a pair. */
const BASELINE_FILES = ['spec.md', 'enforcement.yaml'] as const;