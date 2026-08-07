# Enforcement: STE writing skill instrument

Paired with `spec.md` (`agents.ste-writing`). The operational artifact is the STE
writing SKILL.md. Enforcement is a skill-conformance test: it asserts the skill
file exists, is registered as invocable, and its frontmatter declares the STE
mandate and trigger. This is instrument-conforms-to-spec evidence, the agents
plane's flavor. The binding is `planned` until the SKILL.md ships and is
registered; apply resolves it to `active`.

```yaml
version: 1
spec: agents.ste-writing
bindings:
  - id: ste-writing-skill-conformance
    covers: [ste-writing-skill-exists, skill-present-and-registered, frontmatter-declares-mandate, body-directs-ste]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/skills/ste-writing.conformance.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/skills/ste-writing.conformance.test.ts]
      cwd: .
    limitations: Asserts the STE writing skill is present in the registered skill set and that its frontmatter names the STE mandate and a trigger, and that its body directs STE prose. It checks the instrument conforms to what the spec describes; it does not judge the writing quality of prose an agent later produces — that outcome rides on `ops.ste`.
```
