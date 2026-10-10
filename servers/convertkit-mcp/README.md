# Kit MCP

MCP server for Kit (ConvertKit): subscribers, forms, broadcasts. Needs an API key.

## Setup

Get a key at Kit Settings > Developer, then:

```bash
export KIT_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `find_subscriber`: Find a Kit subscriber by email: name, state, join date.
- `list_forms`: Kit (ConvertKit) signup forms, with id and name.
- `list_broadcasts`: Kit email broadcasts (newsletters sent).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Kit's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `list_tags`
* `list_sequences`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-convertkit-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
