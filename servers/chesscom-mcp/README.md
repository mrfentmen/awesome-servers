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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `recent_games`
* `club_members`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
