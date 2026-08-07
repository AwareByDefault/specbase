# Enforcement: Telemetry

Paired with `spec.md` (`behavior.telemetry`). Most claims bind to the existing
`src/telemetry/` unit suites; the one genuinely end-to-end claim (every CLI
command emits an event in a real process) is an honest behavioural-lens review
of the residue above those tests.

```yaml
version: 1
spec: behavior.telemetry
bindings:
  - id: opt-out-tests
    covers: [env-opt-out, openspec-telemetry-off, do-not-track, env-overrides-config, ci-auto-disable, ci-detected, ci-wins-over-enable]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/telemetry/index.test.ts
    run:
      command: pnpm
      args: [test, --, test/telemetry/index.test.ts]
      cwd: .
    limitations: Unit-level enablement checks; does not spawn the real CLI process.

  - id: tracking-and-privacy-tests
    covers: [command-executed-tracking, standard-command-executed, subcommand-executed, privacy-preserving-events, args-excluded, ip-excluded, silent-failure, network-failure-ignored, backend-outage-ignored, shutdown-failure-ignored]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/telemetry/index.test.ts
    run:
      command: pnpm
      args: [test, --, test/telemetry/index.test.ts]
      cwd: .
    limitations: Exercises the tracking module's event construction and silent-failure paths; does not prove every CLI command wires an event in a full end-to-end run.

  - id: notice-tests
    covers: [first-run-notice, notice-on-first-run, notice-before-telemetry, notice-once]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/telemetry/index.test.ts
    run:
      command: pnpm
      args: [test, --, test/telemetry/index.test.ts]
      cwd: .
    limitations: Unit-level notice logic; the full first-run CLI flow is not spawned.

  - id: identity-and-config-tests
    covers: [anonymous-identity, id-generated-on-first-send, id-reused, id-not-generated-when-opted-out]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/telemetry/config.test.ts
    run:
      command: pnpm
      args: [test, --, test/telemetry/config.test.ts]
      cwd: .
    limitations: Covers config read/write/merge and path resolution; UUID generation itself and cross-process reuse are asserted only by inspection of the tested functions.

  - id: shutdown-flush-tests
    covers: [graceful-shutdown, flush-on-success, flush-on-error, immediate-send, sent-not-queued]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/telemetry/index.test.ts
    run:
      command: pnpm
      args: [test, --, test/telemetry/index.test.ts]
      cwd: .
    limitations: Asserts shutdown is silent and non-throwing; the success/error CLI exit paths are exercised at unit level only.

  - id: e2e-event-emission
    covers: [command-executed-tracking]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/telemetry/index.ts
      - src/cli/index.ts
    review:
      procedure: >-
        Confirm, by reading the CLI command wiring, that every command path
        emits a `command_executed` event with only command name and version,
        and that no command path leaks arguments or paths into the event.
      inputs:
        - src/telemetry/index.ts
        - src/cli/index.ts
    limitations: Review-strength residue above the unit tests; the full-process claim is verified by inspection, not by an end-to-end harness.
    covered_by: [tracking-and-privacy-tests]
```
