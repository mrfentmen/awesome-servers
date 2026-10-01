# Blizzard MCP

MCP server for Blizzard games: WoW token price, achievements, Diablo seasons. Needs a free API client.

## Setup

Create a client at https://develop.battle.net/ (free), then:

```bash
export BLIZZARD_CLIENT_ID=your_id
export BLIZZARD_CLIENT_SECRET=your_secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `wow_token_price`: Gold price per region.
- `wow_achievements`: Sample achievements.
- `diablo_seasons`: Recent Diablo 3 seasons.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to Blizzard's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `stat_weights`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-blizzard-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
