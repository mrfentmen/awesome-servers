# nominatim-mcp

OpenStreetMap Nominatim geocoding and reverse geocoding (merged).

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `search` — Search places by name.
- `reverse` — Address for coordinates.
- `geocode` — Find coordinates for a place name or address.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


