# Enforcement: AI tool paths

Paired with `spec.md` (`ops.tool-paths`). The registry in `src/core/config.ts`
is the runtime source of truth; the spec DESCRIBES it and these bindings assert
it still conforms (design O2). Each check reads source text rather than
importing the built module, so it runs from a clean checkout with nothing but
Node (design O3).

```yaml
version: 1
spec: ops.tool-paths
bindings:
  - id: ai-tools-registry-conformance
    covers: [tool-registry-is-the-single-roster, every-offered-tool-has-a-container-dir, detection-paths-override-the-container-dir, agents-fallback-is-not-generated-for, supported-tool-container-dirs, named-tools-keep-their-dirs, oh-my-pi-uses-omp]
    mechanism: command
    strength: automated
    status: active
    targets:
      - src/core/config.ts
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const q=String.fromCharCode(39); const s=fs.readFileSync('src/core/config.ts','utf8'); const i=s.indexOf('export const AI_TOOLS'); if(i<0){console.error('AI_TOOLS registry not found in src/core/config.ts');process.exit(1);} const block=s.slice(i,s.indexOf('\n];',i)); const rows=block.split('\n').filter(l=>l.includes('{ name:')); const get=(l,k)=>{const a=l.indexOf(k+': '+q); if(a<0) return undefined; const b=a+k.length+3; return l.slice(b,l.indexOf(q,b));}; const avail=l=>l.includes('available: true'); if(rows.length<20){console.error('AI_TOOLS has only '+rows.length+' entries; parser or registry changed');process.exit(1);} for(const l of rows){ if(!get(l,'value')){console.error('registry entry without a value: '+l.trim());process.exit(1);} if(avail(l)&&!get(l,'skillsDir')){console.error('available tool without skillsDir: '+get(l,'value'));process.exit(1);} if(avail(l)&&!get(l,'skillsDir').startsWith('.')){console.error('skillsDir is not a dot-prefixed container dir: '+get(l,'value'));process.exit(1);} } const want={claude:'.claude',cursor:'.cursor',windsurf:'.windsurf',kimi:'.kimi',codex:'.codex',opencode:'.opencode','oh-my-pi':'.omp',pi:'.pi','github-copilot':'.github','gemini':'.gemini'}; for(const v of Object.keys(want)){ const l=rows.find(r=>get(r,'value')===v); if(!l){console.error('registry is missing supported tool: '+v);process.exit(1);} if(get(l,'skillsDir')!==want[v]){console.error('skillsDir mismatch for '+v+': expected '+want[v]+' got '+get(l,'skillsDir'));process.exit(1);} } const ag=rows.find(r=>get(r,'value')==='agents'); if(!ag||avail(ag)||get(ag,'skillsDir')){console.error('the AGENTS.md fallback entry must stay available:false with no skillsDir');process.exit(1);} const cp=rows.find(r=>get(r,'value')==='github-copilot'); if(!cp.includes('detectionPaths:')){console.error('github-copilot must override detection with detectionPaths');process.exit(1);} if(!s.includes('detectionPaths?: string[]')||!s.includes('skillsDir?: string')){console.error('AIToolOption interface lost skillsDir/detectionPaths');process.exit(1);}
      cwd: .
    limitations: A declaration audit of the registry and the `AIToolOption` shape — every offered tool has a dot-prefixed container dir, the named roster keeps its directories, the AGENTS.md entry stays ungenerated, and GitHub Copilot keeps its detection override. It parses one entry per line and guards that assumption with a minimum-entry count, so a reformat fails loudly rather than passing vacuously. It does not execute generation.

  - id: skills-path-conformance
    covers: [skills-live-under-the-container-dir, skills-path-appends-skills, tool-without-container-dir-is-skipped, detection-tests-the-container-dir]
    mechanism: command
    strength: automated
    status: active
    targets:
      - src/core/init.ts
      - src/core/migration.ts
      - src/core/available-tools.ts
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const q=String.fromCharCode(39); const need=[['src/core/init.ts','path.join(projectPath, tool.skillsDir, '+q+'skills'+q+')'],['src/core/migration.ts','path.join(projectPath, tool.skillsDir, '+q+'skills'+q+')'],['src/core/available-tools.ts','path.join(projectPath, tool.skillsDir)'],['src/core/available-tools.ts','tool.detectionPaths'],['src/core/available-tools.ts','if (!tool.skillsDir) return false;']]; for(const [f,n] of need){ const s=fs.readFileSync(f,'utf8'); if(!s.includes(n)){console.error(f+' missing: '+n);process.exit(1);} } const init=fs.readFileSync('src/core/init.ts','utf8'); if(!init.includes('if (!tool.skillsDir)')){console.error('init.ts no longer rejects tools without skillsDir');process.exit(1);}
      cwd: .
    limitations: Asserts that generation, migration, and detection all derive their path from `tool.skillsDir` and that the `/skills` suffix is appended by the system rather than stored in the registry, and that a tool without a container dir is rejected instead of guessed at. It matches source expressions, so it proves the construction is declared, not that a generated file landed on disk; the `behavior/cli/init` suite covers the executed outcome.

  - id: path-construction-conformance
    covers: [paths-are-built-cross-platform, adapters-join-path-segments, no-hardcoded-separators, global-surfaces-resolve-to-tool-home-dirs, codex-home-override-honoured, codex-default-under-home]
    mechanism: command
    strength: automated
    status: active
    targets:
      - src/core/command-generation/adapters
      - src/core/command-generation/adapters/codex.ts
    run:
      command: node
      args:
        - -e
        - >-
          const fs=require('node:fs'); const dir='src/core/command-generation/adapters'; const files=fs.readdirSync(dir).filter(f=>f.endsWith('.ts')&&f!=='index.ts'); if(files.length<20){console.error('adapter directory looks wrong: '+files.length+' files');process.exit(1);} let checked=0; for(const f of files){ const s=fs.readFileSync(dir+'/'+f,'utf8'); const a=s.indexOf('getFilePath('); if(a<0) continue; checked++; const body=s.slice(a,s.indexOf('\n  },',a)); if(!body.includes('path.join(')){console.error(f+': getFilePath does not build its path with path.join()');process.exit(1);} if(body.includes('/')){console.error(f+': getFilePath hardcodes a forward slash separator');process.exit(1);} if(!s.includes("import path from 'path'")&&!s.includes("from 'node:path'")){console.error(f+': does not import the path module');process.exit(1);} } if(checked<20){console.error('only '+checked+' adapters expose getFilePath');process.exit(1);} const cx=fs.readFileSync(dir+'/codex.ts','utf8'); for(const n of ['process.env.CODEX_HOME','os.homedir()',"'.codex'","'prompts'",'path.resolve']) if(!cx.includes(n)){console.error('codex adapter global path resolution changed, missing: '+n);process.exit(1);}
      cwd: .
    limitations: Sweeps every command adapter and fails any `getFilePath` that skips `path.join` or writes a literal `/`, and separately asserts the Codex adapter still resolves through `CODEX_HOME` with a `~/.codex/prompts` fallback. It is a source sweep, not a Windows run — it proves no separator is hardcoded, not that a Windows filesystem accepted the result.
```
