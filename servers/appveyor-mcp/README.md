# appveyor-mcp

AppVeyor CI: projects, last builds, history. Needs API token.

## Setup

```bash
export APPVEYOR_API_TOKEN=...
```

## Tools

- `list_projects` — All AppVeyor projects with last build status.
- `get_project` — Latest AppVeyor build for a project with jobs and status.
- `get_history` — Recent AppVeyor builds for a project branch.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
