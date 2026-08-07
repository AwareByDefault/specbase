/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */

/**
 * Transforms colon-based command references to hyphen-based format.
 * Converts `/spcb:` patterns to `/spcb-` for tools that use hyphen syntax.
 *
 * @param text - The text containing command references
 * @returns Text with command references transformed to hyphen format
 *
 * @example
 * transformToHyphenCommands('/spcb:new') // returns '/spcb-new'
 * transformToHyphenCommands('Use /spcb:apply to implement') // returns 'Use /spcb-apply to implement'
 */
export function transformToHyphenCommands(text: string): string {
  return text.replace(/\/spcb:/g, '/spcb-');
}
