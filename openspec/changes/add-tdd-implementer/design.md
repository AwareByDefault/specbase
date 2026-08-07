# Design — TDD implementer

## How classic TDD avoids bloat (and how we operationalize each)
Real TDD discipline already contains anti-bloat governors. The insight is that our spec model gives each one a *mechanism* instead of relying on developer virtue:

| Classic TDD discipline | What it means | Our mechanism |
|---|---|---|
| **Triangulation** — only add a test that drives new behavior | a test that wouldn't change production code isn't written | **scenarios are the budget** — the test set is bounded by the spec's scenarios; no scenario ⇒ no test |
| **Test behavior, not implementation** | assert at meaningful boundaries, not every internal | scenarios are written in WHEN/THEN observable terms |
| **Test pyramid** | many unit, fewer integration/e2e; pick the right level | many-to-many `enforces` lets one higher-level test cover several requirements |
| **Delete scaffolding / redundant tests** | culling is legitimate once behavior is covered elsewhere | **coverage-aware cull pass** — reverse map flags redundant vs sole-enforcer |
| **Coverage is a floor, not a target (Goodhart)** | chasing 100% line coverage breeds trivia tests | coverage is over *requirements/intent*, not lines; trivia goes to types/lint |
| **Regression tests on real bugs** | add a test when a bug appears, not for every hypothetical | a found bug ⇒ add a scenario ⇒ add its test (stays spec-driven) |

## Yes, you can cull — safely
Culling is first-class here, and safer than ad-hoc deletion because it is **coverage-aware**:
```
candidate to delete ──▶ reverse map: which requirements does it enforce?
   every one still covered by another enforcement?  ── yes ──▶ safe cull (redundant)
                                                     ── no  ──▶ blocked (sole enforcer)
```
So "cull tests after" becomes: run coverage → review orphans + redundant enforcers → delete the redundant, keep the sole enforcers. A deletion that would open a coverage gap is refused with the requirement it would uncover.

## The loop
```
for each requirement:
  for each scenario:
    1. already enforced? (existing test/type/lint) → link it, write nothing
    2. else climb the ladder: type → lint → extend existing test → one shared test → dedicated test → manual
    3. red → green → refactor
    4. register enforcement record (enforces: [reqId])
after green:
  5. coverage-aware consolidation pass (cull redundant, never sole-enforcer)
```

## Open question
- Strictness of "no test without a scenario": hard rule (block the test) vs strong guidance (warn). Hard rule keeps the spec authoritative but adds friction when an implementer discovers something mid-flow. Lean: strong guidance + a fast "add scenario" affordance so staying spec-driven is the path of least resistance.
