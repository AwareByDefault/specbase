---
id: behavior.cli.legacy-cleanup
---

### Requirement: Setting a project up detects artifacts left by earlier versions
**ID:** legacy-artifact-detection
Before it writes anything, the CLI SHALL scan the project for artifacts earlier
versions left behind: each supported tool's instruction file carrying the managed
marker block, each supported tool's managed command or workflow files, the
generated agent-instructions file inside the store, a root instructions file
carrying the managed marker, and the legacy project document. Where a tool's
managed command directory was renamed between versions, files under the previous
directory name SHALL be detected too.

#### Scenario: Instruction files carrying the managed marker are found
**ID:** marked-config-files-detected
- **WHEN** the CLI scans a project that was set up by an earlier version
- **THEN** every supported tool's instruction file that carries the managed marker
  block is reported
- **AND** a file without the marker block is left alone

#### Scenario: Managed command and workflow artifacts are found
**ID:** managed-command-artifacts-detected
- **WHEN** the CLI scans a project that was set up by an earlier version
- **THEN** the managed command directories and command files of each supported
  tool are reported

#### Scenario: A renamed command directory is still found
**ID:** renamed-command-directory-detected
- **WHEN** a tool's managed command directory was renamed between versions
- **AND** files remain under the previous directory name
- **THEN** those files are reported as legacy artifacts

#### Scenario: Store and root instruction files are found
**ID:** structure-files-detected
- **WHEN** the CLI scans a project that was set up by an earlier version
- **THEN** a generated agent-instructions file inside the store is reported
- **AND** a root instructions file carrying the managed marker is reported
- **AND** the legacy project document is reported for migration

### Requirement: Cleanup is confirmed when it can be, and safe when it cannot
**ID:** cleanup-confirmation
When legacy artifacts are found, the CLI SHALL first show what it found. In an
interactive session it SHALL then ask whether to upgrade and clean up, defaulting
to yes; a user who declines SHALL have setup cancelled with nothing changed and
SHALL be told how to proceed. Where the CLI cannot ask, or the user already asked
it to proceed, cleanup SHALL run automatically, because everything deleted is
wholly managed by the tool and instruction files only lose the managed block.

#### Scenario: What was found is shown before anything changes
**ID:** detection-shown-first
- **WHEN** legacy artifacts are found
- **THEN** the CLI reports what it found before it changes any file

#### Scenario: Declining cancels and changes nothing
**ID:** decline-cancels
- **GIVEN** an interactive session with legacy artifacts detected
- **WHEN** the user declines the cleanup
- **THEN** setup is cancelled
- **AND** no legacy artifact is removed or modified
- **AND** the CLI states how to proceed without the prompt

#### Scenario: A session that cannot ask cleans up anyway
**ID:** unprompted-auto-cleanup
- **WHEN** legacy artifacts are found and the CLI cannot ask the user
- **THEN** cleanup runs automatically
- **AND** managed command files are removed
- **AND** instruction files lose only the managed block

### Requirement: A user's own file is edited, never deleted
**ID:** surgical-config-edit
The CLI SHALL never delete a file that belongs to the user's project root. From
such a file it SHALL remove only the managed marker block, preserve every line
before and after it, and collapse the blank lines the removal leaves behind. A
file whose entire content was the managed block SHALL remain in place, empty.

#### Scenario: Content around the managed block survives
**ID:** mixed-content-preserved
- **WHEN** an instruction file holds content outside the managed marker block
- **THEN** only the marker block is removed
- **AND** every line before and after it is preserved
- **AND** blank lines left by the removal are collapsed

#### Scenario: A file that held only the managed block stays
**ID:** marker-only-file-kept
- **WHEN** an instruction file's entire content was the managed marker block
- **THEN** the block is removed
- **AND** the file remains in place, even though it is now empty

### Requirement: Wholly managed artifacts are deleted outright
**ID:** managed-artifact-removal
Artifacts the tool generated in full — legacy command directories and command
files, and the generated agent-instructions file inside the store — SHALL be
deleted entirely. The directories that contained them SHALL survive, because
those directories hold the user's other content.

#### Scenario: A legacy command directory is deleted
**ID:** command-directory-deleted
- **WHEN** a legacy managed command directory is cleaned up
- **THEN** the directory and everything in it is deleted

#### Scenario: Containing directories survive
**ID:** parents-survive
- **WHEN** a legacy managed artifact is deleted
- **THEN** the directory that contained it remains

### Requirement: The legacy project document is preserved with a migration hint
**ID:** project-document-preserved
The CLI SHALL NOT delete the legacy project document, because it may hold prose
the user wrote. Instead it SHALL report that the document still exists and name
where its content now belongs.

#### Scenario: The document survives cleanup
**ID:** project-doc-kept
- **WHEN** cleanup runs on a project that still has the legacy project document
- **THEN** the document is not deleted

#### Scenario: A migration hint says where the content belongs
**ID:** migration-hint-shown
- **WHEN** the legacy project document is present during cleanup
- **THEN** the output names the document
- **AND** states which configuration field its content should move to

### Requirement: Cleanup reports what it changed and what still needs a human
**ID:** cleanup-report
After cleanup the CLI SHALL list each artifact it removed and each file it
modified, SHALL list anything needing manual migration in a separate section,
SHALL report a per-artifact failure and continue with the rest, and SHALL print no
cleanup section at all when nothing legacy was found.

#### Scenario: The summary lists removals and modifications
**ID:** summary-lists-actions
- **WHEN** cleanup completes having changed something
- **THEN** each removed artifact and each modified file is listed
- **AND** anything needing manual migration appears in its own section

#### Scenario: One failure does not stop the rest
**ID:** failures-reported-and-cleanup-continues
- **WHEN** one artifact cannot be removed
- **THEN** the failure is reported
- **AND** the remaining artifacts are still cleaned up

#### Scenario: A clean project says nothing
**ID:** silent-when-nothing-found
- **WHEN** no legacy artifact is found
- **THEN** no cleanup section is printed
- **AND** setup continues directly
