# youtrack-mcp

YouTrack API: issue search, issue details, projects, comments. Needs permanent token.

## Setup

```bash
export YOUTRACK_API_TOKEN=...
```

Needs a YouTrack permanent token plus YOUTRACK_BASE_URL like https://example.youtrack.cloud.

## Tools

- `search_issues` — Search YouTrack issues with query language: 'project: WEB #Unresolved', 'for: me', sorted by updated.
- `get_issue` — One YouTrack issue with summary, description, state, assignee, timestamps.
- `list_projects` — YouTrack projects with ids, names and short names.
- `get_issue_comments` — Comments on a YouTrack issue with authors and timestamps.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
