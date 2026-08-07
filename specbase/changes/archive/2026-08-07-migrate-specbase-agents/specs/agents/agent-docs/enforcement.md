# Enforcement: Agent instruction docs

Paired with `spec.md` (`agents.agent-docs`). Following the agents-plane pattern,
the operational artifact is the root `AGENTS.md` itself: the spec describes it
and these bindings assert the artifact conforms. The file is never generated
from the spec.

Structure and placement are deterministic — section order, copy-ready templates,
the checklist items, and the essentials/advanced split are all directly
assertable against the file, so they bind `command` conformance checks. The
judgment claims above that gate — whether the disclosure is genuinely
progressive and the guidance genuinely lightweight rather than merely containing
the words — bind a `review`. The `agents` plane declares no `reviewLens` in
`specbase/config.yaml`, so the review names the cross-cutting `enforcement` lens
explicitly and lists the presence checks it sits above in `covered_by`.

```yaml
version: 1
spec: agents.agent-docs
bindings:
  - id: quick-reference-conformance
    covers:
      - quick-reference-first
      - structures-before-narrative
      - store-and-surface-named
      - embedded-templates
      - fenced-templates-match
      - template-has-example
    mechanism: command
    strength: automated
    status: active
    targets:
      - AGENTS.md
    run:
      command: node
      args:
        - -e
        - "const fs=require('node:fs');const t=fs.readFileSync('AGENTS.md','utf8');if(t.trim().length===0){console.error('AGENTS.md is empty');process.exit(1)}const need=['## Quick reference','### `proposal.md`','### `tasks.md`','### Spec delta','### `enforcement.md`','## Why','## ADDED Requirements','### Requirement:','#### Scenario:','**ID:**','- **WHEN**','- **THEN**','Worked example:','specbase/','spcb','docs/clean-specbase.md'];for(const s of need){if(!t.includes(s)){console.error('AGENTS.md missing: '+s);process.exit(1)}}const heads=t.split(String.fromCharCode(10)).filter(l=>l.startsWith('## '));if(heads[0]!=='## Quick reference'){console.error('first section is not the quick reference: '+heads[0]);process.exit(1)}"
      cwd: .
    limitations: Asserts AGENTS.md is non-empty, opens with the quick reference,
      and carries copy-ready proposal/tasks/spec-delta/enforcement structures, a
      worked example, and the current store and skill-surface names. Does not
      judge whether the templates are correct for the schema in force.

  - id: checklist-conformance
    covers:
      - pre-validation-checklist
      - common-failures-listed
      - pair-checks-included
    mechanism: command
    strength: automated
    status: active
    targets:
      - AGENTS.md
    run:
      command: node
      args:
        - -e
        - "const fs=require('node:fs');const t=fs.readFileSync('AGENTS.md','utf8');const need=['## Pre-validation checklist','openspec validate','Frontmatter `id`','delta section header','### Requirement:','#### Scenario:','**ID:**','Descriptive requirement text','`enforcement.md` exists beside every governed','existing target on disk'];for(const s of need){if(!t.includes(s)){console.error('checklist missing: '+s);process.exit(1)}}const items=t.split(String.fromCharCode(10)).filter(l=>l.startsWith('- [ ] '));if(items.length<8){console.error('checklist too thin: '+items.length+' items');process.exit(1)}"
      cwd: .
    limitations: Asserts a checklist section exists with at least eight items
      naming the header, ID, scenario, delta-section, and pair/binding failure
      modes. Does not prove the list matches the validator's current diagnostics.

  - id: guidance-sections-conformance
    covers:
      - progressive-disclosure
      - essentials-are-minimal
      - advanced-labeled-and-linked
      - behavior-first-guidance
      - spec-versus-implementation
      - detail-routed
      - lightweight-by-default-guidance
      - rigor-scales-with-risk
      - smallest-reviewable-spec
    mechanism: command
    strength: automated
    status: active
    targets:
      - AGENTS.md
    run:
      command: node
      args:
        - -e
        - "const fs=require('node:fs');const t=fs.readFileSync('AGENTS.md','utf8');const need=['## The essentials','### 1. Scaffold','### 2. Draft','### 3. Validate','### 4. Request review','# Advanced','## Product lens first','## Behavior-first authoring','## Lightweight by default','](#','design.md','tasks.md','externally verifiable behavior','smallest spec that is still testable and reviewable','proportional to risk'];for(const s of need){if(!t.includes(s)){console.error('guidance missing: '+s);process.exit(1)}}const body=t.split(String.fromCharCode(10));const ess=body.findIndex(l=>l==='## The essentials');const adv=body.findIndex(l=>l==='# Advanced');if(ess<0||adv<0||adv<ess){console.error('advanced material does not follow the essentials');process.exit(1)}"
      cwd: .
    limitations: Asserts the essentials/advanced split exists in that order, that
      anchor links are present, and that the behavior-first and
      lightweight-by-default guidance is stated. Presence of the words is not
      proof the guidance is well-formed — see `guidance-quality-review`.

  - id: guidance-quality-review
    covers:
      - progressive-disclosure
      - advanced-labeled-and-linked
      - behavior-first-guidance
      - lightweight-by-default-guidance
      - rigor-scales-with-risk
      - smallest-reviewable-spec
    mechanism: review
    strength: review
    status: active
    lens: enforcement
    targets:
      - AGENTS.md
    review:
      procedure: >-
        Read AGENTS.md end to end as a newcomer agent. Confirm the essentials
        section is genuinely sufficient to scaffold, draft, validate, and
        request review without reading the advanced material, and that every
        advanced topic named in the quick reference resolves to a real anchor.
        Confirm the behavior-first guidance draws a usable line between spec
        content and design/tasks content rather than restating the rule, and
        that the lightweight-by-default guidance would actually lead an agent to
        write a smaller spec. Confirm the file still describes this repository
        as it is today - the specbase/ store, the spcb surface, the installed
        openspec CLI - with no stale openspec/ or opsx references.
      inputs:
        - AGENTS.md
        - docs/clean-specbase.md
        - specbase/config.yaml
    limitations: Review-strength residue above the presence checks; judgment about
      teaching quality and staleness is made by reading, not by a harness.
    covered_by:
      - quick-reference-conformance
      - guidance-sections-conformance
```
