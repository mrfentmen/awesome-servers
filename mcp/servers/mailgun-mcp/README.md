# Mailgun MCP

MCP server for Mailgun: domains, stats, bounces, complaints. Needs a free API key.

## Setup

Get a key at https://www.mailgun.com/ (free), then:

```bash
export MAILGUN_API_KEY=your_key_here
export MAILGUN_REGION=us  # or eu
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_domains`: Mailgun sending domains with state and creation date. Set MAILGUN_REGION=eu for EU accounts.
- `domain_stats`: Totals for a domain: sent, delivered, opened, failed.
- `list_bounces`: Bounced addresses for a domain with codes and errors.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Mailgun's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `dkim_selector_scan`
* `mailgun_status_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-mailgun-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
