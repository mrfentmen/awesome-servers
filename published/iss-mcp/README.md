# iss-mcp

ISS live position and passes.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `issNow` — Current ISS position and velocity.
- `issPasses` — Upcoming ISS passes over a location.
- `position` — Current ISS position.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

## Licence

Every tool in this package is free: no licence key, no paid tier, no hosted gateway. Everything runs locally.
