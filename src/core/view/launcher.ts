import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViewBoardModel } from './model.js';
import { bunVersionSupported, signalExitCode, VIEW_PROTOCOL_IO_ERROR } from './protocol.js';

export interface ViewLauncherAdapters {
  spawn: typeof spawn;
  spawnSync: typeof spawnSync;
  entryPath: string;
  bunCommand: string;
}

export interface ViewLaunchResult {
  code: number;
  error?: string;
}

export function defaultViewTuiEntry(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'internal', 'view-tui.mjs');
}

export function discoverBun(command = process.env.SPECBASE_BUN || 'bun', probe: typeof spawnSync = spawnSync): { command: string; version: string } {
  const result = probe(command, ['--version'], { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) {
    throw new Error(`Bun >=1.3 is required for interactive view. Install Bun or run 'specbase view --plain'.`);
  }
  const version = String(result.stdout).trim();
  if (!bunVersionSupported(version)) {
    throw new Error(`Bun >=1.3 is required for interactive view (found ${version || 'unknown'}). Upgrade Bun or run 'specbase view --plain'.`);
  }
  return { command, version };
}

export async function launchInteractiveView(
  model: ViewBoardModel,
  overrides: Partial<ViewLauncherAdapters> = {}
): Promise<ViewLaunchResult> {
  const adapters: ViewLauncherAdapters = {
    spawn,
    spawnSync,
    entryPath: defaultViewTuiEntry(),
    bunCommand: process.env.SPECBASE_BUN || 'bun',
    ...overrides,
  };
  let bun: { command: string; version: string };
  try {
    bun = discoverBun(adapters.bunCommand, adapters.spawnSync);
  } catch (error) {
    return { code: VIEW_PROTOCOL_IO_ERROR, error: error instanceof Error ? error.message : String(error) };
  }

  let child: ChildProcess;
  try {
    child = adapters.spawn(bun.command, [adapters.entryPath], {
      stdio: ['inherit', 'inherit', 'inherit', 'pipe'],
      env: { ...process.env, SPECBASE_VIEW_PROTOCOL: 'fd3-eof-json-v1' },
      windowsHide: false,
    });
  } catch (error) {
    return { code: VIEW_PROTOCOL_IO_ERROR, error: `Could not start the interactive renderer: ${error instanceof Error ? error.message : String(error)}. Run 'specbase view --plain'.` };
  }

  const modelPipe = child.stdio[3];
  let pipeFailed: Error | null = null;
  let forwarded = false;
  const closePipe = () => {
    if (modelPipe && 'end' in modelPipe && !(modelPipe as NodeJS.WritableStream & { destroyed?: boolean }).destroyed) {
      try { (modelPipe as NodeJS.WritableStream).end(); } catch { /* cleanup is best effort */ }
    }
  };
  const forward = (signal: NodeJS.Signals) => {
    if (forwarded) return;
    forwarded = true;
    closePipe();
    try { child.kill(signal); } catch { /* close event still owns result */ }
  };
  const onSigint = () => forward('SIGINT');
  const onSigterm = () => forward('SIGTERM');
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);

  const result = await new Promise<ViewLaunchResult>((resolve) => {
    let settled = false;
    const finish = (value: ViewLaunchResult) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    child.once('error', (error) => {
      pipeFailed = error;
      closePipe();
    });
    if (!modelPipe || !('write' in modelPipe)) {
      pipeFailed = new Error('fd 3 model pipe was not created');
      try { child.kill(); } catch { /* wait for close */ }
    } else {
      modelPipe.once('error', (error: Error) => {
        pipeFailed = error;
        try { child.kill(); } catch { /* wait for close */ }
      });
      try {
        (modelPipe as NodeJS.WritableStream).end(JSON.stringify(model));
      } catch (error) {
        pipeFailed = error instanceof Error ? error : new Error(String(error));
        closePipe();
        try { child.kill(); } catch { /* wait for close */ }
      }
    }
    child.once('close', (code, signal) => {
      if (pipeFailed) {
        finish({ code: VIEW_PROTOCOL_IO_ERROR, error: `Interactive renderer handoff failed: ${pipeFailed.message}. Run 'specbase view --plain'.` });
      } else if (code !== null) {
        finish({ code });
      } else if (signal) {
        finish({ code: signalExitCode(signal) });
      } else {
        finish({ code: VIEW_PROTOCOL_IO_ERROR, error: `Interactive renderer ended without a status. Run 'specbase view --plain'.` });
      }
    });
  });

  process.off('SIGINT', onSigint);
  process.off('SIGTERM', onSigterm);
  closePipe();
  return result;
}
