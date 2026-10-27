# Oyez MCP

Keyless MCP server for Oyez: Supreme Court cases, decisions, opinions, oral-argument audio.

Pairs well with `courtlistener-mcp`, `court-records-mcp`, and `federal-register-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_cases`: SCOTUS cases by name or topic.
- `get_case`: Parties, question, conclusion, decisions, oral-argument audio.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
