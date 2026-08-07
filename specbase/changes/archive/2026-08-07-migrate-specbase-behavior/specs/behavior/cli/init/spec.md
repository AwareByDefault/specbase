---
id: behavior.cli.init
---

## ADDED Requirements

### Requirement: Init creates the store and its configuration file
**ID:** store-scaffolding
The init command SHALL create the store directory tree — a specs directory and a
changes directory holding an archive subdirectory — together with a project
configuration file recording the resolved schema. It SHALL NOT replace a
configuration file that already exists, and it SHALL report whether the
configuration was created or preserved.

#### Scenario: A fresh project gets the full tree
**ID:** structure-created
- **WHEN** a user runs init in a project that has no store
- **THEN** the store directory is created with a specs directory and a changes
  directory containing an archive subdirectory

#### Scenario: The configuration file is written when absent
**ID:** config-created
- **WHEN** init completes and no project configuration file exists
- **THEN** a configuration file is written recording the resolved schema

#### Scenario: An existing configuration file survives untouched
**ID:** config-preserved
- **WHEN** init runs in a project that already has a configuration file
- **THEN** the file's content is left byte-for-byte unchanged
- **AND** init reports it as already existing rather than as created

### Requirement: Init reports each setup phase as it completes
**ID:** setup-phase-reporting
The init command SHALL validate the environment silently, printing nothing about
validation unless it fails, and SHALL report the completion of structure creation
and of each tool's configuration as those phases finish, naming the tool.

#### Scenario: Successful validation says nothing
**ID:** silent-validation
- **WHEN** init validates the target directory and validation succeeds
- **THEN** no validation output is written

#### Scenario: Each phase reports its own completion
**ID:** phase-completion-reported
- **WHEN** structure creation finishes and each selected tool is configured
- **THEN** init reports the completion of each phase, naming the tool it just
  configured

### Requirement: Init detects installed tools and asks the user to confirm them
**ID:** tool-detection-and-confirmation
The init command SHALL detect supported AI tools by the configuration directories
they own in the project root, and SHALL present the supported tools as a
filterable multi-select. On a first-time setup the detected tools SHALL be
pre-checked so the user confirms rather than chooses from scratch; tools this CLI
has already configured SHALL be named, pre-checked, and sorted ahead of the rest.

#### Scenario: Detected tools arrive pre-checked on a first setup
**ID:** detected-preselected
- **GIVEN** a project with a supported tool's configuration directory present and
  no tool yet configured by this CLI
- **WHEN** init presents the tool picker
- **THEN** that tool is offered pre-checked

#### Scenario: Already-configured tools lead and stay checked
**ID:** configured-listed-first
- **WHEN** init presents the tool picker in a project where some tools are
  already configured
- **THEN** those tools are reported as already configured, offered pre-checked,
  and ordered ahead of merely detected tools
- **AND** a detected but unconfigured tool is offered unchecked

#### Scenario: Nothing detected still offers the full list
**ID:** nothing-detected-full-list
- **WHEN** no supported tool's configuration directory exists in the project root
- **THEN** init still offers every supported tool for selection

#### Scenario: The picker toggles per item and confirms once
**ID:** picker-toggles-and-confirms
- **WHEN** the user toggles an entry in the tool picker and then confirms
- **THEN** the toggled entry's checked state flips without ending the prompt
- **AND** confirming returns the checked set, rejecting an empty selection

### Requirement: An explicit tool list overrides detection and the picker
**ID:** explicit-tool-selection
When the user names the tools to configure, init SHALL use exactly that selection
and SHALL neither prompt nor fall back to detection. The reserved value `all`
SHALL select every supported tool and `none` SHALL create the store while
generating no tool artifacts; neither reserved value SHALL be combined with
explicit tool identifiers. Without an explicit list in a non-interactive session,
init SHALL use the detected tools, failing only when nothing is detected.

#### Scenario: An explicit list wins over detection
**ID:** explicit-tools-win
- **WHEN** a user runs init naming specific tools, interactively or not
- **THEN** exactly those tools are configured
- **AND** no tool picker is presented

