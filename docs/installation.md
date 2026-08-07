# Installation

## Prerequisites

- **Node.js 20.19.0 or higher** — Check your version: `node --version`

## Package Managers

### npm

```bash
npm install -g @awarebydefault/specbase@latest
```

### pnpm

```bash
pnpm add -g @awarebydefault/specbase@latest
```

### yarn

```bash
yarn global add @awarebydefault/specbase@latest
```

### bun

Bun can install Specbase globally, but Specbase currently runs on Node.js.
You still need Node.js 20.19.0 or higher available on `PATH`.

```bash
bun add -g @awarebydefault/specbase@latest
```

## Nix

Run Specbase directly without installation:

```bash
nix run github:AwareByDefault/specbase -- init
```

Or install to your profile:

```bash
nix profile install github:AwareByDefault/specbase
```

Or add to your development environment in `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    specbase.url = "github:AwareByDefault/specbase";
  };

  outputs = { nixpkgs, specbase, ... }: {
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      buildInputs = [ specbase.packages.x86_64-linux.default ];
    };
  };
}
```

## Verify Installation

```bash
specbase --version
```

## Updating

Upgrade the package, then refresh each project's generated files:

```bash
npm install -g @awarebydefault/specbase@latest   # or pnpm/yarn/bun equivalent
specbase update                              # run inside each project
```

`specbase update` regenerates the skill and command files for the tools you've configured, so your slash commands stay current with the installed version.

## Uninstalling

There's no `specbase uninstall` command, because Specbase is just a global package plus some files in your project. Removing it is a few manual steps, and nothing here touches your source code.

**1. Remove the global package:**

```bash
npm uninstall -g @awarebydefault/specbase   # or: pnpm rm -g / yarn global remove / bun rm -g
```

**2. Remove Specbase from a project (optional).** Delete the `specbase/` directory if you no longer want its specs and changes:

```bash
rm -rf specbase/
```

Think before you do this: `specbase/specs/` and `specbase/changes/archive/` are your record of how the system behaves and why it changed. If you might want that history, keep the folder (or keep it in git) even after uninstalling.

**3. Remove generated AI tool files (optional).** Specbase writes skill and command files into per-tool directories like `.claude/skills/specbase-*/`, `.cursor/commands/spcb-*`, and so on. Delete the `specbase-*` skills and `spcb-*` commands for whichever tools you configured. The exact paths per tool are listed in [Supported Tools](supported-tools.md).

If you also have Specbase marker blocks in files like `CLAUDE.md` or `AGENTS.md`, remove those blocks by hand; your own content in those files is yours to keep.

## Next Steps

After installing, initialize Specbase in your project:

```bash
cd your-project
specbase init
```

See [Getting Started](getting-started.md) for a full walkthrough.
