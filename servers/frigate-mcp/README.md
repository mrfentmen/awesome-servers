# Frigate MCP

MCP server for Frigate NVR: version, stats, cameras, recent events.

## Setup

```bash
export FRIGATE_URL=http://localhost:5000
export FRIGATE_USER=user_if_proxied
export FRIGATE_PASSWORD=secret_if_proxied
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `status`: Version, uptime, cameras, detection FPS.
- `recent_events`: Detections, optionally per camera.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your Frigate.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `analyze_events`
* `threshold_advice`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-frigate-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
