# Hubitat MCP

MCP server for Hubitat: devices, status, commands via Maker API. Local-first smart home.

## Setup

In Hubitat, install the built-in **Maker API** app and note the app id + token, then:

```bash
export HUBITAT_URL=http://hubitat.local
export HUBITAT_APP_ID=123
export HUBITAT_TOKEN=your_token
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_devices`: Ids, labels, types.
- `device_status`: Current attribute values.
- `send_command`: on/off/setLevel and friends.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Everything stays on your network.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `thread_digest`
* `category_roadmap`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-hubitat-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
