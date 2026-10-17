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


