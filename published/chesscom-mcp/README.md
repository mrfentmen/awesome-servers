# Chess.com MCP

Keyless MCP server for Chess.com: player profiles, ratings by time control, daily puzzle, leaderboards, titled players.

Pairs well with `lichess-mcp` and `chess-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_player`: Profile (title, followers, country, league).
- `get_stats`: Ratings for daily, rapid, blitz, bullet, tactics, Puzzle Rush.
- `daily_puzzle`: Today's puzzle link and FEN.
- `leaderboards`: Top players per category.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required. Note: Chess.com sometimes challenges datacenter IPs (Cloudflare); from a home connection it works fine.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
