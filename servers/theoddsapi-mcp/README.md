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

- `list_sports`: Leagues with API keys.
- `game_odds`: Upcoming games with bookmaker lines.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to The Odds API. Read-only. Odds are informational, not betting advice.
