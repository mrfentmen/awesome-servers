# Mailjet MCP

MCP server for Mailjet: contacts, messages, campaigns. Needs free API keys.

## Setup

Get keys at https://app.mailjet.com/ (free), then:

```bash
export MJ_APIKEY_PUBLIC=your_public_key
export MJ_APIKEY_PRIVATE=your_private_key
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_contacts`: Mailjet contacts with names and unsubscribe flags.
- `recent_messages`: Recent sent emails: recipients, subjects, statuses.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Keys stay local and are only sent to Mailjet's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `message_header_lint`
* `send_time_planner`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-mailjet-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
