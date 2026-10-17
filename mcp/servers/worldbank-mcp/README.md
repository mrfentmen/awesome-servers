# worldbank-mcp

World Bank indicators, countries, and EIA energy series.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `indicator` — World Bank indicator for a country.
- `countries` — List World Bank countries.
- `worldbankIndicator` — World Bank development indicator.
- `eiaSeries` — EIA energy series (requires free EIA key).

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


