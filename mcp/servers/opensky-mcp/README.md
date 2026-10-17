# opensky-mcp

OpenSky live aircraft positions.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `area` — Flights in a bounding box.
- `flightsNear` — Aircraft within a radius.
- `flightsInBox` — Aircraft inside a lat lon box.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


