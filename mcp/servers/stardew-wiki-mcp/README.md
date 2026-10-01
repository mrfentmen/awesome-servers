# Stardew Wiki MCP

Keyless MCP server for the Stardew Valley Wiki: search crops, villagers, quests, items, get guides and gift tastes.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_wiki`: Search crops, villagers, fish, quests, items, festivals.
- `get_page`: Full guide text for one page plus wiki link and thumbnail.
- `random_page`: Discover a random page.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `category_members`
* `page_links`
* `page_sections`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-stardew-wiki-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
