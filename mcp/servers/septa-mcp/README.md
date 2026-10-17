# septa-mcp

SEPTA transit arrivals and vehicle positions.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `next` — Next arrivals between two stations.
- `stops` — Stops for a route.
- `getNextArrivals` — Next train arrivals between stations.
- `getTransitView` — Live SEPTA vehicle positions.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


