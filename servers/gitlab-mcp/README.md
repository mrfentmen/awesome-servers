# gitlab-mcp

Query GitLab (token; set GITLAB_PRIVATE_TOKEN, PRIVATE-TOKEN header; optional GITLAB_BASE_URL for self-host): profile, projects, groups, public search.

## Tools

- `me` — The GitLab user the token belongs to.
- `list_projects` — Projects the token can see, most recent first.
- `list_groups` — Groups the token can see, with path and id.
- `search_public` — Public projects by query (no token needed).

- `list_issues` — Assigned/open issues.
- `list_merge_requests` — Open merge requests.
- `project_details` — Single project.
- `project_pipelines` — Recent pipelines.
- `group_projects` — Projects in a group.
- `render_markdown` — GitLab-flavored HTML.
- `public_snippets` — Discover snippets.

## Source

[gitlab-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/gitlab-mcp)

- `search_public` — Public projects by query (no token needed).
