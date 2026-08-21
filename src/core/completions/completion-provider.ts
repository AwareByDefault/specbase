import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getActiveChangeIds, getSpecIds } from '../../utils/item-discovery.js';
import { listSchemas } from '../artifact-graph/index.js';
import { listStackManifests, readWorkItemId } from '../change-stacks/store.js';
import { planningDir } from '../planning-dir.js';
import { listIdeas } from '../ideas/store.js';

/**
 * Cache entry for completion data
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Provides dynamic completion suggestions for Specbase items (changes and specs).
 * Implements a 2-second cache to avoid excessive file system operations during
 * tab completion.
 */
export class CompletionProvider {
  private readonly cacheTTL: number;
  private changeCache: CacheEntry<string[]> | null = null;
  private specCache: CacheEntry<string[]> | null = null;
  private schemaCache: CacheEntry<string[]> | null = null;
  private stackCache: CacheEntry<string[]> | null = null;
  private ideaCache: CacheEntry<string[]> | null = null;

  /**
   * Creates a new completion provider
   *
   * @param cacheTTLMs - Cache time-to-live in milliseconds (default: 2000ms)
   * @param projectRoot - Project root directory (default: process.cwd())
   */
  constructor(
    private readonly cacheTTLMs: number = 2000,
    private readonly projectRoot: string = process.cwd()
  ) {
    this.cacheTTL = cacheTTLMs;
  }

  /**
   * Get all active change IDs for completion
   *
   * @returns Array of change IDs
   */
  async getChangeIds(): Promise<string[]> {
    const now = Date.now();

    // Check if cache is valid
    if (this.changeCache && now - this.changeCache.timestamp < this.cacheTTL) {
      return this.changeCache.data;
    }

    // Fetch fresh data
    const changeIds = await getActiveChangeIds(this.projectRoot);

    // Update cache
    this.changeCache = {
      data: changeIds,
      timestamp: now,
    };

    return changeIds;
  }

  /**
   * Get all spec IDs for completion
   *
   * @returns Array of spec IDs
   */
  async getSpecIds(): Promise<string[]> {
    const now = Date.now();

    // Check if cache is valid
    if (this.specCache && now - this.specCache.timestamp < this.cacheTTL) {
      return this.specCache.data;
    }

    // Fetch fresh data
    const specIds = await getSpecIds(this.projectRoot);

    // Update cache
    this.specCache = {
      data: specIds,
      timestamp: now,
    };

    return specIds;
  }

  /**
   * Get all schema names for completion
   *
   * @returns Array of schema names
   */
  async getSchemaNames(): Promise<string[]> {
    const now = Date.now();

    // Check if cache is valid
    if (this.schemaCache && now - this.schemaCache.timestamp < this.cacheTTL) {
      return this.schemaCache.data;
    }

    // Fetch fresh data
    const schemaNames = listSchemas(this.projectRoot);

    // Update cache
    this.schemaCache = {
      data: schemaNames,
      timestamp: now,
    };

    return schemaNames;
  }

  async getStackIds(): Promise<string[]> {
    const now = Date.now();
    if (this.stackCache && now - this.stackCache.timestamp < this.cacheTTL) return this.stackCache.data;
    const data = (await listStackManifests(this.projectRoot)).map((stack) => stack.id);
    this.stackCache = { data, timestamp: now };
    return data;
  }

  async getIdeaIds(): Promise<string[]> {
    const now = Date.now();
    if (this.ideaCache && now - this.ideaCache.timestamp < this.cacheTTL) return this.ideaCache.data;
    const data = (await listIdeas(this.projectRoot)).map((idea) => idea.id).sort();
    this.ideaCache = { data, timestamp: now };
    return data;
  }

  async getWorkItemIds(): Promise<string[]> {
    const archiveHome = path.join(planningDir(this.projectRoot), 'changes', 'archive');
    let archived: string[] = [];
    try {
      const entries = await fs.readdir(archiveHome, { withFileTypes: true });
      archived = (await Promise.all(entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(async (entry) => readWorkItemId(
          path.join(archiveHome, entry.name),
          entry.name.replace(/^\d{4}-\d{2}-\d{2}-/, '')
        ).catch(() => null))))
        .filter((id): id is string => id !== null);
    } catch { /* young roots may omit archive */ }
    const [changeDirectories, ideas] = await Promise.all([this.getChangeIds(), this.getIdeaIds()]);
    const changes = (await Promise.all(changeDirectories.map(async (directory) => readWorkItemId(
      path.join(planningDir(this.projectRoot), 'changes', directory),
      directory
    ).catch(() => null)))).filter((id): id is string => id !== null);
    return [...new Set([...ideas, ...changes, ...archived])].sort();
  }

  /**
   * Get both change and spec IDs for completion
   *
   * @returns Object with changeIds and specIds arrays
   */
  async getAllIds(): Promise<{ changeIds: string[]; specIds: string[] }> {
    const [changeIds, specIds] = await Promise.all([
      this.getChangeIds(),
      this.getSpecIds(),
    ]);

    return { changeIds, specIds };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.changeCache = null;
    this.specCache = null;
    this.schemaCache = null;
    this.stackCache = null;
    this.ideaCache = null;
  }

  /**
   * Get cache statistics for debugging
   *
   * @returns Cache status information
   */
  getCacheStats(): {
    changeCache: { valid: boolean; age?: number };
    specCache: { valid: boolean; age?: number };
    schemaCache: { valid: boolean; age?: number };
  } {
    const now = Date.now();

    return {
      changeCache: {
        valid: this.changeCache !== null && now - this.changeCache.timestamp < this.cacheTTL,
        age: this.changeCache ? now - this.changeCache.timestamp : undefined,
      },
      specCache: {
        valid: this.specCache !== null && now - this.specCache.timestamp < this.cacheTTL,
        age: this.specCache ? now - this.specCache.timestamp : undefined,
      },
      schemaCache: {
        valid: this.schemaCache !== null && now - this.schemaCache.timestamp < this.cacheTTL,
        age: this.schemaCache ? now - this.schemaCache.timestamp : undefined,
      },
    };
  }
}
