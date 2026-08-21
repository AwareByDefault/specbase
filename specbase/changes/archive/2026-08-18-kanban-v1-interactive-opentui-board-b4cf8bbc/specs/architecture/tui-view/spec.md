---
id: architecture.tui-view
---

## Purpose

Define the durable boundaries that keep board derivation, transient interaction state, terminal input, and renderer lifecycle independently testable.

## ADDED Requirements

### Requirement: Board derivation is independent of output technology
**ID:** pure-board-model
The view subsystem SHALL derive a versioned, serializable board model through filesystem and artifact-status ports without importing terminal renderer modules, reading terminal dimensions, or owning input state. Plain, JSON, and interactive outputs SHALL consume this same model.

#### Scenario: Model tests need no terminal runtime
**ID:** model-tests-without-renderer
- **WHEN** the board model is derived in a unit test with injected store readers
- **THEN** no terminal renderer or interactive runtime is loaded
- **AND** the result can be serialized and projected by every output mode

### Requirement: Store truth and view state remain separate
**ID:** projection-state-boundary
The view subsystem SHALL keep lifecycle cards and progress as immutable projections of store and artifact APIs, while selection, focus, scroll offsets, details, and layout remain transient viewer state. A navigation command SHALL NOT write through a store port.

#### Scenario: Navigation changes only transient state
**ID:** navigation-does-not-change-model
- **WHEN** an input adapter dispatches selection, focus, scroll, or detail commands
- **THEN** only transient viewer state changes
- **AND** the derived board model and project files remain unchanged

### Requirement: Keyboard and mouse dispatch one command vocabulary
**ID:** shared-input-commands
Keyboard handlers, mouse handlers, and visible controls SHALL translate input into the same typed read-only command vocabulary. Command reduction SHALL occur outside renderer event handlers so equivalent inputs produce equivalent logical state.

#### Scenario: Equivalent inputs reduce identically
**ID:** equivalent-inputs-share-reducer
- **WHEN** keyboard and mouse adapters express the same selection or detail action
- **THEN** they dispatch the same command shape and produce the same reduced viewer state

### Requirement: One boundary owns the renderer lifecycle and launcher protocol
**ID:** renderer-lifecycle-boundary
A single internal child entrypoint SHALL own renderer creation, terminal mode changes, handler registration, controller disposal, renderer destruction, and terminal restoration. The Node parent SHALL spawn that child with the caller's terminal descriptors 0, 1, and 2 inherited unchanged and SHALL send exactly one UTF-8 JSON board model on parent-to-child descriptor 3, with EOF as the sole frame delimiter. The child SHALL read and validate the complete frame before renderer creation. Empty, invalid UTF-8/JSON, trailing non-whitespace, unsupported-version, or schema-invalid input SHALL fail on stderr with exit 65 before terminal takeover. A parent spawn/pipe failure SHALL close descriptor 3, reap the child, and exit 74.

The parent SHALL own signal forwarding and child reaping but SHALL NOT change terminal modes. On the first SIGINT or SIGTERM it SHALL close descriptor 3 if open, forward that signal, and wait. The child SHALL route SIGINT/SIGTERM through its idempotent cleanup path and exit 130/143. User-requested normal quit SHALL return 0; an uncaught setup/render/input/shutdown failure after valid handoff SHALL report on stderr and return 70 after cleanup. The parent SHALL propagate every normal child code unchanged and map any other terminating signal to `128 + signal`. The main CLI and pure model modules SHALL communicate with the renderer only through this frame and process result rather than importing renderer APIs.

#### Scenario: Renderer failure follows one cleanup path
**ID:** renderer-failure-cleans-once
- **WHEN** setup, input handling, rendering, or shutdown fails after renderer creation
- **THEN** control reaches the child entrypoint cleanup path exactly once
- **AND** registered resources are disposed and terminal state is restored before the nonzero process result is returned

#### Scenario: Malformed handoff never takes over the terminal
**ID:** malformed-model-rejected-before-renderer
- **WHEN** descriptor 3 reaches EOF with an empty, malformed, unsupported, or schema-invalid model frame
- **THEN** the child reports the protocol failure on stderr and exits 65
- **AND** no renderer or terminal mode is initialized

#### Scenario: Parent propagates child outcomes
**ID:** child-outcome-propagated
- **WHEN** the renderer child exits normally with zero or nonzero status, or completes cleanup for SIGINT or SIGTERM
- **THEN** the parent reaps it and returns the specified child status without attempting terminal cleanup itself
