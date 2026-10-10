# posthog-mcp

Query PostHog (personal key; set POSTHOG_PERSONAL_API_KEY, Bearer; optional POSTHOG_BASE_URL us/eu): profile, projects, insights.

## Tools

- `me` — The PostHog user the API key belongs to.
- `list_projects` — Analytics projects in the organization.
- `list_insights` — Saved insights in one project, with names.

- `insight_details` — Single insight.
- `dashboards` — Saved dashboards.
- `actions` — Custom actions.
- `events` — Recent raw events.
- `persons` — Identified users.
- `flags` — All flags.
- `cohorts` — User cohorts.

## Source

[posthog-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/posthog-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `certificate_transparency`
* `markup_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-posthog-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
