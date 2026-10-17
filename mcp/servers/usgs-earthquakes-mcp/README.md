# usgs-earthquakes-mcp

USGS earthquake feeds and queries.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `recent` — Recent earthquakes.
- `byPlace` — Earthquakes near a place.
- `latestQuakes` — Latest quakes from the USGS feed.
- `queryQuakes` — Query quakes by magnitude and time.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


