# sentry-mcp

Query Sentry (auth token; set SENTRY_AUTH_TOKEN, Bearer): organizations, projects, issues.

## Tools

- `list_orgs` — Sentry organizations the token can read.
- `org_projects` — Projects inside one Sentry org, e.g. my-org.
- `org_issues` — Issues first seen in one org in the last 24 hours.

- `issue_details` — Single issue.
- `issue_events` — Recent events.
- `project_details` — Single project.
- `teams` — Org teams.
- `members` — Org members.
- `releases` — Recent releases.
- `event_details` — Single event payload.

## Source

[sentry-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/sentry-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `release_feed`
* `dependency_drift`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-sentry-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
