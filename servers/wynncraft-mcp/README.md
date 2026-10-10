# Wynncraft MCP

Keyless MCP server for Wynncraft, the Minecraft MMORPG: player profiles, guilds, and item search.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_player`: Player profile (rank, online status, guild, playtime, characters).
- `get_guild`: Guild info (level, territories, wars, members by rank).
- `search_items`: Item database search (type, tier, level requirement).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `item_build`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-wynncraft-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
