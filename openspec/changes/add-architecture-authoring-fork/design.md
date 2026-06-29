# Design — Architecture authoring & provenance

## The fork
```
 /opsx:explore "add a database for sessions"
        │  agent: BEHAVIOR + establishes ARCHITECTURE  → fork
        ▼
 /opsx:propose
   feature-sessions   type: feature    "sessions persist"        → TEST   (ephemeral)
   invariant-persist  type: invariant  "go through a Repo port"  → LINT   (durable, injected)
   design.md          how they fit
```
One need → two specs → different lifecycles, linked by provenance.

## Detection heuristic (soft + structural)
Triggers: new external dependency · new seam/boundary · technology choice · cross-cutting concern (errors, auth, logging, persistence).
- **Soft:** explore/propose skill instructions teach the fork and "minimum sufficient invariant."
- **Structural:** `validate` warns when a signal is present but no invariant is declared, so discipline holds when the model misses it.

## Provenance storage
Edges live in spec frontmatter (built on `add-spec-metadata-frontmatter`):
```yaml
# invariant
bornFrom: add-database
# feature
reliesOn: [persistence-port]
```
Validated for resolution + cycles; surfaced in show/doctor. The artifact-graph today only models artifact-type deps (proposal→design→tasks); this adds a cross-spec edge type.

## Lifecycle: one change, two exit doors
On archive:
- feature delta → merged into feature specs → change folds away (today's behavior)
- invariant → promoted to a standing durable spec + registered into injected context (new)

The archive command must branch on spec type. This is the trickiest mechanical wrinkle in the series.

## Open questions
- Strictness of the missing-invariant gate: warn-only vs `--strict-architecture` to fail. (Lean: warn; opt-in fail.)
- Should `bornFrom` point at the change id (which is archived/ephemeral) or a stable archived-change reference? (Lean: stable archive ref so the edge survives archival.)
- How does the agent reliably detect "cross-cutting"? Likely needs examples in the skill prompt, not just a rule list.
