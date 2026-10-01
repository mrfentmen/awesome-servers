# Inngest MCP

MCP server for Inngest: send events, list apps. Needs an event key.

## Setup

Keys live at dashboard > Manage (Event Keys, Signing Key), then:

```bash
export INNGEST_EVENT_KEY=your_event_key
export INNGEST_SIGNING_KEY=your_signing_key  # only for list_apps
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `send_event`: Trigger functions with a named event + payload.
- `list_apps`: Registered apps.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Keys stay local and go only to Inngest.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `release_feed`
* `incident_history`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-inngest-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
