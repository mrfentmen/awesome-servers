# ITIS MCP

Keyless MCP server for ITIS taxonomy: scientific names, TSNs, hierarchy, common names.

Pairs well with `gbif-mcp`, `eol-mcp`, `inaturalist-mcp`, and `wikispecies-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_scientific`: Taxa by scientific name with TSNs.
- `common_names`: Common names for a TSN.
- `hierarchy`: Ranks below a TSN.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
