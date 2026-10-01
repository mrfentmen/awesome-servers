# flaky-history-mcp

Flaky History is a local MCP tool for turning small test-history exports into coarse stability signals. It accepts bounded JSON, JSONL, CSV, and simple JUnit-like XML files, then reports aggregate pass, fail, skip, and unknown counts.

## Tool

- `analyze_test_history`: aggregate local history without returning test names, file names, raw records, exact versions, or values.

## Safety

- Local paths only, bounded by `FLAKY_HISTORY_ROOT` and realpath checks.
- Reads only bounded test and result-looking JSON, JSONL, CSV, and XML files.
- Skips dependencies, build output, Git data, caches, and vendor directories.
- This is a stability signal, not a CI runner, test retry engine, or statistical proof of flakiness.

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

- `analyze_test_history`: Aggregate local test history into stability signals without returning test names, file names, raw records, or exact versions.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `analyze_test_history`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `history_cohort_spread`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-flaky-history-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
