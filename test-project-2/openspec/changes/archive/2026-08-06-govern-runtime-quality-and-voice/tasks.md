## 1. Ops: mandated runtime

- [x] 1.1 Implement `tools/ops/runtime.test.ts`: assert `package.json` has no `dependencies` key and `tsconfig.json` sets `compilerOptions.strict === true`.
- [x] 1.2 Run `bun test tools/ops/runtime.test.ts` and confirm it passes; mark the `runtime-audit` binding active.

## 2. Code-quality: domain purity

- [x] 2.1 Implement `tools/quality/no-console-in-domain.test.ts`: scan `src/domain/**/*.ts` (comments stripped) and fail on any `console.` token.
- [x] 2.2 Run `bun test tools/quality/no-console-in-domain.test.ts` and confirm it passes; mark the `no-console-lint` binding active.

## 3. Design-system: CLI voice

- [x] 3.1 Implement `tools/design/error-voice.test.ts`: scan user-facing strings passed to `console.error`/`console.log` in `src/**` and fail on any exclamation mark.
- [x] 3.2 Run `bun test tools/design/error-voice.test.ts` and confirm it passes; mark the `no-exclamation-lint` binding active.
- [x] 3.3 Perform the `voice-review` design-lens review of `src/main.ts` copy; confirm it is terse and never blames the user.

## 4. Verify

- [x] 4.1 Run the full `bun test` suite; confirm all fitness functions pass.
- [x] 4.2 Run `openspec validate govern-runtime-quality-and-voice --strict` and fix any issues.
