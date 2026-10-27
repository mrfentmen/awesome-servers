# npms.io MCP

Keyless MCP server for npms.io: npm package quality, popularity and maintenance scores plus search.

Pairs well with `npm-search-mcp` (find it), `osv-mcp` (is it vulnerable?), and `deps-dev-mcp` (is it healthy?).

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_packages`: Search with scores — use before adding a dependency.
- `get_package`: Scores for one package.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
