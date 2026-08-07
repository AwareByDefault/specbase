---
id: behavior.workflow.templates
---

### Requirement: The templates command shows where every artifact's template comes from
**ID:** templates-command
The system SHALL list, for the schema in effect or one named on the command
line, every artifact together with the resolved path of its template and the
location that template came from — project, user, or package.

#### Scenario: The schema in effect
**ID:** templates-default-schema
- **WHEN** a user lists templates without naming a schema
- **THEN** the resolved schema is reported, with every artifact and its template path

#### Scenario: A named schema
**ID:** templates-named-schema
- **WHEN** a user lists templates naming a schema
- **THEN** the templates of that schema are reported instead

#### Scenario: The origin of each template is stated
**ID:** templates-report-source
- **WHEN** templates are listed
- **THEN** each entry states whether its template came from the project, the
  user's data directory, or the package

### Requirement: A template loads from its own schema's template directory
**ID:** template-loading
The system SHALL load an artifact's template from the resolved schema's template
directory, and SHALL fail naming the template path when the file is absent.

#### Scenario: The template is present
**ID:** template-loaded
- **WHEN** an artifact's template is requested for a named schema
- **THEN** the file is read from that schema's own template directory

#### Scenario: The template is absent
**ID:** template-missing
- **WHEN** the named template file does not exist in the schema's template directory
- **THEN** loading fails and the error names the template path

### Requirement: The governed schema ships an authoring template for every plane it declares
**ID:** per-plane-authoring-templates
The system SHALL ship, with the governed schema, a distinct non-empty authoring
template for each plane the schema declares, so an author of any plane starts
from a worked example rather than a blank file. Each such template SHALL show
the plane's own structure, including the direction in which its specs describe
their subject and the strata that plane separates.

#### Scenario: Every declared artifact has a template on disk
**ID:** governed-templates-present
- **WHEN** the governed schema is resolved
- **THEN** every artifact it declares has a non-empty template file inside the
  schema's own template directory

#### Scenario: The design-system plane has its own worked template
**ID:** design-system-template
- **WHEN** an author writes a design-system spec
- **THEN** the shipped template for that plane demonstrates its token stratum,
  its voice stratum, and the direction in which the spec describes its subject

#### Scenario: Shipped spec templates are themselves valid
**ID:** templates-parse-cleanly
- **WHEN** a shipped per-plane authoring template is read as a governed spec
- **THEN** it parses without issues, carrying a stable identity and per-requirement
  and per-scenario identities
