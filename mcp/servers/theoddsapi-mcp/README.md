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

These tools need a licence key:

* `implied_probability`
* `expected_value`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
