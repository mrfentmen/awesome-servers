# Hasura MCP

MCP server for Hasura: metadata export, SQL passthrough. Works with any self-hosted instance.

## Setup

```bash
export HASURA_URL=http://localhost:8080
export HASURA_ADMIN_SECRET=secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `export_metadata`: Sources and tracked tables.
- `run_sql`: SELECT/WITH queries only (writes are refused by the tool).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
