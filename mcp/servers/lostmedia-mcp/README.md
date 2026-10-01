# Lost Media MCP

Keyless MCP server for the Lost Media Wiki: search lost TV, film, music and games, track found / partially-found status.

Pairs well with `archive-org-mcp`, `wayback-mcp`, and `hiddenpalace-mcp` for dead-media recovery research.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_lost_media`: Search lost episodes, films, music, games, pilots.
- `get_article`: Article summary with found / partially-found / lost status.
- `random_article`: Fall down the rabbit hole.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `recent_changes`
* `browse_categories`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-lostmedia-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
