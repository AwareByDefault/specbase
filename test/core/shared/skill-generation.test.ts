import { describe, it, expect } from 'vitest';
import {
  getSkillTemplates,
  getCommandTemplates,
  getCommandContents,
  generateSkillContent,
  mergeProjectPlanes,
} from '../../../src/core/shared/skill-generation.js';
import type { SpecModel, Plane } from '../../../src/core/artifact-graph/types.js';

describe('skill-generation', () => {
  describe('getSkillTemplates', () => {
    it('should return all 12 skill templates', () => {
      const templates = getSkillTemplates();
      expect(templates).toHaveLength(12);
    });

    it('should have unique directory names', () => {
      const templates = getSkillTemplates();
      const dirNames = templates.map(t => t.dirName);
      const uniqueDirNames = new Set(dirNames);
      expect(uniqueDirNames.size).toBe(templates.length);
    });

    it('should include all expected skills', () => {
      const templates = getSkillTemplates();
      const dirNames = templates.map(t => t.dirName);

      expect(dirNames).toContain('specbase-explore');
      expect(dirNames).toContain('specbase-new-change');
      expect(dirNames).toContain('specbase-continue-change');
      expect(dirNames).toContain('specbase-apply-change');
      expect(dirNames).toContain('specbase-update-change');
      expect(dirNames).toContain('specbase-ff-change');
      expect(dirNames).toContain('specbase-sync-specs');
      expect(dirNames).toContain('specbase-archive-change');
      expect(dirNames).toContain('specbase-bulk-archive-change');
      expect(dirNames).toContain('specbase-verify-change');
      expect(dirNames).toContain('specbase-onboard');
      expect(dirNames).toContain('specbase-propose');
    });

    it('should have valid template structure', () => {
      const templates = getSkillTemplates();

      for (const { template, dirName, workflowId } of templates) {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.instructions).toBeTruthy();
        expect(dirName).toBeTruthy();
        expect(workflowId).toBeTruthy();
      }
    });

    it('should have unique workflow IDs', () => {
      const templates = getSkillTemplates();
      const ids = templates.map(t => t.workflowId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(templates.length);
    });

    it('should filter by workflow IDs when provided', () => {
      const filtered = getSkillTemplates(['propose', 'explore', 'apply', 'archive']);
      expect(filtered).toHaveLength(4);
      const ids = filtered.map(t => t.workflowId);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).toContain('apply');
      expect(ids).toContain('archive');
      expect(ids).not.toContain('new');
      expect(ids).not.toContain('ff');
    });

    it('should return all templates when filter is undefined', () => {
      const all = getSkillTemplates();
      const noFilter = getSkillTemplates(undefined);
      expect(noFilter).toHaveLength(all.length);
    });

    it('should return empty array when filter matches nothing', () => {
      const filtered = getSkillTemplates(['nonexistent']);
      expect(filtered).toHaveLength(0);
    });

    it('should return single template when filter has one workflow', () => {
      const filtered = getSkillTemplates(['propose']);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].workflowId).toBe('propose');
      expect(filtered[0].dirName).toBe('specbase-propose');
    });
  });

  describe('getCommandTemplates', () => {
    it('should return all 12 command templates', () => {
      const templates = getCommandTemplates();
      expect(templates).toHaveLength(12);
    });

    it('should have unique IDs', () => {
      const templates = getCommandTemplates();
      const ids = templates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(templates.length);
    });

    it('should include all expected commands', () => {
      const templates = getCommandTemplates();
      const ids = templates.map(t => t.id);

      expect(ids).toContain('explore');
      expect(ids).toContain('new');
      expect(ids).toContain('continue');
      expect(ids).toContain('apply');
      expect(ids).toContain('update');
      expect(ids).toContain('ff');
      expect(ids).toContain('sync');
      expect(ids).toContain('archive');
      expect(ids).toContain('bulk-archive');
      expect(ids).toContain('verify');
      expect(ids).toContain('onboard');
      expect(ids).toContain('propose');
    });

    it('should filter by workflow IDs when provided', () => {
      const filtered = getCommandTemplates(['propose', 'explore', 'apply', 'archive']);
      expect(filtered).toHaveLength(4);
      const ids = filtered.map(t => t.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).toContain('apply');
      expect(ids).toContain('archive');
      expect(ids).not.toContain('new');
      expect(ids).not.toContain('ff');
    });

    it('should return all templates when filter is undefined', () => {
      const all = getCommandTemplates();
      const noFilter = getCommandTemplates(undefined);
      expect(noFilter).toHaveLength(all.length);
    });

    it('should return empty array when filter matches nothing', () => {
      const filtered = getCommandTemplates(['nonexistent']);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getCommandContents', () => {
    it('should return all 12 command contents', () => {
      const contents = getCommandContents();
      expect(contents).toHaveLength(12);
    });

    it('should have valid content structure', () => {
      const contents = getCommandContents();

      for (const content of contents) {
        expect(content.id).toBeTruthy();
        expect(content.name).toBeTruthy();
        expect(content.description).toBeTruthy();
        expect(content.body).toBeTruthy();
      }
    });

    it('should have matching IDs with command templates', () => {
      const templates = getCommandTemplates();
      const contents = getCommandContents();

      const templateIds = templates.map(t => t.id).sort();
      const contentIds = contents.map(c => c.id).sort();

      expect(contentIds).toEqual(templateIds);
    });

    it('should filter by workflow IDs when provided', () => {
      const filtered = getCommandContents(['propose', 'explore']);
      expect(filtered).toHaveLength(2);
      const ids = filtered.map(c => c.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).not.toContain('new');
    });

    it('should return all contents when filter is undefined', () => {
      const all = getCommandContents();
      const noFilter = getCommandContents(undefined);
      expect(noFilter).toHaveLength(all.length);
    });
  });

  describe('generateSkillContent', () => {
    it('should generate valid YAML frontmatter', () => {
      const template = {
        name: 'test-skill',
        description: 'Test description',
        instructions: 'Test instructions',
        license: 'MIT',
        compatibility: 'Test compatibility',
        metadata: {
          author: 'test-author',
          version: '2.0',
        },
      };

      const content = generateSkillContent(template, '0.23.0');

      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name: test-skill');
      expect(content).toContain('description: Test description');
      expect(content).toContain('license: MIT');
      expect(content).toContain('compatibility: Test compatibility');
      expect(content).toContain('author: test-author');
      expect(content).toContain('version: "2.0"');
      expect(content).toContain('generatedBy: "0.23.0"');
      expect(content).toContain('Test instructions');
    });

    it('should use default values for optional fields', () => {
      const template = {
        name: 'minimal-skill',
        description: 'Minimal description',
        instructions: 'Minimal instructions',
      };

      const content = generateSkillContent(template, '0.24.0');

      expect(content).toContain('license: MIT');
      expect(content).toContain('compatibility: Requires specbase CLI.');
      expect(content).toContain('author: specbase');
      expect(content).toContain('version: "1.0"');
      expect(content).toContain('generatedBy: "0.24.0"');
    });

    it('should embed the provided version in generatedBy field', () => {
      const template = {
        name: 'version-test',
        description: 'Test version embedding',
        instructions: 'Instructions',
      };

      const content1 = generateSkillContent(template, '0.23.0');
      expect(content1).toContain('generatedBy: "0.23.0"');

      const content2 = generateSkillContent(template, '1.0.0');
      expect(content2).toContain('generatedBy: "1.0.0"');

      const content3 = generateSkillContent(template, '0.24.0-beta.1');
      expect(content3).toContain('generatedBy: "0.24.0-beta.1"');
    });

    it('should end frontmatter with separator and blank line', () => {
      const template = {
        name: 'test',
        description: 'Test',
        instructions: 'Body content',
      };

      const content = generateSkillContent(template, '0.23.0');

      expect(content).toMatch(/---\n\nBody content\n$/);
    });

    it('should apply transformInstructions callback when provided', () => {
      const template = {
        name: 'transform-test',
        description: 'Test transform callback',
        instructions: 'Use /spcb:new to start and /spcb:apply to implement.',
      };

      const transformer = (text: string) => text.replace(/\/spcb:/g, '/spcb-');
      const content = generateSkillContent(template, '0.23.0', transformer);

      expect(content).toContain('/spcb-new');
      expect(content).toContain('/spcb-apply');
      expect(content).not.toContain('/spcb:new');
      expect(content).not.toContain('/spcb:apply');
    });

    it('should not transform instructions when callback is undefined', () => {
      const template = {
        name: 'no-transform-test',
        description: 'Test without transform',
        instructions: 'Use /spcb:new to start.',
      };

      const content = generateSkillContent(template, '0.23.0', undefined);

      expect(content).toContain('/spcb:new');
    });

    it('should support custom transformInstructions logic', () => {
      const template = {
        name: 'custom-transform',
        description: 'Test custom transform',
        instructions: 'Some PLACEHOLDER text here.',
      };

      const customTransformer = (text: string) => text.replace('PLACEHOLDER', 'REPLACED');
      const content = generateSkillContent(template, '0.23.0', customTransformer);

      expect(content).toContain('Some REPLACED text here.');
      expect(content).not.toContain('PLACEHOLDER');
    });
  });

  describe('mergeProjectPlanes', () => {
    const baseModel: SpecModel = {
      kind: 'governed',
      version: 1,
      planes: [
        { id: 'behavior', purpose: 'outcomes', enforcementFlavor: 'tests', crossCutting: false },
        { id: 'architecture', purpose: 'boundaries', enforcementFlavor: 'lint', crossCutting: false },
      ],
      pairedEnforcement: true,
    };

    it('appends project planes to the schema defaults', () => {
      const merged = mergeProjectPlanes(baseModel, {
        schema: 'spec-driven-governed',
        specModel: {
          planesAppend: [
            { id: 'security', purpose: 'authn', enforcementFlavor: 'static-analysis' },
          ],
        },
      });
      expect(merged.planes.map((p) => p.id)).toEqual([
        'behavior',
        'architecture',
        'security',
      ]);
    });

    it('replaces the schema defaults with the declared list', () => {
      const merged = mergeProjectPlanes(baseModel, {
        schema: 'spec-driven-governed',
        specModel: {
          planes: [
            { id: 'ops', purpose: 'runs', enforcementFlavor: 'audit' },
          ],
        },
      });
      expect(merged.planes.map((p) => p.id)).toEqual(['ops']);
    });

    it('returns the model unchanged for legacy projects', () => {
      const legacy: SpecModel = { ...baseModel, kind: 'legacy', planes: [] };
      const merged = mergeProjectPlanes(legacy, {
        schema: 'spec-driven',
        specModel: { planesAppend: [{ id: 'security', purpose: 'x', enforcementFlavor: 'x' }] },
      });
      expect(merged.planes).toEqual([]);
    });

    it('ignores malformed plane overrides (keeps schema defaults)', () => {
      const merged = mergeProjectPlanes(baseModel, {
        schema: 'spec-driven-governed',
        specModel: {
          planesAppend: [{ id: 'Not-Kebab', purpose: 'x', enforcementFlavor: 'x' }],
        },
      });
      expect(merged.planes.map((p) => p.id)).toEqual(['behavior', 'architecture']);
    });

    it('resolves the default set to the defaultSelected offered planes', () => {
      // Offered list carries an opt-out plane; with no override the resolved
      // default set excludes it.
      const offered: SpecModel = {
        ...baseModel,
        planes: [
          { id: 'behavior', purpose: 'outcomes', enforcementFlavor: 'tests', crossCutting: false, defaultSelected: true },
          { id: 'design-system', purpose: 'identity', enforcementFlavor: 'token-lint', crossCutting: false, defaultSelected: false },
        ],
      };
      const merged = mergeProjectPlanes(offered, null);
      expect(merged.planes.map((p) => p.id)).toEqual(['behavior']);
      expect(merged.kind).toBe('governed');
    });

    it('appends onto the defaultSelected base, not the full offered list', () => {
      const offered: SpecModel = {
        ...baseModel,
        planes: [
          { id: 'behavior', purpose: 'outcomes', enforcementFlavor: 'tests', crossCutting: false, defaultSelected: true },
          { id: 'design-system', purpose: 'identity', enforcementFlavor: 'token-lint', crossCutting: false, defaultSelected: false },
        ],
      };
      const merged = mergeProjectPlanes(offered, {
        schema: 'spec-driven-governed',
        specModel: {
          planesAppend: [{ id: 'agents', purpose: 'instruments', enforcementFlavor: 'conformance' }],
        },
      });
      expect(merged.planes.map((p) => p.id)).toEqual(['behavior', 'agents']);
    });

    it('derives legacy kind when the resolved plane set is empty (emergent governance)', () => {
      const merged = mergeProjectPlanes(baseModel, {
        schema: 'spec-driven-governed',
        specModel: { planes: [] },
      });
      expect(merged.planes).toEqual([]);
      expect(merged.kind).toBe('legacy');
    });
  });
});
