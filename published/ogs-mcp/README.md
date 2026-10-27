# OGS MCP

Keyless MCP server for Online-Go.com: Go/Baduk/Weiqi players, ratings, recent games.

Pairs well with `lichess-mcp`, `chess-mcp`, and `chesscom-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_players`: Find players by username.
- `get_player`: Ratings per category and profile link.
- `recent_games`: Latest games with opponents and outcomes.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
