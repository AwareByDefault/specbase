# Design — Invariant spec type

## Invariants are enforced, injected ADRs
A normal ADR is passive documentation that drifts. An invariant is an ADR with teeth:
```
ADR statement  ──▶ lint binding      (code can't drift)
               └─▶ context injection (the AI never drafts the drift)
```
Prevention (injection) + enforcement (lint) is the whole AI-guardrails thesis: belt and suspenders.

## Hybrid body shape (mirrors features)
```
INVARIANT                          FEATURE
── Decision (statement+rationale)  ── Requirement: X SHALL
── Compliant example   ≈ positive  ──   #### Scenario (WHEN/THEN)
── Violating example   ≈ negative  ──   #### Scenario
   (double as lint fixtures)            (double as test cases)
```
Shared skeleton — *normative claim + examples that double as enforcement fixtures* — different vocabulary and default enforcement. Keeps the parser largely unified.

## Generated config: compose at load, never mutate
The project's own config rule says "if we generate it, we track it by name" and warns against clobbering hand edits. So invariants are **not** written into `config.yaml`. The config loader composes:
```
working context = hand-written context/rules  ⊕  invariant-derived guardrails (by id)
```
De-dup by invariant id so a hand-stated rule isn't injected twice. Single source of truth = the invariant specs.

## Coverage means something different for invariants
- Feature coverage: "is this requirement enforced by a test?" — point-in-time, per-feature.
- Invariant coverage: "is this constraint lint-active AND injected?" — continuous, codebase-wide. The reverse map for an invariant is *violations* (the lint failing), not orphan tests.

## Open questions
- Injection surface: a new key (e.g. `rules.implementation`) vs a dedicated `<guardrails>` block distinct from `<rules>`? (Lean: dedicated block so authoring-rules and implementation-guardrails stay separable.)
- Discovery for injection: inject all `type: invariant` specs vs an opt-in subset (some invariants may be lint-only, not worth context budget). (Lean: inject by default; allow `inject: false` in frontmatter.)
- Context budget: many invariants could bloat the prompt. Need a budgeting/prioritization story (labels? severity?).
