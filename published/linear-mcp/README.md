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

These tools need a licence key:

* `package_adoption`
* `project_scorecard`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
