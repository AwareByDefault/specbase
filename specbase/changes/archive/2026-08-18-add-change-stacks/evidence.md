## Verification record

### Exact commands and results

- `pnpm build` — exit 0; TypeScript compiled and the CLI was rebuilt.
- `pnpm exec vitest run test/core/change-stacks/manifest.test.ts test/core/change-stacks/projection.test.ts test/commands/change-stacks.test.ts test/core/archive.change-stacks.test.ts test/core/completions/completion-provider.test.ts test/commands/completion.test.ts test/core/completions/command-registry.test.ts test/core/templates/skill-templates-parity.test.ts` — exit 0; 8 files and 103 tests passed.
- `pnpm lint` — exit 0; no errors and one pre-existing unused-disable warning in `src/core/references.ts`.
- `pnpm test` — exit 0; 157 files and 2,489 tests passed.
- `node bin/specbase.js validate add-change-stacks --strict` — exit 0; `Change 'add-change-stacks' is valid`.
- `node bin/specbase.js coverage --json > /tmp/add-change-stacks-round2-coverage.json` — exit 0; 49 pairs and 292/292 requirements covered, with zero incomplete, broken, stale, or hanging pairs. Existing review/manual degraded states remain visible.
- `git diff --check` — exit 0.
- `git diff --cached --name-only` — no output; no staged files.

### Native CLI journeys exercised by the test harness

All command, workflow, and archive suites invoke the rebuilt `dist/cli/index.js` through `test/helpers/run-cli.ts` in isolated temporary repositories.

- Governed chain: create → validate predecessor ADDED plus successor MODIFIED → expose a durable public projection DTO → reject the first invalid prefix → enforce immutable-ID archive order → archive the eligible member.
- Legacy/default chain: project flat ADDED then MODIFIED deltas with native legacy semantics → reject skipped or declined required truth updates.
- Creation safety: reject traversal, external idea symlinks, alternate identities, self-membership, malformed present metadata, nested stacks, multiple ownership, and concurrent duplicate publication without moving the source idea or writing a partial stack.
- Archive safety: atomically reserve the final destination, stage a complete non-destructive copy before accepted-truth writes, preserve user content named like the retired reservation marker, clean staged output on write failure, and leave the active source untouched until truth commits. Deterministic and preparation-time destination collisions leave truth and the source unchanged.
- Isolation: malformed unrelated stacks do not break unstacked or valid stacked status, instructions, and archive; malformed manifests claiming the selected member remain strict errors.
- Store flow: add/list/show child ideas, graduate the umbrella, and create/inspect the stack through one consistent `--store <id>` root with one-document JSON.
- Completion: `idea-id` powers `new change --from-idea` and `stack create --from-idea`; `work-item-id` powers `--member`; metadata-less dated archives complete as stable undated IDs across Bash, Zsh, Fish, and PowerShell generation.
- Planned prefixes: a downstream idea blocked by a planned predecessor makes stack validation invalid and nonzero rather than returning contradictory success.

### Binding correspondence

- `test/commands/change-stacks.test.ts` covers stack creation, identity-preserving idea graduation, scratchpad preservation, ordered inspection, human/JSON surfaces, planned-chain failure, and registered-store behavior.
- `test/workflow/change-stack-projection.test.ts` covers valid predecessor-projected truth, exact durable context DTOs, invalid-prefix/downstream blocking, and immutable-ID status/instruction lookup after directory rename.
- `test/core/archive.change-stacks.test.ts` covers ordered archive, governed and legacy required-delta gates, declined updates, destination reservation/collision safety, malformed-neighbor isolation, and unstacked status/instructions/archive compatibility.
- `test/core/change-stacks/manifest.test.ts` covers finite unique manifests, stable identity resolution, malformed metadata, safe idea graduation, symlink containment, self/nested membership, multiple ownership, and serialized publication.
- `test/core/change-stacks/projection.test.ts` covers governed and legacy folds, archived exactly-once skip, pair atomicity, first-conflict stopping, planned-member blocking including planned-only chains, and durable DTO paths.
- `test/core/init.change-stacks.test.ts` covers `stacks/` initialization, young roots, and governed discovery exclusion.
- `.pi/skills/specbase-stack/SKILL.md` is the runtime slicing instrument. `test/core/templates/skill-templates-parity.test.ts` verifies checked-in explore/propose/apply/archive/stack projections against canonical governed templates and permanently guards catalogue idea resumption/save/graduation guidance.
- `test/commands/ideas.test.ts`, `test/commands/artifact-workflow.test.ts`, `test/commands/validate.test.ts`, and `test/core/archive.test.ts` provide independent regression bindings for unchanged unstacked idea, change/apply, validation, and archive surfaces.

### Residual risks

- The creation lock and archive reservation coordinate filesystem writers in one planning root; manual edits can still introduce corruption, which validation reports.
- Projection validates structural truth and evidence linkage, not whether implementation code satisfies a slice.
- If source cleanup is interrupted after truth commits, the complete staged archive is preserved and the active source may temporarily remain as a duplicate for manual cleanup; data is not destructively moved before commit. General multi-file accepted-truth transactions remain outside scope.
- Sequence mutation/rebase ergonomics and Git/PR orchestration remain deliberately out of scope.
