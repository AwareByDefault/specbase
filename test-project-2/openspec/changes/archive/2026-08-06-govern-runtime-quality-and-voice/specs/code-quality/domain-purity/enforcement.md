# Enforcement: code-quality.domain-purity

A static lint scan of `src/domain/**` fails on any `console.` call. Comments are
stripped before scanning to avoid false positives.

```yaml
version: 1
spec: code-quality.domain-purity
bindings:
  - id: no-console-lint
    covers: [no-console-in-domain, console-in-domain]
    mechanism: lint
    strength: automated
    status: active
    targets:
      - tools/quality/no-console-in-domain.test.ts
    run:
      command: bun
      args: [test, tools/quality/no-console-in-domain.test.ts]
      cwd: .
```
