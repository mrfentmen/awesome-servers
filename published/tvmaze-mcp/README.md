# tvmaze-mcp

TVMaze show search and schedules.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `search` — Search TV shows.
- `schedule` — Schedule for a date and country.
- `showEpisodes` — Episodes for a show by TVMaze id.
- `todaySchedule` — Shows airing today.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
