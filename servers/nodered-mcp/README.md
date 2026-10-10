# Node-RED MCP

MCP server for Node-RED: flows, nodes. Works with any instance.

## Setup

```bash
export NODERED_URL=http://localhost:1880
export NODERED_TOKEN=token_if_adminauth_on
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_flows`: Flow tabs with ids.
- `get_flow`: Node count and type breakdown.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Everything stays on your network.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `flow_graph_audit`
* `wiring_report`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-nodered-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
