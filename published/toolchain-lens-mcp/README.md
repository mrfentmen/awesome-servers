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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `explain_toolchain`: Explain local reproducibility signals and contradictions without returning exact versions, dependency names, or secret values.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `explain_toolchain`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
