## 1. Command

- [ ] 1.1 Add `openspec coverage` command + CLI wiring
- [ ] 1.2 Forward computation: % requirements enforced + uncovered list
- [ ] 1.3 Efficiency ratio per spec
- [ ] 1.4 Verified-vs-attested split

## 2. Reverse map

- [ ] 2.1 Define `EnforcerDiscovery` adapter interface
- [ ] 2.2 Implement vitest adapter for this repo
- [ ] 2.3 Orphan detection (enforcers binding to no requirement)

## 3. Depth & gating

- [ ] 3.1 `--declared` (default), `--resolve` (locate referenced enforcer), `--run` (execute via config-declared command)
- [ ] 3.2 `--json` output
- [ ] 3.3 Threshold gating with non-zero exit; `--strict-orphans`

## 4. Tests

- [ ] 4.1 Forward gap, orphan, ratio, verified/attested scenarios
- [ ] 4.2 Resolve catches stale reference
- [ ] 4.3 Threshold gating exit code
- [ ] 4.4 Cross-platform path handling in adapters

## 5. Release

- [ ] 5.1 Add changeset
