# swetrix-mcp

Swetrix analytics: projects and project details. Needs API key.

## Setup

```bash
export SWETRIX_API_KEY=...
```

## Tools

- `list_projects` — All Swetrix projects with ids and domains.
- `get_project` — One Swetrix project with settings and stats summary.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `sdk_release_feed`
* `ecosystem_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-swetrix-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
