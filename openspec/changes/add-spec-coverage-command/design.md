# Design — Coverage command

## Bidirectionality is the point
```
FORWARD   requirement → enforcement?   →  GAPS  (under-covered intent)
REVERSE   enforcer    → requirement?   →  BLOAT (orphan tests / scope creep)
```
Forward needs only the spec + records. Reverse needs to **enumerate the codebase's enforcers**, which is the only genuinely new infrastructure here.

## Reverse-map discovery adapter
OpenSpec must not be coupled to one test framework. Define a discovery adapter interface:
```
interface EnforcerDiscovery {
  listTests(): Promise<EnforcerRef[]>   // file + name/id
  listLintRules?(): Promise<EnforcerRef[]>
}
```
v1 ships one adapter for this project's runner (vitest) and documents the contract. An enforcer is "orphan" if no record's locator resolves to it.

## `--run` without toolchain lock-in
`--run` executes runnable kinds and reads pass/fail. Options:
- **A: shell out** to a project-declared command per kind (`config.yaml: coverage.run.test: "pnpm vitest run -t {pattern}"`). Flexible, no coupling. Chosen direction.
- **B: native integration** per framework. Faster, but a coupling treadmill.

Lean A: declarative run commands in config, templated with the record locator. Absent config ⇒ `--run` degrades to `--resolve` with a note.

## Metrics surfaced
- forward coverage % (verified / attested split)
- uncovered requirement list
- orphan enforcer list
- enforcements-per-requirement ratio (bloat smell)

## Open questions
- Should orphan detection be a hard failure or warning by default? (Lean: warning; `--strict-orphans` to fail.)
- Where do thresholds live — `config.yaml` global vs per-spec override? (Lean: global default, per-spec override in frontmatter.)
