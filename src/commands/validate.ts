import ora from 'ora';
import path from 'path';
import { Validator } from '../core/validation/validator.js';
import {
  resolveRootForCommand,
  toRootOutput,
  withStoreFlag,
  type ResolvedOpenSpecRoot,
  isStoreSelectedRoot,
} from '../core/root-selection.js';
import { isInteractive, resolveNoInteractive } from '../utils/interactive.js';
import { getSpecIds } from '../utils/item-discovery.js';
import { getAvailableChanges } from './workflow/shared.js';
import { nearestMatches } from '../utils/match.js';
import { resolveProjectSpecModel } from '../core/shared/skill-generation.js';
import { loadGovernedRepository, renderDiagnostics } from '../core/governed/index.js';
import {
  resolveGovernedShowTarget,
  reportGovernedResolutionError,
} from '../core/artifact-graph/governed-show.js';
import { validateGovernedPairs } from '../core/artifact-graph/governed-validate.js';

type ItemType = 'change' | 'spec';

interface ExecuteOptions {
  all?: boolean;
  changes?: boolean;
  specs?: boolean;
  type?: string;
  strict?: boolean;
  json?: boolean;
  noInteractive?: boolean;
  interactive?: boolean; // Commander sets this to false when --no-interactive is used
  concurrency?: string;
  store?: string;
  storePath?: string;
}

interface BulkItemResult {
  id: string;
  type: ItemType;
  valid: boolean;
  issues: { level: 'ERROR' | 'WARNING' | 'INFO'; path: string; message: string }[];
  durationMs: number;
}

export class ValidateCommand {
  async execute(itemName: string | undefined, options: ExecuteOptions = {}): Promise<void> {
    const root = await resolveRootForCommand(options, { json: options.json });
    if (!root) {
      return;
    }

    // Governed projects validate spec/enforcement PAIRS through the shared Unit
    // 1-2 engine (identity, coverage, lifecycle, targets) plus project-wide
    // duplicate-spec-ID and unsafe-locator detection. Governed change-delta
    // validation is deferred to Unit 10, so change targets (an explicit
    // `--type change`, a `--changes` request, or a positional target that names
    // an existing change rather than a governed spec) fall through to the legacy
    // change validator; every other mode is governed-aware.
    if (resolveProjectSpecModel(root.path).kind === 'governed') {
      if ((await this.resolveGovernedRouting(root, itemName, options)) === 'governed') {
        await this.runGovernedValidation(root, itemName, options);
        return;
      }
    }

    const interactive = isInteractive(options);

    // Handle bulk flags first
    if (options.all || options.changes || options.specs) {
      await this.runBulkValidation(root, {
        changes: !!options.all || !!options.changes,
        specs: !!options.all || !!options.specs,
      }, { strict: !!options.strict, json: !!options.json, concurrency: options.concurrency, noInteractive: resolveNoInteractive(options) });
      return;
    }

    // No item and no flags
    if (!itemName) {
      if (interactive) {
        await this.runInteractiveSelector(root, { strict: !!options.strict, json: !!options.json, concurrency: options.concurrency });
        return;
      }
      this.printNonInteractiveHint(root);
      process.exitCode = 1;
      return;
    }

    // Direct item validation with type detection or override
    const typeOverride = this.normalizeType(options.type);
    await this.validateDirectItem(root, itemName, { typeOverride, strict: !!options.strict, json: !!options.json });
  }

  /**
   * Governed-aware validation for the standalone `validate` command. Validates a
   * single pair when targeted by plane-qualified locator or stable spec ID, and
   * the whole governed repository (every discovered pair plus repo-level unsafe
   * locators) otherwise — including the `--specs`/`--all` bulk modes. Reuses the
   * shared {@link validateGovernedPairs} engine so it is byte-consistent with
   * `spec validate`; the legacy flat validator is never reached here.
   */
  private async runGovernedValidation(
    root: ResolvedOpenSpecRoot,
    itemName: string | undefined,
    options: ExecuteOptions
  ): Promise<void> {
    const projectRoot = root.path;
    const repository = await loadGovernedRepository(path.join(projectRoot, 'openspec'));

    const bulk = !!options.all || !!options.specs || !!options.changes;

    let records = repository.discovery.pairs;
    let targeted = false;
    if (itemName && !bulk) {
      const resolution = resolveGovernedShowTarget(repository, itemName);
      if (resolution.kind !== 'resolved') {
        reportGovernedResolutionError(itemName, resolution, options);
        process.exitCode = 1;
        return;
      }
      records = [resolution.record];
      targeted = true;
    }

    const report = await validateGovernedPairs({
      repository,
      records,
      projectRoot,
      includeUnsafeLocators: !targeted,
    });

    if (options.json) {
      console.log(
        JSON.stringify({ ...report, root: toRootOutput(root) }, null, 2)
      );
    } else if (report.specs.length === 0 && report.unsafeLocators.length === 0) {
      console.log('No items found to validate.');
    } else {
      for (const result of report.specs) {
        if (result.valid) {
          console.log(`✓ ${result.locator}`);
        } else {
          console.error(`✗ ${result.locator}`);
          console.error(renderDiagnostics(result.diagnostics));
        }
      }
      for (const unsafe of report.unsafeLocators) {
        console.error(
          `Unsafe locator rejected: ${unsafe.message} (${unsafe.nativeSourcePath})`
        );
      }
    }

    process.exitCode = report.valid ? 0 : 1;
  }

