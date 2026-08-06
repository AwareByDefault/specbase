# Enforcement: Temperature Conversion CLI (delta)

Adds a binding for the new `--units` capability.

```yaml
version: 1
spec: behavior.temp-conversion
bindings:
  - id: units-tests
    covers: [lists-supported-units, units-listed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/convert.test.ts
    run:
      command: bun
      args: [test, test/convert.test.ts]
      cwd: .
```
