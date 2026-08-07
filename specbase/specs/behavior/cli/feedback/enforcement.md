# Enforcement: Feedback Command

Paired with `spec.md` (`behavior.cli.feedback`). Submission, the manual fallback,
metadata, and the literal-argument guarantee bind to the feedback command suite.
Two claims are honest behavioural-lens residue: that nothing identifying reaches
the issue body, and that the agent workflow really requires approval before it
submits.

```yaml
version: 1
spec: behavior.cli.feedback
bindings:
  - id: feedback-submission-tests
    covers: [feedback-command, feedback-submitted, feedback-with-body, issue-metadata, metadata-included, literal-user-input, metacharacters-literal]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/feedback.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/feedback.test.ts]
      cwd: .
    limitations: The issue-filing tool is replaced by a double, so the assertions cover the title prefix, label, body, version/platform/timestamp metadata, printed URL, and the discrete-argument call form — no issue is actually filed.

  - id: feedback-fallback-tests
    covers: [manual-fallback, fallback-when-tool-missing, fallback-when-unauthorized]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/commands/feedback.test.ts
    run:
      command: pnpm
      args: [test, --, test/commands/feedback.test.ts]
      cwd: .
    limitations: Both fallback paths are simulated by making the availability and authorization probes fail; the delimited output and the pre-filled URL are asserted as printed text only.

  - id: feedback-skill-template-tests
    covers: [feedback-skill]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/templates/skill-templates-parity.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/templates/skill-templates-parity.test.ts]
      cwd: .
    limitations: Pins the feedback workflow template's payload by content hash, so the instructions cannot drift unnoticed; it does not check what those instructions say or how an agent follows them.

  - id: feedback-privacy-review
    covers: [no-sensitive-metadata]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/commands/feedback.ts
    review:
      procedure: >-
        Read every value the feedback command composes into the issue title, body,
        and pre-filled URL. Confirm that none of them derives from a file path,
        the working directory, a project name, or an environment variable, and
        that only the version, platform, and timestamp are added.
      inputs:
        - src/commands/feedback.ts
    limitations: Review-strength; no suite asserts the absence of identifying values in the composed body, so exclusion is verified by inspection.
    covered_by: [feedback-submission-tests]

  - id: feedback-independence-review
    covers: [feedback-independent-of-telemetry, works-with-reporting-off, works-in-ci]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/commands/feedback.ts
      - src/cli/index.ts
    review:
      procedure: >-
        Confirm the feedback command reads no usage-reporting state and takes no
        branch on it, so an opted-out or automated environment changes only
        whether a usage-reporting event is sent, never whether the feedback is
        submitted.
      inputs:
        - src/commands/feedback.ts
        - src/cli/index.ts
    limitations: Review-strength; no test runs the feedback command with usage reporting opted out or under an automated-environment flag.
    covered_by: [feedback-submission-tests]

  - id: feedback-agent-flow-review
    covers: [feedback-skill, agent-drafts-and-anonymizes, approval-required]
    mechanism: review
    strength: review
    status: active
    lens: behavioural
    targets:
      - src/core/templates/workflows/feedback.ts
    review:
      procedure: >-
        Read the feedback workflow instructions. Confirm they direct the agent to
        gather conversation context, replace paths, secrets, organization names,
        personal names, and private URLs with placeholders, show the complete
        draft, and submit through the feedback command only after the user
        explicitly approves.
      inputs:
        - src/core/templates/workflows/feedback.ts
    limitations: Review-strength; the instructions are prose an agent interprets, so no suite can prove an agent obeys the approval gate.
    covered_by: [feedback-skill-template-tests]
```
