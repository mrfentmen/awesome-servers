# timeapi-mcp

TimeAPI timezone conversion.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `current` — Current time in a zone.
- `convert` — Convert time between zones.
- `timeInZone` — Current time in an IANA zone.
- `listZones` — List common IANA timezones.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


