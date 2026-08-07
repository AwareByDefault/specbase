## Why

The `clean-spec.md` and `clean-specbase.md` manifestos state how to write and
organize governed specs, but nothing connects them to the propose/explore
skills that authors actually run. The skills are *generated* from
`governed-guidance.ts`, and `docs/` does not ship, so today the manifesto rules
would have to be hand-copied into the generator — a second home for the same
truth that will silently drift. We want editing a manifesto to be the single
act that updates what the skills inject, with a check that makes drift
impossible.

## What Changes

- Each manifesto (`docs/clean-spec.md`, `docs/clean-specbase.md`) gains a
  marked, hand-authored **Rules** section: the distilled imperative SHALLs an
  agent applies, separate from the surrounding reasoning.
- A build-time codegen step extracts those marked Rules sections into a
  generated TypeScript module; `build.js` runs it before `tsc`.
- `governed-guidance.ts` imports the generated rules constant instead of
  restating the rules inline, so every generated skill carries the current
  manifesto rules and installed repos receive them via `openspec update`.
- The `propose` guidance gains a **structure surface**: after placing specs it
  shows the chosen locators with the clean-specbase rule it applied, then
  offers to discuss — rather than diving straight into authoring. Writing
  quality (clean-spec) is applied always, never prompted.
- The stale hand-written plane primer in the propose skill is dropped; it
  inherits the shared generated guidance.

## Planes

### Agents truth
The change modifies the repo's OWN agentic instruments — the generated
spec-driven skills and the codegen pipeline that feeds them. It DESCRIBES those
artifacts and binds a conformance/drift check against them. No user-facing CLI
contract, package selection, or code-quality rule changes, so no other plane is
in scope: the codegen exists solely to produce the agent instrument, and its
drift check is the agents-plane conformance mechanism.

- `agents.clean-manifesto`: the clean-spec/clean-specbase manifestos are the
  single source of the rules injected into the generated skills, the build
  propagates them, generated skills never restate divergent rules, and the
  propose skill surfaces chosen structure before authoring (new)

## Spec pairs

- `agents.clean-manifesto` -> paired enforcement via a `command` drift check
  (marked Rules section == generated constant) plus a `command`/`review`
  conformance check that the generated propose skill carries the structure
  surface and the injected rules.

## Impact

- **Docs**: `docs/clean-spec.md`, `docs/clean-specbase.md` gain marked Rules
  sections.
- **Build**: `build.js` gains a codegen stage; a new generated module
  (e.g. `src/core/templates/workflows/clean-rules.generated.ts`).
- **Generator**: `src/core/templates/workflows/governed-guidance.ts` imports the
  generated rules; propose guidance gains the structure-surface step.
- **Propagation**: no new command — existing `openspec init` / `openspec update`
  re-emit skills from the updated generator.
- **Regenerated outputs**: `.pi/skills/openspec-propose`, `openspec-explore`
  (and other tools' generated skills) change on next build/update.
