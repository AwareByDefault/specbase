# Design — Spec metadata frontmatter

## Context
This is the substrate for two later capabilities (enforcement/coverage and the feature/invariant type system). The pivotal decision is **where a requirement's stable id physically lives**, because every later mapping binds to it and the `## RENAMED Requirements` operation must not break those bindings.

## Decision: requirement id location

### Option A — inline header marker
`### Requirement: {#persistence-port} Persistence SHALL go through a port`

- **Pros:** id travels physically with the requirement block; the existing delta/rename machinery moves it for free; locality (you see the id where the requirement is). Rename-safety is automatic.
- **Cons:** changes header parsing (`REQUIREMENT_HEADER_REGEX`); mild prose noise.

### Option B — frontmatter map
```yaml
requirements:
  - id: persistence-port
    name: "Persistence SHALL go through a port"
```
- **Pros:** keeps headers clean; all metadata in one place.
- **Cons:** correlation by name is fragile — a rename must update the map in lockstep or the binding silently breaks. This re-introduces exactly the drift problem ids exist to kill.

### Recommendation
**Option A (inline marker).** The whole reason for ids is rename-safety; an id that lives anywhere other than the block it identifies must be cascaded on rename and will eventually drift. Locality buys correctness for free. Parser cost is one regex change plus round-trip preservation in `requirement-blocks.ts`.

## Decision: id generation
Ids are author-optional. When omitted, the parser derives a slug from the requirement name on first write and **persists it inline** (so subsequent renames are safe). Deterministic slug + numeric disambiguation on collision. Never auto-derive at read time only — that would re-key on rename.

## Backward compatibility
No frontmatter ⇒ `type: feature`, `labels: []`, ids slugged from names and written back on the next edit. Existing specs validate unchanged until next touched.

## Open questions
- Should `labels` be free-form strings or validated against a project-declared taxonomy in `config.yaml`? (Lean: free-form now; optional taxonomy validation later.)
- Do change *delta* specs carry frontmatter, or only main specs? (Lean: deltas may carry `type` for new capabilities; ids are assigned at sync time.)
