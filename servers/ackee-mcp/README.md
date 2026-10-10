# ackee-mcp

Self-hosted Ackee analytics via GraphQL: domains, facts, top browsers.

## Setup

```bash
export ACKEE_BASE_URL=...
```

Needs ACKEE_BASE_URL (your instance, e.g. https://stats.example.com) plus ACKEE_API_TOKEN from Ackee settings.

## Tools

- `list_domains` — All Ackee domains with ids and titles.
- `get_domain` — Ackee domain facts: active visitors plus yearly unique views.
- `get_top_browsers` — Top browsers on an Ackee domain over the last 6 months.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `app_store_search`
* `app_store_reviews`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-ackee-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
