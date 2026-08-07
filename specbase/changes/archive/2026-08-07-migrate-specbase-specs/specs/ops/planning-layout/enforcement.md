# Enforcement: Planning layout

Paired with `spec.md` (`ops.planning-layout`). The layout invariant is checkable
directly: assert the store exists under `specbase/`, no legacy `openspec/`
planning dir shadows it, and the CLI's own discovery surfaces only the specbase
store. The "inertness" of `openspec-old/` is proven by CLI discovery itself plus
a config/dir conformance check.

```yaml
version: 1
spec: ops.planning-layout
bindings:
  - id: layout-conformance
    covers: [specbase-is-planning-root, store-under-specbase, cli-operates-on-specbase]
    mechanism: command
    strength: automated
    status: active
    targets:
      - specbase/config.yaml
    run:
      command: node
      args:
        - -e
        - "const fs=require('node:fs');const path=require('node:path');const root=process.cwd();if(!fs.existsSync(path.join(root,'specbase','config.yaml')))process.exit(1);if(!fs.existsSync(path.join(root,'specbase','specs')))process.exit(1);if(fs.existsSync(path.join(root,'openspec')))process.exit(1);"
      cwd: .
    limitations: Asserts the layout exists and no legacy openspec/ planning dir shadows it; does not prove the CLI's resolver preference order in code.

  - id: cli-discovery-inertness
    covers: [openspec-old-inert, legacy-not-discovered, specbase-is-authoritative]
    mechanism: command
    strength: automated
    status: active
    targets:
      - specbase/config.yaml
    run:
      command: openspec
      args: [coverage, --json, --strict]
      cwd: .
    limitations: Proves the CLI aggregates the governed store under specbase/ with no rot; that openspec-old/ contributes nothing is implied by the resolver preferring specbase/ and verified by inspection in the review binding below.

  - id: legacy-store-retired
    covers: [openspec-old-inert, legacy-not-discovered]
    mechanism: review
    strength: review
    status: active
    targets:
      - openspec-old/README.md
    review:
      procedure: >-
        Run `openspec list --json` and `openspec coverage --json`; confirm no
        spec or change under `openspec-old/` appears in any output, and confirm
        a README at `openspec-old/README.md` marks the directory as retired
        historical archive.
      inputs:
        - openspec-old/README.md
    limitations: Review-strength confirmation that nothing under openspec-old/ is discovered or consulted; the automated bindings above carry the structural assertions.
```
