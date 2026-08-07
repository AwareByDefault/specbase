import { describe, it, expect } from 'vitest';
import { transformToHyphenCommands } from '../../src/utils/command-references.js';

describe('transformToHyphenCommands', () => {
  describe('basic transformations', () => {
    it('should transform single command reference', () => {
      expect(transformToHyphenCommands('/spcb:new')).toBe('/spcb-new');
    });

    it('should transform multiple command references', () => {
      const input = '/spcb:new and /spcb:apply';
      const expected = '/spcb-new and /spcb-apply';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });

    it('should transform command reference in context', () => {
      const input = 'Use /spcb:apply to implement tasks';
      const expected = 'Use /spcb-apply to implement tasks';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });

    it('should handle backtick-quoted commands', () => {
      const input = 'Run `/spcb:continue` to proceed';
      const expected = 'Run `/spcb-continue` to proceed';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should return unchanged text with no command references', () => {
      const input = 'This is plain text without commands';
      expect(transformToHyphenCommands(input)).toBe(input);
    });

    it('should return empty string unchanged', () => {
      expect(transformToHyphenCommands('')).toBe('');
    });

    it('should not transform similar but non-matching patterns', () => {
      const input = '/ops:new spcb: /other:command';
      expect(transformToHyphenCommands(input)).toBe(input);
    });

    it('should handle multiple occurrences on same line', () => {
      const input = '/spcb:new /spcb:continue /spcb:apply';
      const expected = '/spcb-new /spcb-continue /spcb-apply';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('multiline content', () => {
    it('should transform references across multiple lines', () => {
      const input = `Use /spcb:new to start
Then /spcb:continue to proceed
Finally /spcb:apply to implement`;
      const expected = `Use /spcb-new to start
Then /spcb-continue to proceed
Finally /spcb-apply to implement`;
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('all known commands', () => {
    const commands = [
      'new',
      'continue',
      'apply',
      'update',
      'ff',
      'sync',
      'archive',
      'bulk-archive',
      'verify',
      'explore',
      'onboard',
    ];

    for (const cmd of commands) {
      it(`should transform /spcb:${cmd}`, () => {
        expect(transformToHyphenCommands(`/spcb:${cmd}`)).toBe(`/spcb-${cmd}`);
      });
    }
  });
});
