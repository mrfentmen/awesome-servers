# rybbit-mcp

Rybbit analytics: site overview, users, journeys. Cloud or self-hosted.

## Setup

```bash
export RYBBIT_API_KEY=...
```

Needs RYBBIT_API_KEY (rb_...). Optional RYBBIT_BASE_URL for self-hosted (default https://app.rybbit.io).

## Tools

- `get_overview` — Rybbit sessions, pageviews, users, bounce rate for a site and period.
- `list_users` — Rybbit users for a site with pagination.
- `get_journeys` — Common Rybbit navigation paths (journeys) through a site.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `domain_profile`
* `tracking_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-rybbit-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
