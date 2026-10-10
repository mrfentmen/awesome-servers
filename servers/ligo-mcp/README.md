# LIGO MCP

Keyless MCP server for LIGO gravitational-wave catalogs: events, masses, distances.

Pairs well with `celestrak-mcp`, `space-launches-mcp`, and `simbad-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_catalogs`: Known catalog names.
- `list_events`: Events per catalog.
- `get_event`: GPS time and data link for one event.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `event_parameters`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-ligo-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
