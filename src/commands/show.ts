import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds, getSpecIds } from '../utils/item-discovery.js';
import {
  resolveRootForCommand,
  toRootOutput,
  withStoreFlag,
  type ResolvedSpecbaseRoot,
  type RootOutput,
  isStoreSelectedRoot,
} from '../core/root-selection.js';
import { ChangeCommand } from './change.js';
import { SpecCommand } from './spec.js';
import { nearestMatches } from '../utils/match.js';
import path from 'path';
import { readFileSync } from 'fs';
import { resolveProjectSpecModel } from '../core/shared/skill-generation.js';
import {
  loadGovernedRepository,
  type GovernedRepository,
} from '../core/governed/index.js';
import {
  resolveGovernedShowTarget,
  analyzeGovernedPair,
  renderGovernedSpecSummary,
} from '../core/artifact-graph/governed-show.js';
import type { GovernedPairRecord } from '../core/schemas/governed-spec.schema.js';
import { planningDir } from '../core/config.js';

type ItemType = 'change' | 'spec';

const CHANGE_FLAG_KEYS = new Set(['deltasOnly', 'requirementsOnly']);
const SPEC_FLAG_KEYS = new Set(['requirements', 'scenarios', 'requirement']);

interface ShowExecuteOptions {
  json?: boolean;
  type?: string;
  noInteractive?: boolean;
  store?: string;
  storePath?: string;
  [k: string]: any;
}

