# Loops MCP

MCP server for Loops: contacts, events. Needs a free API key.

## Setup

Get a key at https://app.loops.so/ (free), then:

```bash
export LOOPS_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `find_contact`: Find a Loops contact by email.
- `create_contact`: Create a Loops contact with optional first/last name.
- `send_event`: Send a Loops event to trigger email flows.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Loops' API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `sending_domain_dns`
* `campaign_link_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-loops-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
