# openpanel-mcp

OpenPanel analytics: metrics, live visitors, top pages, referrers. Needs client credentials.

## Setup

```bash
export OPENPANEL_CLIENT_ID=...
```

Needs OpenPanel client id + secret (OPENPANEL_CLIENT_SECRET) with read access. Sent as HTTP Basic.

## Tools

- `get_metrics` — OpenPanel visitors, sessions, bounce rate and engagement for a project.
- `get_live` — Current active OpenPanel visitor count for a project.
- `get_pages` — Top OpenPanel pages by sessions for a project.
- `get_referrer` — OpenPanel traffic sources for a project.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `tracker_sdk_matrix`
* `project_health`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-openpanel-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
