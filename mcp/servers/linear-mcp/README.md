# linear-mcp

Query the Linear GraphQL API (key; set LINEAR_API_KEY, raw Authorization): viewer, teams, issue search.

## Tools

- `me` — The Linear user the API key belongs to.
- `list_teams` — Teams in the workspace, with key and id.
- `search_issues` — Search issues by text, e.g. login bug.

- `get_issue` — Issue details.
- `team_issues` — Issues in a team.
- `list_projects` — Linear projects.
- `my_issues` — Assigned to me.
- `list_labels` — Team labels.
- `create_issue` — Create a REAL issue.
- `update_issue_title` — Rename a REAL issue.

## Source

[linear-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/linear-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `package_adoption`
* `project_scorecard`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-linear-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
