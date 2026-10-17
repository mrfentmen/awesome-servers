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


