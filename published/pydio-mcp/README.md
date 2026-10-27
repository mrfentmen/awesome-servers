# pydio-mcp

Query the Pydio Cells REST API: list visible workspaces and node tree statistics. Works with any Pydio Cells server via `PYDIO_BASE_URL` with a Personal Access Token (`PYDIO_ACCESS_TOKEN`, via `cells admin user token`) as Bearer.

## Setup

Point at your Pydio Cells server and mint a personal access token with `cells admin user token`, then:

```bash
export PYDIO_BASE_URL=https://your-pydio-host
export PYDIO_ACCESS_TOKEN=your_token
npm install
npm run build
node dist/index.js
```

The token goes to your server as a Bearer header and nowhere else.

## Tools

- `list_workspaces` — Workspaces visible to the token user.
- `get_tree_stats` — Node statistics for workspace paths.

## Source

[pydio-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/pydio-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
