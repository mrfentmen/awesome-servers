# github-mcp

Query the GitHub REST API (free token; set GITHUB_TOKEN, Bearer): profile, repos, repo details, code search.

## Tools

- `me` — Profile of the GitHub user the token belongs to.
- `list_repos` — Repositories the token owner updated most recently.
- `get_repo` — Repository details for owner/repo, e.g. facebook/react.
- `search_repos` — Public repositories matching a query, e.g. mcp server.

- `user_issues` — Assigned open issues.
- `repo_issues` — Open issues in a repo.
- `repo_pulls` — Open pull requests.
- `repo_commits` — Recent commits.
- `get_user` — Public user profile.
- `search_code` — Code search.
- `list_workflows` — Actions workflows.

## Source

[github-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/github-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `repo_releases`
* `repo_contributors`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-github-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
