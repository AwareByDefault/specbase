# Enforcement: Nix and CI validation

Paired with `spec.md` (`ops.nix-ci`). Every claim here describes an artifact
already in the tree — `flake.nix`, `.github/workflows/ci.yml`,
`scripts/update-flake.sh`, `.actrc` — so enforcement is `command` bindings that
assert those artifacts still conform (design O2). The flake's evaluation is
proven by Nix itself; the rest is file conformance, which needs nothing beyond
Node and runs from a clean checkout.

```yaml
version: 1
spec: ops.nix-ci
bindings:
  - id: flake-evaluates
    covers: [flake-builds-the-cli, flake-evaluates-for-declared-systems]
    mechanism: command
    strength: automated
    status: active
    targets:
      - flake.nix
      - flake.lock
    run:
      command: nix
      args: [flake, check, --no-build, --all-systems]
      cwd: .
    limitations: Evaluates every package, app, and devShell output for all four declared systems, but does not build them; the full build is CI's `nix build` step. Requires `nix` on PATH — the binding fails where Nix is absent, which is the honest result for a requirement that the repo ships a working flake.

  - id: flake-manifest-conformance
    covers: [flake-builds-the-cli, version-read-from-package-json]
    mechanism: command
    strength: automated
    status: active
    targets:
      - flake.nix
      - flake.lock
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const f=fs.readFileSync('flake.nix','utf8'); const need=['pname = "openspec"','version = (builtins.fromJSON (builtins.readFile ./package.json)).version','mainProgram = "openspec"','"x86_64-linux"','"aarch64-linux"','"x86_64-darwin"','"aarch64-darwin"','nodejs_20','pnpm_9','hash = "sha256-']; for (const n of need) if (!f.includes(n)) { console.error('flake.nix missing: '+n); process.exit(1); } if(!fs.existsSync('flake.lock')){console.error('flake.lock missing');process.exit(1);}
      cwd: .
    limitations: Asserts the flake declares the dynamic version expression, the main program, all four systems, a pinned pnpm hash, and a committed lock; it does not prove the resulting derivation builds. `flake-evaluates` and CI's `nix build` carry that.

  - id: nix-ci-job-conformance
    covers: [nix-job-runs-in-ci, nix-job-declared, job-is-path-filtered, aggregate-gate-depends-on-nix-job, build-output-contains-the-binary, nix-installed-and-cached-in-ci, installer-action-used, build-cache-enabled]
    mechanism: command
    strength: automated
    status: active
    targets:
      - .github/workflows/ci.yml
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const w=fs.readFileSync('.github/workflows/ci.yml','utf8'); const need=['nix-flake-validate:','DeterminateSystems/nix-installer-action','magic-nix-cache-action','run: nix build','result/bin/openspec','bash scripts/update-flake.sh','git checkout -- flake.nix','pull_request:','merge_group:','push:','workflow_dispatch:','needs: [test_matrix, lint, nix-flake-validate]',"needs.changes.outputs.nix == 'true'",'scripts/update-flake.sh']; for (const n of need) if (!w.includes(n)) { console.error('ci.yml missing: '+n); process.exit(1); } if(!fs.existsSync('scripts/update-flake.sh')){console.error('scripts/update-flake.sh missing');process.exit(1);}
      cwd: .
    limitations: Proves the workflow still declares the job, its four triggers, its path filter, the installer and cache actions, the build-output check, and the aggregate gate's dependency on it. It reads the workflow rather than running it, so a green GitHub Actions run is the only proof the job passes; `act` covers the local equivalent.

  - id: update-script-conformance
    covers: [update-script-keeps-the-hash-honest, script-recomputes-the-pnpm-hash, ci-runs-and-restores-the-script]
    mechanism: command
    strength: automated
    status: active
    targets:
      - scripts/update-flake.sh
      - .github/workflows/ci.yml
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const s=fs.readFileSync('scripts/update-flake.sh','utf8'); const need=['set -euo pipefail','.version','(builtins.fromJSON (builtins.readFile ./package.json)).version','pnpm-lock.yaml','sha256-','nix build --no-link','OSTYPE']; for (const n of need) if (!s.includes(n)) { console.error('update-flake.sh missing: '+n); process.exit(1); } const w=fs.readFileSync('.github/workflows/ci.yml','utf8'); if(!w.includes('bash scripts/update-flake.sh')||!w.includes('git checkout -- flake.nix')){console.error('ci.yml does not run and restore the update script');process.exit(1);}
      cwd: .
    limitations: Asserts the script still reads the manifest version, guards the dynamic-version expression, derives a `sha256-` hash through a `nix build --no-link` cycle, branches on `OSTYPE` for BSD/GNU sed, and that CI both runs and restores it. The script is not executed here because running it mutates `flake.nix` and needs a network-backed Nix store; CI executes it on every Nix-relevant change.

  - id: act-local-run-conformance
    covers: [workflow-runs-locally-with-act, actrc-maps-ubuntu-latest, standard-actions-syntax]
    mechanism: command
    strength: automated
    status: active
    targets:
      - .actrc
      - .github/workflows/ci.yml
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); if(!fs.existsSync('.actrc')){console.error('.actrc missing');process.exit(1);} const a=fs.readFileSync('.actrc','utf8'); if(!a.includes('ubuntu-latest=')){console.error('.actrc does not map ubuntu-latest to a runner image');process.exit(1);} const w=fs.readFileSync('.github/workflows/ci.yml','utf8'); for (const n of ['runs-on: ubuntu-latest','uses: actions/checkout@']) if(!w.includes(n)){console.error('ci.yml not act-compatible, missing: '+n);process.exit(1);}
      cwd: .
    limitations: Asserts the runner mapping exists and the workflow uses portable `runs-on` and published `uses:` actions. It does not run `act` — `act` is not installed in this environment and needs Docker — so a genuine local run is not proven, only that the configuration for one is present and unbroken.
```
