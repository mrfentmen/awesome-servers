# The Odds API MCP

MCP server for The Odds API: sports, events, betting odds. Free key.

Pairs well with `espn-core-mcp`, `mlb-mcp`, and `nhl-mcp`.

## Setup

Get a key at https://the-odds-api.com/ (free, 500 calls/month), then:

```bash
export THEODDS_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_sports`: Sports and leagues with API keys (soccer_epl, americanfootball_nfl...).
- `game_odds`: Upcoming games with bookmaker moneyline odds.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to The Odds API. Read-only. Odds are informational, not betting advice.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
