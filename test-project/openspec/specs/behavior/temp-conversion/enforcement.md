# Enforcement: Temperature Conversion CLI

Bindings that tie each observable capability to executable evidence (bun tests).

```yaml
version: 1
spec: behavior.temp-conversion
bindings:
  - id: conversion-tests
    covers: [converts-between-units, celsius-to-fahrenheit, celsius-to-kelvin]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/convert.test.ts
    run:
      command: bun
      args: [test, test/convert.test.ts]
      cwd: .
    limitations: Covers the three named unit pairs, not every possible pair.

  - id: input-validation-tests
    covers: [rejects-invalid-input, invalid-unit-rejected, non-numeric-rejected]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/convert.test.ts
    run:
      command: bun
      args: [test, test/convert.test.ts]
      cwd: .

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
