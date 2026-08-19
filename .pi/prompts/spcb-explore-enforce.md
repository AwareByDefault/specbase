---
description: Explore enforcement for a proposed feature - decide how each requirement is known to hold
---

Explore enforcement for a feature that is already proposed.

This is the **second phase** of the two-phase proposal workflow. The FEATURE phase
(`/spcb-explore`, `/spcb-propose`) decided WHAT must remain true. This phase
decides HOW we would know each requirement still holds.

**Input (given - do not re-explore):** the feature's spec deltas under
`specs/<plane>/<locator>/spec.md` and the `design.md` on the SAME change. They
are the contract. Do not re-explore the feature's scope or rationale.

**Job - verification only.** For every requirement:

- Name how the claim could be **observed or failed**.
- Pick the **highest-leverage** check among the resolved enforcement types:
  `test`, `lint`, `static-analysis`, `command`, `review`, `manual`.
  One fitness function beats many example tests; an honest `review`/`manual`
  conclusion beats a hollow automated test. 'degraded' is a legitimate, visible
  state - never write a hollow test to paper over it.
- If no automated check can meaningfully exercise the claim, say so plainly and
  choose an honest review/manual conclusion.
- **Flag any requirement too vague to observe** (no check could ever fail it).
  Those are the candidates the enforcement phase may rewrite toward
  verifiability.

Write the strategy into the change's `design.md` **`Enforcement design`**
section (reuse it - do not create a new artifact). Focus ONLY on verifiability.

**Guardrail:** never expand the feature's scope. You are deciding how to prove
what is already specified, not inventing new behavior.
