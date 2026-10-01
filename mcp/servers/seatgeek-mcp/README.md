# SeatGeek MCP

MCP server for SeatGeek: events, venues, ticket stats. Needs a client ID.

## Setup

Get a client ID at https://seatgeek.com/account/develop/ (free), then:

```bash
export SEATGEEK_CLIENT_ID=your_id_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_events`: Concerts, sports and theater with venues, dates, ticket prices.
- `recommend_events`: Recommended events near coordinates.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your ID stays local and is only sent to SeatGeek. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `artist_briefing`
* `artist_catalogue`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-seatgeek-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
