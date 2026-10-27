# space-launches-mcp

Spaceflight launches, next launch, and astronauts.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `upcomingLaunches` — List upcoming rocket launches.
- `nextLaunch` — The next scheduled launch.
- `upcoming` — Upcoming launches (Launch Library).
- `previous` — Previous launches.
- `astronautList` — Astronaut profiles.

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
