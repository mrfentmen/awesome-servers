# yr-metno-mcp

Norwegian Meteorological Institute forecasts.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `forecast` — Compact location forecast.
- `nowcast` — Short term nowcast.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


