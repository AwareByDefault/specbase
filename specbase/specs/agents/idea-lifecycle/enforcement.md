# Enforcement: Idea lifecycle instruments

Paired with `spec.md` (`agents.idea-lifecycle`). Per the agents-plane pattern,
the operational artifacts are the `save-idea` SKILL.md and the explore
skill's idea-input guidance. The spec DESCRIBES them; these bindings assert
the artifacts conform (frontmatter declares the trigger, body directs the
append-to-notes/resume-from-notes behavior). The artifacts stay the runtime
source of truth and are never generated from the spec.

```yaml
version: 1
spec: agents.idea-lifecycle
bindings:
  - id: save-idea-skill-conformance
    covers:
      - save-idea-skill
      - session-appended-to-notes
      - summary-refined
      - save-idea-writes-no-governed-artifacts
    mechanism: command
    strength: automated
    status: active
    targets:
      - .pi/skills/save-idea/SKILL.md
    run:
      command: node
      args:
        - -e
        - "const fs=require('node:fs');const p='.pi/skills/save-idea/SKILL.md';if(!fs.existsSync(p))process.exit(1);const t=fs.readFileSync(p,'utf8');const need=['save-idea','notes.md','## Session','append','summary','ideas/'];for(const s of need){if(!t.includes(s)){console.error('save-idea SKILL.md missing: '+s);process.exit(1)}}"
      cwd: .
    limitations: Asserts the save-idea SKILL.md exists and carries the trigger name, the notes.md append target, the session-heading convention, and the summary-refinement affordance. Does not judge whether the prose genuinely produces good session captures, that is a design-review judgment.

  - id: explore-idea-input-conformance
    covers:
      - explore-reads-idea
      - explore-resumes-saved
      - explore-ends-in-propose
    mechanism: command
    strength: automated
    status: active
    targets:
      - .pi/skills/specbase-explore/SKILL.md
    run:
      command: node
      args:
        - -e
        - "const fs=require('node:fs');const p='.pi/skills/specbase-explore/SKILL.md';if(!fs.existsSync(p))process.exit(1);const t=fs.readFileSync(p,'utf8');const need=['idea','notes.md','Session','propose'];for(const s of need){if(!t.includes(s)){console.error('explore SKILL.md missing idea-input guidance: '+s);process.exit(1)}}"
      cwd: .
    limitations: Asserts the explore skill's SKILL.md names the idea-as-input contract and the resume-from-notes behavior. Does not prove the skill is invoked correctly at runtime; that is agent-behavior, which rides on the behavior plane, not this instrument-conformance binding.
```
