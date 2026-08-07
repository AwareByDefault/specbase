# Enforcement: Runtime and toolchain stack

Paired with `spec.md` (`ops.stack`). Every claim here is a fact recorded in
`package.json` or agreed to by a second toolchain surface, so enforcement is a
manifest audit plus a cross-surface agreement check — design D4's "lockfile
audit / drift detect" flavor for the ops plane.

```yaml
version: 1
spec: ops.stack
bindings:
  - id: stack-manifest-audit
    covers: [node-runtime-floor, engines-declares-the-floor, package-is-esm, pnpm-is-the-package-manager, pnpm-pinned-and-locked, no-competing-lockfile, commander-is-the-cli-framework, commander-is-a-runtime-dependency, openspec-bin-entry-published, posthog-is-the-telemetry-backend, posthog-node-is-a-runtime-dependency]
    mechanism: command
    strength: automated
    status: active
    targets:
      - package.json
      - pnpm-lock.yaml
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); const eng=(p.engines||{}).node||''; if(!eng.startsWith('>=20.19')){console.error('engines.node must pin Node >=20.19, got: '+eng);process.exit(1);} if(!(p.packageManager||'').startsWith('pnpm@')){console.error('packageManager must pin pnpm, got: '+p.packageManager);process.exit(1);} if(p.type!=='module'){console.error('package must stay ESM (type: module)');process.exit(1);} if(!fs.existsSync('pnpm-lock.yaml')){console.error('pnpm-lock.yaml missing');process.exit(1);} if(fs.existsSync('package-lock.json')||fs.existsSync('yarn.lock')){console.error('a competing lockfile is present; pnpm is the only package manager');process.exit(1);} const d=p.dependencies||{}; for(const n of ['commander','posthog-node']) if(!d[n]){console.error('missing mandated runtime dependency: '+n);process.exit(1);} if(!(p.bin||{}).openspec){console.error('the openspec bin entry is missing');process.exit(1);}
      cwd: .
    limitations: Audits the declared manifest — engine floor, module format, pinned pnpm, single lockfile, the two mandated runtime dependencies, and the published bin entry. It proves the dependency is declared, not that the code imports it; `behavior/telemetry` and `behavior/cli` own the behavior those vendors deliver.

  - id: toolchain-pin-agreement
    covers: [node-runtime-floor, ci-and-nix-honour-the-floor, ci-installs-frozen]
    mechanism: command
    strength: automated
    status: active
    targets:
      - package.json
      - .github/workflows/ci.yml
      - flake.nix
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); const min=((p.engines||{}).node||'').replace('>=',''); const w=fs.readFileSync('.github/workflows/ci.yml','utf8'); const pins=[...w.matchAll(/node-version: '([^']+)'/g)].map(m=>m[1]); if(pins.length===0){console.error('ci.yml pins no Node version');process.exit(1);} for(const v of pins){ const a=v.split('.').map(Number); const b=min.split('.').map(Number); if(a[0]<b[0]||(a[0]===b[0]&&a[1]<b[1])){console.error('ci.yml Node pin '+v+' is below the engines floor '+min);process.exit(1);} } if(!w.includes('pnpm/action-setup')||!w.includes('pnpm install --frozen-lockfile')){console.error('ci.yml must install with pnpm and a frozen lockfile');process.exit(1);} const f=fs.readFileSync('flake.nix','utf8'); const major=min.split('.')[0]; if(!f.includes('nodejs_'+major)){console.error('flake.nix does not use nodejs_'+major);process.exit(1);} const pmMajor=(p.packageManager||'').replace('pnpm@','').split('.')[0]; if(!f.includes('pnpm_'+pmMajor)){console.error('flake.nix does not use pnpm_'+pmMajor);process.exit(1);}
      cwd: .
    limitations: Derives the floor from `engines.node` and checks every CI Node pin against it, plus that the flake's Node and pnpm inputs match the declared majors and that CI installs frozen. It compares declarations across three files; it does not launch a runtime to confirm the resolved interpreter version.

  - id: gh-external-tool-conformance
    covers: [github-cli-is-an-external-tool, gh-invoked-as-a-subprocess, gh-not-a-package-dependency]
    mechanism: command
    strength: automated
    status: active
    targets:
      - src/commands/feedback.ts
      - package.json
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const q=String.fromCharCode(39); const s=fs.readFileSync('src/commands/feedback.ts','utf8'); if(!s.includes(q+'gh'+q)){console.error('feedback no longer invokes the gh CLI');process.exit(1);} if(!s.includes('spawn')&&!s.includes('exec')){console.error('gh must be invoked as a subprocess');process.exit(1);} const p=JSON.parse(fs.readFileSync('package.json','utf8')); const all=Object.keys(p.dependencies||{}).concat(Object.keys(p.devDependencies||{})); for(const n of all) if(n==='gh'||n.startsWith('@github/gh')){console.error('the GitHub CLI must stay an external tool, not a package dependency: '+n);process.exit(1);}
      cwd: .
    limitations: Asserts the feedback command still names `gh` as a spawned executable and that no GitHub CLI package entered the dependency tree. The user-facing fallback when `gh` is missing is a behavior claim owned by `behavior/cli/feedback`, not proven here.
```
