import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { PLANNING_DIR_NAME, LEGACY_PLANNING_DIR_NAME } from './planning-dir.js';

// Constants
export const GLOBAL_CONFIG_DIR_NAME = 'specbase';
export const GLOBAL_CONFIG_FILE_NAME = 'config.json';
export const GLOBAL_DATA_DIR_NAME = 'specbase';

function directoryExists(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Resolve the global base directory NAME under `parent`, preferring a
 * `specbase` directory, falling back to an existing legacy `openspec`
 * directory, else defaulting to `specbase`. `join` builds the candidate
 * path so callers can supply platform-correct joining.
 */
function resolveGlobalDirName(
  parent: string,
  join: (parent: string, name: string) => string
): string {
  if (directoryExists(join(parent, PLANNING_DIR_NAME))) {
    return PLANNING_DIR_NAME;
  }
  if (directoryExists(join(parent, LEGACY_PLANNING_DIR_NAME))) {
    return LEGACY_PLANNING_DIR_NAME;
  }
  return PLANNING_DIR_NAME;
}

// TypeScript types
export type Profile = 'core' | 'custom';
export type Delivery = 'both' | 'skills' | 'commands';

// TypeScript interfaces
export interface GlobalConfig {
  featureFlags?: Record<string, boolean>;
  profile?: Profile;
  delivery?: Delivery;
  workflows?: string[];
  /** Workset opener rows (slice 7.1); hand-edited, validated on use. */
  openers?: unknown;
}

const DEFAULT_CONFIG: GlobalConfig = {
  featureFlags: {},
  profile: 'core',
  delivery: 'both',
};

/**
 * Resolves the parent directory that holds the global config directory,
 * following the XDG Base Directory Specification.
 */
function getGlobalConfigParentDir(): string {
  // XDG_CONFIG_HOME takes precedence on all platforms when explicitly set
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) {
    return xdgConfigHome;
  }

  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: use %APPDATA%
    const appData = process.env.APPDATA;
    if (appData) {
      return appData;
    }
    // Fallback for Windows if APPDATA is not set
    return path.join(os.homedir(), 'AppData', 'Roaming');
  }

  // Unix/macOS fallback: ~/.config
  return path.join(os.homedir(), '.config');
}

/**
 * Gets the global configuration directory path following XDG Base Directory Specification.
 * Prefers a `specbase` directory, falls back to an existing legacy `openspec`
 * directory, else defaults to `specbase`.
 *
 * - All platforms: $XDG_CONFIG_HOME/specbase/ if XDG_CONFIG_HOME is set
 * - Unix/macOS fallback: ~/.config/specbase/
 * - Windows fallback: %APPDATA%/specbase/
 */
export function getGlobalConfigDir(): string {
  const parent = getGlobalConfigParentDir();
  return path.join(parent, resolveGlobalDirName(parent, path.join));
}

/**
 * Gets the global data directory path following XDG Base Directory Specification.
 * Used for user data like schema overrides.
 *
 * - All platforms: $XDG_DATA_HOME/specbase/ if XDG_DATA_HOME is set
 * - Unix/macOS fallback: ~/.local/share/specbase/
 * - Windows fallback: %LOCALAPPDATA%/specbase/
 */
export interface GlobalDataDirOptions {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  homedir?: string;
}

function joinGlobalDataPath(platform: NodeJS.Platform, ...segments: string[]): string {
  return platform === 'win32'
    ? path.win32.join(...segments)
    : path.posix.join(...segments);
}

export function getGlobalDataDir(options: GlobalDataDirOptions = {}): string {
  const env = options.env ?? process.env;
  const platform = options.platform ?? os.platform();

  // Resolve the base-dir name under `parent`, preferring specbase and falling
  // back to an existing legacy openspec directory.
  const resolveDataDir = (parent: string): string =>
    joinGlobalDataPath(
      platform,
      parent,
      resolveGlobalDirName(parent, (p, name) => joinGlobalDataPath(platform, p, name))
    );

  // XDG_DATA_HOME takes precedence on all platforms when explicitly set
  const xdgDataHome = env.XDG_DATA_HOME;
  if (xdgDataHome) {
    return resolveDataDir(xdgDataHome);
  }

  const homedir = options.homedir ?? os.homedir();

  if (platform === 'win32') {
    // Windows: use %LOCALAPPDATA%
    const localAppData = env.LOCALAPPDATA;
    if (localAppData) {
      return resolveDataDir(localAppData);
    }
    // Fallback for Windows if LOCALAPPDATA is not set
    return resolveDataDir(joinGlobalDataPath(platform, homedir, 'AppData', 'Local'));
  }

  // Unix/macOS fallback: ~/.local/share
  return resolveDataDir(joinGlobalDataPath(platform, homedir, '.local', 'share'));
}

/**
 * Gets the path to the global config file.
 */
export function getGlobalConfigPath(): string {
  return path.join(getGlobalConfigDir(), GLOBAL_CONFIG_FILE_NAME);
}

/**
 * Loads the global configuration from disk.
 * Returns default configuration if file doesn't exist or is invalid.
 * Merges loaded config with defaults to ensure new fields are available.
 */
export function getGlobalConfig(): GlobalConfig {
  const configPath = getGlobalConfigPath();

  try {
    if (!fs.existsSync(configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Merge with defaults (loaded values take precedence)
    const merged: GlobalConfig = {
      ...DEFAULT_CONFIG,
      ...parsed,
      // Deep merge featureFlags
      featureFlags: {
        ...DEFAULT_CONFIG.featureFlags,
        ...(parsed.featureFlags || {})
      }
    };

    // Schema evolution: apply defaults for new fields if not present in loaded config
    if (parsed.profile === undefined) {
      merged.profile = DEFAULT_CONFIG.profile;
    }
    if (parsed.delivery === undefined) {
      merged.delivery = DEFAULT_CONFIG.delivery;
    }

    return merged;
  } catch (error) {
    // Log warning for parse errors, but not for missing files
    if (error instanceof SyntaxError) {
      console.error(`Warning: Invalid JSON in ${configPath}, using defaults`);
    }
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Saves the global configuration to disk.
 * Creates the config directory if it doesn't exist.
 */
export function saveGlobalConfig(config: GlobalConfig): void {
  const configDir = getGlobalConfigDir();
  const configPath = getGlobalConfigPath();

  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
