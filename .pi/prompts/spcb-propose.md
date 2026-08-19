---
description: "Propose the feature of a new change - create proposal, spec deltas, and design in one step; enforcement is a separate phase"
---

Propose the FEATURE of a new change - create the change and generate the
feature artifacts (proposal, spec deltas, design) in one step. Enforcement is a
separate phase, completed after.

I'll create the feature artifacts:
- proposal.md (what & why)
- specs deltas (what must remain true)
- design.md (how)

Enforcement (enforcement.yaml + testing sections + evidence tasks) is completed
separately by /spcb-propose-enforce after /spcb-explore-enforce. When ready to
run that phase, invoke one of those skills.

---

**Store selection:** If the user names a store (a store is a standalone Specbase repo registered on this machine) or the work lives in one, run `specbase store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `ideas add`, `ideas list`, `ideas show`, `ideas delete`, `stack create`, `stack list`, `stack show`, `stack validate`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `specbase/` root.

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.
**Provided arguments**: $@

**Steps**

1. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create or graduate the change directory**
   Run `specbase stack list --json` and use its CLI-reported members. If `<name>` is a planned stack-member idea, preserve its stable identity:
   ```bash
   specbase new change --from-idea "<name>"
   ```
   Otherwise create an ordinary change:
   ```bash
   specbase new change "<name>"
   ```
   Never create a duplicate active change beside a planned member idea. Both paths create `.openspec.yaml`.

3. **Get the artifact build order**
   ```bash
   specbase status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.
   - Optional `stack`: use CLI-resolved predecessor status and projected base paths/results; never parse manifests or guess Git safety.

4. **Create the feature artifacts in sequence**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending
   dependencies first), stopping once the FEATURE artifacts exist:

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        specbase instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `resolvedOutputPath`: Resolved path or pattern to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure and write it to `resolvedOutputPath`
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Produce the FEATURE artifacts only**: `proposal`, the `specs`
      deltas, and `design`. Leave the proposal's `Enforcement intent` and the
      design's `Enforcement design` sections as explicit **TO-BE-FILLED**
      placeholders. **Do NOT write `enforcement.yaml`.** Do not create the
      enforcement or evidence tasks yet.

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

5. **Show the resting state**
   ```bash
   specbase status --change "<name>"
   ```

   The change now rests between phases: features drafted, enforcement pending.
   Enforcement is a separate, deliberate phase - run `/spcb-explore-enforce`
   then `/spcb-propose-enforce` on the same change to complete it.

**Output**

After producing the feature artifacts, summarize:
- Change name and location
- List of feature artifacts created (proposal, specs, design)
- What's next: "Feature artifacts created. Enforcement is a separate phase:
  run /spcb-explore-enforce then /spcb-propose-enforce."

**Feature-Phase Guardrails**
- Produce proposal, spec deltas, and design only. Do NOT create
  `enforcement.yaml` or fill the enforcement/testing sections in this phase.
- Always read dependency artifacts before creating a new one.
- If context is critically unclear, ask the user - but prefer making reasonable
  decisions to keep momentum.
- If a change with that name already exists, ask if user wants to continue it or
  create a new one.
- Verify each artifact file exists after writing before proceeding to next.

The enforcement-quality stance is deliberate: the enforcement judgment happens in
its own phase, after the feature is fixed, so bindings are decided rather than
invented alongside four other artifacts.
