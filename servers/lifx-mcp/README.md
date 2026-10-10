# LIFX MCP

MCP server for LIFX lights: list, state, power control. Needs a free API token.

## Setup

Get a token at https://cloud.lifx.com/settings/ (free), then:

```bash
export LIFX_TOKEN=your_token_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_lights`: Power, brightness, color, online state.
- `set_power`: on/off/toggle with brightness and selectors.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your token stays local and is only sent to LIFX's API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `color_convert`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-lifx-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
