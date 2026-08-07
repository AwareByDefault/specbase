# Enforcement: ops.runtime

The mandated runtime stack is audited by a static fitness function that reads
`package.json` and `tsconfig.json` — no app code is executed.

```yaml
version: 1
spec: ops.runtime
bindings:
  - id: runtime-audit
    covers: [mandated-stack, runtime-dependency-added, strict-disabled]
    mechanism: command
    strength: automated
    status: active
    targets:
      - tools/ops/runtime.test.ts
    run:
      command: bun
      args: [test, tools/ops/runtime.test.ts]
      cwd: .
```
