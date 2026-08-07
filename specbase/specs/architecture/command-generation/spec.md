---
id: architecture.command-generation
---

### Requirement: Command content is tool-agnostic
**ID:** tool-agnostic-content
The system SHALL represent a generated command as tool-agnostic content — a
stable command id, presentation metadata, and one instruction body. Command
content SHALL NOT carry a file path, frontmatter, or any other tool-specific
detail.

#### Scenario: Content declares only portable fields
**ID:** content-is-portable
- **WHEN** a command is defined for generation
- **THEN** its content declares the command id, name, description, category,
  tags, and instruction body
- **AND** it declares nothing that is true of only one tool

### Requirement: Tool-specific formatting lives behind one adapter boundary
**ID:** adapter-boundary
Every supported tool SHALL be served by a command adapter that implements one
common interface: it declares the tool id it serves, answers where a command
file belongs, and formats a complete file from tool-agnostic content.
Knowledge of a tool's file layout or frontmatter dialect SHALL NOT exist
outside that tool's adapter.

#### Scenario: Adapter answers path and format
**ID:** adapter-answers-path-and-format
- **WHEN** a tool adapter is asked for a command's file path and file content
- **THEN** it returns a path for that command id
- **AND** it returns the complete file content, frontmatter included

#### Scenario: A path may be project-relative or absolute
**ID:** adapter-path-scope
- **WHEN** a tool stores its commands outside the project (a global-scoped tool)
- **THEN** its adapter returns an absolute path
- **AND** callers write the file at that path without rewriting it

#### Scenario: Supporting a new tool adds an adapter only
**ID:** new-tool-adds-adapter
- **WHEN** support for a new tool is added
- **THEN** a new adapter supplies the tool's path and format
- **AND** neither the generator nor any generation entry point changes

### Requirement: Generation composes content with an adapter
**ID:** generator-composition
The system SHALL generate a command file by combining tool-agnostic content
with a tool adapter, returning the adapter's path and the adapter's formatted
content. Generating many commands SHALL preserve the order of the input
content. No caller SHALL construct a command file path or frontmatter itself.

#### Scenario: One command generated
**ID:** generate-single-command
- **WHEN** generation is invoked with command content and a tool adapter
- **THEN** the result carries the path the adapter chose and the file content
  the adapter formatted

#### Scenario: Many commands generated
**ID:** generate-many-commands
- **WHEN** generation is invoked with a list of command contents and one adapter
- **THEN** one result is produced per content, in the order given
- **AND** each result reflects only its own content

### Requirement: One registry resolves every tool adapter
**ID:** single-adapter-registry
The system SHALL resolve command adapters through a single registry keyed by
tool id, and SHALL be able to enumerate every registered adapter. A lookup for
an unregistered tool SHALL yield no adapter rather than a default or a
substitute, and callers SHALL handle that absence explicitly instead of
guessing a format.

#### Scenario: Adapter resolved by tool id
**ID:** registry-resolves-by-tool-id
- **WHEN** the registry is asked for a registered tool id
- **THEN** it returns that tool's adapter

#### Scenario: Unregistered tool yields no adapter
**ID:** unregistered-tool-yields-nothing
- **WHEN** the registry is asked for a tool id that is not registered
- **THEN** it returns no adapter
- **AND** no fallback adapter is substituted

#### Scenario: A tool without an adapter is skipped, not failed
**ID:** adapterless-tool-skipped
- **WHEN** generation runs for a configured tool that has no registered adapter
- **THEN** command files are skipped for that tool
- **AND** the run completes without error for the remaining tools

#### Scenario: Registry enumerates its adapters
**ID:** registry-enumerates-adapters
- **WHEN** a caller needs to act on every supported tool
- **THEN** it obtains the set by enumerating the registry
- **AND** it does not maintain its own list of tool ids

### Requirement: One command body serves every tool
**ID:** shared-command-body
The instruction body of a command SHALL be authored once and shared by every
tool. A tool's adapter MAY rewrite that body mechanically to match the tool's
own invocation syntax — command reference form, argument placeholders — but
SHALL NOT author different instructions. Any such rewrite SHALL live in the
adapter, not in a generation entry point.

#### Scenario: Same instructions, different wrappers
**ID:** same-body-across-tools
- **WHEN** the same command is generated for two different tools
- **THEN** both files carry the same instructions
- **AND** they differ in file path, frontmatter, and nothing else the tools share

#### Scenario: Invocation-syntax rewrites belong to the adapter
**ID:** body-rewrites-live-in-adapter
- **WHEN** a tool needs the shared body's command references or argument
  placeholders in its own syntax
- **THEN** that tool's adapter applies the rewrite while formatting
- **AND** the caller passes the same unmodified body it passes every other tool

### Requirement: Skills and commands project from one workflow source
**ID:** single-workflow-source
A workflow SHALL be registered once, in one shared source, and both its skill
artifact and its command artifact SHALL be projected from that registration.
Generation entry points SHALL NOT maintain their own workflow lists, and the
two projections SHALL stay in step.

#### Scenario: Workflow registered once
**ID:** workflow-registered-once
- **WHEN** a workflow is added or modified
- **THEN** its definition is edited in one place
- **AND** the skill and command projections both follow from it

#### Scenario: Projections stay in step
**ID:** projection-parity
- **WHEN** the skill projection and the command projection are compared
- **THEN** they cover the same workflow ids
- **AND** a drift in either projection's payload is detected rather than shipped

#### Scenario: Cross-cutting guidance reaches every projection
**ID:** guidance-covers-every-workflow
- **WHEN** guidance that every workflow must carry is added to the shared source
- **THEN** it appears in every projected skill and every projected command
- **AND** the check iterates the source rather than a hand-written list

### Requirement: Every writer of tool command files uses the shared path
**ID:** single-generation-path
Every code path that writes, inspects, or removes a tool's command files —
initialization, update, drift detection, and legacy upgrade — SHALL obtain its
content from the shared workflow source and resolve the tool's path and format
through the adapter registry. No entry point SHALL format a tool command file
itself or hard-code a tool's command directory.

#### Scenario: Initialization and update share the path
**ID:** init-and-update-share-path
- **WHEN** initialization or update writes command files for a tool
- **THEN** both take content from the shared workflow source
- **AND** both resolve path and format through the registry's adapter

#### Scenario: Inspection uses the same adapter
**ID:** inspection-uses-adapter
- **WHEN** a path detects installed commands or reconciles drift for a tool
- **THEN** it asks that tool's adapter where the files are
- **AND** it does not reconstruct the location from a literal path
