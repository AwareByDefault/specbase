import * as path from 'node:path';
import { SPEC_PLANES, type SpecPlane } from '../artifact-graph/types.js';

/**
 * Plane-qualified locator handling for the governed repository.
 *
 * A locator is a normalized, slash-separated, OS-independent path such as
 * `architecture/platforms/desktop`. Its first segment is always a plane; the
 * remaining segments name a pair at any safe depth. Filesystem access always
 * uses native `path` operations — locators are only the addressing surface.
 */

export const GOVERNED_SPECS_DIRNAME = 'specs';

/** Reason a native path could not become a safe locator. */
export type UnsafeLocatorReason =
  | 'absolute'
  | 'empty-segment'
  | 'dot-segment'
  | 'parent-traversal'
  | 'hidden-control-directory';

export interface UnsafeLocator {
  /** The native (OS-specific) source path that was rejected. */
  nativeSourcePath: string;
  /** The single offending path segment. */
  offendingSegment: string;
  reason: UnsafeLocatorReason;
  message: string;
}

export type LocatorAnalysis =
  | { ok: true; segments: string[] }
  | { ok: false; problem: UnsafeLocator };

function reasonMessage(
  reason: UnsafeLocatorReason,
  segment: string,
  nativeSourcePath: string
): string {
  const at = `(source: ${nativeSourcePath})`;
  switch (reason) {
    case 'absolute':
      return `Locator must be relative to its plane, not absolute ${at}`;
    case 'empty-segment':
      return `Locator contains an empty segment ${at}`;
    case 'dot-segment':
      return `Locator segment '${segment}' is a dot segment ${at}`;
    case 'parent-traversal':
      return `Locator segment '${segment}' escapes its plane through a parent segment ${at}`;
    case 'hidden-control-directory':
      return `Locator segment '${segment}' enters a reserved hidden control directory ${at}`;
  }
}

/**
 * Analyze the native path of a pair *relative to its plane root* and either
 * return its safe locator segments or the first safety problem. `nativeSourcePath`
 * is echoed verbatim into any problem so diagnostics point at the real file.
 */
export function analyzeRelativeLocator(
  relativeNativePath: string,
  nativeSourcePath: string
): LocatorAnalysis {
  const fail = (
    reason: UnsafeLocatorReason,
    offendingSegment: string
  ): LocatorAnalysis => ({
    ok: false,
    problem: {
      nativeSourcePath,
      offendingSegment,
      reason,
      message: reasonMessage(reason, offendingSegment, nativeSourcePath),
    },
  });

  if (path.isAbsolute(relativeNativePath)) {
    return fail('absolute', relativeNativePath);
  }

  // Split on both separators so a locator authored with '/' on Windows, or a
  // native '\\' path, is judged segment-by-segment the same way.
  const segments = relativeNativePath.split(/[\\/]/u);

  for (const segment of segments) {
    if (segment.length === 0) {
      return fail('empty-segment', segment);
    }
    if (segment === '.') {
      return fail('dot-segment', segment);
    }
    if (segment === '..') {
      return fail('parent-traversal', segment);
    }
    if (segment.startsWith('.')) {
      return fail('hidden-control-directory', segment);
    }
  }

  return { ok: true, segments };
}

/**
 * Build a plane-qualified locator from a plane and its already-validated
 * relative segments. Always slash-separated regardless of host OS.
 */
export function locatorFromSegments(plane: SpecPlane, segments: string[]): string {
  return [plane, ...segments].join('/');
}

/** True when `value` is one of the two governed planes. */
export function isSpecPlane(value: string): value is SpecPlane {
  return (SPEC_PLANES as readonly string[]).includes(value);
}

export interface ParsedLocator {
  plane: SpecPlane;
  /** Slash-separated segments beneath the plane (never empty). */
  segments: string[];
}

/**
 * Parse a plane-qualified locator string (e.g. `behavior/session-loop`) into its
 * plane and sub-segments, applying the same safety rules as discovery. Returns
 * null when the plane is unknown, the sub-path is empty, or any segment is unsafe.
 */
export function parseLocator(locator: string): ParsedLocator | null {
  const parts = locator.split('/');
  const plane = parts[0];
  if (!isSpecPlane(plane)) {
    return null;
  }
  const rest = parts.slice(1);
  if (rest.length === 0) {
    return null;
  }
  const analysis = analyzeRelativeLocator(rest.join('/'), locator);
  if (!analysis.ok) {
    return null;
  }
  return { plane, segments: analysis.segments };
}
