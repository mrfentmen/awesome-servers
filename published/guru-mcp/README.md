# guru-mcp

Query the Guru REST API: card search (Guru Query Language), collection details, and teams. Basic auth with `GURU_USER` and `GURU_TOKEN` (User token read/write or Collection token read-only).

## Setup

Create a user token (read/write) or a collection token (read-only) in Guru, then:

```bash
export GURU_USER=you@example.com
export GURU_TOKEN=your_token
npm install
npm run build
node dist/index.js
```

Credentials are sent to Guru as Basic auth and stay local.

## Tools

- `list_teams` — Guru teams (also validates credentials).
- `search_cards` — Card search with Guru Query Language.
- `get_collection` — Collection by UUID.

## Source

[guru-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/guru-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
