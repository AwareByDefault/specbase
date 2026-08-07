## Why

A spec's requirements and scenarios map cleanly onto tests: a `#### Scenario:` (WHEN/THEN) is a test case in all but syntax. Once enforcement records exist, it is natural to have the implementer work **test-first** — driving each requirement into being via its scenarios. This makes intent → test causal rather than retrofitted, and keeps coverage live as code is written.

The risk is test bloat. But classic TDD already has anti-bloat discipline, and our model *operationalizes* it. The key realization: **the spec's scenarios are the test budget.** TDD-in-a-vacuum bloats because nothing bounds what to test; here the scenarios bound it from above (don't test beyond them) and coverage bounds it from below (don't leave them untested). Combined with many-to-many enforcement (consolidation), the reverse map (culling), and the minimum-sufficient-enforcement ladder (push trivia off the suite), the result is a useful suite without bloat.

Depends on `add-requirement-enforcement`; the cull pass uses `add-spec-coverage-command`'s reverse map.

## What Changes

- Teach the implementer skill (apply/implement) a **spec-driven TDD loop**: for each requirement, drive its scenarios red → green → refactor, then register the enforcement record(s).
- **Link beats write:** before authoring a new test, climb the minimum-sufficient-enforcement ladder (type → lint → extend existing test → one shared test → dedicated test → manual) and reuse existing enforcement where it already covers the scenario.
- **Scenarios are the budget:** the implementer SHALL NOT invent tests beyond the spec's scenarios. If implementation reveals a behavior worth testing that has no scenario, the implementer SHALL add the scenario to the spec first (stay spec-driven), not grow the suite silently.
- **Consolidation / cull pass:** after green, use the coverage reverse map to find redundant tests (a test whose removal leaves its requirement still covered) and consolidate them. Distinguish *redundant* (safe to cull) from *sole enforcer* (never cull) — culling is coverage-aware, so a deletion that would drop a requirement below coverage is blocked.

## Capabilities

### New Capabilities

- `tdd-implementation`: A spec-driven test-first implementation loop where scenarios bound the test set, enforcement records are registered as code is written, and a coverage-aware consolidation pass removes redundant (never sole-enforcer) tests.

### Modified Capabilities

- `cli-artifact-workflow` (apply/implement): Drive tasks scenario-by-scenario test-first; register enforcement; run the cull pass.

## Impact

- `.claude/skills/openspec-apply-change` (and generated equivalents) — the TDD loop, the ladder, the budget rule, the cull pass.
- Relies on `enforcement-model` records and `cli-coverage` reverse map; no new core schema.
- Open design decision (see design.md): how strictly to enforce "no test without a scenario" vs allow implementer judgment.
