# youtrack-mcp

Issue tracking over the public GitLab API - no API key.

## Tools

- `search_projects` — Find public GitLab projects by name and list their stars, open issue count and description. No API key or account needed.
- `project_issues` — List issues in a public project filtered by state, labels and free-text search, newest first, with assignees and comment counts.
- `issue_detail` — Fetch one issue by its project-internal number and return the full description, labels, assignees, dates and comment count.
- `merge_requests` — List the merge requests in a project filtered by state, with the author, branches, last update and comment count, so you can see the work behind an issue.
- `group_issues` — List the newest issues across every project in a GitLab group at once, with state, labels, assignees and the project each came from.
- `issue_stats` — Summarise a project's issue tracker: open versus closed, close rate, unassigned count, label breakdown, neglected issues and stale open issues.
- `recent_issues` — Show the open issues that changed most recently in a project, so you can see what the team is actually working on.

## Setup

No setup for public projects. Setting GITLAB_TOKEN raises the rate limit and unlocks private projects, but nothing here requires it.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).


