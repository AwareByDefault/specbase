# Design — Enforcement fidelity verification (DEFERRED)

## Status
Deferred. Captured to preserve the boundary decision. Changes 1–6 ship without it. The lighter bar — a lint rule that exists and runs in the commit hook — is the default; this adds optional rigor only if that proves insufficient.

## The boundary (the whole point)
```
spec.md (invariant)          OpenSpec                    project-owned harness (ONE small test)
  examples: compliant[]  ──▶  spec show <inv>        ──▶  load examples from JSON
            violating[]       --examples --json           run THE PROJECT'S OWN linter on them
                                                          assert: compliant clean / violating flagged
        ▲ single source of truth                       ▲ thin glue; never edited when examples change
   OpenSpec serves data, runs nothing                  project runs its own tools, any language
```

- **OpenSpec's only job:** expose examples as structured data. Language-agnostic, trivial.
- **The project's job:** one harness that consumes the data and runs its own tooling its own way.
- **Sync is automatic** because there is no second copy of the examples — the harness reads them from the spec. This is the fix for the drift trap that hand-copied rule-tests would create.

## Why not have OpenSpec verify fidelity itself
Explored and rejected for v1: materializing examples into a throwaway `git worktree` and running the project's check command (differential discrimination: violating verdict strictly worse than compliant). It works in principle and is language-agnostic, but it makes OpenSpec a polyglot test harness — heavy, assumption-laden, and buggy across ecosystems. The data-driven, project-owned harness gets the same fidelity guarantee with OpenSpec running nothing.

## Soundness note
Black-box discrimination is only as sound as the examples are **minimal pairs** — compliant and violating differing by exactly the governed thing. That authoring discipline (not machinery) is what makes "violating flagged, compliant clean" attributable to the invariant. Document it; do not try to mechanize it.

## Open questions (for when this is picked up)
- Reference harness: ship a tiny example harness per popular ecosystem as docs, or stay purely contract-level?
- Should the `faithful` rung feed the commit-hook gate, or remain report-only?
- Multi-file examples (rules needing import resolution) — extend the example shape with an optional `files:` set, or keep single-file only.