#### Scenario: The reserved value selects everything
**ID:** tools-all
- **WHEN** a user runs init with `--tools all`
- **THEN** every supported tool is configured without prompting

#### Scenario: The reserved value selects nothing
**ID:** tools-none
- **WHEN** a user runs init with `--tools none`
- **THEN** the store is created
- **AND** no skill or command artifact is generated for any tool

#### Scenario: Reserved values cannot be mixed with identifiers
**ID:** reserved-not-combinable
- **WHEN** a user combines a reserved value with an explicit tool identifier
- **THEN** init fails and explains that reserved values cannot be combined

#### Scenario: A non-interactive run falls back to what it detected
**ID:** non-interactive-detected-fallback
- **GIVEN** a non-interactive session and no explicit tool list
- **WHEN** at least one supported tool's configuration directory is present
- **THEN** init configures the detected tools without prompting

#### Scenario: A non-interactive run with nothing detected asks for the list
**ID:** non-interactive-nothing-detected
- **GIVEN** a non-interactive session and no explicit tool list
- **WHEN** no supported tool's configuration directory is present
- **THEN** init fails and names the option that supplies the tool list

### Requirement: Init offers the schema's planes as one selectable list
**ID:** plane-picker
On a fresh interactive run the init command SHALL present the schema's offered
planes as a single multi-select whose per-plane initial checked state comes from
that plane's own declared default, with one toggle that flips every plane
together. That selection SHALL be the only governance question asked: init SHALL
NOT ask a separate governed yes/no question, nor a separate per-plane opt-in.
Selecting no plane SHALL write a configuration carrying no plane list.

#### Scenario: One picker replaces every governance prompt
**ID:** single-governance-picker
- **WHEN** a user runs init interactively in a fresh project
- **THEN** one plane multi-select is shown
- **AND** no separate governed yes/no prompt and no separate per-plane opt-in
  prompt is shown

#### Scenario: Initial checked state comes from each plane's declaration
**ID:** plane-defaults-precheck
- **WHEN** the plane picker renders the offered planes
- **THEN** each plane's initial checked state equals the default the plane record
  declares

#### Scenario: One toggle flips every plane
**ID:** toggle-all-planes
- **WHEN** the user activates the select-all toggle
- **THEN** every offered plane's checked state flips together

#### Scenario: No planes means no plane list
**ID:** no-planes-no-list
- **WHEN** a user confirms the plane picker with nothing selected
- **THEN** the written configuration carries no plane list

### Requirement: Baseline specs are planted only for the selected planes
**ID:** baseline-planting
When a selected plane ships baseline specs, the init command SHALL write those
specs and their paired enforcement files directly into the store as bootstrap
scaffolding, creating no change entry for them, and SHALL leave an existing
baseline file untouched. A plane the user did not select SHALL have nothing
planted. Every later edit to a planted baseline goes through the ordinary change
flow.

#### Scenario: Baselines are written without a change
**ID:** planted-without-change
- **WHEN** init plants a selected plane's baseline specs
- **THEN** the spec and enforcement files appear under the store's specs tree
- **AND** no change entry is created for them

#### Scenario: The agents plane plants its self-hosting spec and its worked example
**ID:** agents-baselines-planted
- **WHEN** a user selects the agents plane
- **THEN** a baseline pair declaring that the repository practices spec-driven
  development is planted
- **AND** a review-panel pair is planted as a worked example governing the
  project's resolved review lens set

#### Scenario: A customized baseline is never overwritten
**ID:** existing-baseline-preserved
- **WHEN** init runs in a project that already holds a planted baseline spec
- **THEN** the existing file is left in place unchanged

#### Scenario: An unselected plane plants nothing
**ID:** unselected-plane-not-planted
- **WHEN** the user does not select a plane that ships baseline specs
- **THEN** none of that plane's baseline specs is planted

### Requirement: Generated artifacts follow the active profile and delivery setting
**ID:** profile-driven-generation
The init command SHALL generate artifacts only for the workflows the active
profile selects, never for a fixed workflow set, and the delivery setting SHALL
decide which artifact kinds are written: skills only, command files only, or
both. The preferences themselves are the model in `behavior/config/profiles`.

