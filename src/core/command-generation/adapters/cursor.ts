/**
 * Cursor Command Adapter
 *
 * Formats commands for Cursor following its frontmatter specification.
 * Cursor uses a different frontmatter format and file naming convention.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Cursor adapter for command generation.
 * File path: .cursor/commands/spcb-<id>.md
 * Frontmatter: name (as /spcb-<id>), id, category, description
 */
export const cursorAdapter: ToolCommandAdapter = {
  toolId: 'cursor',

  getFilePath(commandId: string): string {
    return path.join('.cursor', 'commands', `spcb-${commandId}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: /spcb-${content.id}
id: spcb-${content.id}
category: ${escapeYamlValue(content.category)}
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
