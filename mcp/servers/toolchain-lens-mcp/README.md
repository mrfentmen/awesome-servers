# toolchain-lens-mcp

Toolchain Lens is a local MCP tool for explaining reproducibility signals in small projects. It looks at package-manager files, runtime declarations, container files, and CI configuration, then reports coarse contradictions and missing anchors.

## Tool

- `explain_toolchain`: inspect a local project without returning exact versions, dependency names, command output, environment values, or secret contents.

## Safety

- Local paths only, bounded by `TOOLCHAIN_LENS_ROOT` and realpath checks.
- Reads only a bounded allowlist of toolchain and CI files.
- Skips Git data, dependencies, build output, coverage, caches, and vendor directories.
- Returns filenames, categories, and structural signal labels only.
- This is an explanation aid, not a build executor, lockfile validator, or vulnerability scanner.

## Run

```bash
npm install
npm run build
node dist/index.js
```