#### Scenario: Only the profile's workflows are generated
**ID:** profile-workflows-only
- **WHEN** init generates artifacts under the active profile
- **THEN** an artifact exists for every workflow the profile selects
- **AND** no artifact exists for a workflow outside it

#### Scenario: Skills-only delivery writes no command file
**ID:** delivery-skills-only
- **WHEN** the delivery setting is skills only
- **THEN** skill artifacts are generated and no command file is written

#### Scenario: Commands-only delivery writes no skill
**ID:** delivery-commands-only
- **WHEN** the delivery setting is commands only
- **THEN** command files are generated and no skill artifact is written

#### Scenario: Both delivery writes both kinds
**ID:** delivery-both
- **WHEN** the delivery setting is both
- **THEN** skill artifacts and command files are generated for the profile's
  workflows

### Requirement: Every generated skill carries a header that pre-approves the CLI
**ID:** skill-frontmatter
Each generated skill file SHALL open with a structured header naming the skill,
describing when to use it, recording the version that generated it, and
pre-approving this CLI so an agent that honors that field runs its commands
without asking for approval. The pre-approval SHALL only grant permission and
SHALL NOT restrict any other tool the skill uses.

#### Scenario: The header describes the skill and its origin
**ID:** frontmatter-fields
- **WHEN** a skill file is generated
- **THEN** its header carries a name, a description, and the generating version
- **AND** the skill instructions follow the header

#### Scenario: The CLI is pre-approved in every deployed skill
**ID:** cli-pre-approved
- **WHEN** any deployed skill file is generated
- **THEN** its header pre-approves this CLI's commands
- **AND** an agent honoring that field runs them without prompting for approval

### Requirement: A tool without a slash-command surface still receives skills
**ID:** commands-optional-per-tool
The init command SHALL write command files only for selected tools that expose a
slash-command surface, SHALL still generate skills for a selected tool that owns
a skills directory but exposes no such surface, and SHALL report which tools had
command generation skipped.

#### Scenario: A skills-only tool is fully supported
**ID:** skills-only-tool-supported
- **WHEN** a selected tool owns a skills directory but exposes no slash-command
  surface
- **THEN** its skills are generated
- **AND** no command directory is created for it

#### Scenario: Skipped command generation is reported
**ID:** commands-skipped-reported
- **WHEN** command generation is skipped for a selected tool
- **THEN** init names that tool and says its command generation was skipped

### Requirement: Oh My Pi artifacts follow its own naming convention
**ID:** oh-my-pi-artifacts
When Oh My Pi is selected, the init command SHALL write one skill and one command
file per active workflow under Oh My Pi's own directories, naming each command
file after the slash command it provides, SHALL rewrite colon-form slash-command
references into the hyphen form Oh My Pi resolves from the filename, and SHALL
expose the user's arguments inside a command body that declares an input.

#### Scenario: Files land in Oh My Pi's layout
**ID:** omp-file-layout
- **WHEN** init generates Oh My Pi artifacts for a workflow
- **THEN** the skill is written under Oh My Pi's skills directory for that
  workflow
- **AND** the command file is written under Oh My Pi's commands directory, named
  after the slash command, opening with a header carrying a description

#### Scenario: Command references use the hyphen form
**ID:** omp-hyphen-references
- **WHEN** a generated Oh My Pi skill or command body contains a colon-form
  slash-command reference
- **THEN** the written file carries the hyphen form instead

#### Scenario: User arguments reach the agent
**ID:** omp-arguments-exposed
- **WHEN** a generated Oh My Pi command body declares an input and names no
  argument placeholder of its own
- **THEN** an argument line is inserted immediately after the input heading
- **AND** invoking the command with a value passes that value to the agent

### Requirement: Init applies the configured profile and delivery without confirming them
**ID:** configured-preferences-applied
The init command SHALL read the profile and delivery preferences from the stored
configuration and apply them directly, with no confirmation prompt, in
interactive and non-interactive runs alike. A profile named as an option SHALL
apply to that run only and SHALL NOT be written back to the stored preference.

#### Scenario: A stored custom profile installs its own workflows
**ID:** stored-profile-applied
- **WHEN** the stored preference names a custom profile with its own workflow list
- **THEN** init installs exactly those workflows

