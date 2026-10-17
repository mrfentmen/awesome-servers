# artifact-gauge-mcp

Artifact Gauge is a local MCP tool for answering a simple release question: what is taking up space? It reports artifact totals, extension histograms, largest files, and dependency manifest metadata without returning file contents.

## Tools

- `inspect_artifacts`: scan a bounded local project and summarize file sizes and types.
- `inspect_manifest`: report metadata for one recognized dependency manifest without exposing its contents or dependency versions.

## Safety

- Local paths only, with `ARTIFACT_GAUGE_ROOT` boundary support and symlink checks.
- Skips Git data, dependencies, coverage, framework caches, and other common generated caches while intentionally including `dist` and `build` artifacts.
- Caps recursion, file count, file size, and output.
- Never returns file contents, package versions, secrets, or source text.
- This is a size heuristic, not a complete bundler or dependency vulnerability analyzer.

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

- `inspect_artifacts`: Inspect local artifact sizes, extension totals, largest files, and dependency manifest names without returning file contents.
- `inspect_manifest`: Inspect bounded metadata for one recognized local dependency manifest without returning its contents or versions.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `inspect_artifacts`.


