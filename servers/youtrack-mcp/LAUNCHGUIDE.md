# Youtrack MCP

## Tagline
Issue tracking over the public GitLab API - no API key.

## Description
Read issue trackers from your AI assistant: search public projects, list and filter issues by state and label, open one issue in full, summarise a tracker health, follow recently updated work, watch merge requests and view a whole group board. No account or key needed. An independent MCP server. Not affiliated with or endorsed by JetBrains or YouTrack.

## Setup Requirements
No setup for public projects. Setting GITLAB_TOKEN raises the rate limit and unlocks private projects, but nothing here requires it.

## Category
Developer Tools

## Features

- Search projects: Find public GitLab projects by name and list their stars, open issue count and description. No API key or account needed.
- List project issues: List issues in a public project filtered by state, labels and free-text search, newest first, with assignees and comment counts.
- Issue details: Fetch one issue by its project-internal number and return the full description, labels, assignees, dates and comment count.
- List merge requests: List the merge requests in a project filtered by state, with the author, branches, last update and comment count, so you can see the work behind an issue.
- Group issue board: List the newest issues across every project in a GitLab group at once, with state, labels, assignees and the project each came from.
- Issue statistics: Summarise a project's issue tracker: open versus closed, close rate, unassigned count, label breakdown, neglected issues and stale open issues.
- Recently updated issues: Show the open issues that changed most recently in a project, so you can see what the team is actually working on.

## Getting Started

- Ask your assistant about youtrack using this server once installed
- Tool: search_projects — Find public GitLab projects by name and list their stars, open issue count and description. No API key or account needed.
- Tool: project_issues — List issues in a public project filtered by state, labels and free-text search, newest first, with assignees and comment counts.
- Tool: issue_detail — Fetch one issue by its project-internal number and return the full description, labels, assignees, dates and comment count.
- Tool: merge_requests — List the merge requests in a project filtered by state, with the author, branches, last update and comment count, so you can see the work behind an issue.
- Tool: group_issues — List the newest issues across every project in a GitLab group at once, with state, labels, assignees and the project each came from.
- Tool: issue_stats — Summarise a project's issue tracker: open versus closed, close rate, unassigned count, label breakdown, neglected issues and stale open issues.
- Tool: recent_issues — Show the open issues that changed most recently in a project, so you can see what the team is actually working on.

## Tags
issues, gitlab, tracker, agile, devops, mcp

## Documentation URL
https://github.com/mrfentmen/awesome-servers/tree/main/servers/youtrack-mcp
