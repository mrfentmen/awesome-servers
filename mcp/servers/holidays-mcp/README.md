# holidays-mcp

Nager and Open Holidays public holidays.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `publicHolidays` — Holidays for a country and year (Nager).
- `nextHolidays` — Upcoming holidays (Nager).
- `countries` — Supported Open Holidays countries.
- `openHolidays` — Holidays from Open Holidays.
- `holidays` — Public holidays for a country and year.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