  /**
   * Decide whether a governed-project `validate` invocation is handled by the
   * governed pair engine or falls through to the legacy change validator.
   * Governed change-delta validation is deferred (Unit 10), so change targets
   * must not dead-end as "spec not found". Mirrors the non-governed spec/change
   * dispatch: an explicit `--type change` and `--changes` route to changes; a
   * bare positional target that resolves to a governed spec stays governed,
   * while one that only names an existing change routes to the change validator.
   */
  private async resolveGovernedRouting(
    root: ResolvedOpenSpecRoot,
    itemName: string | undefined,
    options: ExecuteOptions
  ): Promise<'governed' | 'legacy'> {
    const type = this.normalizeType(options.type);

    // Explicit change type always routes to the legacy change validator.
    if (type === 'change') return 'legacy';

    // `--changes`-only (no spec/all target) is the legacy bulk change path.
    if (!!options.changes && !options.specs && !options.all && !itemName) {
      return 'legacy';
    }

    // Bulk spec/all requests and explicit `--type spec` are governed-aware.
    if (options.all || options.specs || type === 'spec') return 'governed';

    // Bare positional target: a governed spec (locator or stable ID) stays
    // governed; a target that only names an existing change routes to the
    // legacy change validator. An unknown target stays governed so the
    // governed "spec not found" diagnostic is preserved.
    if (itemName) {
      const repository = await loadGovernedRepository(
        path.join(root.path, 'openspec')
      );
      const resolution = resolveGovernedShowTarget(repository, itemName);
      if (resolution.kind === 'resolved') return 'governed';
      const changeIds = await this.listChangeIds(root);
      if (changeIds.includes(itemName)) return 'legacy';
    }

    return 'governed';
  }

  private normalizeType(value?: string): ItemType | undefined {
    if (!value) return undefined;
    const v = value.toLowerCase();
    if (v === 'change' || v === 'spec') return v;
    return undefined;
  }

  /**
   * Resolve change IDs by directory existence within the resolved root — the
   * same rule `openspec status`/`instructions` use (`getAvailableChanges`) —
   * rather than requiring `proposal.md`. This lets `validate` resolve a
   * scaffolded or still-authoring change that the sibling commands already
   * resolve (#1182). Sorted to preserve the prior `getActiveChangeIds` ordering.
   */
  private async listChangeIds(root: ResolvedOpenSpecRoot): Promise<string[]> {
    const ids = await getAvailableChanges(root.path, root.changesDir);
    return ids.sort();
  }

  private async runInteractiveSelector(root: ResolvedOpenSpecRoot, opts: { strict: boolean; json: boolean; concurrency?: string }): Promise<void> {
    const { select } = await import('@inquirer/prompts');
    const choice = await select({
      message: 'What would you like to validate?',
      choices: [
        { name: 'All (changes + specs)', value: 'all' },
        { name: 'All changes', value: 'changes' },
        { name: 'All specs', value: 'specs' },
        { name: 'Pick a specific change or spec', value: 'one' },
      ],
    });

    if (choice === 'all') return this.runBulkValidation(root, { changes: true, specs: true }, opts);
    if (choice === 'changes') return this.runBulkValidation(root, { changes: true, specs: false }, opts);
    if (choice === 'specs') return this.runBulkValidation(root, { changes: false, specs: true }, opts);

    // one
    const [changes, specs] = await Promise.all([this.listChangeIds(root), getSpecIds(root.path)]);
    const items: { name: string; value: { type: ItemType; id: string } }[] = [];
    items.push(...changes.map(id => ({ name: `change/${id}`, value: { type: 'change' as const, id } })));
    items.push(...specs.map(id => ({ name: `spec/${id}`, value: { type: 'spec' as const, id } })));
    if (items.length === 0) {
      console.error('No items found to validate.');
      process.exitCode = 1;
      return;
    }
    const picked = await select<{ type: ItemType; id: string }>({ message: 'Pick an item', choices: items });
    await this.validateByType(root, picked.type, picked.id, opts);
  }