#### Scenario: A stored delivery preference is obeyed
**ID:** stored-delivery-applied
- **WHEN** the stored preference names skills-only delivery
- **THEN** init installs skill artifacts only

#### Scenario: No profile confirmation is ever asked
**ID:** no-profile-confirmation
- **WHEN** init runs interactively with any resolved profile
- **THEN** it proceeds directly without a profile confirmation prompt

#### Scenario: A profile option does not become a preference
**ID:** profile-option-not-persisted
- **WHEN** a user runs init naming a profile as an option
- **THEN** that run uses the named profile
- **AND** the stored preference is unchanged

### Requirement: Re-running init extends an existing project instead of refusing
**ID:** extend-mode
When the store already exists, the init command SHALL report the project as
already initialized, skip recreating the base structure, and continue to tool
selection so more tools can be configured. Adding a tool SHALL generate its
artifacts exactly as a first-time setup does and SHALL leave other tools' files
untouched apart from the sections this CLI manages. A run that adds no new tool
SHALL still succeed with the existing structure and configuration intact; only a
run in which the user configures no tool at all SHALL fail as already
initialized.

#### Scenario: An initialized project continues to tool selection
**ID:** extend-continues-to-selection
- **WHEN** a user runs init where the store already exists
- **THEN** init reports the project as already initialized
- **AND** proceeds to tool selection instead of stopping

#### Scenario: A second tool joins an existing setup
**ID:** extra-tool-added
- **GIVEN** a project already configured for one tool
- **WHEN** the user runs init and selects a different supported tool
- **THEN** the new tool's artifacts are generated the same way as at first-time
  setup
- **AND** the first tool's artifacts remain in place

#### Scenario: Adding nothing new is still a success
**ID:** empty-extend-succeeds
- **WHEN** an already-initialized project is re-initialized with no new tool
  selected
- **THEN** init completes successfully
- **AND** the existing structure and configuration file are preserved

### Requirement: Re-running init keeps extra workflows and enforces the current delivery
**ID:** reinit-preserves-and-cleans
On an existing project the init command SHALL regenerate the active profile's
artifacts from the current templates, SHALL NOT remove installed workflows that
fall outside that profile, and SHALL remove artifacts whose kind no longer
matches the delivery setting — including artifacts belonging to those extra
workflows — even when every template is already current.

#### Scenario: Workflows outside the profile survive
**ID:** extra-workflows-kept
- **GIVEN** a project with workflows installed beyond the active profile
- **WHEN** the user re-runs init
- **THEN** the profile's artifacts are rewritten from the current templates
- **AND** the extra workflows' artifacts are left installed

#### Scenario: A changed delivery setting removes the other artifact kind
**ID:** delivery-cleanup-on-reinit
- **GIVEN** a project installed under both-kind delivery
- **WHEN** the user re-runs init with the delivery setting now skills only
- **THEN** the generated command files are removed

#### Scenario: Cleanup happens even when nothing else changed
**ID:** cleanup-when-templates-current
- **GIVEN** every installed artifact is already on the current template version
- **WHEN** the delivery setting changed since the previous run
- **THEN** init still removes the artifacts that no longer match delivery

### Requirement: Init migrates a project that predates profile preferences
**ID:** init-migration
When the init command runs on a project that already holds generated workflow
artifacts and no recorded profile preference, it SHALL perform the same one-time
migration the update command performs before continuing, and SHALL then proceed
using the migrated preference. A project holding no generated workflow artifacts
SHALL NOT be migrated and SHALL start from the default profile.

#### Scenario: An existing project is migrated first
**ID:** reinit-migrates
- **GIVEN** a project with generated workflow artifacts and no recorded profile
  preference
- **WHEN** the user runs init
- **THEN** the one-time migration records a profile matching what is installed
- **AND** init proceeds using that migrated preference

#### Scenario: A new project is not migrated
**ID:** fresh-project-not-migrated
- **GIVEN** a project with no generated workflow artifacts and no recorded
  profile preference
- **WHEN** the user runs init
- **THEN** no migration is performed
- **AND** init proceeds from the default profile
