# Kiwi MCP

MCP server for Kiwi.com flights: search, airlines. Needs a free API key.

## Setup

Get a key at https://tequila.kiwi.com/portal/ (free), then:

```bash
export KIWI_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `find_locations`: Airport codes by city name for flight search.
- `search_flights`: Cheapest flights between airports in a date range, with airlines and links.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Kiwi's API. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `airport_lookup`
* `route_network`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-kiwi-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
