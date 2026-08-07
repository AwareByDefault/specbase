# Enforcement: Repository practices spec-driven development via opsx

Paired with `spec.md` (`agents.spec-driven`). The governed workflow's own CLI is
the enforcement instrument: `openspec validate` proves the workflow is well-formed,
and a config check proves the declared roster matches what the spec asserts.

```yaml
version: 1
spec: agents.spec-driven
bindings:
  - id: openspec-validates
    covers:
      - practices-sdd
      - project-validates
    mechanism: command
    strength: automated
    status: active
    targets:
      - specbase/config.yaml
    run:
      command: openspec
      args:
        - validate
        - --strict
      cwd: .
    limitations: Proves the workflow is well-formed, not that every spec is
      materially correct.
  - id: governed-schema-declared
    covers:
      - governed-schema-declared
    mechanism: command
    strength: automated
    status: active
    targets:
      - specbase/config.yaml
    run:
      command: node
      args:
        - -e
        - const fs=require('node:fs');const
          t=fs.readFileSync('specbase/config.yaml','utf8');if(!/^schema:\s*spec-driven-governed\s*$/m.test(t))process.exit(1);if(!/^specModel:\s*$/m.test(t))process.exit(1);if(!/^\s+-\s+id:\s+\S+/m.test(t))process.exit(1);
      cwd: .
    limitations: "Asserts that specbase/config.yaml declares `schema:
      spec-driven-governed` and a non-empty specModel plane roster. Does not
      judge whether the roster is the right one. (Replaces the inherited
      `openspec config --json` invocation, which exits 1 — `--json` is not an
      option on that command, and `openspec config` reads the *global* config,
      not this project's store.)"
```
