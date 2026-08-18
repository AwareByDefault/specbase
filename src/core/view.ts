import type { ViewBoardModel } from './view/model.js';
import { deriveViewBoard } from './view/model.js';
import { launchInteractiveView, type ViewLauncherAdapters } from './view/launcher.js';
import { renderViewJson, renderViewPlain } from './view/projections.js';

export interface ViewCommandOptions {
  plain?: boolean;
  json?: boolean;
  stdinTTY?: boolean;
  stdoutTTY?: boolean;
  writeOut?: (text: string) => void;
  writeError?: (text: string) => void;
  derive?: (root: string) => Promise<ViewBoardModel>;
  launcher?: (model: ViewBoardModel, adapters?: Partial<ViewLauncherAdapters>) => Promise<{ code: number; error?: string }>;
  launcherAdapters?: Partial<ViewLauncherAdapters>;
}

export class ViewCommand {
  async execute(targetPath = '.', options: ViewCommandOptions = {}): Promise<number> {
    const writeOut = options.writeOut ?? ((text: string) => process.stdout.write(text));
    const writeError = options.writeError ?? ((text: string) => process.stderr.write(text));
    const model = await (options.derive ?? deriveViewBoard)(targetPath);

    // Machine output always wins, including when --plain is also present.
    if (options.json) {
      writeOut(renderViewJson(model));
      return 0;
    }

    const stdinTTY = options.stdinTTY ?? Boolean(process.stdin.isTTY);
    const stdoutTTY = options.stdoutTTY ?? Boolean(process.stdout.isTTY);
    if (options.plain || !stdinTTY || !stdoutTTY) {
      writeOut(renderViewPlain(model));
      return 0;
    }

    const result = await (options.launcher ?? launchInteractiveView)(model, options.launcherAdapters);
    if (result.error) writeError(`${result.error}\n`);
    return result.code;
  }
}

export { deriveViewBoard, renderViewJson, renderViewPlain };
export type { ViewBoardModel };
