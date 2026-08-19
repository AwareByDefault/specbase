---
name: specbase-explore-enforce
description: Explore enforcement for a proposed feature: decide, per requirement, how the claim is known to hold, choosing the highest-leverage honest check. Run AFTER the feature pass, on the same change.
allowed-tools: Bash(specbase:*)
license: MIT
compatibility: Requires specbase CLI.
metadata:
  author: specbase
  version: "1.0"
  generatedBy: "1.6.0"
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

**Store selection:** If the user names a store (a store is a standalone Specbase repo registered on this machine) or the work lives in one, run `specbase store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `specbase/` root.

## Enforcement focus

This skill is laser-focused on verifiability. The feature pass already fixed WHAT must remain true; this pass fixes HOW each requirement is known to hold. Do not drift into feature decisions. Reuse `design.md`'s `Enforcement design` section; do not create a new verification artifact.
