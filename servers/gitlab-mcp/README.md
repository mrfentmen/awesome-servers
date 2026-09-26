# gitlab-mcp

Query GitLab (token; set GITLAB_PRIVATE_TOKEN, PRIVATE-TOKEN header; optional GITLAB_BASE_URL for self-host): profile, projects, groups, public search.

## Tools

- `me` — The GitLab user the token belongs to.
- `list_projects` — Projects the token can see, most recent first.
- `list_groups` — Groups the token can see, with path and id.

## Source

[gitlab-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/gitlab-mcp)

- `search_public` — Public projects by query (no token needed).
