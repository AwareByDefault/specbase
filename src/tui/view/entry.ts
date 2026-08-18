import { readFileSync } from 'node:fs';
import {
  decodeViewModelFrame,
  VIEW_MODEL_FD,
  VIEW_PROTOCOL_DATA_ERROR,
  VIEW_RENDERER_ERROR,
} from '../../core/view/protocol.js';

async function run(): Promise<number> {
  let model;
  try {
    model = decodeViewModelFrame(readFileSync(VIEW_MODEL_FD));
  } catch (error) {
    process.stderr.write(`specbase view protocol error: ${error instanceof Error ? error.message : String(error)}\n`);
    return VIEW_PROTOCOL_DATA_ERROR;
  }

  let renderer: import('@opentui/core').CliRenderer | null = null;
  let controller: import('./board.js').ViewBoardController | null = null;
  let settled = false;
  let finish: (code: number) => void = () => {};
  const outcome = new Promise<number>((resolve) => { finish = resolve; });
  const complete = (code: number) => {
    if (settled) return;
    settled = true;
    finish(code);
  };
  const onSigint = () => complete(130);
  const onSigterm = () => complete(143);
  // Register signal handlers immediately after frame validation,
  // before any OpenTUI import or renderer creation, so a signal
  // during setup is observed and prevents further initialization.
  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);
  const testOutcome = process.env.SPECBASE_VIEW_TEST_OUTCOME;

  try {
    // If a signal already fired during handler registration, skip setup
    if (settled) return await outcome;

    const [{ createCliRenderer, CliRenderEvents }, { createViewBoard }] = await Promise.all([
      import('@opentui/core'),
      import('./board.js'),
    ]);

    // Re-check after dynamic import in case a signal fired during module loading
    if (settled) return await outcome;

    renderer = await createCliRenderer({
      exitOnCtrlC: false,
      exitSignals: [],
      screenMode: 'alternate-screen',
      useMouse: true,
      clearOnShutdown: true,
      consoleMode: 'disabled',
    });
    controller = createViewBoard(renderer, model, () => complete(0));
    renderer.on(CliRenderEvents.RESIZE, () => controller?.resize(renderer?.terminalWidth ?? 80, renderer?.terminalHeight ?? 24));
    renderer.on(CliRenderEvents.RENDER_ERROR, (event: { error: Error }) => {
      process.stderr.write(`specbase view renderer error: ${event.error.message}\n`);
      complete(VIEW_RENDERER_ERROR);
    });
    renderer.on(CliRenderEvents.HANDLER_ERROR, (event: { error: unknown }) => {
      process.stderr.write(`specbase view input error: ${event.error instanceof Error ? event.error.message : String(event.error)}\n`);
      complete(VIEW_RENDERER_ERROR);
    });
    renderer.requestRender();

    // Deterministic subprocess seams exercise lifecycle outcomes without sleeps.
    if (testOutcome === 'renderer-failure') throw new Error('injected renderer failure');
    if (testOutcome?.startsWith('exit:')) {
      const code = Number(testOutcome.slice(5));
      if (Number.isInteger(code) && code >= 0 && code <= 255) complete(code);
    }
    return await outcome;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const platform = `${process.platform}/${process.arch}`;
    const pkg = '@opentui/core@0.5.4';
    process.stderr.write(`specbase view renderer failure: ${msg}\n`);
    process.stderr.write(`Renderer requires ${pkg}. Platform: ${platform}\n`);
    process.stderr.write(`Try reinstalling: pnpm install --frozen-lockfile\n`);
    process.stderr.write(`Or use plain mode: specbase view --plain\n`);
    return VIEW_RENDERER_ERROR;
  } finally {
    process.off('SIGINT', onSigint);
    process.off('SIGTERM', onSigterm);
    let shutdownFailed = false;
    try { controller?.destroy(); } catch (cause) {
      shutdownFailed = true;
      process.stderr.write(`specbase view controller cleanup error: ${cause instanceof Error ? cause.message : String(cause)}\n`);
    }
    try { renderer?.destroy(); } catch (cause) {
      shutdownFailed = true;
      process.stderr.write(`specbase view renderer cleanup error: ${cause instanceof Error ? cause.message : String(cause)}\n`);
    }
    if (shutdownFailed) return VIEW_RENDERER_ERROR;
  }
}

process.exitCode = await run();