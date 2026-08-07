# Enforcement: Global Configuration

Paired with `spec.md` (`behavior.config.global`). Directory resolution, load,
save, defaults and schema evolution bind to the global-config unit suite; schema
authority over writes binds to the schema and key-validation suites. The install
scope preference is specified but not yet built, so its binding is `planned` and
enforces nothing today.

```yaml
version: 1
spec: behavior.config.global
bindings:
  - id: config-location-tests
    covers: [global-config-location, xdg-config-home-honoured, unix-default-location, windows-default-location]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/global-config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/global-config.test.ts]
      cwd: .
    limitations: Resolves paths with the platform and environment stubbed; no run on a real Windows host proves the roaming path is writable there.

  - id: load-save-defaults-tests
    covers: [global-config-store, readable-json, existing-fields-preserved, global-config-load-defaults, absent-file-defaults, invalid-json-defaults-with-warning, default-shape, global-config-save, save-creates-directory, save-overwrites, schema-evolution-merge, missing-new-field-gets-default, stored-value-wins, unknown-fields-preserved]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/global-config.test.ts
      - test/commands/config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/global-config.test.ts, test/commands/config.test.ts]
      cwd: .
    limitations: Asserts read/write/merge against a temporary configuration home; field preservation is proven by round-tripping the fields the suite knows about, not by a general property over arbitrary files.

  - id: schema-authority-tests
    covers: [config-schema-is-authority, unknown-key-rejected, invalid-value-rejected]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/config-schema.test.ts
      - test/commands/config.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/config-schema.test.ts, test/commands/config.test.ts]
      cwd: .
    limitations: Validates the schema and the key allow-list directly; it does not prove that every write path in the product routes through them before touching the file.

  - id: write-path-and-override-review
    covers: [config-schema-is-authority, unknown-key-allowed-with-override, existing-fields-preserved]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/global-config.ts
      - src/commands/config.ts
    review:
      procedure: >-
        Read every place the configuration file is written. Confirm each one
        validates against the schema and the key allow-list before saving, that
        the explicit allow-unknown path is the only way an undeclared key
        reaches the file, and that a refused write returns before any write
        happens so the stored file is untouched.
      inputs:
        - src/core/global-config.ts
        - src/commands/config.ts
    limitations: Review-strength residue; the allow-unknown bypass has no automated case, so only inspection shows it is gated on the explicit request.
    covered_by: [schema-authority-tests, load-save-defaults-tests]
```
