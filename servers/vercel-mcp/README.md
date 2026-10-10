# vercel-mcp

Query the Vercel API (token; set VERCEL_TOKEN, Bearer): projects, project details, deployments.

## Tools

- `list_projects` — Vercel projects in the account, most recent first.
- `get_project` — Details for one project, by id or name.
- `list_deployments` — Deployments, optionally per project.

- `deployment_details` — Single deployment.
- `list_aliases` — Domain aliases.
- `list_domains` — Custom domains.
- `domain_info` — Domain details.
- `list_teams` — Teams.
- `project_env` — Env var names.
- `get_alias` — Alias details by hostname.

## Source

[vercel-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/vercel-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `incident_timeline`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-vercel-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
