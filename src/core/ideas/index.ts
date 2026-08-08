/**
 * Idea catalogue core
 *
 * Ideas are an UNGOVERNED capture surface: scratchpad directories under
 * `<planningDir>/ideas/<id>/`. State is positional — an idea directory in
 * `ideas/` is open; the same directory moved to `changes/` is a proposed
 * change (the move IS the graduation). Ideas carry no enforcement pair, no
 * spec deltas, and are excluded from governed enumeration.
 */

export * from './store.js';
export * from './id.js';
export * from './model.js';
