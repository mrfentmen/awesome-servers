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

<!-- paywall -->
## Premium tools

These tools need a license key:

* `implied_probability`
* `expected_value`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-theoddsapi-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