  private printNonInteractiveHint(root: ResolvedOpenSpecRoot): void {
    console.error('Nothing to validate. Try one of:');
    console.error(`  ${withStoreFlag(root, 'openspec validate --all')}`);
    console.error(`  ${withStoreFlag(root, 'openspec validate --changes')}`);
    console.error(`  ${withStoreFlag(root, 'openspec validate --specs')}`);
    console.error(`  ${withStoreFlag(root, 'openspec validate <item-name>')}`);
    console.error('Or run in an interactive terminal.');
  }

  private async validateDirectItem(root: ResolvedOpenSpecRoot, itemName: string, opts: { typeOverride?: ItemType; strict: boolean; json: boolean }): Promise<void> {
    const [changes, specs] = await Promise.all([this.listChangeIds(root), getSpecIds(root.path)]);
    const isChange = changes.includes(itemName);
    const isSpec = specs.includes(itemName);

    const type = opts.typeOverride ?? (isChange ? 'change' : isSpec ? 'spec' : undefined);

    if (!type) {
      const suggestions = nearestMatches(itemName, [...changes, ...specs]);
      const message = suggestions.length
        ? `Unknown item '${itemName}'. Did you mean: ${suggestions.join(', ')}?`
        : `Unknown item '${itemName}'.`;
      if (opts.json) {
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

    if (!opts.typeOverride && isChange && isSpec) {
      if (opts.json) {
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
        console.error('Pass --type change|spec, or use: openspec change validate / openspec spec validate');
      }
      process.exitCode = 1;
      return;
    }

    await this.validateByType(root, type, itemName, opts);
  }

  private async validateByType(root: ResolvedOpenSpecRoot, type: ItemType, id: string, opts: { strict: boolean; json: boolean }): Promise<void> {
    const validator = new Validator(opts.strict);
    if (type === 'change') {
      const changeDir = path.join(root.changesDir, id);
      const start = Date.now();
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      const durationMs = Date.now() - start;
      this.printReport('change', id, report, durationMs, opts.json, root);
      // Non-zero exit if invalid (keeps enriched output test semantics)
      process.exitCode = report.valid ? 0 : 1;
      return;
    }
    const file = path.join(root.specsDir, id, 'spec.md');
    const start = Date.now();
    const report = await validator.validateSpec(file);
    const durationMs = Date.now() - start;
    this.printReport('spec', id, report, durationMs, opts.json, root);
    process.exitCode = report.valid ? 0 : 1;
  }

  private printReport(type: ItemType, id: string, report: { valid: boolean; issues: any[] }, durationMs: number, json: boolean, root: ResolvedOpenSpecRoot): void {
    if (json) {
      const out = { items: [{ id, type, valid: report.valid, issues: report.issues, durationMs }], summary: { totals: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 }, byType: { [type]: { items: 1, passed: report.valid ? 1 : 0, failed: report.valid ? 0 : 1 } } }, version: '1.0', root: toRootOutput(root) };
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (report.valid) {
      console.log(`${type === 'change' ? 'Change' : 'Specification'} '${id}' is valid`);
    } else {
      console.error(`${type === 'change' ? 'Change' : 'Specification'} '${id}' has issues`);
      for (const issue of report.issues) {
        const label = issue.level === 'ERROR' ? 'ERROR' : issue.level;
        const prefix = issue.level === 'ERROR' ? '✗' : issue.level === 'WARNING' ? '⚠' : 'ℹ';
        console.error(`${prefix} [${label}] ${issue.path}: ${issue.message}`);
      }
      this.printNextSteps(type, id, root);
    }
  }

  private printNextSteps(type: ItemType, id: string, root: ResolvedOpenSpecRoot): void {
    const bullets: string[] = [];
    if (type === 'change') {
      bullets.push('- Ensure change has deltas in specs/: use headers ## ADDED/MODIFIED/REMOVED/RENAMED Requirements');
      bullets.push('- Each requirement MUST include at least one #### Scenario: block');
      bullets.push(`- Debug parsed deltas: ${withStoreFlag(root, `openspec show ${id} --json --deltas-only`)}`);
    } else {
      bullets.push('- Ensure spec includes ## Purpose and ## Requirements sections');
      bullets.push('- Each requirement MUST include at least one #### Scenario: block');
      bullets.push('- Re-run with --json to see structured report');
    }
    console.error('Next steps:');
    bullets.forEach(b => console.error(`  ${b}`));
  }

  private async runBulkValidation(root: ResolvedOpenSpecRoot, scope: { changes: boolean; specs: boolean }, opts: { strict: boolean; json: boolean; concurrency?: string; noInteractive?: boolean }): Promise<void> {
    const spinner = !opts.json && !opts.noInteractive ? ora('Validating...').start() : undefined;
    const [changeIds, specIds] = await Promise.all([
      scope.changes ? this.listChangeIds(root) : Promise.resolve<string[]>([]),
      scope.specs ? getSpecIds(root.path) : Promise.resolve<string[]>([]),
    ]);

    const DEFAULT_CONCURRENCY = 6;
    const maxSuggestions = 5; // used by nearestMatches
    const concurrency = normalizeConcurrency(opts.concurrency) ?? normalizeConcurrency(process.env.OPENSPEC_CONCURRENCY) ?? DEFAULT_CONCURRENCY;
    const validator = new Validator(opts.strict);
    const queue: Array<() => Promise<BulkItemResult>> = [];

    for (const id of changeIds) {
      queue.push(async () => {
        const start = Date.now();
        const changeDir = path.join(root.changesDir, id);
        const report = await validator.validateChangeDeltaSpecs(changeDir);
        const durationMs = Date.now() - start;
        return { id, type: 'change' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }
    for (const id of specIds) {
      queue.push(async () => {
        const start = Date.now();
        const file = path.join(root.specsDir, id, 'spec.md');
        const report = await validator.validateSpec(file);
        const durationMs = Date.now() - start;
        return { id, type: 'spec' as const, valid: report.valid, issues: report.issues, durationMs };
      });
    }

    if (queue.length === 0) {
      spinner?.stop();

      const summary = {
        totals: { items: 0, passed: 0, failed: 0 },
        byType: {
          ...(scope.changes ? { change: { items: 0, passed: 0, failed: 0 } } : {}),
          ...(scope.specs ? { spec: { items: 0, passed: 0, failed: 0 } } : {}),
        },
      } as const;

      if (opts.json) {
        const out = { items: [] as BulkItemResult[], summary, version: '1.0', root: toRootOutput(root) };
        console.log(JSON.stringify(out, null, 2));
      } else {
        console.log('No items found to validate.');
      }

      process.exitCode = 0;
      return;
    }

    const results: BulkItemResult[] = [];
    let index = 0;
    let running = 0;
    let passed = 0;
    let failed = 0;

    await new Promise<void>((resolve) => {
      const next = () => {
        while (running < concurrency && index < queue.length) {
          const currentIndex = index++;
          const task = queue[currentIndex];
          running++;
          if (spinner) spinner.text = `Validating (${currentIndex + 1}/${queue.length})...`;
          task()
            .then(res => {
              results.push(res);
              if (res.valid) passed++; else failed++;
            })
            .catch((error: any) => {
              const message = error?.message || 'Unknown error';
              const res: BulkItemResult = { id: getPlannedId(currentIndex, changeIds, specIds) ?? 'unknown', type: getPlannedType(currentIndex, changeIds, specIds) ?? 'change', valid: false, issues: [{ level: 'ERROR', path: 'file', message }], durationMs: 0 };
              results.push(res);
              failed++;
            })
            .finally(() => {
              running--;
              if (index >= queue.length && running === 0) resolve();
              else next();
            });
        }
      };
      next();
    });

    spinner?.stop();

    results.sort((a, b) => a.id.localeCompare(b.id));
    const summary = {
      totals: { items: results.length, passed, failed },
      byType: {
        ...(scope.changes ? { change: summarizeType(results, 'change') } : {}),
        ...(scope.specs ? { spec: summarizeType(results, 'spec') } : {}),
      },
    } as const;

    if (opts.json) {
      const out = { items: results, summary, version: '1.0', root: toRootOutput(root) };
      console.log(JSON.stringify(out, null, 2));
    } else {
      for (const res of results) {
        if (res.valid) console.log(`✓ ${res.type}/${res.id}`);
        else console.error(`✗ ${res.type}/${res.id}`);
      }
      console.log(`Totals: ${summary.totals.passed} passed, ${summary.totals.failed} failed (${summary.totals.items} items)`);
      const firstFailure = results.find((res) => !res.valid);
      if (firstFailure) {
        const storeFlag = isStoreSelectedRoot(root) ? ` --store ${root.storeId}` : '';
        console.log(
          `Details: openspec validate ${firstFailure.id} --type ${firstFailure.type}${storeFlag}`
        );
      }
    }

    process.exitCode = failed > 0 ? 1 : 0;
  }
}

function summarizeType(results: BulkItemResult[], type: ItemType) {
  const filtered = results.filter(r => r.type === type);
  const items = filtered.length;
  const passed = filtered.filter(r => r.valid).length;
  const failed = items - passed;
  return { items, passed, failed };
}

function normalizeConcurrency(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return n;
}

function getPlannedId(index: number, changeIds: string[], specIds: string[]): string | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return changeIds[index];
  const specIndex = index - totalChanges;
  return specIds[specIndex];
}

function getPlannedType(index: number, changeIds: string[], specIds: string[]): ItemType | undefined {
  const totalChanges = changeIds.length;
  if (index < totalChanges) return 'change';
  const specIndex = index - totalChanges;
  if (specIndex >= 0 && specIndex < specIds.length) return 'spec';
  return undefined;
}
