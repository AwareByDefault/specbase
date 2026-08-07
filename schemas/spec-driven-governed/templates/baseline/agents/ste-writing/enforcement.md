# Enforcement: STE writing skill instrument

Paired with `spec.md` (`agents.ste-writing`). The operational artifact is the
STE writing SKILL.md. The default binding is a **review** binding: a consuming
project's skill set is a scaffold Specbase plants, and confirming the planted
skill declares the STE mandate is honestly review-strength evidence, not a
project-owned test.

A repository that OWNS the skill (its SKILL.md in code, e.g. Specbase itself)
should REPLACE this binding with an automated `test` one asserting the skill
file exists, is registered as invocable, and its frontmatter declares the STE
mandate and trigger — e.g. Specbase binds `ste-writing-skill-conformance` to a
vitest over its shipped skill template.

```yaml
version: 1
spec: agents.ste-writing
bindings:
  - id: ste-writing-review
    covers: [ste-writing-skill-exists, skill-present-and-registered, frontmatter-declares-mandate, body-directs-ste]
    mechanism: review
    strength: review
    status: active
    targets:
      - .pi/skills/ste-writing/SKILL.md
    review:
      lens: enforcement
      procedure: >-
        Confirm the STE writing skill is present and registered as invocable,
        its frontmatter declares the STE writing mandate and a trigger for
        applying it, and its body directs agents to write short active sentences
        and to avoid marketing adjectives and banned complex words.
      inputs:
        - .pi/skills/ste-writing/SKILL.md
    limitations: A review confirms the planted skill conforms to the spec by inspection; it does not judge the writing quality of prose an agent later produces — that outcome rides on ops.ste.
```