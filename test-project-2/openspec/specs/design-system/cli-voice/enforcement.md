# Enforcement: design-system.cli-voice

Two bindings, matching the plane's two strengths: an automated no-exclamation
lint for what a scan can verify, and the `design` review lens for the tone
residue it cannot.

```yaml
version: 1
spec: design-system.cli-voice
bindings:
  - id: no-exclamation-lint
    covers: [shouting-error]
    mechanism: lint
    strength: automated
    status: active
    targets:
      - tools/design/error-voice.test.ts
    run:
      command: bun
      args: [test, tools/design/error-voice.test.ts]
      cwd: .
  - id: voice-review
    covers: [calm-cli-voice, blaming-error]
    mechanism: review
    strength: review
    status: active
    lens: design
    review:
      procedure: >-
        Read every user-facing string in src/** (console.error/console.log and
        usage text). Confirm each is terse, describes what happened and how to
        proceed, and never assigns fault to the user.
      inputs:
        - src/main.ts
    limitations: >-
      The no-exclamation lint proves punctuation only; tone and blame are a human
      judgment the design lens makes.
```
