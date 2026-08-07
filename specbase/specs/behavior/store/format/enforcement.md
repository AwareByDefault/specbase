# Enforcement: Store format

Paired with `spec.md` (`behavior.store.format`). The format is the most densely
tested surface in the product: the parser, validator, schema, and archive suites
exercise nearly every claim directly. Two authoring conventions that no parser
can check — that a removal states its reason, and that a proposal reads as a
from/to account of the change — are honest behavioural-lens reviews.

```yaml
version: 1
spec: behavior.store.format
bindings:
  - id: structured-format-tests
    covers: [structured-spec-format, requirement-parses, scenario-required, normative-keyword-required]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/parsers/markdown-parser.test.ts
      - test/core/parsers/requirement-blocks.test.ts
      - test/core/validation.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/parsers/markdown-parser.test.ts, test/core/parsers/requirement-blocks.test.ts, test/core/validation.test.ts]
      cwd: .
    limitations: Asserts that canonical and near-canonical requirement headers parse, that a requirement without scenarios is rejected, and that a body lacking SHALL or MUST is reported; the bullet keyword vocabulary (GIVEN/WHEN/THEN/AND) is parsed as prose and is not itself validated.

  - id: identity-tests
    covers: [requirement-identity, identity-survives-title-change, identity-survives-move, duplicate-identity-reported, legacy-header-identity]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/governed/spec-parser.test.ts
      - test/core/governed/spec-id-index.test.ts
      - test/core/governed/discovery.test.ts
      - test/core/archive.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/governed/spec-parser.test.ts, test/core/governed/spec-id-index.test.ts, test/core/governed/discovery.test.ts, test/core/archive.test.ts]
      cwd: .
    limitations: Covers slug-based identity surviving a title change, resolution of a moved pair by stable spec ID, duplicate spec IDs and duplicate pair-local IDs reported with every source location, and trim-only header normalization for legacy matching; duplicate legacy headers inside one spec are not asserted by these suites.

  - id: delta-storage-tests
    covers: [delta-storage, added-is-complete, modified-is-complete, governed-delta-locator, delta-headers-case-insensitive]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/validation.test.ts
      - test/core/parsers/requirement-blocks.test.ts
      - test/core/archive.governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/validation.test.ts, test/core/parsers/requirement-blocks.test.ts, test/core/archive.governed.test.ts]
      cwd: .
    limitations: Asserts delta section parsing including case-insensitive headers and nested delta layouts, that ADDED/MODIFIED/REMOVED deltas merge by stable ID without silent loss, and that an incomplete governed delta pair is refused; that an author wrote the *complete* requirement rather than a diff is only enforced indirectly, through the merge failing on an unresolvable block.

  - id: rename-tests
    covers: [rename-semantics, rename-from-and-to, rename-then-modify, rename-applied-first]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/archive.test.ts
      - test/core/archive.governed.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/archive.test.ts, test/core/archive.governed.test.ts]
      cwd: .
    limitations: Asserts the RENAMED → REMOVED → MODIFIED → ADDED application order, the error raised when a MODIFIED block uses the old header after a rename, and that a governed rename changes only the title while keeping the stable ID; the FROM/TO syntax itself is exercised through those fixtures rather than asserted as a grammar.

  - id: schema-validation-tests
    covers: [parsed-structure-schema, schema-rejects-malformed, schema-validates-governed-pair]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/validation.test.ts
      - test/core/schemas/governed-spec.schema.test.ts
      - test/core/converters/json-converter.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/validation.test.ts, test/core/schemas/governed-spec.schema.test.ts, test/core/converters/json-converter.test.ts]
      cwd: .
    limitations: Asserts the legacy spec/change schemas reject missing and empty required fields, that the governed spec, frontmatter, enforcement, and pair records parse, that an unknown mechanism value is rejected, and that legacy JSON conversion is unchanged; the message text naming accepted values is not asserted.

  - id: line-ending-tests
    covers: [line-ending-tolerance, crlf-parsed]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/parsers/markdown-parser.test.ts
      - test/commands/validate.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/parsers/markdown-parser.test.ts, test/commands/validate.test.ts]
      cwd: .
    limitations: Asserts CRLF documents parse and validate identically to LF; bare-CR line endings are not covered by a fixture.

  - id: body-extraction-tests
    covers: [body-keyword-extraction, keyword-on-later-line, metadata-lines-skipped, metadata-only-body, header-only-keyword-hinted, divider-bounds-body]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/parsers/markdown-parser.test.ts
      - test/core/validation.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/parsers/markdown-parser.test.ts, test/core/validation.test.ts]
      cwd: .
    limitations: Covers wrapped normative keywords, skipped and metadata-only bodies, the header-only hint for both delta and main specs, and body capture stopping at a following header; that the delta reader and the main-spec validator share one extraction is asserted by their agreeing results, not by a shared-implementation check.

  - id: fenced-block-tests
    covers: [fenced-block-fidelity, fence-before-prose, fenced-scenario-not-counted, fenced-delta-header-ignored]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/parsers/markdown-parser.test.ts
      - test/core/validation.test.ts
      - test/core/governed/spec-parser.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/parsers/markdown-parser.test.ts, test/core/validation.test.ts, test/core/governed/spec-parser.test.ts]
      cwd: .
    limitations: Asserts headings, delta headers, scenario headers, and ID lines inside fences are ignored by the legacy parser, the validator, and the governed parser, including fence-like lines with trailing content; exotic fence forms beyond backticks and tildes are not fixtured.

  - id: proposal-section-tests
    covers: [proposal-format, proposal-missing-why]
    mechanism: test
    strength: automated
    status: active
    targets:
      - test/core/validation.test.ts
      - test/core/parsers/markdown-parser.test.ts
    run:
      command: pnpm
      args: [test, --, test/core/validation.test.ts, test/core/parsers/markdown-parser.test.ts]
      cwd: .
    limitations: Asserts that a proposal missing its motivation section, or carrying only a stub, is reported; the from/to structure of each described change is not machine-checkable and is reviewed instead.

  - id: authoring-convention-review
    covers: [proposal-format, proposal-self-contained, delta-storage, removed-has-reason]
    mechanism: review
    strength: review
    status: active
    targets:
      - src/core/validation
      - src/core/parsers
    review:
      procedure: >-
        Read the change under review. Confirm its proposal states, for each
        behavioral change, the current state, the intended state, the reason,
        and who is affected — enough that a reviewer never has to open the delta
        files to know what changes. Then confirm every entry under
        `## REMOVED Requirements` records why the requirement is being removed
        and, where users are affected, what they should do instead. Raise a
        finding for any removal recorded without a reason.
      inputs:
        - src/core/validation
        - src/core/parsers
    limitations: >-
      Review-strength only. The parser can confirm the sections exist but cannot
      judge whether a from/to account is complete or whether a stated reason is
      a real reason. The structural half of both claims is covered
      automatically.
    covered_by: [proposal-section-tests, delta-storage-tests]
```
