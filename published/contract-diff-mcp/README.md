# contract-diff-mcp

Contract Diff compares two local JSON contract snapshots and reports a coarse structural fingerprint. It is useful for quickly answering whether a generated API or schema snapshot became larger, smaller, or structurally different without handing schema contents to an agent. It does not prove endpoint compatibility or identify semantic additions and removals.

## Tool

- `compare_contract_snapshots`: compare two local JSON snapshots using node counts, value type categories, and deltas only. The result is a structural signal, not a semantic contract diff.

## Safety

- Local paths only, bounded by `CONTRACT_DIFF_ROOT` and realpath checks.
- Files are capped at two megabytes and traversal is capped.
- Never returns schema names, paths, values, descriptions, examples, versions, file paths, or raw contents.
- This is a coarse regression signal, not a complete OpenAPI or JSON Schema compatibility validator.

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

- `compare_contract_snapshots`: Compare two local JSON contract snapshots using a coarse structural fingerprint; schema names, paths, values, and versions are never returned.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `compare_contract_snapshots`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
