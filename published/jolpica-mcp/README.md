# jolpica-mcp

Formula 1 data (Jolpica, the Ergast replacement).

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `current` — Current F1 season summary.
- `races` — Races in a season.
- `drivers` — Drivers in a season.
- `lastRace` — Results from the most recent race.
- `driverStandings` — Current driver standings.
- `seasonSchedule` — Race schedule for a season.

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
