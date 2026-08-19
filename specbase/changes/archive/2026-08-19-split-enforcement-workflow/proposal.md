## Why

Enforcement is the hardest, most judgment-heavy part of the governed workflow, yet it is
produced by the same one-shot `explore -> propose` pass that also writes the proposal, the
specs, the design, and the tasks. When an agent writes all five artifacts in one automated
loop, enforcement is where the quality drops: bindings default to hollow `type: test` entries
with no real plan behind them. The repo's own doctrine already rejects this — *"coverage is a
mirror, not a target… never write a hollow test to inflate coverage"* — but nothing in the
workflow forces the judgment to actually happen. It is a doctrine, not a step.

We want enforcement to receive the same deliberate, discovery-driven ceremony the feature
gets. So we split enforcement into its own `explore-enforce -> propose-enforce` cycle,
sequenced *after* the feature. A dedicated pass starts from the feature's requirements and
asks, per requirement, *how would we actually know this still holds?* — and picks the
highest-leverage, honest check, or rewrites the requirement/design toward verifiability when
none exists.

This is the first of two changes. It defines the two-phase (feature → enforcement) proposal
shape. The follow-up `work-item-lifecycle` change surfaces the resulting `proposed` /
`enforcement` pause as tracked lifecycle states.

## What Changes

- **Strip enforcement out of the feature pass:** `spcb:explore` drops its stage-three
  enforcement sketching (behavior + structure only); `spcb:propose` creates `proposal.md`,
  the spec deltas, and `design.md` but stops there, leaving the enforcement/testing sections
  as explicit TO-BE-FILLED placeholders and writing **no** `enforcement.yaml`.
- **Add `spcb:explore-enforce`:** takes the feature's requirements as given input and explores
  how each can be observed / verified (highest-leverage check among `test` / `lint` /
  `static-analysis` / `command` / `review` / `manual`), flagging requirements that cannot be
  honestly verified. Focused only on verification; the thinking lives in `design.md`'s
  `Enforcement design` section (reused, not a new artifact).
- **Add `spcb:propose-enforce`:** on the same change, fills `enforcement.yaml`, fills
  `proposal.md`'s `Enforcement intent` table, fills `design.md`'s `Enforcement design` source
  contracts, and updates `tasks.md` with the evidence-delivery tasks. MAY emit
  testability-driven `MODIFIED` deltas into the existing specs/design when exploration revealed
  a requirement too vague to observe or a design too coupled to test.
- **Bring the `enforcement` lens judgment forward:** the question a reviewer asks after the
  fact — *"does the bound check actually exercise the claim?"* — is now asked while designing
  the enforcement, not only as an after-the-fact review. The review panel is **not** made a
  hard gate.
- **Enforcement quality stance:** the goal is decided, high-leverage, honest bindings. A
  fitness function beats many example tests; honest `review` / `manual` strength beats a
  hollow automated test; `degraded` remains a legitimate, visible state.

## Planes

### Agents truth
- `agents.workflow`: a new governed pair describing the repo's own workflow instruments —
  the two new skills (`explore-enforce`, `propose-enforce`) and the narrowed feature skills
  (`explore`, `propose`). It is the agent-operational artifact (the SKILL.md surface) this
  repo owns, and it is enforced by conformance checks against that surface.

No other plane is required. This change alters workflow instruments and templates only; it
introduces no new user-visible CLI contract, no new package or dependency boundary, no ops
selection, and no code-quality rule change. Enforcement-quality *guidance* is honored by the
skills, but it is workflow behavior of a repo-owned instrument, hence agents truth.

## Enforcement intent

| Covered truth | Planned type | Planned source | Intended proof |
|---|---|---|---|
| `enforcement-own-phase` | `command` (conformance) | `.pi/prompts/spcb-propose.md` | A conformance drift check asserts the feature-mode propose prompt stops after `design`, leaves the testing sections TO-BE-FILLED, and does not emit `enforcement.yaml` |
| `enforcement-own-phase` | `command` (conformance) | `.pi/skills/specbase-propose-enforce/SKILL.md` | A conformance drift check asserts the enforcement skill completes the same change and owns the enforcement output |
| `enforcement-own-phase` | `review` | `enforcement` | A review binding asserts the new skills actually own the enforcement judgment, not just a hollow placeholder |
| `explore-enforce-skill` | `command` (conformance) | `.pi/skills/specbase-explore-enforce/SKILL.md` | A conformance drift check asserts the `explore-enforce` skill is verification-only and flags unverifiable requirements |
| `verifiability-feedback` | `command` (conformance) | `.pi/skills/specbase-propose-enforce/SKILL.md` | A conformance drift check asserts `propose-enforce` fills `enforcement.yaml` and may emit testability-driven MODIFIED deltas |

## Impact

- Affected code: the `spcb` skill surface (`.pi/skills/specbase-explore`, `specbase-propose`, new
  `specbase-explore-enforce`, `specbase-propose-enforce`, plus their `.pi/prompts/spcb-*`
  prompts), the propose workflow template (`src/core/templates/workflows/propose.ts`), and the
  proposal/design templates (mark enforcement sections as TO-BE-FILLED).

Enforcement for the agents pair uses `command` conformance sources tied to the workflow skill
files (the established agents-plane pattern) plus the cross-cutting `enforcement` review lens.
- Affected specs: `agents/workflow` (new pair).
- No public CLI contract or package boundary changes.
