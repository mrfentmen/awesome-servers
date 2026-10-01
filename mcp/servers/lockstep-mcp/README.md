# lockstep-mcp

Lockstep is a local MCP tool for spotting reproducibility drift in small projects. It identifies package-manager lockfiles, counts their bytes and lines, detects structural lockfile markers, and flags a package manifest with no matching lockfile.

## Tool

- `inspect_reproducibility`: inspect lockfile presence and package-manager signals without returning dependency names or versions.

## Safety

- Local paths only, bounded by `LOCKSTEP_ROOT` and realpath checks.
- Skips Git data, dependencies, build output, coverage, and caches.
- Never returns dependency names, versions, lockfile contents, or environment values.
- Caps recursion, file count, file size, and output.
- This is a reproducibility aid, not a dependency vulnerability scanner or build oracle.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `inspect_reproducibility`: Inspect local package-manager lockfile presence and structural signals without returning dependency names or versions.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `inspect_reproducibility`.
