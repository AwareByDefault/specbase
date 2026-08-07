---
id: behavior.config.profiles
---

### Requirement: A profile decides which workflows a project gets
**ID:** profile-definitions
The system SHALL support two workflow profiles. The `core` profile SHALL resolve
to the maintained default workflow set and SHALL ignore any custom workflow
list. The `custom` profile SHALL resolve to exactly the configured workflow
list, including the empty list.

#### Scenario: Core profile
**ID:** core-resolves-defaults
- **WHEN** the profile is `core`
- **THEN** the resolved workflows are the maintained default workflow set

#### Scenario: Core profile with a stored custom list
**ID:** core-ignores-custom-list
- **WHEN** the profile is `core` and a custom workflow list is also stored
- **THEN** the resolved workflows are still the default workflow set

#### Scenario: Custom profile
**ID:** custom-resolves-declared-list
- **WHEN** the profile is `custom`
- **THEN** the resolved workflows are exactly the configured list

#### Scenario: Custom profile with nothing selected
**ID:** custom-empty-list
- **WHEN** the profile is `custom` and no workflows are configured
- **THEN** the resolved workflow set is empty

### Requirement: Delivery decides how workflows arrive, independent of the profile
**ID:** delivery-independent-of-profile
The system SHALL keep the delivery preference separate from the profile: the
profile chooses which workflows are installed and delivery chooses whether they
arrive as skills, as commands, or as both. Delivery SHALL default to both. Every
profile SHALL be installable under every delivery value.

#### Scenario: Both surfaces
**ID:** delivery-both
- **WHEN** delivery is `both`
- **THEN** each resolved workflow is installed as a skill and as a command

#### Scenario: Skills only
**ID:** delivery-skills-only
- **WHEN** delivery is `skills`
- **THEN** each resolved workflow is installed as a skill and no command files are installed

#### Scenario: Commands only
**ID:** delivery-commands-only
- **WHEN** delivery is `commands`
- **THEN** each resolved workflow is installed as a command and no skill files are installed

#### Scenario: Delivery unset
**ID:** delivery-default
- **WHEN** no delivery preference is stored
- **THEN** delivery resolves to `both`

### Requirement: Profile preferences are user-level, not project-level
**ID:** profile-preferences-stored-globally
The system SHALL store the profile, the delivery preference, and the custom
workflow list in the user-level configuration alongside the other preferences
(see `behavior.config.global`). A configuration missing any of these fields
SHALL resolve to the `core` profile and `both` delivery without disturbing the
fields that are present.

#### Scenario: Preference fields
**ID:** preference-fields
- **WHEN** profile preferences are read
- **THEN** they come from the user-level configuration, carrying profile, delivery, and the optional workflow list

#### Scenario: Preferences not yet chosen
**ID:** absent-preferences-default
- **WHEN** the stored configuration omits the profile and delivery fields
- **THEN** the profile resolves to `core` and delivery resolves to `both`
- **AND** the other stored fields are preserved

### Requirement: Configuring a profile starts from the current state and changes one axis at a time
**ID:** interactive-profile-configuration
The profile configuration flow SHALL show the current delivery and workflow
selection before asking anything, and SHALL let the user change delivery alone,
workflows alone, both, or neither. Each prompt SHALL mark and preselect the
value in force. The system SHALL derive the profile from the resulting selection:
`core` when the selection matches the default workflow set and `custom`
otherwise.

#### Scenario: Current state first
**ID:** current-state-shown-first
- **WHEN** the user starts the profile configuration flow
- **THEN** the current delivery value and the current workflow selection are shown before the first prompt

#### Scenario: One axis at a time
**ID:** independent-paths
- **WHEN** the user chooses to change delivery only
- **THEN** the workflow selection is never asked for
- **AND** the reverse holds when the user chooses to change workflows only

#### Scenario: Current value marked
**ID:** current-value-marked
- **WHEN** a choice is presented
- **THEN** the value currently in force is labelled as current and preselected

#### Scenario: Profile follows the selection
**ID:** profile-derived-from-selection
- **WHEN** the resulting workflow selection matches the default workflow set
- **THEN** the profile is stored as `core`, otherwise as `custom`

### Requirement: A selection that changes nothing writes nothing
**ID:** no-op-writes-nothing
The system SHALL treat a profile configuration run that leaves every effective
value unchanged as a no-op: it SHALL report that there were no changes, SHALL
NOT rewrite the stored configuration, and SHALL NOT offer to apply anything to
the current project.

#### Scenario: Unchanged selection
**ID:** no-change-no-write
- **WHEN** the user confirms the values already in force
- **THEN** the stored configuration file is byte-identical afterwards
- **AND** the system reports that there were no changes

#### Scenario: No apply offer after a no-op
**ID:** no-change-no-apply-prompt
- **WHEN** a profile configuration run is a no-op
- **THEN** the system does not offer to apply anything to the current project

### Requirement: Changing preferences never touches project files
**ID:** config-changes-never-touch-projects
The system SHALL confine a profile or delivery change to the user-level
configuration. No workflow file in any project SHALL be created, changed, or
removed as a side effect, and every existing project SHALL keep the workflow
files it already has.

#### Scenario: Preferences changed
**ID:** project-files-untouched
- **WHEN** the user changes the profile or the delivery preference
- **THEN** no project workflow file is created, changed, or removed

#### Scenario: Other projects
**ID:** existing-projects-keep-files
- **WHEN** the user-level preferences change
- **THEN** every project keeps its current workflow files until it is explicitly synchronised

### Requirement: Preferences reach a project only through an explicit sync
**ID:** preferences-applied-by-explicit-sync
The system SHALL apply the current user-level preferences to a project only when
the update command runs for that project. When preferences change inside a
project, the system SHALL offer to run that sync immediately. When a run makes
no change but the project's files disagree with the current preferences, the
system SHALL warn without blocking and SHALL name the command that resolves it.

#### Scenario: Apply offered after a real change
**ID:** apply-offered-after-change
- **WHEN** preferences change while the user is inside a project
- **THEN** the system offers to synchronise that project immediately
- **AND** running the sync applies the new preferences to that project

#### Scenario: Drift warning
**ID:** drift-warning-when-out-of-sync
- **WHEN** a no-op run happens inside a project whose files disagree with the current preferences
- **THEN** the system warns that the preferences are not yet applied here
- **AND** names the command that applies them
