# countriesnow-mcp

CountriesNow country, city, flag, and ISO data.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `countries` — List countries with ISO codes.
- `cities` — Cities for a country.
- `flag` — Flag image URL for a country.
- `byName` — Country details by name.
- `byCode` — Country details by code.
- `search` — Search countries by partial name.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