export class ShowCommand {
  async execute(itemName?: string, options: ShowExecuteOptions = {}): Promise<void> {
    const root = await resolveRootForCommand(options, { json: options.json });
    if (!root) {
      return;
    }

    const interactive = isInteractive(options);
    const typeOverride = this.normalizeType(options.type);

    if (!itemName) {
      if (interactive) {
        const { select } = await import('@inquirer/prompts');
        const type = await select<ItemType>({
          message: 'What would you like to show?',
          choices: [
            { name: 'Change', value: 'change' as const },
            { name: 'Spec', value: 'spec' as const },
          ],
        });
        await this.runInteractiveByType(type, options, root);
        return;
      }
      this.printNonInteractiveHint(root);
      process.exitCode = 1;
      return;
    }

    await this.showDirect(itemName, { typeOverride, options, root });
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'spec') return v;
    return undefined;
  }

  private delegateOptions(root: ResolvedSpecbaseRoot, options: ShowExecuteOptions): ShowExecuteOptions & { rootOutput?: RootOutput } {
    return {
      ...options,
      ...(options.json ? { rootOutput: toRootOutput(root) } : {}),
    };
  }

  private async runInteractiveByType(
    type: ItemType,
    options: ShowExecuteOptions,
    root: ResolvedSpecbaseRoot
  ): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    if (type === 'change') {
      const changes = await getActiveChangeIds(root.path);
      if (changes.length === 0) {
        console.error('No changes found.');
        process.exitCode = 1;
        return;
      }
      const picked = await select<string>({ message: 'Pick a change', choices: changes.map(id => ({ name: id, value: id })) });
      const cmd = new ChangeCommand(root.path);
      await cmd.show(picked, this.delegateOptions(root, options) as any);
      return;
    }

    const specs = await getSpecIds(root.path);
    if (specs.length === 0) {
      console.error('No specs found.');
      process.exitCode = 1;
      return;
    }
    const picked = await select<string>({ message: 'Pick a spec', choices: specs.map(id => ({ name: id, value: id })) });
    const cmd = new SpecCommand(root.path);
    await cmd.show(picked, this.delegateOptions(root, options) as any);
  }

  private async showDirect(
    itemName: string,
    params: { typeOverride?: ItemType; options: ShowExecuteOptions; root: ResolvedSpecbaseRoot }
  ): Promise<void> {
    const root = params.root;

    // Governed projects resolve specs by nested plane-qualified locator or
    // stable spec ID; legacy projects keep the flat capability lookup. Changes
    // are unchanged under the governed model, so `--type change` stays legacy.
    const specModel = resolveProjectSpecModel(root.path);
    if (specModel.kind === 'governed' && params.typeOverride !== 'change') {
      await this.showGovernedDirect(itemName, params, specModel.planes.map((p) => p.id));
      return;
    }

    // Optimize lookups when type is pre-specified
    let isChange = false;
    let isSpec = false;
    let changes: string[] = [];
    let specs: string[] = [];
    if (params.typeOverride === 'change') {
      changes = await getActiveChangeIds(root.path);
      isChange = changes.includes(itemName);
    } else if (params.typeOverride === 'spec') {
      specs = await getSpecIds(root.path);
      isSpec = specs.includes(itemName);
    } else {
      [changes, specs] = await Promise.all([getActiveChangeIds(root.path), getSpecIds(root.path)]);
      isChange = changes.includes(itemName);
      isSpec = specs.includes(itemName);
    }

    const resolvedType = params.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);

    if (!resolvedType) {
      const suggestions = nearestMatches(itemName, [...changes, ...specs]);
      const message = suggestions.length
        ? `Unknown item '${itemName}'. Did you mean: ${suggestions.join(', ')}?`
        : `Unknown item '${itemName}'.`;
      if (params.options.json) {
        console.log(
          JSON.stringify(
            { status: [{ severity: 'error', code: 'unknown_item', message }] },
            null,
            2
          )
        );
      } else {
        console.error(message);
      }
      process.exitCode = 1;
      return;
    }

    if (!params.typeOverride && isChange && isSpec) {
      if (params.options.json) {
        console.log(
          JSON.stringify(
            {
              status: [
                {
                  severity: 'error',
                  code: 'ambiguous_item',
                  message: `Ambiguous item '${itemName}' matches both a change and a spec.`,
                  fix: 'Pass --type change|spec.',
                },
              ],
            },
            null,
            2
          )
        );
        process.exitCode = 1;
        return;
      }
      console.error(`Ambiguous item '${itemName}' matches both a change and a spec.`);
      // The noun-form commands are cwd-based and cannot reach a selected store.
      if (isStoreSelectedRoot(root)) {
        console.error('Pass --type change|spec.');
      } else {
        console.error('Pass --type change|spec, or use: specbase change show / specbase spec show');
      }
      process.exitCode = 1;
      return;
    }

    this.warnIrrelevantFlags(resolvedType, params.options);
    if (resolvedType === 'change') {
      const cmd = new ChangeCommand(root.path);
      await cmd.show(itemName, this.delegateOptions(root, params.options) as any);
      return;
    }
    const cmd = new SpecCommand(root.path);
    await cmd.show(itemName, this.delegateOptions(root, params.options) as any);
  }

  /**
   * Resolve and display a governed spec for the top-level `show`. Resolves by
   * plane-qualified locator or stable spec ID (a moved spec still resolves by
   * ID), reports an ambiguous unqualified basename with its candidates, and
   * reuses the legacy change/spec ambiguity handling when a target names both a
   * change and a governed spec. Incomplete pairs are shown with their missing
   * member rather than treated as unresolved.
   */
  private async showGovernedDirect(
    itemName: string,
    params: { typeOverride?: ItemType; options: ShowExecuteOptions; root: ResolvedSpecbaseRoot },
    planes?: string[]
  ): Promise<void> {
    const { typeOverride, options, root } = params;
    const specbaseRoot = planningDir(root.path);
    const repository = await loadGovernedRepository(specbaseRoot, planes);

    // Change detection is unchanged under the governed model.
    let changes: string[] = [];
    let isChange = false;
    if (typeOverride !== 'spec') {
      changes = await getActiveChangeIds(root.path);
      isChange = changes.includes(itemName);
    }

    const resolution = resolveGovernedShowTarget(repository, itemName);
    const specFound = resolution.kind === 'resolved';

    if (typeOverride === 'spec') {
      this.warnIrrelevantFlags('spec', options);
      if (resolution.kind !== 'resolved') {
        this.reportGovernedUnresolved(itemName, resolution, repository, options);
        return;
      }
      await this.renderGovernedSpec(resolution.record, root, options, repository);
      return;
    }

    // No type override: disambiguate a target that names both a change and spec.
    if (isChange && specFound) {
      const message = `Ambiguous item '${itemName}' matches both a change and a spec.`;
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              status: [
                { severity: 'error', code: 'ambiguous_item', message, fix: 'Pass --type change|spec.' },
              ],
            },
            null,
            2
          )
        );
      } else {
        console.error(message);
        if (isStoreSelectedRoot(root)) {
          console.error('Pass --type change|spec.');
        } else {
          console.error('Pass --type change|spec, or use: specbase change show / specbase spec show');
        }
      }
      process.exitCode = 1;
      return;
    }

    if (isChange) {
      this.warnIrrelevantFlags('change', options);
      const cmd = new ChangeCommand(root.path);
      await cmd.show(itemName, this.delegateOptions(root, options) as any);
      return;
    }

    if (resolution.kind === 'resolved') {
      this.warnIrrelevantFlags('spec', options);
      await this.renderGovernedSpec(resolution.record, root, options, repository);
      return;
    }

    this.reportGovernedUnresolved(itemName, resolution, repository, options, changes);
  }

  /** Report an ambiguous basename or an unknown governed target. */
  private reportGovernedUnresolved(
    itemName: string,
    resolution: Exclude<ReturnType<typeof resolveGovernedShowTarget>, { kind: 'resolved' }>,
    repository: GovernedRepository,
    options: ShowExecuteOptions,
    changes: string[] = []
  ): void {
    if (resolution.kind === 'ambiguous-basename') {
      const message =
        `Ambiguous spec '${itemName}' matches multiple governed locators: ${resolution.candidates.join(', ')}.`;
      const fix = 'Use a plane-qualified locator or the stable spec ID.';
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              status: [
                { severity: 'error', code: 'ambiguous_spec', message, fix, candidates: resolution.candidates },
              ],
            },
            null,
            2
          )
        );
      } else {
        console.error(message);
        console.error(fix);
      }
      process.exitCode = 1;
      return;
    }

    const candidates = [
      ...changes,
      ...repository.discovery.pairs.map((p) => p.locator),
      ...repository.indexedPairs.map((p) => p.spec.id).filter((id): id is string => id !== null),
    ];
    const suggestions = nearestMatches(itemName, candidates);
    const message = suggestions.length
      ? `Unknown item '${itemName}'. Did you mean: ${suggestions.join(', ')}?`
      : `Unknown item '${itemName}'.`;
    if (options.json) {
      console.log(
        JSON.stringify({ status: [{ severity: 'error', code: 'unknown_item', message }] }, null, 2)
      );
    } else {
      console.error(message);
    }
    process.exitCode = 1;
  }

  /**
   * Render a resolved governed pair. Text mode is raw-first (the `spec.md`
   * content, then the pair/enforcement/coverage summary); `--json` emits the
   * structured governed view (stable spec ID, plane, locator, native pair paths,
   * requirement/scenario IDs, bindings, and coverage states).
   */
  private async renderGovernedSpec(
    record: GovernedPairRecord,
    root: ResolvedSpecbaseRoot,
    options: ShowExecuteOptions,
    repository: GovernedRepository
  ): Promise<void> {
    const { view } = await analyzeGovernedPair({
      repository,
      record,
      projectRoot: root.path,
    });

    if (options.json) {
      const rootOutput = toRootOutput(root);
      console.log(JSON.stringify({ ...view, ...(rootOutput ? { root: rootOutput } : {}) }, null, 2));
      return;
    }

    // Raw-first: print the spec source verbatim before the derived summary.
    if (record.specPath) {
      try {
        console.log(readFileSync(record.specPath, 'utf-8'));
      } catch {
        console.log('(spec.md could not be read)');
      }
    }
    console.log(renderGovernedSpecSummary(view));
  }

  private printNonInteractiveHint(root: ResolvedSpecbaseRoot): void {
    console.error('Nothing to show. Try one of:');
    console.error(`  ${withStoreFlag(root, 'specbase show <item>')}`);
    if (isStoreSelectedRoot(root)) {
      // The noun-form commands are cwd-based and cannot reach a selected store.
      console.error(`  ${withStoreFlag(root, 'specbase show <item> --type change')}`);
      console.error(`  ${withStoreFlag(root, 'specbase show <item> --type spec')}`);
    } else {
      console.error('  specbase change show');
      console.error('  specbase spec show');
    }
    console.error('Or run in an interactive terminal.');
  }

  private warnIrrelevantFlags(type: ItemType, options: { [k: string]: any }): boolean {
    const irrelevant: string[] = [];
    if (type === 'change') {
      for (const k of SPEC_FLAG_KEYS) if (k in options) irrelevant.push(k);
    } else {
      for (const k of CHANGE_FLAG_KEYS) if (k in options) irrelevant.push(k);
    }
    if (irrelevant.length > 0) {
      console.error(`Warning: Ignoring flags not applicable to ${type}: ${irrelevant.join(', ')}`);
      return true;
    }
    return false;
  }
}
