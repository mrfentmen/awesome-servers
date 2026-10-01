# kopia-mcp

Query the Kopia backup server UI API: snapshot sources, snapshots, repository status, current user, and task summary. Works with any Kopia server via `KOPIA_BASE_URL` (default http://localhost:51515) with HTTP Basic `KOPIA_USERNAME`/`KOPIA_PASSWORD` (kopia server user).

## Tools

- `list_sources` — Snapshot sources on the Kopia server.
- `list_snapshots` — Snapshots on the Kopia server.
- `get_repo_status` — Repository connection status.
- `get_current_user` — Authenticated Kopia server user.
- `get_tasks_summary` — Background task summary.

## Source

[kopia-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/kopia-mcp)
