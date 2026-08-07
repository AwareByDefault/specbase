import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { serializeConfig } from '../../src/core/config-prompts.js';
import { resolveProjectSpecModel } from '../../src/core/shared/skill-generation.js';

// A selection's plane records carry picker-only fields (defaultSelected,
// crossCutting) that seeding must strip. These mirror what init passes.
const behavior = {
  id: 'behavior',
  purpose: 'User/client-visible outcomes',
  enforcementFlavor: 'tests',
  crossCutting: false,
  defaultSelected: true,
};
const designSystem = {
  id: 'design-system',
  purpose: 'Design tokens, principles, and copy voice',
  enforcementFlavor: 'token-lint / design review',
  reviewLens: 'design',
  crossCutting: false,
  defaultSelected: false,
};

describe('config-prompts — serializeConfig plane seeding', () => {
  describe('clean records', () => {
    it('emits a specModel.planes list with only meaningful fields', () => {
      const yaml = serializeConfig({
        schema: 'spec-driven-governed',
        specModel: { planes: [behavior, designSystem] },
      });
      // Authoritative replace list, not an append.
      expect(yaml).toContain('planes:');
      expect(yaml).not.toContain('planes+');
      // Meaningful fields survive.
      expect(yaml).toContain('id: behavior');
      expect(yaml).toContain('id: design-system');
      expect(yaml).toContain('reviewLens: design');
      // Picker-only noise is stripped.
      expect(yaml).not.toContain('defaultSelected');
      expect(yaml).not.toContain('crossCutting');
    });

    it('keeps crossCutting only when true', () => {
      const yaml = serializeConfig({
        schema: 'spec-driven-governed',
        specModel: { planes: [{ ...designSystem, crossCutting: true }] },
      });
      expect(yaml).toContain('crossCutting: true');
    });
  });

  describe('seeded config round-trips as authoritative', () => {
    let tempDir: string;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specbase-seed-'));
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      warnSpy.mockRestore();
    });

    function writeConfig(planes: unknown[]): void {
      const dir = path.join(tempDir, 'specbase');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'config.yaml'),
        serializeConfig({ schema: 'spec-driven-governed', specModel: { planes } })
      );
    }

    it('resolves to exactly the seeded plane set', () => {
      writeConfig([behavior, designSystem]);
      const model = resolveProjectSpecModel(tempDir);
      expect(model.kind).toBe('governed');
      expect(model.planes.map((p) => p.id).sort()).toEqual(['behavior', 'design-system']);
    });

    it('drops a plane when its record is removed, even though the schema still declares it', () => {
      // design-system is a real schema plane; seeding only behavior must exclude it.
      writeConfig([behavior]);
      const model = resolveProjectSpecModel(tempDir);
      expect(model.planes.map((p) => p.id)).toEqual(['behavior']);
    });
  });
});
