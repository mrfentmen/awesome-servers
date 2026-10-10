# Brevo MCP

MCP server for Brevo: account, contacts, email reports. Needs a free API key.

## Setup

Get a key at https://app.brevo.com/ (free), then:

```bash
export BREVO_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `account_info`: Brevo account with plan and credits.
- `list_contacts`: Brevo contacts with blacklist flags.
- `email_reports`: Aggregate sends, deliveries, opens, clicks, bounces.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Brevo's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `campaign_performance`
* `sender_inventory`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-brevo-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
