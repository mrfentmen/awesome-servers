# RetroAchievements MCP

MCP server for RetroAchievements: games, achievements, user progress. Free key.

Pairs well with `rom-mcp`, `hiddenpalace-mcp`, and `speedrun-mcp`.

## Quick start

Get a key at https://retroachievements.org/settings/ (API key section, free), then:

```bash
export RA_USERNAME=your_username
export RA_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `game_extended`: Game with achievement list (find ids via rom-mcp).
- `user_progress`: Points, rank, recently played.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to RetroAchievements. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `set_scorecard`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-retrogachievements-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
