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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `constructor_standings`
* `qualifying_report`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
